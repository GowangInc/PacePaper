import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type { ImportedPaper, PaperManifest } from "./papers.ts";

export type Role = "admin" | "student";
export type ExamStatus = "draft" | "live" | "ended";

export interface AdminRow {
  id: string;
  username: string;
  passwordHash: string;
}

export interface StudentLoginRow {
  id: string;
  classId: string;
  className: string;
  name: string;
  candidateCode: string;
  pinHash: string;
  extraMinutes: number;
}

export interface AuthRow {
  role: Role;
  actorId: string;
  expiresAt: number;
}

export interface ClassRow {
  id: string;
  name: string;
  code: string;
  createdAt: number;
}

export interface StudentRow {
  id: string;
  classId: string;
  name: string;
  candidateCode: string;
  extraMinutes: number;
  lastSeenAt: number | null;
  createdAt: number;
}

export interface PaperRow {
  id: string;
  title: string;
  subject: string;
  subjectLabel: string;
  level: string;
  paper: string;
  durationMinutes: number;
  mode: string;
  manifestJson: string;
  createdAt: number;
}

export interface PaperSummary {
  id: string;
  title: string;
  subject: string;
  subjectLabel: string;
  level: string;
  paper: string;
  durationMinutes: number;
  readingTimeMinutes: number;
  mode: string;
  sourceClassification: PaperManifest["sourceClassification"];
  exportAuthorized: boolean;
  createdAt: number;
}

export interface AssetRow {
  filename: string;
  mime: string;
  data: Uint8Array;
}

export interface PaperAssetRow extends AssetRow {
  assetKey: string;
}

export interface ExamSessionRow {
  id: string;
  classId: string;
  className: string;
  paperId: string;
  paperTitle: string;
  subjectLabel: string;
  level: string;
  paper: string;
  durationMinutes: number;
  readingTimeMinutes: number;
  status: ExamStatus;
  startedAt: number | null;
  endedAt: number | null;
  createdAt: number;
  candidateCount: number;
  submittedCount: number;
  activeCount: number;
}

export interface StudentExamRow {
  sessionId: string;
  sessionStatus: ExamStatus;
  classId: string;
  paperId: string;
  paperTitle: string;
  durationMinutes: number;
  manifestJson: string;
  startedAt: number;
  endedAt: number | null;
  responseId: string;
  answersJson: string;
  flagsJson: string;
  audioPlaysJson: string;
  selectedQuestionId: string | null;
  notepad: string;
  updatedAt: number;
  submittedAt: number | null;
  extraMinutes: number;
}

export interface ResponsePayload {
  answersJson: string;
  flagsJson: string;
  selectedQuestionId: string | null;
  notepad: string;
}

export interface SessionResponseRow {
  responseId: string;
  studentName: string;
  candidateCode: string;
  answersJson: string;
  selectedQuestionId: string | null;
  updatedAt: number;
  submittedAt: number | null;
}

export interface SessionResults {
  id: string;
  paperId: string;
  className: string;
  paperTitle: string;
  status: ExamStatus;
  manifestJson: string;
  responses: SessionResponseRow[];
}

