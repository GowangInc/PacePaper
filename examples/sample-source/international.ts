import type { ExamPhase, PaperManifest, PaperQuestion } from "../../src/papers.ts";
import { FULL_MOCKS } from "./full-mocks/index.ts";
import { choiceQuestion, essayQuestion, inkQuestion, samplePaper, shortQuestion, textResource } from "./helpers.ts";

function section<T extends PaperQuestion>(question: T, sectionId: string): T {
  return { ...question, sectionId };
}

function format(
  systemId: string,
  systemLabel: string,
  qualificationLabel: string,
  deliveryMode: string,
  rulesSummary: string,
) {
  return {
    systemId,
    systemLabel,
    qualificationLabel,
    deliveryMode,
    fidelity: "adapted" as const,
    profileVersion: "2026-09-05",
    rulesSummary,
  };
}

function apFormat(course: string, deliveryMode: string, rulesSummary: string) {
  return format("ap", "Advanced Placement (AP)", "Advanced Placement", deliveryMode, `May 2027 ${course} · ${rulesSummary}`);
}

const englishSource = textResource(
  "civic-source",
  "Original source set — public shade structures",
  "Source A: A city survey found that shaded bus stops were used 28% more often during summer afternoons than unshaded stops.\n\nSource B: A maintenance report estimated that each shade structure would require inspection twice a year and replacement fabric every eight years.\n\nSource C: A resident wrote that shade is a basic accessibility measure for older passengers, young children and people whose medication increases heat sensitivity.\n\nSource D: A budget statement warned that installing structures at every stop would delay planned pavement repairs.\n\nSource E: A transit planner proposed beginning with stops that combine high ridership, long waits and little natural shade, then reviewing usage after one summer.\n\nSource F: A neighbourhood association argued that small street trees would cool a wider area and improve air quality, although they would take years to mature and could not be planted at every stop.",
);

function apEnglishPhases(): ExamPhase[] {
  const minutes = [2, 1, 5];
  return [
    { id: "section-1", label: "Section I — multiple choice", kind: "work", durationMinutes: minutes[0]!, sectionId: "section-1", tools: ["Digital multiple-choice", "Text highlighting", "Mark for review"], instructions: "Complete Section I. You cannot return after this section ends." },
    { id: "break", label: "Monitored break", kind: "break", durationMinutes: minutes[1]!, tools: [], instructions: "Student entry and examination content are locked during the break." },
    { id: "section-2", label: "Section II — free response", kind: "work", durationMinutes: minutes[2]!, sectionId: "section-2", tools: ["Typed free response", "Text highlighting", "Optional reading period"], instructions: "Complete the free-response tasks. The recommended reading period is optional, so you may begin writing immediately. Section I remains locked." },
  ];
}

function apEnglishSample(): PaperManifest {
  const phases = apEnglishPhases();
  return samplePaper({
    examFormat: apFormat("English Language and Composition", "Fully digital practice", "locked sections · fixed monitored break · typed free response"),
    subject: "ap-english-language-composition",
    subjectLabel: "AP English Language and Composition",
    level: "AP",
    paper: "End-of-course exam — original 8-minute walkthrough",
    durationMinutes: phases.reduce((sum, phase) => sum + phase.durationMinutes, 0),
    readingTimeMinutes: 0,
    phases,
    maximumMarks: 21,
    mode: "essay",
    instructions: `This demonstration has 3 multiple-choice questions and 3 essay tasks. It uses an 8-minute classroom walkthrough clock with a 1-minute break. It is not a full mock examination: the real exam has 45 multiple-choice questions and substantial source passages. Complete each section in order. The reading/planning period within free response is optional; you may start writing immediately. DigitalDP opens the next section automatically after the fixed break.`,
    selectionMode: "all",
    resources: [englishSource],
    questions: [
      section(choiceQuestion("q1", "Section I — Question 1", "Which source most directly frames shade as an issue of equitable access?", ["Source A", "Source B", "Source C", "Source D"], 1, ["civic-source"]), "section-1"),
      section(choiceQuestion("q2", "Section I — Question 2", "Which pair of sources presents the clearest tension between immediate benefit and opportunity cost?", ["A and C", "A and D", "B and C", "B and D"], 1, ["civic-source"]), "section-1"),
      section(choiceQuestion("q3", "Section I — Question 3", "The numerical evidence in Source A would be most strengthened by information about", ["the colour of each bus", "weather and ridership controls", "the author's education", "fabric manufacturers"], 1, ["civic-source"]), "section-1"),
      section(essayQuestion("q4", "Section II — Synthesis", "Write an argument that uses evidence from at least three sources to develop a position on how a city should prioritize shade structures at public-transport stops.", 6, ["civic-source"]), "section-2"),
      section(essayQuestion("q5", "Section II — Rhetorical analysis", "Analyze how the writer of Source C uses rhetorical choices to present shade as a public responsibility rather than a convenience.", 6, ["civic-source"]), "section-2"),
      section(essayQuestion("q6", "Section II — Argument", "Write an argument that develops your position on whether public projects should prioritize the greatest total benefit or the needs of people facing the greatest barriers.", 6), "section-2"),
    ],
  });
}

