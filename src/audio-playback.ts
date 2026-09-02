import { AUDIO_PLAY_LIMIT } from "./papers.ts";

const DEFAULT_PENDING_TTL_MS = 5 * 60_000;
const DEFAULT_ACTIVE_GRACE_MS = 15_000;
const DEFAULT_COMPLETION_RETENTION_MS = 2 * 60_000;
const MIN_DURATION_SECONDS = 0.1;
const MAX_DURATION_SECONDS = 6 * 60 * 60;

export interface AudioPlaybackIdentity {
  studentId: string;
  sessionId: string;
  paperId: string;
  resourceKey: string;
  responseId: string;
}

export interface AudioPlaybackIssue {
  playToken: string;
  reused: boolean;
}

export interface AudioPlaybackStart {
  plays: number;
  maxPlays: typeof AUDIO_PLAY_LIMIT;
  activeUntil: number;
}

export type AudioPlaybackCompletion = Pick<AudioPlaybackStart, "plays" | "maxPlays">;

export class AudioPlaybackError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AudioPlaybackError";
  }
}

type TicketState = "pending" | "downloaded" | "active" | "completed";

interface AudioPlaybackTicket extends AudioPlaybackIdentity {
  token: string;
  state: TicketState;
  expiresAt: number;
  plays: number | null;
}

interface AudioPlaybackTicketOptions {
  now?: () => number;
  token?: () => string;
  pendingTtlMs?: number;
  activeGraceMs?: number;
  completionRetentionMs?: number;
}

function identityKey(identity: AudioPlaybackIdentity): string {
  return JSON.stringify([
    identity.studentId,
    identity.sessionId,
    identity.paperId,
    identity.resourceKey,
    identity.responseId,
  ]);
}

function sameIdentity(ticket: AudioPlaybackTicket, expected: AudioPlaybackIdentity): boolean {
  return ticket.studentId === expected.studentId
    && ticket.sessionId === expected.sessionId
    && ticket.paperId === expected.paperId
    && ticket.resourceKey === expected.resourceKey
    && ticket.responseId === expected.responseId;
}

/**
 * Owns the short-lived authorization state around complete audio downloads.
 * The durable play count remains in SQLite and is incremented only by start().
 */
export class AudioPlaybackTickets {
  readonly #byToken = new Map<string, AudioPlaybackTicket>();
  readonly #tokenByIdentity = new Map<string, string>();
  readonly #now: () => number;
  readonly #token: () => string;
  readonly #pendingTtlMs: number;
  readonly #activeGraceMs: number;
  readonly #completionRetentionMs: number;

  constructor(options: AudioPlaybackTicketOptions = {}) {
    this.#now = options.now ?? Date.now;
    this.#token = options.token ?? (() => crypto.randomUUID());
    this.#pendingTtlMs = options.pendingTtlMs ?? DEFAULT_PENDING_TTL_MS;
    this.#activeGraceMs = options.activeGraceMs ?? DEFAULT_ACTIVE_GRACE_MS;
    this.#completionRetentionMs = options.completionRetentionMs ?? DEFAULT_COMPLETION_RETENTION_MS;
  }

