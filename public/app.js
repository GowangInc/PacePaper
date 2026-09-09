import "/context-menu-lock.js";
import { initTheme, themeRoleForPath } from "./theme.js";

// Apply the saved (or system) appearance before the interface paints.
initTheme(themeRoleForPath());

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const request = { ...options, headers: new Headers(options.headers) };
  request.headers.set("Accept", "application/json");
  if (request.body && !(request.body instanceof FormData) && typeof request.body !== "string") {
    request.headers.set("Content-Type", "application/json");
    request.body = JSON.stringify(request.body);
  }
  const response = await fetch(path, request);
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.error ?? `Request failed (${response.status})`, response.status);
  return payload;
}

export function setView(markup) {
  const root = document.querySelector("#app");
  root.innerHTML = markup;
  root.focus();
  return root;
}

export function announce(message, tone = "info") {
  const region = document.querySelector("#global-status");
  if (!region) return;
  region.textContent = message;
  region.dataset.tone = tone;
  region.hidden = !message;
}

export function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function humanSubject(subject) {
  return subject === "english-a-language-literature"
    ? "English A: Language and Literature"
    : subject === "english-b"
      ? "English B"
      : subject;
}

export function connectSocket(onEvent) {
  let socket;
  let stopped = false;
  let retryDelay = 500;
  let pingTimer;

  const connect = () => {
    if (stopped) return;
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${scheme}//${location.host}/ws`);
    socket.addEventListener("open", () => {
      retryDelay = 500;
      clearInterval(pingTimer);
      pingTimer = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send("ping"), 10_000);
      onEvent({ type: "socket-open" });
    });
    socket.addEventListener("message", (event) => {
      try {
        onEvent(JSON.parse(event.data));
      } catch {
        // Ignore malformed server messages; the next state fetch is authoritative.
      }
    });
    socket.addEventListener("close", () => {
      clearInterval(pingTimer);
      onEvent({ type: "socket-closed" });
      if (!stopped) {
        setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 8_000);
      }
    });
  };

  connect();
  return () => {
    stopped = true;
    clearInterval(pingTimer);
    socket?.close();
  };
}

function landing() {
  setView(`
    <section class="entry-shell">
      <header class="entry-brand">
        <img class="product-mark" src="/app-icon-192.png" alt="" width="192" height="192">
        <div>
          <p class="eyebrow">Digital examination familiarisation</p>
          <h1>Choose your workspace</h1>
        </div>
      </header>
      <div class="entry-options">
        <a class="entry-option" href="/student">
          <span class="entry-option__index">01</span>
          <strong>Student examination</strong>
          <span>Enter a class code, then choose your name.</span>
        </a>
        <a class="entry-option" href="/admin">
          <span class="entry-option__index">02</span>
          <strong>Teacher dashboard</strong>
          <span>Load papers, prepare classes and start a session.</span>
        </a>
        <a class="entry-option" href="/presentation">
          <span class="entry-option__index">03</span>
          <strong>Product walkthrough</strong>
          <span>See the complete teacher and student journey.</span>
        </a>
      </div>
      <p class="entry-note">For supervised practice on the school network. This is not the IB Digital Examination System.</p>
    </section>
  `);
}

const path = location.pathname.replace(/\/$/, "") || "/";

async function start() {
  const bootstrap = await api("/api/bootstrap");
  if (path === "/admin") {
    const { renderAdmin } = await import("/admin.js");
    await renderAdmin(bootstrap);
  } else if (path === "/clock") {
    const { renderCountdown } = await import("/countdown.js");
    await renderCountdown(bootstrap);
  } else if (path === "/student") {
    const { renderStudent } = await import("/student.js");
    await renderStudent(bootstrap);
  } else if (path === "/") {
    // Students land here from the shared IP:port — send them straight to sign-in.
    location.replace("/student");
    return;
  } else {
    landing();
  }
}

function renderFatal(error) {
  setView(`
    <section class="fatal-state">
      <h1>PacePaper could not start</h1>
      <p id="fatal-message"></p>
      <button type="button" id="retry">Retry</button>
    </section>
  `);
  document.querySelector("#fatal-message").textContent = error instanceof Error ? error.message : "Unknown error";
  document.querySelector("#retry").addEventListener("click", () => location.reload());
}

start().catch(renderFatal);
