import { describe, expect, test } from "bun:test";
import {
  AudioPlaybackError,
  AudioPlaybackTickets,
  type AudioPlaybackIdentity,
} from "./audio-playback.ts";

const listener: AudioPlaybackIdentity = {
  studentId: "student-1",
  sessionId: "session-1",
  paperId: "paper-1",
  resourceKey: "recording-1",
  responseId: "response-1",
};

function errorFrom(action: () => unknown): AudioPlaybackError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(AudioPlaybackError);
    return error as AudioPlaybackError;
  }
  throw new Error("Expected AudioPlaybackError");
}

function harness() {
  let now = 1_000;
  let sequence = 0;
  const tickets = new AudioPlaybackTickets({
    now: () => now,
    token: () => `token-${++sequence}`,
    pendingTtlMs: 1_000,
    activeGraceMs: 100,
    completionRetentionMs: 500,
  });
  return {
    tickets,
    advance(milliseconds: number) { now += milliseconds; },
    deadline: 100_000,
  };
}

describe("audio playback tickets", () => {
  test("issues a token with the production random-token generator", () => {
    const tickets = new AudioPlaybackTickets();
    const issued = tickets.issue(listener, Date.now() + 60_000);
    expect(issued.playToken).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("reuses the one pending ticket for a student, sitting, paper, and resource", () => {
    const { tickets, deadline } = harness();
    expect(tickets.issue(listener, deadline)).toEqual({ playToken: "token-1", reused: false });
    expect(tickets.issue(listener, deadline)).toEqual({ playToken: "token-1", reused: true });
  });

  test("binds a ticket to the complete student and response identity", () => {
    const { tickets, deadline } = harness();
    const { playToken } = tickets.issue(listener, deadline);
    const impostor = { ...listener, studentId: "student-2", responseId: "response-2" };
    const error = errorFrom(() => tickets.claimDownload(playToken, impostor, { method: "GET", rangeHeader: null }));
    expect(error.status).toBe(403);
    expect(error.message).toContain("invalid or expired");

    // A rejected cross-identity attempt does not consume the real listener's ticket.
    expect(() => tickets.claimDownload(playToken, listener, { method: "GET", rangeHeader: null })).not.toThrow();
  });

  test("allows a pre-start full-fetch retry but rejects HEAD, ranges, and post-start replay", () => {
    const { tickets, deadline } = harness();
    const { playToken } = tickets.issue(listener, deadline);

    expect(errorFrom(() => tickets.claimDownload(playToken, listener, {
      method: "HEAD",
      rangeHeader: null,
    })).status).toBe(405);
    expect(errorFrom(() => tickets.claimDownload(playToken, listener, {
      method: "GET",
      rangeHeader: "bytes=0-99",
    })).status).toBe(416);
    tickets.claimDownload(playToken, listener, { method: "GET", rangeHeader: null });
    expect(() => tickets.claimDownload(playToken, listener, {
      method: "GET",
      rangeHeader: null,
    })).not.toThrow();
    tickets.start(playToken, listener, 10, () => 1);
    expect(errorFrom(() => tickets.claimDownload(playToken, listener, {
      method: "GET",
      rangeHeader: null,
    })).status).toBe(409);
  });

  test("counts only at start, holds one active lock, and completes idempotently", () => {
    const { tickets, deadline } = harness();
    const { playToken } = tickets.issue(listener, deadline);
    let durablePlays = 0;
    tickets.claimDownload(playToken, listener, { method: "GET", rangeHeader: null });
    expect(durablePlays).toBe(0);

    const started = tickets.start(playToken, listener, 12.25, () => ++durablePlays);
    expect(started).toEqual({ plays: 1, maxPlays: 2, activeUntil: 13_350 });
    expect(tickets.start(playToken, listener, 12.25, () => ++durablePlays)).toEqual(started);
    expect(errorFrom(() => tickets.issue(listener, deadline)).status).toBe(409);
    expect(durablePlays).toBe(1);

    const completed = tickets.complete(playToken, listener);
    expect(completed).toMatchObject({ plays: 1, maxPlays: 2 });
    expect(tickets.complete(playToken, listener)).toEqual(completed);
    expect(tickets.issue(listener, deadline)).toEqual({ playToken: "token-2", reused: false });
  });

  test("rejects a start before download and rejects unreasonable duration metadata", () => {
    const { tickets, deadline } = harness();
    const { playToken } = tickets.issue(listener, deadline);
    expect(errorFrom(() => tickets.start(playToken, listener, 10, () => 1)).status).toBe(409);
    tickets.claimDownload(playToken, listener, { method: "GET", rangeHeader: null });
    for (const duration of [Number.NaN, Number.POSITIVE_INFINITY, 0, 21_601]) {
      expect(errorFrom(() => tickets.start(playToken, listener, duration, () => 1)).status).toBe(400);
    }
  });

  test("expires pending tickets without a count and active tickets without a refund", () => {
    const pending = harness();
    expect(pending.tickets.issue(listener, pending.deadline).playToken).toBe("token-1");
    pending.advance(1_001);
    expect(pending.tickets.issue(listener, pending.deadline)).toEqual({ playToken: "token-2", reused: false });

    const active = harness();
    let durablePlays = 0;
    const first = active.tickets.issue(listener, active.deadline).playToken;
    active.tickets.claimDownload(first, listener, { method: "GET", rangeHeader: null });
    active.tickets.start(first, listener, 0.1, () => ++durablePlays);
    active.advance(201);
    const second = active.tickets.issue(listener, active.deadline).playToken;
    expect(second).toBe("token-2");
    expect(durablePlays).toBe(1);
  });
});
