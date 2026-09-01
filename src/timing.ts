export interface ExamTimingInput {
  startedAt: number;
  readingTimeMinutes: number;
  durationMinutes: number;
  extraMinutes: number;
}

export interface ExamTiming {
  readingEndsAt: number;
  deadline: number;
}

export function examTiming(input: ExamTimingInput): ExamTiming {
  const readingEndsAt = input.startedAt + input.readingTimeMinutes * 60_000;
  return {
    readingEndsAt,
    deadline: readingEndsAt + (input.durationMinutes + input.extraMinutes) * 60_000,
  };
}
