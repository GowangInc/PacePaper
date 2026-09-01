import { ApiError, announce, api, connectSocket, setView } from "/app.js";

let stopSocket;
let cleanupExam;
let pollTimer;
let loading = false;

function authFrame() {
  setView(`
    <section class="auth-shell student-auth">
      <a class="back-link" href="/">← Workspaces</a>
      <div class="auth-panel">
        <span class="product-mark" aria-hidden="true">DP</span>
        <p class="eyebrow">Candidate sign in</p>
        <h1>Enter your examination details</h1>
        <p>Use the details provided by your teacher. They identify this practice session only.</p>
        <form id="student-login" method="post">
          <label for="class-code">Class code</label>
          <input id="class-code" name="classCode" autocomplete="organization" maxlength="24" required>
          <label for="candidate-code">Candidate code</label>
          <input id="candidate-code" name="candidateCode" autocomplete="username" maxlength="32" required>
          <label for="pin">PIN</label>
          <input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" pattern="[0-9]{4,12}" required>
          <button class="primary-action" type="submit">Continue</button>
        </form>
        <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
      </div>
    </section>
  `);

  const form = document.querySelector("#student-login");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    announce("Checking details…");
    try {
      await api("/api/login/student", { method: "POST", body: Object.fromEntries(new FormData(form)) });
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
  stopSocket?.();
  clearInterval(pollTimer);
  await api("/api/logout", { method: "POST" });
  authFrame();
}

function renderWaiting(state) {
  cleanupExam?.();
  cleanupExam = undefined;
  setView(`
    <section class="waiting-shell">
      <header class="waiting-header"><span class="product-mark" aria-hidden="true">DP</span><span>DigitalDP familiarisation</span></header>
      <div class="waiting-content">
        <p class="eyebrow">Signed in</p>
        <h1 id="student-name"></h1>
        <div class="waiting-pulse" aria-hidden="true"></div>
        <h2>Waiting for your teacher</h2>
        <p>The examination will appear here when the teacher starts and broadcasts the session.</p>
        <p class="connection-state" id="connection-state">Connecting</p>
        <button id="logout" class="quiet-action" type="button">Sign out</button>
      </div>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  document.querySelector("#student-name").textContent = state.student.name;
  document.querySelector("#logout").addEventListener("click", logout);
  clearInterval(pollTimer);
  pollTimer = setInterval(loadState, 5_000);
}

function renderSubmitted(state) {
  cleanupExam?.();
  cleanupExam = undefined;
  localStorage.removeItem(`digitaldp:draft:${state.session.id}`);
  setView(`
    <section class="submitted-shell">
      <span class="product-mark" aria-hidden="true">DP</span>
      <p class="eyebrow">Response received</p>
      <h1>Your examination is submitted</h1>
      <p id="submitted-paper"></p>
      <p>Your response can no longer be changed. Wait for your teacher's instructions.</p>
      <button id="logout" class="quiet-action" type="button">Sign out</button>
      <p id="global-status" class="status-message" role="status" aria-live="polite" hidden></p>
    </section>
  `);
  document.querySelector("#submitted-paper").textContent = state.paper.title;
  document.querySelector("#logout").addEventListener("click", logout);
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
    const state = await api("/api/student/state");
    if (state.status === "waiting") {
      if (!document.querySelector(".waiting-shell")) renderWaiting(state);
    } else if (state.status === "submitted") {
      if (!document.querySelector(".submitted-shell")) renderSubmitted(state);
    } else if (!document.querySelector(`[data-session-id="${CSS.escape(state.session.id)}"]`)) {
      await renderExam(state);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      cleanupExam?.();
      stopSocket?.();
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
  stopSocket?.();
  stopSocket = connectSocket((event) => {
    const indicator = document.querySelector("#connection-state");
    if (event.type === "socket-open" || event.type === "connected") {
      if (indicator) {
        indicator.textContent = "Connected to examination server";
        indicator.dataset.connected = "true";
      }
    } else if (event.type === "socket-closed") {
      if (indicator) {
        indicator.textContent = "Connection interrupted — reconnecting";
        indicator.dataset.connected = "false";
      }
    } else if (event.type === "exam-started" || event.type === "exam-ended") {
      loadState();
    }
  });
}

export async function renderStudent(bootstrap) {
  if (bootstrap.role !== "student") {
    authFrame();
    return;
  }
  beginLiveConnection();
  await loadState();
}
