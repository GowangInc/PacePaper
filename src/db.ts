import { existsSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { Database } from "bun:sqlite";
import { identityKey, type ClassRosterInput } from "./class-rosters.ts";
import { DATABASE_SCHEMA_VERSION, initializeDatabaseSchema, type DatabaseSchema } from "./db-schema.ts";
import {
  createVerifiedSnapshot,
  databaseRecoveryDiagnostics,
  runDatabaseCheck,
  type DatabaseCheckResult,
  type DatabaseRecoveryOperation,
} from "./database-recovery.ts";
import { AUDIO_PLAY_LIMIT, type ImportedPaper, type PaperManifest } from "./papers.ts";
import {
  issueCandidateCredentials,
  normalizeCandidateToken,
  type StoredCandidateCredentials,
} from "./candidate-credentials.ts";
import {
  nextResponseRevision,
  sessionEndReadiness,
  type CandidateEndState,
  type CandidateResponseState,
  type SessionEndReadiness,
} from "./response-concurrency.ts";

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
  extraMinutes: number;
}


export interface AuthRow {
  role: Role;
  actorId: string;
  scopeId: string | null;
  expiresAt: number;
}

export interface ClassRow {
  id: string;
  name: string;
  createdAt: number;
  archivedAt: number | null;
}

export interface StudentRow {
  id: string;
  classId: string;
  name: string;
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
  archivedAt: number | null;
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
  sessionCount: number;
  liveSessionCount: number;
  archivedAt: number | null;
}

export interface PaperImportConflict {
  id: string;
  title: string;
  createdAt: number;
  sourceClassification: PaperManifest["sourceClassification"];
  exportAuthorized: boolean;
  sessionCount: number;
  replaceable: boolean;
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
  endingAt: number | null;
  requireCandidatePin: boolean;
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
  endingAt: number | null;
  requireCandidatePin: boolean;
  responseId: string;
  answersJson: string;
  flagsJson: string;
  audioPlaysJson: string;
  annotationsJson: string;
  selectedQuestionId: string | null;
  notepad: string;
  updatedAt: number;
  submittedAt: number | null;
  extraMinutes: number;
  revision: number;
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
  requireCandidatePin: boolean;
}

export interface ResponsePayload {
  answersJson: string;
  flagsJson: string;
  selectedQuestionId: string | null;
  annotationsJson: string;
  notepad: string;
  expectedRevision?: number;
  clientId?: string;
}

