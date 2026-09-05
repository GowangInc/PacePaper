import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type { ClassRosterInput } from "./class-rosters.ts";
import { initializeDatabaseSchema } from "./db-schema.ts";
import { AUDIO_PLAY_LIMIT, type ImportedPaper, type PaperManifest } from "./papers.ts";

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

export interface StudentRosterRow {
  id: string;
  name: string;
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
  archivedAt: number | null;
}

export interface StudentRow {
  id: string;
  classId: string;
  name: string;
  candidateCode: string;
  extraMinutes: number;
  lastSeenAt: number | null;
  createdAt: number;
  archivedAt: number | null;
}

export interface ClassRosterImportResult {
  classesCreated: number;
  classesUpdated: number;
  classesUnchanged: number;
  studentsCreated: number;
  studentsUpdated: number;
  studentsUnchanged: number;
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
  examSystemLabel?: string;
  questionCount: number;
  maximumMarks?: number;
  phaseCount: number;
  instructions: string;
  rulesSummary?: string;
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
  archivedAt: number | null;
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
  readingTimeMinutes: number;
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

export interface StudentExamSessionRow {
  id: string;
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
  submittedAt: number | null;
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
  notepad: string;
  updatedAt: number;
  submittedAt: number | null;
}

export interface SessionResults {
  id: string;
  paperId: string;
  className: string;
  paperTitle: string;
  status: ExamStatus;
  durationMinutes: number;
  readingTimeMinutes: number;
  manifestJson: string;
  responses: SessionResponseRow[];
}

export interface LifecycleResult {
  id: string;
  classId: string;
  archivedAt: number | null;
}

const databasePath = process.env.DIGITALDP_DB ?? "data/digitaldp.sqlite";
mkdirSync(dirname(databasePath), { recursive: true });
export const db = new Database(databasePath, { create: true, strict: true });
initializeDatabaseSchema(db);

// Keep the existing non-null column intact during the demo migration. It holds
// no credential for new roster entries, while preserving old data should PIN
// authentication be deliberately reintroduced later.
const DORMANT_PIN_HASH = "pin-not-required";

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
       AND classes.archived_at IS NULL
       AND students.archived_at IS NULL
  `).get({ classCode, candidateCode }) ?? null;
}

export function findStudentLoginById(classCode: string, studentId: string): StudentLoginRow | null {
  return db.query<StudentLoginRow, { classCode: string; studentId: string }>(`
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
       AND students.id = $studentId
       AND classes.archived_at IS NULL
       AND students.archived_at IS NULL
  `).get({ classCode, studentId }) ?? null;
}

export function listStudentRoster(classCode: string): StudentRosterRow[] {
  return db.query<StudentRosterRow, { classCode: string }>(`
    SELECT students.id, students.name
      FROM students
      JOIN classes ON classes.id = students.class_id
     WHERE classes.code = $classCode COLLATE NOCASE
       AND classes.archived_at IS NULL
       AND students.archived_at IS NULL
     ORDER BY students.name COLLATE NOCASE, students.name, students.id
  `).all({ classCode });
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
  const row = { id: crypto.randomUUID(), name, code: code.toUpperCase(), createdAt: Date.now(), archivedAt: null };
  db.query("INSERT INTO classes (id, name, code, created_at) VALUES ($id, $name, $code, $createdAt)").run(row);
  return row;
}

export function listClasses(archived = false): ClassRow[] {
  return db.query<ClassRow, { archived: number }>(`
    SELECT id, name, code, created_at AS createdAt, archived_at AS archivedAt
      FROM classes
     WHERE ($archived = 0 AND archived_at IS NULL)
        OR ($archived = 1 AND archived_at IS NOT NULL)
     ORDER BY name COLLATE NOCASE
  `).all({ archived: Number(archived) });
}

export function createStudent(input: {
  classId: string;
  name: string;
  candidateCode: string;
  pinHash?: string;
  extraMinutes: number;
}): StudentRow {
  const row = {
    id: crypto.randomUUID(),
    classId: input.classId,
    name: input.name,
    candidateCode: input.candidateCode.toUpperCase(),
    extraMinutes: input.extraMinutes,
    lastSeenAt: null,
    createdAt: Date.now(),
    archivedAt: null,
  };
  const created = db.query(`
    INSERT INTO students (id, class_id, name, candidate_code, pin_hash, extra_minutes, created_at)
    SELECT $id, $classId, $name, $candidateCode, $pinHash, $extraMinutes, $createdAt
      FROM classes
     WHERE id = $classId AND archived_at IS NULL
  `).run({ ...row, pinHash: input.pinHash ?? DORMANT_PIN_HASH });
  if (created.changes !== 1) throw new Error("Active class not found");
  return row;
}

export function listStudents(archived = false): StudentRow[] {
  return db.query<StudentRow, { archived: number }>(`
    SELECT students.id,
           students.class_id AS classId,
           students.name,
           students.candidate_code AS candidateCode,
           students.extra_minutes AS extraMinutes,
           students.last_seen_at AS lastSeenAt,
           students.created_at AS createdAt,
           students.archived_at AS archivedAt
      FROM students
      JOIN classes ON classes.id = students.class_id
     WHERE classes.archived_at IS NULL
       AND (($archived = 0 AND students.archived_at IS NULL)
         OR ($archived = 1 AND students.archived_at IS NOT NULL))
     ORDER BY students.name COLLATE NOCASE
  `).all({ archived: Number(archived) });
}

export const importClassRosters = db.transaction((rosters: ClassRosterInput[]): ClassRosterImportResult => {
  const result: ClassRosterImportResult = {
    classesCreated: 0,
    classesUpdated: 0,
    classesUnchanged: 0,
    studentsCreated: 0,
    studentsUpdated: 0,
    studentsUnchanged: 0,
  };

  for (const roster of rosters) {
    const existingClass = db.query<ClassRow, { code: string }>(`
      SELECT id, name, code, created_at AS createdAt, archived_at AS archivedAt
        FROM classes
       WHERE code = $code COLLATE NOCASE
    `).get({ code: roster.code });
    if (existingClass?.archivedAt !== null && existingClass?.archivedAt !== undefined) {
      throw new Error(`Class code ${roster.code} belongs to a removed class. Restore it before importing`);
    }

    let classId: string;
    if (!existingClass) {
      const created = createClass(roster.name, roster.code);
      classId = created.id;
      result.classesCreated += 1;
    } else {
      classId = existingClass.id;
      if (existingClass.name !== roster.name) {
        db.query("UPDATE classes SET name = $name WHERE id = $id").run({ id: classId, name: roster.name });
        result.classesUpdated += 1;
      } else {
        result.classesUnchanged += 1;
      }
    }

    for (const student of roster.students) {
      const existingStudent = db.query<{
        id: string;
        name: string;
        extraMinutes: number;
        archivedAt: number | null;
      }, { classId: string; candidateCode: string }>(`
        SELECT id, name, extra_minutes AS extraMinutes, archived_at AS archivedAt
          FROM students
         WHERE class_id = $classId AND candidate_code = $candidateCode COLLATE NOCASE
      `).get({ classId, candidateCode: student.candidateCode });
      if (existingStudent?.archivedAt !== null && existingStudent?.archivedAt !== undefined) {
        throw new Error(
          `Candidate code ${student.candidateCode} belongs to a removed student in class ${roster.code}. Restore that student before importing`,
        );
      }

      if (!existingStudent) {
        createStudent({ classId, ...student });
        result.studentsCreated += 1;
      } else if (existingStudent.name !== student.name || existingStudent.extraMinutes !== student.extraMinutes) {
        db.query(`
          UPDATE students
             SET name = $name, extra_minutes = $extraMinutes
           WHERE id = $id
        `).run({ id: existingStudent.id, name: student.name, extraMinutes: student.extraMinutes });
        result.studentsUpdated += 1;
      } else {
        result.studentsUnchanged += 1;
      }
    }
  }

  return result;
});

export function getStudent(studentId: string): StudentRow | null {
  return db.query<StudentRow, { studentId: string }>(`
    SELECT students.id,
           students.class_id AS classId,
           students.name,
           students.candidate_code AS candidateCode,
           students.extra_minutes AS extraMinutes,
           students.last_seen_at AS lastSeenAt,
           students.created_at AS createdAt,
           students.archived_at AS archivedAt
      FROM students
      JOIN classes ON classes.id = students.class_id
     WHERE students.id = $studentId
       AND students.archived_at IS NULL
       AND classes.archived_at IS NULL
  `).get({ studentId }) ?? null;
}

export function updateStudent(input: {
  id: string;
  classId: string;
  name: string;
  candidateCode: string;
  extraMinutes: number;
  pinHash?: string;
}): StudentRow | null {
  const result = db.query(`
    UPDATE students
       SET name = $name,
           candidate_code = $candidateCode,
           extra_minutes = $extraMinutes,
           pin_hash = COALESCE($pinHash, pin_hash)
     WHERE id = $id
       AND class_id = $classId
       AND archived_at IS NULL
       AND EXISTS (
         SELECT 1 FROM classes
          WHERE classes.id = students.class_id
            AND classes.archived_at IS NULL
       )
  `).run({
    id: input.id,
    classId: input.classId,
    name: input.name,
    candidateCode: input.candidateCode.toUpperCase(),
    extraMinutes: input.extraMinutes,
    pinHash: input.pinHash ?? null,
  });
  if (result.changes !== 1) return null;
  return getStudent(input.id);
}

export function touchStudent(studentId: string): void {
  db.query(`
    UPDATE students SET last_seen_at = $now
     WHERE id = $studentId
       AND archived_at IS NULL
       AND EXISTS (
         SELECT 1 FROM classes
          WHERE classes.id = students.class_id
            AND classes.archived_at IS NULL
       )
  `).run({ now: Date.now(), studentId });
}

function insertPaperAssets(paperId: string, assets: ImportedPaper["assets"]): void {
  for (const asset of assets) {
    db.query(`
      INSERT INTO paper_assets (id, paper_id, asset_key, filename, mime, data)
      VALUES ($id, $paperId, $assetKey, $filename, $mime, $data)
    `).run({
      id: crypto.randomUUID(),
      paperId,
      assetKey: asset.assetKey,
      filename: asset.filename,
      mime: asset.mime,
      data: asset.bytes,
    });
  }
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
    insertPaperAssets(id, imported.assets);
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
    examSystemLabel: imported.manifest.examFormat?.systemLabel,
    questionCount: imported.manifest.questions.length,
    maximumMarks: imported.manifest.maximumMarks,
    phaseCount: imported.manifest.phases?.length ?? 0,
    instructions: imported.manifest.instructions,
    rulesSummary: imported.manifest.examFormat?.rulesSummary,
    mode: imported.manifest.mode,
    sourceClassification: imported.manifest.sourceClassification,
    exportAuthorized: imported.manifest.exportAuthorized,
    createdAt: now,
  };
}

export function replaceUnusedPaper(paperId: string, imported: ImportedPaper): boolean {
  const manifestJson = JSON.stringify(imported.manifest);
  const replace = db.transaction(() => {
    const result = db.query(`
      UPDATE papers
         SET title = $title,
             subject = $subject,
             subject_label = $subjectLabel,
             level = $level,
             paper = $paper,
             duration_minutes = $durationMinutes,
             mode = $mode,
             manifest_json = $manifestJson
       WHERE id = $paperId
         AND NOT EXISTS (SELECT 1 FROM exam_sessions WHERE paper_id = $paperId)
    `).run({
      paperId,
      title: imported.manifest.title,
      subject: imported.manifest.subject,
      subjectLabel: imported.manifest.subjectLabel,
      level: imported.manifest.level,
      paper: imported.manifest.paper,
      durationMinutes: imported.manifest.durationMinutes,
      mode: imported.manifest.mode,
      manifestJson,
    });
    if (result.changes !== 1) return false;

    db.query("DELETE FROM paper_assets WHERE paper_id = $paperId").run({ paperId });
    insertPaperAssets(paperId, imported.assets);
    return true;
  });
  return replace();
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
           json_extract(manifest_json, '$.examFormat.systemLabel') AS examSystemLabel,
           json_array_length(manifest_json, '$.questions') AS questionCount,
           json_extract(manifest_json, '$.maximumMarks') AS maximumMarks,
           COALESCE(json_array_length(manifest_json, '$.phases'), 0) AS phaseCount,
           json_extract(manifest_json, '$.instructions') AS instructions,
           json_extract(manifest_json, '$.examFormat.rulesSummary') AS rulesSummary,
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
  const created = db.query(`
    INSERT INTO exam_sessions (id, class_id, paper_id, status, created_at)
    SELECT $id, $classId, $paperId, 'draft', $now
      FROM classes
     WHERE id = $classId AND archived_at IS NULL
  `).run({ id, classId, paperId, now: Date.now() });
  if (created.changes !== 1) throw new Error("Active class not found");
  return id;
}

export function updateDraftExamSessionTiming(sessionId: string, readingTimeMinutes: number, durationMinutes: number,
  expected?: { readingTimeMinutes: number; durationMinutes: number }): void {
  if (!Number.isFinite(readingTimeMinutes) || readingTimeMinutes < 0 || readingTimeMinutes > 60) {
    throw new Error("Reading time must be between 0 and 60 minutes");
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 360) {
    throw new Error("Writing time must be a whole number between 1 and 360 minutes");
  }
  const update = db.transaction(() => {
  if (expected) {
    const current = listExamSessions().find(({ id }) => id === sessionId);
    if (!current || current.readingTimeMinutes !== expected.readingTimeMinutes || current.durationMinutes !== expected.durationMinutes) {
      throw new Error("Exam timing changed in another window. Reload exam defaults and review before saving");
    }
  }
  const changed = db.query(`
    UPDATE exam_sessions
       SET reading_time_minutes_override = $readingTimeMinutes,
           duration_minutes_override = $durationMinutes
     WHERE id = $sessionId
       AND status = 'draft'
       AND archived_at IS NULL
  `).run({ sessionId, readingTimeMinutes, durationMinutes });
  if (changed.changes !== 1) throw new Error("Only a ready exam can have its timing changed");
  });
  update();
}

export function startExamSession(sessionId: string): void {
  const start = db.transaction(() => {
    const session = db.query<{ classId: string; status: ExamStatus }, { sessionId: string }>(`
      SELECT sessions.class_id AS classId, sessions.status
        FROM exam_sessions AS sessions
        JOIN classes ON classes.id = sessions.class_id
       WHERE sessions.id = $sessionId
         AND sessions.archived_at IS NULL
         AND classes.archived_at IS NULL
    `).get({ sessionId });
    if (!session) throw new Error("Active exam session not found");
    if (session.status !== "draft") throw new Error("Only a draft session can be started");
    const now = Date.now();
    db.query("UPDATE exam_sessions SET status = 'live', started_at = $now WHERE id = $sessionId")
      .run({ now, sessionId });
    const students = db.query<{ id: string }, { classId: string }>(
      "SELECT id FROM students WHERE class_id = $classId AND archived_at IS NULL",
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

export function listExamSessions(archived = false): ExamSessionRow[] {
  const onlineCutoff = Date.now() - 20_000;
  return db.query<ExamSessionRow, { onlineCutoff: number; archived: number }>(`
    SELECT sessions.id,
           sessions.class_id AS classId,
           classes.name AS className,
           sessions.paper_id AS paperId,
           papers.title AS paperTitle,
           papers.subject_label AS subjectLabel,
           papers.level,
           papers.paper,
           COALESCE(sessions.duration_minutes_override, papers.duration_minutes) AS durationMinutes,
           COALESCE(sessions.reading_time_minutes_override, json_extract(papers.manifest_json, '$.readingTimeMinutes'), 0) AS readingTimeMinutes,
           sessions.status,
           sessions.started_at AS startedAt,
           sessions.ended_at AS endedAt,
           sessions.created_at AS createdAt,
           sessions.archived_at AS archivedAt,
           COUNT(responses.id) AS candidateCount,
           COALESCE(SUM(CASE WHEN responses.submitted_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS submittedCount,
           COALESCE(SUM(CASE WHEN students.archived_at IS NULL AND students.last_seen_at >= $onlineCutoff
                             THEN 1 ELSE 0 END), 0) AS activeCount
      FROM exam_sessions AS sessions
      JOIN classes ON classes.id = sessions.class_id
      JOIN papers ON papers.id = sessions.paper_id
      LEFT JOIN responses ON responses.session_id = sessions.id
      LEFT JOIN students ON students.id = responses.student_id
     WHERE classes.archived_at IS NULL
       AND (($archived = 0 AND sessions.archived_at IS NULL)
         OR ($archived = 1 AND sessions.archived_at IS NOT NULL))
     GROUP BY sessions.id
     ORDER BY sessions.created_at DESC
     LIMIT 30
  `).all({ onlineCutoff, archived: Number(archived) });
}

type LifecycleTable = "classes" | "students" | "exam_sessions";
const lifecycleSelect: Record<LifecycleTable, string> = {
  classes: "SELECT id, id AS classId, archived_at AS archivedAt FROM classes WHERE id = $id",
  students: "SELECT id, class_id AS classId, archived_at AS archivedAt FROM students WHERE id = $id",
  exam_sessions: "SELECT id, class_id AS classId, archived_at AS archivedAt FROM exam_sessions WHERE id = $id",
};

function lifecycleRow(table: LifecycleTable, id: string, label: string): LifecycleResult {
  const row = db.query<LifecycleResult, { id: string }>(lifecycleSelect[table]!).get({ id });
  if (!row) throw new Error(`${label} not found`);
  return row;
}

function setArchivedAt(table: LifecycleTable, id: string, archivedAt: number | null): void {
  db.query(`UPDATE ${table} SET archived_at = $archivedAt WHERE id = $id`).run({ id, archivedAt });
}

function requireActiveClass(classId: string, child: "student" | "exam session"): void {
  const active = db.query("SELECT 1 FROM classes WHERE id = $classId AND archived_at IS NULL").get({ classId });
  if (!active) throw new Error(`Restore the class first before restoring this ${child}`);
}

export const archiveStudent = db.transaction((studentId: string): LifecycleResult => {
  const row = lifecycleRow("students", studentId, "Student");
  if (row.archivedAt === null) {
    const conflict = db.query(`
      SELECT 1 FROM responses
      JOIN exam_sessions ON exam_sessions.id = responses.session_id
      JOIN classes ON classes.id = exam_sessions.class_id
      WHERE responses.student_id = $studentId AND responses.submitted_at IS NULL
        AND exam_sessions.status = 'live' AND exam_sessions.archived_at IS NULL AND classes.archived_at IS NULL
    `).get({ studentId });
    if (conflict) throw new Error("Cannot remove this student while they have unfinished work in a live exam");
    row.archivedAt = Date.now();
    setArchivedAt("students", studentId, row.archivedAt);
  }
  db.query("DELETE FROM auth_sessions WHERE role = 'student' AND actor_id = $studentId").run({ studentId });
  return row;
});

export const restoreStudent = db.transaction((studentId: string): LifecycleResult => {
  const row = lifecycleRow("students", studentId, "Student");
  requireActiveClass(row.classId, "student");
  if (row.archivedAt !== null) setArchivedAt("students", studentId, null);
  return { ...row, archivedAt: null };
});

export const archiveClass = db.transaction((classId: string): LifecycleResult => {
  const row = lifecycleRow("classes", classId, "Class");
  if (row.archivedAt === null) {
    const live = db.query("SELECT 1 FROM exam_sessions WHERE class_id = $classId AND status = 'live' AND archived_at IS NULL")
      .get({ classId });
    if (live) throw new Error("Cannot remove this class while it has a live exam. End the exam first");
    row.archivedAt = Date.now();
    setArchivedAt("classes", classId, row.archivedAt);
  }
  db.query(`DELETE FROM auth_sessions WHERE role = 'student' AND actor_id IN
    (SELECT id FROM students WHERE class_id = $classId)`).run({ classId });
  return row;
});

export const restoreClass = db.transaction((classId: string): LifecycleResult => {
  const row = lifecycleRow("classes", classId, "Class");
  if (row.archivedAt !== null) setArchivedAt("classes", classId, null);
  return { ...row, archivedAt: null };
});

export const archiveExamSession = db.transaction((sessionId: string): LifecycleResult => {
  const row = lifecycleRow("exam_sessions", sessionId, "Exam session");
  if (row.archivedAt === null) {
    const live = db.query("SELECT 1 FROM exam_sessions WHERE id = $sessionId AND status = 'live'").get({ sessionId });
    if (live) throw new Error("Cannot remove a live exam. End it first");
    row.archivedAt = Date.now();
    setArchivedAt("exam_sessions", sessionId, row.archivedAt);
  }
  return row;
});

export const restoreExamSession = db.transaction((sessionId: string): LifecycleResult => {
  const row = lifecycleRow("exam_sessions", sessionId, "Exam session");
  requireActiveClass(row.classId, "exam session");
  if (row.archivedAt !== null) setArchivedAt("exam_sessions", sessionId, null);
  return { ...row, archivedAt: null };
});

export function getSessionResults(sessionId: string): SessionResults | null {
  const session = db.query<Omit<SessionResults, "responses">, { sessionId: string }>(`
    SELECT sessions.id,
           papers.id AS paperId,
           classes.name AS className,
           papers.title AS paperTitle,
           sessions.status,
           COALESCE(sessions.duration_minutes_override, papers.duration_minutes) AS durationMinutes,
           COALESCE(sessions.reading_time_minutes_override, json_extract(papers.manifest_json, '$.readingTimeMinutes'), 0) AS readingTimeMinutes,
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
           responses.notepad AS notepad,
           responses.updated_at AS updatedAt,
           responses.submitted_at AS submittedAt
      FROM responses
      JOIN students ON students.id = responses.student_id
     WHERE responses.session_id = $sessionId
     ORDER BY students.name COLLATE NOCASE
  `).all({ sessionId });
  return { ...session, responses };
}

export function listStudentExamSessions(studentId: string): StudentExamSessionRow[] {
  return db.query<StudentExamSessionRow, { studentId: string }>(`
    SELECT sessions.id,
           papers.id AS paperId,
           papers.title AS paperTitle,
           papers.subject_label AS subjectLabel,
           papers.level,
           papers.paper,
           COALESCE(sessions.duration_minutes_override, papers.duration_minutes) AS durationMinutes,
           COALESCE(sessions.reading_time_minutes_override, json_extract(papers.manifest_json, '$.readingTimeMinutes'), 0) AS readingTimeMinutes,
           sessions.status,
           sessions.started_at AS startedAt,
           sessions.ended_at AS endedAt,
           sessions.created_at AS createdAt,
           responses.submitted_at AS submittedAt
      FROM students
      JOIN exam_sessions AS sessions ON sessions.class_id = students.class_id
      JOIN classes ON classes.id = students.class_id
      JOIN papers ON papers.id = sessions.paper_id
      LEFT JOIN responses
        ON responses.session_id = sessions.id
       AND responses.student_id = students.id
     WHERE students.id = $studentId
       AND students.archived_at IS NULL
       AND classes.archived_at IS NULL
       AND sessions.archived_at IS NULL
       AND (sessions.status = 'draft' OR responses.id IS NOT NULL)
     ORDER BY CASE sessions.status WHEN 'live' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,
              sessions.created_at DESC,
              sessions.id
     LIMIT 30
  `).all({ studentId });
}

export function getStudentExam(studentId: string, sessionId: string): StudentExamRow | null {
  return db.query<StudentExamRow, { studentId: string; sessionId: string }>(`
    SELECT sessions.id AS sessionId,
           sessions.status AS sessionStatus,
           sessions.class_id AS classId,
           papers.id AS paperId,
           papers.title AS paperTitle,
           COALESCE(sessions.duration_minutes_override, papers.duration_minutes) AS durationMinutes,
           COALESCE(sessions.reading_time_minutes_override, json_extract(papers.manifest_json, '$.readingTimeMinutes'), 0) AS readingTimeMinutes,
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
      JOIN classes ON classes.id = students.class_id
     WHERE responses.student_id = $studentId
       AND sessions.id = $sessionId
       AND students.archived_at IS NULL
       AND classes.archived_at IS NULL
       AND sessions.archived_at IS NULL
  `).get({ studentId, sessionId }) ?? null;
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

export function incrementAudioPlay(responseId: string, resourceKey: string): number {
  const increment = db.transaction(() => {
    const row = db.query<{ audioPlaysJson: string; submittedAt: number | null }, { responseId: string }>(`
      SELECT audio_plays_json AS audioPlaysJson, submitted_at AS submittedAt
        FROM responses WHERE id = $responseId
    `).get({ responseId });
    if (!row || row.submittedAt !== null) throw new Error("Response is not available");
    const plays = JSON.parse(row.audioPlaysJson) as Record<string, number>;
    const next = (plays[resourceKey] ?? 0) + 1;
    if (next > AUDIO_PLAY_LIMIT) throw new Error("No audio plays remain");
    plays[resourceKey] = next;
    db.query("UPDATE responses SET audio_plays_json = $audioPlaysJson, updated_at = $now WHERE id = $responseId")
      .run({ audioPlaysJson: JSON.stringify(plays), now: Date.now(), responseId });
    return next;
  });
  return increment();
}

export function getAudioPlayCount(responseId: string, resourceKey: string): number {
  const row = db.query<{ audioPlaysJson: string; submittedAt: number | null }, { responseId: string }>(`
    SELECT audio_plays_json AS audioPlaysJson, submitted_at AS submittedAt
      FROM responses WHERE id = $responseId
  `).get({ responseId });
  if (!row || row.submittedAt !== null) throw new Error("Response is not available");
  const value = (JSON.parse(row.audioPlaysJson) as Record<string, unknown>)[resourceKey];
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}
