import { createHash } from "node:crypto";
import { COURSE_SAMPLE_PAPERS } from "../examples/sample-source/index.ts";
import { KNOWN_COURSE_SAMPLE_FINGERPRINTS } from "./course-sample-fingerprints.ts";
import { createPaper, db, replaceUnusedPaper } from "./db.ts";
import type { PaperManifest } from "./papers.ts";

interface ExistingPaper {
  id: string;
  subject: string;
  subjectLabel: string;
  level: string;
  paper: string;
  title: string;
  durationMinutes: number;
  mode: string;
  manifestJson: string;
  sessionCount: number;
  assetCount: number;
  receiptKey: string | null;
  receiptHash: string | null;
}

export interface CourseSampleSeedResult {
  created: number;
  renamed: number;
  updated: number;
  unchanged: number;
  conflicts: number;
  protectedBySession: number;
  superseded: number;
}

const EARLIER_VERSION_SUFFIX = " · earlier demo version";

function sampleKey(paper: Pick<PaperManifest, "subject" | "level" | "paper">): string {
  const component = paper.paper.match(/^(Paper|Unit)\s+(\d+[A-Za-z]?)/i);
  // AP offers both a full-clock demonstration and a separate accelerated walkthrough.
  const componentId = component
    ? `${component[1]!.toLowerCase()}-${component[2]!.toLowerCase()}`
    : /walkthrough/i.test(paper.paper) ? "walkthrough" : "exam";
  return [paper.subject, paper.level, componentId].join("|");
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .filter(([, child]) => child !== undefined).map(([key, child]) => [key, canonical(child)]));
  }
  return value;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function metadataMatches(row: ExistingPaper, manifest: PaperManifest): boolean {
  return row.subject === manifest.subject && row.subjectLabel === manifest.subjectLabel
    && row.level === manifest.level && row.paper === manifest.paper
    && row.durationMinutes === manifest.durationMinutes && row.mode === manifest.mode
    && (row.title === manifest.title || row.title === `${manifest.title}${EARLIER_VERSION_SUFFIX}`)
    && row.assetCount === 0;
}

function isUneditedSample(row: ExistingPaper, manifest: PaperManifest, key: string): boolean {
  if (!metadataMatches(row, manifest)) return false;
  // A receipt takes precedence: even an edit that resembles another bundled version is preserved.
  if (row.receiptHash !== null) return row.receiptKey === key && row.receiptHash === fingerprint(manifest);
  if (!/^digitaldp-original-examples-v\d+$/.test(manifest.assessmentSession ?? "")) return false;
  const generatedTitles = [
    `${manifest.subjectLabel} · ${manifest.paper}`,
    `${manifest.subjectLabel} · DigitalDP Example 1`,
    `${manifest.subjectLabel} · DigitalDP Example 2`,
  ];
  if (!generatedTitles.includes(manifest.title)) return false;
  const { title: _title, ...content } = manifest;
  return KNOWN_COURSE_SAMPLE_FINGERPRINTS.get(fingerprint(content)) === key;
}

function recordSeed(paperId: string, key: string, manifest: PaperManifest): void {
  db.query(`INSERT INTO course_sample_seed_receipts (paper_id, sample_key, manifest_hash)
    VALUES ($paperId, $key, $hash)
    ON CONFLICT(paper_id) DO UPDATE SET sample_key = excluded.sample_key, manifest_hash = excluded.manifest_hash`)
    .run({ paperId, key, hash: fingerprint(manifest) });
}

