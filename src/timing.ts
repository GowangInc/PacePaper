export interface ExamTimingInput {
  startedAt: number;
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

export function examTiming(input: ExamTimingInput): ExamTiming {
  if (input.phases?.length) {
    const timeline = examTimeline(input);
    const firstWork = timeline.find(({ kind }) => kind === "work");
    return {
      readingEndsAt: firstWork?.startsAt ?? input.startedAt,
      deadline: timeline.at(-1)?.endsAt ?? input.startedAt,
    };
  }
  const readingEndsAt = input.startedAt + input.readingTimeMinutes * 60_000;
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
  let cursor = input.startedAt;
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