  issue(identity: AudioPlaybackIdentity, examinationDeadline: number): AudioPlaybackIssue {
    const now = this.#now();
    const key = identityKey(identity);
    const existingToken = this.#tokenByIdentity.get(key);
    if (existingToken) {
      const existing = this.#liveTicket(existingToken);
      if (existing?.state === "active") {
        throw new AudioPlaybackError("Audio playback is already active", 409);
      }
      if (existing?.state === "pending" || existing?.state === "downloaded") {
        return { playToken: existing.token, reused: true };
      }
      if (existing) this.#remove(existing);
    }

    const expiresAt = Math.min(examinationDeadline, now + this.#pendingTtlMs);
    if (!Number.isFinite(examinationDeadline) || expiresAt <= now) {
      throw new AudioPlaybackError("Audio is no longer available", 409);
    }

    const token = this.#token();
    const ticket: AudioPlaybackTicket = {
      ...identity,
      token,
      state: "pending",
      expiresAt,
      plays: null,
    };
    this.#byToken.set(token, ticket);
    this.#tokenByIdentity.set(key, token);
    return { playToken: token, reused: false };
  }

  claimDownload(
    playToken: string,
    identity: AudioPlaybackIdentity,
    request: { method: string; rangeHeader: string | null },
  ): void {
    const ticket = this.#ticketFor(playToken, identity);
    if (request.method.toUpperCase() !== "GET") {
      throw new AudioPlaybackError("Audio must be downloaded with GET", 405);
    }
    if (request.rangeHeader !== null) {
      throw new AudioPlaybackError("Partial audio downloads are not available", 416);
    }
    if (ticket.state !== "pending" && ticket.state !== "downloaded") {
      throw new AudioPlaybackError("This audio download has already been used", 409);
    }
    ticket.state = "downloaded";
  }

  start(
    playToken: string,
    identity: AudioPlaybackIdentity,
    durationSeconds: number,
    incrementPlay: () => number,
  ): AudioPlaybackStart {
    const ticket = this.#ticketFor(playToken, identity);
    if (!Number.isFinite(durationSeconds)
      || durationSeconds < MIN_DURATION_SECONDS
      || durationSeconds > MAX_DURATION_SECONDS) {
      throw new AudioPlaybackError("Audio duration is invalid", 400);
    }
    if (ticket.state === "active" && ticket.plays !== null) {
      return { plays: ticket.plays, maxPlays: AUDIO_PLAY_LIMIT, activeUntil: ticket.expiresAt };
    }
    if (ticket.state !== "downloaded") {
      throw new AudioPlaybackError("Download the complete audio before starting playback", 409);
    }

    // incrementPlay is synchronous and transactional. If it fails, the ticket
    // remains downloaded so a transient database failure does not consume it.
    const plays = incrementPlay();
    if (!Number.isInteger(plays) || plays < 1 || plays > AUDIO_PLAY_LIMIT) {
      throw new Error("Audio play counter returned an invalid value");
    }
    const activeUntil = this.#now() + Math.ceil(durationSeconds * 1_000) + this.#activeGraceMs;
    ticket.state = "active";
    ticket.plays = plays;
    ticket.expiresAt = activeUntil;
    return { plays, maxPlays: AUDIO_PLAY_LIMIT, activeUntil };
  }

  complete(playToken: string, identity: AudioPlaybackIdentity): AudioPlaybackCompletion {
    const ticket = this.#ticketFor(playToken, identity);
    if (ticket.state === "completed" && ticket.plays !== null) {
      return { plays: ticket.plays, maxPlays: AUDIO_PLAY_LIMIT };
    }
    if (ticket.state !== "active" || ticket.plays === null) {
      throw new AudioPlaybackError("Audio playback has not started", 409);
    }
    ticket.state = "completed";
    ticket.expiresAt = this.#now() + this.#completionRetentionMs;
    return { plays: ticket.plays, maxPlays: AUDIO_PLAY_LIMIT };
  }

  #ticketFor(playToken: string, identity: AudioPlaybackIdentity): AudioPlaybackTicket {
    const ticket = this.#liveTicket(playToken);
    if (!ticket || !sameIdentity(ticket, identity)) {
      throw new AudioPlaybackError("Audio authorization is invalid or expired", 403);
    }
    return ticket;
  }

  #liveTicket(playToken: string): AudioPlaybackTicket | null {
    const ticket = this.#byToken.get(playToken);
    if (!ticket) return null;
    if (ticket.expiresAt <= this.#now()) {
      this.#remove(ticket);
      return null;
    }
    return ticket;
  }

  #remove(ticket: AudioPlaybackTicket): void {
    this.#byToken.delete(ticket.token);
    const key = identityKey(ticket);
    if (this.#tokenByIdentity.get(key) === ticket.token) this.#tokenByIdentity.delete(key);
  }
}
