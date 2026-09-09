import { ApiError, announce, api, connectSocket, humanSubject, setView } from "/app.js";
import {
  collectionActionPath,
  emptyState,
  formatPaperTime,
  populateArchiveDialog,
  readCollectionTarget,
  renderClasses,
  renderSessions,
  syncOptions,
  updatePresence,
} from "/admin-collections.js";
import { renderPaperLibrary, renderSelectedPaper, renderSessionPaperSelectors } from "/admin-papers.js";
import { renderInkSubmission } from "/ink-canvas.js";
import { mountAdminNetwork } from "/admin-network.js";
import { mountClassRosterTransfer } from "/class-rosters.js";
import { mountPaperBuilder } from "/paper-builder.js";
import { confirmEndExam } from "./admin-end-exam.js";
import { mountStudentConnection } from "/student-connection.js";
import { renderResourceText } from "./resource-text.js";

let stopSocket;
let presenceTimer;
let currentState;
let studentConnectionOrigin;
let classroomNetworkControls;
const seenFocusEventIds = new Set();
// Focus events older than the dashboard page load are history, not alerts.
const adminOpenedAt = Date.now();

function authFrame(title, description, fields, actionLabel) {
  setView(`
    <section class="auth-shell">
      <a class="back-link" href="/">← Workspaces</a>
      <div class="auth-panel">
        <img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192">
        <p class="eyebrow">Teacher administration</p>
        <h1>${title}</h1>
        <p>${description}</p>
        <form id="auth-form" method="post">
          ${fields}
          <button class="primary-action" type="submit">${actionLabel}</button>
        </form>
        <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
      </div>
    </section>
  `);
}

function bindAuth(endpoint, onSuccess) {
  const form = document.querySelector("#auth-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    announce("Checking details…");
    try {
      const data = Object.fromEntries(new FormData(form));
      await api(endpoint, { method: "POST", body: data });
      await onSuccess();
    } catch (error) {
      announce(error instanceof Error ? error.message : "Sign-in failed", "error");
    } finally {
      submit.disabled = false;
    }
  });
}

function renderSetup() {
  authFrame(
    "Create the teacher account",
    "This first account controls paper imports, class rosters and live sessions on this server.",
    `
      <label for="username">Username</label>
      <input id="username" name="username" autocomplete="username" minlength="3" maxlength="40" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="new-password" minlength="10" required aria-describedby="password-help">
      <small id="password-help">At least 10 characters. The password is stored as an Argon2id hash.</small>
    `,
    "Create account",
  );
  bindAuth("/api/setup", renderDashboard);
}

function renderLogin() {
  authFrame(
    "Teacher sign in",
    "Demo login: admin / admin. Startup replaces existing teacher credentials, so keep this build on this computer.",
    `
      <label for="username">Username</label>
      <input id="username" name="username" value="admin" autocomplete="username" maxlength="40" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" value="admin" autocomplete="current-password" required aria-describedby="temporary-login-help">
      <small id="temporary-login-help">Temporary development-only credentials.</small>
    `,
    "Sign in",
  );
  bindAuth("/api/login/admin", renderDashboard);
}

async function refreshPresence() {
  try {
    const latest = await api("/api/admin/state");
    if (!currentState) return;
    currentState = { ...currentState, students: latest.students };
    updatePresence(currentState);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      stopSocket?.();
      clearInterval(presenceTimer);
      renderLogin();
    }
  }
}

function renderPapers(state) {
  renderSessionPaperSelectors(state.papers);
  renderPaperLibrary(state.papers);
}