export interface SessionResponseRow {
  responseId: string;
  studentName: string;
  answersJson: string;
  selectedQuestionId: string | null;
  annotationsJson: string;
  notepad: string;
  revision: number;
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
const existingDatabase = databasePath !== ":memory:"
  && existsSync(databasePath)
  && statSync(databasePath).size > 0;
mkdirSync(dirname(databasePath), { recursive: true });
export const db = new Database(databasePath, { create: true, strict: true });
let recoveryOperation: DatabaseRecoveryOperation = "check";
let recoveryCheck: DatabaseCheckResult | undefined;
let databaseSchema: DatabaseSchema;
try {
  if (existingDatabase) {
    recoveryCheck = runDatabaseCheck(db, "quick");
    if (!recoveryCheck.ok) throw new Error("Database quick check failed");
    const hasMigrationLedger = Boolean(db.query<{ found: number }, []>(
      "SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
    ).get());
    const currentVersion = hasMigrationLedger
      ? db.query<{ version: number }, []>("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations").get()?.version ?? 0
      : 0;
    if (currentVersion < DATABASE_SCHEMA_VERSION) {
      recoveryOperation = "snapshot-create";
      const snapshotPath = join(
        dirname(databasePath),
        "backups",
        `${basename(databasePath)}.pre-v${DATABASE_SCHEMA_VERSION}-${Date.now()}.sqlite`,
      );
      createVerifiedSnapshot(db, snapshotPath);
    }
  }
  databaseSchema = initializeDatabaseSchema(db);
} catch (error) {
  const diagnostic = databaseRecoveryDiagnostics({
    operation: recoveryOperation,
    databasePath,
    check: recoveryCheck,
    error,
  });
  throw new Error(`Database recovery preflight failed: ${JSON.stringify(diagnostic)}`);
}

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

export function configureDemoAdmin(defaultUsername: string, defaultPasswordHash: string): AdminRow {
  const existing = db.query<AdminRow, []>(`
    SELECT id, username, password_hash AS passwordHash
      FROM admins
     ORDER BY created_at, id
     LIMIT 1
  `).get();
  if (!existing) {
    db.query("DELETE FROM auth_sessions WHERE role = 'admin'").run();
    return createAdmin(defaultUsername, defaultPasswordHash);
  }

  // A fresh database gets the default demo login. Once a teacher account
  // exists, its username and password persist across restarts (the teacher
  // changes the password from dashboard Settings); stale sessions are
  // cleared and any accidental extra admin rows are removed.
  db.transaction(() => {
    db.query("DELETE FROM auth_sessions WHERE role = 'admin'").run();
    db.query("DELETE FROM admins WHERE id <> $id").run({ id: existing.id });
  })();
  return existing;
}

export function findAdminById(id: string): AdminRow | null {
  return db.query<AdminRow, { id: string }>(
    "SELECT id, username, password_hash AS passwordHash FROM admins WHERE id = $id",
  ).get({ id }) ?? null;
}

export function updateAdminPasswordHash(id: string, passwordHash: string): void {
  db.query("UPDATE admins SET password_hash = $passwordHash WHERE id = $id").run({ id, passwordHash });
}

export function findAdmin(username: string): AdminRow | null {
  return db.query<AdminRow, { username: string }>(
    "SELECT id, username, password_hash AS passwordHash FROM admins WHERE username = $username COLLATE NOCASE",
  ).get({ username }) ?? null;
}

export function findStudentLogin(className: string, studentName: string): StudentLoginRow | null {
  return db.query<StudentLoginRow, { classKey: string; studentKey: string }>(`
    SELECT students.id,
           students.class_id AS classId,
           classes.name AS className,
           students.name,
           students.extra_minutes AS extraMinutes
      FROM students
      JOIN classes ON classes.id = students.class_id
     WHERE classes.name_key = $classKey
       AND students.name_key = $studentKey
       AND classes.archived_at IS NULL
       AND students.archived_at IS NULL
  `).get({ classKey: identityKey(className), studentKey: identityKey(studentName) }) ?? null;
}
export interface CandidateCredentialRow extends StudentLoginRow {
  sessionId: string;
  sessionStatus: ExamStatus;
  pinHash: string;
  tokenHash: string;
  issuedAt: number;
  revokedAt: number | null;
}

export function candidateTokenLookup(token: string): string {
  return createHash("sha256").update(normalizeCandidateToken(token)).digest("hex");
}

export function findCandidateCredentialOptions(className: string, studentName: string): CandidateCredentialRow[] {
  return db.query<CandidateCredentialRow, { classKey: string; studentKey: string }>(`
    SELECT students.id,
           students.class_id AS classId,
           classes.name AS className,
           students.name,
           students.extra_minutes AS extraMinutes,
           sessions.id AS sessionId,
           sessions.status AS sessionStatus,
           credentials.pin_hash AS pinHash,
           credentials.token_hash AS tokenHash,
           credentials.issued_at AS issuedAt,
           credentials.revoked_at AS revokedAt
      FROM candidate_credentials AS credentials
      JOIN students ON students.id = credentials.student_id
      JOIN classes ON classes.id = students.class_id
      JOIN exam_sessions AS sessions ON sessions.id = credentials.session_id
     WHERE classes.name_key = $classKey
       AND students.name_key = $studentKey
       AND classes.archived_at IS NULL
       AND students.archived_at IS NULL
       AND sessions.archived_at IS NULL
       AND sessions.status IN ('draft', 'live')
     ORDER BY sessions.created_at DESC
  `).all({ classKey: identityKey(className), studentKey: identityKey(studentName) });
}

export function findCandidateCredentialByToken(token: string): CandidateCredentialRow | null {
  return db.query<CandidateCredentialRow, { tokenLookup: string }>(`
    SELECT students.id,
           students.class_id AS classId,
           classes.name AS className,
           students.name,
           students.extra_minutes AS extraMinutes,
           sessions.id AS sessionId,
           sessions.status AS sessionStatus,
           credentials.pin_hash AS pinHash,
           credentials.token_hash AS tokenHash,
           credentials.issued_at AS issuedAt,
           credentials.revoked_at AS revokedAt
      FROM candidate_credentials AS credentials
      JOIN students ON students.id = credentials.student_id
      JOIN classes ON classes.id = students.class_id
      JOIN exam_sessions AS sessions ON sessions.id = credentials.session_id
     WHERE credentials.token_lookup = $tokenLookup
       AND classes.archived_at IS NULL
       AND students.archived_at IS NULL
       AND sessions.archived_at IS NULL
       AND sessions.status IN ('draft', 'live')
  `).get({ tokenLookup: candidateTokenLookup(token) }) ?? null;
}

export function storedCandidateCredentials(row: CandidateCredentialRow): StoredCandidateCredentials {
  return row.revokedAt === null
    ? { state: "active", pinHash: row.pinHash, tokenHash: row.tokenHash }
    : { state: "revoked", pinHash: row.pinHash, tokenHash: row.tokenHash, revokedAt: row.revokedAt };
}

export function revokeCandidateCredential(sessionId: string, studentId: string): boolean {
  const now = Date.now();
  const revoke = db.transaction(() => {
    const changed = db.query(`
      UPDATE candidate_credentials
         SET revoked_at = COALESCE(revoked_at, $now)
       WHERE session_id = $sessionId AND student_id = $studentId
    `).run({ now, sessionId, studentId });
    db.query(`
      DELETE FROM auth_sessions
       WHERE role = 'student' AND actor_id = $studentId AND scope_id = $sessionId
    `).run({ sessionId, studentId });
    return changed.changes === 1;
  });
  return revoke();
}

export function restoreCandidateCredential(sessionId: string, studentId: string): boolean {
  const changed = db.query(`
    UPDATE candidate_credentials SET revoked_at = NULL
     WHERE session_id = $sessionId AND student_id = $studentId
  `).run({ sessionId, studentId });
  return changed.changes === 1;
}

export function listCandidateCredentials(sessionId: string): Array<{
  studentId: string;
  studentName: string;
  revokedAt: number | null;
}> {
  return db.query<{
    studentId: string;
    studentName: string;
    revokedAt: number | null;
  }, { sessionId: string }>(`
    SELECT credentials.student_id AS studentId,
           students.name AS studentName,
           credentials.revoked_at AS revokedAt
      FROM candidate_credentials AS credentials
      JOIN students ON students.id = credentials.student_id
     WHERE credentials.session_id = $sessionId
     ORDER BY students.name COLLATE NOCASE
  `).all({ sessionId });
}

export interface IssuedCandidateCredential {
  studentId: string;
  studentName: string;
  pin: string;
  token: string;
}


export function createAuthSession(
  tokenHash: string,
  role: Role,
  actorId: string,
  expiresAt: number,
  scopeId: string | null = null,
): void {
  const now = Date.now();
  db.query(`
    INSERT INTO auth_sessions (token_hash, role, actor_id, scope_id, expires_at, created_at)
    VALUES ($tokenHash, $role, $actorId, $scopeId, $expiresAt, $now)
  `).run({ tokenHash, role, actorId, scopeId, expiresAt, now });
}

export function createCandidateAuthSession(
  tokenHash: string,
  candidate: Pick<CandidateCredentialRow, "id" | "sessionId" | "pinHash" | "tokenHash" | "issuedAt">,
  expiresAt: number,
  scopeId: string,
): boolean {
  const now = Date.now();
  const created = db.query(`
    INSERT INTO auth_sessions (token_hash, role, actor_id, scope_id, expires_at, created_at)
    SELECT $tokenHash, 'student', $studentId, $scopeId, $expiresAt, $now
      FROM candidate_credentials
     WHERE session_id = $sessionId
       AND student_id = $studentId
       AND pin_hash = $pinHash
       AND token_hash = $candidateTokenHash
       AND issued_at = $issuedAt
       AND revoked_at IS NULL
  `).run({
    tokenHash,
    studentId: candidate.id,
    scopeId,
    expiresAt,
    now,
    sessionId: candidate.sessionId,
    pinHash: candidate.pinHash,
    candidateTokenHash: candidate.tokenHash,
    issuedAt: candidate.issuedAt,
  });
  return created.changes === 1;
}

export function findAuthSession(tokenHash: string): AuthRow | null {
  return db.query<AuthRow, { tokenHash: string; now: number }>(`
    SELECT role, actor_id AS actorId, scope_id AS scopeId, expires_at AS expiresAt
      FROM auth_sessions
     WHERE token_hash = $tokenHash AND expires_at > $now
  `).get({ tokenHash, now: Date.now() }) ?? null;
}

export function deleteAuthSession(tokenHash: string): void {
  db.query("DELETE FROM auth_sessions WHERE token_hash = $tokenHash").run({ tokenHash });
}

export function deleteAdminSessions(): void {
  db.query("DELETE FROM auth_sessions WHERE role = 'admin'").run();
}
export function deleteStudentSessions(studentId: string): void {
  db.query("DELETE FROM auth_sessions WHERE role = 'student' AND actor_id = $studentId").run({ studentId });
}

export function deleteExpiredAuthSessions(): void {
  db.query("DELETE FROM auth_sessions WHERE expires_at <= $now").run({ now: Date.now() });
}

export function createClass(name: string): ClassRow {
  const nameKey = identityKey(name);
  if (!nameKey) throw new Error("Class name is invalid");
  const row = { id: crypto.randomUUID(), name, createdAt: Date.now(), archivedAt: null };
  if (databaseSchema.legacyClassCode) {
    db.query("INSERT INTO classes (id, name, name_key, code, created_at) VALUES ($id, $name, $nameKey, $legacyCode, $createdAt)")
      .run({ ...row, nameKey, legacyCode: row.id });
  } else {
    db.query("INSERT INTO classes (id, name, name_key, created_at) VALUES ($id, $name, $nameKey, $createdAt)")
      .run({ ...row, nameKey });
  }
  return row;
}

export function listClasses(archived = false): ClassRow[] {
  return db.query<ClassRow, { archived: number }>(`
    SELECT id, name, created_at AS createdAt, archived_at AS archivedAt
      FROM classes
     WHERE ($archived = 0 AND archived_at IS NULL)
        OR ($archived = 1 AND archived_at IS NOT NULL)
     ORDER BY name COLLATE NOCASE
  `).all({ archived: Number(archived) });
}

export function createStudent(input: {
  classId: string;
  name: string;
  extraMinutes: number;
}): StudentRow {
  const nameKey = identityKey(input.name);
  if (!nameKey) throw new Error("Student name is invalid");
  const row = {
    id: crypto.randomUUID(),
    classId: input.classId,
    name: input.name,
    extraMinutes: input.extraMinutes,
    lastSeenAt: null,
    createdAt: Date.now(),
    archivedAt: null,
  };
  const columns = ["id", "class_id", "name", "name_key", "extra_minutes", "created_at"];
  const parameters = ["$id", "$classId", "$name", "$nameKey", "$extraMinutes", "$createdAt"];
  if (databaseSchema.legacyStudentCandidateCode) {
    columns.push("candidate_code");
    parameters.push("$legacyCandidateCode");
  }
  if (databaseSchema.legacyStudentPinHash) {
    columns.push("pin_hash");
    parameters.push("$legacyPinHash");
  }
  const created = db.query(`
    INSERT INTO students (${columns.join(", ")})
    SELECT ${parameters.join(", ")}
      FROM classes
     WHERE id = $classId AND archived_at IS NULL
  `).run({
    ...row,
    nameKey,
    legacyCandidateCode: row.id,
    legacyPinHash: "legacy-name-login",
  });
  if (created.changes !== 1) throw new Error("Active class not found");
  return row;
}

export function listStudents(archived = false): StudentRow[] {
  return db.query<StudentRow, { archived: number }>(`
    SELECT students.id,
           students.class_id AS classId,
           students.name,
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
    const nameKey = identityKey(roster.name);
    const existingClass = db.query<ClassRow, { nameKey: string }>(`
      SELECT id, name, created_at AS createdAt, archived_at AS archivedAt
        FROM classes
       WHERE name_key = $nameKey AND archived_at IS NULL
    `).get({ nameKey });
    const removedClass = !existingClass && db.query(
      "SELECT 1 FROM classes WHERE name_key = $nameKey AND archived_at IS NOT NULL",
    ).get({ nameKey });
    if (removedClass) {
      throw new Error(`Class ${roster.name} belongs to a removed class. Restore it before importing`);
    }

    let classId: string;
    if (!existingClass) {
      classId = createClass(roster.name).id;
      result.classesCreated += 1;
    } else {
      classId = existingClass.id;
      if (existingClass.name !== roster.name) {
        db.query("UPDATE classes SET name = $name, name_key = $nameKey WHERE id = $id")
          .run({ id: classId, name: roster.name, nameKey });
        result.classesUpdated += 1;
      } else {
        result.classesUnchanged += 1;
      }
    }

    for (const student of roster.students) {
      const studentNameKey = identityKey(student.name);
      const existingStudent = db.query<{
        id: string;
        name: string;
        extraMinutes: number;
      }, { classId: string; nameKey: string }>(`
        SELECT id, name, extra_minutes AS extraMinutes
          FROM students
         WHERE class_id = $classId AND name_key = $nameKey AND archived_at IS NULL
      `).get({ classId, nameKey: studentNameKey });
      const removedStudent = !existingStudent && db.query(`
        SELECT 1 FROM students
         WHERE class_id = $classId AND name_key = $nameKey AND archived_at IS NOT NULL
      `).get({ classId, nameKey: studentNameKey });
      if (removedStudent) {
        throw new Error(`Student ${student.name} belongs to a removed class member. Restore them before importing`);
      }

      if (!existingStudent) {
        createStudent({ classId, name: student.name, extraMinutes: student.extraMinutes });
        result.studentsCreated += 1;
      } else if (existingStudent.name !== student.name || existingStudent.extraMinutes !== student.extraMinutes) {
        db.query(`
          UPDATE students
             SET name = $name,
                 name_key = $nameKey,
                 extra_minutes = $extraMinutes
           WHERE id = $id
        `).run({
          id: existingStudent.id,
          name: student.name,
          nameKey: studentNameKey,
          extraMinutes: student.extraMinutes,
        });
        if (existingStudent.name !== student.name) deleteStudentSessions(existingStudent.id);
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
  extraMinutes: number;
}): StudentRow | null {
  const existing = getStudent(input.id);
  if (!existing || existing.classId !== input.classId) return null;
  const nameKey = identityKey(input.name);
  if (!nameKey) throw new Error("Student name is invalid");
  const result = db.query(`
    UPDATE students
       SET name = $name,
           name_key = $nameKey,
           extra_minutes = $extraMinutes
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
    nameKey,
    extraMinutes: input.extraMinutes,
  });
  if (result.changes !== 1) return null;
  if (existing.name !== input.name) deleteStudentSessions(input.id);
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
    sessionCount: 0,
    liveSessionCount: 0,
    archivedAt: null,
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
         AND archived_at IS NULL
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

export function listPapers(archived = false): PaperSummary[] {
  const rows = db.query<PaperSummary, { archived: number }>(`
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
           (SELECT COUNT(*) FROM exam_sessions WHERE paper_id = papers.id) AS sessionCount,
           (SELECT COUNT(*) FROM exam_sessions
             WHERE paper_id = papers.id AND status = 'live' AND archived_at IS NULL) AS liveSessionCount,
           created_at AS createdAt,
           archived_at AS archivedAt
      FROM papers
     WHERE ($archived = 0 AND archived_at IS NULL)
        OR ($archived = 1 AND archived_at IS NOT NULL)
     ORDER BY created_at DESC
  `).all({ archived: Number(archived) });
  return rows.map((row) => ({ ...row, exportAuthorized: Boolean(row.exportAuthorized) }));
}

export function findPaperImportConflicts(manifest: PaperManifest): PaperImportConflict[] {
  const rows = db.query<Omit<PaperImportConflict, "exportAuthorized" | "replaceable"> & { exportAuthorized: number }, {
    title: string;
    subject: string;
    level: string;
    paper: string;
    assessmentSession: string;
  }>(`
    SELECT id,
           title,
           created_at AS createdAt,
           COALESCE(json_extract(manifest_json, '$.sourceClassification'), 'unknown-local-only') AS sourceClassification,
           COALESCE(json_extract(manifest_json, '$.exportAuthorized'), 0) AS exportAuthorized,
           (SELECT COUNT(*) FROM exam_sessions WHERE paper_id = papers.id) AS sessionCount
      FROM papers
     WHERE archived_at IS NULL
       AND title = $title COLLATE NOCASE
       AND subject = $subject
       AND level = $level COLLATE NOCASE
       AND paper = $paper COLLATE NOCASE
       AND COALESCE(json_extract(manifest_json, '$.assessmentSession'), '') = $assessmentSession
     ORDER BY created_at DESC
  `).all({
    title: manifest.title,
    subject: manifest.subject,
    level: manifest.level,
    paper: manifest.paper,
    assessmentSession: manifest.assessmentSession ?? "",
  });
  return rows.map((row) => ({
    ...row,
    exportAuthorized: Boolean(row.exportAuthorized),
    replaceable: row.sessionCount === 0,
  }));
}

export type PaperImportResult =
  | { status: "created"; paper: PaperSummary }
  | { status: "replaced"; conflict: PaperImportConflict }
  | { status: "conflict"; conflicts: PaperImportConflict[] };

export const importPaperAtomic = db.transaction((
  imported: ImportedPaper,
  replacePaperId: string | null = null,
): PaperImportResult => {
  const conflicts = findPaperImportConflicts(imported.manifest);
  if (!replacePaperId) {
    return conflicts.length > 0
      ? { status: "conflict", conflicts }
      : { status: "created", paper: createPaper(imported) };
  }
  const conflict = conflicts.find(({ id }) => id === replacePaperId);
  if (!conflict || !conflict.replaceable || !replaceUnusedPaper(replacePaperId, imported)) {
    return { status: "conflict", conflicts };
  }
  return { status: "replaced", conflict };
});

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
           created_at AS createdAt,
           archived_at AS archivedAt
      FROM papers WHERE id = $paperId
  `).get({ paperId });
  return row ? { row, manifest: JSON.parse(row.manifestJson) as PaperManifest } : null;
}

export interface PaperLifecycleResult {
  id: string;
  archivedAt: number | null;
}

function paperLifecycleRow(paperId: string): PaperLifecycleResult {
  const row = db.query<PaperLifecycleResult, { paperId: string }>(
    "SELECT id, archived_at AS archivedAt FROM papers WHERE id = $paperId",
  ).get({ paperId });
  if (!row) throw new Error("Paper not found");
  return row;
}

export const archivePaper = db.transaction((paperId: string): PaperLifecycleResult => {
  const row = paperLifecycleRow(paperId);
  if (row.archivedAt !== null) return row;
  const live = db.query(`
    SELECT 1 FROM exam_sessions
     WHERE paper_id = $paperId AND status = 'live' AND archived_at IS NULL
  `).get({ paperId });
  if (live) throw new Error("Cannot remove a paper used by a live exam. End the exam first");
  row.archivedAt = Date.now();
  db.query("UPDATE papers SET archived_at = $archivedAt WHERE id = $paperId")
    .run({ paperId, archivedAt: row.archivedAt });
  return row;
});

export const restorePaper = db.transaction((paperId: string): PaperLifecycleResult => {
  const row = paperLifecycleRow(paperId);
  if (row.archivedAt === null) return row;
  const stored = getPaper(paperId);
  if (!stored) throw new Error("Paper not found");
  if (findPaperImportConflicts(stored.manifest).some((conflict) => conflict.id !== paperId)) {
    throw new Error("Cannot restore this paper while an active paper has the same identity");
  }
  db.query("UPDATE papers SET archived_at = NULL WHERE id = $paperId").run({ paperId });
  return { ...row, archivedAt: null };
});

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

export function createExamSession(classId: string, paperId: string, requireCandidatePin = false): string {
  const id = crypto.randomUUID();
  const created = db.query(`
    INSERT INTO exam_sessions (id, class_id, paper_id, status, require_candidate_pin, created_at)
    SELECT $id, classes.id, papers.id, 'draft', $requireCandidatePin, $now
      FROM classes
      JOIN papers ON papers.id = $paperId AND papers.archived_at IS NULL
     WHERE classes.id = $classId AND classes.archived_at IS NULL
  `).run({ id, classId, paperId, requireCandidatePin: Number(requireCandidatePin), now: Date.now() });
  if (created.changes !== 1) {
    const activeClass = db.query("SELECT 1 FROM classes WHERE id = $classId AND archived_at IS NULL").get({ classId });
    throw new Error(activeClass ? "Active paper not found" : "Active class not found");
  }
  return id;
}
export async function createExamSessionWithCredentials(
  classId: string,
  paperId: string,
): Promise<{ id: string; credentials: IssuedCandidateCredential[] }> {
  const students = db.query<{ id: string; name: string }, { classId: string }>(`
    SELECT id, name
      FROM students
     WHERE class_id = $classId AND archived_at IS NULL
     ORDER BY name COLLATE NOCASE
  `).all({ classId });
  const issued = await Promise.all(students.map(async (student) => ({
    student,
    issuance: await issueCandidateCredentials(),
  })));
  const create = db.transaction(() => {
    const id = createExamSession(classId, paperId, true);
    const issuedAt = Date.now();
    for (const { student, issuance } of issued) {
      db.query(`
        INSERT INTO candidate_credentials (
          session_id, student_id, pin_hash, token_hash, token_lookup, issued_at
        ) VALUES (
          $sessionId, $studentId, $pinHash, $tokenHash, $tokenLookup, $issuedAt
        )
      `).run({
        sessionId: id,
        studentId: student.id,
        pinHash: issuance.stored.pinHash,
        tokenHash: issuance.stored.tokenHash,
        tokenLookup: candidateTokenLookup(issuance.oneTime.token),
        issuedAt,
      });
    }
    return {
      id,
      credentials: issued.map(({ student, issuance }) => ({
        studentId: student.id,
        studentName: student.name,
        pin: issuance.oneTime.pin,
        token: issuance.oneTime.token,
      })),
    };
  });
  return create();
}

export async function rotateCandidateCredential(
  sessionId: string,
  studentId: string,
): Promise<IssuedCandidateCredential | null> {
  const student = db.query<{ name: string }, { sessionId: string; studentId: string }>(`
    SELECT students.name
      FROM candidate_credentials AS credentials
      JOIN students ON students.id = credentials.student_id
      JOIN exam_sessions AS sessions ON sessions.id = credentials.session_id
     WHERE credentials.session_id = $sessionId
       AND credentials.student_id = $studentId
       AND sessions.status IN ('draft', 'live')
  `).get({ sessionId, studentId });
  if (!student) return null;
  const issuance = await issueCandidateCredentials();
  const rotate = db.transaction(() => {
    const changed = db.query(`
      UPDATE candidate_credentials
         SET pin_hash = $pinHash,
             token_hash = $tokenHash,
             token_lookup = $tokenLookup,
             issued_at = $issuedAt,
             revoked_at = NULL
       WHERE session_id = $sessionId AND student_id = $studentId
    `).run({
      sessionId,
      studentId,
      pinHash: issuance.stored.pinHash,
      tokenHash: issuance.stored.tokenHash,
      tokenLookup: candidateTokenLookup(issuance.oneTime.token),
      issuedAt: Date.now(),
    });
    if (changed.changes !== 1) return null;
    db.query(`
      DELETE FROM auth_sessions
       WHERE role = 'student' AND actor_id = $studentId AND scope_id = $sessionId
    `).run({ sessionId, studentId });
    return {
      studentId,
      studentName: student.name,
      pin: issuance.oneTime.pin,
      token: issuance.oneTime.token,
    };
  });
  return rotate();
}

export function candidateCredentialRequired(studentId: string): boolean {
  return Boolean(db.query<{ required: number }, { studentId: string }>(`
    SELECT 1 AS required
      FROM students
      JOIN exam_sessions AS sessions ON sessions.class_id = students.class_id
     WHERE students.id = $studentId
       AND sessions.status IN ('draft', 'live')
       AND sessions.archived_at IS NULL
       AND sessions.require_candidate_pin = 1
     LIMIT 1
  `).get({ studentId }));
}

export async function resetCandidateCredentials(
  sessionId: string,
): Promise<IssuedCandidateCredential[] | null> {
  const students = db.query<{ id: string; name: string }, { sessionId: string }>(`
    SELECT students.id, students.name
      FROM exam_sessions AS sessions
      JOIN students ON students.class_id = sessions.class_id AND students.archived_at IS NULL
     WHERE sessions.id = $sessionId
       AND sessions.status IN ('draft', 'live')
       AND sessions.archived_at IS NULL
       AND sessions.require_candidate_pin = 1
     ORDER BY students.name COLLATE NOCASE
  `).all({ sessionId });
  if (students.length === 0) {
    const active = db.query<{ found: number }, { sessionId: string }>(`
      SELECT 1 AS found FROM exam_sessions
       WHERE id = $sessionId
         AND status IN ('draft', 'live')
         AND archived_at IS NULL
         AND require_candidate_pin = 1
    `).get({ sessionId });
    if (!active) return null;
  }
  const issued = await Promise.all(students.map(async (student) => ({
    student,
    issuance: await issueCandidateCredentials(),
  })));
  return db.transaction(() => {
    const stillActive = db.query<{ found: number }, { sessionId: string }>(`
      SELECT 1 AS found FROM exam_sessions
       WHERE id = $sessionId
         AND status IN ('draft', 'live')
         AND archived_at IS NULL
         AND require_candidate_pin = 1
    `).get({ sessionId });
    if (!stillActive) return null;
    const issuedAt = Date.now();
    db.query("DELETE FROM candidate_credentials WHERE session_id = $sessionId").run({ sessionId });
    for (const { student, issuance } of issued) {
      db.query(`
        INSERT INTO candidate_credentials (
          session_id, student_id, pin_hash, token_hash, token_lookup, issued_at, revoked_at
        ) VALUES (
          $sessionId, $studentId, $pinHash, $tokenHash, $tokenLookup, $issuedAt, NULL
        )
      `).run({
        sessionId,
        studentId: student.id,
        pinHash: issuance.stored.pinHash,
        tokenHash: issuance.stored.tokenHash,
        tokenLookup: candidateTokenLookup(issuance.oneTime.token),
        issuedAt,
      });
    }
    db.query("DELETE FROM auth_sessions WHERE role = 'student' AND scope_id = $sessionId").run({ sessionId });
    return issued.map(({ student, issuance }) => ({
      studentId: student.id,
      studentName: student.name,
      pin: issuance.oneTime.pin,
      token: issuance.oneTime.token,
    }));
  })();
}

export function updateExamSessionTiming(sessionId: string, readingTimeMinutes: number, durationMinutes: number,
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
       AND status IN ('draft', 'live')
       AND archived_at IS NULL
  `).run({ sessionId, readingTimeMinutes, durationMinutes });
  if (changed.changes !== 1) throw new Error("Only a ready or running exam can have its timing changed");
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