/** Upgrade only recognized, unedited demos; session-linked paper contents are immutable. */
export function seedCourseSamplePapers(manifests: readonly PaperManifest[] = COURSE_SAMPLE_PAPERS): CourseSampleSeedResult {
  const reconcile = db.transaction(() => {
    // Kept with the seeder because importing/using ordinary teacher papers does not need this ledger.
    db.exec(`CREATE TABLE IF NOT EXISTS course_sample_seed_receipts (
      paper_id TEXT PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
      sample_key TEXT NOT NULL,
      manifest_hash TEXT NOT NULL
    )`);
    const existing = new Map<string, { row: ExistingPaper; manifest: PaperManifest }[]>();
    for (const row of db.query<ExistingPaper, []>(`
      SELECT papers.id, papers.subject, papers.subject_label AS subjectLabel, papers.level,
             papers.paper, papers.title, papers.duration_minutes AS durationMinutes, papers.mode,
             papers.manifest_json AS manifestJson,
             (SELECT COUNT(*) FROM exam_sessions WHERE paper_id = papers.id) AS sessionCount,
             (SELECT COUNT(*) FROM paper_assets WHERE paper_id = papers.id) AS assetCount,
             receipt.sample_key AS receiptKey, receipt.manifest_hash AS receiptHash
        FROM papers LEFT JOIN course_sample_seed_receipts AS receipt ON receipt.paper_id = papers.id
    `).all()) {
      let manifest: PaperManifest;
      try { manifest = JSON.parse(row.manifestJson) as PaperManifest; } catch { continue; }
      if (!manifest || typeof manifest.paper !== "string" || typeof manifest.subject !== "string") continue;
      if (!row.receiptKey && !/^digitaldp-original-examples-v\d+$/.test(manifest.assessmentSession ?? "")) continue;
      const key = row.receiptKey ?? sampleKey(manifest);
      existing.set(key, [...(existing.get(key) ?? []), { row, manifest }]);
    }

    const result: CourseSampleSeedResult = {
      created: 0, renamed: 0, updated: 0, unchanged: 0, conflicts: 0, protectedBySession: 0, superseded: 0,
    };
    const keys = manifests.map(sampleKey);
    if (new Set(keys).size !== keys.length) throw new Error("Bundled examples must have unique course, level and component identities");

    for (const manifest of manifests) {
      const key = sampleKey(manifest);
      const nextHash = fingerprint(manifest);
      const matches = existing.get(key) ?? [];
      // An exact current manifest can be adopted on first run, before a receipt exists.
      const exact = matches.find(({ row, manifest: previous }) =>
        metadataMatches(row, previous) && row.title === manifest.title && fingerprint(previous) === nextHash
        && (row.receiptHash === null || isUneditedSample(row, previous, key)));
      const recognized = matches.filter(({ row, manifest: previous }) => isUneditedSample(row, previous, key));
      let currentId = exact?.row.id;
      if (exact) {
        recordSeed(exact.row.id, key, manifest);
        result.unchanged += 1;
      } else {
        const replaceable = recognized.find(({ row }) => row.sessionCount === 0);
        if (replaceable && replaceUnusedPaper(replaceable.row.id, { manifest, assets: [] })) {
          currentId = replaceable.row.id;
          recordSeed(currentId, key, manifest);
          result.updated += 1;
        } else {
          currentId = createPaper({ manifest, assets: [] }).id;
          recordSeed(currentId, key, manifest);
          result.created += 1;
        }
        result.conflicts += matches.length - recognized.length;
      }

      for (const { row, manifest: previous } of recognized) {
        if (row.id === currentId || fingerprint(previous) === nextHash || row.title.endsWith(EARLIER_VERSION_SUFFIX)) continue;
        // Only the library label changes. Historical manifests, assets, sessions and responses stay intact.
        db.query("UPDATE papers SET title = $title WHERE id = $id")
          .run({ id: row.id, title: `${row.title}${EARLIER_VERSION_SUFFIX}` });
        recordSeed(row.id, key, previous);
        result.superseded += 1;
        if (row.sessionCount > 0) result.protectedBySession += 1;
      }
    }
    return result;
  });
  return reconcile.immediate();
}

export function courseSampleSeedSummary(result: CourseSampleSeedResult): string {
  return `SEEDED ${result.created}; renamed ${result.renamed}; updated ${result.updated}; unchanged ${result.unchanged}; conflicts ${result.conflicts}; session-protected ${result.protectedBySession}; superseded ${result.superseded}.`;
}