function copy(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function formatAssessmentSession(value) {
  if (!value || value === "custom") return "Practice session";
  if (/^digitaldp-original-examples-v\d+$/.test(value)) return "Original practice sample";
  const match = /^(may|november)-(\d{4})$/i.exec(value);
  if (match) return `${match[1][0].toUpperCase()}${match[1].slice(1)} ${match[2]}`;
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function appendMetadata(list, label, value, className = "") {
  const item = document.createElement("div");
  if (className) item.className = className;
  item.append(copy("dt", "", label), copy("dd", "", value));
  list.append(item);
}

function appendQuestionResources(container, question, resourcesByKey, renderedResources, headingLabel = null) {
  const resources = (question.resourceKeys ?? [])
    .map((key) => resourcesByKey.get(key))
    .filter((resource) => resource && !renderedResources.has(resource.key));
  if (resources.length === 0) return;

  const section = document.createElement("section");
  section.className = headingLabel ? "submission-resources candidate-paper-resources" : "submission-resources";
  section.append(copy("h4", "", headingLabel ?? (resources.length === 1 ? "Question resource" : "Question resources")));
  for (const resource of resources) {
    renderedResources.add(resource.key);
    const item = document.createElement("figure");
    item.className = "submission-resource";
    item.dataset.kind = resource.kind;
    if (resource.kind === "image" && resource.url) {
      const image = document.createElement("img");
      image.src = resource.url;
      image.alt = resource.label;
      item.append(image);
    } else if (resource.kind === "text") {
      item.append(renderResourceText(copy("blockquote", "submission-resource-text", ""), resource.text, { label: resource.label }));
    } else {
      const description = resource.kind === "audio"
        ? "Listening audio · two complete plays · no pause or restart"
        : "PDF document · supplied with the digital examination";
      item.append(copy("p", "submission-resource-reference", description));
    }
    item.append(copy("figcaption", "", resource.label));
    section.append(item);
  }
  container.append(section);
}

function renderSubmissionAnswer(question, answer) {
  const content = document.createElement("div");
  content.className = "submission-answer";
  content.dataset.answerType = question.type;
  if (!answer) {
    content.classList.add("empty-state");
    content.textContent = "No response recorded";
  } else if (question.type === "essay") {
    content.innerHTML = answer;
  } else if (question.type === "ink" && question.ink) {
    content.replaceChildren(renderInkSubmission(answer, question.ink));
  } else {
    content.textContent = answer;
  }
  return content;
}

function appendCandidateNotepad(paper, notepad) {
  if (typeof notepad !== "string" || !notepad.trim()) return;
  const section = document.createElement("section");
  section.className = "candidate-paper-notepad";
  section.append(copy("h3", "", "Candidate notepad"), copy("p", "", notepad));
  paper.append(section);
}

function renderCandidatePaper(data, response) {
  const paper = document.createElement("section");
  paper.className = "candidate-paper";
  paper.setAttribute("aria-label", `${response.studentName}'s candidate paper`);

  const header = document.createElement("header");
  header.className = "candidate-paper-header";
  header.append(
    copy("p", "candidate-paper-kicker", "DigitalDP practice examination · candidate response"),
    copy("h2", "", data.session.paperTitle),
  );
  const subject = [data.session.subjectLabel, data.session.level, data.session.paper].filter(Boolean).join(" · ");
  if (subject) header.append(copy("p", "candidate-paper-subject", subject));

  const metadata = document.createElement("dl");
  metadata.className = "candidate-paper-metadata";
  appendMetadata(metadata, "Candidate", response.studentName, "candidate-paper-identity");
  appendMetadata(metadata, "Candidate code", response.candidateCode, "candidate-paper-code");
  appendMetadata(metadata, "Class", data.session.className);
  appendMetadata(metadata, "Assessment session", formatAssessmentSession(data.session.assessmentSession));
  appendMetadata(metadata, "Paper", data.session.paper ?? "Practice paper");
  if (data.session.maximumMarks) appendMetadata(metadata, "Maximum marks", String(data.session.maximumMarks));
  if (data.session.subjectWeightPercent) appendMetadata(metadata, "Subject weighting", `${data.session.subjectWeightPercent}%`);
  const selectedQuestion = data.questions.find((question) => question.id === response.selectedQuestionId);
  if (data.session.selectionMode === "one" && data.session.mode === "essay") {
    appendMetadata(metadata, "Selected prompt", selectedQuestion?.label ?? "No prompt selected", "candidate-paper-selection");
  }
  appendMetadata(metadata, "Time allowed", formatPaperTime(data.session));
  const timestamp = response.submittedAt ?? response.updatedAt;
  appendMetadata(
    metadata,
    response.submittedAt ? "Submitted" : "Last saved",
    new Date(timestamp).toLocaleString(),
    "candidate-paper-submission-state",
  );
  header.append(metadata);
  paper.append(header);

  if (data.session.instructions) {
    const instructions = document.createElement("section");
    instructions.className = "candidate-paper-instructions";
    instructions.append(copy("h3", "", "Instructions"), copy("p", "", data.session.instructions));
    paper.append(instructions);
  }

  const answers = document.createElement("div");
  answers.className = "submission-answers";
  const resourcesByKey = new Map((data.resources ?? []).map((resource) => [resource.key, resource]));
  const hasScopedResources = data.questions.some((question) => (question.resourceKeys ?? []).length > 0);
  const referencedResourceKeys = new Set(data.questions.flatMap((question) => question.resourceKeys ?? []));
  const commonResourceKeys = data.questions.length
    ? [...resourcesByKey.keys()].filter((key) => data.questions.every((question) => (question.resourceKeys ?? []).includes(key)))
    : [];
  const sharedResourceKeys = hasScopedResources
    ? [...new Set([...commonResourceKeys, ...[...resourcesByKey.keys()].filter((key) => !referencedResourceKeys.has(key))])]
    : [...resourcesByKey.keys()];
  const renderedResources = new Set();
  appendQuestionResources(
    paper,
    { resourceKeys: sharedResourceKeys },
    resourcesByKey,
    renderedResources,
    sharedResourceKeys.length === 1 ? "Paper resource" : "Paper resources",
  );
  for (const [index, question] of data.questions.entries()) {
    const answer = response.answers[question.id] ?? "";
    const item = document.createElement("article");
    item.className = "candidate-question";
    const heading = document.createElement("header");
    heading.className = "candidate-question-heading";
    const questionTitle = copy("h3", "", question.label);
    if (question.id === response.selectedQuestionId) {
      questionTitle.append(copy("span", "candidate-question-selection", "Selected prompt"));
    }
    heading.append(
      copy("span", "candidate-question-number", String(index + 1).padStart(2, "0")),
      questionTitle,
    );
    if (question.marks) heading.append(copy("span", "candidate-question-marks", `[${question.marks}]`));
    const prompt = copy("p", "submission-prompt", question.prompt);
    item.append(heading, prompt);
    appendQuestionResources(
      item,
      {
        ...question,
        resourceKeys: hasScopedResources
          ? (question.resourceKeys ?? []).filter((key) => !sharedResourceKeys.includes(key))
          : [],
      },
      resourcesByKey,
      renderedResources,
    );
    if (question.type === "single-choice" && question.options?.length) {
      const options = document.createElement("ol");
      options.className = "candidate-question-options";
      options.type = "A";
      options.setAttribute("aria-label", "Answer choices");
      question.options.forEach((option) => options.append(copy("li", "", option)));
      item.append(options);
    }
    if (
      data.session.selectionMode === "one" &&
      data.session.mode === "essay" &&
      response.selectedQuestionId &&
      question.id !== response.selectedQuestionId
    ) {
      const notSelected = copy("div", "submission-answer candidate-question-not-selected", "Not selected by candidate");
      notSelected.dataset.answerType = "not-selected";
      item.append(notSelected);
    } else {
      item.append(renderSubmissionAnswer(question, answer));
    }
    answers.append(item);
  }
  paper.append(answers);
  appendCandidateNotepad(paper, response.notepad);

  const footer = document.createElement("footer");
  footer.className = "candidate-paper-footer";
  footer.append(copy("span", "", "End of candidate response"), copy("code", "", response.candidateCode));
  paper.append(footer);
  return paper;
}

function renderSubmissions(data) {
  document.querySelector("#submissions-title").textContent = data.session.paperTitle;
  document.querySelector("#submissions-context").textContent = `${data.session.className} · ${data.responses.length} candidate${data.responses.length === 1 ? "" : "s"}`;
  const printAll = document.querySelector("#print-submissions");
  printAll.disabled = data.responses.length === 0;
  printAll.textContent = data.responses.length === 1 ? "Print or save PDF" : "Print all or save PDF";

  const list = document.querySelector("#submission-list");
  list.replaceChildren();
  if (data.responses.length === 0) {
    emptyState(list, "No candidate responses exist for this session.");
  }
  for (const response of data.responses) {
    const record = document.createElement("details");
    record.className = "submission-record";
    record.dataset.responseId = response.responseId;
    const summary = document.createElement("summary");
    const identity = copy("strong", "", response.studentName);
    const code = copy("code", "", response.candidateCode);
    const timestamp = response.submittedAt ?? response.updatedAt;
    const state = copy("span", "", `${response.submittedAt ? "Submitted" : "Last saved"} ${new Date(timestamp).toLocaleString()}`);
    summary.append(identity, code, state);

    const actions = document.createElement("div");
    actions.className = "submission-screen-actions";
    const printOne = copy("button", "compact", "Print this candidate");
    printOne.type = "button";
    printOne.dataset.printResponse = response.responseId;
    actions.append(printOne);
    record.append(summary, actions, renderCandidatePaper(data, response));
    list.append(record);
  }
  document.querySelector("#submissions-dialog").showModal();
}

function renderFocusEvents(events) {
  const section = document.createElement("section");
  section.className = "focus-integrity";
  const heading = copy("h3", "", "Focus integrity");
  const note = copy("p", "focus-integrity-note",
    events.length === 0
      ? "No focus-loss events were received. Focus reporting is best-effort — a disconnect or crash can prevent an event from arriving, so treat this as an audit signal, not proof of compliance."
      : `${events.filter((event) => event.kind === "focus_lost").length} focus-loss event${events.filter((event) => event.kind === "focus_lost").length === 1 ? "" : "s"} received. Best-effort signal — a disconnect or crash can prevent an event from arriving.`);
  section.append(heading, note);
  if (events.length > 0) {
    const list = document.createElement("ul");
    list.className = "focus-integrity-list";
    for (const event of events) {
      const item = document.createElement("li");
      item.dataset.kind = event.kind;
      item.textContent = `${new Date(event.at).toLocaleTimeString()} — ${event.studentName} (${event.candidateCode}) ${event.kind === "focus_lost" ? "left the exam window" : "returned"}`;
      list.append(item);
    }
    section.append(list);
  }
  return section;
}

async function openSubmissions(sessionId) {
  const slot = document.querySelector("#focus-integrity-slot");
  // Responses are the point of this dialog; focus telemetry must never block them.
  const responses = await api(`/api/admin/sessions/${sessionId}/responses`);
  renderSubmissions(responses);
  try {
    const focus = await api(`/api/admin/sessions/${sessionId}/focus-events`);
    slot.replaceChildren(renderFocusEvents(focus.events));
  } catch {
    slot.replaceChildren();
  }
}

function printSubmissions(responseId = null) {
  const list = document.querySelector("#submission-list");
  const records = [...list.querySelectorAll(".submission-record")];
  const printable = responseId
    ? records.filter((record) => record.dataset.responseId === responseId)
    : records;
  if (printable.length === 0) return;

  list.dataset.printMode = responseId ? "single" : "all";
  records.forEach((record) => {
    const position = printable.indexOf(record);
    record.toggleAttribute("data-print-target", position !== -1);
    record.toggleAttribute("data-print-first", position === 0);
  });
  printable.forEach((record) => { record.open = true; });

  const restoreScreenView = () => {
    delete list.dataset.printMode;
    records.forEach((record) => {
      record.removeAttribute("data-print-target");
      record.removeAttribute("data-print-first");
    });
  };
  window.addEventListener("afterprint", restoreScreenView, { once: true });
  try {
    announce("Opening the browser print dialog. Choose Save as PDF to create a file.");
    // Keep this inside the click call stack. Waiting for image decoding can cause
    // WebViews and some browsers to ignore a delayed native-print request.
    window.print();
  } catch {
    restoreScreenView();
    announce("The browser could not open its print dialog. Try Chrome or Safari to save this paper as a PDF.", "error");
  }
}


function renderState(state) {
  currentState = state;
  updateStudentConnection(state.network);
  renderClasses(state);
  renderPapers(state);
  renderSessions(state);
  const live = state.sessions.filter((session) => session.status === "live").length;
  document.querySelector("#overview-classes").textContent = String(state.classes.length);
  document.querySelector("#overview-students").textContent = String(state.students.length);
  document.querySelector("#overview-papers").textContent = String(state.papers.length);
  document.querySelector("#overview-live").textContent = String(live);
  refreshLiveFocus(state);
}
function renderLiveFocusList(live) {
  const section = document.querySelector("#focus-live");
  if (!section) return;
  const list = document.querySelector("#focus-live-list");
  const rows = [];
  for (const session of live) {
    for (const student of session.focus ?? []) {
      rows.push({ session, student });
    }
  }
  section.hidden = rows.length === 0;
  list.replaceChildren();
  for (const { session, student } of rows) {
    const item = document.createElement("li");
    item.className = "focus-live-row";
    item.dataset.away = String(student.currentlyAway);
    const details = document.createElement("details");
    details.className = "focus-live-details";
    const summaryEl = document.createElement("summary");
    const name = document.createElement("strong");
    name.textContent = student.studentName;
    const code = document.createElement("code");
    code.textContent = student.candidateCode;
    const status = document.createElement("span");
    status.className = "focus-live-status";
    const last = student.lastEventAt ? new Date(student.lastEventAt).toLocaleTimeString() : "—";
    status.textContent = student.currentlyAway
      ? `away now · ${student.lostCount} loss${student.lostCount === 1 ? "" : "es"} · last ${last}`
      : `${student.lostCount} focus loss${student.lostCount === 1 ? "" : "es"} · last ${last}`;
    summaryEl.append(name, code, status);
    details.append(summaryEl);
    const events = document.createElement("ol");
    events.className = "focus-live-events";
    for (const event of student.events ?? []) {
      const entry = document.createElement("li");
      entry.dataset.kind = event.kind;
      entry.textContent = `${new Date(event.at).toLocaleTimeString()} — ${event.kind === "focus_lost" ? "left the exam window" : "returned"}`;
      events.append(entry);
    }
    details.append(events);
    item.append(details);
    list.append(item);
  }
}

function focusToastContainer() {
  let container = document.querySelector(".focus-toasts");
  if (!container) {
    container = document.createElement("div");
    container.className = "focus-toasts";
    container.setAttribute("aria-label", "Focus alerts");
    document.body.append(container);
  }
  return container;
}

function showFocusToast(event) {
  const toast = document.createElement("div");
  toast.className = "focus-toast";
  toast.setAttribute("role", "alert");
  const label = document.createElement("p");
  label.textContent = `${new Date(event.at).toLocaleTimeString()} — ${event.studentName} (${event.candidateCode}) left the exam window`;
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.setAttribute("aria-label", "Dismiss notification");
  dismiss.textContent = "Dismiss";
  const container = focusToastContainer();
  const close = () => {
    toast.remove();
    if (container.childElementCount === 0) container.remove();
  };
  dismiss.addEventListener("click", close);
  toast.append(label, dismiss);
  container.append(toast);
  while (container.childElementCount > 4) container.firstElementChild?.remove();
  setTimeout(() => {
    toast.remove();
    if (container.childElementCount === 0) container.remove();
  }, 10_000);
}

async function refreshLiveFocus(state) {
  const section = document.querySelector("#focus-live");
  if (!section) return;
  const live = (state?.sessions ?? []).filter((session) => session.status === "live");
  if (live.length === 0) {
    section.hidden = true;
    return;
  }
  const newFocusLosses = [];
  const withFocus = await Promise.all(live.map(async (session) => {
    try {
      const result = await api(`/api/admin/sessions/${session.id}/focus-events`);
      const byStudent = new Map();
      for (const event of result.events ?? []) {
        // Events that arrived after this dashboard opened (and were not yet
        // announced) raise a notification; the history before page load stays silent.
        if (event.kind === "focus_lost" && event.at >= adminOpenedAt && !seenFocusEventIds.has(event.id)) newFocusLosses.push(event);
        seenFocusEventIds.add(event.id);
        let summary = byStudent.get(event.studentId);
        if (!summary) {
          summary = { studentId: event.studentId, studentName: event.studentName, candidateCode: event.candidateCode, lostCount: 0, currentlyAway: false, lastEventAt: null, events: [] };
          byStudent.set(event.studentId, summary);
        }
        if (event.kind === "focus_lost") { summary.lostCount += 1; summary.currentlyAway = true; }
        else summary.currentlyAway = false;
        summary.lastEventAt = event.at;
        summary.events.push({ kind: event.kind, at: event.at });
      }
      return { ...session, focus: [...byStudent.values()] };
    } catch {
      return { ...session, focus: [] };
    }
  }));
  renderLiveFocusList(withFocus);
  for (const event of newFocusLosses) showFocusToast(event);
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

async function requestClassroomNetwork(path, options) {
  const state = await api(path, options);
  updateStudentConnection(state);
  return state;
}

async function refreshState(silent = false) {
  try {
    renderState(await api("/api/admin/state"));
    if (!silent) announce("Dashboard updated", "success");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      stopSocket?.();
      clearInterval(presenceTimer);
      renderLogin();
      return;
    }
    announce(error instanceof Error ? error.message : "Could not update dashboard", "error");
  }
}

async function mutate(form, path, transform) {
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    const values = Object.fromEntries(new FormData(form));
    await api(path, { method: "POST", body: transform ? transform(values) : values });
    form.reset();
    await refreshState(true);
    announce("Saved", "success");
  } catch (error) {
    announce(error instanceof Error ? error.message : "Could not save", "error");
  } finally {
    submit.disabled = false;
  }
}

async function importPaper(form) {
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    await api("/api/admin/papers", { method: "POST", body: new FormData(form) });
    form.reset();
    await refreshState(true);
    announce("Paper added to the library", "success");
  } catch (error) {
    announce(error instanceof Error ? error.message : "Could not add paper", "error");
  } finally {
    submit.disabled = false;
  }
}