const biologyData = textResource(
  "population-data",
  "Original population study",
  "Researchers grew a freshwater alga at four nitrate concentrations. Each treatment had six independent cultures.\nNitrate (mg L⁻¹): 0, 2, 5, 10\nMean growth rate (day⁻¹): 0.08, 0.19, 0.31, 0.30\nStandard error: 0.01, 0.02, 0.02, 0.03",
);

function threePhasePlan(): ExamPhase[] {
  const minutes = [3, 1, 3];
  return [
    { id: "section-1", label: "Section I — multiple choice", kind: "work", durationMinutes: minutes[0]!, sectionId: "section-1", tools: ["Scientific nongraphing or four-function calculator", "AP Biology equations and formulas sheet", "Digital multiple-choice"], instructions: "Complete Section I. Handheld graphing calculators and other handheld calculators with storage capabilities are not allowed. You cannot return after this section ends." },
    { id: "break", label: "Monitored break", kind: "break", durationMinutes: minutes[1]!, tools: [], instructions: "Student entry and examination content are locked during the break." },
    { id: "section-2", label: "Section II — free response", kind: "work", durationMinutes: minutes[2]!, sectionId: "section-2", tools: ["Scientific nongraphing or four-function calculator", "AP Biology equations and formulas sheet", "Physical response booklet or digital canvas"], instructions: "Complete the free-response questions in the response area directed by your teacher. Handheld graphing calculators and other handheld calculators with storage capabilities are not allowed." },
  ];
}

