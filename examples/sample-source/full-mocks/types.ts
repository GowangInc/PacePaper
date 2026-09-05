import type { PaperManifest } from "../../../src/papers.ts";

/** Teacher-only companion data. Never add these fields to a candidate manifest. */
export interface MockMarkingEntry {
  questionId: string;
  marks: number;
  topic: string;
  answer: string;
  /** Zero-based index into the candidate's choices, when applicable. */
  correctOption?: number;
}

export interface FullMock {
  manifest: PaperManifest;
  marking: MockMarkingEntry[];
  teacherNotes: string[];
  sources: { title: string; url: string }[];
}
