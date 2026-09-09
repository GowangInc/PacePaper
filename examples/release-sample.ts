import type { PaperManifest } from "../src/papers.ts";
import { RELEASE_SAMPLE_PAPER as ENGLISH_B_READING } from "./sample-source/english-b.ts";

// The one paper bundled into a release and seeded on first run. It exists to
// demonstrate how the app works, so its identity is deliberately generic: no
// subject, level, or IB branding. Content and behaviour come from the shared
// English-B reading module so the release stays in sync with the development
// sample set, while the compiled release embeds only that module — not the
// full 52-paper development set.
export const RELEASE_SAMPLE_PAPER: PaperManifest = {
  ...ENGLISH_B_READING,
  title: "Sample paper",
  subjectLabel: "Sample",
  level: "Demo",
  paper: "Paper",
};
export type { PaperManifest };
