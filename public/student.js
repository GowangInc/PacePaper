import { ApiError, announce, api, connectSocket, setView } from "/app.js";
import { themeToggleMarkup } from "./theme.js";
import { renderInkSubmission } from "./ink-canvas.js";
import { renderResourceText } from "./resource-text.js";

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

export function buildStudentLoginPayload(entries) {
  const values = Object.fromEntries(entries);
  return {
    className: values.className,
    studentName: values.studentName,
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
    && (session?.pausePhase === null || session?.pausePhase === undefined || session?.pausePhase === "paused" || session?.pausePhase === "lobby")
  ))) {
    throw new TypeError("The examination list was not in the expected format");
  }
  return sessions;
}

export function studentSessionState(session) {
  if (session.status === "ended") return session.submittedAt === null ? "Ended" : "Completed";
  if (session.submittedAt !== null) return "Submitted";
  if (session.status === "live" && session.pausePhase === "paused") return "Paused by the teacher";
  if (session.status === "live" && session.pausePhase === "lobby") return "In the lobby";
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
        <p class="eyebrow">Student sign in</p>
        <h1>Find your examination</h1>
        <p>Choose your class and your own name from the lists.</p>
        <p class="supervision-notice">Your teacher can see your work during a sitting: your answers, drawings, notes, and flagged questions. This covers only PacePaper — nothing else on your computer.</p>
        <form id="student-login" method="post">
          <label for="class-name">Class</label>
          <select id="class-name" name="className" required disabled>
            <option value="" selected>Loading the class list…</option>
          </select>
          <label for="student-name-input">Your name</label>
          <select id="student-name-input" name="studentName" required disabled>
            <option value="" selected>Choose your class first</option>
          </select>
          <button class="primary-action" type="submit">Continue</button>
        </form>
        <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
      </div>
    </section>
  `);

  const form = document.querySelector("#student-login");
  const classSelect = form.querySelector("#class-name");
  const studentSelect = form.querySelector("#student-name-input");
  let directory = [];
  let directoryFailures = 0;

  async function loadDirectory() {
    try {
      const data = await api("/api/login/directory");
      directory = Array.isArray(data?.classes) ? data.classes : [];
      directoryFailures = 0;
      if (directory.length === 0) {
        classSelect.innerHTML = '<option value="" selected>No classes yet</option>';
        announce("No classes are set up yet. Ask your teacher to create one.", "error");
        return;
      }
      classSelect.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Choose your class";
      placeholder.disabled = true;
      placeholder.selected = true;
      classSelect.append(placeholder);
      for (const cls of directory) {
        const option = document.createElement("option");
        option.value = cls.name;
        option.textContent = cls.name;
        classSelect.append(option);
      }
      classSelect.disabled = false;
    } catch {
      directoryFailures += 1;
      if (directoryFailures === 3) {
        announce("Could not load the class list. Retrying until it appears…", "error");
      }
      setTimeout(loadDirectory, 2000);
    }
  }
  loadDirectory();

  classSelect.addEventListener("change", () => {
    const cls = directory.find((candidate) => candidate.name === classSelect.value);
    studentSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = cls?.students.length ? "Choose your name" : "No students in this class";
    studentSelect.append(placeholder);
    for (const student of cls?.students ?? []) {
      const option = document.createElement("option");
      option.value = student.name;
      option.textContent = student.name;
      studentSelect.append(option);
    }
    studentSelect.disabled = !cls?.students.length;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
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

function stopExam() {
  const recovery = cleanupExam?.pendingRecovery?.();
  cleanupExam?.();
  cleanupExam = undefined;
  return recovery;
}

async function logout() {
  stopExam();
  stopLiveConnection();
  clearInterval(pollTimer);
  selectedSessionId = null;
  await api("/api/logout", { method: "POST" });
  authFrame();
}

function chooseAnotherExam() {
  stopExam();
  selectedSessionId = null;
  loadState();
}

function renderExamSelection(state) {
  const recovery = stopExam();
  const sessions = parseStudentSessionList(state);
  setView(`
    <section class="waiting-shell exam-selection-shell" data-session-signature="${sessionListSignature(sessions)}">
      <header class="waiting-header"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>PacePaper familiarisation</span><span class="waiting-actions">${themeToggleMarkup()}</span></header>
      <div class="waiting-content">
        <p class="eyebrow">Signed in</p>
        <h1 id="student-name"></h1>
        <h2>Choose your examination</h2>
        <p>Select the examination your teacher has asked you to take. Earlier submitted assessments appear below and are visible only to you.</p>
        <ul id="student-session-list" class="session-list"></ul>
        <p class="connection-state" id="connection-state">Connecting</p>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </div>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  renderConnectionState();
  document.querySelector("#student-name").textContent = state.student.name;
  const mayLeave = attachRecoveryWarning(recovery, document.querySelector("#student-name"));
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
      if (session.submittedAt !== null) {
        const view = document.createElement("button");
        view.type = "button";
        view.className = "quiet-action compact";
        view.dataset.selectSession = session.id;
        view.textContent = "View assessment";
        view.setAttribute("aria-label", `View assessment: ${session.paperTitle}`);
        item.append(view);
      } else {
        const ended = document.createElement("span");
        ended.className = "session-counts";
        ended.textContent = studentSessionState(session);
        item.append(ended);
      }
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
    if (!button || !mayLeave()) return;
    selectedSessionId = button.dataset.selectSession;
    loadState();
  });
  document.querySelector("#logout").addEventListener("click", () => { if (mayLeave()) logout(); });
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 5_000);
}

