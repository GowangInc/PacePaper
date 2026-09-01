import { ApiError, api, connectSocket, setView } from "/app.js";
import {
  chooseCountdownSession,
  configFromSession,
  countdownPhase,
  formatCountdown,
  resolveStartAt,
} from "/countdown-model.js";

let adminState;
let displayConfig;
let timeAnchor = { serverAt: Date.now(), monotonicAt: performance.now() };
let tickTimer;
let syncTimer;
let stopSocket;
let lastAnnouncedPhase = "";
let displayCustomised = false;
let formDirty = false;
let syncInFlight = false;
let syncPending = false;

const phaseDescriptions = {
  ready: "The saved examination is ready but has not been started.",
  "before-start": "The examination has not started.",
  reading: "Reading time is in progress. Students should not enter responses.",
  writing: "Writing time is in progress.",
  "standard-ended": "Standard writing time has ended. Candidate-specific extra time may still be in progress.",
  ended: "The examination time has ended.",
};

function authoritativeNow() {
  return timeAnchor.serverAt + (performance.now() - timeAnchor.monotonicAt);
}

function toDateTimeLocal(timestamp) {
  const date = new Date(timestamp);
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((part) => String(part).padStart(2, "0"));
  return `${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}:${parts[5]}`;
}

function wallTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

function statusLabel(status) {
  return status === "live" ? "Live" : status === "draft" ? "Ready" : "Ended";
}

function setStatus(message, tone = "info") {
  const region = document.querySelector("#global-status");
  region.textContent = message;
  region.dataset.tone = tone;
  region.hidden = !message;
}

function renderUnavailable(title, message, actionLabel = "Return to teacher dashboard") {
  document.title = "Examination clock | DigitalDP";
  setView(`
    <section class="auth-shell">
      <a class="back-link" href="/admin">← Teacher dashboard</a>
      <div class="auth-panel">
        <span class="product-mark" aria-hidden="true">DP</span>
        <p class="eyebrow">Second-screen countdown</p>
        <h1 id="clock-error-title"></h1>
        <p id="clock-auth-message"></p>
        <a id="clock-error-action" class="primary-link" href="/admin"></a>
      </div>
    </section>
  `);
  document.querySelector("#clock-error-title").textContent = title;
  document.querySelector("#clock-auth-message").textContent = message;
  document.querySelector("#clock-error-action").textContent = actionLabel;
}

function populateSessionOptions(selectedId) {
  const select = document.querySelector("#clock-session");
  select.replaceChildren();
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Custom countdown";
  select.append(custom);

  for (const status of ["live", "draft", "ended"]) {
    const sessions = adminState.sessions.filter((session) => session.status === status);
    if (sessions.length === 0) continue;
    const group = document.createElement("optgroup");
    group.label = status === "live" ? "Ongoing exams" : status === "draft" ? "Ready exams" : "Recent ended exams";
    for (const session of sessions) {
      const option = document.createElement("option");
      option.value = session.id;
      option.textContent = `${statusLabel(session.status)} · ${session.paperTitle} · ${session.className}`;
      group.append(option);
    }
    select.append(group);
  }
  select.value = adminState.sessions.some((session) => session.id === selectedId) ? selectedId : "custom";
}

function fillForm(config) {
  document.querySelector("#clock-title-input").value = config.title;
  document.querySelector("#clock-subtitle-input").value = config.subtitle;
  const startInput = document.querySelector("#clock-start-input");
  startInput.value = toDateTimeLocal(config.startAt);
  startInput.dataset.loadedValue = startInput.value;
  startInput.dataset.exactTimestamp = String(config.startAt);
  document.querySelector("#clock-reading-input").value = String(config.readingTimeMinutes);
  document.querySelector("#clock-writing-input").value = String(config.durationMinutes);
}

function configFromForm() {
  const form = document.querySelector("#clock-form");
  if (!form.reportValidity()) return null;
  const titleInput = document.querySelector("#clock-title-input");
  const title = titleInput.value.trim();
  titleInput.setCustomValidity(title ? "" : "Enter a display title");
  if (!title) {
    titleInput.reportValidity();
    return null;
  }
  const startInput = document.querySelector("#clock-start-input");
  const startAt = resolveStartAt(startInput.value, startInput.dataset.loadedValue, startInput.dataset.exactTimestamp);
  if (!Number.isFinite(startAt)) {
    setStatus("Choose a valid start date and time.", "error");
    return null;
  }
  return {
    sessionId: document.querySelector("#clock-session").value,
    sessionStatus: "custom",
    title,
    subtitle: document.querySelector("#clock-subtitle-input").value.trim(),
    startAt,
    readingTimeMinutes: Number(document.querySelector("#clock-reading-input").value),
    durationMinutes: Number(document.querySelector("#clock-writing-input").value),
  };
}

