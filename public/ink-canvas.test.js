import { describe, expect, test } from "bun:test";
import {
  applyInkHistoryAction,
  eraseStrokesAtPoint,
  fitInkAnswerToLimits,
  inkPointFromEvent,
  inkPointerStartMode,
  isIntentionalInkMovement,
  parseInkResponse,
  resolveInkBackgroundChange,
  snapshotInkCanvasGeometry,
  strokeIntersectsEraser,
} from "./ink-canvas.js";

const settings = { pages: 2, background: "square-grid", allowTypedAlternative: true };

function response(overrides = {}) {
  return JSON.stringify({
    version: 1,
    pages: [{ strokes: [] }, { strokes: [] }],
    background: "blank",
    typed: "",
    ...overrides,
  });
}

describe("browser ink response parsing", () => {
  test("upgrades legacy answers without changing their strokes or typed working", () => {
    const raw = response({
      background: undefined,
      pages: [
        { strokes: [{ width: 3, points: [[20, 30], [40, 50, 700]] }] },
        { strokes: [] },
      ],
      typed: "legacy working",
    });

    expect(parseInkResponse(raw, settings)).toEqual({
      ok: true,
      answer: {
        version: 1,
        pages: [
          { strokes: [{ width: 3, points: [[20, 30, 500], [40, 50, 700]] }] },
          { strokes: [] },
        ],
        background: "square-grid",
        typed: "legacy working",
      },
    });
  });

  test("returns the exact raw value for recovery when JSON is malformed", () => {
    const raw = "{not valid JSON";
    expect(parseInkResponse(raw, settings)).toEqual({ ok: false, raw });
  });

  test("routes server-invalid coordinates and stroke counts to recovery", () => {
    const outOfBounds = response({
      pages: [{ strokes: [{ width: 3, points: [[10_001, 20, 500]] }] }, { strokes: [] }],
    });
    const tooManyStrokes = response({
      pages: [{ strokes: Array.from({ length: 501 }, () => ({ width: 3, points: [[1, 1, 500]] })) }, { strokes: [] }],
    });

    expect(parseInkResponse(outOfBounds, settings)).toEqual({ ok: false, raw: outOfBounds });
    expect(parseInkResponse(tooManyStrokes, settings)).toEqual({ ok: false, raw: tooManyStrokes });
  });
});

describe("browser ink background changes", () => {
  test("keeps a student on the teacher default without a transition", () => {
    expect(resolveInkBackgroundChange("square-grid", "square-grid", "square-grid")).toEqual({
      type: "unchanged",
      background: "square-grid",
    });
  });

  test("requires confirmation before a student overrides the teacher default", () => {
    expect(resolveInkBackgroundChange("square-grid", "square-grid", "lined")).toEqual({
      type: "confirm",
      background: "square-grid",
      requestedBackground: "lined",
    });
    expect(resolveInkBackgroundChange("square-grid", "lined", "blank")).toEqual({
      type: "confirm",
      background: "lined",
      requestedBackground: "blank",
    });
  });

  test("restores the teacher default without another confirmation", () => {
    expect(resolveInkBackgroundChange("square-grid", "lined", "square-grid")).toEqual({
      type: "restore",
      background: "square-grid",
    });
  });
});

describe("browser ink response limits", () => {
  test("decimates detailed strokes before save while preserving both endpoints", () => {
    const points = Array.from({ length: 3_000 }, (_, index) => [index, index % 7_501, 500]);
    const answer = {
      version: 1,
      pages: [{ strokes: [{ width: 3, points }] }],
      background: "blank",
      typed: "",
    };

    const result = fitInkAnswerToLimits(answer);

    expect(result.ok).toBe(true);
    expect(result.compacted).toBe(true);
    expect(result.longestStroke).toBeLessThanOrEqual(2_500);
    expect(result.points).toBeLessThanOrEqual(50_000);
    expect(result.bytes).toBeLessThanOrEqual(900_000);
    expect(answer.pages[0].strokes[0].points[0]).toEqual(points[0]);
    expect(answer.pages[0].strokes[0].points.at(-1)).toEqual(points.at(-1));
  });
});