function renderWaiting(state) {
  const recovery = stopExam();
  setView(`
    <section class="waiting-shell" data-session-id="${state.session.id}">
      <header class="waiting-header"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>PacePaper familiarisation</span><span class="waiting-actions">${themeToggleMarkup()}</span></header>
      <div class="waiting-content">
        <p class="eyebrow">Signed in</p>
        <h1 id="student-name"></h1>
        <div class="waiting-pulse" aria-hidden="true"></div>
        <h2>Waiting for your teacher</h2>
        <p id="waiting-paper"></p>
        <p>This examination will open here when the teacher starts it.</p>
        <p class="supervision-notice">Your teacher can see your work during a sitting: your answers, drawings, notes, and flagged questions. This covers only PacePaper — nothing else on your computer.</p>
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
  const mayLeave = attachRecoveryWarning(recovery, document.querySelector("#waiting-paper"));
  document.querySelector("#choose-exam").addEventListener("click", () => { if (mayLeave()) chooseAnotherExam(); });
  document.querySelector("#logout").addEventListener("click", () => { if (mayLeave()) logout(); });
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 5_000);
}
function renderPaused(state) {
  const recovery = stopExam();
  const lobby = state.status === "lobby";
  const awaiting = state.status === "awaiting-join";
  const joined = state.session.joined === true;
  const heading = lobby ? "Waiting to rejoin" : awaiting ? "Your teacher has started the exam again" : "The test is paused";
  setView(`
    <section class="waiting-shell pause-shell" data-session-id="${state.session.id}" data-state-key="${state.status}:${state.session.run}:${joined ? 1 : 0}">
      <header class="waiting-header"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>PacePaper</span><span class="waiting-actions">${themeToggleMarkup()}</span></header>
      <div class="waiting-content">
        <svg class="pause-hand" viewBox="0 0 220 200" role="img" aria-label="A hand holding a sign that says the test is paused">
          <g>
            <rect x="20" y="14" width="180" height="86" rx="10" fill="var(--color-surface, #fffdf7)" stroke="currentColor" stroke-width="4"/>
            <text x="110" y="52" text-anchor="middle" font-size="21" font-weight="700" letter-spacing="1" fill="currentColor">TEST IS</text>
            <text x="110" y="82" text-anchor="middle" font-size="21" font-weight="700" letter-spacing="1" fill="currentColor">PAUSED</text>
            <path d="M118 100v46" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
            <path d="M104 146c0-16 6-30 14-30s14 14 14 30-6 22-14 22-14-6-14-22Z" fill="var(--color-surface, #fffdf7)" stroke="currentColor" stroke-width="4"/>
            <path d="M132 168c10 4 16 12 16 22h-44" fill="var(--color-surface, #fffdf7)" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
          </g>
        </svg>
        <h1 id="student-name"></h1>
        <h2>${heading}</h2>
        <p id="paused-paper"></p>
        <p>${awaiting
          ? "Press Join to re-enter your paper. Your saved work and remaining time are kept."
          : lobby
            ? "Your teacher has opened the lobby. Press Join below, then wait — the exam restarts when your teacher begins it again, and your saved work and remaining time are kept."
            : "Your teacher has paused the examination. Your saved answers are kept and the clock is stopped. The exam continues when your teacher resumes it."}</p>
        <p id="paused-remaining" hidden></p>
        <p class="supervision-notice">Your teacher can see your work during a sitting: your answers, drawings, notes, and flagged questions. This covers only PacePaper — nothing else on your computer.</p>
        <p class="connection-state" id="connection-state">Connecting</p>
        ${lobby || awaiting ? '<button id="join-lobby" class="primary-action" type="button">Join</button>' : ""}
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </div>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  renderConnectionState();
  document.querySelector("#student-name").textContent = state.student.name;
  document.querySelector("#paused-paper").textContent = state.session.paperTitle;
  const remaining = Number(state.session.remainingMs);
  if (Number.isFinite(remaining) && remaining >= 0) {
    const element = document.querySelector("#paused-remaining");
    element.hidden = false;
    element.textContent = lobby || awaiting
      ? `${Math.ceil(remaining / 60_000)} minute${Math.ceil(remaining / 60_000) === 1 ? "" : "s"} will remain when you re-enter.`
      : `Time remaining when the exam resumes: ${Math.ceil(remaining / 60_000)} minute${Math.ceil(remaining / 60_000) === 1 ? "" : "s"}.`;
  }
  document.querySelector("#logout").addEventListener("click", () => logout());
  const join = document.querySelector("#join-lobby");
  if (joined && join) {
    join.disabled = true;
    join.textContent = "Joined · waiting for your teacher";
  } else if (join) {
    join.addEventListener("click", async () => {
      join.disabled = true;
      try {
        await api("/api/student/join", { method: "POST", body: { sessionId: state.session.id } });
        join.textContent = "Joined · waiting for your teacher";
        announce("You are in the lobby. Your teacher will start the exam.", "info");
        loadState();
      } catch (error) {
        join.disabled = false;
        announce(error instanceof Error ? error.message : "Join failed", "error");
      }
    });
  }
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 5_000);
}