export type ExamEndPreview = SessionEndReadiness;

export class ExamEndBlockedError extends Error {
  readonly status = 409;
  readonly code = "exam_end_blocked";

  constructor(readonly preview: ExamEndPreview) {
    super("Some candidate devices have not confirmed their latest response.");
  }
}

function candidateEndStates(sessionId: string): CandidateEndState[] {
  return db.query<CandidateEndState, { sessionId: string }>(`
    WITH latest_clients AS (
      SELECT response_id,
             state,
             end_snapshot,
             ROW_NUMBER() OVER (
               PARTITION BY response_id
               ORDER BY updated_at DESC, revision DESC, client_id DESC
             ) AS rank
        FROM response_clients
    )
    SELECT responses.id,
           students.name,
           CASE
             WHEN responses.submitted_at IS NOT NULL THEN 'submitted'
             WHEN sessions.ending_at IS NULL AND latest.state IN ('saved', 'submitted') THEN 'saved'
             WHEN latest.state IN ('saved', 'submitted') AND latest.end_snapshot IS NOT NULL THEN 'saved'
             ELSE 'pending'
           END AS state
      FROM responses
      JOIN exam_sessions AS sessions ON sessions.id = responses.session_id
      JOIN students ON students.id = responses.student_id
      LEFT JOIN latest_clients AS latest
        ON latest.response_id = responses.id AND latest.rank = 1
     WHERE responses.session_id = $sessionId
     ORDER BY students.name COLLATE NOCASE
  `).all({ sessionId });
}

