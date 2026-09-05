import { describe, expect, mock, test } from "bun:test";

const appMocks = { api: () => undefined, connectSocket: () => undefined, setView: () => undefined };
mock.module("/app.js", () => ({
  ApiError: class ApiError extends Error {},
  announce() {},
  api: (...args) => appMocks.api(...args),
  connectSocket: (...args) => appMocks.connectSocket(...args),
  setView: (...args) => appMocks.setView(...args),
}));

const { parseStudentSessionList, shouldResetStudentSelection, studentSessionState, renderStudent } = await import("./student.js");
const source = await Bun.file(new URL("./student.js", import.meta.url)).text();

const session = (overrides = {}) => ({
  id: "session-1",
  paperId: "paper-1",
  paperTitle: "English A Paper 1",
  subjectLabel: "English A: Language and Literature",
  level: "SL",
  paper: "Paper 1",
  durationMinutes: 75,
  readingTimeMinutes: 5,
  status: "draft",
  startedAt: null,
  endedAt: null,
  createdAt: 1,
  responseId: null,
  submittedAt: null,
  ...overrides,
});

// Exercise the real render/event paths with the small DOM surface they use; no browser dependency.
async function withStudentView(run) {
  const previousDocument = globalThis.document;
  const previousCSS = globalThis.CSS;
  const previousSetInterval = globalThis.setInterval;
  const timers = [];
  const nodes = new Map();
  const sockets = [];
  let state = { status: "selecting", student: { name: "Learner" }, sessions: [session()] };
  let connectEvent;
  const element = () => ({
    textContent: "", dataset: {}, events: new Map(),
    addEventListener(type, handler) { this.events.set(type, handler); },
    append() {}, setAttribute() {}, replaceChildren() {},
    querySelector(selector) { return nodes.get(selector); },
  });
  globalThis.document = { querySelector: (selector) => nodes.get(selector) ?? null, createElement: element };
  globalThis.CSS = { escape: (value) => value };
  globalThis.setInterval = (...args) => {
    const timer = previousSetInterval(...args);
    timers.push(timer);
    return timer;
  };
  appMocks.api = async () => state;
  appMocks.connectSocket = (onEvent) => {
    sockets.push(onEvent);
    if (connectEvent) onEvent({ type: connectEvent });
    return () => onEvent({ type: "socket-closed" });
  };
  appMocks.setView = (html) => {
    nodes.clear();
    for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(`#${id}`, element());
    if (html.includes("exam-selection-shell")) {
      const shell = element();
      shell.dataset.sessionSignature = html.match(/data-session-signature="([^"]*)"/)[1];
      nodes.set(".exam-selection-shell", shell);
    }
    if (html.includes("waiting-shell") && html.includes("data-session-id")) {
      const id = html.match(/data-session-id="([^"]*)"/)[1];
      nodes.set(`.waiting-shell[data-session-id="${id}"]`, element());
    }
    if (nodes.has("#connection-state")) nodes.get("#connection-state").textContent = "Connecting";
  };
  const view = {
    sockets,
    indicator: () => nodes.get("#connection-state"),
    state(value) { state = value; },
    onConnect(type) { connectEvent = type; },
    async event(type, socket = sockets.at(-1)) {
      socket({ type });
      await Promise.resolve();
      await Promise.resolve();
    },
  };
  try {
    await run(view);
  } finally {
    timers.forEach(clearInterval);
    globalThis.document = previousDocument;
    globalThis.CSS = previousCSS;
    globalThis.setInterval = previousSetInterval;
    appMocks.api = () => undefined;
    appMocks.connectSocket = () => undefined;
    appMocks.setView = () => undefined;
  }
}

