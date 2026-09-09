import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// An exact bundled v1 fixture, retained independently of regenerated current examples.
const legacy = {
  version: 1,
  assessmentSession: "digitaldp-original-examples-v1",
  sourceClassification: "teacher-authored",
  exportAuthorized: true,
  title: "English B · Paper 1 — original productive-skills sample",
  subject: "english-b",
  subjectLabel: "English B",
  level: "SL",
  paper: "Paper 1 — original productive-skills sample",
  durationMinutes: 75,
  readingTimeMinutes: 5,
  maximumMarks: 30,
  mode: "essay",
  instructions: "Choose one task. Use an appropriate text type and write 250–400 words. Enter the response in DigitalDP; no separate answer sheet is used.",
  selectionMode: "one",
  resources: [],
  questions: [
    { id: "q1", label: "Task 1", prompt: "Your town plans to replace a small public park with a car park. Write a letter to the local council explaining your position and proposing a practical alternative.", type: "essay", resourceKeys: [], marks: 30, wordCountMin: 250, wordCountMax: 400 },
    { id: "q2", label: "Task 2", prompt: "You recently completed one week without using food-delivery apps. Write a blog post for other students describing the experience and evaluating whether you will continue.", type: "essay", resourceKeys: [], marks: 30, wordCountMin: 250, wordCountMax: 400 },
    { id: "q3", label: "Task 3", prompt: "Your school wants students to welcome new classmates more effectively. Write a set of guidelines for student mentors, explaining what they should do during a new student’s first month.", type: "essay", resourceKeys: [], marks: 30, wordCountMin: 250, wordCountMax: 400 },
  ],
};

