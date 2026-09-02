export const AUDIO_MAX_PLAYS = 2;

const BUSY_PHASES = new Set(["preparing", "starting", "playing", "resuming"]);
const RESUMABLE_PHASES = new Set(["starting", "playing", "resuming"]);

export function normalizeAudioPlays(value) {
  const plays = Number.isInteger(value) ? value : 0;
  return Math.max(0, Math.min(AUDIO_MAX_PLAYS, plays));
}

function listenName(number) {
  return number === 2 ? "final listen" : "first listen";
}

export function audioPlayerModel({ phase = "idle", plays = 0, activeListen = null, lastCompleted = 0 } = {}) {
  const used = normalizeAudioPlays(plays);
  const listen = activeListen ?? Math.min(AUDIO_MAX_PLAYS, used + 1);
  const namedListen = listenName(listen);
  const busy = BUSY_PHASES.has(phase);

  if (phase === "stopped") {
    return {
      busy: false,
      buttonDisabled: true,
      buttonLabel: "Examination ended",
      countLabel: `${used} of ${AUDIO_MAX_PLAYS} listens used`,
      statusLabel: "Playback stopped because examination time ended.",
    };
  }
  if (phase === "preparing") {
    return {
      busy,
      buttonDisabled: true,
      buttonLabel: `Preparing ${namedListen}…`,
      countLabel: `${used} of ${AUDIO_MAX_PLAYS} listens used`,
      statusLabel: "Downloading the complete recording before playback begins…",
    };
  }
  if (phase === "starting" || phase === "resuming") {
    return {
      busy,
      buttonDisabled: true,
      buttonLabel: phase === "resuming" ? `Continuing ${namedListen}…` : `Starting ${namedListen}…`,
      countLabel: `Listen ${listen} of ${AUDIO_MAX_PLAYS}`,
      statusLabel: `${namedListen[0].toUpperCase()}${namedListen.slice(1)} is starting from the ${phase === "starting" ? "beginning" : "same position"}.`,
    };
  }
  if (phase === "playing") {
    return {
      busy,
      buttonDisabled: true,
      buttonLabel: `${namedListen[0].toUpperCase()}${namedListen.slice(1)} in progress`,
      countLabel: `Listen ${listen} of ${AUDIO_MAX_PLAYS} · in progress`,
      statusLabel: "Playback cannot be paused, restarted or moved forwards.",
    };
  }
  if (phase === "interrupted") {
    return {
      busy: false,
      buttonDisabled: false,
      buttonLabel: `Continue ${namedListen}`,
      countLabel: `Listen ${listen} of ${AUDIO_MAX_PLAYS} · interrupted`,
      statusLabel: "The browser interrupted playback. Continue the same listen; this does not use another listen.",
    };
  }
  if (phase === "completing") {
    return {
      busy: false,
      buttonDisabled: true,
      buttonLabel: "Saving completed listen…",
      countLabel: `${used} of ${AUDIO_MAX_PLAYS} listens used`,
      statusLabel: "The complete listen is being confirmed.",
    };
  }
  if (phase === "completion-error") {
    return {
      busy: false,
      buttonDisabled: false,
      buttonLabel: "Retry completion confirmation",
      countLabel: `${used} of ${AUDIO_MAX_PLAYS} listens used`,
      statusLabel: "The complete listen was not confirmed. Retry before starting another listen.",
    };
  }
  if (phase === "error") {
    return {
      busy: false,
      buttonDisabled: false,
      buttonLabel: `Retry ${namedListen}`,
      countLabel: `${used} of ${AUDIO_MAX_PLAYS} listens used`,
      statusLabel: "The recording could not be prepared. Retry when the connection is stable.",
    };
  }
  if (used >= AUDIO_MAX_PLAYS) {
    return {
      busy: false,
      buttonDisabled: true,
      buttonLabel: "Both listens completed",
      countLabel: `${AUDIO_MAX_PLAYS} of ${AUDIO_MAX_PLAYS} listens used`,
      statusLabel: "Both complete listens have been used.",
    };
  }
  return {
    busy: false,
    buttonDisabled: false,
    buttonLabel: `Start ${listenName(used + 1)}`,
    countLabel: `${used} of ${AUDIO_MAX_PLAYS} listens used`,
    statusLabel: lastCompleted === 1
      ? "First listen complete. Your final listen is available."
      : `Your ${listenName(used + 1)} is available.`,
  };
}

