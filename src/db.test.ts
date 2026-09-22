import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { initializeDatabaseSchema } from "./db-schema.ts";
import { parseManifest } from "./papers.ts";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "digitaldp-db-test-"));
const previousDatabasePath = process.env.DIGITALDP_DB;
process.env.DIGITALDP_DB = join(temporaryDirectory, "test.sqlite");

const legacyDatabase = new Database(process.env.DIGITALDP_DB, { create: true });
legacyDatabase.exec(`
  CREATE TABLE classes (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE COLLATE NOCASE, created_at INTEGER NOT NULL
  );
  CREATE TABLE students (
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
  CREATE TABLE exam_sessions (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'live', 'ended')),
    started_at INTEGER,
    ended_at INTEGER,
    created_at INTEGER NOT NULL
  );
`);
legacyDatabase.close();

const database = await import("./db.ts");

afterAll(() => {
  database.db.close();
  rmSync(temporaryDirectory, { recursive: true });
  if (previousDatabasePath === undefined) delete process.env.DIGITALDP_DB;
  else process.env.DIGITALDP_DB = previousDatabasePath;
});

describe("database schema migration", () => {
  test("adds nullable lifecycle and ready-exam timing fields to an existing database", () => {
    initializeDatabaseSchema(database.db);
    for (const table of ["classes", "students", "exam_sessions"] as const) {
      const columns = database.db.query<{ name: string; notnull: number }, []>(`PRAGMA table_info(${table})`).all();
      expect(columns.find(({ name }) => name === "archived_at")).toMatchObject({ notnull: 0 });
    }
    const sessionColumns = database.db.query<{ name: string; notnull: number }, []>("PRAGMA table_info(exam_sessions)").all();
    expect(sessionColumns.find(({ name }) => name === "duration_minutes_override")).toMatchObject({ notnull: 0 });
    expect(sessionColumns.find(({ name }) => name === "reading_time_minutes_override")).toMatchObject({ notnull: 0 });
  });
});

describe("student roster and account lookup", () => {
  const firstClass = database.createClass("Class One");
  const secondClass = database.createClass("Class Two");
  const zoe = database.createStudent({
    classId: firstClass.id,
    name: "Zoe",
    extraMinutes: 0,
  });
  const amy = database.createStudent({
    classId: firstClass.id,
    name: "amy",
    extraMinutes: 5,
  });
  database.createStudent({
    classId: secondClass.id,
    name: "Other class",
    extraMinutes: 0,
  });

  test("requires a class name and student name match", () => {
    expect(database.findStudentLogin("CLASS ONE", "AMY")).toMatchObject({ id: amy.id, classId: firstClass.id });
    expect(database.findStudentLogin("CLASS TWO", "amy")).toBeNull();
    expect(database.findStudentLogin("Class One", "missing")).toBeNull();
  });

  test("updates only within the asserted class and clears sessions after a name change", () => {
    expect(database.updateStudent({
      id: zoe.id,
      classId: secondClass.id,
      name: "Wrong class update",
      extraMinutes: 10,
    })).toBeNull();

    database.createAuthSession("zoe-session", "student", zoe.id, Date.now() + 60_000);
    expect(database.updateStudent({
      id: zoe.id,
      classId: firstClass.id,
      name: "Zoë Updated",
      extraMinutes: 25,
    })).toMatchObject({
      id: zoe.id,
      classId: firstClass.id,
      name: "Zoë Updated",
      extraMinutes: 25,
    });
    expect(database.findStudentLogin("Class One", "Zoe")).toBeNull();
    expect(database.findStudentLogin("class one", "zoë updated")).toMatchObject({ id: zoe.id });
    expect(database.findAuthSession("zoe-session")).toBeNull();
  });
});