const databasePath = process.env.DIGITALDP_DB ?? "data/digitaldp.sqlite";
mkdirSync(dirname(databasePath), { recursive: true });
export const db = new Database(databasePath, { create: true, strict: true });
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");
db.run("PRAGMA busy_timeout = 5000;");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    candidate_code TEXT NOT NULL COLLATE NOCASE,
    pin_hash TEXT NOT NULL,
    extra_minutes INTEGER NOT NULL DEFAULT 0,
    last_seen_at INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(class_id, candidate_code)
  );

  CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_label TEXT NOT NULL,
    level TEXT NOT NULL,
    paper TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    mode TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS paper_assets (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    asset_key TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    data BLOB NOT NULL,
    UNIQUE(paper_id, asset_key)
  );

  CREATE TABLE IF NOT EXISTS exam_sessions (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'live', 'ended')),
    started_at INTEGER,
    ended_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS one_live_session_per_class
    ON exam_sessions(class_id) WHERE status = 'live';

  CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    answers_json TEXT NOT NULL DEFAULT '{}',
    selected_question_id TEXT,
    flags_json TEXT NOT NULL DEFAULT '[]',
    audio_plays_json TEXT NOT NULL DEFAULT '{}',
    notepad TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL,
    submitted_at INTEGER,
    UNIQUE(session_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
    actor_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
  CREATE INDEX IF NOT EXISTS students_class ON students(class_id);
  CREATE INDEX IF NOT EXISTS responses_session ON responses(session_id);
`);

export function setupRequired(): boolean {
  const row = db.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM admins").get();
  return !row || row.count === 0;
}

export function createAdmin(username: string, passwordHash: string): AdminRow {
  const id = crypto.randomUUID();
  db.query("INSERT INTO admins (id, username, password_hash, created_at) VALUES ($id, $username, $passwordHash, $now)")
    .run({ id, username, passwordHash, now: Date.now() });
  return { id, username, passwordHash };
}

export function configureDemoAdmin(username: string, passwordHash: string): AdminRow {
  const existing = db.query<AdminRow, []>(`
    SELECT id, username, password_hash AS passwordHash
      FROM admins
     ORDER BY created_at, id
     LIMIT 1
  `).get();
  if (!existing) {
    db.query("DELETE FROM auth_sessions WHERE role = 'admin'").run();
    return createAdmin(username, passwordHash);
  }

  db.transaction(() => {
    db.query("DELETE FROM auth_sessions WHERE role = 'admin'").run();
    db.query("DELETE FROM admins WHERE id <> $id").run({ id: existing.id });
    db.query("UPDATE admins SET username = $username, password_hash = $passwordHash WHERE id = $id")
      .run({ id: existing.id, username, passwordHash });
  })();
  return { id: existing.id, username, passwordHash };
}

export function findAdmin(username: string): AdminRow | null {
  return db.query<AdminRow, { username: string }>(
    "SELECT id, username, password_hash AS passwordHash FROM admins WHERE username = $username COLLATE NOCASE",
  ).get({ username }) ?? null;
}

export function findStudentLogin(classCode: string, candidateCode: string): StudentLoginRow | null {
  return db.query<StudentLoginRow, { classCode: string; candidateCode: string }>(`
    SELECT students.id,
           students.class_id AS classId,
           classes.name AS className,
           students.name,
           students.candidate_code AS candidateCode,
           students.pin_hash AS pinHash,
           students.extra_minutes AS extraMinutes
      FROM students
      JOIN classes ON classes.id = students.class_id
     WHERE classes.code = $classCode COLLATE NOCASE
       AND students.candidate_code = $candidateCode COLLATE NOCASE
  `).get({ classCode, candidateCode }) ?? null;
}

export function createAuthSession(tokenHash: string, role: Role, actorId: string, expiresAt: number): void {
  const now = Date.now();
  db.query(`
    INSERT INTO auth_sessions (token_hash, role, actor_id, expires_at, created_at)
    VALUES ($tokenHash, $role, $actorId, $expiresAt, $now)
  `).run({ tokenHash, role, actorId, expiresAt, now });
}

export function findAuthSession(tokenHash: string): AuthRow | null {
  return db.query<AuthRow, { tokenHash: string; now: number }>(`
    SELECT role, actor_id AS actorId, expires_at AS expiresAt
      FROM auth_sessions
     WHERE token_hash = $tokenHash AND expires_at > $now
  `).get({ tokenHash, now: Date.now() }) ?? null;
}

export function deleteAuthSession(tokenHash: string): void {
  db.query("DELETE FROM auth_sessions WHERE token_hash = $tokenHash").run({ tokenHash });
}

export function deleteExpiredAuthSessions(): void {
  db.query("DELETE FROM auth_sessions WHERE expires_at <= $now").run({ now: Date.now() });
}

export function createClass(name: string, code: string): ClassRow {
  const row = { id: crypto.randomUUID(), name, code: code.toUpperCase(), createdAt: Date.now() };
  db.query("INSERT INTO classes (id, name, code, created_at) VALUES ($id, $name, $code, $createdAt)").run(row);
  return row;
}

export function listClasses(): ClassRow[] {
  return db.query<ClassRow, []>(`
    SELECT id, name, code, created_at AS createdAt FROM classes ORDER BY name COLLATE NOCASE
  `).all();
}

export function createStudent(input: {
  classId: string;
  name: string;
  candidateCode: string;
  pinHash: string;
  extraMinutes: number;
}): StudentRow {
  const row = {
    id: crypto.randomUUID(),
    classId: input.classId,
    name: input.name,
    candidateCode: input.candidateCode.toUpperCase(),
    pinHash: input.pinHash,
    extraMinutes: input.extraMinutes,
    lastSeenAt: null,
    createdAt: Date.now(),
  };
  db.query(`
    INSERT INTO students (id, class_id, name, candidate_code, pin_hash, extra_minutes, created_at)
    VALUES ($id, $classId, $name, $candidateCode, $pinHash, $extraMinutes, $createdAt)
  `).run(row);
  return row;
}

export function listStudents(): StudentRow[] {
  return db.query<StudentRow, []>(`
    SELECT id,
           class_id AS classId,
           name,
           candidate_code AS candidateCode,
           extra_minutes AS extraMinutes,
           last_seen_at AS lastSeenAt,
           created_at AS createdAt
      FROM students
     ORDER BY name COLLATE NOCASE
  `).all();
}

export function getStudent(studentId: string): StudentRow | null {
  return db.query<StudentRow, { studentId: string }>(`
    SELECT id,
           class_id AS classId,
           name,
           candidate_code AS candidateCode,
           extra_minutes AS extraMinutes,
           last_seen_at AS lastSeenAt,
           created_at AS createdAt
      FROM students WHERE id = $studentId
  `).get({ studentId }) ?? null;
}

export function touchStudent(studentId: string): void {
  db.query("UPDATE students SET last_seen_at = $now WHERE id = $studentId").run({ now: Date.now(), studentId });
}

export function createPaper(imported: ImportedPaper): PaperSummary {
  const id = crypto.randomUUID();
  const now = Date.now();
  const manifestJson = JSON.stringify(imported.manifest);
  const insert = db.transaction(() => {
    db.query(`
      INSERT INTO papers (id, title, subject, subject_label, level, paper, duration_minutes, mode, manifest_json, created_at)
      VALUES ($id, $title, $subject, $subjectLabel, $level, $paper, $durationMinutes, $mode, $manifestJson, $createdAt)
    `).run({
      id,
      title: imported.manifest.title,
      subject: imported.manifest.subject,
      subjectLabel: imported.manifest.subjectLabel,
      level: imported.manifest.level,
      paper: imported.manifest.paper,
      durationMinutes: imported.manifest.durationMinutes,
      mode: imported.manifest.mode,
      manifestJson,
      createdAt: now,
    });
    for (const asset of imported.assets) {
      db.query(`
        INSERT INTO paper_assets (id, paper_id, asset_key, filename, mime, data)
        VALUES ($id, $paperId, $assetKey, $filename, $mime, $data)
      `).run({
        id: crypto.randomUUID(),
        paperId: id,
        assetKey: asset.assetKey,
        filename: asset.filename,
        mime: asset.mime,
        data: asset.bytes,
      });
    }
  });
  insert();
  return {
    id,
    title: imported.manifest.title,
    subject: imported.manifest.subject,
    subjectLabel: imported.manifest.subjectLabel,
    level: imported.manifest.level,
    paper: imported.manifest.paper,
    durationMinutes: imported.manifest.durationMinutes,
    readingTimeMinutes: imported.manifest.readingTimeMinutes,
    mode: imported.manifest.mode,
    sourceClassification: imported.manifest.sourceClassification,
    exportAuthorized: imported.manifest.exportAuthorized,
    createdAt: now,
  };
}

export function listPapers(): PaperSummary[] {
  const rows = db.query<PaperSummary, []>(`
    SELECT id,
           title,
           subject,
           subject_label AS subjectLabel,
           level,
           paper,
           duration_minutes AS durationMinutes,
           COALESCE(json_extract(manifest_json, '$.readingTimeMinutes'), 0) AS readingTimeMinutes,
           mode,
           COALESCE(json_extract(manifest_json, '$.sourceClassification'), 'unknown-local-only') AS sourceClassification,
           COALESCE(json_extract(manifest_json, '$.exportAuthorized'), 0) AS exportAuthorized,
           created_at AS createdAt
      FROM papers
     ORDER BY created_at DESC
  `).all();
  return rows.map((row) => ({ ...row, exportAuthorized: Boolean(row.exportAuthorized) }));
}

export function getPaper(paperId: string): { row: PaperRow; manifest: PaperManifest } | null {
  const row = db.query<PaperRow, { paperId: string }>(`
    SELECT id,
           title,
           subject,
           subject_label AS subjectLabel,
           level,
           paper,
           duration_minutes AS durationMinutes,
           mode,
           manifest_json AS manifestJson,
           created_at AS createdAt
      FROM papers WHERE id = $paperId
  `).get({ paperId });
  return row ? { row, manifest: JSON.parse(row.manifestJson) as PaperManifest } : null;
}

export function getAsset(paperId: string, assetKey: string): AssetRow | null {
  return db.query<AssetRow, { paperId: string; assetKey: string }>(`
    SELECT filename, mime, data FROM paper_assets WHERE paper_id = $paperId AND asset_key = $assetKey
  `).get({ paperId, assetKey }) ?? null;
}

export function listPaperAssets(paperId: string): PaperAssetRow[] {
  return db.query<PaperAssetRow, { paperId: string }>(`
    SELECT asset_key AS assetKey, filename, mime, data
      FROM paper_assets
     WHERE paper_id = $paperId
     ORDER BY asset_key
  `).all({ paperId });
}

export function createExamSession(classId: string, paperId: string): string {
  const id = crypto.randomUUID();
  db.query(`
    INSERT INTO exam_sessions (id, class_id, paper_id, status, created_at)
    VALUES ($id, $classId, $paperId, 'draft', $now)
  `).run({ id, classId, paperId, now: Date.now() });
  return id;
}

export function startExamSession(sessionId: string): void {
  const start = db.transaction(() => {
    const session = db.query<{ classId: string; status: ExamStatus }, { sessionId: string }>(`
      SELECT class_id AS classId, status FROM exam_sessions WHERE id = $sessionId
    `).get({ sessionId });
    if (!session) throw new Error("Exam session not found");
    if (session.status !== "draft") throw new Error("Only a draft session can be started");
    const now = Date.now();
    db.query("UPDATE exam_sessions SET status = 'live', started_at = $now WHERE id = $sessionId")
      .run({ now, sessionId });
    const students = db.query<{ id: string }, { classId: string }>(
      "SELECT id FROM students WHERE class_id = $classId",
    ).all({ classId: session.classId });
    for (const student of students) {
      db.query(`
        INSERT INTO responses (id, session_id, student_id, updated_at)
        VALUES ($id, $sessionId, $studentId, $now)
      `).run({ id: crypto.randomUUID(), sessionId, studentId: student.id, now });
    }
  });
  start();
}

export function endExamSession(sessionId: string): void {
  const end = db.transaction(() => {
    const now = Date.now();
    const changed = db.query(`
      UPDATE exam_sessions SET status = 'ended', ended_at = $now
       WHERE id = $sessionId AND status = 'live'
    `).run({ now, sessionId });
    if (changed.changes !== 1) throw new Error("Live exam session not found");
    db.query(`
      UPDATE responses SET submitted_at = COALESCE(submitted_at, $now), updated_at = $now
       WHERE session_id = $sessionId
    `).run({ now, sessionId });
  });
  end();
}

export function listExamSessions(): ExamSessionRow[] {
  const onlineCutoff = Date.now() - 20_000;
  return db.query<ExamSessionRow, { onlineCutoff: number }>(`
    SELECT sessions.id,
           sessions.class_id AS classId,
           classes.name AS className,
           sessions.paper_id AS paperId,
           papers.title AS paperTitle,
           papers.subject_label AS subjectLabel,
           papers.level,
           papers.paper,
           papers.duration_minutes AS durationMinutes,
           COALESCE(json_extract(papers.manifest_json, '$.readingTimeMinutes'), 0) AS readingTimeMinutes,
           sessions.status,
           sessions.started_at AS startedAt,
           sessions.ended_at AS endedAt,
           sessions.created_at AS createdAt,
           COUNT(responses.id) AS candidateCount,
           COALESCE(SUM(CASE WHEN responses.submitted_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS submittedCount,
           COALESCE(SUM(CASE WHEN students.last_seen_at >= $onlineCutoff THEN 1 ELSE 0 END), 0) AS activeCount
      FROM exam_sessions AS sessions
      JOIN classes ON classes.id = sessions.class_id
      JOIN papers ON papers.id = sessions.paper_id
      LEFT JOIN responses ON responses.session_id = sessions.id
      LEFT JOIN students ON students.id = responses.student_id
     GROUP BY sessions.id
     ORDER BY sessions.created_at DESC
     LIMIT 30
  `).all({ onlineCutoff });
}

export function getSessionResults(sessionId: string): SessionResults | null {
  const session = db.query<Omit<SessionResults, "responses">, { sessionId: string }>(`
    SELECT sessions.id,
           papers.id AS paperId,
           classes.name AS className,
           papers.title AS paperTitle,
           sessions.status,
           papers.manifest_json AS manifestJson
      FROM exam_sessions AS sessions
      JOIN classes ON classes.id = sessions.class_id
      JOIN papers ON papers.id = sessions.paper_id
     WHERE sessions.id = $sessionId
  `).get({ sessionId });
  if (!session) return null;
  const responses = db.query<SessionResponseRow, { sessionId: string }>(`
    SELECT responses.id AS responseId,
           students.name AS studentName,
           students.candidate_code AS candidateCode,
           responses.answers_json AS answersJson,
           responses.selected_question_id AS selectedQuestionId,
           responses.updated_at AS updatedAt,
           responses.submitted_at AS submittedAt
      FROM responses
      JOIN students ON students.id = responses.student_id
     WHERE responses.session_id = $sessionId
     ORDER BY students.name COLLATE NOCASE
  `).all({ sessionId });
  return { ...session, responses };
}

export function getStudentExam(studentId: string): StudentExamRow | null {
  return db.query<StudentExamRow, { studentId: string; endedCutoff: number }>(`
    SELECT sessions.id AS sessionId,
           sessions.status AS sessionStatus,
           sessions.class_id AS classId,
           papers.id AS paperId,
           papers.title AS paperTitle,
           papers.duration_minutes AS durationMinutes,
           papers.manifest_json AS manifestJson,
           sessions.started_at AS startedAt,
           sessions.ended_at AS endedAt,
           responses.id AS responseId,
           responses.answers_json AS answersJson,
           responses.selected_question_id AS selectedQuestionId,
           responses.flags_json AS flagsJson,
           responses.audio_plays_json AS audioPlaysJson,
           responses.notepad,
           responses.updated_at AS updatedAt,
           responses.submitted_at AS submittedAt,
           students.extra_minutes AS extraMinutes
      FROM responses
      JOIN exam_sessions AS sessions ON sessions.id = responses.session_id
      JOIN papers ON papers.id = sessions.paper_id
      JOIN students ON students.id = responses.student_id
     WHERE responses.student_id = $studentId
       AND (sessions.status = 'live' OR (sessions.status = 'ended' AND sessions.ended_at >= $endedCutoff))
     ORDER BY CASE sessions.status WHEN 'live' THEN 0 ELSE 1 END, sessions.started_at DESC
     LIMIT 1
  `).get({ studentId, endedCutoff: Date.now() - 12 * 60 * 60 * 1000 }) ?? null;
}

export function saveResponse(responseId: string, payload: ResponsePayload): void {
  const changed = db.query(`
    UPDATE responses
       SET answers_json = $answersJson,
           selected_question_id = $selectedQuestionId,
           flags_json = $flagsJson,
           notepad = $notepad,
           updated_at = $now
     WHERE id = $responseId AND submitted_at IS NULL
  `).run({ ...payload, now: Date.now(), responseId });
  if (changed.changes !== 1) throw new Error("Response is already submitted");
}
export function saveAndSubmitResponse(responseId: string, payload: ResponsePayload): number {
  const now = Date.now();
  const changed = db.query(`
    UPDATE responses
       SET answers_json = $answersJson,
           selected_question_id = $selectedQuestionId,
           flags_json = $flagsJson,
           notepad = $notepad,
           submitted_at = $now,
           updated_at = $now
     WHERE id = $responseId AND submitted_at IS NULL
  `).run({ ...payload, now, responseId });
  if (changed.changes !== 1) throw new Error("Response is already submitted");
  return now;
}


export function submitResponse(responseId: string): void {
  const now = Date.now();
  const changed = db.query(`
    UPDATE responses SET submitted_at = $now, updated_at = $now
     WHERE id = $responseId AND submitted_at IS NULL
  `).run({ now, responseId });
  if (changed.changes !== 1) throw new Error("Response is already submitted");
}

export function incrementAudioPlay(responseId: string, resourceKey: string, maxPlays: number): number {
  const increment = db.transaction(() => {
    const row = db.query<{ audioPlaysJson: string; submittedAt: number | null }, { responseId: string }>(`
      SELECT audio_plays_json AS audioPlaysJson, submitted_at AS submittedAt
        FROM responses WHERE id = $responseId
    `).get({ responseId });
    if (!row || row.submittedAt !== null) throw new Error("Response is not available");
    const plays = JSON.parse(row.audioPlaysJson) as Record<string, number>;
    const next = (plays[resourceKey] ?? 0) + 1;
    if (next > maxPlays) throw new Error("No audio plays remain");
    plays[resourceKey] = next;
    db.query("UPDATE responses SET audio_plays_json = $audioPlaysJson, updated_at = $now WHERE id = $responseId")
      .run({ audioPlaysJson: JSON.stringify(plays), now: Date.now(), responseId });
    return next;
  });
  return increment();
}
