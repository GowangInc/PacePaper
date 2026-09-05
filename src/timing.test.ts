import { describe, expect, test } from "bun:test";
import { examPhaseAt, examTimeline, examTiming } from "./timing";

describe("exam timing", () => {
  test("runs reading time before writing time", () => {
    expect(examTiming({ startedAt: 1_000, readingTimeMinutes: 5, durationMinutes: 90, extraMinutes: 0 })).toEqual({
      readingEndsAt: 301_000,
      deadline: 5_701_000,
    });
  });

  test("applies individual extra time only to the writing period", () => {
    const standard = examTiming({ startedAt: 0, readingTimeMinutes: 5, durationMinutes: 90, extraMinutes: 0 });
    const access = examTiming({ startedAt: 0, readingTimeMinutes: 5, durationMinutes: 90, extraMinutes: 25 });
    expect(access.readingEndsAt).toBe(standard.readingEndsAt);
    expect(access.deadline - standard.deadline).toBe(25 * 60_000);
  });

  test("supports a ten-second test reading period as one sixth of a minute", () => {
    expect(examTiming({
      startedAt: 1_000,
      readingTimeMinutes: 10 / 60,
      durationMinutes: 90,
      extraMinutes: 0,
    })).toEqual({
      readingEndsAt: 11_000,
      deadline: 5_411_000,
    });
  });

  test("schedules multi-section work, a locked break, and a final section", () => {
    const phases = [
      { id: "section-1", label: "Section I", kind: "work" as const, durationMinutes: 60, sectionId: "section-1" },
      { id: "break", label: "Monitored break", kind: "break" as const, durationMinutes: 10 },
      { id: "section-2-reading", label: "Section II reading", kind: "reading" as const, durationMinutes: 15, sectionId: "section-2" },
      { id: "section-2", label: "Section II", kind: "work" as const, durationMinutes: 120, sectionId: "section-2" },
    ];
    const timeline = examTimeline({ startedAt: 0, readingTimeMinutes: 0, durationMinutes: 205, extraMinutes: 5, phases });
    expect(timeline.map(({ id, responseAllowed, canSubmit }) => ({ id, responseAllowed, canSubmit }))).toEqual([
      { id: "section-1", responseAllowed: true, canSubmit: false },
      { id: "break", responseAllowed: false, canSubmit: false },
      { id: "section-2-reading", responseAllowed: false, canSubmit: false },
      { id: "section-2", responseAllowed: true, canSubmit: true },
    ]);
    expect(examPhaseAt(timeline, 65 * 60_000)?.id).toBe("break");
    expect(examPhaseAt(timeline, 75 * 60_000)?.id).toBe("section-2-reading");
    expect(timeline.at(-1)?.endsAt).toBe(210 * 60_000);
    expect(examTiming({ startedAt: 0, readingTimeMinutes: 0, durationMinutes: 205, extraMinutes: 5, phases })).toEqual({
      readingEndsAt: 0,
      deadline: 210 * 60_000,
    });
  });
});
