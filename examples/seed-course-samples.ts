import { createPaper, db, replaceUnusedPaper } from "../src/db.ts";
import type { PaperManifest } from "../src/papers.ts";
import { COURSE_SAMPLE_PAPERS, SAMPLE_SERIES } from "./sample-source/index.ts";

interface ExistingPaper {
  id: string;
  subject: string;
  level: string;
  title: string;
  manifestJson: string;
}

function sampleKey(paper: { subject: string; level: string }): string {
  return `${paper.subject}\u0000${paper.level}`;
}

function titleIsOnlyChange(previous: PaperManifest, next: PaperManifest): boolean {
  return JSON.stringify({ ...previous, title: next.title }) === JSON.stringify(next);
}

const existing = new Map<string, ExistingPaper[]>();
for (const paper of db.query<ExistingPaper, []>(
  "SELECT id, subject, level, title, manifest_json AS manifestJson FROM papers",
).all()) {
  const manifest = JSON.parse(paper.manifestJson) as Partial<PaperManifest>;
  if (manifest.assessmentSession !== SAMPLE_SERIES) continue;
  const key = sampleKey(paper);
  existing.set(key, [...(existing.get(key) ?? []), paper]);
}

let created = 0;
let updated = 0;
let renamed = 0;
let unchanged = 0;
let conflicts = 0;
let protectedBySession = 0;
for (const manifest of COURSE_SAMPLE_PAPERS) {
  const matches = existing.get(sampleKey(manifest)) ?? [];
  if (matches.length === 0) {
    createPaper({ manifest, assets: [] });
    created += 1;
    continue;
  }
  if (matches.length !== 1) {
    conflicts += 1;
    continue;
  }

  const found = matches[0]!;
  const previous = JSON.parse(found.manifestJson) as PaperManifest;
  const manifestJson = JSON.stringify(manifest);
  if (manifestJson === found.manifestJson && found.title === manifest.title) {
    unchanged += 1;
    continue;
  }
  if (titleIsOnlyChange(previous, manifest)) {
    db.query("UPDATE papers SET title = $title, manifest_json = $manifestJson WHERE id = $id")
      .run({ id: found.id, title: manifest.title, manifestJson });
    renamed += 1;
    continue;
  }
  if (replaceUnusedPaper(found.id, { manifest, assets: [] })) updated += 1;
  else protectedBySession += 1;
}

console.log(`SEEDED ${created}; renamed ${renamed}; updated ${updated}; unchanged ${unchanged}; conflicts ${conflicts}; session-protected ${protectedBySession}.`);
