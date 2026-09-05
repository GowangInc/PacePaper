import type { PaperManifest } from "./papers.ts";
import type { ScheduledExamPhase } from "./timing.ts";

export interface CandidateResponseSnapshot {
  answers: Record<string, string>;
  flags: string[];
  selectedQuestionId: string | null;
}

export function responseFitsPhase(
  manifest: PaperManifest,
  previous: CandidateResponseSnapshot,
  next: CandidateResponseSnapshot,
  phase: ScheduledExamPhase,
): boolean {
  if (!phase.responseAllowed) return false;
  if (!phase.sectionId) return true;
  const allowed = new Set(manifest.questions.filter(({ sectionId }) => sectionId === phase.sectionId).map(({ id }) => id));
  for (const question of manifest.questions) {
    if (allowed.has(question.id)) continue;
    if ((next.answers[question.id] ?? "") !== (previous.answers[question.id] ?? "")) return false;
  }
  const previousFlags = new Set(previous.flags);
  const nextFlags = new Set(next.flags);
  for (const question of manifest.questions) {
    if (!allowed.has(question.id) && previousFlags.has(question.id) !== nextFlags.has(question.id)) return false;
  }
  return !(
    next.selectedQuestionId !== previous.selectedQuestionId
    && next.selectedQuestionId !== null
    && !allowed.has(next.selectedQuestionId)
  );
}
