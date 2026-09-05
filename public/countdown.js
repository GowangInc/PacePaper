import { ApiError, api, connectSocket, setView } from "/app.js";
import {
  canPersistCandidateTiming,
  chooseCountdownSession,
  configFromSession,
  countdownPhase,
  formatCountdown,
  parseStudentNames,
  resolveStartAt,
  synchronizeLinkedCountdown,
} from "/countdown-model.js";
import { mountStudentConnection } from "/student-connection.js";

let adminState;
let displayConfig;
let timeAnchor = { serverAt: Date.now(), monotonicAt: performance.now() };
let tickTimer;
let syncTimer;
let stopSocket;
let lastAnnouncedPhase = "";
let presentationCustomised = false;
const dirtyFields = new Set();
let loadedTiming;
let syncInFlight = false;
let syncPending = false;
let studentConnectionOrigin;

const phaseDescriptions = {
  ready: "The saved examination is ready but has not been started.",
  "before-start": "The examination has not started.",
  reading: "Reading time is in progress. Students should not enter responses.",
  writing: "Writing time is in progress.",
  break: "The monitored break is in progress. Examination content and student entry are locked.",
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
        <img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192">
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
  const signature = JSON.stringify(adminState.sessions.map(({ id, status, paperTitle, className }) => [id, status, paperTitle, className]));
  if (select.dataset.signature === signature) {
    if (select.value !== selectedId) select.value = selectedId;
    return;
  }
  select.dataset.signature = signature;
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

function fillForm(config, preserveEdits = false) {
  const preserveTimingEdits = preserveEdits
    && !document.querySelector("#clock-reading-input").disabled
    && ["clock-reading-input", "clock-writing-input"].some((id) => dirtyFields.has(id));
  if (!preserveTimingEdits) {
    loadedTiming = { expectedReadingTimeMinutes: config.readingTimeMinutes, expectedDurationMinutes: config.durationMinutes };
  }
  const setValue = (id, value) => {
    const input = document.querySelector(`#${id}`);
    if (preserveEdits && dirtyFields.has(id) && !input.disabled) return;
    input.value = String(value);
    dirtyFields.delete(id);
  };
  setValue("clock-title-input", config.title);
  setValue("clock-subtitle-input", config.subtitle);
  const startInput = document.querySelector("#clock-start-input");
  setValue("clock-start-input", toDateTimeLocal(config.startAt));
  startInput.dataset.loadedValue = toDateTimeLocal(config.startAt);
  startInput.dataset.exactTimestamp = String(config.startAt);
  setValue("clock-reading-input", config.readingTimeMinutes);
  setValue("clock-writing-input", config.durationMinutes);
  const usesPhasePlan = Boolean(config.phases?.length);
  document.querySelector("#clock-reading-field").hidden = usesPhasePlan;
  document.querySelector("#clock-writing-label").textContent = usesPhasePlan ? "Total timed minutes" : "Writing minutes";
  document.querySelector("#clock-phase-edit-help").hidden = !usesPhasePlan;
}

function studentNamesForSession(session) {
  if (!session) return [];
  return adminState.students
    .filter((student) => student.classId === session.classId)
    .map((student) => student.name)
    .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

function renderStudentNames(value) {
  const list = document.querySelector("#clock-student-names");
  const names = parseStudentNames(value);
  list.replaceChildren();
  if (names.length === 0) {
    const placeholder = document.createElement("li");
    placeholder.className = "clock-student-names__placeholder";
    placeholder.textContent = "Names can be entered in the teacher controls";
    list.append(placeholder);
    return;
  }
  for (const name of names) {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  }
}

function fillStudentNames(session) {
  const value = studentNamesForSession(session).join("\n");
  document.querySelector("#clock-student-names-input").value = value;
  renderStudentNames(value);
}

function updateTimingEditMode(session) {
  const persists = canPersistCandidateTiming(session);
  const submit = document.querySelector("#clock-apply");
  const note = document.querySelector("#clock-safety-note");
  document.querySelector("#clock-start-input").disabled = Boolean(session);
  document.querySelector("#clock-reading-input").disabled = Boolean(session) && !persists;
  document.querySelector("#clock-writing-input").disabled = Boolean(session) && !persists;
  document.querySelector("#clock-start-help").hidden = !session;
  submit.textContent = persists ? "Save exam timing and update display" : session ? "Update display details" : "Apply to display";
  note.innerHTML = persists
    ? "<strong>Linked ready exam.</strong> Save reading and writing times for this sitting. The clock starts only when the teacher starts the exam. Title, details and names affect this display only."
    : session?.phases?.length
      ? "<strong>Linked phase plan.</strong> This clock follows the saved sections and breaks. Timing changes are not supported here; use the Paper Builder to prepare a different paper. Title, details and names remain editable."
      : session
        ? "<strong>Linked exam timing is read-only.</strong> This clock follows the saved student schedule. Live timing corrections are not supported. Title, details and names remain editable; individual extra time is tracked separately."
        : "<strong>Standalone display.</strong> No student exam is connected. This custom countdown runs only in this window and is not saved after refresh.";
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
  const sessionId = document.querySelector("#clock-session").value;
  const linkedSession = adminState.sessions.find((session) => session.id === sessionId);
  const readingTimeMinutes = Number(document.querySelector("#clock-reading-input").value);
  const durationMinutes = Number(document.querySelector("#clock-writing-input").value);
  return {
    sessionId,
    sessionStatus: linkedSession?.status ?? "custom",
    endedAt: linkedSession?.endedAt ?? null,
    title,
    subtitle: document.querySelector("#clock-subtitle-input").value.trim(),
    startAt,
    readingTimeMinutes,
    durationMinutes,
    phases: linkedSession?.phases,
  };
}

function updateSchedule(config) {
  const phase = countdownPhase(config, authoritativeNow());
  const schedule = document.querySelector("#clock-schedule");
  schedule.replaceChildren();
  const addScheduleItem = (label, value) => {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    schedule.append(wrapper);
  };
  if (phase.phase === "ready") {
    addScheduleItem("Starts", "When the teacher starts the exam");
    if (config.phases?.length) {
      for (const item of config.phases) addScheduleItem(item.label, `${item.durationMinutes} min`);
    } else {
      addScheduleItem("Reading", `${config.readingTimeMinutes} min`);
      addScheduleItem("Writing", `${config.durationMinutes} min`);
    }
    return;
  }
  addScheduleItem("Starts", wallTime(phase.startAt));
  if (phase.scheduledPhases?.length) {
    for (const item of phase.scheduledPhases) {
      addScheduleItem(item.label, `${wallTime(item.startsAt)}–${wallTime(item.endsAt)}`);
    }
  } else {
    addScheduleItem("Writing starts", config.readingTimeMinutes > 0 ? wallTime(phase.readingEndsAt) : "Immediately");
  }
  addScheduleItem("Ends", wallTime(phase.endedAt ?? phase.endsAt));
}

function applyDisplay(config, customised = false) {
  if (displayConfig?.sessionId !== config.sessionId) lastAnnouncedPhase = "";
  displayConfig = config;
  presentationCustomised = customised;
  document.querySelector("#clock-display-title").textContent = config.title;
  document.querySelector("#clock-display-subtitle").textContent = config.subtitle;
  document.querySelector("#clock-source-status").textContent = config.sessionId === "custom"
      ? "Standalone display · no student exam connected"
      : config.sessionStatus === "draft"
        ? "Linked ready exam · waiting for Start"
        : config.sessionStatus === "ended"
          ? "Linked exam ended"
          : "Linked · using saved student timings";
  document.title = `${config.title} clock | DigitalDP`;
  updateSchedule(config);
  renderTick();
}

function loadSelectedDefaults() {
  const selectedId = document.querySelector("#clock-session").value;
  const session = adminState.sessions.find((item) => item.id === selectedId) ?? null;
  const config = configFromSession(session, authoritativeNow());
  dirtyFields.clear();
  updateTimingEditMode(session);
  fillForm(config);
  fillStudentNames(session);
  applyDisplay(config, false);
  const url = new URL(location.href);
  if (session) url.searchParams.set("session", session.id);
  else url.searchParams.delete("session");
  history.replaceState(null, "", url);
  setStatus(session
    ? canPersistCandidateTiming(session)
      ? "Ready exam timings loaded. Applying new reading or writing times will save them for candidates."
      : `${statusLabel(session.status)} exam timings loaded. Linked timing is read-only; display details remain editable.`
    : "Custom countdown loaded.", "success");
}

function renderTick() {
  if (!displayConfig) return;
  const state = countdownPhase(displayConfig, authoritativeNow());
  const display = document.querySelector("#clock-display");
  display.dataset.phase = state.phase;
  document.querySelector("#clock-phase").textContent = state.label;
  document.querySelector("#clock-phase-tools").textContent = state.tools?.length ? state.tools.join(" · ") : "";
  const value = document.querySelector("#clock-value");
  if (state.phase === "ready") {
    value.textContent = "--:--:--";
    value.dateTime = "";
    value.setAttribute("aria-label", "Ready to start");
    document.querySelector("#clock-next").textContent = "Start the exam in the teacher dashboard.";
  } else {
    value.textContent = formatCountdown(state.remainingMs);
    value.dateTime = `PT${Math.ceil(state.remainingMs / 1_000)}S`;
    value.setAttribute("aria-label", `${state.label}: ${formatCountdown(state.remainingMs)}`);
    document.querySelector("#clock-next").textContent = ["ended", "standard-ended"].includes(state.phase)
      ? `${state.nextLabel} at ${wallTime(state.endedAt ?? state.endsAt)}`
      : `${state.nextLabel} at ${wallTime(state.nextAt ?? (state.phase === "before-start" ? state.startAt : state.phase === "reading" ? state.readingEndsAt : state.endsAt))}`;
  }
  const announcementKey = state.phaseId ?? state.phase;
  if (lastAnnouncedPhase !== announcementKey) {
    document.querySelector("#clock-announcer").textContent = `${state.label}. ${phaseDescriptions[state.phase] ?? "The examination has moved to the next timed phase."}`;
    lastAnnouncedPhase = announcementKey;
  }
}

async function fetchState() {
  const requestStarted = performance.now();
  const state = await api("/api/admin/state");
  const responseReceived = performance.now();
  if (adminState && state.serverTime < adminState.serverTime) return adminState;
  adminState = state;
  updateStudentConnection(state.network);
  timeAnchor = {
    serverAt: state.serverTime + (responseReceived - requestStarted) / 2,
    monotonicAt: responseReceived,
  };
  document.querySelector("#clock-display")?.removeAttribute("data-disconnected");
  const reauth = document.querySelector("#clock-reauth");
  if (reauth) reauth.hidden = true;
  return state;
}

function refreshLinkedDisplay(session, preserveEdits = true) {
  const config = presentationCustomised
    ? synchronizeLinkedCountdown(displayConfig, session, authoritativeNow())
    : configFromSession(session, authoritativeNow());
  updateTimingEditMode(session);
  fillForm(config, preserveEdits);
  applyDisplay(config, presentationCustomised);
}

function updateStudentConnection(network) {
  if (!network || typeof network.studentUrl !== "string") return;
  try {
    studentConnectionOrigin = new URL(network.studentUrl).origin;
  } catch {
    return;
  }
  if (document.querySelector("[data-student-connection-link]")) {
    mountStudentConnection(document, { origin: studentConnectionOrigin });
  }
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
    if (document.querySelector("#clock-session")?.value !== selectedId) return;
    if (wasDisconnected) setStatus("Live synchronization restored.", "success");
    const current = adminState.sessions.find((session) => session.id === selectedId);
    populateSessionOptions(current?.id ?? "custom");
    updateTimingEditMode(current);
    if (!current) {
      if (selectedId !== "custom") setStatus("The selected exam is no longer available. The current display has been left unchanged.", "error");
      return;
    }
    const timingChanged = previous && (previous.readingTimeMinutes !== current.readingTimeMinutes
      || previous.durationMinutes !== current.durationMinutes);
    refreshLinkedDisplay(current);
    if (previous && (previous.status !== current.status || timingChanged)) {
      setStatus(
        `Saved exam ${current.status === "live" ? "is live" : statusLabel(current.status).toLowerCase()}; the clock now follows its saved timing.${dirtyFields.size ? " Unapplied form edits are separate from the clock display." : ""}`,
        "success",
      );
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
  const studentNamesInput = document.querySelector("#clock-student-names-input");
  document.querySelector("#clock-session").addEventListener("change", loadSelectedDefaults);
  form.addEventListener("input", (event) => {
    if (event.target !== studentNamesInput && event.target.id) dirtyFields.add(event.target.id);
  });
  studentNamesInput.addEventListener("input", () => renderStudentNames(studentNamesInput.value));
  document.querySelector("#clock-title-input").addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const config = configFromForm();
    if (!config) return;
    const linked = adminState.sessions.find((session) => session.id === config.sessionId);
    const submit = document.querySelector("#clock-apply");
    const expectedTiming = { ...loadedTiming };
    const fieldset = form.querySelector("fieldset");
    fieldset.disabled = true;
    submit.disabled = true;
    try {
      if (canPersistCandidateTiming(linked)) {
        await api(`/api/admin/sessions/${encodeURIComponent(linked.id)}/timing`, {
          method: "PUT",
          body: { readingTimeMinutes: config.readingTimeMinutes, durationMinutes: config.durationMinutes, ...expectedTiming },
        });
        await fetchState();
        const saved = adminState.sessions.find((session) => session.id === linked.id);
        if (!saved) throw new Error("The exam is no longer available. Reload the teacher dashboard.");
        populateSessionOptions(linked.id);
        updateTimingEditMode(saved);
        const synchronized = synchronizeLinkedCountdown(config, saved, authoritativeNow());
        dirtyFields.clear();
        fillForm(synchronized);
        applyDisplay(synchronized, true);
        setStatus(`Exam timing saved: ${config.readingTimeMinutes} reading minute${config.readingTimeMinutes === 1 ? "" : "s"}, then ${config.durationMinutes} writing minutes.`, "success");
      } else {
        const synchronized = linked ? synchronizeLinkedCountdown(config, linked, authoritativeNow()) : config;
        dirtyFields.clear();
        fillForm(synchronized);
        applyDisplay(synchronized, true);
        setStatus(linked ? "Display details updated. The clock still follows the saved student timing." : "Standalone display updated. No student exam was changed.", "success");
      }
    } catch (error) {
      if (linked) {
        try {
          await fetchState();
          const current = adminState.sessions.find((session) => session.id === linked.id);
          if (current) refreshLinkedDisplay(current);
        } catch { /* Keep the current display and inputs when a refresh also fails. */ }
      }
      setStatus(`${error instanceof Error ? error.message : "Could not save the exam timing"}. Review the saved clock schedule; use Reload exam defaults before trying changed timing again.`, "error");
    } finally {
      fieldset.disabled = false;
      submit.disabled = false;
    }
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
          <p>Choose an exam to display its saved schedule. A linked exam stays ready until the teacher selects Start exam. Choose Custom countdown for a display with no student exam connected.</p>
          <form id="clock-form" class="utility-form" method="post">
            <fieldset>
              <legend>Display settings</legend>
              <label for="clock-session">Exam</label>
              <select id="clock-session"></select>
              <label for="clock-title-input">Display title</label>
              <input id="clock-title-input" maxlength="160" required>
              <label for="clock-subtitle-input">Display details</label>
              <input id="clock-subtitle-input" maxlength="240">
              <label for="clock-student-names-input">Student names</label>
              <textarea id="clock-student-names-input" rows="4" maxlength="4000" aria-describedby="clock-student-names-help"></textarea>
              <small id="clock-student-names-help">One name per line. This display list remains editable and does not affect student accounts.</small>
              <label for="clock-start-input">Start date and time</label>
              <input id="clock-start-input" type="datetime-local" step="1" required aria-describedby="clock-start-help">
              <small id="clock-start-help">Linked exams start in the teacher dashboard. Their start time cannot be changed on this display.</small>
              <div class="clock-duration-fields">
                <div id="clock-reading-field"><label for="clock-reading-input">Reading minutes</label><input id="clock-reading-input" type="number" min="0" max="60" step="any" required></div>
                <div><label id="clock-writing-label" for="clock-writing-input">Writing minutes</label><input id="clock-writing-input" type="number" min="1" max="360" step="1" required></div>
              </div>
              <small id="clock-phase-edit-help" hidden>The saved sections and breaks are shown on the clock. Their timing is read-only here.</small>
              <button id="clock-apply" class="primary-action" type="submit">Apply to display</button>
              <button id="clock-reset" type="button">Reload exam defaults</button>
            </fieldset>
          </form>
          <p id="clock-safety-note" class="clock-safety-note"></p>
          <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
        </aside>
        <section id="clock-display" class="clock-display" data-phase="before-start" aria-labelledby="clock-display-title">
          <div class="clock-display__heading">
            <p class="clock-brand">DigitalDP examination clock</p>
            <p id="clock-source-status" class="clock-source-status">Using saved exam timings</p>
            <h2 id="clock-display-title">Examination</h2>
            <p id="clock-display-subtitle" class="clock-display__subtitle"></p>
            <section class="clock-student-connect" aria-labelledby="clock-student-connect-title">
              <h3 id="clock-student-connect-title">Students connect at</h3>
              <div class="clock-student-connect__body">
                <a class="clock-student-url" data-student-connection-link href="/student" target="_blank" rel="noopener">/student</a>
                <button data-copy-student-connection type="button" aria-describedby="clock-student-connect-status">Copy URL</button>
              </div>
              <p id="clock-student-connect-status" class="clock-student-connect__status" data-copy-student-connection-status role="status" aria-live="polite" aria-atomic="true" hidden></p>
            </section>
            <section class="clock-student-list" aria-labelledby="clock-student-list-title">
              <h3 id="clock-student-list-title">Students</h3>
              <ul id="clock-student-names" class="clock-student-names"></ul>
            </section>
          </div>
          <div class="clock-display__timer">
            <p id="clock-phase" class="clock-phase">Starts in</p>
            <time id="clock-value" class="clock-value" datetime="PT0S">00:00:00</time>
            <p id="clock-phase-tools" class="clock-phase-tools"></p>
            <p id="clock-next" class="clock-next"></p>
          </div>
          <dl id="clock-schedule" class="clock-schedule"></dl>
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
  mountStudentConnection(document, { origin: bootstrap.studentOrigin ?? location.origin });
  studentConnectionOrigin = bootstrap.studentOrigin ?? location.origin;
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
    dirtyFields.clear();
    updateTimingEditMode(selected);
    fillForm(config);
    fillStudentNames(selected);
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
