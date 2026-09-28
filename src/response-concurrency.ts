export interface ResponseRevisionConflictDetails {
  code: "response_revision_conflict";
  expectedRevision: number;
  currentRevision: number;
}

export type ResponseRevisionResult =
  | { ok: true; nextRevision: number }
  | { ok: false; status: 409; details: ResponseRevisionConflictDetails };

function assertRevision(name: string, revision: number): void {
  if (!Number.isSafeInteger(revision) || revision < 0 || revision >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${name} must be a non-negative integer below Number.MAX_SAFE_INTEGER`);
  }
}

export function nextResponseRevision(expectedRevision: number, currentRevision: number): ResponseRevisionResult {
  assertRevision("expectedRevision", expectedRevision);
  assertRevision("currentRevision", currentRevision);
  if (expectedRevision !== currentRevision) {
    return {
      ok: false,
      status: 409,
      details: { code: "response_revision_conflict", expectedRevision, currentRevision },
    };
  }
  return { ok: true, nextRevision: currentRevision + 1 };
}

export type CandidateResponseState = "saved" | "pending" | "offline" | "submitted" | "disconnected";

export interface CandidateEndState {
  id: string;
  name?: string;
  state: CandidateResponseState;
}

export interface SessionEndReadiness {
  canFinalize: boolean;
  unresolvedCandidates: readonly CandidateEndState[];
  overrideReason: string | null;
}

export function unresolvedCandidates(candidates: readonly CandidateEndState[]): CandidateEndState[] {
  return candidates.filter(({ state }) => state !== "saved" && state !== "submitted");
}

export function sessionEndReadiness(
  candidates: readonly CandidateEndState[],
  teacherOverrideReason?: string,
): SessionEndReadiness {
  const unresolved = unresolvedCandidates(candidates);
  const overrideReason = teacherOverrideReason?.trim() || null;
  return {
    canFinalize: unresolved.length === 0 || overrideReason !== null,
    unresolvedCandidates: unresolved,
    overrideReason,
  };
}
