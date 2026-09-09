import { describe, expect, test } from "bun:test";
import {
  canPersistCandidateTiming,
  chooseCountdownSession,
  configFromSession,
  countdownPhase,
  formatCountdown,
  nextFiveMinuteStart,
  parseStudentNames,
  resolveStartAt,
  synchronizeLinkedCountdown,
} from "./countdown-model.js";

describe("second-screen countdown", () => {
  test("allows simple ready and live exams to receive candidate timing changes", () => {
    expect(canPersistCandidateTiming({ status: "draft" })).toBeTrue();
    expect(canPersistCandidateTiming({ status: "draft", phases: [{ id: "one" }] })).toBeFalse();
    expect(canPersistCandidateTiming({ status: "live" })).toBeTrue();
    expect(canPersistCandidateTiming({ status: "live", phases: [{ id: "one" }] })).toBeFalse();
    expect(canPersistCandidateTiming({ status: "ended" })).toBeFalse();
    expect(canPersistCandidateTiming(null)).toBeFalse();
  });

  const config = { startAt: 1_000_000, readingTimeMinutes: 5, durationMinutes: 90 };

  test("moves from scheduled start through reading, writing and time up", () => {
    expect(countdownPhase(config, 999_000)).toMatchObject({ phase: "before-start", remainingMs: 1_000 });
    expect(countdownPhase(config, 1_000_000)).toMatchObject({ phase: "reading", remainingMs: 300_000 });
    expect(countdownPhase(config, 1_300_000)).toMatchObject({ phase: "writing", remainingMs: 5_400_000 });
    expect(countdownPhase(config, 6_700_000)).toMatchObject({ phase: "ended", remainingMs: 0 });
  });

  test("starts writing immediately when there is no reading time", () => {
    expect(countdownPhase({ ...config, readingTimeMinutes: 0 }, config.startAt)).toMatchObject({
      phase: "writing",
      remainingMs: 5_400_000,
    });
  });

  test("supports a ten-second reading phase for test sessions", () => {
    const testing = { ...config, readingTimeMinutes: 10 / 60 };
    expect(countdownPhase(testing, testing.startAt)).toMatchObject({
      phase: "reading",
      remainingMs: 10_000,
    });
    expect(countdownPhase(testing, testing.startAt + 10_000)).toMatchObject({ phase: "writing" });
  });

  test("rounds display seconds up so a phase never reads zero early", () => {
    expect(formatCountdown(1)).toBe("00:00:01");
    expect(formatCountdown(3_600_001)).toBe("01:00:01");
    expect(formatCountdown(0)).toBe("00:00:00");
  });

  test("applying unchanged linked settings preserves the exact server start", () => {
    expect(resolveStartAt("2026-09-02T09:30:12", "2026-09-02T09:30:12", "1788312612345")).toBe(1_788_312_612_345);
    expect(resolveStartAt("2026-09-02T09:31:00", "2026-09-02T09:30:12", "1788312612345"))
      .not.toBe(1_788_312_612_345);
  });

  test("normalizes an editable one-name-per-line clock roster", () => {
    expect(parseStudentNames("  Mina Kim  \n\nAlex Chen\r\n Mina Kim ")).toEqual([
      "Mina Kim",
      "Alex Chen",
      "Mina Kim",
    ]);
    expect(parseStudentNames("A\nB\nC", 2)).toEqual(["A", "B"]);
    expect(() => parseStudentNames("A", 0)).toThrow(RangeError);
  });

  test("honours an explicitly requested exam, otherwise preferring a live exam", () => {
    const sessions = [
      { id: "draft", status: "draft" },
      { id: "live", status: "live" },
      { id: "ended", status: "ended" },
    ];
    expect(chooseCountdownSession(sessions, "ended")?.id).toBe("ended");
    expect(chooseCountdownSession(sessions)?.id).toBe("live");
    expect(chooseCountdownSession(sessions, "missing")).toBeNull();
    expect(chooseCountdownSession([{ id: "draft", status: "draft" }])?.id).toBe("draft");
  });

  test("does not invent a running clock for an unstarted or manually ended session", () => {
    expect(countdownPhase({ ...config, sessionStatus: "draft" }, config.startAt)).toMatchObject({
      phase: "ready",
      label: "Ready to start",
    });
    expect(countdownPhase({ ...config, sessionStatus: "ended", endedAt: config.startAt + 30_000 }, config.startAt)).toMatchObject({
      phase: "ended",
      label: "Exam ended",
      endedAt: config.startAt + 30_000,
    });
  });

  test("keeps a live session distinct when standard time expires", () => {
    expect(countdownPhase({ ...config, sessionStatus: "live" }, 6_700_000)).toMatchObject({
      phase: "standard-ended",
      label: "Standard time is up",
    });
  });

  test("starts a customised linked display only when the teacher starts its exam", () => {
    const adjustedDraft = {
      sessionId: "session-1",
      sessionStatus: "draft",
      title: "Adjusted room title",
      startAt: 2_000,
      readingTimeMinutes: 10,
      durationMinutes: 80,
    };
    expect(countdownPhase(adjustedDraft, 10_000)).toMatchObject({ phase: "ready" });
    const started = synchronizeLinkedCountdown(adjustedDraft, {
      id: "session-1",
      status: "live",
      startedAt: 12_345,
      endedAt: null,
      readingTimeMinutes: 0.2,
      durationMinutes: 90,
    });
    expect(started).toMatchObject({
      sessionStatus: "live",
      title: "Adjusted room title",
      startAt: 12_345,
      readingTimeMinutes: 0.2,
      durationMinutes: 90,
    });
    expect(countdownPhase(started, 12_345)).toMatchObject({ phase: "reading", remainingMs: 12_000 });
    const ready = synchronizeLinkedCountdown(adjustedDraft, { id: "session-1", status: "draft", readingTimeMinutes: 0.2, durationMinutes: 90 });
    expect(ready.readingTimeMinutes).toBe(0.2);
    const phases = [{ id: "work-1", kind: "work", durationMinutes: 3 }, { id: "break", kind: "break", durationMinutes: 1 }, { id: "work-2", kind: "work", durationMinutes: 3 }];
    expect(synchronizeLinkedCountdown({ ...adjustedDraft, phases: undefined, durationMinutes: 8 }, {
      id: "session-1", status: "live", startedAt: 12_345, readingTimeMinutes: 0, durationMinutes: 7, phases,
    })).toMatchObject({ phases, durationMinutes: 7 });
  });

  test("names writing as the next phase before a zero-reading exam", () => {
    expect(countdownPhase({ ...config, readingTimeMinutes: 0 }, config.startAt - 1)).toMatchObject({
      phase: "before-start",
      nextLabel: "Writing starts",
    });
  });

  test("copies standard exam timings without candidate-specific extra time", () => {
    const session = {
      id: "session-1",
      status: "live",
      paperTitle: "Mathematics practice",
      className: "DP2",
      subjectLabel: "Mathematics: analysis and approaches",
      level: "HL",
      paper: "Paper 1",
      startedAt: 5_000,
      readingTimeMinutes: 5,
      durationMinutes: 120,
    };
    expect(configFromSession(session, 0)).toEqual({
      sessionId: "session-1",
      sessionStatus: "live",
      endedAt: null,
      title: "Mathematics practice",
      subtitle: "DP2 · Mathematics: analysis and approaches · HL · Paper 1",
      startAt: 5_000,
      readingTimeMinutes: 5,
      durationMinutes: 120,
      phases: undefined,
    });
  });

  test("shows each saved timed section and break on the room clock", () => {
    const phases = [
      { id: "one", label: "Section I", kind: "work", durationMinutes: 60, tools: ["No calculator"] },
      { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [] },
      { id: "two", label: "Section II", kind: "work", durationMinutes: 90, tools: ["Calculator permitted"] },
    ];
    const phased = { ...config, readingTimeMinutes: 0, durationMinutes: 160, phases };
    expect(countdownPhase(phased, phased.startAt + 65 * 60_000)).toMatchObject({
      phase: "break",
      phaseId: "break",
      label: "Monitored break",
      nextLabel: "Section II",
    });
    expect(countdownPhase(phased, phased.startAt + 70 * 60_000)).toMatchObject({
      phase: "writing",
      phaseId: "two",
      tools: ["Calculator permitted"],
    });
  });

  test("rounds a draft or custom clock to the next five-minute boundary", () => {
    const now = new Date(2026, 8, 2, 9, 12, 30).getTime();
    const expected = new Date(2026, 8, 2, 9, 15, 0).getTime();
    expect(nextFiveMinuteStart(now)).toBe(expected);
    expect(configFromSession(null, now).startAt).toBe(expected);
  });
});
