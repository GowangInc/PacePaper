import { describe, expect, test } from "bun:test";
import { MAX_INK_PAGES, normalizeInkAnswer, parseInkSettings } from "./ink";

const settings = { pages: 2, background: "square-grid", allowTypedAlternative: true } as const;

describe("ink settings", () => {
  test("accepts a compact working-space configuration", () => {
    expect(parseInkSettings(settings)).toEqual(settings);
  });

  test("rejects unsupported page counts", () => {
    expect(() => parseInkSettings({ ...settings, pages: 5 })).toThrow("integer from 1 to 4");
  });

  test("keeps the keyboard-accessible typed fallback enabled for legacy manifests", () => {
    expect(parseInkSettings({ ...settings, allowTypedAlternative: false })).toEqual({
      ...settings,
      allowTypedAlternative: true,
    });
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
      background: "square-grid",
      pages: [{ strokes: [{ width: 3 }] }, { strokes: [] }],
      typed: "x = 2",
    });
  });

  test("upgrades responses saved before students could choose a background", () => {
    const legacy = JSON.stringify({
      version: 1,
      pages: [{ strokes: [] }, { strokes: [] }],
      typed: "legacy typed working",
    });

    expect(JSON.parse(normalizeInkAnswer(legacy, settings))).toEqual({
      version: 1,
      pages: [{ strokes: [] }, { strokes: [] }],
      background: settings.background,
      typed: "legacy typed working",
    });
  });

  test("preserves a student-selected background and additional pages", () => {
    const raw = JSON.stringify({
      version: 1,
      pages: [
        { strokes: [{ width: 2, points: [[10, 20, 500]] }] },
        { strokes: [] },
        { strokes: [{ width: 4, points: [[30, 40, 600]] }] },
      ],
      background: "lined",
      typed: "working retained while adding a page",
    });

    expect(JSON.parse(normalizeInkAnswer(raw, settings))).toEqual({
      version: 1,
      pages: [
        { strokes: [{ width: 2, points: [[10, 20, 500]] }] },
        { strokes: [] },
        { strokes: [{ width: 4, points: [[30, 40, 600]] }] },
      ],
      background: "lined",
      typed: "working retained while adding a page",
    });
  });

  test("requires the teacher-configured pages and caps student-added pages", () => {
    const answer = (pages: number) => JSON.stringify({
      version: 1,
      pages: Array.from({ length: pages }, () => ({ strokes: [] })),
      background: "blank",
      typed: "",
    });

    expect(() => normalizeInkAnswer(answer(1), settings)).toThrow(`2 to ${MAX_INK_PAGES} pages`);
    expect(() => normalizeInkAnswer(answer(MAX_INK_PAGES + 1), settings)).toThrow(`2 to ${MAX_INK_PAGES} pages`);
    expect(JSON.parse(normalizeInkAnswer(answer(MAX_INK_PAGES), settings)).pages).toHaveLength(MAX_INK_PAGES);
  });

  test("rejects unknown response backgrounds", () => {
    const raw = JSON.stringify({
      version: 1,
      pages: [{ strokes: [] }, { strokes: [] }],
      background: "dots",
      typed: "",
    });
    expect(() => normalizeInkAnswer(raw, settings)).toThrow("Handwritten response.background must be one of");
  });

  test("accepts typed working from a legacy manifest that disabled the fallback", () => {
    const raw = JSON.stringify({
      version: 1,
      pages: [{ strokes: [] }, { strokes: [] }],
      background: "blank",
      typed: "Keyboard-accessible working",
    });
    const legacySettings = { ...settings, allowTypedAlternative: false };

    expect(JSON.parse(normalizeInkAnswer(raw, legacySettings)).typed).toBe("Keyboard-accessible working");
  });

  test("accepts eraser output as the unchanged version 1 format", () => {
    const raw = JSON.stringify({
      version: 1,
      pages: [
        { strokes: [] },
        { strokes: [{ width: 2, points: [[300, 400, 500]] }] },
      ],
      background: "lined",
      typed: "",
    });

    expect(JSON.parse(normalizeInkAnswer(raw, settings))).toEqual({
      version: 1,
      pages: [
        { strokes: [] },
        { strokes: [{ width: 2, points: [[300, 400, 500]] }] },
      ],
      background: "lined",
      typed: "",
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
