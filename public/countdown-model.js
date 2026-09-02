const MINUTE_MS = 60_000;

export function countdownPhase(config, now) {
  const startAt = Number(config.startAt);
  const readingTimeMinutes = Number(config.readingTimeMinutes);
  const durationMinutes = Number(config.durationMinutes);
  const currentTime = Number(now);
  if (![startAt, readingTimeMinutes, durationMinutes, currentTime].every(Number.isFinite)) {
    throw new TypeError("Countdown timing must contain finite numbers");
  }
  if (readingTimeMinutes < 0 || durationMinutes <= 0) {
    throw new RangeError("Countdown timing must have non-negative reading time and positive writing time");
  }

  const readingEndsAt = startAt + readingTimeMinutes * MINUTE_MS;
  const endsAt = readingEndsAt + durationMinutes * MINUTE_MS;
  if (config.sessionStatus === "draft") {
    return {
      phase: "ready",
      label: "Ready to start",
      remainingMs: 0,
      nextLabel: "Awaiting teacher start",
      startAt,
      readingEndsAt,
      endsAt,
    };
  }
  if (config.sessionStatus === "ended") {
    const endedAt = Number.isFinite(Number(config.endedAt)) ? Number(config.endedAt) : endsAt;
    return {
      phase: "ended",
      label: "Exam ended",
      remainingMs: 0,
      nextLabel: "Exam ended",
      startAt,
      readingEndsAt,
      endsAt,
      endedAt,
    };
  }
  if (currentTime < startAt) {
    return {
      phase: "before-start",
      label: "Starts in",
      remainingMs: startAt - currentTime,
      nextLabel: readingTimeMinutes > 0 ? "Reading starts" : "Writing starts",
      startAt,
      readingEndsAt,
      endsAt,
    };
  }
  if (readingTimeMinutes > 0 && currentTime < readingEndsAt) {
    return {
      phase: "reading",
      label: "Reading time",
      remainingMs: readingEndsAt - currentTime,
      nextLabel: "Writing starts",
      startAt,
      readingEndsAt,
      endsAt,
    };
  }
  if (currentTime < endsAt) {
    return {
      phase: "writing",
      label: "Writing time",
      remainingMs: endsAt - currentTime,
      nextLabel: "Exam ends",
      startAt,
      readingEndsAt,
      endsAt,
    };
  }
  if (config.sessionStatus === "live") {
    return {
      phase: "standard-ended",
      label: "Standard time is up",
      remainingMs: 0,
      nextLabel: "Standard time ended",
      startAt,
      readingEndsAt,
      endsAt,
    };
  }
  return {
    phase: "ended",
    label: "Time is up",
    remainingMs: 0,
    nextLabel: "Exam ended",
    startAt,
    readingEndsAt,
    endsAt,
  };
}

export function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(Number(milliseconds) / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function resolveStartAt(value, loadedValue, exactTimestamp) {
  const exact = Number(exactTimestamp);
  if (value === loadedValue && Number.isFinite(exact)) return exact;
  return new Date(value).getTime();
}

export function parseStudentNames(value, limit = 60) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("Student-name limit must be a positive integer");
  return String(value ?? "")
    .split(/\r?\n/u)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function chooseCountdownSession(sessions, requestedId = "") {
  const requested = sessions.find((session) => session.id === requestedId);
  if (requested) return requested;
  if (requestedId) return null;
  return sessions.find((session) => session.status === "live") ?? null;
}

export function nextFiveMinuteStart(now) {
  const date = new Date(now);
  date.setSeconds(0, 0);
  date.setMinutes(Math.ceil((date.getMinutes() + 1) / 5) * 5);
  return date.getTime();
}

export function configFromSession(session, now) {
  if (!session) {
    return {
      sessionId: "custom",
      sessionStatus: "custom",
      endedAt: null,
      title: "Practice examination",
      subtitle: "Teacher-controlled display",
      startAt: nextFiveMinuteStart(now),
      readingTimeMinutes: 5,
      durationMinutes: 60,
    };
  }
  return {
    sessionId: session.id,
    sessionStatus: session.status,
    endedAt: session.endedAt ?? null,
    title: session.paperTitle,
    subtitle: [session.className, session.subjectLabel, session.level, session.paper].filter(Boolean).join(" · "),
    startAt: session.startedAt ?? nextFiveMinuteStart(now),
    readingTimeMinutes: session.readingTimeMinutes,
    durationMinutes: session.durationMinutes,
  };
}