async function addBuiltPaper(data) {
  await api("/api/admin/papers", { method: "POST", body: data });
  await refreshState(true);
  announce("Paper added to the library", "success");
}

function showStudentEditError(message) {
  const errorRegion = document.querySelector("#student-edit-error");
  errorRegion.textContent = message;
  errorRegion.hidden = false;
  errorRegion.focus();
}

function openStudentEditor(studentId) {
  const student = currentState?.students.find((candidate) => candidate.id === studentId);
  if (!student) {
    announce("That student is no longer in the current roster", "error");
    return;
  }

  const dialog = document.querySelector("#student-edit-dialog");
  const form = document.querySelector("#student-edit-form");
  form.reset();
  form.dataset.studentId = student.id;
  form.elements.namedItem("name").value = student.name;
  form.elements.namedItem("candidateCode").value = student.candidateCode;
  form.elements.namedItem("extraMinutes").value = String(student.extraMinutes ?? 0);
  document.querySelector("#student-edit-title").textContent = `Edit ${student.name}`;
  document.querySelector("#student-edit-context").textContent = "Update the candidate details below.";
  const errorRegion = document.querySelector("#student-edit-error");
  errorRegion.textContent = "";
  errorRegion.hidden = true;
  dialog.showModal();
  form.elements.namedItem("name").focus();
}

