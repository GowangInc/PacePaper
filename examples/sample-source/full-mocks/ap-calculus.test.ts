import { describe, expect, test } from "bun:test";
import { AP_BIOLOGY_FULL_MOCK } from "./ap-biology.ts";
import { BIOLOGY_CHOICES } from "./ap-biology-mcq.ts";
import { AP_CALCULUS_FULL_MOCK } from "./ap-calculus.ts";
import { CALCULUS_CHOICES } from "./ap-calculus-mcq.ts";

function integral(f: (x: number) => number, a: number, b: number, n = 20_000): number {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return sum * h / 3;
}

function zero(f: (x: number) => number, a: number, b: number): number {
  for (let i = 0; i < 70; i++) {
    const middle = (a + b) / 2;
    if (f(a) * f(middle) <= 0) b = middle;
    else a = middle;
  }
  return (a + b) / 2;
}

function selectedNumber(index: number): number {
  const item = CALCULUS_CHOICES[index - 1]!;
  return Number(item.options[item.correctOption]!.replace("−", "-"));
}

describe("complete AP STEM mock blueprints", () => {
  test("retains the current full workload, timings and correct raw-point totals", () => {
    for (const [mock, counts, minutes, raw] of [
      [AP_BIOLOGY_FULL_MOCK, [60, 6], [90, 10, 90], 94],
      [AP_CALCULUS_FULL_MOCK, [29, 13, 2, 4], [62, 38, 10, 30, 60], 96],
    ] as const) {
      const { manifest, marking } = mock;
      expect(manifest.phases!.map(phase => phase.durationMinutes)).toEqual([...minutes]);
      expect(manifest.phases!.filter(phase => phase.kind === "work").map(phase => manifest.questions.filter(question => question.sectionId === phase.sectionId).length)).toEqual([...counts]);
      expect(manifest.questions.reduce((sum, question) => sum + question.marks!, 0)).toBe(raw);
      expect(manifest.maximumMarks).toBe(raw);
      expect(marking.reduce((sum, item) => sum + item.marks, 0)).toBe(raw);
      expect(marking.map(item => item.questionId)).toEqual(manifest.questions.map(question => question.id));
      expect(manifest.readingTimeMinutes).toBe(0);
      expect(manifest.questions.filter(question => question.type === "ink").map(question => question.marks)).toEqual(mock === AP_BIOLOGY_FULL_MOCK ? [9, 9, 4, 4, 4, 4] : [9, 9, 9, 9, 9, 9]);
    }
  });

  test("all choices have one mapped answer and student data never contains marking companions", () => {
    for (const mock of [AP_BIOLOGY_FULL_MOCK, AP_CALCULUS_FULL_MOCK]) {
      for (const entry of mock.marking.filter(item => item.correctOption !== undefined)) {
        const question = mock.manifest.questions.find(item => item.id === entry.questionId)!;
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options).size).toBe(4);
        expect(entry.correctOption).toBeGreaterThanOrEqual(0);
        expect(entry.correctOption).toBeLessThan(4);
        expect(entry.answer.startsWith(`${"ABCD"[entry.correctOption!]}.`)).toBe(true);
      }
      expect(JSON.stringify(mock.manifest)).not.toContain('"correctOption"');
      expect(JSON.stringify(mock.manifest)).not.toContain('"marking"');
      expect(mock.manifest.resources.length).toBeLessThanOrEqual(30);
      expect(mock.manifest.resources.every(resource => resource.kind === "text" && !!resource.text)).toBe(true);
    }
  });

  test("covers all eight units within each current CED multiple-choice weighting band", () => {
    for (const [items, bands] of [
      [BIOLOGY_CHOICES, [[8, 11], [10, 13], [12, 16], [10, 15], [8, 11], [12, 16], [13, 20], [10, 15]]],
      [CALCULUS_CHOICES, [[10, 15], [10, 15], [5, 10], [10, 15], [15, 20], [15, 20], [5, 10], [10, 15]]],
    ] as const) {
      bands.forEach(([min, max], index) => {
        const fraction = 100 * items.filter(item => item.topic.startsWith(`Unit ${index + 1} ·`)).length / items.length;
        expect(fraction).toBeGreaterThanOrEqual(min);
        expect(fraction).toBeLessThanOrEqual(max);
      });
    }
  });

  test("numerically re-solves calculator MCQ instead of trusting answer letters", () => {
    const x = 0.8, y = (-x + Math.sqrt(28 - 3 * x * x)) / 2;
    const derivative = (f: (x: number) => number, x: number) => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
    const a = zero(x => Math.sin(x) - 0.4 * x, 1, 3);
    for (const [question, value] of [
      [30, derivative(Math.exp, 1.3)],
      [31, derivative(x => x * Math.sin(x * x), 1.2)],
      [32, -(2 * x + y) / (x + 2 * y)],
      [33, 20 / (9 * Math.PI)],
      [34, derivative(t => 20 + 65 * Math.exp(-0.12 * t), 5)],
      [35, 2 * Math.PI / 3 + Math.sqrt(3)],
      [37, integral(x => Math.exp(-x * x), 0, 2)],
      [39, Math.log(30 / 12) / 0.35],
      [40, integral(x => Math.sin(x) - 0.4 * x, 0, a)],
      [41, Math.PI * integral(x => Math.log(x) ** 2, 1, 3)],
      [42, integral(t => Math.abs(Math.sin(t * t)), 0, 3)],
    ]) {
      expect(Math.abs(selectedNumber(question!) - value!)).toBeLessThanOrEqual(0.000501);
    }
    const q38 = CALCULUS_CHOICES[37]!;
    expect(q38.options[q38.correctOption]).toBe("22.3 L");
  });

  test("independently checks free-response calculations and Biology data arithmetic", () => {
    const net = (t: number) => 4 + 4 * Math.sin(t / 3) - 0.4 * t;
    const time = zero(net, 5, 12);
    expect(time).toBeCloseTo(9.557554850, 7);
    expect(80 + integral(net, 0, time)).toBeCloseTo(123.949097241, 6);
    expect(80 + integral(net, 0, 12)).toBeCloseTo(119.043723450, 6);
    const f = (x: number) => 1 + Math.exp(-x / 2), g = (x: number) => 0.4 * x + 0.2;
    const a = zero(x => f(x) - g(x), 1, 5);
    expect(integral(x => f(x) - g(x), 0, a)).toBeCloseTo(2.183925691, 7);
    expect(Math.PI * integral(x => (f(x) + 1) ** 2 - (g(x) + 1) ** 2, 0, a)).toBeCloseTo(28.977280539, 7);
    expect(integral(x => (12 - 3 * x * x) ** 2, -2, 2)).toBeCloseTo(1536 / 5, 7);
    expect((9.2 - 3.2) / 3.2 * 100).toBeCloseTo(187.5, 10);
    expect((32 - 50) ** 2 / 50 + (68 - 50) ** 2 / 50).toBe(12.96);
    expect(0.2 + (5 / 8) * 0.2).toBeCloseTo(0.325, 10);
    expect(2 * (1 - Math.sqrt(0.09)) * Math.sqrt(0.09)).toBeCloseTo(0.42, 10);
  });

  test("Biology GOF uses sampled composition, not fixed-cohort survival rates, and binding is direct", () => {
    const { manifest, marking } = AP_BIOLOGY_FULL_MOCK;
    const resource = manifest.resources.find(item => item.key === "bio-frq-selection")!;
    const question = manifest.questions.find(item => item.id === "bio-frq-6")!;
    const key = marking.find(item => item.questionId === question.id)!;
    expect(resource.text).toContain("simple random sample of 100 survivors");
    expect(resource.text).toContain("negligible fraction");
    expect(resource.text).toContain("expected sample counts of 50 light and 50 dark");
    expect(resource.text).not.toContain("introduces 100 light and 100 dark");
    expect(question.prompt).toContain("color composition of the sampled survivors");
    expect(question.marks).toBe(4);
    expect(key.marks).toBe(4);
    expect(key.answer).toContain("survival rates cannot be calculated");
    expect(key.answer).toContain("12.96");
    const binding = BIOLOGY_CHOICES[38]!;
    expect(binding.options[binding.correctOption]).toContain("purified receptor and isolated regulatory DNA");
    expect(binding.answer).toContain("indirect association");
  });
});
