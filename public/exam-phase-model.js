export function phaseAtTime(timeline, now) {
  if (!Array.isArray(timeline)) return null;
  const currentTime = Number(now);
  if (!Number.isFinite(currentTime)) throw new TypeError("Phase time must be finite");
  return timeline.find((phase) => currentTime >= Number(phase.startsAt) && currentTime < Number(phase.endsAt)) ?? null;
}

export function questionsForPhase(questions, phase) {
  if (!Array.isArray(questions)) return [];
  if (!phase?.sectionId) return phase?.kind === "break" ? [] : questions;
  return questions.filter((question) => question.sectionId === phase.sectionId);
}

export function resourcesForExamContext(resources, questions, activeQuestionId, phase, mode) {
  if (!Array.isArray(resources) || phase?.kind === "break") return [];
  if (!Array.isArray(questions) || !questions.some((question) => question.resourceKeys?.length)) return resources;

  const exposeSectionResources = phase?.kind === "reading" || mode === "reading";
  const relevantQuestions = exposeSectionResources
    ? questions
    : questions.filter((question) => question.id === activeQuestionId);
  const availableKeys = new Set(relevantQuestions.flatMap((question) => question.resourceKeys ?? []));
  return resources.filter((resource) => availableKeys.has(resource.key));
}

export function phaseLockMessage(phase) {
  if (!phase) return "The examination is changing phase. Student entry is temporarily locked.";
  if (phase.kind === "break") return phase.instructions || "Take the monitored break. Examination content and student entry are locked.";
  if (phase.kind === "reading") return phase.instructions || "Read the questions and materials. Student entry will open automatically.";
  return "Student entry is available.";
}
