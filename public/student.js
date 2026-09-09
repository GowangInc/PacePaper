import { ApiError, announce, api, connectSocket, setView } from "/app.js";

let stopSocket;
import { downloadResponseRecovery } from "./response-save-state.js";
let cleanupExam;
let pollTimer;
let loading = false;
let selectedSessionId = null;
let connectionState = "connecting";
let connectionGeneration = 0;

function renderConnectionState() {
  const indicator = document.querySelector("#connection-state");
  if (!indicator) return;
  indicator.textContent = connectionState === "connected"
    ? "Connected to examination server"
    : connectionState === "reconnecting" ? "Connection interrupted — reconnecting" : "Connecting";
  indicator.dataset.connected = String(connectionState === "connected");
}

function stopLiveConnection() {
  // Ignore any queued events from the previous socket, including the close caused by stopping it.
  connectionGeneration += 1;
  stopSocket?.();
  stopSocket = undefined;
  connectionState = "connecting";
}

export function parseStudentRoster(result) {
  if (!Array.isArray(result?.students)
    || !result.students.every((student) => typeof student?.id === "string" && typeof student?.name === "string")) {
    throw new TypeError("The class list was not in the expected format");
  }
  return result.students;
}

export function buildStudentLoginPayload(entries) {
  const values = Object.fromEntries(entries);
  return {
    classCode: values.classCode,
    studentId: values.studentId,
  };
}

export function parseStudentSessionList(result) {
  const sessions = result?.sessions;
  const statuses = new Set(["draft", "live", "ended"]);
  if (!Array.isArray(sessions) || !sessions.every((session) => (
    typeof session?.id === "string"
    && typeof session?.paperTitle === "string"
    && typeof session?.subjectLabel === "string"
    && typeof session?.level === "string"
    && typeof session?.paper === "string"
    && typeof session?.durationMinutes === "number"
    && statuses.has(session?.status)
    && (session?.submittedAt === null || typeof session?.submittedAt === "number")
  ))) {
    throw new TypeError("The examination list was not in the expected format");
  }
  return sessions;
}

export function studentSessionState(session) {
  if (session.status === "ended") return session.submittedAt === null ? "Ended" : "Completed";
  if (session.submittedAt !== null) return "Submitted";
  return session.status === "live" ? "In progress" : "Waiting for teacher";
}

export function shouldResetStudentSelection(state) {
  return state?.status === "selecting" && state.selectionReset === true;
}

function sessionListSignature(sessions) {
  return sessions.map((session) => `${session.id}:${session.status}:${session.submittedAt ?? ""}`).join("|");
}

function authFrame() {
  setView(`
    <section class="auth-shell student-auth">
      <a class="back-link" href="/">← Workspaces</a>
      <div class="auth-panel">
        <img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192">
        <p class="eyebrow">Candidate sign in</p>
        <h1>Find your examination</h1>
        <p>Enter the class code provided by your teacher, then choose your name.</p>
        <form id="student-login" method="post">
          <label for="class-code">Class code</label>
          <input id="class-code" name="classCode" autocomplete="organization" maxlength="24" required>
          <button id="load-students" class="quiet-action" type="button" aria-controls="student-id">Load names</button>
          <label for="student-id">Your name</label>
          <p id="roster-status" class="status-message" role="status" aria-live="polite" aria-atomic="true">Enter your class code, then load the names for your class.</p>
          <select id="student-id" name="studentId" aria-describedby="roster-status" required disabled>
            <option value="">Load names for your class first</option>
          </select>
          <button class="primary-action" type="submit">Continue</button>
        </form>
        <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
      </div>
    </section>
  `);

  const form = document.querySelector("#student-login");
  const classCode = form.querySelector("#class-code");
  const studentSelect = form.querySelector("#student-id");
  const loadStudents = form.querySelector("#load-students");
  const rosterStatus = form.querySelector("#roster-status");
  let loadedClassCode = "";
  let rosterController;

  function setRosterStatus(message, tone = "info") {
    rosterStatus.textContent = message;
    rosterStatus.dataset.tone = tone;
  }

  function setRosterOptions(prompt, students = []) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = prompt;
    studentSelect.replaceChildren(placeholder);
    for (const student of students) {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = student.name;
      studentSelect.append(option);
    }
  }

  function clearRoster(message = "Enter your class code, then load the names for your class.") {
    loadedClassCode = "";
    studentSelect.disabled = true;
    setRosterOptions("Load names for your class first");
    loadStudents.disabled = false;
    loadStudents.textContent = "Load names";
    setRosterStatus(message);
  }

  classCode.addEventListener("input", () => {
    rosterController?.abort();
    rosterController = undefined;
    clearRoster("Class code changed. Load the names for this class.");
  });

  loadStudents.addEventListener("click", async () => {
    if (!classCode.reportValidity()) return;

    const requestedClassCode = classCode.value.trim();
    rosterController?.abort();
    const controller = new AbortController();
    rosterController = controller;
    loadedClassCode = "";
    studentSelect.disabled = true;
    setRosterOptions("Loading names…");
    loadStudents.disabled = true;
    loadStudents.textContent = "Loading names…";
    setRosterStatus("Loading the names for this class…");

    try {
      const result = await api("/api/student/roster", {
        method: "POST",
        body: { classCode: requestedClassCode },
        signal: controller.signal,
      });
      if (rosterController !== controller) return;
      const students = parseStudentRoster(result);

      loadStudents.textContent = "Refresh names";
      if (students.length === 0) {
        setRosterOptions("No students found");
        setRosterStatus("No student names were found for that class. Check the class code or ask your teacher.", "error");
        return;
      }

      setRosterOptions("Choose your name", students);
      loadedClassCode = requestedClassCode;
      studentSelect.disabled = false;
      setRosterStatus(`${students.length} student name${students.length === 1 ? "" : "s"} loaded. Choose your name.`);
    } catch (error) {
      if (error?.name === "AbortError" || rosterController !== controller) return;
      setRosterOptions("Names unavailable");
      loadStudents.textContent = "Load names";
      setRosterStatus(
        error instanceof ApiError
          ? `Names could not be loaded: ${error.message}`
          : "Names could not be loaded. Check the class code and connection, then try again.",
        "error",
      );
    } finally {
      if (rosterController === controller) {
        rosterController = undefined;
        loadStudents.disabled = false;
      }
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (studentSelect.disabled || loadedClassCode !== classCode.value.trim()) {
      setRosterStatus("Load the names for this class before continuing.", "error");
      loadStudents.focus();
      return;
    }
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    announce("Signing in…");
    try {
      await api("/api/login/student", { method: "POST", body: buildStudentLoginPayload(new FormData(form)) });
      selectedSessionId = null;
      beginLiveConnection();
      await loadState();
    } catch (error) {
      announce(error instanceof Error ? error.message : "Sign-in failed", "error");
    } finally {
      submit.disabled = false;
    }
  });
}

