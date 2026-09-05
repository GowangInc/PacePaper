import { describe, expect, test } from "bun:test";
import { encodePortablePaper, parsePaperUpload } from "../../src/papers.ts";
import { COURSE_SAMPLE_PAPERS, CURRENT_SAMPLE_COURSE_IDS, SAMPLE_SERIES, allocatedMarks } from "./index.ts";

describe("DigitalDP course samples", () => {
  test("covers every current course and both tiers of all mathematics components", () => {
    const counts = new Map<string, number>();
    const levels = new Map<string, Set<string>>();
    for (const paper of COURSE_SAMPLE_PAPERS) counts.set(paper.subject, (counts.get(paper.subject) ?? 0) + 1);
    for (const paper of COURSE_SAMPLE_PAPERS) {
      if (!levels.has(paper.subject)) levels.set(paper.subject, new Set());
      levels.get(paper.subject)!.add(paper.level);
    }

    expect(CURRENT_SAMPLE_COURSE_IDS).toHaveLength(23);
    expect(COURSE_SAMPLE_PAPERS).toHaveLength(52);
    expect([...counts.keys()].sort()).toEqual([...CURRENT_SAMPLE_COURSE_IDS].sort());
    for (const course of CURRENT_SAMPLE_COURSE_IDS) {
      const mathematics = course.startsWith("cambridge-") || course.startsWith("pearson-");
      expect(counts.get(course)).toBe(mathematics ? 4 : 2);
      const expected = course.startsWith("cambridge-") ? new Set(["Core", "Extended"])
        : course.startsWith("pearson-") ? new Set(["Foundation", "Higher"])
          : course.startsWith("ap-") ? new Set(["AP"])
            : new Set(["SL", "HL"]);
      expect(levels.get(course)).toEqual(expected);
    }
  });

  test("keeps every example independently authored, portable and visibly non-official", () => {
    for (const paper of COURSE_SAMPLE_PAPERS) {
      expect(paper.assessmentSession).toBe(SAMPLE_SERIES);
      expect(paper.examProfileId).toBeUndefined();
      expect(paper.sourceClassification).toBe("teacher-authored");
      expect(paper.exportAuthorized).toBe(true);
      expect(paper.title).toBe(`${paper.subjectLabel} · ${paper.paper}`);
      expect(paper.title).toContain("original");
      if (paper.examFormat?.systemId && paper.examFormat.systemId !== "ib-dp") expect(paper.title).toMatch(/full-length mock|walkthrough/);
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

  test("includes a complete AP mock and a separate accelerated workflow rehearsal", () => {
    for (const subject of ["ap-english-language-composition", "ap-biology", "ap-calculus-ab"]) {
      const papers = COURSE_SAMPLE_PAPERS.filter((paper) => paper.subject === subject);
      expect(papers).toHaveLength(2);
      expect(papers.some((paper) => paper.paper.includes("full-length mock"))).toBeTrue();
      expect(papers.some((paper) => paper.paper.includes("walkthrough"))).toBeTrue();
      for (const paper of papers) {
        expect(paper.phases?.some(({ kind }) => kind === "break")).toBeTrue();
        expect(paper.questions.every(({ sectionId }) => Boolean(sectionId))).toBeTrue();
      }
    }
    const calculus = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "ap-calculus-ab" && paper.paper.includes("full-length mock"));
    expect(calculus?.phases?.map(({ tools }) => tools.join(" ")).join(" ")).toMatch(/Calculator not permitted/);
    expect(calculus?.phases?.map(({ tools }) => tools.join(" ")).join(" ")).toMatch(/graphing calculator required/);
  });

  test("models current AP response structures and keeps English reading time optional", () => {
    const english = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "ap-english-language-composition" && paper.paper.includes("full-length mock"));
    expect(english?.phases?.map(({ id, durationMinutes }) => ({ id, durationMinutes }))).toEqual([
      { id: "section-1", durationMinutes: 60 },
      { id: "break", durationMinutes: 10 },
      { id: "section-2", durationMinutes: 135 },
    ]);
    const synthesis = english?.questions.find(({ id }) => id === "frq1");
    expect(synthesis?.resourceKeys).toHaveLength(6);
    expect(synthesis?.resourceKeys.every((key) => english?.resources.some((resource) => resource.key === key && Boolean(resource.text)))).toBeTrue();
    expect(english?.questions.filter(({ type }) => type === "single-choice")).toHaveLength(45);
    expect(english?.questions.filter(({ sectionId }) => sectionId === "section-2").map(({ marks }) => marks)).toEqual([6, 6, 6]);

    const biology = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "ap-biology" && paper.paper.includes("full-length mock"));
    expect(biology?.questions.filter(({ type }) => type === "single-choice")).toHaveLength(60);
    expect(biology?.questions.filter(({ sectionId }) => sectionId === "section-2").map(({ marks }) => marks)).toEqual([9, 9, 4, 4, 4, 4]);

    const calculus = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "ap-calculus-ab" && paper.paper.includes("full-length mock"));
    expect(calculus?.questions.filter(({ sectionId }) => sectionId === "section-1a")).toHaveLength(29);
    expect(calculus?.questions.filter(({ sectionId }) => sectionId === "section-1b")).toHaveLength(13);
    expect(calculus?.questions.filter(({ sectionId }) => sectionId === "section-2a")).toHaveLength(2);
    expect(calculus?.questions.filter(({ sectionId }) => sectionId === "section-2b")).toHaveLength(4);
    expect(calculus?.questions.filter(({ sectionId }) => sectionId?.startsWith("section-2")).every(({ marks }) => marks === 9)).toBeTrue();
  });

  test("replaces full-clock compact samples while keeping honestly labelled short walkthroughs", () => {
    const international = COURSE_SAMPLE_PAPERS.filter(({ examFormat }) => examFormat?.systemId && examFormat.systemId !== "ib-dp");
    expect(international).toHaveLength(18);
    const full = international.filter(({ paper }) => paper.includes("full-length mock"));
    const walkthroughs = international.filter(({ paper }) => paper.includes("walkthrough"));
    expect(full).toHaveLength(15);
    expect(walkthroughs).toHaveLength(3);
    expect(international.some(({ paper }) => /compact|full-timing/.test(paper))).toBeFalse();
    for (const paper of full) {
      expect(paper.instructions).not.toContain("not a full mock examination");
      expect(paper.readingTimeMinutes).toBe(0);
      expect(paper.questions.length).toBeGreaterThanOrEqual(22);
      expect(paper.examFormat?.fidelity).toBe("adapted");
    }
    for (const paper of walkthroughs) {
      expect(paper.instructions).toContain("not a full mock examination");
      expect(paper.examFormat?.systemId).toBe("ap");
      const choices = paper.questions.filter(({ type }) => type === "single-choice");
      expect(paper.instructions).toContain(`${choices.length} multiple-choice questions`);
      expect(paper.examFormat?.rulesSummary).toContain("May 2027");
      expect(paper.instructions).toContain(`${paper.durationMinutes}-minute classroom walkthrough`);
    }
    for (const biology of international.filter(({ subject }) => subject === "ap-biology")) {
      expect(biology.instructions).toMatch(/scientific nongraphing calculator/);
      expect(biology.instructions).toMatch(/storage capabilities are not (?:allowed|permitted)/);
    }
  });

  test("models English B reading as three substantial texts and a 40-mark question booklet", () => {
    const reading = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "english-b" && paper.mode === "reading");
    expect(reading).toBeDefined();
    expect(reading?.durationMinutes).toBe(60);
    expect(reading?.readingTimeMinutes).toBe(5);
    expect(reading?.maximumMarks).toBe(40);
    expect(reading?.resources).toHaveLength(3);
    expect(reading?.resources.every(({ text }) => (text?.split(/\s+/u).length ?? 0) >= 300)).toBeTrue();
    expect(new Set(reading?.questions.flatMap(({ resourceKeys }) => resourceKeys))).toEqual(new Set(["text-1", "text-2", "text-3"]));
    expect(reading?.questions.some(({ type }) => type === "single-choice")).toBeTrue();
    expect(reading?.questions.some(({ type }) => type === "short")).toBeTrue();
  });

  test("keeps every core IB full-format practice aligned with its verified timing and marks", () => {
    const expected = [
      ["english-a-language-literature", "SL", 75, 20],
      ["english-a-language-literature", "HL", 105, 30],
      ["english-a-literature", "SL", 75, 20],
      ["english-a-literature", "HL", 105, 30],
      ["english-b", "SL", 75, 30],
      ["english-b", "HL", 60, 40],
      ["mathematics-analysis-approaches", "SL", 90, 80],
      ["mathematics-analysis-approaches", "HL", 120, 110],
      ["mathematics-applications-interpretation", "SL", 90, 80],
      ["mathematics-applications-interpretation", "HL", 120, 110],
      ["biology", "SL", 90, 55],
      ["biology", "HL", 150, 80],
      ["chemistry", "SL", 90, 55],
      ["chemistry", "HL", 150, 90],
      ["physics", "SL", 90, 45],
      ["physics", "HL", 150, 90],
      ["psychology", "SL", 120, 49],
      ["psychology", "HL", 60, 24],
      ["business-management", "SL", 90, 40],
      ["business-management", "HL", 75, 25],
    ] as const;

    for (const [subject, level, durationMinutes, maximumMarks] of expected) {
      const paper = COURSE_SAMPLE_PAPERS.find((candidate) => candidate.subject === subject && candidate.level === level);
      expect(paper, `${subject} ${level}`).toBeDefined();
      expect(paper?.paper).toContain("full-format practice");
      expect(paper?.durationMinutes).toBe(durationMinutes);
      expect(paper?.readingTimeMinutes).toBe(5);
      expect(paper?.maximumMarks).toBe(maximumMarks);
      expect(allocatedMarks(paper!)).toBe(maximumMarks);
    }
  });

  test("models the complete selected-response count and data section for each science SL Paper 1", () => {
    const expected = [
      ["biology", 30, 4],
      ["chemistry", 30, 4],
      ["physics", 25, 4],
    ] as const;
    for (const [subject, choiceCount, dataCount] of expected) {
      const paper = COURSE_SAMPLE_PAPERS.find((candidate) => candidate.subject === subject && candidate.level === "SL");
      expect(paper?.questions.filter(({ type }) => type === "single-choice")).toHaveLength(choiceCount);
      expect(paper?.questions.filter(({ label }) => label.includes("Data question"))).toHaveLength(dataCount);
    }
  });

  test("uses exam-scale original source material for the English and research-based full-format papers", () => {
    const words = (value = "") => value.trim().split(/\s+/u).filter(Boolean).length;
    const languageAndLiterature = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "english-a-language-literature" && paper.level === "SL");
    expect(languageAndLiterature?.resources.every(({ text }) => words(text) >= 500)).toBeTrue();

    const literature = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "english-a-literature" && paper.level === "SL");
    expect(words(literature?.resources[0]?.text)).toBeGreaterThanOrEqual(700);
    expect(literature?.resources[1]?.text?.split("\n").filter(Boolean).length).toBeGreaterThanOrEqual(40);

    const psychology = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "psychology" && paper.level === "HL");
    expect(words(psychology?.resources[0]?.text)).toBeGreaterThanOrEqual(250);
    expect(psychology?.questions.map(({ marks }) => marks)).toEqual([9, 6, 9]);

    for (const level of ["SL", "HL"]) {
      const business = COURSE_SAMPLE_PAPERS.find((paper) => paper.subject === "business-management" && paper.level === level);
      expect(words(business?.resources[0]?.text)).toBeGreaterThanOrEqual(170);
    }
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