describe("browser ink eraser", () => {
  const upperStroke = { width: 3, points: [[1_000, 1_000, 500], [4_000, 1_000, 500]] };
  const lowerStroke = { width: 3, points: [[1_000, 3_000, 500], [4_000, 3_000, 500]] };
  const dot = { width: 4, points: [[2_500, 1_000, 500]] };

  test("hit-tests both line segments and single-point strokes", () => {
    expect(strokeIntersectsEraser(upperStroke, [2_500, 1_100], 100)).toBe(true);
    expect(strokeIntersectsEraser(upperStroke, [2_500, 1_300], 100)).toBe(false);
    expect(strokeIntersectsEraser(dot, [2_600, 1_000], 100)).toBe(true);
  });

  test("ignores secondary input while recognizing manual and physical erasers", () => {
    expect(inkPointerStartMode({ pointerType: "mouse", button: 2, buttons: 2, isPrimary: true }, "draw")).toBeNull();
    expect(inkPointerStartMode({ pointerType: "pen", button: 2, buttons: 2, isPrimary: true }, "draw")).toBeNull();
    expect(inkPointerStartMode({ pointerType: "touch", button: 0, buttons: 1, isPrimary: false }, "draw")).toBeNull();
    expect(inkPointerStartMode({ pointerType: "mouse", button: 0, buttons: 1, isPrimary: true }, "erase")).toBe("erase");
    expect(inkPointerStartMode({ pointerType: "pen", button: 5, buttons: 32, isPrimary: true }, "draw")).toBe("erase");
    expect(inkPointerStartMode({ pointerType: "pen", button: -1, buttons: 32, isPrimary: true }, "draw")).toBe("erase");
  });

  test("restores and re-erases the exact strokes in their original order", () => {
    const strokes = [upperStroke, lowerStroke, dot];
    const action = { type: "erase", removed: eraseStrokesAtPoint(strokes, [2_500, 1_000], 100) };

    expect(strokes).toEqual([lowerStroke]);
    expect(action.removed.map((entry) => entry.index)).toEqual([2, 0]);
    expect(applyInkHistoryAction(strokes, action, "undo")).toBe(upperStroke.points.length + dot.points.length);
    expect(strokes).toEqual([upperStroke, lowerStroke, dot]);
    expect(applyInkHistoryAction(strokes, action, "redo")).toBe(-(upperStroke.points.length + dot.points.length));
    expect(strokes).toEqual([lowerStroke]);
  });

  test("undoes and redoes a drawn stroke by identity", () => {
    const strokes = [upperStroke, lowerStroke];
    const action = { type: "draw", stroke: lowerStroke, index: 1 };

    expect(applyInkHistoryAction(strokes, action, "undo")).toBe(-lowerStroke.points.length);
    expect(strokes).toEqual([upperStroke]);
    expect(applyInkHistoryAction(strokes, action, "redo")).toBe(lowerStroke.points.length);
    expect(strokes).toEqual([upperStroke, lowerStroke]);
  });
});

describe("browser ink pointer geometry", () => {
  test("uses the pointer-down canvas geometry even if the page reflows", () => {
    const startGeometry = snapshotInkCanvasGeometry({ left: 100, top: 200, width: 500, height: 375 });
    const start = inkPointFromEvent({ clientX: 200, clientY: 275, pressure: 0.4 }, startGeometry);
    const end = inkPointFromEvent({ clientX: 500, clientY: 500, pressure: 0.8 }, startGeometry);

    expect(start).toEqual([2_000, 1_500, 400]);
    expect(end).toEqual([8_000, 6_000, 800]);
    expect(end).not.toEqual(inkPointFromEvent({ clientX: 500, clientY: 500, pressure: 0.8 }, {
      left: 300,
      top: 300,
      width: 200,
      height: 150,
    }));
  });

  test("does not start a stroke for a stationary click or tiny pointer jitter", () => {
    const start = [1_000, 1_000, 500];

    expect(isIntentionalInkMovement(start, [1_000, 1_000, 500])).toBe(false);
    expect(isIntentionalInkMovement(start, [1_020, 1_020, 500])).toBe(false);
    expect(isIntentionalInkMovement(start, [1_036, 1_000, 500])).toBe(true);
  });
});
