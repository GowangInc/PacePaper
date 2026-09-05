import { inkQuestion, samplePaper, textResource } from "../helpers.ts";
import type { FullMock } from "./types.ts";

export interface CambridgeItem {
  marks: number;
  topic: string;
  prompt: string;
  answer: string;
}

const coreFormulas = `Mathematical formula facts — independently typeset for this practice paper
Triangle: area = bh/2 (b is the base, h the perpendicular height).
Circle: area = πr²; circumference = 2πr (r is the radius).
Cylinder: curved surface area = 2πrh; volume = πr²h.
Cone: curved surface area = πrl; volume = πr²h/3 (l is slant height; h is perpendicular height).
Sphere: surface area = 4πr²; volume = 4πr³/3.
Prism: volume = cross-sectional area × length.
Pyramid: volume = base area × perpendicular height / 3.`;

const extendedFormulas = `${coreFormulas}
If ax² + bx + c = 0 and a ≠ 0: x = (−b ± √(b² − 4ac))/(2a).
In a triangle with sides a, b, c opposite angles A, B, C:
a/sin A = b/sin B = c/sin C;
a² = b² + c² − 2bc cos A;
area = ab sin C / 2.`;

export function cambridgeMock(number: 1 | 2 | 3 | 4, items: CambridgeItem[]): FullMock {
  const extended = number === 2 || number === 4;
  const calculator = number === 3 || number === 4;
  const level = extended ? "Extended" : "Core";
  const calculatorRule = calculator
    ? "A scientific calculator is required; algebraic and graphical calculators are not permitted. Retain unrounded values during calculations. Unless a question specifies otherwise, give non-exact numerical answers to three significant figures and angles in degrees to one decimal place. Use the calculator value of π or 3.142."
    : "Calculators are not permitted. Give exact answers unless a question specifies an approximation.";
  const maximumMarks = extended ? 100 : 80;
  const manifest = samplePaper({
    subject: "cambridge-igcse-mathematics-0580",
    subjectLabel: "Cambridge IGCSE Mathematics (0580)",
    level,
    paper: `Paper ${number} — original full-length mock (${calculator ? "calculator" : "non-calculator"})`,
    examFormat: {
      systemId: "cambridge-igcse",
      systemLabel: "Cambridge IGCSE",
      qualificationLabel: "Cambridge IGCSE Mathematics 0580",
      deliveryMode: "Paper-like digital practice",
      fidelity: "adapted",
      profileVersion: "2026-09-05",
      rulesSummary: `2025–2027 syllabus · ${level} · ${calculator ? "scientific calculator required; no algebraic/graphical calculator" : "no calculator"} · formula facts included · original full-length practice`,
    },
    durationMinutes: extended ? 120 : 90,
    readingTimeMinutes: 0,
    maximumMarks,
    mode: "reading",
    selectionMode: "all",
    instructions: `Original full-length practice: ${items.length} questions, ${maximumMarks} marks. This is not an official or endorsed Cambridge examination. Answer every question and all parts. Show your reasoning and calculations in the working canvas beneath each question; add pages when needed. ${calculatorRule} Formula facts are attached to every question. Draw and label your own axes where requested; one grid square may represent the scale stated in the question. Use straight ruled lines and smooth curves as appropriate. Dimensions stated in a question are exact unless described as rounded. There is no separate reading period.`,
    resources: [textResource("formula-facts", `${level} formula facts`, extended ? extendedFormulas : coreFormulas)],
    questions: items.map((item, index) => inkQuestion(
      `q${index + 1}`, `Question ${index + 1}`, item.prompt, item.marks, ["formula-facts"],
      item.marks >= 5 ? 2 : 1,
    )),
  });
  return {
    manifest,
    marking: items.map((item, index) => ({ questionId: `q${index + 1}`, marks: item.marks, topic: item.topic, answer: item.answer })),
    teacherNotes: [
      "Full raw-mark and time allocation, with original questions across the nine syllabus topic families. Topic weightings and question counts are this mock's blueprint, not a claimed fixed Cambridge allocation.",
      "Teacher-only marking companion: each bracketed allocation is a whole-mark allowance. Credit equivalent valid methods; a correct answer without visible working may not earn a method mark where the question explicitly requests reasoning. Follow-through must not reward an error that removes the assessed demand.",
      "All resources are self-contained mathematical facts and original data. Do not distribute this marking companion to candidates. No examination-board wording, logos, questions or copyrighted diagrams are reproduced.",
      "Digital adaptation: candidates construct graphs on a grid rather than receiving a preprinted grid. No compass construction or physically calibrated measurement task is included. Provide a stylus or suitable drawing input, and permitted physical geometry instruments if desired. This does not reproduce every feature of the paper examination.",
      "The questions and worked answers have been internally checked, but not independently moderated by an external mathematics teacher or calibrated against live grade boundaries. Teacher review is required before using results for consequential grading.",
    ],
    sources: [
      { title: "Cambridge IGCSE Mathematics 0580 syllabus, 2025–2027 (version 3)", url: "https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf" },
      { title: `Cambridge 0580 specimen Paper ${number}, examinations from 2025`, url: `https://www.cambridgeinternational.org/Images/${({ 1: "663662", 2: "663664", 3: "663666", 4: "663668" })[number]}-2025-specimen-paper-${number}.pdf` },
    ],
  };
}