function updateSchedule(config) {
  const phase = countdownPhase(config, authoritativeNow());
  if (phase.phase === "ready") {
    document.querySelector("#clock-starts-at").textContent = "—";
    document.querySelector("#clock-writing-at").textContent = "—";
    document.querySelector("#clock-ends-at").textContent = "—";
    return;
  }
  document.querySelector("#clock-starts-at").textContent = wallTime(phase.startAt);
  document.querySelector("#clock-writing-at").textContent = config.readingTimeMinutes > 0
    ? wallTime(phase.readingEndsAt)
    : "Immediately";
  document.querySelector("#clock-ends-at").textContent = wallTime(phase.endedAt ?? phase.endsAt);
}

function applyDisplay(config, customised = false) {
  displayConfig = config;
  displayCustomised = customised;
  formDirty = false;
  lastAnnouncedPhase = "";
  document.querySelector("#clock-display-title").textContent = config.title;
  document.querySelector("#clock-display-subtitle").textContent = config.subtitle;
  document.querySelector("#clock-source-status").textContent = customised
    ? "Display adjusted by teacher"
    : config.sessionId === "custom"
      ? "Custom display"
      : config.sessionStatus === "draft"
        ? "Ready exam · waiting for Start"
        : config.sessionStatus === "ended"
          ? "Saved exam ended"
          : "Using live exam timings";
  document.title = `${config.title} clock | DigitalDP`;
  updateSchedule(config);
  renderTick();
}

function loadSelectedDefaults() {
  const selectedId = document.querySelector("#clock-session").value;
  const session = adminState.sessions.find((item) => item.id === selectedId) ?? null;
  const config = configFromSession(session, authoritativeNow());
  fillForm(config);
  applyDisplay(config, false);
  const url = new URL(location.href);
  if (session) url.searchParams.set("session", session.id);
  else url.searchParams.delete("session");
  history.replaceState(null, "", url);
  setStatus(session
    ? `${statusLabel(session.status)} exam timings loaded. You can adjust this display without changing candidate timers.`
    : "Custom countdown loaded.", "success");
}

function renderTick() {
  if (!displayConfig) return;
  const state = countdownPhase(displayConfig, authoritativeNow());
  const display = document.querySelector("#clock-display");
  display.dataset.phase = state.phase;
  document.querySelector("#clock-phase").textContent = state.label;
  const value = document.querySelector("#clock-value");
  if (state.phase === "ready") {
    value.textContent = "--:--:--";
    value.dateTime = "";
    value.setAttribute("aria-label", "Ready to start");
    document.querySelector("#clock-next").textContent = "Start the exam in the teacher dashboard, or set a display start time here.";
  } else {
    value.textContent = formatCountdown(state.remainingMs);
    value.dateTime = `PT${Math.ceil(state.remainingMs / 1_000)}S`;
    value.setAttribute("aria-label", `${state.label}: ${formatCountdown(state.remainingMs)}`);
    document.querySelector("#clock-next").textContent = ["ended", "standard-ended"].includes(state.phase)
      ? `${state.nextLabel} at ${wallTime(state.endedAt ?? state.endsAt)}`
      : `${state.nextLabel} at ${wallTime(state.phase === "before-start" ? state.startAt : state.phase === "reading" ? state.readingEndsAt : state.endsAt)}`;
  }
  if (lastAnnouncedPhase !== state.phase) {
    document.querySelector("#clock-announcer").textContent = `${state.label}. ${phaseDescriptions[state.phase]}`;
    lastAnnouncedPhase = state.phase;
  }
}

async function fetchState() {
  const requestStarted = performance.now();
  const state = await api("/api/admin/state");
  const responseReceived = performance.now();
  adminState = state;
  timeAnchor = {
    serverAt: state.serverTime + (responseReceived - requestStarted) / 2,
    monotonicAt: responseReceived,
  };
  document.querySelector("#clock-display")?.removeAttribute("data-disconnected");
  const reauth = document.querySelector("#clock-reauth");
  if (reauth) reauth.hidden = true;
  return state;
}

