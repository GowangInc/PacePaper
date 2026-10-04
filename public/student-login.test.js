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
  test("sends only class and student names", () => {
    const payload = buildStudentLoginPayload(new Map([
      ["className", "English A"],
      ["studentName", "Sam Lee"],
      ["candidateCode", "must-not-leak"],
      ["pin", "ABCD-2345"],
      ["studentId", "must-not-leak"],
    ]));
    expect(payload).toEqual({ className: "English A", studentName: "Sam Lee" });
    expect(payload).not.toHaveProperty("pin");
    expect(payload).not.toHaveProperty("candidateCode");
    expect(payload).not.toHaveProperty("studentId");
  });

});

test("reuses the initial roster when rebuilding sign-in controls", async () => {
  const source = await Bun.file(new URL("./student.js", import.meta.url)).text();
  expect(source).toContain("function authFrame(bootstrap = studentBootstrap)");
  expect(source).toContain("studentBootstrap = bootstrap ?? {};");
  expect(source.match(/authFrame\(studentBootstrap\);/gu)?.length).toBe(3);
});
