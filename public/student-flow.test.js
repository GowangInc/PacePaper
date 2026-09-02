import { describe, expect, mock, test } from "bun:test";

mock.module("/app.js", () => ({
  ApiError: class ApiError extends Error {},
  announce() {},
  api() {},
  connectSocket() {},
  setView() {},
}));

const { parseStudentSessionList, shouldResetStudentSelection, studentSessionState } = await import("./student.js");
const source = await Bun.file(new URL("./student.js", import.meta.url)).text();

const session = (overrides = {}) => ({
  id: "session-1",
  paperId: "paper-1",
  paperTitle: "English A Paper 1",
  subjectLabel: "English A: Language and Literature",
  level: "SL",
  paper: "Paper 1",
  durationMinutes: 75,
  readingTimeMinutes: 5,
  status: "draft",
  startedAt: null,
  endedAt: null,
  createdAt: 1,
  responseId: null,
  submittedAt: null,
  ...overrides,
});

describe("student examination list", () => {
  test("keeps two sessions with the same paper as separate choices", () => {
    const sessions = parseStudentSessionList({
      sessions: [
        session({ id: "new-sitting" }),
        session({ id: "old-sitting", status: "ended", responseId: "response-1", submittedAt: 100 }),
      ],
    });

    expect(sessions.map(({ id }) => id)).toEqual(["new-sitting", "old-sitting"]);
    expect(studentSessionState(sessions[0])).toBe("Waiting for teacher");
    expect(studentSessionState(sessions[1])).toBe("Completed");
  });

  test("distinguishes an unsubmitted live sitting from a submitted one", () => {
    expect(studentSessionState(session({ status: "live", responseId: "response-1" }))).toBe("In progress");
    expect(studentSessionState(session({ status: "live", responseId: "response-1", submittedAt: 100 }))).toBe("Submitted");
  });

  test("rejects malformed or ambiguous session records", () => {
    expect(() => parseStudentSessionList({ sessions: [session({ id: undefined })] })).toThrow();
    expect(() => parseStudentSessionList({ sessions: [session({ status: "ready" })] })).toThrow();
    expect(() => parseStudentSessionList({ sessions: [session({ submittedAt: undefined })] })).toThrow();
  });

  test("returns a waiting student to selection when their sitting is removed", () => {
    expect(shouldResetStudentSelection({ status: "selecting", selectionReset: true })).toBe(true);
    expect(shouldResetStudentSelection({ status: "selecting" })).toBe(false);
    expect(shouldResetStudentSelection({ status: "waiting", selectionReset: true })).toBe(false);
    expect(source).toContain("if (selectionReset) selectedSessionId = null");
    expect(source).toContain("if (selectionReset || !current");
  });

  test("tells students that saved notes are separate from answers but included in the teacher PDF", async () => {
    const examSource = await Bun.file(new URL("./exam.js", import.meta.url)).text();
    expect(examSource).toContain("Notes are saved separately from answers and included in the teacher's PDF record.");
  });
});
