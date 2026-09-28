import { describe, expect, test } from "bun:test";
import { nextResponseRevision, sessionEndReadiness } from "./response-concurrency.ts";
import type { CandidateResponseState } from "./response-concurrency.ts";

const candidate = (id: string, state: CandidateResponseState) => ({
  id,
  state,
});

describe("response revision concurrency", () => {
  test("returns typed conflict details for a stale save", () => {
    expect(nextResponseRevision(3, 4)).toEqual({
      ok: false,
      status: 409,
      details: {
        code: "response_revision_conflict",
        expectedRevision: 3,
        currentRevision: 4,
      },
    });
  });

  test("advances a save from the matching revision", () => {
    expect(nextResponseRevision(4, 4)).toEqual({ ok: true, nextRevision: 5 });
  });

  test("rejects revisions that cannot advance monotonically", () => {
    for (const revision of [-1, 0.5, Number.MAX_SAFE_INTEGER]) {
      expect(() => nextResponseRevision(revision, 0)).toThrow(RangeError);
    }
  });
});

describe("session ending readiness", () => {
  test("allows ending when every candidate response is acknowledged", () => {
    expect(sessionEndReadiness([
      candidate("saved", "saved"),
      candidate("submitted", "submitted"),
    ])).toEqual({
      canFinalize: true,
      unresolvedCandidates: [],
      overrideReason: null,
    });
  });

  test("blocks pending, offline, and disconnected candidates", () => {
    const unresolved = [
      candidate("pending", "pending"),
      candidate("offline", "offline"),
      candidate("disconnected", "disconnected"),
    ];
    expect(sessionEndReadiness([
      candidate("saved", "saved"),
      ...unresolved,
    ])).toEqual({
      canFinalize: false,
      unresolvedCandidates: unresolved,
      overrideReason: null,
    });
  });

  test("requires an explicit non-empty teacher override reason", () => {
    const candidates = [candidate("pending", "pending")];
    expect(sessionEndReadiness(candidates, "   ").canFinalize).toBeFalse();
    expect(sessionEndReadiness(candidates, "Candidate device was collected")).toEqual({
      canFinalize: true,
      unresolvedCandidates: candidates,
      overrideReason: "Candidate device was collected",
    });
  });
});
