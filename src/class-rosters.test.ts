import { describe, expect, test } from "bun:test";
import { blankClassRosterCsv, encodeClassRosterCsv, parseClassRosterCsv } from "./class-rosters.ts";

describe("class-list CSV files", () => {
  test("round-trips multiple classes, Unicode names, commas and empty classes", () => {
    const csv = encodeClassRosterCsv(
      [
        { id: "english", name: "English A, M27" },
        { id: "biology", name: "Biology" },
      ],
      [
        { classId: "english", name: "Zoë Zhang", extraMinutes: 25 },
        { classId: "english", name: "Amy \"A\" Lee", extraMinutes: 0 },
      ],
    );

    expect(parseClassRosterCsv(csv)).toEqual([
      {
        name: "Biology",
        students: [],
      },
      {
        name: "English A, M27",
        students: [
          { name: "Amy \"A\" Lee", extraMinutes: 0 },
          { name: "Zoë Zhang", extraMinutes: 25 },
        ],
      },
    ]);
  });

  test("accepts reordered columns and harmless duplicate names", () => {
    expect(parseClassRosterCsv([
      "student_name,extra_minutes,class_name,notes",
      "Amy,10,English A,imported",
      "Amy,10,English A,duplicate",
    ].join("\n"))).toEqual([{
      name: "English A",
      students: [{ name: "Amy", extraMinutes: 10 }],
    }]);
  });

  test("rejects missing headings and conflicting duplicate names", () => {
    expect(() => parseClassRosterCsv("class_name,extra_minutes\nEnglish A,0\n"))
      .toThrow("missing the student_name column");
    expect(() => parseClassRosterCsv([
      blankClassRosterCsv().trim(),
      "English A,Amy,0",
      "English A,Amy Changed,0",
      "English A,Amy,10",
    ].join("\n"))).toThrow("student_name Amy has conflicting details in class English A");
  });

  test("validates every row before returning data", () => {
    expect(() => parseClassRosterCsv([
      blankClassRosterCsv().trim(),
      "English A,Amy,0",
      "Biology,Bo,181",
    ].join("\n"))).toThrow("Row 3: extra_minutes must be a whole number from 0 to 180");
  });

  test("guards spreadsheet formula cells without changing a later round trip", () => {
    const csv = encodeClassRosterCsv(
      [{ id: "class", name: "=Not a formula" }],
      [{ classId: "class", name: "+Student", extraMinutes: 0 }],
    );
    expect(csv).toContain("'=Not a formula");
    expect(parseClassRosterCsv(csv)).toEqual([{
      name: "=Not a formula",
      students: [{ name: "+Student", extraMinutes: 0 }],
    }]);
  });
});
