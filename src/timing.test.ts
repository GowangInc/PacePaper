import { describe, expect, test } from "bun:test";
import { examTiming } from "./timing";

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
});
