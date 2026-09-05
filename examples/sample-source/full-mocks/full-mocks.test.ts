import { describe, expect, test } from "bun:test";
import { COURSE_SAMPLE_PAPERS } from "../index.ts";
import { FULL_MOCKS } from "./index.ts";

const coverage = [
  ["cambridge-igcse-mathematics-0580", "Core", "Paper 1", 90, 80, 24],
  ["cambridge-igcse-mathematics-0580", "Extended", "Paper 2", 120, 100, 24],
  ["cambridge-igcse-mathematics-0580", "Core", "Paper 3", 90, 80, 24],
  ["cambridge-igcse-mathematics-0580", "Extended", "Paper 4", 120, 100, 24],
  ["pearson-igcse-mathematics-a", "Foundation", "Paper 1F", 120, 100, 22],
  ["pearson-igcse-mathematics-a", "Higher", "Paper 1H", 120, 100, 22],
  ["pearson-igcse-mathematics-a", "Foundation", "Paper 2F", 120, 100, 22],
  ["pearson-igcse-mathematics-a", "Higher", "Paper 2H", 120, 100, 22],
  ["pearson-igcse-mathematics-a-modular", "Foundation", "Unit 1 (4WM1F/01)", 120, 100, 22],
  ["pearson-igcse-mathematics-a-modular", "Higher", "Unit 1 (4WM1H/01)", 120, 100, 22],
  ["pearson-igcse-mathematics-a-modular", "Foundation", "Unit 2 (4WM2F/01)", 120, 100, 22],
  ["pearson-igcse-mathematics-a-modular", "Higher", "Unit 2 (4WM2H/01)", 120, 100, 22],
  ["ap-english-language-composition", "AP", "End-of-course exam", 205, 63, 48],
  ["ap-biology", "AP", "End-of-course exam", 190, 94, 66],
  ["ap-calculus-ab", "AP", "End-of-course exam", 200, 96, 48],
] as const;

describe("complete non-IB mock integration", () => {
  test("registers one full workload for every supported component and tier", () => {
    expect(FULL_MOCKS).toHaveLength(15);
    const identities = FULL_MOCKS.map(({ manifest }) => `${manifest.subject}|${manifest.level}|${manifest.paper.split(" — ")[0]}`);
    expect(new Set(identities).size).toBe(15);
    expect([...identities].sort()).toEqual(coverage.map(([subject, tier, component]) => `${subject}|${tier}|${component}`).sort());
    for (const [subject, tier, component, minutes, marks, count] of coverage) {
      const full = FULL_MOCKS.find(({ manifest }) => manifest.subject === subject && manifest.level === tier && manifest.paper.startsWith(`${component} —`));
      expect(full, `${subject}/${tier}/${component}`).toBeDefined();
      const manifest = full!.manifest;
      expect(manifest.paper).toContain("original full-length mock");
      expect(manifest.durationMinutes).toBe(minutes);
      expect(manifest.readingTimeMinutes).toBe(0);
      expect(manifest.maximumMarks).toBe(marks);
      expect(manifest.questions).toHaveLength(count);
      expect(manifest.selectionMode).toBe("all");
      expect(manifest.questions.reduce((sum, question) => sum + (question.marks ?? 0), 0)).toBe(marks);
      const registered = COURSE_SAMPLE_PAPERS.filter((paper) => paper.title === manifest.title && paper.level === tier);
      expect(registered).toHaveLength(1);
      expect(registered[0]).toEqual(manifest);
    }
  });

  test("each question has exactly one teacher-only worked marking entry", () => {
    for (const { manifest, marking, teacherNotes, sources } of FULL_MOCKS) {
      const questionIds = manifest.questions.map((question) => question.id);
      expect(new Set(questionIds).size).toBe(questionIds.length);
      expect(marking.map((entry) => entry.questionId).sort()).toEqual([...questionIds].sort());
      expect(marking.reduce((sum, entry) => sum + entry.marks, 0)).toBe(manifest.maximumMarks!);
      expect(teacherNotes.length).toBeGreaterThan(0);
      expect(sources.length).toBeGreaterThan(0);
      const resourceKeys = new Set(manifest.resources.map((resource) => resource.key));
      expect(resourceKeys.size).toBe(manifest.resources.length);
      for (const question of manifest.questions) {
        const entry = marking.find((candidate) => candidate.questionId === question.id)!;
        expect(entry.marks).toBe(question.marks!);
        expect(entry.topic.trim().length).toBeGreaterThan(0);
        expect(entry.answer.trim().length).toBeGreaterThan(0);
        expect(Object.hasOwn(question, "correctOption")).toBe(false);
        expect(Object.hasOwn(question, "answer")).toBe(false);
        for (const key of question.resourceKeys) expect(resourceKeys.has(key)).toBe(true);
        if (question.type === "single-choice") {
          expect(Number.isInteger(entry.correctOption)).toBe(true);
          expect(entry.correctOption!).toBeGreaterThanOrEqual(0);
          expect(entry.correctOption!).toBeLessThan(question.options!.length);
          expect(question.options).toHaveLength(4);
          expect(new Set(question.options!.map((option) => option.trim().toLowerCase())).size).toBe(question.options!.length);
        } else {
          expect(entry.correctOption).toBeUndefined();
        }
      }
      expect(Object.hasOwn(manifest, "marking")).toBe(false);
      expect(Object.hasOwn(manifest, "teacherNotes")).toBe(false);
    }
  });

  test("AP timings include the break exactly once and section counts match May 2027", () => {
    const expected = [
      ["ap-english-language-composition", [60, 10, 135], { "section-1": 45, "section-2": 3 }],
      ["ap-biology", [90, 10, 90], { "section-1": 60, "section-2": 6 }],
      ["ap-calculus-ab", [62, 38, 10, 30, 60], { "section-1a": 29, "section-1b": 13, "section-2a": 2, "section-2b": 4 }],
    ] as const;
    for (const [subject, durations, counts] of expected) {
      const { manifest } = FULL_MOCKS.find((mock) => mock.manifest.subject === subject)!;
      const phases = manifest.phases!;
      expect(phases.map((phase) => phase.durationMinutes)).toEqual([...durations]);
      expect(phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)).toBe(manifest.durationMinutes);
      expect(phases.filter((phase) => phase.kind === "break")).toHaveLength(1);
      expect(phases.filter((phase) => phase.kind === "reading")).toHaveLength(0);
      for (const [sectionId, count] of Object.entries(counts)) {
        expect(manifest.questions.filter((question) => question.sectionId === sectionId)).toHaveLength(count);
        expect(phases.filter((phase) => phase.sectionId === sectionId && phase.kind === "work")).toHaveLength(1);
      }
      expect(manifest.questions.every((question) => question.sectionId && Object.hasOwn(counts, question.sectionId))).toBe(true);
    }
  });
});
