import type { Server } from "bun";
import {
  archiveClass,
  archiveExamSession,
  archiveStudent,
  configureDemoAdmin,
  createAdmin,
  createClass,
  createExamSession,
  createPaper,
  createStudent,
  deleteAdminSessions,
  deleteExpiredAuthSessions,
  endExamSession,
  findAdmin,
  findAdminById,
  findStudentLoginById,
  updateAdminPasswordHash,
  getAsset,
  getAudioPlayCount,
  getPaper,
  getSessionResults,
  getStudent,
  getStudentExam,
  incrementAudioPlay,
  importClassRosters,
  listClasses,
  listStudentFocusEvents,
  listExamSessions,
  listPaperAssets,
  listPapers,
  listStudentExamSessions,
  listStudentRoster,
  listStudents,
  restoreClass,
  restoreExamSession,
  restoreStudent,
  saveAndSubmitResponse,
  recordStudentFocusEvent,
  saveResponse,
  setupRequired,
  startExamSession,
  submitResponse,
  touchStudent,
  updateExamSessionTiming,
  updateStudent,
  type ResponsePayload,
  type Role,
  type StudentExamRow,
} from "./src/db.ts";
import { blankClassRosterCsv, encodeClassRosterCsv, parseClassRosterCsv } from "./src/class-rosters.ts";
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
  AUDIO_PLAY_LIMIT,
  encodePortablePaper,
  parsePaperUpload,
  sanitizeRichText,
  type PaperManifest,
} from "./src/papers.ts";
import { normalizeInkAnswer } from "./src/ink.ts";
import { parseByteRange, type ByteRangeResult } from "./src/http-range.ts";
import {
  demoNetworkConfig,
  isExpectedRequestAuthority,
  isLanStudentApiRequest,
  isLoopbackAddress,
  studentJoinOrigin,
} from "./src/network.ts";
import {
  ClassroomNetworkState,
  listLocalPrivateIpv4Interfaces,
  loadSelectedClassroomAddress,
  persistSelectedClassroomAddress,
} from "./src/classroom-network.ts";
import { guideStylesheetSource, isStudentStaticPath, staticFilePath } from "./src/static-files.ts";
import { staticAssetPath } from "./src/static-assets.ts";
import { examPhaseAt, examTimeline, examTiming, type ScheduledExamPhase } from "./src/timing.ts";
import { responseFitsPhase, type CandidateResponseSnapshot } from "./src/exam-phase-access.ts";
import {
  AudioPlaybackError,
  AudioPlaybackTickets,
  type AudioPlaybackIdentity,
} from "./src/audio-playback.ts";

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
const managedClassroomNetwork = process.env.DIGITALDP_MANAGED_NETWORK === "1";
const managedDatabasePath = managedClassroomNetwork ? process.env.DIGITALDP_DB : undefined;
if (managedClassroomNetwork && !managedDatabasePath) {
  throw new Error("DIGITALDP_MANAGED_NETWORK requires DIGITALDP_DB");
}
const classroomNetwork = new ClassroomNetworkState({
  managed: managedClassroomNetwork,
  port,
  selectedAddress: managedDatabasePath ? loadSelectedClassroomAddress(managedDatabasePath) : null,
});
let network = demoNetworkConfig({
  port,
  bindHostname: managedClassroomNetwork ? "0.0.0.0" : process.env.HOST,
  lanOrigin: managedClassroomNetwork ? undefined : process.env.DIGITALDP_LAN_ORIGIN,
  allowInactiveLanBinding: managedClassroomNetwork,
});
const hostname = network.bindHostname;
const RESPONSE_BODY_BYTES = 12_000_000;
const DEADLINE_GRACE_MS = 5_000;
const PHASE_BOUNDARY_GRACE_MS = 5_000;
const CLASS_ROSTER_BYTES = 1_000_000;
const audioPlayback = new AudioPlaybackTickets();

function parseTestReadingSeconds(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const seconds = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isInteger(seconds) || seconds < 0 || seconds > 3_600) {
    throw new Error("DIGITALDP_TEST_READING_SECONDS must be an integer between 0 and 3600");
  }
  return seconds;
}
const TEST_READING_SECONDS = parseTestReadingSeconds(process.env.DIGITALDP_TEST_READING_SECONDS);

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; connect-src 'self' ws: wss:; font-src 'self'; form-action 'self'; frame-ancestors 'self'; frame-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; script-src 'self'; style-src 'self'",
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

function assetResponse(
  request: Request,
  asset: { data: Uint8Array; filename: string; mime: string },
  cacheControl: string,
  range: ByteRangeResult,
): Response {
  const bytes = Uint8Array.from(asset.data);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
    "Content-Type": asset.mime,
  });
  if (range.kind === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${bytes.byteLength}`);
    return responseWithSecurity(new Response(null, { status: 416, headers }));
  }

  if (range.kind === "partial") {
    headers.set("Content-Length", String(range.length));
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${bytes.byteLength}`);
    const body = request.method === "HEAD" ? null : bytes.slice(range.start, range.end + 1);
    return responseWithSecurity(new Response(body, { status: 206, headers }));
  }

  headers.set("Content-Length", String(bytes.byteLength));
  const body = request.method === "HEAD" ? null : bytes;
  return responseWithSecurity(new Response(body, { status: 200, headers }));
}

