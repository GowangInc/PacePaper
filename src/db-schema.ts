import type { Database } from "bun:sqlite";
import { identityKey } from "./class-rosters.ts";

const archivableTables = ["classes", "students", "papers", "exam_sessions"] as const;

export const DATABASE_SCHEMA_VERSION = 4;

export interface DatabaseSchema {
  legacyClassCode: boolean;
  legacyStudentCandidateCode: boolean;
  legacyStudentPinHash: boolean;
}

function tableColumns(db: Database, table: string): string[] {
  return db.query<{ name: string }, []>(`PRAGMA table_info(${table})`).all().map(({ name }) => name);
}

function ensureColumn(db: Database, table: string, column: string, definition: string): void {
  if (!tableColumns(db, table).includes(column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function ensureIndex(db: Database, name: string, definition: string): void {
  const existing = db.query<{ sql: string | null }, { name: string }>(
    "SELECT sql FROM sqlite_master WHERE type = 'index' AND name = $name",
  ).get({ name });
  if (existing?.sql && existing.sql.replace(/\s+/gu, " ").trim() === definition.replace(/\s+/gu, " ").trim()) return;
  if (existing) db.exec(`DROP INDEX ${name}`);
  db.exec(definition);
}
function applyMigration(db: Database, version: number, migrate: () => void): void {
  const applied = db.query<{ version: number }, { version: number }>(
    "SELECT version FROM schema_migrations WHERE version = $version",
  ).get({ version });
  if (applied) return;
  db.transaction(() => {
    migrate();
    db.query("INSERT INTO schema_migrations (version, applied_at) VALUES ($version, $appliedAt)")
      .run({ version, appliedAt: Date.now() });
  })();
}

function migrateLegacyIdentities(db: Database): void {
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
}

export function initializeDatabaseSchema(db: Database): DatabaseSchema {
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA foreign_keys = ON;");
  db.run("PRAGMA busy_timeout = 5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  applyMigration(db, 1, () => {
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
        created_at INTEGER NOT NULL,
        archived_at INTEGER
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
        reading_time_minutes_override REAL,
        ending_at INTEGER,
        require_candidate_pin INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        answers_json TEXT NOT NULL DEFAULT '{}',
        selected_question_id TEXT,
        flags_json TEXT NOT NULL DEFAULT '[]',
        notepad TEXT NOT NULL DEFAULT '',
        audio_plays_json TEXT NOT NULL DEFAULT '{}',
        annotations_json TEXT NOT NULL DEFAULT '[]',
        revision INTEGER NOT NULL DEFAULT 0,
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
        annotations_json TEXT NOT NULL DEFAULT '[]',
        notepad TEXT NOT NULL DEFAULT '',
        content_hash TEXT NOT NULL,
        PRIMARY KEY (response_id, bucket)
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY,
        role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
        actor_id TEXT NOT NULL,
        scope_id TEXT,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS candidate_credentials (
        session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        pin_hash TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_lookup TEXT NOT NULL UNIQUE,
        issued_at INTEGER NOT NULL,
        revoked_at INTEGER,
        PRIMARY KEY (session_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS response_clients (
        response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('saved', 'pending', 'offline', 'submitted', 'disconnected')),
        revision INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        end_snapshot INTEGER,
        PRIMARY KEY(response_id, client_id)
      );

      CREATE TABLE IF NOT EXISTS student_focus_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK(kind IN ('focus_lost', 'focus_gained')),
        at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_id TEXT,
        reason TEXT,
        at INTEGER NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS one_live_session_per_class
        ON exam_sessions(class_id) WHERE status = 'live';
      CREATE INDEX IF NOT EXISTS student_focus_events_session ON student_focus_events(session_id);
      CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS students_class ON students(class_id);
      CREATE INDEX IF NOT EXISTS responses_session ON responses(session_id);
      CREATE INDEX IF NOT EXISTS response_clients_response ON response_clients(response_id);
    `);
    ensureColumn(db, "responses", "notepad", "TEXT NOT NULL DEFAULT ''");
    ensureColumn(db, "response_revisions", "notepad", "TEXT NOT NULL DEFAULT ''");
    ensureColumn(db, "response_revisions", "annotations_json", "TEXT NOT NULL DEFAULT '[]'");
    ensureColumn(db, "responses", "annotations_json", "TEXT NOT NULL DEFAULT '[]'");
    for (const table of archivableTables) ensureColumn(db, table, "archived_at", "INTEGER");
    ensureColumn(db, "exam_sessions", "duration_minutes_override", "REAL");
    ensureColumn(db, "exam_sessions", "reading_time_minutes_override", "REAL");
    ensureColumn(db, "exam_sessions", "ending_at", "INTEGER");
    ensureColumn(db, "exam_sessions", "require_candidate_pin", "INTEGER NOT NULL DEFAULT 0");
    ensureColumn(db, "responses", "revision", "INTEGER NOT NULL DEFAULT 0");
    ensureColumn(db, "auth_sessions", "scope_id", "TEXT");
    ensureColumn(db, "response_clients", "end_snapshot", "INTEGER");
    db.exec("CREATE INDEX IF NOT EXISTS auth_sessions_scope ON auth_sessions(scope_id)");
    ensureColumn(db, "classes", "name_key", "TEXT");
    ensureColumn(db, "students", "name_key", "TEXT");
    migrateLegacyIdentities(db);
    db.exec(`
      CREATE TABLE IF NOT EXISTS candidate_credentials (
        session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        pin_hash TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_lookup TEXT NOT NULL UNIQUE,
        issued_at INTEGER NOT NULL,
        revoked_at INTEGER,
        PRIMARY KEY(session_id, student_id)
      )
    `);
    ensureColumn(db, "responses", "annotations_json", "TEXT NOT NULL DEFAULT '[]'");
    ensureColumn(db, "response_revisions", "annotations_json", "TEXT NOT NULL DEFAULT '[]'");
  });

  applyMigration(db, 2, () => {
    const paperColumns = new Set(tableColumns(db, "papers"));
    if (!["title", "subject", "level", "paper", "manifest_json", "created_at"].every((column) => paperColumns.has(column))) return;
    db.exec(`
      WITH ranked AS (
        SELECT papers.id,
               row_number() OVER (
                 PARTITION BY lower(trim(title)), subject, lower(trim(level)), lower(trim(paper)),
                              COALESCE(json_extract(manifest_json, '$.assessmentSession'), '')
                 ORDER BY EXISTS(
                   SELECT 1 FROM exam_sessions
                    WHERE exam_sessions.paper_id = papers.id AND exam_sessions.status = 'live'
                 ) DESC,
                 (SELECT count(*) FROM exam_sessions WHERE exam_sessions.paper_id = papers.id) DESC,
                 papers.created_at DESC,
                 papers.id
               ) AS duplicate_rank
          FROM papers
         WHERE archived_at IS NULL
      )
      UPDATE papers
         SET archived_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)
       WHERE id IN (SELECT id FROM ranked WHERE duplicate_rank > 1)
    `);
    ensureIndex(
      db,
      "active_papers_identity",
      `CREATE UNIQUE INDEX active_papers_identity ON papers(
        lower(trim(title)),
        subject,
        lower(trim(level)),
        lower(trim(paper)),
        COALESCE(json_extract(manifest_json, '$.assessmentSession'), '')
      ) WHERE archived_at IS NULL`,
    );
  });

  applyMigration(db, 3, () => {
    ensureColumn(db, "papers", "archived_at", "INTEGER");
    ensureColumn(db, "exam_sessions", "ending_at", "INTEGER");
    ensureColumn(db, "exam_sessions", "require_candidate_pin", "INTEGER NOT NULL DEFAULT 0");
    ensureColumn(db, "responses", "annotations_json", "TEXT NOT NULL DEFAULT '[]'");
    ensureColumn(db, "responses", "revision", "INTEGER NOT NULL DEFAULT 0");
    ensureColumn(db, "response_revisions", "annotations_json", "TEXT NOT NULL DEFAULT '[]'");
    ensureColumn(db, "auth_sessions", "scope_id", "TEXT");
    db.exec(`
      CREATE TABLE IF NOT EXISTS candidate_credentials (
        session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        pin_hash TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        token_lookup TEXT NOT NULL UNIQUE,
        issued_at INTEGER NOT NULL,
        revoked_at INTEGER,
        PRIMARY KEY (session_id, student_id)
      );
      CREATE TABLE IF NOT EXISTS response_clients (
        response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
        client_id TEXT NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('saved', 'pending', 'offline', 'submitted', 'disconnected')),
        revision INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        end_snapshot INTEGER,
        PRIMARY KEY (response_id, client_id)
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_id TEXT,
        reason TEXT,
        at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS auth_sessions_scope ON auth_sessions(scope_id);
      CREATE INDEX IF NOT EXISTS response_clients_response ON response_clients(response_id);
    `);
    ensureColumn(db, "response_clients", "end_snapshot", "INTEGER");
  });

  applyMigration(db, 4, () => {
    ensureColumn(db, "response_clients", "updated_at", "INTEGER NOT NULL DEFAULT 0");
  });

  const classColumns = tableColumns(db, "classes");
  const studentColumns = tableColumns(db, "students");
  return {
    legacyClassCode: classColumns.includes("code"),
    legacyStudentCandidateCode: studentColumns.includes("candidate_code"),
    legacyStudentPinHash: studentColumns.includes("pin_hash"),
  };
}