async function logout() {
  cleanupExam?.();
  stopLiveConnection();
  clearInterval(pollTimer);
  selectedSessionId = null;
  await api("/api/logout", { method: "POST" });
  authFrame();
}

function chooseAnotherExam() {
  cleanupExam?.();
  cleanupExam = undefined;
  selectedSessionId = null;
  loadState();
}

function renderExamSelection(state) {
  cleanupExam?.();
  cleanupExam = undefined;
  const sessions = parseStudentSessionList(state);
  setView(`
    <section class="waiting-shell exam-selection-shell" data-session-signature="${sessionListSignature(sessions)}">
      <header class="waiting-header"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>PacePaper familiarisation</span></header>
      <div class="waiting-content">
        <p class="eyebrow">Signed in</p>
        <h1 id="student-name"></h1>
        <h2>Choose your examination</h2>
        <p>Select the examination your teacher has asked you to take. A prepared examination will hold you in its waiting room until the teacher starts it.</p>
        <ul id="student-session-list" class="session-list"></ul>
        <p class="connection-state" id="connection-state">Connecting</p>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </div>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  renderConnectionState();
  document.querySelector("#student-name").textContent = state.student.name;
  const list = document.querySelector("#student-session-list");
  if (sessions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No examinations are available for this class yet.";
    list.append(empty);
  }
  for (const session of sessions) {
    const item = document.createElement("li");
    item.className = "session-row";

    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = session.paperTitle;
    const metadata = document.createElement("span");
    metadata.textContent = [
      session.subjectLabel,
      session.level,
      session.paper,
      `${session.durationMinutes} min`,
      studentSessionState(session),
    ].filter(Boolean).join(" · ");
    details.append(title, metadata);
    item.append(details);

    if (session.status === "ended") {
      const ended = document.createElement("span");
      ended.className = "session-counts";
      ended.textContent = studentSessionState(session);
      item.append(ended);
    } else {
      const select = document.createElement("button");
      select.type = "button";
      select.className = session.status === "live" && session.submittedAt === null
        ? "primary-action compact"
        : "quiet-action compact";
      select.dataset.selectSession = session.id;
      select.textContent = session.status === "draft"
        ? "Join waiting room"
        : session.submittedAt === null ? "Enter exam" : "View submission";
      select.setAttribute("aria-label", `${select.textContent}: ${session.paperTitle}`);
      item.append(select);
    }
    list.append(item);
  }
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-select-session]");
    if (!button) return;
    selectedSessionId = button.dataset.selectSession;
    loadState();
  });
  document.querySelector("#logout").addEventListener("click", logout);
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 5_000);
}

function renderWaiting(state) {
  cleanupExam?.();
  cleanupExam = undefined;
  setView(`
    <section class="waiting-shell" data-session-id="${state.session.id}">
      <header class="waiting-header"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>PacePaper familiarisation</span></header>
      <div class="waiting-content">
        <p class="eyebrow">Signed in</p>
        <h1 id="student-name"></h1>
        <div class="waiting-pulse" aria-hidden="true"></div>
        <h2>Waiting for your teacher</h2>
        <p id="waiting-paper"></p>
        <p>This examination will open here when the teacher starts it.</p>
        <p class="connection-state" id="connection-state">Connecting</p>
        <button id="choose-exam" class="quiet-action" type="button">Choose a different exam</button>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </div>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  renderConnectionState();
  document.querySelector("#student-name").textContent = state.student.name;
  document.querySelector("#waiting-paper").textContent = state.session.paperTitle;
  document.querySelector("#choose-exam").addEventListener("click", chooseAnotherExam);
  document.querySelector("#logout").addEventListener("click", logout);
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 5_000);
}

