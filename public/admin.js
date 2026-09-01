import { ApiError, announce, api, connectSocket, humanSubject, setView } from "/app.js";

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
    "Use the teacher account configured on this DigitalDP server.",
    `
      <label for="username">Username</label>
      <input id="username" name="username" autocomplete="username" maxlength="40" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
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
  if (state.papers.length === 0) emptyState(list, "Add a quick PDF paper or upload structured paper files.");
  for (const paper of state.papers) {
    option(sessionPaper, paper.id, `${paper.title} · ${paper.level}`);
    const row = document.createElement("li");
    const main = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = paper.title;
    const metadata = document.createElement("small");
    metadata.textContent = `${paper.subjectLabel ?? humanSubject(paper.subject)} · ${paper.level} · ${paper.paper}`;
    main.append(title, metadata);
    const duration = document.createElement("code");
    duration.textContent = `${paper.durationMinutes} min`;
    row.append(main, duration);
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
    metadata.textContent = `${session.className} · ${status}`;
    detail.append(title, metadata);

    const counts = document.createElement("span");
    counts.className = "session-counts";
    counts.textContent = session.status === "draft"
      ? "Ready to start"
      : `${session.submittedCount}/${session.candidateCount} submitted · ${session.activeCount} online`;

    const actions = document.createElement("div");
    actions.className = "session-actions";
    if (session.status !== "ended") {
      const lifecycle = document.createElement("button");
      lifecycle.type = "button";
      lifecycle.dataset.sessionId = session.id;
      lifecycle.dataset.action = session.status === "draft" ? "start" : "end";
      lifecycle.className = session.status === "draft" ? "primary-action compact" : "danger-action compact";
      lifecycle.textContent = session.status === "draft" ? "Start exam" : "End exam";
      actions.append(lifecycle);
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

function renderSubmissions(data) {
  document.querySelector("#submissions-title").textContent = data.session.paperTitle;
  document.querySelector("#submissions-context").textContent = `${data.session.className} · ${data.responses.length} candidate${data.responses.length === 1 ? "" : "s"}`;
  const list = document.querySelector("#submission-list");
  list.replaceChildren();
  if (data.responses.length === 0) {
    emptyState(list, "No candidate responses exist for this session.");
  }
  for (const response of data.responses) {
    const record = document.createElement("details");
    record.className = "submission-record";
    const summary = document.createElement("summary");
    const identity = document.createElement("strong");
    identity.textContent = response.studentName;
    const code = document.createElement("code");
    code.textContent = response.candidateCode;
    const state = document.createElement("span");
    const timestamp = response.submittedAt ?? response.updatedAt;
    state.textContent = `${response.submittedAt ? "Submitted" : "Last saved"} ${new Date(timestamp).toLocaleString()}`;
    summary.append(identity, code, state);
    record.append(summary);

    const answers = document.createElement("div");
    answers.className = "submission-answers";
    for (const question of data.questions) {
      const answer = response.answers[question.id] ?? "";
      const item = document.createElement("article");
      const heading = document.createElement("h3");
      heading.textContent = question.label;
      const prompt = document.createElement("p");
      prompt.className = "submission-prompt";
      prompt.textContent = question.prompt;
      const content = document.createElement("div");
      content.className = "submission-answer";
      if (!answer) {
        content.classList.add("empty-state");
        content.textContent = "No response";
      } else if (question.type === "essay") {
        content.innerHTML = answer;
      } else {
        content.textContent = answer;
      }
      item.append(heading, prompt, content);
      answers.append(item);
    }
    record.append(answers);
    list.append(record);
  }
  document.querySelector("#submissions-dialog").showModal();
}

async function openSubmissions(sessionId) {
  renderSubmissions(await api(`/api/admin/sessions/${sessionId}/responses`));
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

  document.querySelector("#print-submissions").addEventListener("click", () => {
    document.querySelectorAll(".submission-record").forEach((record) => { record.open = true; });
    window.print();
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
            <div class="section-heading"><div><h2>Paper library</h2><p>Add a simple writing paper from a PDF or upload a prepared structured paper.</p></div></div>
            <ul id="paper-list" class="paper-list"></ul>
          </div>
          <div class="form-stack">
            <form id="quick-paper-form" data-paper-form class="utility-form" method="post" enctype="multipart/form-data">
              <input name="format" type="hidden" value="quick">
              <fieldset><legend>Quick PDF paper</legend>
                <p class="form-help">For one written response beside a PDF. Use a structured package for reading, listening or multiple questions.</p>
                <label for="quick-title">Paper title</label><input id="quick-title" name="title" required maxlength="160">
                <label for="quick-subject">Subject</label><select id="quick-subject" name="subject" required>
                  <option value="english-a-language-literature">English A: Language and Literature</option>
                  <option value="english-a-literature">English A: Literature</option>
                  <option value="english-b">English B</option>
                </select>
                <label for="quick-level">Level</label><select id="quick-level" name="level" required>
                  <option>SL</option><option>HL</option><option>SL/HL</option>
                </select>
                <label for="quick-paper">Paper label</label><input id="quick-paper" name="paper" value="Paper 1" required maxlength="80">
                <label for="quick-duration">Duration in minutes</label><input id="quick-duration" name="durationMinutes" type="number" min="5" max="360" value="75" required>
                <label for="quick-pdf">Paper PDF</label><input id="quick-pdf" name="pdf" type="file" accept="application/pdf,.pdf" required aria-describedby="quick-pdf-help">
                <small id="quick-pdf-help">Maximum 50 MB. The PDF appears beside the writing area.</small>
                <label for="quick-instructions">Instructions</label><textarea id="quick-instructions" name="instructions" rows="3" required maxlength="20000">Read the paper and write your response.</textarea>
                <label for="quick-prompt">Response prompt</label><textarea id="quick-prompt" name="prompt" rows="3" required maxlength="10000">Write your response.</textarea>
                <div class="inline-fields">
                  <label for="quick-minimum">Minimum words <input id="quick-minimum" name="wordCountMin" type="number" min="1" max="10000"></label>
                  <label for="quick-maximum">Maximum words <input id="quick-maximum" name="wordCountMax" type="number" min="1" max="10000"></label>
                </div>
                <button type="submit">Add PDF paper</button>
              </fieldset>
            </form>

            <form id="package-form" data-paper-form class="utility-form" method="post" enctype="multipart/form-data">
              <input name="format" type="hidden" value="package">
              <fieldset><legend>Structured paper package</legend>
                <p class="form-help">For reading tabs, listening audio, multiple questions or question choices.</p>
                <label for="paper-package">Paper files</label><input id="paper-package" name="packageFiles" type="file" accept="application/json,.json,application/pdf,image/png,image/jpeg,image/webp,audio/mpeg,audio/mp4,audio/ogg,audio/wav" multiple required aria-describedby="package-help">
                <small id="package-help">Select <code>paper.json</code> and every referenced PDF, image or audio file together.</small>
                <details class="requirements">
                  <summary>Package requirements</summary>
                  <ul>
                    <li><code>paper.json</code> and every referenced asset in one folder.</li>
                    <li>Essay, reading or listening mode; up to 100 questions and 30 resources.</li>
                    <li>PDF, PNG, JPEG, WebP, MP3, M4A, OGG or WAV assets.</li>
                    <li>Maximum 50 MB per asset and 200 MB for all assets.</li>
                  </ul>
                </details>
                <button type="submit">Add paper package</button>
              </fieldset>
            </form>

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
            <div class="section-heading"><div><h2>Exams</h2><p>Choose a class and paper, then start when students are ready.</p></div></div>
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
        <header><p class="eyebrow">Submissions</p><h2 id="submissions-title">Candidate responses</h2><p id="submissions-context"></p></header>
        <div id="submission-list" class="submission-list"></div>
        <footer><button id="print-submissions" type="button">Print or save PDF</button><button value="close">Close</button></footer>
      </form>
    </dialog>
  `);
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
