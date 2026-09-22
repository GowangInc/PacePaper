import type { Database } from "bun:sqlite";
import { identityKey } from "./class-rosters.ts";

const archivableTables = ["classes", "students", "exam_sessions"] as const;

export interface DatabaseSchema {
  legacyClassCode: boolean;
  legacyStudentCandidateCode: boolean;
  legacyStudentPinHash: boolean;
}

function tableColumns(db: Database, table: string): string[] {
  return db.query<{ name: string }, []>(`PRAGMA table_info(${table})`).all().map(({ name }) => name);
}

export function initializeDatabaseSchema(db: Database): DatabaseSchema {
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA foreign_keys = ON;");
  db.run("PRAGMA busy_timeout = 5000;");
  let schema: DatabaseSchema = {
    legacyClassCode: false,
    legacyStudentCandidateCode: false,
    legacyStudentPinHash: false,
  };
  const migrate = db.transaction(() => {
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
      name_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      archived_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL,
      extra_minutes INTEGER NOT NULL DEFAULT 0,
      last_seen_at INTEGER,
      created_at INTEGER NOT NULL,
      archived_at INTEGER
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
      created_at INTEGER NOT NULL,
      archived_at INTEGER,
      duration_minutes_override REAL,
      reading_time_minutes_override REAL
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

    CREATE TABLE IF NOT EXISTS response_revisions (
      response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      bucket INTEGER NOT NULL,
      at INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      selected_question_id TEXT,
      flags_json TEXT NOT NULL DEFAULT '[]',
      notepad TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL,
      PRIMARY KEY (response_id, bucket)
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      actor_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_focus_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('focus_lost', 'focus_gained')),
      at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS student_focus_events_session ON student_focus_events(session_id);
    CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS students_class ON students(class_id);
    CREATE INDEX IF NOT EXISTS responses_session ON responses(session_id);
    `);

    for (const table of archivableTables) {
      if (!tableColumns(db, table).includes("archived_at")) {
        db.run(`ALTER TABLE ${table} ADD COLUMN archived_at INTEGER`);
      }
    }

    const sessionColumns = tableColumns(db, "exam_sessions");
    if (!sessionColumns.includes("duration_minutes_override")) {
      db.run("ALTER TABLE exam_sessions ADD COLUMN duration_minutes_override REAL");
    }
    if (!sessionColumns.includes("reading_time_minutes_override")) {
      db.run("ALTER TABLE exam_sessions ADD COLUMN reading_time_minutes_override REAL");
    }

    const classColumns = tableColumns(db, "classes");
    schema.legacyClassCode = classColumns.includes("code");
    if (!classColumns.includes("name_key")) db.run("ALTER TABLE classes ADD COLUMN name_key TEXT");

    const studentColumns = tableColumns(db, "students");
    schema.legacyStudentCandidateCode = studentColumns.includes("candidate_code");
    schema.legacyStudentPinHash = studentColumns.includes("pin_hash");
    if (!studentColumns.includes("name_key")) db.run("ALTER TABLE students ADD COLUMN name_key TEXT");

    // Archived records may reuse a display name. Only live name-only sign-ins
    // need unique identities, so later legacy collisions move to Removed.
    db.run("DROP INDEX IF EXISTS classes_name_key");
    db.run("DROP INDEX IF EXISTS students_class_name_key");
    const migrationArchivedAt = Date.now();
    const classNames = new Set<string>();
    for (const schoolClass of db.query<{ id: string; name: string; archivedAt: number | null; live: number }, []>(`
      SELECT id, name, archived_at AS archivedAt,
             EXISTS(SELECT 1 FROM exam_sessions WHERE class_id = classes.id AND status = 'live') AS live
        FROM classes
       ORDER BY CASE WHEN archived_at IS NULL THEN 0 ELSE 1 END,
                EXISTS(SELECT 1 FROM exam_sessions WHERE class_id = classes.id AND status = 'live') DESC,
                created_at, id
    `).all()) {
      const key = identityKey(schoolClass.name);
      const duplicate = schoolClass.archivedAt === null && (!key || classNames.has(key));
      if (duplicate && schoolClass.live) {
        throw new Error("Cannot safely upgrade duplicate class names while more than one has a live examination");
      }
      db.query("UPDATE classes SET name_key = $key, archived_at = $archivedAt WHERE id = $id").run({
        id: schoolClass.id,
        key,
        archivedAt: duplicate ? migrationArchivedAt : schoolClass.archivedAt,
      });
      if (!duplicate && schoolClass.archivedAt === null) classNames.add(key);
    }
    db.run("CREATE UNIQUE INDEX IF NOT EXISTS active_classes_name_key ON classes(name_key) WHERE archived_at IS NULL");

    const studentNames = new Set<string>();
    for (const student of db.query<{ id: string; classId: string; name: string; archivedAt: number | null; live: number }, []>(`
      SELECT id, class_id AS classId, name, archived_at AS archivedAt,
             EXISTS(
               SELECT 1
                 FROM responses
                 JOIN exam_sessions ON exam_sessions.id = responses.session_id
                WHERE responses.student_id = students.id AND exam_sessions.status = 'live'
             ) AS live
        FROM students
       ORDER BY CASE WHEN archived_at IS NULL THEN 0 ELSE 1 END,
                EXISTS(
                  SELECT 1
                    FROM responses
                    JOIN exam_sessions ON exam_sessions.id = responses.session_id
                   WHERE responses.student_id = students.id AND exam_sessions.status = 'live'
                ) DESC,
                created_at, id
    `).all()) {
      const key = identityKey(student.name);
      const identity = `${student.classId}\u0000${key}`;
      const duplicate = student.archivedAt === null && (!key || studentNames.has(identity));
      if (duplicate && student.live) {
        throw new Error("Cannot safely upgrade duplicate student names while more than one has a live examination");
      }
      db.query("UPDATE students SET name_key = $key, archived_at = $archivedAt WHERE id = $id").run({
        id: student.id,
        key,
        archivedAt: duplicate ? migrationArchivedAt : student.archivedAt,
      });
      if (!duplicate && student.archivedAt === null) studentNames.add(identity);
    }
    db.run("CREATE UNIQUE INDEX IF NOT EXISTS active_students_class_name_key ON students(class_id, name_key) WHERE archived_at IS NULL");
  });
  migrate();
  return schema;
}