describe("class-list imports", () => {
  test("creates and idempotently updates classes and students by name", () => {
    const schoolClass = database.createClass("Import Original");
    database.createStudent({
      classId: schoolClass.id,
      name: "Before Import",
      extraMinutes: 0,
    });

    expect(database.importClassRosters([
      {
        name: "Import original",
        students: [
          { name: "After Import", extraMinutes: 15 },
          { name: "New Student", extraMinutes: 0 },
        ],
      },
      { name: "Empty Imported Class", students: [] },
    ])).toEqual({
      classesCreated: 1,
      classesUpdated: 1,
      classesUnchanged: 0,
      studentsCreated: 2,
      studentsUpdated: 0,
      studentsUnchanged: 0,
    });

    expect(database.listClasses().find(({ name }) => name === "Import original")?.id).toBe(schoolClass.id);
    expect(database.listStudents().filter(({ classId }) => classId === schoolClass.id)).toEqual([
      expect.objectContaining({ name: "After Import", extraMinutes: 15 }),
      expect.objectContaining({ name: "Before Import", extraMinutes: 0 }),
      expect.objectContaining({ name: "New Student", extraMinutes: 0 }),
    ]);
    expect(database.importClassRosters([{
      name: "Import original",
      students: [
        { name: "After Import", extraMinutes: 15 },
        { name: "New Student", extraMinutes: 0 },
      ],
    }])).toMatchObject({ classesUnchanged: 1, studentsUnchanged: 2 });
  });

  test("rejects removed names and rolls back the entire file", () => {
    const schoolClass = database.createClass("Archived Import");
    const removedStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Removed Student",
      extraMinutes: 0,
    });
    database.archiveStudent(removedStudent.id);

    expect(() => database.importClassRosters([
      { name: "Must Roll Back", students: [] },
      {
        name: "Archived Import",
        students: [{ name: "Removed Student", extraMinutes: 0 }],
      },
    ])).toThrow("Restore them before importing");
    expect(database.listClasses().some(({ name }) => name === "Must Roll Back")).toBeFalse();
  });
});

describe("paper replacement safety", () => {
  const paperManifest = (title: string) => parseManifest({
    version: 1,
    title,
    subject: "test-subject",
    subjectLabel: "Test Subject",
    level: "SL",
    paper: "Paper 1",
    durationMinutes: 30,
    readingTimeMinutes: 5,
    instructions: "Answer the question.",
    mode: "essay",
    maximumMarks: 10,
    selectionMode: "all",
    sourceClassification: "teacher-authored",
    exportAuthorized: true,
    resources: [],
    questions: [{ id: "q1", label: "Question 1", prompt: "Respond.", type: "essay", marks: 10, resourceKeys: [] }],
  });

  test("replaces an unused paper but preserves one referenced by an exam session", () => {
    const paper = database.createPaper({ manifest: paperManifest("Original"), assets: [] });
    expect(database.replaceUnusedPaper(paper.id, { manifest: paperManifest("Revised"), assets: [] })).toBe(true);
    expect(database.getPaper(paper.id)?.manifest.title).toBe("Revised");

    const paperClass = database.createClass("Paper Safety");
    database.createExamSession(paperClass.id, paper.id);

    expect(database.replaceUnusedPaper(paper.id, { manifest: paperManifest("Must not replace"), assets: [] })).toBe(false);
    expect(database.getPaper(paper.id)?.manifest.title).toBe("Revised");
  });
});

