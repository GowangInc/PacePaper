import { inkQuestion, samplePaper, textResource } from "../helpers.ts";
import type { FullMock } from "./types.ts";

/** Each item keeps the original question and teacher-only allocation beside one another. */
export type PearsonItem = readonly [topic: string, marks: number, prompt: string, answer: string];

export const PEARSON_SOURCES = [
  { title: "Pearson Mathematics A linear specification", url: "https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf" },
  { title: "Pearson Mathematics A modular specification, Issue 2", url: "https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2024/specification-and-sample-assessments/int-gcse-mathematics-spec-a-modular.pdf" },
  { title: "Pearson Mathematics A sample assessment materials", url: "https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-samsa.pdf" },
];

const FOUNDATION_FORMULAE = `Formula reference — independently typeset mathematical facts
Trapezium: area = ½(a + b)h, where a and b are parallel side lengths and h is perpendicular height.
Prism: volume = cross-sectional area × length.
Cylinder: volume = πr²h; curved surface area = 2πrh. Here r is radius and h is perpendicular height.`;

const HIGHER_FORMULAE = `${FOUNDATION_FORMULAE}
Arithmetic series: Sₙ = n[2a + (n − 1)d]/2, where a is the first term and d is the common difference.
Quadratic equation ax² + bx + c = 0 (a ≠ 0): x = [−b ± √(b² − 4ac)]/(2a).
Triangle ABC: sides a, b, c lie opposite angles A, B, C respectively.
Sine rule: a/sin A = b/sin B = c/sin C.
Cosine rule: a² = b² + c² − 2bc cos A.
Triangle area = ½ab sin C.
Right circular cone: volume = πr²h/3; curved surface area = πrl, where l is slant height.
Sphere: volume = 4πr³/3; surface area = 4πr².`;

export function pearsonMock(paper: string, level: "Foundation" | "Higher", modular: boolean, items: readonly PearsonItem[]): FullMock {
  const marks = items.reduce((total, item) => total + item[1], 0);
  if (marks !== 100 || items.length !== 22) throw new Error(`${paper}: expected 22 questions and 100 marks; got ${items.length}/${marks}`);
  const subjectLabel = `Pearson Edexcel International GCSE Mathematics A${modular ? " (Modular)" : ""}`;
  return {
    manifest: samplePaper({
      subject: `pearson-igcse-mathematics-a${modular ? "-modular" : ""}`,
      subjectLabel,
      level,
      paper: `${paper} — original full-length mock`,
      durationMinutes: 120,
      readingTimeMinutes: 0,
      maximumMarks: 100,
      subjectWeightPercent: 50,
      mode: "reading",
      selectionMode: "all",
      examFormat: {
        systemId: "pearson-edexcel-igcse",
        systemLabel: "Pearson Edexcel International GCSE",
        qualificationLabel: "Pearson Edexcel International GCSE",
        deliveryMode: "Full-length original paper with integrated digital working",
        fidelity: "adapted",
        profileVersion: "2026-09-05",
        rulesSummary: `${level} · 120 minutes · 100 marks · calculator permitted · tier-specific formula reference included · answer all 22 questions`,
      },
      instructions: "Answer all 22 questions. The total time is 2 hours; there is no separate reading period. Write your answer and all working in each question's response area; add pages if needed. A permitted scientific calculator may be used. The Formula reference attached to every question contains the tier-specific supplied formula facts. Draw your own labelled diagrams or graphs where requested; all necessary coordinates and measurements are provided. Do not infer measurements from a sketch. Use a suitable scale and label axes. Give units where appropriate. Keep unrounded working; give non-exact final numerical answers to 3 significant figures unless otherwise stated. This is an original DigitalDP practice paper, not a Pearson paper. Digital drawing is a classroom adaptation, not a test of physical ruler-and-compass accuracy.",
      resources: [textResource("formulae", `${level} formula reference`, level === "Foundation" ? FOUNDATION_FORMULAE : HIGHER_FORMULAE)],
      questions: items.map(([topic, value, prompt], index) => inkQuestion(`q${index + 1}`, `Question ${index + 1} — ${topic}`, prompt, value, ["formulae"])),
    }),
    marking: items.map(([topic, value, , answer], index) => ({ questionId: `q${index + 1}`, topic, marks: value, answer })),
    teacherNotes: [
      "Original full-length workload: 22 multipart questions, 100 marks, 120 minutes. This is not a shortened demonstration with a full clock.",
      "Matching Foundation/Higher components share 40 marks deliberately; the other 60 marks differ by tier. Do not reuse the other tier as an unseen second mock for the same class.",
      "Blueprint: 60 marks number/algebra, 25 geometry/measures, 15 handling data. Question count is an authoring choice, not a claim of a fixed Pearson count.",
      "M = method, A = accurate dependent result, B = independent fact/reason. Award equivalent valid methods. Unless stated otherwise, accept sensible equivalent rounding; avoid double penalties for a single carried error. The point-by-point guide is teacher-only and is not included in the student manifest or portable paper.",
      "Provide a permitted scientific calculator. Prohibited facilities include symbolic algebra/calculus, text/formula retrieval, databanks and QWERTY keyboards. Original formula-reference typesetting follows the mathematical facts in the specification's tier appendix; it adds no worked examples.",
      "All geometry is specified in words/coordinates. Digital sketches replace printed diagrams and precise instrument constructions; do a separate physical construction exercise for authentic instrument practice. No external image or worksheet is required to answer this mock.",
      "The stated three-significant-figure default is this mock's explicit marking convention, not a claim of a universal Pearson cover instruction. Question-specific precision overrides it. Retain exact bounds if rounding would change an inequality boundary.",
      "Full length does not mean awarding-body endorsement or statistical equivalence. A subject teacher should moderate difficulty, pacing, accessibility and marks before a consequential assessment. Do not apply published grade boundaries to these original papers.",
      ...(modular ? ["Topic placement follows the modular Issue 2 content lists. Unit 2 assumes relevant Unit 1 knowledge; Unit 1 does not depend on Unit 2-only calculus, vectors, transformations, statistical averages or cumulative frequency."] : []),
    ],
    sources: PEARSON_SOURCES,
  };
}