export function shouldForceAudioResume({ phase, ended = false, internalStop = false }) {
  return !ended && !internalStop && RESUMABLE_PHASES.has(phase);
}

export function shouldRestoreAudioPosition({ phase, internalSeek = false }) {
  return !internalSeek && RESUMABLE_PHASES.has(phase);
}

function createButton(label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function createText(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function waitForMetadata(audio, operationSignal) {
  if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
    return Promise.resolve(audio.duration);
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("The recording metadata did not load in time.")), 20_000);
    const finish = (error = null) => {
      clearTimeout(timeout);
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("error", failed);
      operationSignal.removeEventListener("abort", aborted);
      if (error) reject(error); else resolve(audio.duration);
    };
    const loaded = () => Number.isFinite(audio.duration) && audio.duration > 0
      ? finish()
      : finish(new Error("The recording has an invalid duration."));
    const failed = () => finish(new Error("The recording could not be decoded."));
    const aborted = () => finish(new DOMException("Audio preparation was stopped.", "AbortError"));
    audio.addEventListener("loadedmetadata", loaded, { once: true });
    audio.addEventListener("error", failed, { once: true });
    operationSignal.addEventListener("abort", aborted, { once: true });
  });
}

export function createExamAudioController({
  sessionId,
  draftAudioPlays,
  shell,
  signal,
  api,
  announce,
  formatTime,
  isLocked,
  onBusyChange,
  fetchAsset = globalThis.fetch,
  createObjectUrl = (blob) => URL.createObjectURL(blob),
  revokeObjectUrl = (url) => URL.revokeObjectURL(url),
}) {
  const players = new Map();
  const completedTokens = new Set();
  let priorBusy = false;
  let playerSequence = 0;
  let disposed = false;

  function isBusy() {
    return [...players.values()].some((player) => BUSY_PHASES.has(player.phase));
  }

  function reportBusyChange() {
    const busy = isBusy();
    shell.dataset.audioPlaying = String(busy);
    if (busy !== priorBusy) {
      priorBusy = busy;
      onBusyChange(busy);
    }
  }

  function updatePlayer(player) {
    const model = audioPlayerModel(player);
    player.root.dataset.phase = player.phase;
    player.play.textContent = model.buttonLabel;
    player.play.disabled = model.buttonDisabled || isLocked() || disposed;
    player.count.textContent = model.countLabel;
    player.status.textContent = model.statusLabel;
    reportBusyChange();
  }

  function setPhase(player, phase) {
    player.phase = phase;
    updatePlayer(player);
  }

  function clearStallTimer(player) {
    clearTimeout(player.stallTimer);
    player.stallTimer = null;
  }

  function setCurrentTime(player, value) {
    player.internalSeek = true;
    try {
      player.audio.currentTime = Math.max(0, value);
    } catch {
      // Metadata can briefly become unavailable while a decoded Blob is reattached.
    }
    queueMicrotask(() => { player.internalSeek = false; });
  }

  function clearMedia(player) {
    player.internalStop = true;
    player.audio.pause();
    player.audio.removeAttribute("src");
    player.audio.load();
    player.internalStop = false;
    if (player.objectUrl) revokeObjectUrl(player.objectUrl);
    player.objectUrl = null;
    player.duration = null;
  }

  function cancelOperation(player) {
    player.operation?.abort();
    player.operation = null;
    clearStallTimer(player);
  }

  function interrupt(player, message, discardMedia = false) {
    if (disposed || player.phase === "stopped") return;
    player.internalStop = true;
    player.audio.pause();
    player.internalStop = false;
    if (discardMedia) clearMedia(player);
    setPhase(player, player.started ? "interrupted" : "error");
    announce(message, "error");
  }

  async function resumePlayback(player, automatic = false, fromBeginning = false) {
    if (player.resumePromise || disposed || !player.objectUrl) return player.resumePromise;
    if (fromBeginning) {
      player.lastPosition = 0;
      setCurrentTime(player, 0);
    } else if (Math.abs(player.audio.currentTime - player.lastPosition) > 0.35) {
      setCurrentTime(player, player.lastPosition);
    }
    setPhase(player, automatic ? "resuming" : player.hasBegun ? "resuming" : "starting");
    player.resumePromise = player.audio.play()
      .then(() => {
        if (!disposed && player.phase !== "stopped") {
          player.hasBegun = true;
          setPhase(player, "playing");
        }
      })
      .catch((error) => {
        if (disposed || player.phase === "stopped") return;
        setPhase(player, "interrupted");
        const message = automatic
          ? "The browser interrupted the recording and could not resume it automatically. Continue the same listen."
          : "The recording is ready, but the browser blocked playback. Press Continue; no extra listen will be used.";
        announce(error instanceof Error && error.name !== "NotAllowedError" ? `${message} ${error.message}` : message, "error");
      })
      .finally(() => { player.resumePromise = null; });
    return player.resumePromise;
  }

  async function issueTicket(player, operationSignal) {
    if (player.ticket) return;
    const result = await api("/api/student/audio-play", {
      method: "POST",
      body: { sessionId, resourceKey: player.resource.key },
      signal: operationSignal,
    });
    if (!result || typeof result.playToken !== "string" || typeof result.url !== "string") {
      throw new Error("The server did not return a valid audio ticket.");
    }
    player.plays = normalizeAudioPlays(result.plays);
    player.activeListen = Math.min(AUDIO_MAX_PLAYS, player.plays + 1);
    player.ticket = { playToken: result.playToken, url: result.url };
  }

  async function downloadCompleteAsset(player, operationSignal) {
    if (player.objectUrl) return;
    const response = await fetchAsset(player.ticket.url, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "audio/*" },
      signal: operationSignal,
    });
    if (!response.ok) throw new Error(`The recording download failed (${response.status}).`);
    const blob = await response.blob();
    if (blob.size === 0) throw new Error("The recording download was empty.");
    player.objectUrl = createObjectUrl(blob);
    player.audio.src = player.objectUrl;
    player.audio.load();
    player.duration = await waitForMetadata(player.audio, operationSignal);
  }

  async function commitListen(player, operationSignal) {
    if (player.started) return;
    setPhase(player, "starting");
    const result = await api("/api/student/audio-play/start", {
      method: "POST",
      body: {
        sessionId,
        resourceKey: player.resource.key,
        playToken: player.ticket.playToken,
        durationSeconds: player.duration,
      },
      signal: operationSignal,
    });
    const plays = normalizeAudioPlays(result?.plays);
    if (plays < 1) throw new Error("The server did not start the audio listen.");
    player.plays = plays;
    player.activeListen = plays;
    player.started = true;
    player.hasBegun = false;
    draftAudioPlays[player.resource.key] = plays;
  }

  async function prepareAndPlay(player) {
    if (disposed || isLocked() || BUSY_PHASES.has(player.phase)) return;
    if (!player.started && player.plays >= AUDIO_MAX_PLAYS) return;
    cancelOperation(player);
    player.operation = new AbortController();
    const operationSignal = player.operation.signal;
    setPhase(player, "preparing");
    try {
      await issueTicket(player, operationSignal);
      await downloadCompleteAsset(player, operationSignal);
      await commitListen(player, operationSignal);
      player.operation = null;
      await resumePlayback(player, false, !player.hasBegun);
    } catch (error) {
      player.operation = null;
      if (operationSignal.aborted || disposed || player.phase === "stopped") return;
      setPhase(player, player.started ? "interrupted" : "error");
      announce(error instanceof Error ? error.message : "The recording could not start.", "error");
    }
  }

  async function confirmCompletion(player) {
    if (!player.ticket || player.completionPromise) return player.completionPromise;
    const { playToken } = player.ticket;
    setPhase(player, "completing");
    player.completionPromise = (async () => {
      let lastError;
      for (const delay of [0, 500, 1_500]) {
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        try {
          const result = await api("/api/student/audio-play/complete", {
            method: "POST",
            body: { sessionId, resourceKey: player.resource.key, playToken },
            keepalive: true,
          });
          if (player.ticket?.playToken !== playToken) return;
          player.plays = normalizeAudioPlays(result?.plays ?? player.plays);
          draftAudioPlays[player.resource.key] = player.plays;
          completedTokens.add(playToken);
          player.ticket = null;
          setPhase(player, "idle");
          return;
        } catch (error) {
          lastError = error;
        }
      }
      if (!disposed && player.ticket?.playToken === playToken) {
        setPhase(player, "completion-error");
        announce(
          lastError instanceof Error
            ? `The completed listen could not be confirmed. ${lastError.message}`
            : "The completed listen could not be confirmed.",
          "error",
        );
      }
    })().finally(() => { player.completionPromise = null; });
    return player.completionPromise;
  }

  function completeListen(player) {
    if (!player.started || !player.ticket || completedTokens.has(player.ticket.playToken)) return;
    const completedListen = player.activeListen;
    player.lastCompleted = completedListen;
    player.started = false;
    player.hasBegun = false;
    player.activeListen = null;
    player.lastPosition = 0;
    clearStallTimer(player);
    player.phase = "completing";
    clearMedia(player);
    player.progress.value = 0;
    player.time.textContent = "00:00 / --:--";
    void confirmCompletion(player);
  }

  function bindPlayer(player) {
    const { audio } = player;
    player.volume.addEventListener("input", () => { audio.volume = Number(player.volume.value); }, { signal });
    player.play.addEventListener("click", () => {
      if (player.phase === "completion-error") void confirmCompletion(player);
      else if (player.started && player.objectUrl) void resumePlayback(player, false, false);
      else void prepareAndPlay(player);
    }, { signal });
    audio.addEventListener("loadedmetadata", () => {
      player.duration = Number.isFinite(audio.duration) ? audio.duration : player.duration;
      player.time.textContent = `00:00 / ${Number.isFinite(audio.duration) ? formatTime(audio.duration * 1000) : "--:--"}`;
    }, { signal });
    audio.addEventListener("timeupdate", () => {
      if (!audio.seeking && Number.isFinite(audio.currentTime)) player.lastPosition = audio.currentTime;
      player.progress.value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      player.time.textContent = `${formatTime(audio.currentTime * 1000)} / ${Number.isFinite(audio.duration) ? formatTime(audio.duration * 1000) : "--:--"}`;
      clearStallTimer(player);
    }, { signal });
    audio.addEventListener("seeking", () => {
      if (shouldRestoreAudioPosition({ phase: player.phase, internalSeek: player.internalSeek })) {
        setCurrentTime(player, player.lastPosition);
      }
    }, { signal });
    audio.addEventListener("ratechange", () => {
      if (audio.playbackRate !== 1) audio.playbackRate = 1;
    }, { signal });
    audio.addEventListener("pause", () => {
      if (shouldForceAudioResume({ phase: player.phase, ended: audio.ended, internalStop: player.internalStop })) {
        void resumePlayback(player, true, false);
      }
    }, { signal });
    audio.addEventListener("playing", () => {
      clearStallTimer(player);
      if (player.started && !disposed) {
        player.hasBegun = true;
        setPhase(player, "playing");
      }
    }, { signal });
    audio.addEventListener("ended", () => completeListen(player), { signal });
    audio.addEventListener("stalled", () => {
      if (!RESUMABLE_PHASES.has(player.phase)) return;
      clearStallTimer(player);
      const stalledAt = audio.currentTime;
      player.stallTimer = setTimeout(() => {
        if (RESUMABLE_PHASES.has(player.phase) && Math.abs(audio.currentTime - stalledAt) < 0.1) {
          interrupt(player, "The browser stalled the recording. Continue the same listen; no extra listen will be used.");
        }
      }, 5_000);
    }, { signal });
    audio.addEventListener("abort", () => {
      if (shouldForceAudioResume({ phase: player.phase, ended: audio.ended, internalStop: player.internalStop })) {
        void resumePlayback(player, true, false);
      }
    }, { signal });
    audio.addEventListener("error", () => {
      if (player.phase === "preparing" || player.internalStop || disposed) return;
      interrupt(player, "The browser could not continue the recording. Continue the same listen; no extra listen will be used.");
    }, { signal });
  }

  function createPlayer(resource) {
    const id = `exam-audio-${++playerSequence}`;
    const root = document.createElement("section");
    root.className = "audio-player";
    root.setAttribute("aria-labelledby", `${id}-title`);
    const introduction = document.createElement("header");
    introduction.className = "audio-introduction";
    const eyebrow = createText("p", "eyebrow", "Listening recording");
    const title = createText("h3", "audio-title", "Two complete listens");
    title.id = `${id}-title`;
    const instructions = createText(
      "p",
      "audio-instructions",
      "Each listen starts at the beginning. Once playback begins, it cannot be paused, restarted or moved forwards.",
    );
    introduction.append(eyebrow, title, instructions);
    const status = createText("p", "audio-state", "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const progressLabel = createText("span", "visually-hidden", "Recording playback progress");
    progressLabel.id = `${id}-progress-label`;
    const progress = document.createElement("progress");
    progress.max = 1;
    progress.value = 0;
    progress.setAttribute("aria-labelledby", progressLabel.id);
    const play = createButton("", "audio-play");
    const time = createText("span", "audio-time", "00:00 / --:--");
    const volumeLabel = document.createElement("label");
    volumeLabel.className = "volume-control";
    volumeLabel.append(document.createTextNode("Volume "));
    const volume = document.createElement("input");
    volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.05";
    volume.value = "1";
    volume.setAttribute("aria-label", "Audio volume");
    volumeLabel.append(volume);
    const count = createText("strong", "play-count", "");
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.hidden = true;
    root.append(introduction, status, progressLabel, progress, play, time, volumeLabel, count, audio);
    const player = {
      resource,
      root,
      audio,
      play,
      progress,
      time,
      volume,
      count,
      status,
      phase: "idle",
      plays: normalizeAudioPlays(draftAudioPlays[resource.key]),
      activeListen: null,
      lastCompleted: 0,
      ticket: null,
      objectUrl: null,
      duration: null,
      operation: null,
      resumePromise: null,
      completionPromise: null,
      started: false,
      hasBegun: false,
      internalStop: false,
      internalSeek: false,
      lastPosition: 0,
      stallTimer: null,
    };
    bindPlayer(player);
    updatePlayer(player);
    return player;
  }

  function render(resource) {
    let player = players.get(resource.key);
    if (!player) {
      player = createPlayer(resource);
      players.set(resource.key, player);
    }
    updatePlayer(player);
    return player.root;
  }

  function stopForDeadline() {
    for (const player of players.values()) {
      if (!BUSY_PHASES.has(player.phase)) continue;
      cancelOperation(player);
      player.internalStop = true;
      player.audio.pause();
      player.internalStop = false;
      setPhase(player, "stopped");
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const player of players.values()) {
      cancelOperation(player);
      clearMedia(player);
    }
    reportBusyChange();
  }

  signal.addEventListener("abort", dispose, { once: true });

  return { dispose, isBusy, render, stopForDeadline };
}
