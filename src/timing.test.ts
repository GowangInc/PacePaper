import { describe, expect, test } from "bun:test";
import { effectiveExamMs, examPhaseAt, examTimeline, examTiming, wallExamTime } from "./timing";

describe("exam timing", () => {
  test("runs reading time before writing time", () => {
    expect(examTiming({ readingTimeMinutes: 5, durationMinutes: 90, extraMinutes: 0 })).toEqual({
      readingEndsAt: 300_000,
      deadline: 5_700_000,
    });
  });

  test("applies individual extra time only to the writing period", () => {
    const standard = examTiming({ readingTimeMinutes: 5, durationMinutes: 90, extraMinutes: 0 });
    const access = examTiming({ readingTimeMinutes: 5, durationMinutes: 90, extraMinutes: 25 });
    expect(access.readingEndsAt).toBe(standard.readingEndsAt);
    expect(access.deadline - standard.deadline).toBe(25 * 60_000);
  });

  test("supports a ten-second test reading period as one sixth of a minute", () => {
    expect(examTiming({
      readingTimeMinutes: 10 / 60,
      durationMinutes: 90,
      extraMinutes: 0,
    })).toEqual({
      readingEndsAt: 10_000,
      deadline: 5_410_000,
    });
  });

  test("schedules multi-section work, a locked break, and a final section", () => {
    const phases = [
      { id: "section-1", label: "Section I", kind: "work" as const, durationMinutes: 60, sectionId: "section-1" },
      { id: "break", label: "Monitored break", kind: "break" as const, durationMinutes: 10 },
      { id: "section-2-reading", label: "Section II reading", kind: "reading" as const, durationMinutes: 15, sectionId: "section-2" },
      { id: "section-2", label: "Section II", kind: "work" as const, durationMinutes: 120, sectionId: "section-2" },
    ];
    const timeline = examTimeline({ readingTimeMinutes: 0, durationMinutes: 205, extraMinutes: 5, phases });
    expect(timeline.map(({ id, responseAllowed, canSubmit }) => ({ id, responseAllowed, canSubmit }))).toEqual([
      { id: "section-1", responseAllowed: true, canSubmit: false },
      { id: "break", responseAllowed: false, canSubmit: false },
      { id: "section-2-reading", responseAllowed: false, canSubmit: false },
      { id: "section-2", responseAllowed: true, canSubmit: true },
    ]);
    expect(examPhaseAt(timeline, 65 * 60_000)?.id).toBe("break");
    expect(examPhaseAt(timeline, 75 * 60_000)?.id).toBe("section-2-reading");
    expect(timeline.at(-1)?.endsAt).toBe(210 * 60_000);
    expect(examTiming({ readingTimeMinutes: 0, durationMinutes: 205, extraMinutes: 5, phases })).toEqual({
      readingEndsAt: 0,
      deadline: 210 * 60_000,
    });
  });
});

describe("exam clock", () => {
  test("measures effective time from the run anchor", () => {
    expect(effectiveExamMs({ runningMs: 120_000, runStartedAt: 1_000, startedAt: 500 }, 61_000)).toBe(180_000);
  });

  test("freezes effective time while paused", () => {
    expect(effectiveExamMs({ runningMs: 120_000, runStartedAt: null, startedAt: null, frozen: true }, 99_999)).toBe(120_000);
  });

  test("falls back to the legacy started-at anchor", () => {
    expect(effectiveExamMs({ runningMs: 0, runStartedAt: null, startedAt: 1_000 }, 61_000)).toBe(60_000);
  });

  test("maps examination time to wall time for the current run", () => {
    const clock = { runningMs: 120_000, runStartedAt: 1_000, startedAt: 500 };
    expect(wallExamTime(clock, 180_000)).toBe(61_000);
    expect(wallExamTime(clock, 0)).toBe(-119_000);
  });
});
