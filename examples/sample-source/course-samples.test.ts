import { describe, expect, test } from "bun:test";
import { encodePortablePaper, parsePaperUpload } from "../../src/papers.ts";
import { COURSE_SAMPLE_PAPERS, CURRENT_SAMPLE_COURSE_IDS, SAMPLE_SERIES, allocatedMarks } from "./index.ts";

describe("DigitalDP course samples", () => {
  test("provides exactly two original papers for every current course", () => {
    const counts = new Map<string, number>();
    const levels = new Map<string, Set<string>>();
    for (const paper of COURSE_SAMPLE_PAPERS) counts.set(paper.subject, (counts.get(paper.subject) ?? 0) + 1);
    for (const paper of COURSE_SAMPLE_PAPERS) {
      if (!levels.has(paper.subject)) levels.set(paper.subject, new Set());
      levels.get(paper.subject)!.add(paper.level);
    }

    expect(COURSE_SAMPLE_PAPERS).toHaveLength(CURRENT_SAMPLE_COURSE_IDS.length * 2);
    expect([...counts.keys()].sort()).toEqual([...CURRENT_SAMPLE_COURSE_IDS].sort());
    for (const course of CURRENT_SAMPLE_COURSE_IDS) {
      expect(counts.get(course)).toBe(2);
      expect(levels.get(course)).toEqual(new Set(["SL", "HL"]));
    }
  });

  test("keeps every example independently authored, portable and visibly non-official", () => {
    for (const paper of COURSE_SAMPLE_PAPERS) {
      expect(paper.assessmentSession).toBe(SAMPLE_SERIES);
      expect(paper.examProfileId).toBeUndefined();
      expect(paper.sourceClassification).toBe("teacher-authored");
      expect(paper.exportAuthorized).toBe(true);
      expect(paper.title).toBe(`${paper.subjectLabel} · ${paper.paper}`);
      expect(paper.title).toMatch(/· Paper [123]\b/);
      expect(paper.title).not.toMatch(/DigitalDP Example/);
      expect(paper.resources.every((resource) => resource.kind === "text")).toBe(true);
    }
  });

  test("uses integrated response areas instead of a separate answer sheet", () => {
    for (const paper of COURSE_SAMPLE_PAPERS) {
      expect(paper.questions.length).toBeGreaterThan(0);
      expect(paper.questions.every((question) => ["essay", "short", "single-choice", "ink"].includes(question.type))).toBe(true);
      expect(paper.resources.some((resource) => resource.label.toLowerCase().includes("answer sheet"))).toBe(false);
    }
  });

  test("matches each paper maximum to its selectable question marks", () => {
    for (const paper of COURSE_SAMPLE_PAPERS) {
      if (paper.maximumMarks === undefined) throw new Error(`${paper.title} is missing maximumMarks`);
      expect(allocatedMarks(paper)).toBe(paper.maximumMarks);
    }
  });

  test("covers typed, selected-response and digital-ink exam behaviours", () => {
    const types = new Set(COURSE_SAMPLE_PAPERS.flatMap((paper) => paper.questions.map((question) => question.type)));
    expect(types).toEqual(new Set(["essay", "short", "single-choice", "ink"]));
  });

  test("keeps Korean, Japanese and Spanish examples in their response languages", () => {
    const contentFor = (subject: string) => COURSE_SAMPLE_PAPERS
      .filter((paper) => paper.subject === subject)
      .map((paper) => JSON.stringify({ instructions: paper.instructions, resources: paper.resources, questions: paper.questions }));
    for (const subject of ["korean-a-language-literature", "korean-a-literature"]) {
      const papers = contentFor(subject);
      expect(papers).toHaveLength(2);
      for (const content of papers) expect(content).toMatch(/[가-힣]/u);
    }
    for (const subject of ["japanese-a-language-literature", "japanese-a-literature"]) {
      const papers = contentFor(subject);
      expect(papers).toHaveLength(2);
      for (const content of papers) expect(content).toMatch(/[ぁ-んァ-ン一-龯]/u);
    }
    for (const subject of ["spanish-a-language-literature", "spanish-a-literature", "spanish-b"]) {
      const papers = contentFor(subject);
      expect(papers).toHaveLength(2);
      for (const content of papers) expect(content).toMatch(/Elige|Texto|Pregunta|respuesta|hoja/iu);
    }
  });

  test("round-trips every example through the one-file import format", async () => {
    for (const paper of COURSE_SAMPLE_PAPERS) {
      const encoded = await encodePortablePaper(paper, []);
      const form = new FormData();
      form.set("format", "portable");
      form.set("portablePaper", new File([encoded], `${paper.subject}.digitaldp-paper`));
      const restored = await parsePaperUpload(form);
      expect(restored.manifest).toEqual(paper);
      expect(restored.assets).toEqual([]);
    }
  });
});