async function refreshSelectedDefaults() {
  const button = document.querySelector("#clock-reset");
  button.disabled = true;
  try {
    const selectedId = document.querySelector("#clock-session").value;
    await fetchState();
    populateSessionOptions(selectedId);
    loadSelectedDefaults();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not reload exam timings", "error");
  } finally {
    button.disabled = false;
  }
}

async function synchronizeLifecycle() {
  if (syncInFlight) {
    syncPending = true;
    return;
  }
  syncInFlight = true;
  try {
    const wasDisconnected = document.querySelector("#clock-display")?.hasAttribute("data-disconnected");
    const selectedId = document.querySelector("#clock-session")?.value ?? "custom";
    const previous = adminState?.sessions.find((session) => session.id === selectedId);
    await fetchState();
    if (wasDisconnected) setStatus("Live synchronization restored.", "success");
    const current = adminState.sessions.find((session) => session.id === selectedId);
    populateSessionOptions(current?.id ?? "custom");
    if (!current) {
      if (selectedId !== "custom") setStatus("The selected exam is no longer available. The current display has been left unchanged.", "error");
      return;
    }
    if (!displayCustomised) {
      const preserveFormEdits = formDirty;
      const config = configFromSession(current, authoritativeNow());
      if (!preserveFormEdits) fillForm(config);
      applyDisplay(config, false);
      formDirty = preserveFormEdits;
      if (previous && previous.status !== current.status) {
        setStatus(
          `Exam status changed to ${statusLabel(current.status).toLowerCase()}; the display was synchronized${preserveFormEdits ? " and unapplied form edits were preserved" : ""}.`,
          "success",
        );
      }
    } else if (previous && previous.status !== current.status) {
      document.querySelector("#clock-source-status").textContent = `Display adjusted by teacher · saved exam ${statusLabel(current.status).toLowerCase()}`;
      setStatus("The saved exam status changed. Your adjusted display was preserved.", "info");
    }
  } catch (error) {
    document.querySelector("#clock-display")?.setAttribute("data-disconnected", "true");
    if (error instanceof ApiError && error.status === 401) {
      const reauth = document.querySelector("#clock-reauth");
      if (reauth) reauth.hidden = false;
      document.querySelector("#clock-source-status").textContent = "Sign-in expired · last synchronized display";
    }
    setStatus(`${error instanceof Error ? error.message : "Could not synchronize exam status"}. The local countdown is still running.`, "error");
  } finally {
    syncInFlight = false;
    if (syncPending) {
      syncPending = false;
      void synchronizeLifecycle();
    }
  }
}

function bindControls() {
  const form = document.querySelector("#clock-form");
  document.querySelector("#clock-session").addEventListener("change", loadSelectedDefaults);
  form.addEventListener("input", () => { formDirty = true; });
  document.querySelector("#clock-title-input").addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const config = configFromForm();
    if (!config) return;
    applyDisplay(config, true);
    setStatus("Display updated. Candidate timing records were not changed.", "success");
  });
  document.querySelector("#clock-reset").addEventListener("click", refreshSelectedDefaults);

  const controls = document.querySelector("#clock-controls");
  const toggle = document.querySelector("#clock-toggle-controls");
  toggle.addEventListener("click", () => {
    const willHide = !controls.hidden;
    controls.hidden = willHide;
    document.querySelector("#clock-workspace").classList.toggle("clock-workspace--display-only", willHide);
    toggle.setAttribute("aria-expanded", String(!willHide));
    toggle.textContent = willHide ? "Show controls" : "Hide controls";
  });

  const fullscreen = document.querySelector("#clock-fullscreen");
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setStatus("This browser did not allow fullscreen. The clock still works in its window.", "error");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreen.textContent = document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen";
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      renderTick();
      synchronizeLifecycle();
    }
  });
  window.addEventListener("focus", synchronizeLifecycle);
  window.addEventListener("pageshow", synchronizeLifecycle);
}

