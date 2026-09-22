export const CLASS_ROSTER_COLUMNS = [
  "class_name",
  "student_name",
  "extra_minutes",
] as const;

export interface ClassRosterStudentInput {
  name: string;
  extraMinutes: number;
}

export interface ClassRosterInput {
  name: string;
  students: ClassRosterStudentInput[];
}

export interface ClassRosterExportClass {
  id: string;
  name: string;
}

export interface ClassRosterExportStudent {
  classId: string;
  name: string;
  extraMinutes: number;
}

const MAX_CLASSES = 500;
const MAX_STUDENTS = 5_000;

export function identityKey(value: string): string {
  return value.trim().normalize("NFC").toLowerCase().normalize("NFC");
}

function parseCsvRows(source: string): string[][] {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;

  const finishField = () => {
    row.push(field);
    field = "";
    closedQuote = false;
  };
  const finishRow = () => {
    finishField();
    if (row.some((value) => value.trim())) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] as string;
    if (quoted) {
      if (character !== '"') {
        field += character;
      } else if (text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = false;
        closedQuote = true;
      }
      continue;
    }

    if (character === '"') {
      if (field || closedQuote) throw new Error(`CSV row ${rows.length + 1} contains an unexpected quote`);
      quoted = true;
    } else if (character === ",") {
      finishField();
    } else if (character === "\n" || character === "\r") {
      finishRow();
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      if (closedQuote && !/\s/u.test(character)) {
        throw new Error(`CSV row ${rows.length + 1} contains text after a closing quote`);
      }
      if (!closedQuote) field += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted value");
  if (field || row.length > 0) finishRow();
  return rows;
}

function cleanCell(value: string): string {
  const clean = value.trim();
  return clean.startsWith("'") && /^[=+\-@]/u.test(clean.slice(1, 2)) ? clean.slice(1) : clean;
}

function requiredCell(value: string, label: string, rowNumber: number, maxLength: number): string {
  const clean = cleanCell(value);
  if (!clean || clean.length > maxLength) throw new Error(`Row ${rowNumber}: ${label} is invalid`);
  return clean;
}

function parseExtraMinutes(value: string, rowNumber: number): number {
  const clean = cleanCell(value);
  if (!clean) return 0;
  const minutes = Number(clean);
  if (!/^\d+$/u.test(clean) || !Number.isInteger(minutes) || minutes < 0 || minutes > 180) {
    throw new Error(`Row ${rowNumber}: extra_minutes must be a whole number from 0 to 180`);
  }
  return minutes;
}

export function parseClassRosterCsv(source: string): ClassRosterInput[] {
  const rows = parseCsvRows(source);
  const header = rows.shift();
  if (!header) throw new Error("The class-list CSV is empty");

  const normalizedHeader = header.map((value) => value.trim().toLowerCase());
  const indexes = new Map(normalizedHeader.map((value, index) => [value, index]));
  for (const column of CLASS_ROSTER_COLUMNS) {
    if (!indexes.has(column)) throw new Error(`The CSV is missing the ${column} column`);
  }
  if (new Set(normalizedHeader).size !== normalizedHeader.length) throw new Error("The CSV contains a duplicate column heading");
  if (rows.length === 0) throw new Error("The CSV does not contain a class list");

  const rosters = new Map<string, ClassRosterInput>();
  const studentsByClass = new Map<string, Map<string, ClassRosterStudentInput>>();
  let studentCount = 0;
  const cell = (row: string[], column: typeof CLASS_ROSTER_COLUMNS[number]) => row[indexes.get(column) as number] ?? "";
  for (const [rowIndex, row] of rows.entries()) {
    const rowNumber = rowIndex + 2;
    if (row.length > normalizedHeader.length) throw new Error(`Row ${rowNumber}: too many columns`);
    const className = requiredCell(cell(row, "class_name"), "class_name", rowNumber, 100);
    const classKey = identityKey(className);
    const existingRoster = rosters.get(classKey);
    if (existingRoster && existingRoster.name !== className) {
      throw new Error(`Row ${rowNumber}: class_name ${className} has more than one spelling`);
    }
    if (!existingRoster) {
      if (rosters.size >= MAX_CLASSES) throw new Error(`A class-list CSV can contain at most ${MAX_CLASSES} classes`);
      rosters.set(classKey, { name: className, students: [] });
      studentsByClass.set(classKey, new Map());
    }

    const studentNameCell = cleanCell(cell(row, "student_name"));
    if (!studentNameCell) {
      if (cleanCell(cell(row, "extra_minutes"))) {
        throw new Error(`Row ${rowNumber}: extra_minutes requires a student name`);
      }
      continue;
    }

    const studentName = requiredCell(studentNameCell, "student_name", rowNumber, 100);
    const student = { name: studentName, extraMinutes: parseExtraMinutes(cell(row, "extra_minutes"), rowNumber) };
    const classmates = studentsByClass.get(classKey) as Map<string, ClassRosterStudentInput>;
    const duplicate = classmates.get(identityKey(studentName));
    if (duplicate && (duplicate.name !== student.name || duplicate.extraMinutes !== student.extraMinutes)) {
      throw new Error(`Row ${rowNumber}: student_name ${studentName} has conflicting details in class ${className}`);
    }
    if (!duplicate) {
      studentCount += 1;
      if (studentCount > MAX_STUDENTS) throw new Error(`A class-list CSV can contain at most ${MAX_STUDENTS} students`);
      classmates.set(identityKey(studentName), student);
      (rosters.get(classKey) as ClassRosterInput).students.push(student);
    }
  }

  return [...rosters.values()];
}

function spreadsheetSafe(value: string): string {
  return /^[=+\-@\t\r]/u.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number): string {
  const clean = spreadsheetSafe(String(value));
  return /[",\r\n]/u.test(clean) ? `"${clean.replaceAll('"', '""')}"` : clean;
}

export function encodeClassRosterCsv(
  classes: ClassRosterExportClass[],
  students: ClassRosterExportStudent[],
): string {
  const rows: Array<Array<string | number>> = [[...CLASS_ROSTER_COLUMNS]];
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  for (const schoolClass of [...classes].sort((left, right) => collator.compare(left.name, right.name))) {
    const classStudents = students
      .filter((student) => student.classId === schoolClass.id)
      .sort((left, right) => collator.compare(left.name, right.name));
    if (classStudents.length === 0) {
      rows.push([schoolClass.name, "", ""]);
      continue;
    }
    for (const student of classStudents) {
      rows.push([schoolClass.name, student.name, student.extraMinutes]);
    }
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function blankClassRosterCsv(): string {
  return `\uFEFF${CLASS_ROSTER_COLUMNS.join(",")}\r\n`;
}