async function saveStudentEdits(form) {
  const student = currentState?.students.find((candidate) => candidate.id === form.dataset.studentId);
  if (!student) {
    showStudentEditError("That student is no longer in the current roster. Close this window and try again.");
    return;
  }

  const submit = form.querySelector("button[type=submit]");
  const values = Object.fromEntries(new FormData(form));
  const updatedName = String(values.name).trim();
  submit.disabled = true;
  try {
    await api(`/api/admin/students/${encodeURIComponent(student.id)}`, {
      method: "PUT",
      body: {
        classId: student.classId,
        name: updatedName,
        candidateCode: String(values.candidateCode).trim(),
        extraMinutes: Number(values.extraMinutes),
      },
    });
    document.querySelector("#student-edit-dialog").close();
    await refreshState(true);
    announce(`${updatedName} updated`, "success");
  } catch (error) {
    showStudentEditError(error instanceof Error ? error.message : "Could not update student");
  } finally {
    submit.disabled = false;
  }
}

function lifecycleFocusTarget(target) {
  if (target.action === "archive") {
    return document.querySelector(target.collection === "sessions" ? "#archived-sessions-summary" : "#archived-roster-summary");
  }
  return document.querySelector(
    `button[data-collection-action="archive"][data-collection="${target.collection}"][data-collection-id="${CSS.escape(target.id)}"]`,
  );
}