function renderClockShell() {
  document.body.classList.add("countdown-page");
  setView(`
    <div class="countdown-shell">
      <header class="clock-toolbar">
        <a href="/admin">← Teacher dashboard</a>
        <div class="clock-toolbar__actions">
          <a id="clock-reauth" class="clock-reauth" href="/admin" hidden>Sign in again</a>
          <button id="clock-toggle-controls" type="button" aria-expanded="true" aria-controls="clock-controls">Hide controls</button>
          <button id="clock-fullscreen" type="button">Enter fullscreen</button>
        </div>
      </header>
      <div id="clock-workspace" class="clock-workspace">
        <aside id="clock-controls" class="clock-controls" aria-labelledby="clock-controls-title">
          <p class="eyebrow">Teacher controls</p>
          <h1 id="clock-controls-title">Examination clock</h1>
          <p>Choose an exam to load its saved schedule, then correct this display if needed.</p>
          <form id="clock-form" class="utility-form" method="post">
            <fieldset>
              <legend>Display settings</legend>
              <label for="clock-session">Exam</label>
              <select id="clock-session"></select>
              <label for="clock-title-input">Display title</label>
              <input id="clock-title-input" maxlength="160" required>
              <label for="clock-subtitle-input">Display details</label>
              <input id="clock-subtitle-input" maxlength="240">
              <label for="clock-start-input">Start date and time</label>
              <input id="clock-start-input" type="datetime-local" step="1" required>
              <div class="clock-duration-fields">
                <div><label for="clock-reading-input">Reading minutes</label><input id="clock-reading-input" type="number" min="0" max="60" step="1" required></div>
                <div><label for="clock-writing-input">Writing minutes</label><input id="clock-writing-input" type="number" min="1" max="360" step="1" required></div>
              </div>
              <button class="primary-action" type="submit">Apply to display</button>
              <button id="clock-reset" type="button">Reload exam defaults</button>
            </fieldset>
          </form>
          <p class="clock-safety-note"><strong>Display only.</strong> Changes here never alter candidate timers or saved exam records. Individual extra time is not included.</p>
          <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
        </aside>
        <section id="clock-display" class="clock-display" data-phase="before-start" aria-labelledby="clock-display-title">
          <div class="clock-display__heading">
            <p class="clock-brand">DigitalDP examination clock</p>
            <p id="clock-source-status" class="clock-source-status">Using saved exam timings</p>
            <h2 id="clock-display-title">Examination</h2>
            <p id="clock-display-subtitle" class="clock-display__subtitle"></p>
          </div>
          <div class="clock-display__timer">
            <p id="clock-phase" class="clock-phase">Starts in</p>
            <time id="clock-value" class="clock-value" datetime="PT0S">00:00:00</time>
            <p id="clock-next" class="clock-next"></p>
          </div>
          <dl class="clock-schedule">
            <div><dt>Starts</dt><dd id="clock-starts-at">—</dd></div>
            <div><dt>Writing starts</dt><dd id="clock-writing-at">—</dd></div>
            <div><dt>Ends</dt><dd id="clock-ends-at">—</dd></div>
          </dl>
          <p class="clock-room-note">Standard room schedule · candidate-specific extra time is tracked separately</p>
          <p id="clock-announcer" class="visually-hidden" aria-live="polite" aria-atomic="true"></p>
        </section>
      </div>
    </div>
  `);
}

export async function renderCountdown(bootstrap) {
  if (bootstrap.role !== "admin") {
    renderUnavailable("Teacher sign-in required", "Open the teacher dashboard and sign in, then launch the countdown again.", "Open teacher sign-in");
    return;
  }
  renderClockShell();
  try {
    await fetchState();
    const requestedId = new URL(location.href).searchParams.get("session") ?? "";
    const selected = chooseCountdownSession(adminState.sessions, requestedId);
    if (requestedId && !selected) {
      renderUnavailable("Exam not found", "This countdown link does not match an available exam. Return to the teacher dashboard and open it again.");
      return;
    }
    populateSessionOptions(selected?.id ?? "custom");
    const config = configFromSession(selected, authoritativeNow());
    fillForm(config);
    applyDisplay(config, false);
    bindControls();
    clearInterval(tickTimer);
    tickTimer = setInterval(renderTick, 250);
    stopSocket?.();
    stopSocket = connectSocket((event) => {
      if (event.type === "admin-state" || event.type === "socket-open") synchronizeLifecycle();
      if (event.type === "socket-closed") {
        document.querySelector("#clock-display")?.setAttribute("data-disconnected", "true");
        setStatus("Live synchronization paused. The local countdown is still running.", "error");
      }
    });
    clearInterval(syncTimer);
    syncTimer = setInterval(synchronizeLifecycle, 30_000);
  } catch (error) {
    renderUnavailable("Clock unavailable", error instanceof Error ? error.message : "The examination clock could not load.");
  }
}
