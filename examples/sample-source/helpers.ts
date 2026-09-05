import { parseManifest, type PaperManifest, type PaperQuestion, type PaperResource } from "../../src/papers.ts";

export const SAMPLE_SERIES = "digitaldp-original-examples-v2";

type SampleInput = Omit<
  PaperManifest,
  "version" | "assessmentSession" | "sourceClassification" | "exportAuthorized" | "title"
>;

export function samplePaper(input: SampleInput): PaperManifest {
  return parseManifest({
    ...input,
    version: 1,
    assessmentSession: SAMPLE_SERIES,
    sourceClassification: "teacher-authored",
    exportAuthorized: true,
    title: `${input.subjectLabel} · ${input.paper}`,
  });
}

export function textResource(key: string, label: string, text: string): PaperResource {
  return { key, label, kind: "text", text };
}

export function shortQuestion(
  id: string,
  label: string,
  prompt: string,
  marks: number,
  resourceKeys: string[] = [],
): PaperQuestion {
  return { id, label, prompt, marks, type: "short", resourceKeys };
}

export function choiceQuestion(
  id: string,
  label: string,
  prompt: string,
  options: string[],
  marks: number,
  resourceKeys: string[] = [],
): PaperQuestion {
  return { id, label, prompt, options, marks, type: "single-choice", resourceKeys };
}

export function essayQuestion(
  id: string,
  label: string,
  prompt: string,
  marks: number,
  resourceKeys: string[] = [],
  wordRange?: { min: number; max: number },
): PaperQuestion {
  return {
    id,
    label,
    prompt,
    marks,
    type: "essay",
    resourceKeys,
    ...(wordRange ? { wordCountMin: wordRange.min, wordCountMax: wordRange.max } : {}),
  };
}

export function inkQuestion(
  id: string,
  label: string,
  prompt: string,
  marks: number,
  resourceKeys: string[] = [],
  pages = 1,
  background: "blank" | "lined" | "square-grid" = "square-grid",
): PaperQuestion {
  return {
    id,
    label,
    prompt,
    marks,
    type: "ink",
    resourceKeys,
    ink: { pages, background, allowTypedAlternative: true },
  };
}

export function allocatedMarks(manifest: PaperManifest): number {
  const marks = manifest.questions.map((question) => question.marks ?? 0);
  return manifest.selectionMode === "one" ? Math.max(...marks) : marks.reduce((sum, value) => sum + value, 0);
}