async function changeCollectionLifecycle(target) {
  announce("");
  await api(collectionActionPath(target.collection, target.id, target.action), { method: "POST" });
  await refreshState(true);
  announce(
    target.action === "archive"
      ? `${target.label} removed. Previous responses remain saved.`
      : `${target.label} restored.`,
    "success",
  );
  return lifecycleFocusTarget(target);
}

function bindCollectionController() {
  const root = document.querySelector(".admin-main");
  const dialog = document.querySelector("#archive-dialog");
  const form = document.querySelector("#archive-form");
  const confirm = document.querySelector("#confirm-archive");
  const errorRegion = document.querySelector("#archive-error");
  let pendingArchive = null;
  let archiveTrigger = null;

  root.addEventListener("click", async (event) => {
    const button = event.target.closest(
      "button[data-edit-student], button[data-session-action], button[data-responses], button[data-collection-action]",
    );
    if (!button || button.disabled) return;

    if (button.dataset.editStudent) {
      openStudentEditor(button.dataset.editStudent);
      return;
    }
    if (button.dataset.responses) {
      button.disabled = true;
      try {
        announce("");
        await openSubmissions(button.dataset.responses);
      } catch (error) {
        announce(error instanceof Error ? error.message : "Could not load submissions", "error");
      } finally {
        button.disabled = false;
      }
      return;
    }
    if (button.dataset.sessionAction) {
      button.disabled = true;
      const sessionId = button.dataset.sessionId;
      const action = button.dataset.sessionAction;
      try {
        if (action === "end" && !await confirmEndExam({ trigger: button,
          loadResults: () => api(`/api/admin/sessions/${sessionId}/responses`) })) return;
        await api(`/api/admin/sessions/${sessionId}/${action}`, { method: "POST" });
        await refreshState(true);
        announce(button.dataset.sessionAction === "start" ? "Exam started" : "Exam ended and responses submitted", "success");
      } catch (error) {
        announce(error instanceof Error ? error.message : "Session action failed", "error");
      } finally {
        button.disabled = false;
      }
      return;
    }

    const target = readCollectionTarget(button);
    if (!target) return;
    if (target.action === "archive") {
      pendingArchive = target;
      archiveTrigger = button;
      dialog.returnValue = "";
      populateArchiveDialog(dialog, target);
      dialog.showModal();
      return;
    }

    button.disabled = true;
    try {
      const focusTarget = await changeCollectionLifecycle(target);
      focusTarget?.focus();
    } catch (error) {
      announce(error instanceof Error ? error.message : "Could not restore this item", "error");
      button.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!pendingArchive) return;
    confirm.disabled = true;
    errorRegion.textContent = "";
    errorRegion.hidden = true;
    try {
      const focusTarget = await changeCollectionLifecycle(pendingArchive);
      dialog.close("confirmed");
      focusTarget?.focus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove this item";
      errorRegion.textContent = message;
      errorRegion.hidden = false;
      errorRegion.focus();
      announce(message, "error");
    } finally {
      confirm.disabled = false;
    }
  });

  document.querySelector("[data-cancel-archive]").addEventListener("click", () => dialog.close("cancel"));
  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "confirmed" && archiveTrigger?.isConnected) archiveTrigger.focus();
    pendingArchive = null;
    archiveTrigger = null;
    errorRegion.textContent = "";
    errorRegion.hidden = true;
  });
}

