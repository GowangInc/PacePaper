import { describe, expect, test } from "bun:test";
import {
  AUDIO_MAX_PLAYS,
  audioPlayerModel,
  normalizeAudioPlays,
  shouldForceAudioResume,
  shouldRestoreAudioPosition,
} from "./exam-audio.js";

describe("controlled examination audio model", () => {
  test("always exposes exactly a first and final listen", () => {
    expect(AUDIO_MAX_PLAYS).toBe(2);
    expect(normalizeAudioPlays(-1)).toBe(0);
    expect(normalizeAudioPlays(4)).toBe(2);

    const first = audioPlayerModel({ plays: 0 });
    expect(first.buttonLabel).toBe("Start first listen");
    expect(first.buttonDisabled).toBeFalse();

    const final = audioPlayerModel({ plays: 1, lastCompleted: 1 });
    expect(final.buttonLabel).toBe("Start final listen");
    expect(final.statusLabel).toContain("First listen complete");

    const complete = audioPlayerModel({ plays: 2 });
    expect(complete.buttonLabel).toBe("Both listens completed");
    expect(complete.buttonDisabled).toBeTrue();
  });

  test("preparing and playback are interaction-locking phases with explicit labels", () => {
    expect(audioPlayerModel({ phase: "preparing", plays: 0, activeListen: 1 })).toMatchObject({
      busy: true,
      buttonDisabled: true,
      buttonLabel: "Preparing first listen…",
    });
    expect(audioPlayerModel({ phase: "playing", plays: 2, activeListen: 2 })).toMatchObject({
      busy: true,
      buttonDisabled: true,
      buttonLabel: "Final listen in progress",
      statusLabel: "Playback cannot be paused, restarted or moved forwards.",
    });
  });

  test("a browser interruption resumes the same listen without consuming another", () => {
    const interrupted = audioPlayerModel({ phase: "interrupted", plays: 1, activeListen: 1 });
    expect(interrupted.busy).toBeFalse();
    expect(interrupted.buttonLabel).toBe("Continue first listen");
    expect(interrupted.statusLabel).toContain("does not use another listen");
  });

  test("a completed listen must be confirmed before another can start", () => {
    expect(audioPlayerModel({ phase: "completing", plays: 1 })).toMatchObject({
      busy: false,
      buttonDisabled: true,
      buttonLabel: "Saving completed listen…",
    });
    expect(audioPlayerModel({ phase: "completion-error", plays: 1 })).toMatchObject({
      busy: false,
      buttonDisabled: false,
      buttonLabel: "Retry completion confirmation",
    });
  });

  test("unexpected pause and seeking are rejected only during active playback", () => {
    expect(shouldForceAudioResume({ phase: "playing" })).toBeTrue();
    expect(shouldForceAudioResume({ phase: "starting" })).toBeTrue();
    expect(shouldForceAudioResume({ phase: "playing", internalStop: true })).toBeFalse();
    expect(shouldForceAudioResume({ phase: "playing", ended: true })).toBeFalse();
    expect(shouldForceAudioResume({ phase: "idle" })).toBeFalse();

    expect(shouldRestoreAudioPosition({ phase: "playing" })).toBeTrue();
    expect(shouldRestoreAudioPosition({ phase: "playing", internalSeek: true })).toBeFalse();
    expect(shouldRestoreAudioPosition({ phase: "interrupted" })).toBeFalse();
  });

  test("implementation downloads a Blob without Range and keeps native controls hidden", async () => {
    const source = await Bun.file(new URL("./exam-audio.js", import.meta.url)).text();
    expect(source).toContain("const blob = await response.blob()");
    expect(source).toContain('headers: { Accept: "audio/*" }');
    expect(source).not.toContain('Range:');
    expect(source).toContain("audio.hidden = true");
    expect(source).not.toContain("audio.controls");
    expect(source).toContain('"/api/student/audio-play/start"');
    expect(source).toContain('"/api/student/audio-play/complete"');
  });
});
