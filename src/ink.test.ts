import { describe, expect, test } from "bun:test";
import { normalizeInkAnswer, parseInkSettings } from "./ink";

const settings = { pages: 2, background: "square-grid", allowTypedAlternative: true } as const;

describe("ink settings", () => {
  test("accepts a compact working-space configuration", () => {
    expect(parseInkSettings(settings)).toEqual(settings);
  });

  test("rejects unsupported page counts", () => {
    expect(() => parseInkSettings({ ...settings, pages: 5 })).toThrow("integer from 1 to 4");
  });
});

describe("ink responses", () => {
  test("normalizes validated vector strokes", () => {
    const raw = JSON.stringify({
      version: 1,
      pages: [
        { strokes: [{ width: 3, points: [[100, 200, 500], [120, 240, 700]] }] },
        { strokes: [] },
      ],
      typed: "x = 2",
    });
    expect(JSON.parse(normalizeInkAnswer(raw, settings))).toMatchObject({
      version: 1,
      pages: [{ strokes: [{ width: 3 }] }, { strokes: [] }],
      typed: "x = 2",
    });
  });

  test("rejects coordinates outside the fixed page", () => {
    const raw = JSON.stringify({
      version: 1,
      pages: [{ strokes: [{ width: 2, points: [[10_001, 20, 500]] }] }, { strokes: [] }],
      typed: "",
    });
    expect(() => normalizeInkAnswer(raw, settings)).toThrow("integer from 0 to 10000");
  });
});