function bindDashboard() {
  document.querySelector("#logout").addEventListener("click", async () => {
    if (!await document.querySelector("#paper-builder-form")?.canLeave?.()) {
      announce("Your paper draft could not be saved. Keep this page open and save it to the library before signing out.", "error");
      return;
    }
    await api("/api/logout", { method: "POST" });
    stopSocket?.();
    clearInterval(presenceTimer);
    renderLogin();
  });

  document.querySelector("#class-form").addEventListener("submit", (event) => {
    event.preventDefault();
    mutate(event.currentTarget, "/api/admin/classes");
  });

  document.querySelector("#student-form").addEventListener("submit", (event) => {
    event.preventDefault();
    mutate(event.currentTarget, "/api/admin/students", (values) => ({ ...values, extraMinutes: Number(values.extraMinutes || 0) }));
  });

  const studentEditDialog = document.querySelector("#student-edit-dialog");
  const studentEditForm = document.querySelector("#student-edit-form");
  studentEditForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudentEdits(event.currentTarget);
  });
  document.querySelector("[data-close-student-edit]").addEventListener("click", () => studentEditDialog.close());
  studentEditDialog.addEventListener("close", () => {
    studentEditForm.reset();
    delete studentEditForm.dataset.studentId;
  });

  document.querySelectorAll("[data-paper-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      importPaper(event.currentTarget);
    });
  });

  document.querySelector("#session-form").addEventListener("submit", (event) => {
    event.preventDefault();
    mutate(event.currentTarget, "/api/admin/sessions");
  });
  document.querySelector("#session-system").addEventListener("change", () => renderSessionPaperSelectors(currentState.papers));
  document.querySelector("#session-paper").addEventListener("change", () => renderSelectedPaper(currentState.papers));
  document.querySelector("#library-search").addEventListener("input", () => renderPaperLibrary(currentState.papers));
  document.querySelector("#library-system").addEventListener("change", () => renderPaperLibrary(currentState.papers));

  bindCollectionController();

  document.querySelector("#print-submissions").addEventListener("click", () => printSubmissions());
  document.querySelector("#submission-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-print-response]");
    if (button) printSubmissions(button.dataset.printResponse);
  });

  document.querySelectorAll("[data-jump]").forEach((link) => {
    link.addEventListener("click", () => document.querySelector(link.dataset.jump).scrollIntoView({ behavior: "instant" }));
  });
}

