import { expect, test } from "bun:test";
import { endExamImpact } from "./admin-end-exam.js";

test("end confirmation requires attention only for devices without a final save", () => {
  const impact = endExamImpact({
    unresolvedCandidates: [
      { name: "Alex", state: "pending" },
    ],
  });
  expect(impact.title).toBe("End despite unresolved candidates?");
  expect(impact.names).toEqual(["Alex"]);
  expect(impact.description).toContain("1 candidate device has not confirmed");
});