export const beginExamEnd = db.transaction((sessionId: string): ExamEndPreview => {
  const session = db.query<{ endingAt: number | null }, { sessionId: string }>(`
    SELECT ending_at AS endingAt FROM exam_sessions
     WHERE id = $sessionId AND status = 'live'
  `).get({ sessionId });
  if (!session) throw new Error("Live exam session not found");
  if (session.endingAt === null) {
    const now = Date.now();
    db.query("UPDATE exam_sessions SET ending_at = $now WHERE id = $sessionId").run({ now, sessionId });
    db.query(`
      UPDATE response_clients
         SET state = CASE WHEN state = 'submitted' THEN state ELSE 'pending' END,
             end_snapshot = $now,
             updated_at = $now
       WHERE response_id IN (SELECT id FROM responses WHERE session_id = $sessionId)
    `).run({ now, sessionId });
  }
  return sessionEndReadiness(candidateEndStates(sessionId));
});
export const cancelExamEnd = db.transaction((sessionId: string): void => {
  const now = Date.now();
  db.query(`
    UPDATE response_clients
       SET state = 'saved', end_snapshot = NULL, updated_at = $now
     WHERE state = 'pending'
       AND response_id IN (SELECT id FROM responses WHERE session_id = $sessionId)
       AND revision = (SELECT responses.revision FROM responses WHERE responses.id = response_clients.response_id)
  `).run({ now, sessionId });
  db.query(`
    UPDATE exam_sessions SET ending_at = NULL
     WHERE id = $sessionId AND status = 'live'
  `).run({ sessionId });
});

