import { ApiError, announce, api, connectSocket, humanSubject, setView } from "/app.js";
import { renderInkSubmission } from "/ink-canvas.js";
import { mountPaperBuilder } from "/paper-builder.js";

let stopSocket;
let refreshTimer;
let currentState;

function authFrame(title, description, fields, actionLabel) {
  setView(`
    <section class="auth-shell">
      <a class="back-link" href="/">← Workspaces</a>
      <div class="auth-panel">
        <span class="product-mark" aria-hidden="true">DP</span>
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

function option(select, value, label) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = label;
  select.append(item);
}

function emptyState(container, message) {
  const paragraph = document.createElement("p");
  paragraph.className = "empty-state";
  paragraph.textContent = message;
  container.append(paragraph);
}

function renderClasses(state) {
  const classList = document.querySelector("#class-list");
  classList.replaceChildren();
  const studentClass = document.querySelector("#student-class");
  const sessionClass = document.querySelector("#session-class");
  studentClass.replaceChildren();
  sessionClass.replaceChildren();
  option(studentClass, "", "Choose class");
  option(sessionClass, "", "Choose class");

  if (state.classes.length === 0) emptyState(classList, "Create a class before adding students.");
  for (const schoolClass of state.classes) {
    option(studentClass, schoolClass.id, `${schoolClass.name} · ${schoolClass.code}`);
    option(sessionClass, schoolClass.id, `${schoolClass.name} · ${schoolClass.code}`);
    const students = state.students.filter((student) => student.classId === schoolClass.id);
    const section = document.createElement("section");
    section.className = "roster-group";
    const heading = document.createElement("div");
    heading.className = "roster-heading";
    const name = document.createElement("strong");
    name.textContent = schoolClass.name;
    const code = document.createElement("code");
    code.textContent = schoolClass.code;
    heading.append(name, code);
    section.append(heading);

    if (students.length === 0) {
      emptyState(section, "No students yet.");
    } else {
      const list = document.createElement("ul");
      list.className = "roster-list";
      for (const student of students) {
        const item = document.createElement("li");
        const identity = document.createElement("span");
        identity.textContent = `${student.name} · ${student.candidateCode}`;
        const metadata = document.createElement("small");
        const online = student.lastSeenAt && Date.now() - student.lastSeenAt < 20_000;
        metadata.dataset.online = String(Boolean(online));
        metadata.textContent = `${online ? "online" : "offline"}${student.extraMinutes ? ` · +${student.extraMinutes} min` : ""}`;
        item.append(identity, metadata);
        list.append(item);
      }
      section.append(list);
    }
    classList.append(section);
  }
}

function renderPapers(state) {
  const list = document.querySelector("#paper-list");
  const sessionPaper = document.querySelector("#session-paper");
  list.replaceChildren();
  sessionPaper.replaceChildren();
  option(sessionPaper, "", "Choose paper");
  if (state.papers.length === 0) emptyState(list, "Choose an exam in the Paper Builder to add your first practice paper.");
  for (const paper of state.papers) {
    option(sessionPaper, paper.id, `${paper.title} · ${paper.level}`);
    const row = document.createElement("li");
    const main = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = paper.title;
    const metadata = document.createElement("small");
    const rightsLabel = ({
      "teacher-authored": "teacher-authored",
      "school-authorized": "school-authorized",
      "official-public-reference": "official reference",
      "unknown-local-only": "local-only",
    })[paper.sourceClassification] ?? "rights not recorded";
    metadata.textContent = `${paper.subjectLabel ?? humanSubject(paper.subject)} · ${paper.level} · ${paper.paper} · ${rightsLabel}`;
    main.append(title, metadata);
    const actions = document.createElement("div");
    actions.className = "paper-list-actions";
    const duration = document.createElement("code");
    duration.textContent = paper.readingTimeMinutes
      ? `${paper.readingTimeMinutes} min read + ${paper.durationMinutes} min write`
      : `${paper.durationMinutes} min`;
    const canExport = ["teacher-authored", "school-authorized"].includes(paper.sourceClassification)
      && paper.exportAuthorized;
    if (canExport) {
      const exportLink = document.createElement("a");
      exportLink.className = "quiet-action compact";
      exportLink.href = `/api/admin/papers/${paper.id}/export`;
      exportLink.download = "";
      exportLink.textContent = "Export";
      exportLink.setAttribute("aria-label", `Export ${paper.title}`);
      actions.append(duration, exportLink);
    } else {
      const localOnly = document.createElement("small");
      localOnly.className = "paper-local-only";
      localOnly.textContent = ["teacher-authored", "school-authorized"].includes(paper.sourceClassification)
        ? "Export not authorized"
        : "Export blocked";
      localOnly.title = paper.exportAuthorized
        ? "Reference-only and local-only sources stay on this installation"
        : "Portable export requires a separate teacher attestation";
      actions.append(duration, localOnly);
    }
    row.append(main, actions);
    list.append(row);
  }
}

function renderSessions(state) {
  const list = document.querySelector("#session-list");
  list.replaceChildren();
  if (state.sessions.length === 0) emptyState(list, "Set up an exam to make a paper available to a class.");
  for (const session of state.sessions) {
    const row = document.createElement("li");
    row.className = "session-row";
    const detail = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = session.paperTitle;
    const metadata = document.createElement("span");
    const status = session.status === "draft" ? "ready" : session.status;
    metadata.textContent = `${session.className} · ${status} · ${formatPaperTime(session)}`;
    detail.append(title, metadata);

    const counts = document.createElement("span");
    counts.className = "session-counts";
    counts.textContent = session.status === "draft"
      ? "Ready to start"
      : `${session.submittedCount}/${session.candidateCount} submitted · ${session.activeCount} online`;

    const actions = document.createElement("div");
    actions.className = "session-actions";
    if (session.status !== "ended") {
      const countdown = document.createElement("a");
      countdown.href = `/clock?session=${encodeURIComponent(session.id)}`;
      countdown.target = "_blank";
      countdown.rel = "noopener";
      countdown.className = "clock-launch compact";
      countdown.textContent = "Open clock ↗";
      countdown.setAttribute("aria-label", `Open countdown for ${session.paperTitle} in a new tab`);
      const lifecycle = document.createElement("button");
      lifecycle.type = "button";
      lifecycle.dataset.sessionId = session.id;
      lifecycle.dataset.action = session.status === "draft" ? "start" : "end";
      lifecycle.className = session.status === "draft" ? "primary-action compact" : "danger-action compact";
      lifecycle.textContent = session.status === "draft" ? "Start exam" : "End exam";
      actions.append(countdown, lifecycle);
    }
    if (session.status !== "draft") {
      const responses = document.createElement("button");
      responses.type = "button";
      responses.dataset.responses = session.id;
      responses.className = "compact";
      responses.textContent = "View submissions";
      actions.append(responses);
    }
    row.append(detail, counts, actions);
    list.append(row);
  }
}

function copy(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function formatAssessmentSession(value) {
  if (!value || value === "custom") return "Practice session";
  const match = /^(may|november)-(\d{4})$/i.exec(value);
  if (match) return `${match[1][0].toUpperCase()}${match[1].slice(1)} ${match[2]}`;
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPaperTime(session) {
  if (!session.durationMinutes) return "Teacher-defined timing";
  const writing = `${session.durationMinutes} minute${session.durationMinutes === 1 ? "" : "s"} writing`;
  return session.readingTimeMinutes
    ? `${session.readingTimeMinutes} minute${session.readingTimeMinutes === 1 ? "" : "s"} reading · ${writing}`
    : writing;
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
      item.append(copy("blockquote", "submission-resource-text", resource.text ?? ""));
    } else {
      const description = resource.kind === "audio"
        ? `Listening audio · available in the digital examination · maximum ${resource.maxPlays ?? 2} play${(resource.maxPlays ?? 2) === 1 ? "" : "s"}`
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
  appendMetadata(metadata, "Source status", ({
    "teacher-authored": "Teacher-authored",
    "school-authorized": "School-authorized or licensed",
    "official-public-reference": "Official public specimen — reference only",
    "unknown-local-only": "Unknown rights — local-only",
  })[data.session.sourceClassification] ?? "Not recorded");
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

async function openSubmissions(sessionId) {
  renderSubmissions(await api(`/api/admin/sessions/${sessionId}/responses`));
}

async function printSubmissions(responseId = null) {
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

  const images = printable.flatMap((record) => [...record.querySelectorAll("img")]);
  await Promise.all(images.map((image) => image.complete || typeof image.decode !== "function"
    ? undefined
    : image.decode().catch(() => undefined)));
  window.addEventListener("afterprint", () => {
    delete list.dataset.printMode;
    records.forEach((record) => {
      record.removeAttribute("data-print-target");
      record.removeAttribute("data-print-first");
    });
  }, { once: true });
  window.print();
}

function renderState(state) {
  currentState = state;
  renderClasses(state);
  renderPapers(state);
  renderSessions(state);
  const live = state.sessions.filter((session) => session.status === "live").length;
  document.querySelector("#overview-classes").textContent = String(state.classes.length);
  document.querySelector("#overview-students").textContent = String(state.students.length);
  document.querySelector("#overview-papers").textContent = String(state.papers.length);
  document.querySelector("#overview-live").textContent = String(live);
}

async function refreshState(silent = false) {
  try {
    renderState(await api("/api/admin/state"));
    if (!silent) announce("Dashboard updated", "success");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      stopSocket?.();
      clearInterval(refreshTimer);
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

function bindDashboard() {
  document.querySelector("#logout").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    stopSocket?.();
    clearInterval(refreshTimer);
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

  document.querySelector("#session-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action], button[data-responses]");
    if (!button) return;
    button.disabled = true;
    try {
      if (button.dataset.responses) {
        await openSubmissions(button.dataset.responses);
      } else {
        await api(`/api/admin/sessions/${button.dataset.sessionId}/${button.dataset.action}`, { method: "POST" });
        await refreshState(true);
        announce(button.dataset.action === "start" ? "Exam started" : "Exam ended and responses submitted", "success");
      }
    } catch (error) {
      announce(error instanceof Error ? error.message : "Session action failed", "error");
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector("#print-submissions").addEventListener("click", () => printSubmissions());
  document.querySelector("#submission-list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-print-response]");
    if (button) printSubmissions(button.dataset.printResponse);
  });

  document.querySelectorAll("[data-jump]").forEach((link) => {
    link.addEventListener("click", () => document.querySelector(link.dataset.jump).scrollIntoView({ behavior: "smooth" }));
  });
}

async function renderDashboard() {
  setView(`
    <div class="admin-shell">
      <aside class="admin-rail">
        <a class="admin-brand" href="/"><span class="product-mark" aria-hidden="true">DP</span><span>DigitalDP</span></a>
        <nav aria-label="Dashboard sections">
          <button type="button" data-jump="#overview">Overview</button>
          <button type="button" data-jump="#classes">Classes</button>
          <button type="button" data-jump="#papers">Papers</button>
          <button type="button" data-jump="#sessions">Sessions</button>
        </nav>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </aside>
      <div class="admin-main">
        <header class="admin-topbar">
          <div><p class="eyebrow">Teacher dashboard</p><h1>Exams</h1></div>
          <span class="connection-state" id="connection-state">Connecting</span>
        </header>
        <p id="global-status" class="status-message sticky-status" role="status" aria-live="polite" hidden></p>

        <section id="overview" class="admin-section">
          <div class="section-heading"><div><h2>Overview</h2><p>Classes, papers and examinations ready on this school server.</p></div></div>
          <dl class="metric-strip">
            <div><dt>Classes</dt><dd id="overview-classes">0</dd></div>
            <div><dt>Students</dt><dd id="overview-students">0</dd></div>
            <div><dt>Papers</dt><dd id="overview-papers">0</dd></div>
            <div><dt>Live sessions</dt><dd id="overview-live">0</dd></div>
          </dl>
        </section>

        <section id="classes" class="admin-section two-column-section">
          <div>
            <div class="section-heading"><div><h2>Classes and candidates</h2><p>Login details mimic a class code, candidate code and PIN.</p></div></div>
            <div id="class-list" class="roster-groups"></div>
          </div>
          <div class="form-stack">
            <form id="class-form" class="utility-form" method="post">
              <fieldset><legend>Create class</legend>
                <label for="class-name">Class name</label><input id="class-name" name="name" required maxlength="100">
                <label for="class-code">Class code</label><input id="class-code" name="code" required minlength="4" maxlength="24" pattern="[A-Za-z0-9-]+" autocomplete="off">
                <button type="submit">Create class</button>
              </fieldset>
            </form>
            <form id="student-form" class="utility-form" method="post">
              <fieldset><legend>Add student</legend>
                <label for="student-class">Class</label><select id="student-class" name="classId" required></select>
                <label for="student-name">Student name</label><input id="student-name" name="name" required maxlength="100" autocomplete="off">
                <label for="candidate-code">Candidate code</label><input id="candidate-code" name="candidateCode" required maxlength="32" autocomplete="off">
                <label for="student-pin">PIN</label><input id="student-pin" name="pin" inputmode="numeric" pattern="[0-9]{4,12}" minlength="4" maxlength="12" required autocomplete="new-password">
                <label for="extra-minutes">Extra time in minutes</label><input id="extra-minutes" name="extraMinutes" type="number" min="0" max="180" value="0">
                <button type="submit">Add student</button>
              </fieldset>
            </form>
          </div>
        </section>

        <section id="papers" class="admin-section two-column-section">
          <div>
            <div class="section-heading"><div><h2>Paper library</h2><p>Create a paper with the guided builder or import a prepared package.</p></div></div>
            <ul id="paper-list" class="paper-list"></ul>
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
            <div class="section-heading"><div><h2>Exams</h2><p>Choose a class and paper, then start when students are ready.</p></div><a class="clock-launch" href="/clock" target="_blank" rel="noopener">Open countdown display ↗</a></div>
            <ul id="session-list" class="session-list"></ul>
          </div>
          <form id="session-form" class="utility-form" method="post">
            <fieldset><legend>Set up an exam</legend>
              <label for="session-class">Class</label><select id="session-class" name="classId" required></select>
              <label for="session-paper">Paper</label><select id="session-paper" name="paperId" required></select>
              <button type="submit">Set up exam</button>
            </fieldset>
          </form>
        </section>
      </div>
    </div>
    <dialog id="submissions-dialog" class="exam-dialog submissions-dialog">
      <form method="dialog">
        <header><p class="eyebrow">Completed papers</p><h2 id="submissions-title">Candidate responses</h2><p id="submissions-context"></p><p>Open a candidate to review their complete paper. Print one candidate or create a single PDF for the class.</p></header>
        <div id="submission-list" class="submission-list"></div>
        <footer><button id="print-submissions" type="button">Print or save PDF</button><button value="close">Close</button></footer>
      </form>
    </dialog>
  `);
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
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => refreshState(true), 5_000);
}

export async function renderAdmin(bootstrap) {
  if (bootstrap.setupRequired) {
    renderSetup();
  } else if (bootstrap.role === "admin") {
    await renderDashboard();
  } else {
    renderLogin();
  }
}