function completeAudioAssetResponse(asset: { data: Uint8Array; filename: string; mime: string }): Response {
  const bytes = Uint8Array.from(asset.data);
  return responseWithSecurity(new Response(bytes, {
    status: 200,
    headers: {
      "Accept-Ranges": "none",
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.filename)}`,
      "Content-Length": String(bytes.byteLength),
      "Content-Type": asset.mime,
    },
  }));
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

function optionalText(value: unknown, label: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new HttpError(`${label} is invalid`, 400);
  const clean = value.trim();
  if (!clean) return undefined;
  if (clean.length > max) throw new HttpError(`${label} is invalid`, 400);
  return clean;
}

function optionalInteger(value: unknown, label: string, min: number, max: number): number {
  const number = value === undefined ? min : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new HttpError(`${label} must be between ${min} and ${max}`, 400);
  }
  return number;
}

function requiredInteger(value: unknown, label: string, min: number, max: number): number {
  if (value === undefined || value === null || value === "") throw new HttpError(`${label} is required`, 400);
  return optionalInteger(value, label, min, max);
}

function requiredNumber(value: unknown, label: string, min: number, max: number): number {
  if (value === undefined || value === null || value === "") throw new HttpError(`${label} is required`, 400);
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new HttpError(`${label} must be between ${min} and ${max}`, 400);
  }
  return number;
}

async function jsonBody(request: Request, maxBytes = 1_000_000): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new HttpError("Request body is too large", 413);
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new HttpError("Request body is too large", 413);
    return asRecord(JSON.parse(raw) as unknown);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Request body must be valid JSON", 400);
  }
}

async function classRosterUpload(request: Request): Promise<string> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > CLASS_ROSTER_BYTES + 100_000) throw new HttpError("Class-list CSV is too large", 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError("Class-list upload is invalid", 400);
  }
  const file = form.get("classRoster");
  if (!(file instanceof File) || file.size === 0) throw new HttpError("Choose a class-list CSV file", 400);
  if (file.size > CLASS_ROSTER_BYTES) throw new HttpError("Class-list CSV is too large", 413);
  if (!file.name.toLowerCase().endsWith(".csv")) throw new HttpError("Choose a CSV file", 400);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new HttpError("Class-list CSV must use UTF-8 text", 400);
  }
}

function csvDownload(filename: string, contents: string): Response {
  return responseWithSecurity(new Response(contents, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  }));
}

function clientAddress(request: Request, server: Server<SocketData>): string {
  return server.requestIP(request)?.address ?? "unknown";
}

function timingFor(exam: { startedAt: number; durationMinutes: number; readingTimeMinutes: number; extraMinutes: number; manifestJson: string }) {
  const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
  const input = {
    startedAt: exam.startedAt,
    readingTimeMinutes: effectiveReadingTimeMinutes(exam.readingTimeMinutes),
    durationMinutes: exam.durationMinutes,
    extraMinutes: exam.extraMinutes,
    phases: manifest.phases,
  };
  return { ...examTiming(input), timeline: examTimeline(input) };
}

function phaseForResponse(timing: ReturnType<typeof timingFor>, now: number): ScheduledExamPhase | null {
  if (now < timing.deadline) return examPhaseAt(timing.timeline, now);
  if (now <= timing.deadline + DEADLINE_GRACE_MS) return examPhaseAt(timing.timeline, timing.deadline - 1);
  return null;
}

function publicPhase(phase: ScheduledExamPhase | null) {
  if (!phase) return null;
  return {
    id: phase.id,
    label: phase.label,
    kind: phase.kind,
    sectionId: phase.sectionId,
    tools: phase.tools,
    instructions: phase.instructions,
    startsAt: phase.startsAt,
    standardEndsAt: phase.standardEndsAt,
    endsAt: phase.endsAt,
    responseAllowed: phase.responseAllowed,
    canSubmit: phase.canSubmit,
  };
}

function responseSnapshot(exam: StudentExamRow): CandidateResponseSnapshot {
  return {
    answers: JSON.parse(exam.answersJson) as Record<string, string>,
    flags: JSON.parse(exam.flagsJson) as string[],
    selectedQuestionId: exam.selectedQuestionId,
  };
}

function eligibleResponsePhases(timing: ReturnType<typeof timingFor>, now: number): ScheduledExamPhase[] {
  const current = phaseForResponse(timing, now);
  if (!current) return [];
  const eligible = current.responseAllowed ? [current] : [];
  const index = timing.timeline.findIndex(({ id }) => id === current.id);
  const previous = timing.timeline[index - 1];
  if (previous?.responseAllowed && now - current.startsAt <= PHASE_BOUNDARY_GRACE_MS) eligible.push(previous);
  return eligible;
}

function assertResponseWithinPhases(
  exam: StudentExamRow,
  manifest: PaperManifest,
  validated: SavedResponseInput,
  phases: ScheduledExamPhase[],
): void {
  const previous = responseSnapshot(exam);
  const next = {
    answers: validated.answers,
    flags: validated.flags,
    selectedQuestionId: validated.selectedQuestionId,
  };
  if (!phases.some((phase) => responseFitsPhase(manifest, previous, next, phase))) {
    throw new HttpError("A response from a locked examination section cannot be changed", 409);
  }
}

function studentAudioContext(studentId: string, sessionId: string, resourceKey: string): {
  exam: StudentExamRow;
  identity: AudioPlaybackIdentity;
} {
  const exam = getStudentExam(studentId, sessionId);
  if (!exam) throw new HttpError("No live examination", 404);
  const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
  if (!manifest.resources.some((resource) => resource.key === resourceKey && resource.kind === "audio")) {
    throw new HttpError("Audio resource not found", 404);
  }
  return {
    exam,
    identity: {
      studentId,
      sessionId,
      paperId: exam.paperId,
      resourceKey,
      responseId: exam.responseId,
    },
  };
}

function availableAudioTiming(exam: StudentExamRow) {
  if (exam.sessionStatus !== "live") throw new HttpError("No live examination", 404);
  const timing = timingFor(exam);
  const now = Date.now();
  const phase = phaseForResponse(timing, now);
  if (exam.submittedAt !== null || !phase?.responseAllowed || now >= timing.deadline) {
    throw new HttpError("Response is not available", 409);
  }
  return timing;
}

function effectiveReadingTimeMinutes(storedMinutes: number): number {
  return TEST_READING_SECONDS === null ? storedMinutes : TEST_READING_SECONDS / 60;
}

function listAdminExamSessions(archived = false) {
  return listExamSessions(archived).map((session) => ({
    ...session,
    readingTimeMinutes: effectiveReadingTimeMinutes(session.readingTimeMinutes),
    phases: getPaper(session.paperId)?.manifest.phases,
  }));
}

const privateLanAddresses = () => listLocalPrivateIpv4Interfaces().map(({ address }) => address);

function classroomNetworkApiState() {
  const snapshot = classroomNetwork.snapshot();
  const liveExam = listAdminExamSessions().some((session) => session.status === "live");
  return {
    managed: snapshot.managed,
    addresses: snapshot.managed
      ? listLocalPrivateIpv4Interfaces().map(({ interfaceName, address }) => ({ name: interfaceName, address }))
      : [],
    // An address is exposed as active only while sharing is actually enabled.
    // The saved preference remains private in the runtime state until selected.
    address: snapshot.lanOrigin === null ? null : snapshot.selectedAddress,
    selectedAddress: snapshot.selectedAddress,
    studentUrl: `${studentJoinOrigin({ lanOrigin: network.lanOrigin, port, addresses: privateLanAddresses() })}/student`,
    liveExam,
  };
}

function updateManagedClassroomNetwork(address: string | null) {
  if (!managedClassroomNetwork || !managedDatabasePath) {
    throw new HttpError("Classroom sharing is available only in a packaged release", 403);
  }

  if (listAdminExamSessions().some((session) => session.status === "live")) {
    throw new HttpError("End the live exam before changing classroom sharing", 409);
  }

  const snapshot = address === null
    ? classroomNetwork.disable()
    : (() => {
      const available = listLocalPrivateIpv4Interfaces();
      persistSelectedClassroomAddress(managedDatabasePath, address, available);
      return classroomNetwork.enable(address, available);
    })();

  network = demoNetworkConfig({
    port,
    bindHostname: hostname,
    lanOrigin: snapshot.lanOrigin ?? undefined,
    allowInactiveLanBinding: true,
  });
  return classroomNetworkApiState();
}

const lifecycleCommands = {
  students: { archive: archiveStudent, restore: restoreStudent, event: "roster-changed" },
  classes: { archive: archiveClass, restore: restoreClass, event: "roster-changed" },
  sessions: { archive: archiveExamSession, restore: restoreExamSession, event: "exam-list-changed" },
} as const;

function publish(server: Server<SocketData>, topic: string, type: string): void {
  server.publish(topic, JSON.stringify({ type, at: Date.now() }));
}

function publicManifest(manifest: PaperManifest, paperId: string, sessionId: string): Record<string, unknown> {
  return {
    ...manifest,
    resources: manifest.resources.map((resource) => ({
      ...resource,
      file: undefined,
      url: resource.file && resource.kind !== "audio"
        ? `/api/assets/${paperId}/${resource.key}?session=${encodeURIComponent(sessionId)}`
        : resource.url,
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
    } else if (question.type === "ink") {
      if (!question.ink) throw new HttpError(`Question ${questionId} has no working-space configuration`, 400);
      answers[questionId] = normalizeInkAnswer(rawAnswer, question.ink);
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
  if (error instanceof AudioPlaybackError) return new HttpError(error.message, error.status);
  if (error.message.includes("UNIQUE constraint failed")) return new HttpError("That code or active session already exists", 409);
  if (error.message.includes("FOREIGN KEY constraint failed")) return new HttpError("The selected class or paper no longer exists", 400);
  if (error.message === "Authentication required") return new HttpError(error.message, 401);
  if (error.message === "Cross-origin request rejected") return new HttpError(error.message, 403);
  if (error.message.includes("not found")) return new HttpError(error.message, 404);
  if (
    error.message.includes("already submitted")
    || error.message.includes("No audio plays")
    || error.message.includes("live exam")
    || error.message.includes("Restore the class")
  ) return new HttpError(error.message, 409);
  return new HttpError(error.message, 400);
}

async function handleApi(
  request: Request,
  server: Server<SocketData>,
  path: string,
  localRequest: boolean,
): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") assertSameOrigin(request);

  if (path === "/api/bootstrap" && method === "GET") {
    const actor = authFromRequest(request);
    const role = !localRequest && actor?.role === "admin" ? null : actor?.role ?? null;
    return json({
      setupRequired: localRequest && setupRequired(),
      role,
      studentOrigin: studentJoinOrigin({ lanOrigin: network.lanOrigin, port, addresses: privateLanAddresses() }),
    });
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

  if (path === "/api/student/roster" && method === "POST") {
    const body = await jsonBody(request);
    const classCode = requiredText(body.classCode, "Class code", 24);
    return json({ students: listStudentRoster(classCode).map(({ id, name }) => ({ id, name })) });
  }

  if (path === "/api/login/student" && method === "POST") {
    const body = await jsonBody(request);
    const classCode = requiredText(body.classCode, "Class code", 24);
    const studentId = requiredText(body.studentId, "Student", 64);
    const limiterKey = `student:${clientAddress(request, server)}:${classCode.toLowerCase()}:id:${studentId}`;
    if (!allowLoginAttempt(limiterKey)) throw new HttpError("Too many login attempts. Try again later", 429);
    const student = findStudentLoginById(classCode, studentId);
    if (!student) {
      throw new HttpError("Class code or student is incorrect", 401);
    }
    clearLoginAttempts(limiterKey);
    touchStudent(student.id);
    const cookie = issueSession("student", student.id, new URL(request.url).protocol === "https:");
    return json({ role: "student", name: student.name }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/logout" && method === "POST") {
    const actor = authFromRequest(request);
    if (!localRequest && actor?.role === "admin") throw new HttpError("Teacher access is only available on this computer", 403);
    const cookie = revokeSession(request, new URL(request.url).protocol === "https:");
    return json({ ok: true }, 200, { "Set-Cookie": cookie });
  }

  if (path === "/api/admin/state" && method === "GET") {
    requireRole(request, "admin");
    return json({
      classes: listClasses(),
      students: listStudents(),
      papers: listPapers(),
      sessions: listAdminExamSessions(),
      network: classroomNetworkApiState(),
      archived: {
        classes: listClasses(true),
        students: listStudents(true),
        sessions: listAdminExamSessions(true),
      },
      serverTime: Date.now(),
    });
  }

  if (path === "/api/admin/class-rosters/template" && method === "GET") {
    requireRole(request, "admin");
    return csvDownload("PacePaper-class-list-template.csv", blankClassRosterCsv());
  }

  if (path === "/api/admin/class-rosters/export" && method === "GET") {
    requireRole(request, "admin");
    return csvDownload("PacePaper-class-lists.csv", encodeClassRosterCsv(listClasses(), listStudents()));
  }

  if (path === "/api/admin/class-rosters/import" && method === "POST") {
    requireRole(request, "admin");
    const result = importClassRosters(parseClassRosterCsv(await classRosterUpload(request)));
    publish(server, "admin", "admin-state");
    return json(result, 201);
  }

  if (path === "/api/admin/network" && method === "GET") {
    requireRole(request, "admin");
    if (!localRequest) throw new HttpError("Teacher access is only available on this computer", 403);
    return json(classroomNetworkApiState());
  }

  if (path === "/api/admin/network" && method === "POST") {
    requireRole(request, "admin");
    if (!localRequest) throw new HttpError("Teacher access is only available on this computer", 403);
    const body = await jsonBody(request);
    if (body.address !== null && typeof body.address !== "string") {
      throw new HttpError("Choose a classroom network address or turn sharing off", 400);
    }
    const state = updateManagedClassroomNetwork(body.address);
    publish(server, "admin", "admin-state");
    return json(state);
  }

  if (path === "/api/admin/password" && method === "POST") {
    const actor = requireRole(request, "admin");
    if (!localRequest) throw new HttpError("Teacher access is only available on this computer", 403);
    const body = await jsonBody(request);
    const currentPassword = requiredText(body.currentPassword, "Current password", 200);
    const newPassword = requiredText(body.newPassword, "New password", 200);
    if (newPassword.length < 10) throw new HttpError("Use a new password of at least 10 characters", 400);
    if (newPassword === currentPassword) throw new HttpError("New password must be different from the current password", 400);
    const admin = findAdminById(actor.actorId);
    if (!admin || !(await Bun.password.verify(currentPassword, admin.passwordHash))) {
      throw new HttpError("Current password is incorrect", 403);
    }
    updateAdminPasswordHash(admin.id, await Bun.password.hash(newPassword));
    // The password changed: every existing teacher session is invalidated so
    // only sign-ins made with the new password remain active.
    deleteAdminSessions();
    return json({ ok: true });
  }

  const lifecycleMatch = path.match(/^\/api\/admin\/(students|classes|sessions)\/([a-f0-9-]+)\/(archive|restore)$/);
  if (lifecycleMatch && method === "POST") {
    requireRole(request, "admin");
    const collection = lifecycleMatch[1] as keyof typeof lifecycleCommands;
    const id = lifecycleMatch[2] as string;
    const action = lifecycleMatch[3] as "archive" | "restore";
    const command = lifecycleCommands[collection];
    const result = command[action](id);
    publish(server, `class:${result.classId}`, command.event);
    publish(server, "admin", "admin-state");
    return json({ id: result.id, archived: action === "archive", archivedAt: result.archivedAt });
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
    const extraMinutes = optionalInteger(body.extraMinutes, "Extra time", 0, 180);
    if (!/^[A-Z0-9-]{2,32}$/.test(candidateCode)) throw new HttpError("Candidate code needs letters, numbers or hyphens", 400);
    const created = createStudent({ classId, name, candidateCode, extraMinutes });
    publish(server, "admin", "admin-state");
    return json({
      id: created.id,
      classId: created.classId,
      name: created.name,
      candidateCode: created.candidateCode,
      extraMinutes: created.extraMinutes,
      createdAt: created.createdAt,
    }, 201);
  }

  const studentUpdateMatch = path.match(/^\/api\/admin\/students\/([a-f0-9-]+)$/);
  if (studentUpdateMatch && method === "PUT") {
    requireRole(request, "admin");
    const body = await jsonBody(request);
    const classId = requiredText(body.classId, "Class", 64);
    const name = requiredText(body.name, "Student name", 100);
    const candidateCode = requiredText(body.candidateCode, "Candidate code", 32).toUpperCase();
    const extraMinutes = requiredInteger(body.extraMinutes, "Extra time", 0, 180);
    if (!/^[A-Z0-9-]{2,32}$/.test(candidateCode)) throw new HttpError("Candidate code needs letters, numbers or hyphens", 400);
    const updated = updateStudent({
      id: studentUpdateMatch[1] as string,
      classId,
      name,
      candidateCode,
      extraMinutes,
    });
    if (!updated) throw new HttpError("Student not found in selected class", 404);
    publish(server, "admin", "admin-state");
    return json(updated);
  }

  if (path === "/api/admin/papers" && method === "POST") {
    requireRole(request, "admin");
    const imported = await parsePaperUpload(await request.formData());
    const created = createPaper(imported);
    publish(server, "admin", "admin-state");
    return json(created, 201);
  }

  const paperExportMatch = path.match(/^\/api\/admin\/papers\/([a-f0-9-]+)\/export$/);
  if (paperExportMatch && method === "GET") {
    requireRole(request, "admin");
    const stored = getPaper(paperExportMatch[1] as string);
    if (!stored) throw new HttpError("Paper not found", 404);
    if (
      !["teacher-authored", "school-authorized"].includes(stored.manifest.sourceClassification)
      || !stored.manifest.exportAuthorized
    ) {
      throw new HttpError("This paper is not explicitly authorized for portable export", 403);
    }
    const bytes = await encodePortablePaper(stored.manifest, listPaperAssets(stored.row.id));
    const filename = `${stored.manifest.title.normalize("NFKD").replace(/[^a-z0-9]+/giu, "-").replace(/^-|-$/gu, "").slice(0, 80) || "digitaldp-paper"}.digitaldp-paper`;
    return responseWithSecurity(new Response(bytes, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": "application/vnd.digitaldp.paper+gzip",
      },
    }));
  }

  if (path === "/api/admin/sessions" && method === "POST") {
    requireRole(request, "admin");
    const body = await jsonBody(request);
    const classId = requiredText(body.classId, "Class", 64);
    const paperId = requiredText(body.paperId, "Paper", 64);
    const id = createExamSession(classId, paperId);
    publish(server, `class:${classId}`, "exam-list-changed");
    publish(server, "admin", "admin-state");
    return json({ id, status: "draft" }, 201);
  }

  const timingMatch = path.match(/^\/api\/admin\/sessions\/([a-f0-9-]+)\/timing$/);
  if (timingMatch && method === "PUT") {
    requireRole(request, "admin");
    const sessionId = timingMatch[1] as string;
    const session = listExamSessions().find((item) => item.id === sessionId);
    if (!session) throw new HttpError("Exam session not found", 404);
    const paper = getPaper(session.paperId);
    if (!paper) throw new HttpError("Paper not found", 404);
    if (paper.manifest.phases?.length) {
      throw new HttpError("This exam uses a fixed multi-phase schedule; edit the paper definition to change it", 409);
    }
    const body = await jsonBody(request);
    const readingTimeMinutes = requiredNumber(body.readingTimeMinutes, "Reading time", 0, 60);
    const durationMinutes = requiredInteger(body.durationMinutes, "Writing time", 1, 360);
    const hasExpected = body.expectedReadingTimeMinutes !== undefined || body.expectedDurationMinutes !== undefined;
    const expected = hasExpected ? {
      readingTimeMinutes: requiredNumber(body.expectedReadingTimeMinutes, "Previous reading time", 0, 60),
      durationMinutes: requiredInteger(body.expectedDurationMinutes, "Previous writing time", 1, 360),
    } : undefined;
    if (TEST_READING_SECONDS !== null) {
      throw new HttpError("A test reading-time override is active. Restart without DIGITALDP_TEST_READING_SECONDS before changing exam timing", 409);
    }
    try {
      updateExamSessionTiming(sessionId, readingTimeMinutes, durationMinutes, expected);
    } catch (error) {
      throw new HttpError(error instanceof Error ? error.message : "Exam timing could not be changed", 409);
    }
    publish(server, `class:${session.classId}`, "exam-list-changed");
    publish(server, "admin", "admin-state");
    return json({ id: sessionId, status: session.status, readingTimeMinutes, durationMinutes });
  }
  const focusMatch = path.match(/^\/api\/admin\/sessions\/([a-f0-9-]+)\/focus-events$/);
  if (focusMatch && method === "GET") {
    requireRole(request, "admin");
    const sessionId = focusMatch[1] as string;
    // Match any session, active or archived — not just archived ones.
    const exists = listExamSessions().some((session) => session.id === sessionId)
      || listExamSessions(true).some((session) => session.id === sessionId);
    if (!exists) throw new HttpError("Exam session not found", 404);
    return json({ sessionId, events: listStudentFocusEvents(sessionId) });
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
        paperId: results.paperId,
        className: results.className,
        paperTitle: results.paperTitle,
        status: results.status,
        assessmentSession: manifest.assessmentSession,
        sourceClassification: manifest.sourceClassification,
        subjectLabel: manifest.subjectLabel,
        level: manifest.level,
        paper: manifest.paper,
        durationMinutes: results.durationMinutes,
        readingTimeMinutes: effectiveReadingTimeMinutes(results.readingTimeMinutes),
        phases: manifest.phases,
        maximumMarks: manifest.maximumMarks,
        subjectWeightPercent: manifest.subjectWeightPercent,
        mode: manifest.mode,
        selectionMode: manifest.selectionMode,
        instructions: manifest.instructions,
      },
      resources: manifest.resources.map((resource) => ({
        ...resource,
        file: undefined,
        url: resource.file ? `/api/assets/${results.paperId}/${resource.key}` : resource.url,
      })),
      questions: manifest.questions.map(({ id, label, prompt, type, options, ink, resourceKeys, marks }) => ({
        id,
        label,
        prompt,
        type,
        options,
        ink,
        resourceKeys,
        marks,
      })),
      responses: results.responses.map((response) => ({
        responseId: response.responseId,
        studentName: response.studentName,
        candidateCode: response.candidateCode,
        answers: JSON.parse(response.answersJson) as Record<string, string>,
        selectedQuestionId: response.selectedQuestionId,
        notepad: response.notepad,
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
    const sessions = listStudentExamSessions(student.id);
    const selectedSessionId = optionalText(new URL(request.url).searchParams.get("session"), "Session", 64);
    if (!selectedSessionId) {
      return json({ status: "selecting", student: { name: student.name }, sessions, serverTime: Date.now() });
    }

    const selectedSession = sessions.find((session) => session.id === selectedSessionId);
    if (!selectedSession) {
      return json({
        status: "selecting",
        student: { name: student.name },
        sessions,
        serverTime: Date.now(),
        selectionReset: true,
      });
    }
    if (selectedSession.status === "draft") {
      return json({
        status: "waiting",
        student: { name: student.name },
        session: selectedSession,
        serverTime: Date.now(),
      });
    }

    const exam = getStudentExam(student.id, selectedSession.id);
    if (!exam) throw new HttpError("Student response is not available for this examination", 409);

    const timing = timingFor(exam);
    if (exam.sessionStatus === "live" && exam.submittedAt === null && Date.now() >= timing.deadline + DEADLINE_GRACE_MS) {
      submitResponse(exam.responseId);
      exam.submittedAt = Date.now();
      publish(server, "admin", "admin-state");
    }
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    const phase = phaseForResponse(timing, Date.now());
    return json({
      status: exam.submittedAt === null ? "live" : "submitted",
      student: { name: student.name, extraMinutes: student.extraMinutes },
      session: {
        id: exam.sessionId,
        startedAt: exam.startedAt,
        readingEndsAt: timing.readingEndsAt,
        deadline: timing.deadline,
        phase: publicPhase(phase),
        timeline: timing.timeline.map(publicPhase),
      },
      paper: publicManifest(manifest, exam.paperId, exam.sessionId),
      response: {
        id: exam.responseId,
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
    const body = await jsonBody(request, RESPONSE_BODY_BYTES);
    const sessionId = requiredText(body.sessionId, "Session", 64);
    const exam = getStudentExam(actor.actorId, sessionId);
    if (!exam) throw new HttpError("No live examination", 404);
    if (exam.sessionStatus !== "live") throw new HttpError("No live examination", 404);
    const timing = timingFor(exam);
    const now = Date.now();
    const phases = eligibleResponsePhases(timing, now);
    if (phases.length === 0) throw new HttpError("Student entry is locked during this exam phase", 409);
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    const validated = await validatedResponse(body, manifest);
    assertResponseWithinPhases(exam, manifest, validated, phases);
    const payload: ResponsePayload = {
      answersJson: JSON.stringify(validated.answers),
      selectedQuestionId: validated.selectedQuestionId,
      flagsJson: JSON.stringify(validated.flags),
      notepad: validated.notepad,
    };
    if (now >= timing.deadline) {
      if (now <= timing.deadline + DEADLINE_GRACE_MS) {
        const submittedAt = saveAndSubmitResponse(exam.responseId, payload);
        publish(server, "admin", "admin-state");
        return json({ savedAt: submittedAt, submittedAt, expired: true });
      }
      if (exam.submittedAt === null) submitResponse(exam.responseId);
      throw new HttpError("Time has expired and the response was submitted", 409);
    }
    saveResponse(exam.responseId, payload);
    touchStudent(actor.actorId);
    publish(server, "admin", "admin-state");
    return json({ savedAt: Date.now() });
  }

  if (path === "/api/student/submit" && method === "POST") {
    const actor = requireRole(request, "student");
    const body = await jsonBody(request, RESPONSE_BODY_BYTES);
    const sessionId = requiredText(body.sessionId, "Session", 64);
    const exam = getStudentExam(actor.actorId, sessionId);
    if (!exam) throw new HttpError("No live examination", 404);
    if (exam.sessionStatus !== "live" || exam.submittedAt !== null) throw new HttpError("Response is not available", 409);
    const timing = timingFor(exam);
    const now = Date.now();
    const phase = phaseForResponse(timing, now);
    if (!phase?.responseAllowed) throw new HttpError("Student entry is locked during this exam phase", 409);
    if (!phase.canSubmit) throw new HttpError("Final submission opens in the last work section", 409);
    const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
    const validated = await validatedResponse(body, manifest);
    assertResponseWithinPhases(exam, manifest, validated, [phase]);
    if (now > timing.deadline + DEADLINE_GRACE_MS) {
      submitResponse(exam.responseId);
      throw new HttpError("Time has expired and the last saved response was submitted", 409);
    }
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
    const body = await jsonBody(request);
    const sessionId = requiredText(body.sessionId, "Session", 64);
    const resourceKey = requiredText(body.resourceKey, "Audio resource", 64);
    const { exam, identity } = studentAudioContext(actor.actorId, sessionId, resourceKey);
    const timing = availableAudioTiming(exam);
    const usedPlays = getAudioPlayCount(exam.responseId, resourceKey);
    if (usedPlays >= AUDIO_PLAY_LIMIT) throw new HttpError("Both audio listens have been used", 409);
    const { playToken } = audioPlayback.issue(identity, timing.deadline);
    return json({
      plays: usedPlays,
      maxPlays: AUDIO_PLAY_LIMIT,
      playToken,
      url: `/api/assets/${exam.paperId}/${resourceKey}?session=${encodeURIComponent(sessionId)}&play=${encodeURIComponent(playToken)}`,
    });
  }

  if (path === "/api/student/audio-play/start" && method === "POST") {
    const actor = requireRole(request, "student");
    const body = await jsonBody(request);
    const sessionId = requiredText(body.sessionId, "Session", 64);
    const resourceKey = requiredText(body.resourceKey, "Audio resource", 64);
    const playToken = requiredText(body.playToken, "Audio authorization", 64);
    if (typeof body.durationSeconds !== "number") throw new HttpError("Audio duration is required", 400);
    const { exam, identity } = studentAudioContext(actor.actorId, sessionId, resourceKey);
    availableAudioTiming(exam);
    const started = audioPlayback.start(
      playToken,
      identity,
      body.durationSeconds,
      () => incrementAudioPlay(exam.responseId, resourceKey),
    );
    publish(server, "admin", "admin-state");
    return json(started);
  }

  if (path === "/api/student/audio-play/complete" && method === "POST") {
    const actor = requireRole(request, "student");
    const body = await jsonBody(request);
    const sessionId = requiredText(body.sessionId, "Session", 64);
    const resourceKey = requiredText(body.resourceKey, "Audio resource", 64);
    const playToken = requiredText(body.playToken, "Audio authorization", 64);
    const { identity } = studentAudioContext(actor.actorId, sessionId, resourceKey);
    return json(audioPlayback.complete(playToken, identity));
  }

  if (path === "/api/student/focus-event" && method === "POST") {
    const actor = requireRole(request, "student");
    const body = await jsonBody(request);
    const sessionId = requiredText(body.sessionId, "Session", 64);
    const kind = requiredText(body.kind, "Focus event", 32);
    if (kind !== "focus_lost" && kind !== "focus_gained") {
      throw new HttpError("Unknown focus event", 400);
    }
    // Only a live, not-yet-submitted exam owned by this student records an event.
    const exam = getStudentExam(actor.actorId, sessionId);
    if (!exam || exam.sessionStatus !== "live" || exam.submittedAt !== null) {
      throw new HttpError("Exam is not in progress", 409);
    }
    recordStudentFocusEvent(sessionId, actor.actorId, kind);
    publish(server, "admin", "admin-state");
    return json({ ok: true }, 201);
  }

  const assetMatch = path.match(/^\/api\/assets\/([a-f0-9-]+)\/([a-z0-9_-]+)$/);
  if (assetMatch && (method === "GET" || method === "HEAD")) {
    const actor = authFromRequest(request);
    if (!actor) throw new HttpError("Authentication required", 401);
    if (!localRequest && actor.role !== "student") throw new HttpError("Teacher access is only available on this computer", 403);
    const paperId = assetMatch[1] as string;
    const assetKey = assetMatch[2] as string;
    if (actor.role === "student") {
      const sessionId = requiredText(new URL(request.url).searchParams.get("session"), "Session", 64);
      const exam = getStudentExam(actor.actorId, sessionId);
      if (!exam || exam.sessionStatus !== "live" || exam.submittedAt !== null || exam.paperId !== paperId) {
        throw new HttpError("Asset is not available", 403);
      }
      const manifest = JSON.parse(exam.manifestJson) as PaperManifest;
      const resource = manifest.resources.find((item) => item.key === assetKey);
      if (!resource) throw new HttpError("Asset is not available", 403);
      if (resource.kind === "audio") {
        availableAudioTiming(exam);
        const playToken = requiredText(new URL(request.url).searchParams.get("play"), "Audio authorization", 64);
        const asset = getAsset(paperId, assetKey);
        if (!asset) throw new HttpError("Asset not found", 404);
        audioPlayback.claimDownload(playToken, {
          studentId: actor.actorId,
          sessionId,
          paperId,
          resourceKey: assetKey,
          responseId: exam.responseId,
        }, {
          method,
          rangeHeader: request.headers.get("range"),
        });
        return completeAudioAssetResponse(asset);
      }
    }
    const asset = getAsset(paperId, assetKey);
    if (!asset) throw new HttpError("Asset not found", 404);
    const range = parseByteRange(request.headers.get("range"), asset.data.byteLength);
    return assetResponse(request, asset, "private, max-age=300", range);
  }

  throw new HttpError("Endpoint not found", 404);
}

configureDemoAdmin("admin", await Bun.password.hash("admin"));
console.warn("A fresh installation signs in with admin / admin. Once a teacher account exists, its password persists across restarts and can be changed from dashboard Settings; teacher sessions are cleared at each launch.");
if (TEST_READING_SECONDS !== null) {
  console.warn(`DIGITALDP_TEST_READING_SECONDS=${TEST_READING_SECONDS} is active; exam reading time is temporarily overridden without changing saved papers.`);
}

const server = Bun.serve<SocketData>({
  hostname,
  port,
  maxRequestBodySize: 72_000_000,
  async fetch(request, activeServer) {
    const url = new URL(request.url);
    try {
      const remoteAddress = activeServer.requestIP(request)?.address;
      const localRequest = isLoopbackAddress(remoteAddress);
      if (!isExpectedRequestAuthority(url, port, remoteAddress, network.lanOrigin)) {
        throw new HttpError("Misdirected request", 421);
      }
      if (url.pathname === "/ws") {
        assertSameOrigin(request);
        const actor = authFromRequest(request);
        if (!actor) return json({ error: "Authentication required" }, 401);
        if (!localRequest && actor.role !== "student") {
          throw new HttpError("Teacher access is only available on this computer", 403);
        }
        const student = actor.role === "student" ? getStudent(actor.actorId) : null;
        const upgraded = activeServer.upgrade(request, {
          data: { role: actor.role, actorId: actor.actorId, classId: student?.classId ?? null },
        });
        return upgraded ? undefined : json({ error: "WebSocket upgrade failed" }, 400);
      }
      if (url.pathname.startsWith("/api/")) {
        if (!localRequest && !isLanStudentApiRequest(url.pathname, request.method)) {
          throw new HttpError("Teacher access is only available on this computer", 403);
        }
        return await handleApi(request, activeServer, url.pathname, localRequest);
      }
      if (url.pathname === "/") {
        // Loading the bare IP:port takes students straight to candidate sign-in.
        // Teachers use the /admin link instead.
        const response = new Response(null, {
          status: 302,
          headers: { Location: "/student", "Cache-Control": "no-cache" },
        });
        return responseWithSecurity(response);
      }
      if (!localRequest && !isStudentStaticPath(url.pathname)) {
        throw new HttpError("Teacher access is only available on this computer", 403);
      }
      const sourcePath = staticFilePath(url.pathname);
      if (!sourcePath || request.method !== "GET") throw new HttpError("Page not found", 404);
      if (url.pathname === "/mock-guides") requireRole(request, "admin");
      const filePath = staticAssetPath(sourcePath) ?? sourcePath;
      const file = Bun.file(filePath);
      if (!(await file.exists())) throw new HttpError("Page not found", 404);
      if (sourcePath === "USER_GUIDE.html" || sourcePath === "docs/mock-marking/index.html") {
        const html = await file.text();
        const response = responseWithSecurity(new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": url.pathname === "/mock-guides" ? "private, no-store" : "no-cache" },
        }));
        const styleSource = guideStylesheetSource(html);
        if (styleSource) response.headers.set("Content-Security-Policy",
          SECURITY_HEADERS["Content-Security-Policy"].replace("style-src 'self'", `style-src 'self' ${styleSource}`));
        return response;
      }
      const response = new Response(file);
      response.headers.set("Cache-Control", "no-cache");
      return responseWithSecurity(response);
    } catch (error) {
      const normalized = error instanceof HttpError ? error : databaseError(error instanceof Error ? error : new Error("Unexpected error"));
      if (normalized.status >= 400) {
        console.warn(`${request.method.toUpperCase()} ${url.pathname} -> ${normalized.status}`);
      }
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
console.log(`PacePaper is listening on http://${hostname}:${server.port}`);
console.log(`Teacher dashboard: http://localhost:${server.port}/admin`);
console.log(`Student sign-in: ${network.lanOrigin ?? `http://localhost:${server.port}`}/student`);
