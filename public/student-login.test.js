import { describe, expect, mock, test } from "bun:test";

mock.module("/app.js", () => ({
  ApiError: class ApiError extends Error {},
  announce() {},
  api() {},
  connectSocket() {},
  formatTime(value) { return String(value); },
  humanSubject(value) { return value; },
  setView() {},
}));

const { buildStudentLoginPayload } = await import("./student.js");

describe("student candidate login", () => {
  test("sends names and the teacher-issued PIN without unrelated form data", () => {
    const payload = buildStudentLoginPayload(new Map([
      ["className", "English A"],
      ["studentName", "Sam Lee"],
      ["candidateCode", "must-not-leak"],
      ["pin", "ABCD-2345"],
      ["studentId", "must-not-leak"],
    ]));
    expect(payload).toEqual({ className: "English A", studentName: "Sam Lee", pin: "ABCD-2345" });
  });

});
