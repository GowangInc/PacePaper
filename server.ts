import type { Server } from "bun";
import {
  createAdmin,
  createClass,
  createExamSession,
  createPaper,
  createStudent,
  deleteExpiredAuthSessions,
  endExamSession,
  findAdmin,
  findStudentLogin,
  getAsset,
  getSessionResults,
  getStudent,
  getStudentExam,
  incrementAudioPlay,
  listClasses,
  listExamSessions,
  listPapers,
  listStudents,
  saveAndSubmitResponse,
  saveResponse,
  setupRequired,
  startExamSession,
  submitResponse,
  touchStudent,
  type ResponsePayload,
  type Role,
} from "./src/db.ts";
import {
  allowLoginAttempt,
  assertSameOrigin,
  authFromRequest,
  clearLoginAttempts,
  issueSession,
  requireRole,
  revokeSession,
} from "./src/auth.ts";
import {
  parsePaperUpload,
  sanitizeRichText,
  type PaperManifest,
} from "./src/papers.ts";

interface SocketData {
  role: Role;
  actorId: string;
  classId: string | null;
}

interface SavedResponseInput {
  sessionId: string;
  selectedQuestionId: string | null;
  answers: Record<string, string>;
  flags: string[];
  notepad: string;
}

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const port = Number(process.env.PORT ?? 9148);
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT must be a valid TCP port");

const STATIC_FILES: Record<string, string> = {
  "/": "public/index.html",
  "/presentation": "public/presentation.html",
  "/presentation.css": "public/presentation.css",
  "/teacher-dashboard.png": "public/teacher-dashboard.png",
  "/student-workspace.png": "public/student-workspace.png",
  "/paper-authoring/SKILL.md": "paper-authoring/SKILL.md",
  "/admin": "public/index.html",
  "/student": "public/index.html",
  "/app.js": "public/app.js",
  "/admin.js": "public/admin.js",
  "/student.js": "public/student.js",
  "/exam.js": "public/exam.js",
  "/styles.css": "public/styles.css",
  "/tokens.css": "tokens.css",
};

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; connect-src 'self' ws: wss:; font-src 'self'; form-action 'self'; frame-ancestors 'self'; frame-src 'self'; img-src 'self' data:; media-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

function responseWithSecurity(response: Response): Response {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
  return response;
}

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const response = Response.json(data, { status, headers });
  response.headers.set("Cache-Control", "no-store");
  return responseWithSecurity(response);
}

function asRecord(value: unknown, label = "Request body"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(`${label} must be an object`, 400);
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string") throw new HttpError(`${label} is required`, 400);
  const clean = value.trim();
  if (!clean || clean.length > max) throw new HttpError(`${label} is invalid`, 400);
  return clean;
}

function optionalInteger(value: unknown, label: string, min: number, max: number): number {
  const number = value === undefined ? min : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new HttpError(`${label} must be between ${min} and ${max}`, 400);
  }
  return number;
}

async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 1_000_000) throw new HttpError("Request body is too large", 413);
  try {
    return asRecord(await request.json());
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Request body must be valid JSON", 400);
  }
}

function clientAddress(request: Request, server: Server<SocketData>): string {
  return server.requestIP(request)?.address ?? "unknown";
}

function deadlineFor(exam: { startedAt: number; durationMinutes: number; extraMinutes: number }): number {
  return exam.startedAt + (exam.durationMinutes + exam.extraMinutes) * 60_000;
}

function publish(server: Server<SocketData>, topic: string, type: string): void {
  server.publish(topic, JSON.stringify({ type, at: Date.now() }));
}

function publicManifest(manifest: PaperManifest, paperId: string): Record<string, unknown> {
  return {
    ...manifest,
    resources: manifest.resources.map((resource) => ({
      ...resource,
      file: undefined,
      url: resource.file ? `/api/assets/${paperId}/${resource.key}` : undefined,
    })),
  };
}

