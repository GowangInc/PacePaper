import { describe, expect, mock, test } from "bun:test";

mock.module("/app.js", () => ({
  ApiError: class ApiError extends Error {},
  announce() {},
  api() {},
  connectSocket() {},
  setView() {},
}));

const { buildStudentLoginPayload, parseStudentRoster } = await import("./student.js");

describe("student name login", () => {
  test("accepts the class-scoped roster contract, including an empty class", () => {
    const students = [{ id: "student-1", name: "Alex Chen" }];
    expect(parseStudentRoster({ students })).toEqual(students);
    expect(parseStudentRoster({ students: [] })).toEqual([]);
  });

  test("rejects malformed roster responses", () => {
    expect(() => parseStudentRoster([{ id: "student-1", name: "Alex Chen" }])).toThrow();
    expect(() => parseStudentRoster({ students: [{ id: "student-1" }] })).toThrow();
  });

  test("sends only the class code and selected student ID", () => {
    const payload = buildStudentLoginPayload(new Map([
      ["classCode", "M28-ENG"],
      ["studentId", "student-1"],
      ["pin", "0427"],
      ["candidateCode", "must-not-leak"],
    ]));
    expect(payload).toEqual({ classCode: "M28-ENG", studentId: "student-1" });
  });

  test("renders roster sign-in without a PIN field", async () => {
    const source = await Bun.file(new URL("./student.js", import.meta.url)).text();
    expect(source).toContain("then choose your name");
    expect(source).not.toContain('name="pin"');
  });
});
