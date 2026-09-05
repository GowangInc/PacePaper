import { describe, expect, test } from "bun:test";
import { CAMBRIDGE_FULL_MOCKS } from "./cambridge.ts";

const mock = (paper: number) => CAMBRIDGE_FULL_MOCKS[paper - 1]!;
const answer = (paper: number, question: number) => mock(paper).marking[question - 1]!.answer;
const radians = Math.PI / 180;

describe("Cambridge full-length original mocks", () => {
  test("every component has complete marks, self-contained resources and an isolated worked key", () => {
    for (let paper = 1; paper <= 4; paper++) {
      const { manifest, marking } = mock(paper);
      const core = paper === 1 || paper === 3;
      expect(manifest.level).toBe(core ? "Core" : "Extended");
      expect(manifest.durationMinutes).toBe(core ? 90 : 120);
      expect(manifest.maximumMarks).toBe(core ? 80 : 100);
      expect(manifest.readingTimeMinutes).toBe(0);
      expect(manifest.questions).toHaveLength(24);
      expect(marking).toHaveLength(24);
      expect(manifest.questions.reduce((sum, q) => sum + (q.marks ?? 0), 0)).toBe(manifest.maximumMarks ?? -1);
      expect(manifest.examFormat?.fidelity).toBe("adapted");
      expect(manifest.resources).toHaveLength(1);
      for (const [index, question] of manifest.questions.entries()) {
        const subpartMarks = [...question.prompt.matchAll(/\[(\d+)\]/g)].reduce((sum, part) => sum + Number(part[1]), 0);
        expect(subpartMarks).toBe(question.marks ?? -1);
        expect(question.type).toBe("ink");
        expect(question.resourceKeys).toEqual(["formula-facts"]);
        expect(marking[index]!.questionId).toBe(question.id);
        expect(marking[index]!.marks).toBe(question.marks ?? -1);
        expect(marking[index]!.answer.length).toBeGreaterThan(15);
        expect(JSON.stringify(manifest)).not.toContain(marking[index]!.answer);
      }
    }
  });

  test("formula facts and assessed techniques stay within the intended tier", () => {
    for (const paper of [1, 3]) {
      const { manifest } = mock(paper);
      expect(manifest.resources[0]!.text).not.toContain("b² − 4ac");
      expect(manifest.resources[0]!.text).not.toContain("a/sin A");
      expect(manifest.questions.some(q => /without replacement|frequency density|differentiat|perpendicular bisector/i.test(q.prompt))).toBe(false);
    }
    expect(mock(1).manifest.questions[9]!.prompt).toContain("Represent −2 ≤ t < 4");
    for (const paper of [2, 4]) {
      expect(mock(paper).manifest.resources[0]!.text).toContain("b² − 4ac");
      expect(mock(paper).manifest.resources[0]!.text).toContain("a/sin A");
    }
  });

  test("Core calculator answers use recomputed numerical values", () => {
    expect(((7.84 ** 2 - 3.19) / 2.6).toPrecision(3)).toBe("22.4");
    expect(answer(3, 1)).toContain("22.4");
    expect(answer(3, 2)).toContain((1800 * 1.042 ** 3 - 1800).toFixed(2));
    expect(145.08 / 18.6).toBeCloseTo(7.8, 10);
    expect(answer(3, 3)).toContain("195 g");
    expect(4.86e7 / 1.35e5).toBe(360);
    expect(answer(3, 11)).toContain(`${(Math.PI * 4.2 ** 2 * 11).toPrecision(3)} ml`);
    expect(answer(3, 11)).toContain(`${(Math.PI * (2 * 4.2 * 11 + 4.2 ** 2)).toPrecision(3)} cm²`);
    expect(answer(3, 12)).toContain(`${Math.hypot(6.2, 1.35).toPrecision(3)} m`);
    expect(answer(3, 12)).toContain(`${(Math.atan(1.35 / 6.2) / radians).toFixed(1)}°`);
    expect(answer(3, 15)).toContain((52 / 30).toPrecision(3));
    expect(answer(3, 21)).toContain((450 * 0.98 * 0.92).toFixed(2));
    expect(answer(3, 22)).toContain(`${2 * (6 * 4 + 6 * 3 + 4 * 3)} cm²`);
  });

  test("Extended calculator answers agree with full-precision calculations", () => {
    expect((Math.hypot(18.7, 26.4) / 0.0735).toPrecision(3)).toBe("440");
    expect(answer(4, 1)).toContain("4.40×10²");
    expect(answer(4, 2)).toContain((128.5 / 1.55).toPrecision(3));
    expect(answer(4, 4)).toContain((18500 * 0.87 ** 4).toFixed(6).replace(/0+$/, ""));
    expect(answer(4, 4)).toContain(`${(100 * 0.87 ** 4).toPrecision(3)}%`);
    expect(answer(4, 5)).toContain(`${Math.sqrt(1200 / 7.5).toPrecision(3)} m`);
    expect(answer(4, 7)).toContain(((5 + Math.sqrt(157)) / 6).toPrecision(3));
    expect(answer(4, 7)).toContain(((5 - Math.sqrt(157)) / 6).toPrecision(3).replace("-", "−"));
    const side = Math.sqrt(8.6 ** 2 + 12.3 ** 2 - 2 * 8.6 * 12.3 * Math.cos(57 * radians));
    expect(answer(4, 12)).toContain(`${side.toPrecision(3)} cm`);
    expect(answer(4, 12)).toContain(`${(8.6 * 12.3 * Math.sin(57 * radians) / 2).toPrecision(3)} cm²`);
    expect(answer(4, 13)).toContain(`${(Math.atan2(12, 7) / radians).toFixed(1)}°`);
    expect(answer(4, 14)).toContain(`${(Math.asin(4 / Math.sqrt(133)) / radians).toFixed(1)}°`);
    const segment = 74 / 360 * Math.PI * 100 - 50 * Math.sin(74 * radians);
    expect(answer(4, 15)).toContain(`${segment.toPrecision(3)} cm²`);
    expect(answer(4, 16)).toContain(`${Math.hypot(4.5, 12).toPrecision(3)} cm`);
    expect(answer(4, 24)).toContain(String(Math.round(750 * 1.08 ** 12)));
    expect(750 * 1.08 ** 12).toBeLessThan(2000);
    expect(750 * 1.08 ** 13).toBeGreaterThan(2000);
  });

  test("harder exact solutions satisfy the original equations and geometry", () => {
    for (const x of [-0.5, 4]) expect(2 * x * x - 7 * x - 4).toBe(0);
    const x = -2 + 3 * Math.sqrt(6);
    expect((x + 5) * (x - 1)).toBeCloseTo(45, 10);
    expect(4 * x + 8).toBeCloseTo(12 * Math.sqrt(6), 10);
    expect(answer(2, 24)).toContain("12√6 cm");
    const t = 4 / 5, s = 3 / 5;
    expect(t / 2).toBeCloseTo(1 - s, 12);
    expect(t / 2).toBeCloseTo(2 * s / 3, 12);
    expect(answer(2, 22)).toContain("OP=2a/5+2b/5");
    for (const xRoot of [(-4 + Math.sqrt(496)) / 10, (-4 - Math.sqrt(496)) / 10]) {
      expect(xRoot ** 2 + (2 * xRoot + 1) ** 2).toBeCloseTo(25, 10);
    }
    expect(2 * 15 ** 2 + 3 * 15 + 1).toBe(496);
    expect(2 * 16 ** 2 + 3 * 16 + 1).toBe(561);
    expect(answer(4, 10)).toContain("16th term, 561");
    const colours = [4, 3, 2];
    const same = colours.reduce((sum, count) => sum + count * (count - 1) / 72, 0);
    expect(same).toBeCloseTo(5 / 18, 12);
    expect(answer(2, 19)).toContain("5/18");
    expect(3 / 8 * 5 / 7 + 5 / 8 * 3 / 7).toBeCloseTo(15 / 28, 12);
    expect(answer(4, 20)).toContain("15/28");
  });

  test("independent graph/model checks include enough premises and all roots", () => {
    const journey = mock(3).manifest.questions[17]!.prompt;
    expect(journey).toMatch(/directly away from home at a constant speed/);
    expect(journey).toMatch(/directly home at a constant speed/);
    expect(answer(3, 18)).toContain(`${4 / 1.25} km/h`);
    const cubic = (x: number) => x ** 3 - 4 * x + 1;
    const roots = [-2.1, 0.25, 1.86].map((initial) => {
      let x = initial;
      for (let step = 0; step < 8; step++) x -= cubic(x) / (3 * x ** 2 - 4);
      expect(cubic(x)).toBeCloseTo(0, 10);
      return x;
    });
    for (const root of roots) expect(answer(4, 22)).toContain(root.toFixed(1).replace("-", "−"));
    expect(48 - 4 * 12).toBe(0);
    expect(48 * 12 - 2 * 12 ** 2).toBe(288);
    expect(answer(4, 23)).toContain("288 m²");
  });
});