describe("student examination selection", () => {
  const paperManifest = parseManifest({
    version: 1,
    title: "Repeatable Paper 1",
    subject: "test-subject",
    subjectLabel: "Test Subject",
    level: "SL",
    paper: "Paper 1",
    durationMinutes: 30,
    readingTimeMinutes: 0,
    instructions: "Answer the question.",
    mode: "essay",
    maximumMarks: 10,
    selectionMode: "all",
    sourceClassification: "teacher-authored",
    exportAuthorized: true,
    resources: [],
    questions: [{ id: "q1", label: "Question 1", prompt: "Respond.", type: "essay", marks: 10, resourceKeys: [] }],
  });

  test("keeps responses independent when the same student takes the same paper in two sessions", () => {
    const schoolClass = database.createClass("Repeat Sessions");
    const student = database.createStudent({
      classId: schoolClass.id,
      name: "Alex",
      extraMinutes: 0,
    });
    const paper = database.createPaper({ manifest: paperManifest, assets: [] });
    const firstSessionId = database.createExamSession(schoolClass.id, paper.id);
    const secondSessionId = database.createExamSession(schoolClass.id, paper.id);

    expect(firstSessionId).not.toBe(secondSessionId);
    const draftSessions = database.listStudentExamSessions(student.id).filter((session) => session.paperId === paper.id);
    expect(draftSessions).toHaveLength(2);
    expect(draftSessions.map(({ id }) => id).sort()).toEqual([firstSessionId, secondSessionId].sort());
    expect(draftSessions.every((session) => (
      session.status === "draft" && session.submittedAt === null
    ))).toBe(true);

    database.startExamSession(firstSessionId);
    const firstExam = database.getStudentExam(student.id, firstSessionId);
    expect(firstExam).not.toBeNull();
    database.saveAndSubmitResponse(firstExam!.responseId, {
      answersJson: JSON.stringify({ q1: "First sitting response" }),
      selectedQuestionId: null,
      flagsJson: "[]",
      notepad: "",
    });

    expect(database.getStudentExam(student.id, firstSessionId)?.submittedAt).not.toBeNull();
    expect(database.getStudentExam(student.id, secondSessionId)).toBeNull();
    database.endExamSession(firstSessionId);
    database.startExamSession(secondSessionId);

    const secondExam = database.getStudentExam(student.id, secondSessionId);
    expect(secondExam).not.toBeNull();
    expect(secondExam?.responseId).not.toBe(firstExam?.responseId);
    expect(secondExam?.submittedAt).toBeNull();
    expect(JSON.parse(secondExam?.answersJson ?? "{}")).toEqual({});

    const sessions = database.listStudentExamSessions(student.id).filter((session) => session.paperId === paper.id);
    expect(sessions).toEqual([
      expect.objectContaining({ id: secondSessionId, status: "live", submittedAt: null }),
      expect.objectContaining({ id: firstSessionId, status: "ended", submittedAt: expect.any(Number) }),
    ]);

    const futureSessionId = database.createExamSession(schoolClass.id, paper.id);
    const lateStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Late addition",
      extraMinutes: 0,
    });
    expect(database.listStudentExamSessions(lateStudent.id).filter((session) => session.paperId === paper.id)).toEqual([
      expect.objectContaining({ id: futureSessionId, status: "draft", submittedAt: null }),
    ]);
  });

  test("saves decimal reading time on a ready exam and applies live corrections", () => {
    const schoolClass = database.createClass("Timing Override");
    const student = database.createStudent({
      classId: schoolClass.id,
      name: "Timer Tester",
      extraMinutes: 0,
    });
    const paper = database.createPaper({ manifest: paperManifest, assets: [] });
    const sessionId = database.createExamSession(schoolClass.id, paper.id);

    database.updateExamSessionTiming(sessionId, 0.1, 12);
    expect(database.listExamSessions().find(({ id }) => id === sessionId)).toMatchObject({
      readingTimeMinutes: 0.1,
      durationMinutes: 12,
      status: "draft",
    });
    expect(database.listStudentExamSessions(student.id).find(({ id }) => id === sessionId)).toMatchObject({
      readingTimeMinutes: 0.1,
      durationMinutes: 12,
    });
    database.updateExamSessionTiming(sessionId, 0.2, 12, { readingTimeMinutes: 0.1, durationMinutes: 12 });
    expect(() => database.updateExamSessionTiming(sessionId, 5, 30, { readingTimeMinutes: 0.1, durationMinutes: 12 }))
      .toThrow("another window");
    expect(database.listExamSessions().find(({ id }) => id === sessionId)?.readingTimeMinutes).toBe(0.2);
    database.updateExamSessionTiming(sessionId, 0.1, 12, { readingTimeMinutes: 0.2, durationMinutes: 12 });

    database.startExamSession(sessionId);
    expect(database.getStudentExam(student.id, sessionId)).toMatchObject({
      readingTimeMinutes: 0.1,
      durationMinutes: 12,
    });
    database.updateExamSessionTiming(sessionId, 5, 30);
    expect(database.listExamSessions().find(({ id }) => id === sessionId)).toMatchObject({
      readingTimeMinutes: 5,
      durationMinutes: 30,
      status: "live",
    });
    database.endExamSession(sessionId);
    expect(() => database.updateExamSessionTiming(sessionId, 2, 15)).toThrow("Only a ready or running exam");
  });

  test("reads and atomically enforces the fixed two-play audio limit", async () => {
    const schoolClass = database.createClass("Audio Count");
    const student = database.createStudent({
      classId: schoolClass.id,
      name: "Listener",
      extraMinutes: 0,
    });
    const paper = database.createPaper({ manifest: paperManifest, assets: [] });
    const sessionId = database.createExamSession(schoolClass.id, paper.id);
    database.startExamSession(sessionId);
    const exam = database.getStudentExam(student.id, sessionId)!;

    expect(database.getAudioPlayCount(exam.responseId, "recording-1")).toBe(0);
    const attempts = await Promise.allSettled(Array.from({ length: 3 }, async () => (
      database.incrementAudioPlay(exam.responseId, "recording-1")
    )));
    expect(attempts.filter((attempt) => attempt.status === "fulfilled").map((attempt) => attempt.value).sort()).toEqual([1, 2]);
    const rejected = attempts.find((attempt) => attempt.status === "rejected");
    expect(rejected?.reason).toBeInstanceOf(Error);
    expect((rejected as PromiseRejectedResult).reason.message).toBe("No audio plays remain");
    expect(database.getAudioPlayCount(exam.responseId, "recording-1")).toBe(2);
  });
});