async function validatedResponse(body: Record<string, unknown>, manifest: PaperManifest): Promise<SavedResponseInput> {
  const sessionId = requiredText(body.sessionId, "Session", 64);
  const selectedQuestionId = body.selectedQuestionId === null || body.selectedQuestionId === undefined
    ? null
    : requiredText(body.selectedQuestionId, "Selected question", 64);
  const questionById = new Map(manifest.questions.map((question) => [question.id, question]));
  if (selectedQuestionId && !questionById.has(selectedQuestionId)) throw new HttpError("Selected question is invalid", 400);

  const sourceAnswers = asRecord(body.answers, "Answers");
  const answers: Record<string, string> = {};
  for (const [questionId, rawAnswer] of Object.entries(sourceAnswers)) {
    const question = questionById.get(questionId);
    if (!question) throw new HttpError(`Unknown question: ${questionId}`, 400);
    if (typeof rawAnswer !== "string") throw new HttpError(`Answer ${questionId} must be text`, 400);
    if (question.type === "essay") {
      answers[questionId] = await sanitizeRichText(rawAnswer);
    } else if (question.type === "short") {
      if (rawAnswer.length > 20_000) throw new HttpError(`Answer ${questionId} is too long`, 400);
      answers[questionId] = rawAnswer;
    } else {
      if (!question.options?.includes(rawAnswer)) throw new HttpError(`Answer ${questionId} is not a valid choice`, 400);
      answers[questionId] = rawAnswer;
    }
  }

  if (!Array.isArray(body.flags) || body.flags.length > manifest.questions.length) {
    throw new HttpError("Flags must be a list", 400);
  }
  const flags = body.flags.map((flag) => requiredText(flag, "Flag", 64));
  if (new Set(flags).size !== flags.length || flags.some((flag) => !questionById.has(flag))) {
    throw new HttpError("Flags contain an invalid question", 400);
  }
  if (typeof body.notepad !== "string" || body.notepad.length > 100_000) {
    throw new HttpError("Notepad is too long", 400);
  }

  return { sessionId, selectedQuestionId, answers, flags, notepad: body.notepad };
}

function databaseError(error: Error): HttpError {
  if (error.message.includes("UNIQUE constraint failed")) return new HttpError("That code or active session already exists", 409);
  if (error.message.includes("FOREIGN KEY constraint failed")) return new HttpError("The selected class or paper no longer exists", 400);
  if (error.message === "Authentication required") return new HttpError(error.message, 401);
  if (error.message === "Cross-origin request rejected") return new HttpError(error.message, 403);
  if (error.message.includes("not found")) return new HttpError(error.message, 404);
  if (error.message.includes("already submitted") || error.message.includes("No audio plays")) return new HttpError(error.message, 409);
  return new HttpError(error.message, 400);
}

