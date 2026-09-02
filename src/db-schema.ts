import type { Database } from "bun:sqlite";

const archivableTables = ["classes", "students", "exam_sessions"] as const;

export function initializeDatabaseSchema(db: Database): void {
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA foreign_keys = ON;");
  db.run("PRAGMA busy_timeout = 5000;");
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
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at INTEGER NOT NULL,
      archived_at INTEGER
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
      archived_at INTEGER,
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
      created_at INTEGER NOT NULL,
      archived_at INTEGER
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

    for (const table of archivableTables) {
      const columns = db.query<{ name: string }, []>(`PRAGMA table_info(${table})`).all();
      if (!columns.some(({ name }) => name === "archived_at")) {
        db.run(`ALTER TABLE ${table} ADD COLUMN archived_at INTEGER`);
      }
    }
  });
  migrate();
}