function apBiologySample(): PaperManifest {
  const phases = threePhasePlan();
  return samplePaper({
    examFormat: apFormat("Biology", "Hybrid digital/paper practice", "locked sections · nongraphing calculator · teacher-supplied equations and formulas sheet · fixed monitored break"),
    subject: "ap-biology",
    subjectLabel: "AP Biology",
    level: "AP",
    paper: "End-of-course exam — original 7-minute walkthrough",
    durationMinutes: phases.reduce((sum, phase) => sum + phase.durationMinutes, 0),
    readingTimeMinutes: 0,
    phases,
    maximumMarks: 37,
    mode: "reading",
    instructions: `This demonstration has 3 multiple-choice questions and 6 free-response questions on one biology topic. It uses a 7-minute classroom walkthrough clock with a 1-minute break. It is not a full mock examination: the real exam has 60 multiple-choice questions and broader topic coverage. Before starting, your teacher should supply the current AP Biology equations and formulas sheet and a four-function calculator with square root or a scientific nongraphing calculator. For May 2027, handheld graphing calculators and other handheld calculators with storage capabilities are not allowed. Bluebook offers Desmos scientific; DigitalDP uses your supplied calculator. Complete Section I digitally and Section II in the supplied practice booklet or digital canvas. DigitalDP opens the next section automatically after the fixed break.`,
    selectionMode: "all",
    resources: [biologyData],
    questions: [
      section(choiceQuestion("q1", "Section I — Question 1", "Which conclusion is best supported by the overlap in standard-error ranges at 5 and 10 mg L⁻¹ nitrate?", ["Growth certainly declines above 5 mg L⁻¹", "The two means may not differ detectably", "Nitrate has no effect", "All cultures grew at the same rate"], 1, ["population-data"]), "section-1"),
      section(choiceQuestion("q2", "Section I — Question 2", "Which change would best test whether light limits growth at 10 mg L⁻¹ nitrate?", ["Increase replication only", "Vary light while holding nitrate constant", "Remove the zero-nitrate group", "Measure nitrate once"], 1, ["population-data"]), "section-1"),
      section(choiceQuestion("q3", "Section I — Question 3", "The nitrate taken up by the alga is most directly used to synthesize", ["amino acids", "fatty acids only", "cellulose only", "water"], 1), "section-1"),
      section(inkQuestion("q4", "Section II — Question 1: experimental results", "Describe the relationship between nitrate concentration and algal growth, propose a cellular explanation for the plateau, and evaluate whether the data support a causal conclusion.", 9, ["population-data"], 2), "section-2"),
      section(inkQuestion("q5", "Section II — Question 2: graphing", "Graph the means with correctly labelled axes and error bars. Use the graph to identify a nitrate range for a follow-up treatment and justify the choice.", 9, ["population-data"], 2), "section-2"),
      section(inkQuestion("q6", "Section II — Question 3: scientific investigation", "Design a follow-up investigation that tests whether light limits growth at 10 mg L⁻¹ nitrate. State the independent variable, controls, replication, measurement and predicted result.", 4, ["population-data"], 1, "lined"), "section-2"),
      section(inkQuestion("q7", "Section II — Question 4: conceptual analysis", "Explain how nitrate uptake can affect protein synthesis and therefore population growth in the alga.", 4, [], 1, "lined"), "section-2"),
      section(inkQuestion("q8", "Section II — Question 5: model analysis", "Construct and label a model showing how nitrate availability, amino-acid synthesis and cell division could produce the observed growth response. Identify one limitation of the model.", 4, ["population-data"], 1, "blank"), "section-2"),
      section(inkQuestion("q9", "Section II — Question 6: data analysis", "Calculate the percentage increase in mean growth rate from 0 to 5 mg L⁻¹ nitrate. Use the standard-error values to explain one limitation of comparing only the two means.", 4, ["population-data"], 1, "lined"), "section-2"),
    ],
  });
}

function calculusPhases(): ExamPhase[] {
  const minutes = [1, 1, 1, 1, 1];
  return [
    { id: "section-1a", label: "Section I, Part A", kind: "work", durationMinutes: minutes[0]!, sectionId: "section-1a", tools: ["Calculator not permitted", "Digital multiple-choice"] },
    { id: "section-1b", label: "Section I, Part B", kind: "work", durationMinutes: minutes[1]!, sectionId: "section-1b", tools: ["Approved graphing calculator required", "Digital multiple-choice"] },
    { id: "break", label: "Monitored break", kind: "break", durationMinutes: minutes[2]!, tools: [], instructions: "Student entry and examination content are locked during the break." },
    { id: "section-2a", label: "Section II, Part A", kind: "work", durationMinutes: minutes[3]!, sectionId: "section-2a", tools: ["Approved graphing calculator required", "Physical response booklet or digital canvas"] },
    { id: "section-2b", label: "Section II, Part B", kind: "work", durationMinutes: minutes[4]!, sectionId: "section-2b", tools: ["Calculator not permitted", "Physical response booklet or digital canvas"] },
  ];
}

