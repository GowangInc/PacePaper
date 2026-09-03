import { describe, expect, test } from "bun:test";
import { blankClassRosterCsv, encodeClassRosterCsv, parseClassRosterCsv } from "./class-rosters.ts";

describe("class-list CSV files", () => {
  test("round-trips multiple classes, Unicode names, commas and empty classes", () => {
    const csv = encodeClassRosterCsv(
      [
        { id: "english", name: "English A, M27", code: "ENG-M27" },
        { id: "biology", name: "Biology", code: "BIO-M27" },
      ],
      [
        { classId: "english", name: "Zoë Zhang", candidateCode: "Z-002", extraMinutes: 25 },
        { classId: "english", name: "Amy \"A\" Lee", candidateCode: "A-001", extraMinutes: 0 },
      ],
    );

    expect(parseClassRosterCsv(csv)).toEqual([
      {
        name: "Biology",
        code: "BIO-M27",
        students: [],
      },
      {
        name: "English A, M27",
        code: "ENG-M27",
        students: [
          { name: "Amy \"A\" Lee", candidateCode: "A-001", extraMinutes: 0 },
          { name: "Zoë Zhang", candidateCode: "Z-002", extraMinutes: 25 },
        ],
      },
    ]);
  });

  test("accepts reordered columns and harmless duplicate rows", () => {
    expect(parseClassRosterCsv([
      "candidate_code,student_name,class_code,extra_minutes,class_name,notes",
      "A-001,Amy,ENG-M27,10,English A,imported",
      "A-001,Amy,ENG-M27,10,English A,duplicate",
    ].join("\n"))).toEqual([{
      name: "English A",
      code: "ENG-M27",
      students: [{ name: "Amy", candidateCode: "A-001", extraMinutes: 10 }],
    }]);
  });

  test("rejects missing headings and conflicting duplicate identities", () => {
    expect(() => parseClassRosterCsv("class_name,class_code\nEnglish A,ENG-M27\n"))
      .toThrow("missing the student_name column");
    expect(() => parseClassRosterCsv([
      blankClassRosterCsv().trim(),
      "English A,ENG-M27,Amy,A-001,0",
      "English A,ENG-M27,Amy Changed,A-001,0",
    ].join("\n"))).toThrow("candidate_code A-001 has conflicting student details");
  });

  test("validates every row before returning data", () => {
    expect(() => parseClassRosterCsv([
      blankClassRosterCsv().trim(),
      "English A,ENG-M27,Amy,A-001,0",
      "Biology,BIO-M27,Bo,B-001,181",
    ].join("\n"))).toThrow("Row 3: extra_minutes must be a whole number from 0 to 180");
  });

  test("guards spreadsheet formula cells without changing a later round trip", () => {
    const csv = encodeClassRosterCsv(
      [{ id: "class", name: "=Not a formula", code: "-ABC" }],
      [{ classId: "class", name: "+Student", candidateCode: "-01", extraMinutes: 0 }],
    );
    expect(csv).toContain("'=Not a formula");
    expect(parseClassRosterCsv(csv)).toEqual([{
      name: "=Not a formula",
      code: "-ABC",
      students: [{ name: "+Student", candidateCode: "-01", extraMinutes: 0 }],
    }]);
  });
});