export function getExamEndReadiness(sessionId: string): ExamEndPreview {
  return sessionEndReadiness(candidateEndStates(sessionId));
}
export function finalizeExamSession(
  sessionId: string,
  actorId: string,
  overrideReason?: string,
): void {
  const end = db.transaction(() => {
    const readiness = sessionEndReadiness(candidateEndStates(sessionId), overrideReason);
    if (!readiness.canFinalize) throw new ExamEndBlockedError(readiness);
    const now = Date.now();
    const changed = db.query(`
      UPDATE exam_sessions SET status = 'ended', ended_at = $now, ending_at = NULL
       WHERE id = $sessionId AND status = 'live' AND ending_at IS NOT NULL
    `).run({ now, sessionId });
    if (changed.changes !== 1) throw new Error("Live exam session not found");
    db.query(`
      UPDATE responses SET submitted_at = COALESCE(submitted_at, $now), updated_at = $now
       WHERE session_id = $sessionId
    `).run({ now, sessionId });
    db.query(`
      INSERT INTO audit_events (id, actor_id, action, target_id, reason, at)
      VALUES ($id, $actorId, 'exam_end', $sessionId, $reason, $now)
    `).run({
      id: crypto.randomUUID(),
      actorId,
      sessionId,
      reason: readiness.overrideReason,
      now,
    });
  });
  end();
}