function apCalculusSample(): PaperManifest {
  const phases = calculusPhases();
  return samplePaper({
    examFormat: apFormat("Calculus AB", "Hybrid digital/paper practice", "four locked parts · part-specific graphing-calculator rule · fixed monitored break"),
    subject: "ap-calculus-ab",
    subjectLabel: "AP Calculus AB",
    level: "AP",
    paper: "End-of-course exam — original 5-minute walkthrough",
    durationMinutes: phases.reduce((sum, phase) => sum + phase.durationMinutes, 0),
    readingTimeMinutes: 0,
    phases,
    maximumMarks: 58,
    mode: "reading",
    instructions: `This demonstration has 4 multiple-choice questions (2 in each part) and 6 free-response questions. It uses a 5-minute classroom walkthrough clock with a 1-minute break. It is not a full mock examination: the May 2027 exam has 42 multiple-choice questions. Follow the calculator rule shown for each part. Before starting, your teacher should supply an approved handheld graphing calculator for Parts I-B and II-A. Real Bluebook exams also offer Desmos graphing during those parts; DigitalDP uses your supplied calculator. Complete free-response work in the booklet or digital canvas directed by your teacher. DigitalDP opens the next section automatically after the fixed break.`,
    selectionMode: "all",
    resources: [],
    questions: [
      section(choiceQuestion("q1", "Section I, Part A — Question 1", "If f(x) = x³ − 3x, what is f′(2)?", ["3", "6", "9", "12"], 1), "section-1a"),
      section(choiceQuestion("q2", "Section I, Part A — Question 2", "The average value of g on [0, 4] is", ["∫₀⁴g(x)dx", "(1/4)∫₀⁴g(x)dx", "g(4) − g(0)", "g′(2)"], 1), "section-1a"),
      section(choiceQuestion("q3", "Section I, Part B — Question 3", "A solution to cos x = x/3 on [0, 3] is closest to", ["0.42", "0.91", "1.17", "2.84"], 1), "section-1b"),
      section(choiceQuestion("q4", "Section I, Part B — Question 4", "For h(x) = x e^(−x), the absolute maximum on [0, 5] occurs closest to x =", ["0", "1", "2.5", "5"], 1), "section-1b"),
      section(inkQuestion("q5", "Section II, Part A — Question 1", "Let R be the region bounded by y = ln(x + 1), y = 0 and x = 3. Find its area and the volume formed when R is revolved about the x-axis. Give decimal answers to three places.", 9, [], 2), "section-2a"),
      section(inkQuestion("q6", "Section II, Part A — Question 2", "A particle has velocity v(t) = t² sin(t) for 0 ≤ t ≤ 5. Find its displacement and total distance travelled. State the times when it changes direction.", 9, [], 2), "section-2a"),
      section(inkQuestion("q7", "Section II, Part B — Question 3", "A differentiable function satisfies dy/dx = (x + 1)y and y(0) = 2. Find d²y/dx² at x = 0 and solve the differential equation for y.", 9, [], 2), "section-2b"),
      section(inkQuestion("q8", "Section II, Part B — Question 4", "The base of a solid is the region bounded by y = 4 − x² and the x-axis. Cross-sections perpendicular to the x-axis are squares. Write, but do not evaluate, an integral for the volume and explain each limit.", 9, [], 2), "section-2b"),
      section(inkQuestion("q9", "Section II, Part B — Question 5", "Let f(x) = x³ − 6x² + 9x + 1 on the interval [−1, 5]. Find all critical points, determine the intervals on which f is increasing, and identify the absolute maximum and minimum values.", 9, [], 2), "section-2b"),
      section(inkQuestion("q10", "Section II, Part B — Question 6", "The region in the first quadrant bounded by y = 2x and y = x² is revolved about the x-axis. Find the area of the region and the exact volume of the resulting solid.", 9, [], 2), "section-2b"),
    ],
  });
}

export const INTERNATIONAL_SAMPLE_COURSE_IDS = [
  "cambridge-igcse-mathematics-0580",
  "pearson-igcse-mathematics-a",
  "pearson-igcse-mathematics-a-modular",
  "ap-english-language-composition",
  "ap-biology",
  "ap-calculus-ab",
] as const;

export const INTERNATIONAL_SAMPLE_PAPERS = [
  ...FULL_MOCKS.map(({ manifest }) => manifest),
  apEnglishSample(),
  apBiologySample(),
  apCalculusSample(),
];