function runScenario(body: string): void {
  const directory = mkdtempSync(join(tmpdir(), "digitaldp-sample-seed-test-"));
  const script = `
    import assert from "node:assert/strict";
    import * as database from ${JSON.stringify(join(import.meta.dir, "db.ts"))};
    import { seedCourseSamplePapers as seed } from ${JSON.stringify(join(import.meta.dir, "course-sample-seed.ts"))};
    import { COURSE_SAMPLE_PAPERS } from ${JSON.stringify(join(import.meta.dir, "../examples/sample-source/index.ts"))};
    const legacy = ${JSON.stringify(legacy)};
    const next = JSON.parse(JSON.stringify(COURSE_SAMPLE_PAPERS.find(paper => paper.subject === "english-b" && paper.level === "SL")));
    const create = manifest => database.createPaper({ manifest, assets: [] }).id;
    const read = id => database.db.query("SELECT * FROM papers WHERE id = ?").get(id);
    const count = () => database.db.query("SELECT COUNT(*) AS count FROM papers").get().count;
    ${body}
    database.db.close();
  `;
  try {
    const result = Bun.spawnSync([process.execPath, "-e", script], {
      env: { ...process.env, DIGITALDP_DB: join(directory, "test.sqlite") },
      stdout: "pipe", stderr: "pipe",
    });
    expect(result.exitCode, new TextDecoder().decode(result.stderr)).toBe(0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("safe bundled-demo migration", () => {
  test("upgrades an unedited v1 generic title in place and then remains idempotent", () => runScenario(`
    legacy.title = "English B · DigitalDP Example 1";
    const id = create(legacy);
    assert.equal(seed([next]).updated, 1);
    assert.equal(count(), 1);
    assert.deepEqual(JSON.parse(read(id).manifest_json), next);
    assert.equal(read(id).title, next.title);
    assert.equal(seed([next]).unchanged, 1);
    assert.equal(count(), 1);
  `));

  test("preserves legacy question edits, renamed copies and added assets", () => runScenario(`
    const edited = structuredClone(legacy);
    edited.questions[0].prompt = "Teacher's locally written task";
    const editedId = create(edited);
    const renamed = { ...legacy, title: "Mr Lee's lesson paper" };
    const renamedId = create(renamed);
    const assetId = create(legacy);
    database.db.query("INSERT INTO paper_assets (id,paper_id,asset_key,filename,mime,data) VALUES (?,?,?,?,?,?)")
      .run("teacher-asset", assetId, "extra", "notes.txt", "text/plain", new Uint8Array([1,2,3]));
    const before = [editedId, renamedId, assetId].map(read);
    const result = seed([next]);
    assert.equal(result.created, 1);
    assert.equal(result.updated, 0);
    assert.equal(result.conflicts, 3);
    assert.deepEqual([editedId, renamedId, assetId].map(read), before);
    assert.equal(database.db.query("SELECT COUNT(*) AS count FROM paper_assets").get().count, 1);
    assert.equal(seed([next]).unchanged, 1);
    assert.equal(count(), 4);
  `));

  test("protects draft, live and ended sessions, manifests and responses while labelling earlier demos", () => runScenario(`
    const ids = [];
    for (const status of ["draft", "live", "ended"]) {
      const paperId = create(legacy);
      ids.push(paperId);
      const classroom = database.createClass(status, status);
      const student = database.createStudent({ classId: classroom.id, name: "Learner", candidateCode: "L1", extraMinutes: 0 });
      const sessionId = database.createExamSession(classroom.id, paperId);
      if (status !== "draft") {
        database.startExamSession(sessionId);
        database.db.query("UPDATE responses SET answers_json = ?, notepad = ? WHERE session_id = ?")
          .run(JSON.stringify({ q1: "A student's saved response" }), "Saved notes", sessionId);
        if (status === "ended") database.endExamSession(sessionId);
      }
    }
    const sessionBefore = database.db.query("SELECT * FROM exam_sessions ORDER BY id").all();
    const responseBefore = database.db.query("SELECT * FROM responses ORDER BY id").all();
    const manifestBefore = ids.map(id => read(id).manifest_json);
    const result = seed([next]);
    assert.equal(result.created, 1);
    assert.equal(result.protectedBySession, 3);
    assert.equal(result.superseded, 3);
    assert.deepEqual(ids.map(id => read(id).manifest_json), manifestBefore);
    assert.ok(ids.every(id => read(id).title.endsWith(" · earlier demo version")));
    assert.deepEqual(database.db.query("SELECT * FROM exam_sessions ORDER BY id").all(), sessionBefore);
    assert.deepEqual(database.db.query("SELECT * FROM responses ORDER BY id").all(), responseBefore);
    assert.equal(seed([next]).unchanged, 1);
    assert.equal(seed([next]).superseded, 0);
    assert.equal(count(), 4);
  `));

  test("uses receipts to upgrade future revisions while preserving subsequent teacher edits", () => runScenario(`
    seed([next]);
    const id = database.db.query("SELECT id FROM papers").get().id;
    const revised = { ...next, assessmentSession: "digitaldp-original-examples-v3", paper: "Paper 1 — refreshed demonstration", title: "English B · Paper 1 — refreshed demonstration" };
    assert.equal(seed([revised]).updated, 1);
    assert.equal(count(), 1);
    assert.deepEqual(JSON.parse(read(id).manifest_json), revised);
    const edited = { ...revised, instructions: "Teacher changed the instructions" };
    database.db.query("UPDATE papers SET manifest_json = ? WHERE id = ?").run(JSON.stringify(edited), id);
    const before = read(id);
    const newer = { ...revised, durationMinutes: revised.durationMinutes + 1 };
    assert.equal(seed([newer]).created, 1);
    assert.deepEqual(read(id), before);
    assert.equal(seed([newer]).unchanged, 1);
    assert.equal(count(), 2);
  `));

  test("cleans up known historical labels even when the current sample already exists", () => runScenario(`
    const oldId = create(legacy);
    const currentId = create(next);
    const result = seed([next]);
    assert.equal(result.unchanged, 1);
    assert.equal(result.superseded, 1);
    assert.equal(read(currentId).title, next.title);
    assert.equal(read(oldId).manifest_json, JSON.stringify(legacy));
    assert.ok(read(oldId).title.endsWith(" · earlier demo version"));
    assert.equal(count(), 2);
  `));

  test("seeds all courses without conflating tiers, components or AP walkthroughs", () => runScenario(`
    assert.equal(seed(COURSE_SAMPLE_PAPERS).created, COURSE_SAMPLE_PAPERS.length);
    assert.equal(seed(COURSE_SAMPLE_PAPERS).unchanged, COURSE_SAMPLE_PAPERS.length);
    assert.equal(count(), COURSE_SAMPLE_PAPERS.length);
    assert.throws(() => seed([next, next]), /unique course, level and component/);
    assert.equal(count(), COURSE_SAMPLE_PAPERS.length);
  `));
});