async function handleApi(request: Request, server: Server<SocketData>, path: string): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") assertSameOrigin(request);

  if (path === "/api/bootstrap" && method === "GET") {
    const actor = authFromRequest(request);
    return json({ setupRequired: setupRequired(), role: actor?.role ?? null });
  }

  if (path === "/api/setup" && method === "POST") {
    if (!setupRequired()) throw new HttpError("Teacher account already configured", 409);
    const body = await jsonBody(request);
    const username = requiredText(body.username, "Username", 40);
    const password = requiredText(body.password, "Password", 200);
    if (username.length < 3 || password.length < 10) throw new HttpError("Use a 3-character username and a password of at least 10 characters", 400);
    const admin = createAdmin(username, await Bun.password.hash(password));
    const cookie = issueSession("admin", admin.id, new URL(request.url).protocol === "https:");
    return json({ role: "admin" }, 201, { "Set-Cookie": cookie });
  }

  if (path === "/api/login/admin" && method === "POST") {
    const body = await jsonBody(request);
    const username = requiredText(body.username, "Username", 40);
    const password = requiredText(body.password, "Password", 200);
    const limiterKey = `admin:${clientAddress(request, server)}:${username.toLowerCase()}`;
    if (!allowLoginAttempt(limiterKey)) throw new HttpError("Too many login attempts. Try again later", 429);
    const admin = findAdmin(username);
    if (!admin || !(await Bun.password.verify(password, admin.passwordHash))) {
      throw new HttpError("Username or password is incorrect", 401);
    }
    clearLoginAttempts(limiterKey);
    const cookie = issueSession("admin", admin.id, new URL(request.url).protocol === "https:");
    return json({ role: "admin" }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/login/student" && method === "POST") {
    const body = await jsonBody(request);
    const classCode = requiredText(body.classCode, "Class code", 24);
    const candidateCode = requiredText(body.candidateCode, "Candidate code", 32);
    const pin = requiredText(body.pin, "PIN", 32);
    const limiterKey = `student:${clientAddress(request, server)}:${classCode.toLowerCase()}:${candidateCode.toLowerCase()}`;
    if (!allowLoginAttempt(limiterKey)) throw new HttpError("Too many login attempts. Try again later", 429);
    const student = findStudentLogin(classCode, candidateCode);
    if (!student || !(await Bun.password.verify(pin, student.pinHash))) {
      throw new HttpError("Class code, candidate code or PIN is incorrect", 401);
    }
    clearLoginAttempts(limiterKey);
    touchStudent(student.id);
    const cookie = issueSession("student", student.id, new URL(request.url).protocol === "https:");
    return json({ role: "student", name: student.name }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/logout" && method === "POST") {
    const cookie = revokeSession(request, new URL(request.url).protocol === "https:");
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/admin/state" && method === "GET") {
    requireRole(request, "admin");
    return json({
      classes: listClasses(),
      students: listStudents(),
      papers: listPapers(),
      sessions: listExamSessions(),
      serverTime: Date.now(),
    });
  }

  if (path === "/api/admin/classes" && method === "POST") {
    requireRole(request, "admin");
    const body = await jsonBody(request);
    const name = requiredText(body.name, "Class name", 100);
    const code = requiredText(body.code, "Class code", 24).toUpperCase();
    if (!/^[A-Z0-9-]{4,24}$/.test(code)) throw new HttpError("Class code needs 4–24 letters, numbers or hyphens", 400);
    const created = createClass(name, code);
    publish(server, "admin", "admin-state");
    return json(created, 201);
  }

  if (path === "/api/admin/students" && method === "POST") {
    requireRole(request, "admin");
    const body = await jsonBody(request);
    const classId = requiredText(body.classId, "Class", 64);
    const name = requiredText(body.name, "Student name", 100);
    const candidateCode = requiredText(body.candidateCode, "Candidate code", 32).toUpperCase();
    const pin = requiredText(body.pin, "PIN", 32);
    const extraMinutes = optionalInteger(body.extraMinutes, "Extra time", 0, 180);
    if (!/^[A-Z0-9-]{2,32}$/.test(candidateCode)) throw new HttpError("Candidate code needs letters, numbers or hyphens", 400);
    if (!/^\d{4,12}$/.test(pin)) throw new HttpError("PIN needs 4–12 digits", 400);
    const created = createStudent({ classId, name, candidateCode, pinHash: await Bun.password.hash(pin), extraMinutes });
    publish(server, "admin", "admin-state");
    return json(created, 201);
  }

  if (path === "/api/admin/papers" && method === "POST") {
    requireRole(request, "admin");
    const imported = await parsePaperUpload(await request.formData());
    const created = createPaper(imported);
    publish(server, "admin", "admin-state");
    return json(created, 201);
  }

  if (path === "/api/admin/sessions" && method === "POST") {
    requireRole(request, "admin");
    const body = await jsonBody(request);
    const id = createExamSession(
      requiredText(body.classId, "Class", 64),
      requiredText(body.paperId, "Paper", 64),
    );
    publish(server, "admin", "admin-state");
    return json({ id, status: "draft" }, 201);
  }

  const responsesMatch = path.match(/^\/api\/admin\/sessions\/([a-f0-9-]+)\/responses$/);
  if (responsesMatch && method === "GET") {
    requireRole(request, "admin");
    const results = getSessionResults(responsesMatch[1] as string);
    if (!results) throw new HttpError("Exam session not found", 404);
    const manifest = JSON.parse(results.manifestJson) as PaperManifest;
    return json({
      session: {
        id: results.id,
        className: results.className,
        paperTitle: results.paperTitle,
        status: results.status,
      },
      questions: manifest.questions.map(({ id, label, prompt, type }) => ({ id, label, prompt, type })),
      responses: results.responses.map((response) => ({
        responseId: response.responseId,
        studentName: response.studentName,
        candidateCode: response.candidateCode,
        answers: JSON.parse(response.answersJson) as Record<string, string>,
        selectedQuestionId: response.selectedQuestionId,
        updatedAt: response.updatedAt,
        submittedAt: response.submittedAt,
      })),
    });
  }

  const startMatch = path.match(/^\/api\/admin\/sessions\/([a-f0-9-]+)\/start$/);
  if (startMatch && method === "POST") {
    requireRole(request, "admin");
    const sessionId = startMatch[1] as string;
    startExamSession(sessionId);
    const session = listExamSessions().find((item) => item.id === sessionId);
    if (session) publish(server, `class:${session.classId}`, "exam-started");
    publish(server, "admin", "admin-state");
    return json({ id: sessionId, status: "live" });
  }

  const endMatch = path.match(/^\/api\/admin\/sessions\/([a-f0-9-]+)\/end$/);
  if (endMatch && method === "POST") {
    requireRole(request, "admin");
    const sessionId = endMatch[1] as string;
    const session = listExamSessions().find((item) => item.id === sessionId);
    endExamSession(sessionId);
    if (session) publish(server, `class:${session.classId}`, "exam-ended");
    publish(server, "admin", "admin-state");
    return json({ id: sessionId, status: "ended" });
  }

  if (path === "/api/student/state" && method === "GET") {
    const actor = requireRole(request, "student");
    const student = getStudent(actor.actorId);
    if (!student) throw new HttpError("Student account not found", 404);
    touchStudent(student.id);
    const exam = getStudentExam(student.id);
    if (!exam) return json({ status: "waiting", student: { name: student.name }, serverTime: Date.now() });

    const deadline = deadlineFor(exam);
    if (exam.submittedAt === null && Date.now() >= deadline) {
      submitResponse(exam.responseId);
      exam.submittedAt = Date.now();
      publish(server, "admin", "admin-state");
    }
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    return json({
      status: exam.submittedAt === null ? "live" : "submitted",
      student: { name: student.name, extraMinutes: student.extraMinutes },
      session: { id: exam.sessionId, startedAt: exam.startedAt, deadline },
      paper: publicManifest(manifest, exam.paperId),
      response: {
        selectedQuestionId: exam.selectedQuestionId,
        answers: JSON.parse(exam.answersJson) as Record<string, string>,
        flags: JSON.parse(exam.flagsJson) as string[],
        audioPlays: JSON.parse(exam.audioPlaysJson) as Record<string, number>,
        notepad: exam.notepad,
        updatedAt: exam.updatedAt,
        submittedAt: exam.submittedAt,
      },
      serverTime: Date.now(),
    });
  }

  if (path === "/api/student/response" && method === "PUT") {
    const actor = requireRole(request, "student");
    const exam = getStudentExam(actor.actorId);
    if (!exam) throw new HttpError("No live examination", 404);
    if (exam.sessionStatus !== "live") throw new HttpError("No live examination", 404);
    if (Date.now() >= deadlineFor(exam)) {
      if (exam.submittedAt === null) submitResponse(exam.responseId);
      throw new HttpError("Time has expired and the response was submitted", 409);
    }
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    const validated = await validatedResponse(await jsonBody(request), manifest);
    if (validated.sessionId !== exam.sessionId) throw new HttpError("Examination session changed", 409);
    const payload: ResponsePayload = {
      answersJson: JSON.stringify(validated.answers),
      selectedQuestionId: validated.selectedQuestionId,
      flagsJson: JSON.stringify(validated.flags),
      notepad: validated.notepad,
    };
    saveResponse(exam.responseId, payload);
    touchStudent(actor.actorId);
    publish(server, "admin", "admin-state");
    return json({ savedAt: Date.now() });
  }

  if (path === "/api/student/submit" && method === "POST") {
    const actor = requireRole(request, "student");
    const exam = getStudentExam(actor.actorId);
    if (!exam) throw new HttpError("No live examination", 404);
    if (exam.sessionStatus !== "live" || exam.submittedAt !== null) throw new HttpError("Response is not available", 409);
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    const validated = await validatedResponse(await jsonBody(request), manifest);
    if (validated.sessionId !== exam.sessionId) throw new HttpError("Examination session changed", 409);
    const submittedAt = saveAndSubmitResponse(exam.responseId, {
      answersJson: JSON.stringify(validated.answers),
      selectedQuestionId: validated.selectedQuestionId,
      flagsJson: JSON.stringify(validated.flags),
      notepad: validated.notepad,
    });
    publish(server, "admin", "admin-state");
    return json({ submittedAt });
  }

  if (path === "/api/student/audio-play" && method === "POST") {
    const actor = requireRole(request, "student");
    const exam = getStudentExam(actor.actorId);
    if (!exam) throw new HttpError("No live examination", 404);
    if (exam.sessionStatus !== "live") throw new HttpError("No live examination", 404);
    if (exam.submittedAt !== null || Date.now() >= deadlineFor(exam)) throw new HttpError("Response is not available", 409);
    const body = await jsonBody(request);
    if (requiredText(body.sessionId, "Session", 64) !== exam.sessionId) throw new HttpError("Examination session changed", 409);
    const resourceKey = requiredText(body.resourceKey, "Audio resource", 64);
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    const resource = manifest.resources.find((item) => item.key === resourceKey && item.kind === "audio");
    if (!resource) throw new HttpError("Audio resource not found", 404);
    const plays = incrementAudioPlay(exam.responseId, resourceKey, resource.maxPlays ?? 2);
    publish(server, "admin", "admin-state");
    return json({ plays, maxPlays: resource.maxPlays ?? 2 });
  }

  const assetMatch = path.match(/^\/api\/assets\/([a-f0-9-]+)\/([a-z0-9_-]+)$/);
  if (assetMatch && method === "GET") {
    const actor = authFromRequest(request);
    if (!actor) throw new HttpError("Authentication required", 401);
    const paperId = assetMatch[1] as string;
    const assetKey = assetMatch[2] as string;
    if (actor.role === "student") {
      const exam = getStudentExam(actor.actorId);
      if (!exam || exam.paperId !== paperId) throw new HttpError("Asset is not available", 403);
    }
    const asset = getAsset(paperId, assetKey);
    if (!asset) throw new HttpError("Asset not found", 404);
    return responseWithSecurity(new Response(asset.data as Uint8Array<ArrayBuffer>, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
        "Content-Type": asset.mime,
      },
    }));
  }

  throw new HttpError("Endpoint not found", 404);
}

