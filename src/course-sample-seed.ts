import { COURSE_SAMPLE_PAPERS, SAMPLE_SERIES } from "../examples/sample-source/index.ts";
import { createPaper, db, replaceUnusedPaper } from "./db.ts";
import type { PaperManifest } from "./papers.ts";

interface ExistingPaper {
  id: string;
  subject: string;
  level: string;
  title: string;
  manifestJson: string;
}

export interface CourseSampleSeedResult {
  created: number;
  renamed: number;
  updated: number;
  unchanged: number;
  conflicts: number;
  protectedBySession: number;
}

function sampleKey(paper: { subject: string; level: string }): string {
  return `${paper.subject}\u0000${paper.level}`;
}

function titleIsOnlyChange(previous: PaperManifest, next: PaperManifest): boolean {
  return JSON.stringify({ ...previous, title: next.title }) === JSON.stringify(next);
}

export function seedCourseSamplePapers(): CourseSampleSeedResult {
  const existing = new Map<string, ExistingPaper[]>();
  for (const paper of db.query<ExistingPaper, []>(
    "SELECT id, subject, level, title, manifest_json AS manifestJson FROM papers",
  ).all()) {
    const manifest = JSON.parse(paper.manifestJson) as Partial<PaperManifest>;
    if (manifest.assessmentSession !== SAMPLE_SERIES) continue;
    const key = sampleKey(paper);
    existing.set(key, [...(existing.get(key) ?? []), paper]);
  }

  const result: CourseSampleSeedResult = {
    created: 0,
    renamed: 0,
    updated: 0,
    unchanged: 0,
    conflicts: 0,
    protectedBySession: 0,
  };
  for (const manifest of COURSE_SAMPLE_PAPERS) {
    const matches = existing.get(sampleKey(manifest)) ?? [];
    if (matches.length === 0) {
      createPaper({ manifest, assets: [] });
      result.created += 1;
      continue;
    }
    if (matches.length !== 1) {
      result.conflicts += 1;
      continue;
    }

    const found = matches[0] as ExistingPaper;
    const previous = JSON.parse(found.manifestJson) as PaperManifest;
    const manifestJson = JSON.stringify(manifest);
    if (manifestJson === found.manifestJson && found.title === manifest.title) {
      result.unchanged += 1;
    } else if (titleIsOnlyChange(previous, manifest)) {
      db.query("UPDATE papers SET title = $title, manifest_json = $manifestJson WHERE id = $id")
        .run({ id: found.id, title: manifest.title, manifestJson });
      result.renamed += 1;
    } else if (replaceUnusedPaper(found.id, { manifest, assets: [] })) {
      result.updated += 1;
    } else {
      result.protectedBySession += 1;
    }
  }
  return result;
}

export function courseSampleSeedSummary(result: CourseSampleSeedResult): string {
  return `SEEDED ${result.created}; renamed ${result.renamed}; updated ${result.updated}; unchanged ${result.unchanged}; conflicts ${result.conflicts}; session-protected ${result.protectedBySession}.`;
}
