import { describe, expect, test } from "bun:test";
import { formatClassRosterImportResult } from "./class-rosters.js";

describe("class-list transfer", () => {
  test("summarizes creations, updates and idempotent matches", () => {
    expect(formatClassRosterImportResult({
      classesCreated: 1,
      classesUpdated: 2,
      classesUnchanged: 1,
      studentsCreated: 3,
      studentsUpdated: 4,
      studentsUnchanged: 5,
    })).toBe(
      "Class list imported: 1 class created, 2 classes updated, 3 students added, 4 students updated. 6 records were already current.",
    );
    expect(formatClassRosterImportResult({
      classesCreated: 0,
      classesUpdated: 0,
      classesUnchanged: 2,
      studentsCreated: 0,
      studentsUpdated: 0,
      studentsUnchanged: 20,
    })).toBe("Class list checked: 22 records were already current.");
  });
});