describe("reversible class, student, and exam lifecycle", () => {
  const manifest = parseManifest({
    version: 1,
    title: "Lifecycle Paper",
    subject: "test-subject",
    subjectLabel: "Test Subject",
    level: "SL",
    paper: "Paper 1",
    durationMinutes: 30,
    readingTimeMinutes: 0,
    instructions: "Answer the question.",
    mode: "essay",
    maximumMarks: 10,
    selectionMode: "all",
    sourceClassification: "teacher-authored",
    exportAuthorized: true,
    resources: [],
    questions: [{ id: "q1", label: "Question 1", prompt: "Respond.", type: "essay", marks: 10, resourceKeys: [] }],
  });
  const paper = database.createPaper({ manifest, assets: [] });

  test("archives students idempotently, filters every entry point, revokes login, and restores", () => {
    const schoolClass = database.createClass("Student Lifecycle");
    const student = database.createStudent({
      classId: schoolClass.id,
      name: "Lifecycle Student",
      extraMinutes: 5,
    });
    database.createAuthSession("student-lifecycle-token", "student", student.id, Date.now() + 60_000);

    const archived = database.archiveStudent(student.id);
    expect(archived).toEqual({ id: student.id, classId: schoolClass.id, archivedAt: expect.any(Number) });
    expect(database.archiveStudent(student.id)).toEqual(archived);
    expect(database.listStudents().some(({ id }) => id === student.id)).toBe(false);
    expect(database.listStudents(true)).toContainEqual(expect.objectContaining({ id: student.id, archivedAt: archived.archivedAt }));
    expect(database.findStudentLogin("Student Lifecycle", "Lifecycle Student")).toBeNull();
    expect(database.getStudent(student.id)).toBeNull();
    expect(database.findAuthSession("student-lifecycle-token")).toBeNull();
    expect(database.updateStudent({
      id: student.id,
      classId: schoolClass.id,
      name: "Must not update",
      extraMinutes: 0,
    })).toBeNull();

    expect(database.restoreStudent(student.id)).toEqual({ id: student.id, classId: schoolClass.id, archivedAt: null });
    expect(database.restoreStudent(student.id)).toEqual({ id: student.id, classId: schoolClass.id, archivedAt: null });
    expect(database.findStudentLogin("Student Lifecycle", "Lifecycle Student")).toMatchObject({ id: student.id });
    expect(database.listStudents()).toContainEqual(expect.objectContaining({ id: student.id, archivedAt: null }));
  });

  test("keeps child archive flags while an archived class gates access and creation", () => {
    const schoolClass = database.createClass("Class Lifecycle");
    const activeStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Active Child",
      extraMinutes: 0,
    });
    const archivedStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Archived Child",
      extraMinutes: 0,
    });
    const studentArchive = database.archiveStudent(archivedStudent.id);
    const sessionId = database.createExamSession(schoolClass.id, paper.id);
    const sessionArchive = database.archiveExamSession(sessionId);
    expect(database.archiveExamSession(sessionId)).toEqual(sessionArchive);
    database.createAuthSession("class-child-token", "student", activeStudent.id, Date.now() + 60_000);

    const classArchive = database.archiveClass(schoolClass.id);
    expect(database.archiveClass(schoolClass.id)).toEqual(classArchive);
    expect(database.listClasses().some(({ id }) => id === schoolClass.id)).toBe(false);
    expect(database.listClasses(true)).toContainEqual(expect.objectContaining({ id: schoolClass.id }));
    expect(database.listStudents().some(({ classId }) => classId === schoolClass.id)).toBe(false);
    expect(database.listStudents(true).some(({ classId }) => classId === schoolClass.id)).toBe(false);
    expect(database.listExamSessions().some(({ id }) => id === sessionId)).toBe(false);
    expect(database.listExamSessions(true).some(({ id }) => id === sessionId)).toBe(false);
    expect(database.getStudent(activeStudent.id)).toBeNull();
    expect(database.findAuthSession("class-child-token")).toBeNull();
    expect(() => database.restoreStudent(archivedStudent.id)).toThrow("Restore the class first");
    expect(() => database.restoreExamSession(sessionId)).toThrow("Restore the class first");
    expect(() => database.createStudent({
      classId: schoolClass.id,
      name: "Blocked Child",
      extraMinutes: 0,
    })).toThrow("Active class not found");
    expect(() => database.createExamSession(schoolClass.id, paper.id)).toThrow("Active class not found");

    expect(database.restoreClass(schoolClass.id)).toEqual({ id: schoolClass.id, classId: schoolClass.id, archivedAt: null });
    expect(database.restoreClass(schoolClass.id)).toEqual({ id: schoolClass.id, classId: schoolClass.id, archivedAt: null });
    expect(database.getStudent(activeStudent.id)).toMatchObject({ id: activeStudent.id });
    expect(database.listStudents(true)).toContainEqual(expect.objectContaining({
      id: archivedStudent.id,
      archivedAt: studentArchive.archivedAt,
    }));
    expect(database.listExamSessions(true)).toContainEqual(expect.objectContaining({
      id: sessionId,
      archivedAt: sessionArchive.archivedAt,
    }));
    database.restoreStudent(archivedStudent.id);
    expect(database.restoreStudent(archivedStudent.id).archivedAt).toBeNull();
    database.restoreExamSession(sessionId);
    expect(database.restoreExamSession(sessionId).archivedAt).toBeNull();
    expect(database.listStudents()).toContainEqual(expect.objectContaining({ id: archivedStudent.id }));
    expect(database.listExamSessions()).toContainEqual(expect.objectContaining({ id: sessionId }));

    expect(() => database.archiveStudent("missing-student")).toThrow("Student not found");
    expect(() => database.archiveClass("missing-class")).toThrow("Class not found");
    expect(() => database.archiveExamSession("missing-session")).toThrow("Exam session not found");
  });

  test("blocks live conflicts but allows a submitted student to be archived", () => {
    const schoolClass = database.createClass("Live Lifecycle");
    const student = database.createStudent({
      classId: schoolClass.id,
      name: "Live Student",
      extraMinutes: 0,
    });
    const sessionId = database.createExamSession(schoolClass.id, paper.id);
    database.startExamSession(sessionId);
    const exam = database.getStudentExam(student.id, sessionId)!;
    database.touchStudent(student.id);
    database.createAuthSession("live-conflict-token", "student", student.id, Date.now() + 60_000);

    expect(() => database.archiveStudent(student.id)).toThrow("unfinished work in a live exam");
    expect(() => database.archiveClass(schoolClass.id)).toThrow("End the exam first");
    expect(() => database.archiveExamSession(sessionId)).toThrow("End it first");
    expect(database.findAuthSession("live-conflict-token")).not.toBeNull();

    database.saveAndSubmitResponse(exam.responseId, {
      answersJson: JSON.stringify({ q1: "Submitted work" }),
      selectedQuestionId: null,
      flagsJson: "[]",
      notepad: "",
    });
    database.archiveStudent(student.id);
    expect(database.findAuthSession("live-conflict-token")).toBeNull();
    expect(database.listExamSessions()).toContainEqual(expect.objectContaining({
      id: sessionId,
      candidateCount: 1,
      submittedCount: 1,
      activeCount: 0,
    }));
    database.endExamSession(sessionId);
    expect(database.archiveExamSession(sessionId).archivedAt).toEqual(expect.any(Number));
    expect(database.archiveClass(schoolClass.id).archivedAt).toEqual(expect.any(Number));
  });

  test("takes the response roster only at start and never backfills restored or late students", () => {
    const schoolClass = database.createClass("Start Snapshot");
    const presentStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Present at Start",
      extraMinutes: 0,
    });
    const absentStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Archived at Start",
      extraMinutes: 0,
    });
    database.archiveStudent(absentStudent.id);
    const sessionId = database.createExamSession(schoolClass.id, paper.id);
    database.startExamSession(sessionId);

    expect(database.getStudentExam(presentStudent.id, sessionId)).not.toBeNull();
    database.restoreStudent(absentStudent.id);
    expect(database.getStudentExam(absentStudent.id, sessionId)).toBeNull();
    expect(database.listStudentExamSessions(absentStudent.id).some(({ id }) => id === sessionId)).toBe(false);
    const lateStudent = database.createStudent({
      classId: schoolClass.id,
      name: "Added after Start",
      extraMinutes: 0,
    });
    expect(database.getStudentExam(lateStudent.id, sessionId)).toBeNull();
    expect(database.db.query<{ count: number }, { sessionId: string }>(
      "SELECT COUNT(*) AS count FROM responses WHERE session_id = $sessionId",
    ).get({ sessionId })?.count).toBe(1);
    database.endExamSession(sessionId);

    const archivedDraft = database.createExamSession(schoolClass.id, paper.id);
    database.archiveExamSession(archivedDraft);
    expect(() => database.startExamSession(archivedDraft)).toThrow("Active exam session not found");
    database.restoreExamSession(archivedDraft);
    database.archiveClass(schoolClass.id);
    expect(() => database.startExamSession(archivedDraft)).toThrow("Active exam session not found");
  });

  test("preserves completed results after the session, student, and class are archived", () => {
    const schoolClass = database.createClass("Archived Results");
    const student = database.createStudent({
      classId: schoolClass.id,
      name: "Result Student",
      extraMinutes: 0,
    });
    const sessionId = database.createExamSession(schoolClass.id, paper.id);
    database.startExamSession(sessionId);
    const exam = database.getStudentExam(student.id, sessionId)!;
    database.saveAndSubmitResponse(exam.responseId, {
      answersJson: JSON.stringify({ q1: "Preserved answer" }),
      selectedQuestionId: "q1",
      flagsJson: "[]",
      notepad: "Student notepad content",
    });
    database.endExamSession(sessionId);
    database.archiveExamSession(sessionId);
    database.archiveStudent(student.id);
    database.archiveClass(schoolClass.id);

    const results = database.getSessionResults(sessionId);
    expect(results).toMatchObject({ id: sessionId, status: "ended" });
    expect(results?.responses).toEqual([
      expect.objectContaining({
        responseId: exam.responseId,
        studentName: "Result Student",
        answersJson: JSON.stringify({ q1: "Preserved answer" }),
        notepad: "Student notepad content",
      }),
    ]);
    expect(database.db.query<{ count: number }, { sessionId: string }>(
      "SELECT COUNT(*) AS count FROM responses WHERE session_id = $sessionId",
    ).get({ sessionId })?.count).toBe(1);

    database.restoreClass(schoolClass.id);
    expect(database.listExamSessions(true)).toContainEqual(expect.objectContaining({ id: sessionId }));
    expect(database.getSessionResults(sessionId)?.responses).toHaveLength(1);
  });
});