export function endExamSession(sessionId: string): void {
  beginExamEnd(sessionId);
  finalizeExamSession(sessionId, "system", "Direct database finalization");
}

export type StudentFocusEventRow = {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  kind: "focus_lost" | "focus_gained";
  at: number;
};

export function recordStudentFocusEvent(sessionId: string, studentId: string, kind: "focus_lost" | "focus_gained"): void {
  // Only a live session produces meaningful integrity events.
  const live = db.query<{ status: ExamStatus }, { sessionId: string }>(
    "SELECT status FROM exam_sessions WHERE id = $sessionId",
  ).get({ sessionId });
  if (live?.status !== "live") return;
  db.query(`
    INSERT INTO student_focus_events (id, session_id, student_id, kind, at)
    VALUES ($id, $sessionId, $studentId, $kind, $at)
  `).run({ id: crypto.randomUUID(), sessionId, studentId, kind, at: Date.now() });
}

export function listStudentFocusEvents(sessionId: string): StudentFocusEventRow[] {
  return db.query<StudentFocusEventRow, { sessionId: string }>(`
    SELECT events.id, events.session_id AS sessionId, events.student_id AS studentId,
           students.name AS studentName, events.kind, events.at
      FROM student_focus_events AS events
      JOIN students ON students.id = events.student_id
     WHERE events.session_id = $sessionId
     ORDER BY events.at ASC
  `).all({ sessionId });
}

export type StudentFocusSummary = {
  studentId: string;
  studentName: string;
  lostCount: number;
  currentlyAway: boolean;
  lastEventAt: number | null;
  events: { kind: "focus_lost" | "focus_gained"; at: number }[];
};