describe("student connection indicator lifecycle", () => {
  test("retains an opening event received before the first view and across exam-list rerenders", async () => {
    await withStudentView(async (view) => {
      view.onConnect("socket-open");
      await renderStudent({ role: "student" });
      expect(view.indicator().textContent).toBe("Connected to examination server");
      const initial = view.indicator();
      view.state({ status: "selecting", student: { name: "Learner" }, sessions: [session({ status: "live" })] });
      await view.event("exam-list-changed");
      expect(view.indicator()).not.toBe(initial);
      expect(view.indicator().dataset.connected).toBe("true");
      expect(view.indicator().textContent).toBe("Connected to examination server");
    });
  });

  test("keeps interrupted status across waiting-room transitions until the socket reconnects", async () => {
    await withStudentView(async (view) => {
      view.onConnect("connected");
      await renderStudent({ role: "student" });
      await view.event("socket-closed");
      view.state({ status: "waiting", student: { name: "Learner" }, session: session() });
      await view.event("exam-list-changed");
      expect(view.indicator().textContent).toBe("Connection interrupted — reconnecting");
      expect(view.indicator().dataset.connected).toBe("false");
      await view.event("socket-open");
      expect(view.indicator().textContent).toBe("Connected to examination server");
      view.state({ status: "selecting", student: { name: "Learner" }, sessions: [session()] });
      await view.event("exam-list-changed");
      expect(view.indicator().dataset.connected).toBe("true");
    });
  });

  test("does not infer a socket connection from a successful HTTP response or a stale socket event", async () => {
    await withStudentView(async (view) => {
      await renderStudent({ role: "student" });
      expect(view.indicator().textContent).toBe("Connecting");
      expect(view.indicator().dataset.connected).toBe("false");
      await view.event("socket-open");
      const oldSocket = view.sockets.at(-1);
      await renderStudent({ role: "student" });
      expect(view.indicator().textContent).toBe("Connecting");
      await view.event("connected", oldSocket);
      expect(view.indicator().dataset.connected).toBe("false");
      await view.event("socket-open");
      await view.event("socket-closed", oldSocket);
      expect(view.indicator().textContent).toBe("Connected to examination server");
    });
  });
});

describe("student examination list", () => {
  test("keeps two sessions with the same paper as separate choices", () => {
    const sessions = parseStudentSessionList({
      sessions: [
        session({ id: "new-sitting" }),
        session({ id: "old-sitting", status: "ended", responseId: "response-1", submittedAt: 100 }),
      ],
    });

    expect(sessions.map(({ id }) => id)).toEqual(["new-sitting", "old-sitting"]);
    expect(studentSessionState(sessions[0])).toBe("Waiting for teacher");
    expect(studentSessionState(sessions[1])).toBe("Completed");
  });

  test("distinguishes an unsubmitted live sitting from a submitted one", () => {
    expect(studentSessionState(session({ status: "live", responseId: "response-1" }))).toBe("In progress");
    expect(studentSessionState(session({ status: "live", responseId: "response-1", submittedAt: 100 }))).toBe("Submitted");
  });

  test("rejects malformed or ambiguous session records", () => {
    expect(() => parseStudentSessionList({ sessions: [session({ id: undefined })] })).toThrow();
    expect(() => parseStudentSessionList({ sessions: [session({ status: "ready" })] })).toThrow();
    expect(() => parseStudentSessionList({ sessions: [session({ submittedAt: undefined })] })).toThrow();
  });

  test("returns a waiting student to selection when their sitting is removed", () => {
    expect(shouldResetStudentSelection({ status: "selecting", selectionReset: true })).toBe(true);
    expect(shouldResetStudentSelection({ status: "selecting" })).toBe(false);
    expect(shouldResetStudentSelection({ status: "waiting", selectionReset: true })).toBe(false);
    expect(source).toContain("if (selectionReset) selectedSessionId = null");
    expect(source).toContain("if (selectionReset || !current");
  });

  test("replaces an already-rendered waiting room when its sitting becomes live", () => {
    expect(source).toContain('document.querySelector(`.exam-shell[data-session-id="${CSS.escape(state.session.id)}"]`)');
    expect(source).not.toContain('document.querySelector(`[data-session-id="${CSS.escape(state.session.id)}"]`)');
  });

  test("tells students that saved notes are separate from answers but included in the teacher PDF", async () => {
    const examSource = await Bun.file(new URL("./exam.js", import.meta.url)).text();
    expect(examSource).toContain("Notes are saved separately from answers and included in the teacher's PDF record.");
  });
});