describe("candidate answer timeline", () => {
  const paperManifest = parseManifest({
    version: 1,
    title: "Timeline Paper 1",
    subject: "test-subject",
    subjectLabel: "Test Subject",
    level: "SL",
    paper: "Paper 1",
    durationMinutes: 90,
    readingTimeMinutes: 0,
    instructions: "Answer the question.",
    mode: "essay",
    maximumMarks: 10,
    selectionMode: "all",
    sourceClassification: "teacher-authored",
    exportAuthorized: true,
    resources: [],
    questions: [{ id: "q1", label: "Question 1", prompt: "Respond.", type: "essay", marks: 10, resourceKeys: [] }],
  });
  const schoolClass = database.createClass("Timeline Class");
  const student = database.createStudent({
    classId: schoolClass.id,
    name: "Timeline Student",
    extraMinutes: 0,
  });
  const paper = database.createPaper({ manifest: paperManifest, assets: [] });
  const sessionId = database.createExamSession(schoolClass.id, paper.id);
  database.startExamSession(sessionId);
  const responseId = database.getStudentExam(student.id, sessionId)!.responseId;
  const base = Date.UTC(2026, 0, 5, 9, 0, 0);
  const saveAt = (answer: string, offsetMs: number) => database.saveResponse(responseId, {
    answersJson: JSON.stringify({ q1: answer }),
    selectedQuestionId: null,
    flagsJson: "[]",
    notepad: "",
  }, base + offsetMs);

  test("coalesces writes into writing windows and skips unchanged saves", () => {
    saveAt("First", 0);
    saveAt("First word", 5_000);
    saveAt("First word", 12_000);
    saveAt("Second paragraph", 25_000);
    saveAt("Third paragraph", 65_000);

    const log = database.getResponseRevisionLog(sessionId, responseId);
    expect(log).toMatchObject({ responseId, studentName: "Timeline Student" });
    expect(log?.revisions.map((revision) => [revision.at, JSON.parse(revision.answersJson).q1]))
      .toEqual([
        [base + 5_000, "First word"],
        [base + 25_000, "Second paragraph"],
        [base + 65_000, "Third paragraph"],
      ]);
  });

  test("records the submitted state, keeps notepad and flags, and stays scoped to the session", () => {
    const submittedAt = base + 30 * 60_000;
    const before = database.getResponseRevisionLog(sessionId, responseId)!.revisions.length;
    database.saveAndSubmitResponse(responseId, {
      answersJson: JSON.stringify({ q1: "Final answer" }),
      selectedQuestionId: "q1",
      flagsJson: JSON.stringify(["q1"]),
      notepad: "Check paragraph two",
    }, submittedAt);

    const revisions = database.getResponseRevisionLog(sessionId, responseId)!.revisions;
    expect(revisions).toHaveLength(before + 1);
    expect(revisions.at(-1)).toMatchObject({
      at: submittedAt,
      flagsJson: JSON.stringify(["q1"]),
      notepad: "Check paragraph two",
      selectedQuestionId: "q1",
    });

    expect(() => database.saveAndSubmitResponse(responseId, {
      answersJson: JSON.stringify({ q1: "Too late" }),
      selectedQuestionId: null,
      flagsJson: "[]",
      notepad: "",
    }, submittedAt + 1_000)).toThrow("Response is already submitted");
    expect(database.getResponseRevisionLog(sessionId, responseId)!.revisions).toHaveLength(before + 1);

    const otherSessionId = database.createExamSession(schoolClass.id, paper.id);
    expect(database.getResponseRevisionLog(otherSessionId, responseId)).toBeNull();
    expect(database.getResponseRevisionLog(sessionId, crypto.randomUUID())).toBeNull();
  });

  test("widens snapshot spacing once a response grows large", () => {
    const largeClass = database.createClass("Timeline Large");
    const largeStudent = database.createStudent({
      classId: largeClass.id,
      name: "Ink Student",
      extraMinutes: 0,
    });
    const largeSessionId = database.createExamSession(largeClass.id, paper.id);
    database.startExamSession(largeSessionId);
    const largeResponseId = database.getStudentExam(largeStudent.id, largeSessionId)!.responseId;
    const saveAt = (answerBytes: number, offsetMs: number) => database.saveResponse(largeResponseId, {
      answersJson: JSON.stringify({ q1: "x".repeat(answerBytes) }),
      selectedQuestionId: null,
      flagsJson: "[]",
      notepad: "",
    }, base + offsetMs);
    const times = () => database.getResponseRevisionLog(largeSessionId, largeResponseId)!.revisions.map((revision) => revision.at);

    saveAt(100_000, 0);
    saveAt(120_000, 25_000);
    // A drawing-heavy answer snapshots once a minute, so 25 seconds apart still coalesces.
    expect(times()).toEqual([base + 25_000]);
    saveAt(140_000, 70_000);
    expect(times()).toEqual([base + 25_000, base + 70_000]);
  });
});