/** Per-student running focus log for a session, for the live teacher dashboard. */
export function listSessionFocusByStudent(sessionId: string): StudentFocusSummary[] {
  const rows = listStudentFocusEvents(sessionId);
  const byStudent = new Map<string, StudentFocusSummary>();
  for (const row of rows) {
    let summary = byStudent.get(row.studentId);
    if (!summary) {
      summary = {
        studentId: row.studentId,
        studentName: row.studentName,
        lostCount: 0,
        currentlyAway: false,
        lastEventAt: null,
        events: [],
      };
      byStudent.set(row.studentId, summary);
    }
    if (row.kind === "focus_lost") {
      summary.lostCount += 1;
      summary.currentlyAway = true;
    } else {
      summary.currentlyAway = false;
    }
    summary.lastEventAt = row.at;
    summary.events.push({ kind: row.kind, at: row.at });
  }
  return [...byStudent.values()].sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export function listExamSessions(archived = false): ExamSessionRow[] {
  const onlineCutoff = Date.now() - 20_000;
  const sessions = db.query<Omit<ExamSessionRow, "requireCandidatePin"> & { requireCandidatePin: number }, { onlineCutoff: number; archived: number }>(`
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
           sessions.ending_at AS endingAt,
           sessions.require_candidate_pin AS requireCandidatePin,
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
  return sessions.map((session) => ({ ...session, requireCandidatePin: Boolean(session.requireCandidatePin) }));
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

function assertRestorableClassName(classId: string): void {
  const duplicate = db.query(`
    SELECT 1
      FROM classes AS restored
      JOIN classes AS active ON active.name_key = restored.name_key
     WHERE restored.id = $classId
       AND active.id <> restored.id
       AND active.archived_at IS NULL
  `).get({ classId });
  if (duplicate) throw new Error("Cannot restore this class while another active class has the same name");
}

function assertRestorableStudentName(studentId: string): void {
  const duplicate = db.query(`
    SELECT 1
      FROM students AS restored
      JOIN students AS active
        ON active.class_id = restored.class_id
       AND active.name_key = restored.name_key
     WHERE restored.id = $studentId
       AND active.id <> restored.id
       AND active.archived_at IS NULL
  `).get({ studentId });
  if (duplicate) throw new Error("Cannot restore this student while an active class member has the same name");
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
  if (row.archivedAt !== null) {
    assertRestorableStudentName(studentId);
    setArchivedAt("students", studentId, null);
  }
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
  if (row.archivedAt !== null) {
    assertRestorableClassName(classId);
    setArchivedAt("classes", classId, null);
  }
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
           responses.answers_json AS answersJson,
           responses.selected_question_id AS selectedQuestionId,
           responses.notepad AS notepad,
           responses.annotations_json AS annotationsJson,
           responses.revision,
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
  const sessions = db.query<Omit<StudentExamSessionRow, "requireCandidatePin"> & { requireCandidatePin: number }, { studentId: string }>(`
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
           responses.submitted_at AS submittedAt,
           sessions.require_candidate_pin AS requireCandidatePin
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
  `).all({ studentId });
  return sessions.map((session) => ({ ...session, requireCandidatePin: Boolean(session.requireCandidatePin) }));
}

export function getStudentExam(studentId: string, sessionId: string): StudentExamRow | null {
  const exam = db.query<Omit<StudentExamRow, "requireCandidatePin"> & { requireCandidatePin: number }, { studentId: string; sessionId: string }>(`
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
           sessions.ending_at AS endingAt,
           sessions.require_candidate_pin AS requireCandidatePin,
           responses.id AS responseId,
           responses.answers_json AS answersJson,
           responses.selected_question_id AS selectedQuestionId,
           responses.flags_json AS flagsJson,
           responses.audio_plays_json AS audioPlaysJson,
           responses.annotations_json AS annotationsJson,
           responses.notepad,
           responses.revision,
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
  `).get({ studentId, sessionId });
  return exam ? { ...exam, requireCandidatePin: Boolean(exam.requireCandidatePin) } : null;
}

/**
 * Answer snapshots behind the teacher's answer-history timeline. Writes coalesce into
 * fixed time buckets, so one row holds the last state a candidate wrote in that window.
 * ponytail: snapshots are spaced wider as a response grows, so a drawing-heavy paper
 * cannot flood the store (a 4-page ink answer is the large case, a typed essay the small).
 * Rows are read back in time order, and a coarser bucket can replace one finer snapshot
 * at the moment the response crosses a tier.
 */
const REVISION_BUCKET_TIERS = [
  { maxBytes: 64_000, bucketMs: 20_000 },
  { maxBytes: 1_000_000, bucketMs: 60_000 },
  { maxBytes: Number.POSITIVE_INFINITY, bucketMs: 300_000 },
] as const;

function revisionBucketMs(bytes: number): number {
  return (REVISION_BUCKET_TIERS.find((tier) => bytes <= tier.maxBytes) ?? REVISION_BUCKET_TIERS[2]).bucketMs;
}

export interface ResponseRevisionRow {
  at: number;
  answersJson: string;
  selectedQuestionId: string | null;
  flagsJson: string;
  annotationsJson: string;
  notepad: string;
}

export interface ResponseRevisionLog {
  responseId: string;
  studentName: string;
  revisions: ResponseRevisionRow[];
}
function recordResponseRevision(responseId: string, payload: ResponsePayload, at: number): void {
  const contentHash = createHash("sha256")
    .update([
      payload.answersJson,
      payload.selectedQuestionId ?? "",
      payload.flagsJson,
      payload.annotationsJson,
      payload.notepad,
    ].join("\u0000"))
    .digest("hex");
  const previous = db.query<{ contentHash: string }, { responseId: string }>(`
    SELECT content_hash AS contentHash FROM response_revisions
     WHERE response_id = $responseId
     ORDER BY at DESC
     LIMIT 1
  `).get({ responseId });
  if (previous?.contentHash === contentHash) return;
  const bucketMs = revisionBucketMs(payload.answersJson.length + payload.annotationsJson.length + payload.notepad.length);
  db.query(`
    INSERT INTO response_revisions
      (response_id, bucket, at, answers_json, selected_question_id, flags_json, annotations_json, notepad, content_hash)
    VALUES ($responseId, $bucket, $at, $answersJson, $selectedQuestionId, $flagsJson, $annotationsJson, $notepad, $contentHash)
    ON CONFLICT(response_id, bucket) DO UPDATE SET
      at = excluded.at,
      answers_json = excluded.answers_json,
      selected_question_id = excluded.selected_question_id,
      flags_json = excluded.flags_json,
      annotations_json = excluded.annotations_json,
      notepad = excluded.notepad,
      content_hash = excluded.content_hash
  `).run({
    ...payload,
    responseId,
    bucket: Math.floor(at / bucketMs),
    at,
    contentHash,
  });
}

/** Full answer timeline for one student response, oldest snapshot first. */
export function getResponseRevisionLog(sessionId: string, responseId: string): ResponseRevisionLog | null {
  const response = db.query<Omit<ResponseRevisionLog, "revisions">, { sessionId: string; responseId: string }>(`
    SELECT responses.id AS responseId,
           students.name AS studentName
      FROM responses
      JOIN students ON students.id = responses.student_id
     WHERE responses.id = $responseId AND responses.session_id = $sessionId
  `).get({ sessionId, responseId });
  if (!response) return null;
  const revisions = db.query<ResponseRevisionRow, { responseId: string }>(`
    SELECT at,
           answers_json AS answersJson,
           selected_question_id AS selectedQuestionId,
           flags_json AS flagsJson,
           annotations_json AS annotationsJson,
           notepad
      FROM response_revisions
     WHERE response_id = $responseId
     ORDER BY at ASC
  `).all({ responseId });
  return { ...response, revisions };
}

export class ResponseRevisionConflictError extends Error {
  readonly status = 409;
  readonly code = "response_revision_conflict";

  constructor(
    readonly expectedRevision: number,
    readonly currentRevision: number,
  ) {
    super("This response changed in another browser. Reload before saving again.");
  }
}

function responseRevisionForSave(responseId: string, expectedRevision: number | undefined): {
  currentRevision: number;
  nextRevision: number;
} {
  const current = db.query<{ revision: number; submittedAt: number | null }, { responseId: string }>(`
    SELECT revision, submitted_at AS submittedAt FROM responses WHERE id = $responseId
  `).get({ responseId });
  if (!current || current.submittedAt !== null) throw new Error("Response is already submitted");
  const expected = expectedRevision ?? current.revision;
  const decision = nextResponseRevision(expected, current.revision);
  if (!decision.ok) throw new ResponseRevisionConflictError(expected, current.revision);
  return { currentRevision: current.revision, nextRevision: decision.nextRevision };
}

function setResponseClientState(
  responseId: string,
  clientId: string | undefined,
  state: CandidateResponseState,
  revision: number,
  at: number,
): void {
  if (!clientId) return;
  const session = db.query<{ endingAt: number | null }, { responseId: string }>(`
    SELECT exam_sessions.ending_at AS endingAt
      FROM responses
      JOIN exam_sessions ON exam_sessions.id = responses.session_id
     WHERE responses.id = $responseId
  `).get({ responseId });
  db.query(`
    INSERT INTO response_clients (response_id, client_id, state, revision, updated_at, end_snapshot)
    VALUES ($responseId, $clientId, $state, $revision, $at, $endSnapshot)
    ON CONFLICT(response_id, client_id) DO UPDATE SET
      state = excluded.state,
      revision = excluded.revision,
      updated_at = excluded.updated_at,
      end_snapshot = COALESCE(response_clients.end_snapshot, excluded.end_snapshot)
  `).run({
    responseId,
    clientId,
    state,
    revision,
    at,
    endSnapshot: session?.endingAt ?? null,
  });
}

export function acknowledgeResponseClient(
  responseId: string,
  clientId: string,
  revision: number,
  at = Date.now(),
): boolean {
  const response = db.query<{ revision: number; endingAt: number | null }, { responseId: string }>(`
    SELECT responses.revision,
           exam_sessions.ending_at AS endingAt
      FROM responses
      JOIN exam_sessions ON exam_sessions.id = responses.session_id
     WHERE responses.id = $responseId
  `).get({ responseId });
  if (!response || response.revision !== revision) return false;
  const result = db.query(`
    INSERT INTO response_clients (response_id, client_id, state, revision, updated_at, end_snapshot)
    VALUES ($responseId, $clientId, 'saved', $revision, $at, $endSnapshot)
    ON CONFLICT(response_id, client_id) DO UPDATE SET
      state = 'saved',
      revision = excluded.revision,
      updated_at = excluded.updated_at,
      end_snapshot = COALESCE(response_clients.end_snapshot, excluded.end_snapshot)
    WHERE response_clients.revision <= excluded.revision
  `).run({
    responseId,
    clientId,
    revision,
    at,
    endSnapshot: response.endingAt,
  });
  return result.changes === 1;
}

export const saveResponse = db.transaction((
  responseId: string,
  payload: ResponsePayload,
  at = Date.now(),
): number => {
  const { nextRevision } = responseRevisionForSave(responseId, payload.expectedRevision);
  const changed = db.query(`
    UPDATE responses
       SET answers_json = $answersJson,
           selected_question_id = $selectedQuestionId,
           flags_json = $flagsJson,
           annotations_json = $annotationsJson,
           notepad = $notepad,
           revision = $nextRevision,
           updated_at = $at
     WHERE id = $responseId AND submitted_at IS NULL AND revision = $expectedRevision
  `).run({
    ...payload,
    expectedRevision: payload.expectedRevision ?? nextRevision - 1,
    nextRevision,
    at,
    responseId,
  });
  if (changed.changes !== 1) throw new ResponseRevisionConflictError(
    payload.expectedRevision ?? nextRevision - 1,
    db.query<{ revision: number }, { responseId: string }>(
      "SELECT revision FROM responses WHERE id = $responseId",
    ).get({ responseId })?.revision ?? nextRevision,
  );
  recordResponseRevision(responseId, payload, at);
  setResponseClientState(responseId, payload.clientId, "saved", nextRevision, at);
  return nextRevision;
});

export const saveAndSubmitResponse = db.transaction((
  responseId: string,
  payload: ResponsePayload,
  at = Date.now(),
): { submittedAt: number; revision: number } => {
  const { nextRevision } = responseRevisionForSave(responseId, payload.expectedRevision);
  const changed = db.query(`
    UPDATE responses
       SET answers_json = $answersJson,
           selected_question_id = $selectedQuestionId,
           flags_json = $flagsJson,
           annotations_json = $annotationsJson,
           notepad = $notepad,
           revision = $nextRevision,
           submitted_at = $at,
           updated_at = $at
     WHERE id = $responseId AND submitted_at IS NULL AND revision = $expectedRevision
  `).run({
    ...payload,
    expectedRevision: payload.expectedRevision ?? nextRevision - 1,
    nextRevision,
    at,
    responseId,
  });
  if (changed.changes !== 1) throw new ResponseRevisionConflictError(
    payload.expectedRevision ?? nextRevision - 1,
    db.query<{ revision: number }, { responseId: string }>(
      "SELECT revision FROM responses WHERE id = $responseId",
    ).get({ responseId })?.revision ?? nextRevision,
  );
  recordResponseRevision(responseId, payload, at);
  setResponseClientState(responseId, payload.clientId, "submitted", nextRevision, at);
  return { submittedAt: at, revision: nextRevision };
});


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
