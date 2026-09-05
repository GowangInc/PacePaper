import { expect, test } from "bun:test";
import { endExamImpact } from "./admin-end-exam.js";

test("end confirmation names only remaining candidates and warns about extra time and last saves", () => {
  const impact = endExamImpact({ session: { paperTitle: "Biology Paper 2", className: "Class A" },
    responses: [{ studentName: "Alex", submittedAt: null }, { studentName: "Sam", submittedAt: 123 }] });
  expect(impact.title).toBe("End Biology Paper 2?");
  expect(impact.names).toEqual(["Alex"]);
  expect(impact.description).toContain("Class A · 1 student has not submitted");
  expect(impact.description).toContain("last saved responses");
  expect(impact.description).toContain("extra time");
  expect(impact.description).toContain("cannot be undone");
});
