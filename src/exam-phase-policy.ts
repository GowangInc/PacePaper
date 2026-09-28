import type { ExamPhaseKind, PaperManifest, PaperQuestion } from "./papers.ts";

export interface ExamPhaseAvailability {
  availablePhaseIds: readonly string[];
  availablePhaseKinds: readonly ExamPhaseKind[];
  preview: boolean;
}

function visibleQuestions(
  manifest: PaperManifest,
  availability: ExamPhaseAvailability,
): PaperQuestion[] {
  if (availability.preview) return manifest.questions;

  if (!manifest.phases) {
    return availability.availablePhaseKinds.some((kind) => kind === "reading" || kind === "work")
      ? manifest.questions
      : [];
  }

  const availableIds = new Set(availability.availablePhaseIds);
  const availableKinds = new Set(availability.availablePhaseKinds);
  const sectionIds = new Set(manifest.phases
    .filter((phase) => availableIds.has(phase.id) && availableKinds.has(phase.kind))
    .flatMap((phase) => phase.sectionId ? [phase.sectionId] : []));
  return manifest.questions.filter(({ sectionId }) => sectionId !== undefined && sectionIds.has(sectionId));
}

function visibleResourceKeys(manifest: PaperManifest, questions: readonly PaperQuestion[]): Set<string> {
  const referenced = new Set(manifest.questions.flatMap(({ resourceKeys }) => resourceKeys));
  const visible = new Set(questions.flatMap(({ resourceKeys }) => resourceKeys));
  for (const resource of manifest.resources) {
    if (!referenced.has(resource.key)) visible.add(resource.key);
  }
  return visible;
}

export function candidateVisibleManifest(
  manifest: PaperManifest,
  availability: ExamPhaseAvailability,
): PaperManifest {
  const questions = visibleQuestions(manifest, availability);
  const resourceKeys = visibleResourceKeys(manifest, questions);
  return {
    ...manifest,
    resources: manifest.resources.filter(({ key }) => resourceKeys.has(key)),
    questions: questions.map(({ markingGuidance: _markingGuidance, ...question }) => question),
  };
}

export function candidateAssetAuthorized(
  manifest: PaperManifest,
  assetKey: string,
  availability: ExamPhaseAvailability,
): boolean {
  const questions = visibleQuestions(manifest, availability);
  return manifest.resources.some(({ key }) => key === assetKey)
    && visibleResourceKeys(manifest, questions).has(assetKey);
}
