export interface ExamTimingInput {
  readingTimeMinutes: number;
  durationMinutes: number;
  extraMinutes: number;
  phases?: readonly ExamPhaseInput[];
}

export interface ExamPhaseInput {
  id: string;
  label: string;
  kind: "reading" | "work" | "break";
  durationMinutes: number;
  sectionId?: string;
  tools?: readonly string[];
  instructions?: string;
}

/**
 * Phase boundaries in examination time: milliseconds of live exam time measured
 * from the moment the sitting first started, excluding paused and lobby
 * intervals. Wall-clock timestamps are derived from the sitting's clock anchor
 * (see ExamClock), never from these values directly.
 */
export interface ExamTiming {
  readingEndsAt: number;
  deadline: number;
}

export interface ScheduledExamPhase extends ExamPhaseInput {
  startsAt: number;
  standardEndsAt: number;
  endsAt: number;
  responseAllowed: boolean;
  canSubmit: boolean;
}

export interface ExamClock {
  /** Accumulated live examination time across every run of the sitting. */
  runningMs: number;
  /** Wall time the current live interval began, or null while frozen (or before start). */
  runStartedAt: number | null;
  /** Wall time the sitting first started, kept for pre-pause (legacy) sittings. */
  startedAt: number | null;
  /** True while the sitting is paused or waiting in the lobby: time does not move. */
  frozen?: boolean;
}

export function examTiming(input: ExamTimingInput): ExamTiming {
  if (input.phases?.length) {
    const timeline = examTimeline(input);
    const firstWork = timeline.find(({ kind }) => kind === "work");
    return {
      readingEndsAt: firstWork?.startsAt ?? 0,
      deadline: timeline.at(-1)?.endsAt ?? 0,
    };
  }
  const readingEndsAt = input.readingTimeMinutes * 60_000;
  return {
    readingEndsAt,
    deadline: readingEndsAt + (input.durationMinutes + input.extraMinutes) * 60_000,
  };
}

export function examTimeline(input: ExamTimingInput): ScheduledExamPhase[] {
  const phaseInputs: readonly ExamPhaseInput[] = input.phases?.length
    ? input.phases
    : [
        ...(input.readingTimeMinutes > 0 ? [{
          id: "reading",
          label: "Reading time",
          kind: "reading" as const,
          durationMinutes: input.readingTimeMinutes,
        }] : []),
        { id: "writing", label: "Writing time", kind: "work" as const, durationMinutes: input.durationMinutes },
      ];
  const lastWorkIndex = phaseInputs.findLastIndex(({ kind }) => kind === "work");
  let cursor = 0;
  return phaseInputs.map((phase, index) => {
    const startsAt = cursor;
    const standardEndsAt = startsAt + phase.durationMinutes * 60_000;
    cursor = standardEndsAt;
    const endsAt = standardEndsAt + (index === lastWorkIndex ? input.extraMinutes * 60_000 : 0);
    return {
      ...phase,
      tools: [...(phase.tools ?? [])],
      startsAt,
      standardEndsAt,
      endsAt,
      responseAllowed: phase.kind === "work",
      canSubmit: index === lastWorkIndex,
    };
  });
}

export function examPhaseAt(timeline: readonly ScheduledExamPhase[], now: number): ScheduledExamPhase | null {
  return timeline.find((phase) => now >= phase.startsAt && now < phase.endsAt) ?? null;
}

/**
 * Examination time elapsed for a sitting at wall time `now`. While the sitting
 * is frozen the caller passes `runStartedAt: null` and the frozen `runningMs`,
 * so time stops without touching wall-clock deadlines.
 */
export function effectiveExamMs(clock: ExamClock, now: number): number {
  if (clock.frozen) return clock.runningMs;
  if (clock.runStartedAt !== null) return Math.max(0, clock.runningMs + (now - clock.runStartedAt));
  if (clock.startedAt !== null) return Math.max(0, now - clock.startedAt);
  return 0;
}

/**
 * Maps a point in examination time to its wall-clock timestamp for the current
 * run. The anchor pair (`runningMs`, `runStartedAt`) stays constant while a run
 * is live, so published timestamps remain stable between refreshes.
 */
export function wallExamTime(clock: ExamClock, examMs: number): number | null {
  if (clock.runStartedAt !== null) return clock.runStartedAt + (examMs - clock.runningMs);
  if (clock.startedAt !== null) return clock.startedAt + examMs;
  return null;
}