async function renderDashboard() {
  classroomNetworkControls?.destroy();
  setView(`
    <div class="admin-shell">
      <aside class="admin-rail">
        <a class="admin-brand" href="/"><img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192"><span>DigitalDP</span></a>
        <nav aria-label="Dashboard sections">
          <button type="button" data-jump="#overview">Overview</button>
          <button type="button" data-jump="#classes">Classes</button>
          <button type="button" data-jump="#sessions">Sessions</button>
          <button type="button" data-jump="#papers">Paper library</button>
        </nav>
        <a class="quiet-action" href="/guide" target="_blank" rel="noopener">User guide ↗</a>
        <a class="quiet-action" href="/mock-guides" target="_blank" rel="noopener">Mock marking guides ↗</a>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </aside>
      <div class="admin-main">
        <header class="admin-topbar">
          <div><p class="eyebrow">Teacher dashboard</p><h1>Teacher desk</h1></div>
          <span class="connection-state" id="connection-state">Connecting</span>
        </header>
        <p id="global-status" class="status-message sticky-status" role="status" aria-live="polite" hidden></p>

        <section id="overview" class="admin-section">
          <div class="section-heading"><div><h2>Overview</h2><p>Prepare your classes and papers, then start and monitor exam sessions.</p></div></div>
          <section class="session-row" aria-labelledby="student-connection-title">
            <div>
              <strong id="student-connection-title">Student sign-in</strong>
              <a data-student-connection-link href="/student" target="_blank" rel="noopener">/student</a>
              <small>This is the address students open on their own devices. Turn on classroom sharing below to allow connections.</small>
            </div>
            <div class="session-actions">
              <button data-copy-student-connection type="button" aria-describedby="student-connection-copy-status">Copy URL</button>
              <span id="student-connection-copy-status" data-copy-student-connection-status role="status" aria-live="polite" aria-atomic="true" hidden></span>
            </div>
          </section>
          <div id="classroom-network"></div>
          <dl class="metric-strip">
            <div><dt>Classes</dt><dd id="overview-classes">0</dd></div>
            <div><dt>Students</dt><dd id="overview-students">0</dd></div>
            <div><dt>Papers</dt><dd id="overview-papers">0</dd></div>
            <div><dt>Live sessions</dt><dd id="overview-live">0</dd></div>
          </dl>
        </section>

        <section id="classes" class="admin-section two-column-section">
          <div>
            <div class="section-heading"><div><h2>Classes and students</h2><p>Prepare class lists in advance, then update them whenever circumstances change.</p></div></div>
            <div id="class-list" class="roster-groups"></div>
            <details id="archived-roster" class="archived-collection">
              <summary id="archived-roster-summary">Removed classes and students (<span id="archived-roster-count">0</span>)</summary>
              <p>Removed roster entries are unavailable at student sign-in. Restore them here when needed.</p>
              <div id="archived-roster-list" class="archived-collection-list"></div>
            </details>
          </div>
          <div class="form-stack">
            <form id="class-form" class="utility-form" method="post">
              <fieldset><legend>Create class</legend>
                <label for="class-name">Class name</label><input id="class-name" name="name" required maxlength="100">
                <label for="class-code">Class code</label><input id="class-code" name="code" required minlength="4" maxlength="24" pattern="[A-Za-z0-9\\-]+" autocomplete="off">
                <button type="submit">Create class</button>
              </fieldset>
            </form>
            <form id="student-form" class="utility-form" method="post">
              <fieldset><legend>Add student</legend>
                <label for="student-class">Class</label><select id="student-class" name="classId" required></select>
                <label for="student-name">Student name</label><input id="student-name" name="name" required maxlength="100" autocomplete="off">
                <label for="candidate-code">Candidate code</label><input id="candidate-code" name="candidateCode" required minlength="2" maxlength="32" pattern="[A-Za-z0-9\\-]{2,32}" autocomplete="off" aria-describedby="candidate-code-help">
                <small id="candidate-code-help">A unique student reference for this class, such as S01. Use 2–32 letters, numbers or hyphens.</small>
                <label for="extra-minutes">Extra time in minutes</label><input id="extra-minutes" name="extraMinutes" type="number" min="0" max="180" value="0">
                <button type="submit">Add student</button>
              </fieldset>
            </form>
            <div id="class-roster-transfer"></div>
          </div>
        </section>

        <section id="papers" class="admin-section two-column-section">
          <div>
            <div class="section-heading"><div><h2>Paper library</h2><p>Create a paper with the guided builder or import a prepared package.</p></div></div>
            <div class="library-filters">
              <label for="library-system">Exam system</label><select id="library-system"></select>
              <label for="library-search">Find a paper</label><input id="library-search" type="search" placeholder="Subject, paper or level" aria-controls="paper-list">
              <p id="library-count" role="status" aria-live="polite"></p>
            </div>
            <ul id="paper-list" class="paper-list" tabindex="0" aria-label="Available papers"></ul>
          </div>
          <div class="form-stack">
            <form id="portable-paper-form" data-paper-form class="utility-form paper-portability" method="post" enctype="multipart/form-data">
              <input name="format" type="hidden" value="portable">
              <fieldset><legend>Import a saved paper</legend>
                <p class="form-help">A single DigitalDP paper file includes its questions, settings and permitted attachments.</p>
                <label for="portable-paper">DigitalDP paper file</label><input id="portable-paper" name="portablePaper" type="file" accept=".digitaldp-paper,application/vnd.digitaldp.paper+gzip" required>
                <button type="submit">Import paper</button>
              </fieldset>
            </form>

            <div id="paper-builder"></div>

            <details class="advanced-import">
              <summary>Advanced: import a prepared paper package</summary>
              <form id="package-form" data-paper-form class="utility-form" method="post" enctype="multipart/form-data">
                <input name="format" type="hidden" value="package">
                <fieldset><legend>Structured paper package</legend>
                  <p class="form-help">For paper files prepared outside the guided builder.</p>
                  <label for="paper-package">Paper files</label><input id="paper-package" name="packageFiles" type="file" accept="application/json,.json,application/pdf,image/png,image/jpeg,image/webp,audio/mpeg,audio/mp4,audio/ogg,audio/wav" multiple required aria-describedby="package-help">
                  <small id="package-help">Select <code>paper.json</code> and every referenced PDF, image or audio file together.</small>
                  <button type="submit">Add paper package</button>
                </fieldset>
              </form>
            </details>

            <details class="advanced-import">
              <summary>Advanced: manifest and separate assets</summary>
              <form id="advanced-paper-form" data-paper-form class="utility-form" method="post" enctype="multipart/form-data">
                <fieldset><legend>Developer import</legend>
                  <label for="manifest">Manifest JSON</label><input id="manifest" name="manifest" type="file" accept="application/json,.json" required>
                  <label for="assets">Referenced PDFs, images or audio</label><input id="assets" name="assets" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,audio/mpeg,audio/mp4,audio/ogg,audio/wav" multiple>
                  <small>Select every file named by the manifest.</small>
                  <button type="submit">Import manifest</button>
                </fieldset>
              </form>
            </details>
          </div>
        </section>

        <section id="sessions" class="admin-section two-column-section">
          <div>
            <div class="section-heading"><div><h2>Sessions</h2><p>Choose a prepared paper and a class. Students join the waiting room until you select Start exam.</p></div><a class="clock-launch" href="/clock" target="_blank" rel="noopener">Open examination clock ↗</a></div>
            <ul id="session-list" class="session-list"></ul>
            <details id="archived-sessions" class="archived-collection">
              <summary id="archived-sessions-summary">Removed exam sittings (<span id="archived-session-count">0</span>)</summary>
              <p>Previous responses stay saved. Restore a sitting to make it available to students again.</p>
              <ul id="archived-session-list" class="session-list"></ul>
            </details>
            <section id="focus-live" class="focus-live" aria-labelledby="focus-live-title" hidden>
              <div class="section-heading"><div><h3 id="focus-live-title">Focus alerts</h3><p id="focus-live-context">Live — updates as candidates leave or return to the exam window.</p></div></div>
              <ul id="focus-live-list" class="focus-live-list"></ul>
            </section>
          </div>
          <form id="session-form" class="utility-form" method="post">
            <fieldset><legend>Set up an exam</legend>
              <small>This creates a new draft sitting from the library paper. The original stays unchanged and can be reused for other classes or dates.</small>
              <label for="session-class">Class</label><select id="session-class" name="classId" required></select>
              <label for="session-system">Exam system</label><select id="session-system" required></select>
              <label for="session-paper">Paper</label><select id="session-paper" name="paperId" required></select>
              <aside id="session-paper-summary" class="paper-readiness" aria-live="polite" hidden></aside>
              <button type="submit">Set up exam</button>
            </fieldset>
          </form>
        </section>
      </div>
    </div>
    <dialog id="student-edit-dialog" class="exam-dialog compact-dialog" aria-labelledby="student-edit-title" aria-describedby="student-edit-context">
      <form id="student-edit-form" method="post">
        <header><p class="eyebrow">Candidate details</p><h2 id="student-edit-title">Edit student</h2><p id="student-edit-context">Update the candidate details below.</p></header>
        <fieldset class="preference-grid">
          <legend class="visually-hidden">Student details</legend>
          <label for="edit-student-name">Display name<input id="edit-student-name" name="name" required maxlength="100" autocomplete="off"></label>
          <label for="edit-candidate-code">Candidate code<input id="edit-candidate-code" name="candidateCode" required minlength="2" maxlength="32" pattern="[A-Za-z0-9\\-]{2,32}" autocomplete="off"></label>
          <label for="edit-extra-minutes">Extra time in minutes<input id="edit-extra-minutes" name="extraMinutes" type="number" min="0" max="180" value="0" required></label>
        </fieldset>
        <p id="student-edit-error" class="status-message" data-tone="error" role="alert" tabindex="-1" hidden></p>
        <footer><button type="button" data-close-student-edit>Cancel</button><button class="primary-action" type="submit">Save changes</button></footer>
      </form>
    </dialog>
    <dialog id="archive-dialog" class="exam-dialog compact-dialog danger-dialog" aria-labelledby="archive-title" aria-describedby="archive-context">
      <form id="archive-form" method="dialog">
        <header><p class="eyebrow">Reversible removal</p><h2 id="archive-title">Remove this item?</h2><p id="archive-context">Access stops, but previous responses stay saved and the item can be restored later.</p></header>
        <p id="archive-error" class="status-message" data-tone="error" role="alert" tabindex="-1" hidden></p>
        <footer><button type="button" data-cancel-archive>Cancel</button><button id="confirm-archive" class="danger-action" type="submit" value="confirm">Remove</button></footer>
      </form>
    </dialog>
    <dialog id="submissions-dialog" class="exam-dialog submissions-dialog">
      <form method="dialog">
        <header><p class="eyebrow">Completed papers</p><h2 id="submissions-title">Candidate responses</h2><p id="submissions-context"></p><p>Open a candidate to review their complete paper. Use your browser's print dialog to print one candidate or save a single class PDF.</p></header>
        <div id="focus-integrity-slot"></div>
        <div id="submission-list" class="submission-list"></div>
        <footer><button id="print-submissions" type="button">Print or save PDF</button><button value="close">Close</button></footer>
      </form>
    </dialog>
  `);
  document.querySelector(".admin-main").append(document.querySelector("#papers"));
  mountStudentConnection(document, { origin: studentConnectionOrigin });
  classroomNetworkControls = mountAdminNetwork(document.querySelector("#classroom-network"), {
    request: requestClassroomNetwork,
  });
  mountClassRosterTransfer(document.querySelector("#class-roster-transfer"), {
    request: api,
    onImported: () => refreshState(true),
    notify: announce,
  });
  mountPaperBuilder(document.querySelector("#paper-builder"), addBuiltPaper);
  bindDashboard();
  await refreshState(true);
  stopSocket?.();
  stopSocket = connectSocket((event) => {
    const indicator = document.querySelector("#connection-state");
    if (!indicator) return;
    if (event.type === "socket-open" || event.type === "connected") {
      indicator.textContent = "Live connection";
      indicator.dataset.connected = "true";
    } else if (event.type === "socket-closed") {
      indicator.textContent = "Reconnecting";
      indicator.dataset.connected = "false";
    } else if (event.type === "admin-state") {
      refreshState(true);
    }
  });
  clearInterval(presenceTimer);
  presenceTimer = setInterval(refreshPresence, 10_000);
}

export async function renderAdmin(bootstrap) {
  studentConnectionOrigin = bootstrap.studentOrigin ?? location.origin;
  if (bootstrap.setupRequired) {
    renderSetup();
  } else if (bootstrap.role === "admin") {
    await renderDashboard();
  } else {
    renderLogin();
  }
}
