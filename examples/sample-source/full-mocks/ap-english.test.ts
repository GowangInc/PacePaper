import { describe, expect, test } from "bun:test";
import { AP_ENGLISH_FULL_MOCK } from "./ap-english.ts";
import { AP_ENGLISH_MCQ } from "./ap-english-mcq.ts";
import { AP_ENGLISH_DRAFT_C, AP_ENGLISH_DRAFT_D, AP_ENGLISH_DRAFT_E, AP_ENGLISH_READING_A, AP_ENGLISH_READING_B, AP_ENGLISH_RHETORIC } from "./ap-english-passages.ts";
import { AP_ENGLISH_SYNTHESIS_SOURCES } from "./ap-english-synthesis.ts";

const words = (value: string) => value.trim().split(/\s+/).length;
const body = (value: string, marker: string) => value.slice(value.indexOf(marker));

describe("AP English full-length original mock", () => {
  test("full workload, timing and optional reading are represented without an extra lock", () => {
    const { manifest } = AP_ENGLISH_FULL_MOCK;
    expect(manifest.questions).toHaveLength(48);
    expect(manifest.questions.filter(q => q.type === "single-choice")).toHaveLength(45);
    expect(manifest.questions.filter(q => q.type === "essay")).toHaveLength(3);
    expect(manifest.maximumMarks).toBe(63);
    expect(manifest.questions.reduce((total, q) => total + (q.marks ?? 0), 0)).toBe(63);
    expect(manifest.durationMinutes).toBe(205);
    expect(manifest.readingTimeMinutes).toBe(0);
    expect(manifest.phases?.map(p => [p.kind, p.durationMinutes])).toEqual([["work", 60], ["break", 10], ["work", 135]]);
    expect(manifest.phases?.[2]?.instructions).toContain("begin writing immediately");
    expect(manifest.phases?.[2]?.instructions).toContain("not extra time");
    expect(manifest.questions.filter(q => q.sectionId === "section-1")).toHaveLength(45);
    expect(manifest.questions.filter(q => q.sectionId === "section-2")).toHaveLength(3);
    for (const essay of manifest.questions.filter(q => q.type === "essay")) {
      expect(essay.marks).toBe(6);
      expect(essay.wordCountMin).toBeUndefined();
      expect(essay.wordCountMax).toBeUndefined();
    }
  });

  test("five sets contain 24 reading and 21 writing items with exactly four viable option slots", () => {
    const counts = new Map<string, number>();
    const positions = [0, 0, 0, 0];
    for (const [index, item] of AP_ENGLISH_MCQ.entries()) {
      counts.set(item.resourceKey, (counts.get(item.resourceKey) ?? 0) + 1);
      expect(item.options).toHaveLength(4);
      expect(new Set(item.options).size).toBe(4);
      expect(Number.isInteger(item.correctOption)).toBe(true);
      expect(item.correctOption).toBeGreaterThanOrEqual(0);
      expect(item.correctOption).toBeLessThan(4);
      positions[item.correctOption]!++;
      const candidate = AP_ENGLISH_FULL_MOCK.manifest.questions[index]!;
      const marking = AP_ENGLISH_FULL_MOCK.marking[index]!;
      expect(candidate.id).toBe(`mcq${index + 1}`);
      expect(candidate.options).toEqual(item.options);
      expect(candidate.resourceKeys).toEqual([item.resourceKey]);
      expect(marking.questionId).toBe(candidate.id);
      expect(marking.correctOption).toBe(item.correctOption);
      expect(marking.answer).toContain(item.options[item.correctOption]!);
      expect(marking.answer).toContain(item.rationale);
    }
    expect(Object.fromEntries(counts)).toEqual({ "reading-a": 12, "reading-b": 12, "draft-c": 7, "draft-d": 7, "draft-e": 7 });
    expect(positions).toEqual([12, 11, 11, 11]);
  });

  test("all eight official skill families receive a meaningful share of items", () => {
    const counts: Record<string, number> = {};
    for (const [index, item] of AP_ENGLISH_MCQ.entries()) {
      const family = item.skill.startsWith("Rhetorical") ? "situation"
        : /^(Claims|Evidence)/.test(item.skill) ? "evidence"
          : item.skill.startsWith("Style") ? "style" : "reasoning";
      const key = `${index < 24 ? "reading" : "writing"}-${family}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    expect(counts).toEqual({
      "reading-situation": 6, "reading-evidence": 6, "reading-style": 6, "reading-reasoning": 6,
      "writing-situation": 5, "writing-evidence": 6, "writing-reasoning": 5, "writing-style": 5,
    });
  });

  test("reviewed revision questions refer accurately to their source drafts", () => {
    const replacement = AP_ENGLISH_MCQ[29]!;
    expect(replacement.resourceKey).toBe("draft-c");
    expect(AP_ENGLISH_DRAFT_C).toContain("replacement policy");
    expect(AP_ENGLISH_DRAFT_C).toContain("lost equipment costs nothing");
    expect(replacement.prompt).toContain("pay to replace lost equipment");
    expect(replacement.options[replacement.correctOption]).toContain("unsupported absolute promise");
    expect(replacement.rationale).toContain("does not promise that every borrower would be exempt");
    const perspective = AP_ENGLISH_MCQ[39]!;
    expect(perspective.resourceKey).toBe("draft-e");
    for (const existing of ["retired supervisor", "nearby shopkeeper", "worker who moved away"]) {
      expect(AP_ENGLISH_DRAFT_E).toContain(existing);
    }
    expect(perspective.prompt).toContain("add another perspective");
    expect(perspective.options[perspective.correctOption]).toContain("worker's child");
  });

  test("readings, drafts and rhetoric are substantial and numbering is complete", () => {
    for (const reading of [AP_ENGLISH_READING_A, AP_ENGLISH_READING_B, AP_ENGLISH_RHETORIC]) {
      expect(words(body(reading, "[1]"))).toBeGreaterThanOrEqual(600);
      expect(words(body(reading, "[1]"))).toBeLessThanOrEqual(800);
      expect([...reading.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1]))).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(reading).toContain("fictional");
    }
    for (const [index, draft] of [AP_ENGLISH_DRAFT_C, AP_ENGLISH_DRAFT_D, AP_ENGLISH_DRAFT_E].entries()) {
      expect(words(body(draft, "(1)"))).toBeGreaterThanOrEqual(350);
      expect(words(body(draft, "(1)"))).toBeLessThanOrEqual(450);
      expect([...draft.matchAll(/\((\d+)\)/g)].map(m => Number(m[1]))).toEqual(Array.from({ length: index === 1 ? 20 : 18 }, (_, i) => i + 1));
    }
  });

  test("six synthesis sources include an actual data table and no missing assets", () => {
    expect(AP_ENGLISH_SYNTHESIS_SOURCES).toHaveLength(6);
    for (const source of AP_ENGLISH_SYNTHESIS_SOURCES) {
      expect(words(source.text)).toBeGreaterThanOrEqual(180);
      expect(words(source.text)).toBeLessThanOrEqual(300);
      expect(source.text).toMatch(/fictional|invented/);
    }
    const table = AP_ENGLISH_SYNTHESIS_SOURCES[2]!.text;
    expect(table).toContain("| Full trail | Phased trail | Retain closed");
    expect(table).toContain("$140000");
    expect(table).toContain("10 km");
    expect(table).toContain("±25%");
    expect(table).toContain("not contractor bids");
    const { manifest } = AP_ENGLISH_FULL_MOCK;
    const resourceKeys = new Set(manifest.resources.map(r => r.key));
    expect(resourceKeys.size).toBe(12);
    for (const question of manifest.questions) {
      for (const key of question.resourceKeys) expect(resourceKeys.has(key)).toBe(true);
    }
    expect(manifest.questions.find(q => q.id === "frq1")!.resourceKeys).toHaveLength(6);
    expect(manifest.questions.find(q => q.id === "frq2")!.resourceKeys).toEqual(["rhetoric-speech"]);
    expect(manifest.questions.find(q => q.id === "frq3")!.resourceKeys).toEqual([]);
    expect(manifest.resources.every(r => r.kind === "text" && !r.file)).toBe(true);
  });

  test("worked keys and essay criteria remain teacher-only, and weighting is explicit", () => {
    const { manifest, marking, teacherNotes } = AP_ENGLISH_FULL_MOCK;
    expect(marking).toHaveLength(48);
    const candidateJson = JSON.stringify(manifest);
    for (const entry of marking) expect(candidateJson).not.toContain(entry.answer);
    for (const question of manifest.questions) expect(Object.hasOwn(question, "correctOption")).toBe(false);
    for (const entry of marking.slice(45)) {
      expect(entry.marks).toBe(6);
      expect(entry.answer).toContain("thesis 0–1, evidence/commentary 0–4, sophistication 0–1");
      expect(entry.answer).toContain("4 for");
    }
    expect(teacherNotes.join(" ")).toContain("45×(MCQ/45) + 55×(essay total/18)");
    expect(teacherNotes.join(" ")).toContain("Neither number yields an official AP 1–5 score");
    expect(45 * (45 / 45) + 55 * (18 / 18)).toBe(100);
    expect(45 * (0 / 45) + 55 * (18 / 18)).toBe(55);
    expect(45 * (45 / 45) + 55 * (0 / 18)).toBe(45);
  });
});