const server = Bun.serve<SocketData>({
  hostname: "0.0.0.0",
  port,
  maxRequestBodySize: 210_000_000,
  async fetch(request, activeServer) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/ws") {
        const actor = authFromRequest(request);
        if (!actor) return json({ error: "Authentication required" }, 401);
        const student = actor.role === "student" ? getStudent(actor.actorId) : null;
        const upgraded = activeServer.upgrade(request, {
          data: { role: actor.role, actorId: actor.actorId, classId: student?.classId ?? null },
        });
        return upgraded ? undefined : json({ error: "WebSocket upgrade failed" }, 400);
      }
      if (url.pathname.startsWith("/api/")) return await handleApi(request, activeServer, url.pathname);
      const filePath = STATIC_FILES[url.pathname];
      if (!filePath || request.method !== "GET") throw new HttpError("Page not found", 404);
      const file = Bun.file(filePath);
      if (!(await file.exists())) throw new HttpError("Page not found", 404);
      const response = new Response(file);
      response.headers.set("Cache-Control", "no-cache");
      return responseWithSecurity(response);
    } catch (error) {
      const normalized = error instanceof HttpError ? error : databaseError(error instanceof Error ? error : new Error("Unexpected error"));
      return json({ error: normalized.message }, normalized.status);
    }
  },
  websocket: {
    idleTimeout: 120,
    open(socket) {
      socket.subscribe(socket.data.role === "admin" ? "admin" : `class:${socket.data.classId}`);
      if (socket.data.role === "student") touchStudent(socket.data.actorId);
      socket.send(JSON.stringify({ type: "connected", at: Date.now() }));
    },
    message(socket, message) {
      if (String(message) === "ping") {
        if (socket.data.role === "student") touchStudent(socket.data.actorId);
        socket.send(JSON.stringify({ type: "pong", at: Date.now() }));
      }
    },
  },
});

deleteExpiredAuthSessions();
setInterval(deleteExpiredAuthSessions, 60 * 60 * 1000).unref();
console.log(`DigitalDP is listening on http://0.0.0.0:${server.port}`);