function attachRecoveryWarning(recovery, anchor) {
  if (!recovery) return () => true;
  let downloaded = false;
  const warning = document.createElement("p");
  warning.setAttribute("role", "alert");
  warning.textContent = "Some changes in this page were not confirmed saved before the exam ended. Keep this page open, download a recovery copy and tell your teacher. The saved response may contain only earlier work.";
  const download = document.createElement("button");
  download.type = "button";
  download.textContent = "Download recovery copy";
  download.addEventListener("click", () => {
    downloadResponseRecovery(recovery);
    downloaded = true;
  });
  anchor.after(warning, download);
  const warnBeforeLeaving = (event) => {
    if (!downloaded) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", warnBeforeLeaving);
  const cleanup = () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  cleanup.pendingRecovery = () => downloaded ? undefined : recovery;
  cleanupExam = cleanup;
  return () => downloaded || confirm("Leave without downloading the unsent work? Keep this page open to download a recovery copy for your teacher.");
}
function renderHistoryResources(resources) {
  if (!Array.isArray(resources) || resources.length === 0) return null;
  const section = document.createElement("section");
  section.className = "submission-resources candidate-paper-resources";
  const heading = document.createElement("h4");
  heading.textContent = "Assessment materials";
  section.append(heading);
  for (const resource of resources) {
    const item = document.createElement("figure");
    item.className = "submission-resource";
    item.dataset.kind = resource.kind;
    if (resource.kind === "text") {
      const text = document.createElement("blockquote");
      text.className = "submission-resource-text";
      renderResourceText(text, resource.text, { label: resource.label });
      item.append(text);
    } else if (resource.kind === "image" && resource.url) {
      const image = document.createElement("img");
      image.src = resource.url;
      image.alt = resource.label;
      image.loading = "lazy";
      item.append(image);
    } else if (resource.kind === "document" && resource.url) {
      const frame = document.createElement("iframe");
      frame.src = resource.url;
      frame.title = resource.label;
      frame.loading = "lazy";
      item.append(frame);
    } else if (resource.kind === "video" && resource.url) {
      const link = document.createElement("a");
      link.className = "quiet-action compact";
      link.href = resource.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Open video material";
      item.append(link);
    } else {
      const note = document.createElement("p");
      note.className = "submission-resource-reference";
      note.textContent = resource.kind === "audio"
        ? "Audio playback is available only during the original sitting."
        : "This material is not available in the history view.";
      item.append(note);
    }
    const caption = document.createElement("figcaption");
    caption.textContent = resource.label;
    item.append(caption);
    section.append(item);
  }
  return section;
}

function renderHistory(state) {
  const recovery = stopExam();
  const paper = state.paper;
  const response = state.response;
  setView(`
    <section class="history-shell" data-session-id="${state.session.id}">
      <header class="waiting-header"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>PacePaper familiarisation</span><span class="waiting-actions">${themeToggleMarkup()}</span></header>
      <div class="history-content">
        <p class="eyebrow">Previous assessment</p>
        <h1 id="history-title"></h1>
        <p class="history-readonly">Read-only review of your saved response. Only your own assessments are available here.</p>
        <div id="history-paper" class="candidate-paper"></div>
        <button id="choose-exam" class="primary-action" type="button">Back to assessments</button>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </div>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  const mayLeave = attachRecoveryWarning(recovery, document.querySelector("#history-title"));

  const paperView = document.querySelector("#history-paper");
  document.querySelector("#history-title").textContent = paper.title;
  const header = document.createElement("header");
  header.className = "candidate-paper-header";
  header.append(
    Object.assign(document.createElement("p"), { className: "candidate-paper-kicker", textContent: "PacePaper practice examination · your response" }),
    Object.assign(document.createElement("h2"), { textContent: paper.title }),
  );
  const subject = [paper.subjectLabel, paper.level, paper.paper].filter(Boolean).join(" · ");
  if (subject) header.append(Object.assign(document.createElement("p"), { className: "candidate-paper-subject", textContent: subject }));
  const metadata = document.createElement("dl");
  metadata.className = "candidate-paper-metadata";
  const addMetadata = (label, value, className = "") => {
    const item = document.createElement("div");
    if (className) item.className = className;
    item.append(
      Object.assign(document.createElement("dt"), { textContent: label }),
      Object.assign(document.createElement("dd"), { textContent: value }),
    );
    metadata.append(item);
  };
  addMetadata("Candidate", state.student.name, "candidate-paper-identity");
  addMetadata("Paper", paper.paper || "Practice paper", "candidate-paper-code");
  addMetadata("Status", response.submittedAt === null ? "Ended without submission" : "Submitted", "candidate-paper-submission-state");
  header.append(metadata);
  paperView.append(header);
  const resources = renderHistoryResources(paper.resources);
  if (resources) paperView.append(resources);

  if (paper.instructions) {
    const instructions = document.createElement("section");
    instructions.className = "candidate-paper-instructions";
    instructions.append(
      Object.assign(document.createElement("h3"), { textContent: "Instructions" }),
      Object.assign(document.createElement("p"), { textContent: paper.instructions }),
    );
    paperView.append(instructions);
  }

  const answers = document.createElement("div");
  answers.className = "submission-answers";
  for (const [index, question] of paper.questions.entries()) {
    const item = document.createElement("article");
    item.className = "candidate-question";
    const heading = document.createElement("header");
    heading.className = "candidate-question-heading";
    heading.append(
      Object.assign(document.createElement("span"), { className: "candidate-question-number", textContent: String(index + 1).padStart(2, "0") }),
      Object.assign(document.createElement("h3"), { textContent: question.label }),
    );
    if (question.marks) heading.append(Object.assign(document.createElement("span"), { className: "candidate-question-marks", textContent: `[${question.marks}]` }));
    item.append(heading, Object.assign(document.createElement("p"), { className: "submission-prompt", textContent: question.prompt }));
    if (question.options?.length) {
      const options = document.createElement("ol");
      options.className = "candidate-question-options";
      options.type = "A";
      options.setAttribute("aria-label", "Answer choices");
      for (const option of question.options) {
        const choice = document.createElement("li");
        choice.textContent = option;
        options.append(choice);
      }
      item.append(options);
    }
    if (response.flags?.includes(question.id)) {
      const flagged = document.createElement("span");
      flagged.className = "candidate-question-selection";
      flagged.textContent = "Flagged";
      heading.append(flagged);
    }
    const answer = response.answers?.[question.id] ?? "";
    if (paper.selectionMode === "one" && question.type === "essay" && response.selectedQuestionId && question.id !== response.selectedQuestionId) {
      const notSelected = document.createElement("div");
      notSelected.className = "submission-answer candidate-question-not-selected";
      notSelected.textContent = "Not selected by candidate";
      item.append(notSelected);
    } else if (question.type === "ink" && question.ink && answer) {
      item.append(renderInkSubmission(answer, question.ink));
    } else {
      const content = document.createElement("div");
      content.className = "submission-answer";
      if (!answer) {
        content.textContent = "No response recorded";
      } else if (question.type === "essay") {
        content.innerHTML = answer;
      } else {
        content.textContent = answer;
      }
      item.append(content);
    }
    answers.append(item);
  }
  paperView.append(answers);
  if (typeof response.notepad === "string" && response.notepad.trim()) {
    const notepad = document.createElement("section");
    notepad.className = "candidate-paper-notepad";
    notepad.append(
      Object.assign(document.createElement("h3"), { textContent: "Candidate notepad" }),
      Object.assign(document.createElement("p"), { textContent: response.notepad }),
    );
    paperView.append(notepad);
  }
  const footer = document.createElement("footer");
  footer.className = "candidate-paper-footer";
  footer.textContent = "End of your assessment";
  paperView.append(footer);
  document.querySelector("#choose-exam").addEventListener("click", () => { if (mayLeave()) chooseAnotherExam(); });
  document.querySelector("#logout").addEventListener("click", () => { if (mayLeave()) logout(); });
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 15_000);
}

function renderSubmitted(state) {
  const recovery = stopExam();
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
  const mayLeave = attachRecoveryWarning(recovery, document.querySelector("#submitted-paper"));
  document.querySelector("#choose-exam").addEventListener("click", () => { if (mayLeave()) chooseAnotherExam(); });
  document.querySelector("#logout").addEventListener("click", () => { if (mayLeave()) logout(); });
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 15_000);
}

async function renderExam(state) {
  clearInterval(pollTimer);
  stopExam();
  const { mountExam } = await import("./exam.js");
  cleanupExam = mountExam(state, { onSubmitted: loadState });
  pollTimer = setInterval(loadState, 30_000);
}

let refreshQueued = false;

async function loadState() {
  if (loading) {
    // A lifecycle event arrived during a fetch: run one trailing refresh so the
    // screen cannot stay on a stale state until the next poll.
    refreshQueued = true;
    return;
  }
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
    } else if (state.status === "paused" || state.status === "lobby" || state.status === "awaiting-join") {
      // Pause, lobby and admission transitions must re-render this shell even
      // though the session id is unchanged.
      const key = `${state.status}:${state.session.run}:${state.session.joined ? 1 : 0}`;
      const shell = document.querySelector(`.pause-shell[data-session-id="${CSS.escape(state.session.id)}"]`);
      if (!shell || shell.dataset.stateKey !== key) renderPaused(state);
    } else if (state.status === "history") {
      if (!document.querySelector(`.history-shell[data-session-id="${CSS.escape(state.session.id)}"]`)) renderHistory(state);
    } else if (state.status === "submitted") {
      if (!document.querySelector(`.submitted-shell[data-session-id="${CSS.escape(state.session.id)}"]`)) renderSubmitted(state);
    } else if (!document.querySelector(`.exam-shell[data-session-id="${CSS.escape(state.session.id)}"]`)) {
      await renderExam(state);
    } else {
      // A run change (pause and Start again) means the mounted editor is stale:
      // remount so admission, phase and audio tickets match the current run.
      const shell = document.querySelector(`.exam-shell[data-session-id="${CSS.escape(state.session.id)}"]`);
      if (Number(shell.dataset.run) !== Number(state.session.run)) {
        await renderExam(state);
      } else {
        cleanupExam?.updateState?.(state);
      }
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      stopExam();
      stopLiveConnection();
      clearInterval(pollTimer);
      authFrame();
    } else {
      announce(error instanceof Error ? error.message : "Could not contact the examination server", "error");
    }
  } finally {
    loading = false;
    if (refreshQueued) {
      refreshQueued = false;
      void loadState();
    }
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
      // A device that missed a pause, lobby or start event while disconnected
      // learns the current state here instead of waiting for the next poll.
      loadState();
    } else if (event.type === "socket-closed") {
      connectionState = "reconnecting";
      renderConnectionState();
    } else if (["exam-started", "exam-ended", "exam-paused", "exam-lobby", "exam-list-changed"].includes(event.type)) {
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
