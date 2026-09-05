import { describe, expect, test } from "bun:test";
import { PEARSON_FULL_MOCKS } from "./pearson.ts";

describe("original full-length Pearson Mathematics A mocks", () => {
  test("covers all eight components with complete mark and response contracts", () => {
    expect(PEARSON_FULL_MOCKS.map(({ manifest }) => manifest.paper.split(" — ")[0])).toEqual([
      "Paper 1F", "Paper 1H", "Paper 2F", "Paper 2H",
      "Unit 1 (4WM1F/01)", "Unit 1 (4WM1H/01)", "Unit 2 (4WM2F/01)", "Unit 2 (4WM2H/01)",
    ]);
    for (const { manifest, marking } of PEARSON_FULL_MOCKS) {
      expect(manifest.durationMinutes).toBe(120);
      expect(manifest.readingTimeMinutes).toBe(0);
      expect(manifest.maximumMarks).toBe(100);
      expect(manifest.subjectWeightPercent).toBe(50);
      expect(manifest.questions).toHaveLength(22);
      expect(marking).toHaveLength(22);
      expect(manifest.questions.reduce((sum, q) => sum + (q.marks ?? 0), 0)).toBe(100);
      for (const [index, question] of manifest.questions.entries()) {
        const subpartMarks = [...question.prompt.matchAll(/\[(\d+)\]/g)].reduce((sum, match) => sum + Number(match[1]), 0);
        expect(subpartMarks).toBe(question.marks!);
        expect(question.id).toBe(`q${index + 1}`);
        expect(question.type).toBe("ink");
        expect(question.ink?.allowTypedAlternative).toBe(true);
        expect(marking[index]!.questionId).toBe(question.id);
        expect(marking[index]!.marks).toBe(question.marks!);
        expect(marking[index]!.answer).toMatch(/[MAB][12]/);
      }
    }
  });

  test("tier pairs share precisely forty marks, not entire renamed mocks", () => {
    for (let index = 0; index < PEARSON_FULL_MOCKS.length; index += 2) {
      const foundation = PEARSON_FULL_MOCKS[index]!.manifest;
      const higher = PEARSON_FULL_MOCKS[index + 1]!.manifest;
      const shared = higher.questions.filter((question) => foundation.questions.some((other) => other.prompt === question.prompt));
      expect(shared).toHaveLength(8);
      expect(shared.reduce((sum, q) => sum + q.marks!, 0)).toBe(40);
    }
    expect(new Set(PEARSON_FULL_MOCKS.flatMap(({ manifest }) => manifest.questions.map((q) => q.prompt))).size).toBe(144);
  });

  test("formula references are self-contained and teacher answers stay separate", () => {
    for (const { manifest, marking } of PEARSON_FULL_MOCKS) {
      expect(manifest.resources).toHaveLength(1);
      expect(manifest.resources[0]!.kind).toBe("text");
      expect(manifest.resources[0]!.file).toBeUndefined();
      expect(manifest.resources[0]!.text).toContain("πr²h");
      expect(manifest.resources[0]!.text?.includes("Quadratic equation")).toBe(manifest.level === "Higher");
      const candidate = JSON.stringify(manifest);
      expect(candidate).not.toContain('"marking"');
      expect(candidate).not.toContain('"correctOption"');
      for (const q of manifest.questions) expect(q.resourceKeys).toEqual(["formulae"]);
      for (const entry of marking) expect(candidate).not.toContain(entry.answer);
    }
  });

  test("Unit 1 does not import characteristic Unit 2-only content", () => {
    const unitOne = PEARSON_FULL_MOCKS.filter(({ manifest }) => manifest.paper.startsWith("Unit 1"));
    for (const { manifest } of unitOne) {
      const prompts = manifest.questions.map((q) => q.prompt).join("\n");
      expect(prompts).not.toMatch(/stationary|differentiat|arithmetic sequence|cumulative|mean|median|quartile|simultaneous|enlarge|reflect|vector|depreciat|compound interest|highest common factor|least common multiple/i);
    }
  });

  test("checked non-exact answers agree with independent arithmetic", () => {
    const degree = Math.PI / 180;
    const checks: [string, string, number, string, number][] = [
      ["Paper 1H", "Non-right triangle", Math.sqrt(225 - 216 * Math.cos(58 * degree)), "10.5", 0.05],
      ["Paper 1H", "Non-right triangle", 54 * Math.sin(58 * degree), "45.8", 0.05],
      ["Paper 1H", "Repeated percentage and proof", Math.round(18000 * 0.88 ** 3), "12266", 0],
      ["Paper 1H", "Bounds", 18.55 * 60 / 24.5, "45.42857", 0.00001],
      ["Paper 1H", "Bounds", 18.65 * 60 / 23.5, "47.61702", 0.00001],
      ["Paper 1F", "Ramp geometry", Math.atan(0.9 / 4.8) / degree, "10.6", 0.05],
      ["Paper 2H", "Exponential threshold", Math.round(800 * 1.06 ** 4), "1010", 0],
      ["Paper 2H", "Exponential threshold", 800 * 1.06 ** 6, "1134.82", 0.01],
      ["Paper 2H", "Exponential threshold", 800 * 1.06 ** 7, "1202.90", 0.01],
      ["Paper 2H", "Arithmetic series model", 18 / 2 * (48 + 17 * 3), "891", 0],
      ["Paper 2H", "Arithmetic series model", 17 / 2 * (48 + 16 * 3), "816", 0],
      ["Paper 2H", "Three-dimensional angle", Math.atan(9 / 10) / degree, "42.0", 0.05],
      ["Paper 2F", "Semicircular window", 1.2 * 1.5 + Math.PI * 0.6 ** 2 / 2, "2.37", 0.005],
      ["Paper 2F", "Semicircular window", 1.2 + 3 + Math.PI * 0.6, "6.08", 0.005],
      ["Unit 1 (4WM1H/01)", "Quadratic formula", (-3 + Math.sqrt(65)) / 4, "1.266", 0.0005],
      ["Unit 1 (4WM1H/01)", "Quadratic formula", (-3 - Math.sqrt(65)) / 4, "−2.766", 0.0005],
      ["Unit 1 (4WM1H/01)", "Triangle land plot", Math.sqrt(24 ** 2 + 31 ** 2 - 1488 * Math.cos(67 * degree)), "30.9", 0.05],
      ["Unit 1 (4WM1H/01)", "Triangle land plot", 372 * Math.sin(67 * degree), "342", 0.5],
      ["Unit 1 (4WM1F/01)", "Ladder", Math.acos(1.5 / 5.2) / degree, "73.2", 0.05],
      ["Unit 2 (4WM2H/01)", "Arithmetic series", 25 / 2 * (10 + 24 * 4), "1325", 0],
      ["Unit 2 (4WM2H/01)", "Cumulative frequency", 20 + (30 - 26) / 24 * 10, "21.67", 0.005],
    ];
    for (const [paper, topic, calculated, published, tolerance] of checks) {
      const mock = PEARSON_FULL_MOCKS.find(({ manifest }) => manifest.paper.startsWith(`${paper} —`))!;
      const answer = mock.marking.find((entry) => entry.topic === topic)!.answer;
      expect(answer).toContain(published);
      expect(Math.abs(calculated - Number(published.replace("−", "-")))).toBeLessThanOrEqual(tolerance);
    }
  });

  test("solved coordinates, stationary points and probability models are consistent", () => {
    for (const [x, y] of [[1, -2], [5, 6]]) {
      expect(y).toBe(x! ** 2 - 4 * x! + 1);
      expect(y).toBe(2 * x! - 4);
    }
    for (const [x, y] of [[-4, -3], [3, 4]]) {
      expect(x! ** 2 + y! ** 2).toBe(25);
      expect(y).toBe(x! + 1);
    }
    for (const [x, y] of [[-1, 9], [3, -23]]) {
      expect(3 * x! ** 2 - 6 * x! - 9).toBe(0);
      expect(x! ** 3 - 3 * x! ** 2 - 9 * x! + 4).toBe(y!);
    }
    expect((0.4 * 0.05) / (0.6 * 0.02 + 0.4 * 0.05)).toBeCloseTo(0.625);
    expect((5 / 8) * (3 / 7) + (3 / 8) * (5 / 7)).toBeCloseTo(15 / 28);
  });
});