function renderSubmitted(state) {
  const recovery = cleanupExam?.pendingRecovery?.();
  cleanupExam?.();
  cleanupExam = undefined;
  const responseId = typeof state.response?.id === "string" ? state.response.id : null;
  const localKeys = [
    !recovery && responseId && `digitaldp:draft:${responseId}`,
    responseId && `digitaldp:highlights:${responseId}`,
    `digitaldp:draft:${state.session.id}`,
    `digitaldp:highlights:${state.session.id}`,
  ].filter(Boolean);
  for (const key of localKeys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Submission is server-confirmed even if local cleanup is unavailable.
    }
  }
  setView(`
    <section class="submitted-shell" data-session-id="${state.session.id}">
      <img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192">
      <p class="eyebrow">Response received</p>
      <h1>Your examination is submitted</h1>
      <p id="submitted-paper"></p>
      <p>Your response can no longer be changed. You can return to the examination list if your teacher has prepared another paper.</p>
      <button id="choose-exam" class="primary-action" type="button">Choose another exam</button>
      <button id="logout" class="quiet-action" type="button">Sign out</button>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  document.querySelector("#submitted-paper").textContent = state.paper.title;
  let downloaded = false;
  if (recovery) {
    const warning = document.createElement("p");
    warning.setAttribute("role", "alert");
    warning.textContent = "Some changes in this page were not confirmed saved before the exam ended. Keep this page open, download a recovery copy and tell your teacher. The submitted paper may contain only earlier work.";
    const download = document.createElement("button");
    download.type = "button"; download.textContent = "Download recovery copy";
    download.addEventListener("click", () => { downloadResponseRecovery(recovery); downloaded = true; });
    document.querySelector("#submitted-paper").after(warning, download);
    const warnBeforeLeaving = (event) => { if (!downloaded) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    cleanupExam = () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }
  const mayLeave = () => !recovery || downloaded || confirm("Leave without downloading the unsent work? Keep this page open to download a recovery copy for your teacher.");
  document.querySelector("#choose-exam").addEventListener("click", () => { if (mayLeave()) chooseAnotherExam(); });
  document.querySelector("#logout").addEventListener("click", () => { if (mayLeave()) logout(); });
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 15_000);
}

async function renderExam(state) {
  clearInterval(pollTimer);
  const { mountExam } = await import("/exam.js");
  cleanupExam?.();
  cleanupExam = mountExam(state, { onSubmitted: loadState });
  pollTimer = setInterval(loadState, 30_000);
}

async function loadState() {
  if (loading) return;
  loading = true;
  try {
    const endpoint = selectedSessionId
      ? `/api/student/state?session=${encodeURIComponent(selectedSessionId)}`
      : "/api/student/state";
    const state = await api(endpoint);
    if (state.status === "selecting") {
      const selectionReset = shouldResetStudentSelection(state);
      if (selectionReset) selectedSessionId = null;
      const sessions = parseStudentSessionList(state);
      const current = document.querySelector(".exam-selection-shell");
      if (selectionReset || !current || current.dataset.sessionSignature !== sessionListSignature(sessions)) renderExamSelection(state);
    } else if (state.status === "waiting") {
      if (!document.querySelector(`.waiting-shell[data-session-id="${CSS.escape(state.session.id)}"]`)) renderWaiting(state);
    } else if (state.status === "submitted") {
      if (!document.querySelector(`.submitted-shell[data-session-id="${CSS.escape(state.session.id)}"]`)) renderSubmitted(state);
    } else if (!document.querySelector(`.exam-shell[data-session-id="${CSS.escape(state.session.id)}"]`)) {
      await renderExam(state);
    } else {
      cleanupExam?.updateState?.(state);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      cleanupExam?.();
      stopLiveConnection();
      clearInterval(pollTimer);
      authFrame();
    } else {
      announce(error instanceof Error ? error.message : "Could not contact the examination server", "error");
    }
  } finally {
    loading = false;
  }
}

function beginLiveConnection() {
  stopLiveConnection();
  renderConnectionState();
  const generation = connectionGeneration;
  stopSocket = connectSocket((event) => {
    if (generation !== connectionGeneration) return;
    if (event.type === "socket-open" || event.type === "connected") {
      connectionState = "connected";
      renderConnectionState();
    } else if (event.type === "socket-closed") {
      connectionState = "reconnecting";
      renderConnectionState();
    } else if (["exam-started", "exam-ended", "exam-list-changed"].includes(event.type)) {
      loadState();
    }
  });
}

export async function renderStudent(bootstrap) {
  if (bootstrap.role !== "student") {
    stopLiveConnection();
    authFrame();
    return;
  }
  beginLiveConnection();
  await loadState();
}
