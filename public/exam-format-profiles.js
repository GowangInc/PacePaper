const WRITTEN_WORKING = {
  mode: "reading",
  readingTime: 0,
  selectionMode: "all",
  materials: ["pdf", "text"],
  responseTypes: ["short", "ink"],
  question: {
    type: "ink",
    prompt: "Enter your answer and show all required working.",
    inkPages: 1,
    inkBackground: "square-grid",
  },
};

function formatPaper(value, label, levels, overrides = {}) {
  return {
    value,
    label,
    levels,
    profileVersion: "2026-09-05",
    fidelity: "official-format",
    ...WRITTEN_WORKING,
    ...overrides,
    question: { ...WRITTEN_WORKING.question, ...(overrides.question ?? {}) },
  };
}

const CAMBRIDGE_MATHEMATICS = {
  value: "cambridge-igcse-mathematics-0580",
  label: "Mathematics (0580)",
  papers: [
    formatPaper("paper-1", "Paper 1 — Non-calculator (Core)", ["Core"], {
      sessions: ["2026", "2027", "custom"],
      duration: 90,
      maximumMarks: 80,
      subjectWeightPercent: 50,
      deliveryFormat: "Paper-like digital practice",
      toolSummary: "No calculator · current 0580 formula list supplied · structured and unstructured questions · digital working canvas",
      instructions: "Answer all questions. Calculators must not be used. Show all necessary working clearly.",
      guidance: "Build original structured and unstructured Core questions. Attach the formula list from the current 0580 syllabus cycle. Do not provide a calculator. A ruler, protractor and pair of compasses are required; tracing paper may also be supplied.",
      requiredDocumentLabel: "current Cambridge 0580 formula list",
    }),
    formatPaper("paper-3", "Paper 3 — Calculator (Core)", ["Core"], {
      sessions: ["2026", "2027", "custom"],
      duration: 90,
      maximumMarks: 80,
      subjectWeightPercent: 50,
      deliveryFormat: "Paper-like digital practice",
      toolSummary: "Scientific calculator required (no algebraic or graphical calculators) · current 0580 formula list supplied · digital working canvas",
      instructions: "Answer all questions. A scientific calculator is required; algebraic or graphical calculators must not be used. Show all necessary working clearly and keep unrounded values in your working. Unless stated otherwise, give non-exact answers to three significant figures, or one decimal place for angles in degrees.",
      guidance: "Build original structured and unstructured Core questions. Attach the formula list from the current 0580 syllabus cycle. Supply a scientific calculator without algebraic or graphical capabilities, ruler, protractor and pair of compasses; tracing paper may also be supplied. PacePaper does not emulate the calculator.",
      requiredDocumentLabel: "current Cambridge 0580 formula list",
    }),
    formatPaper("paper-2", "Paper 2 — Non-calculator (Extended)", ["Extended"], {
      sessions: ["2026", "2027", "custom"],
      duration: 120,
      maximumMarks: 100,
      subjectWeightPercent: 50,
      deliveryFormat: "Paper-like digital practice",
      toolSummary: "No calculator · current 0580 formula list supplied · structured and unstructured questions · digital working canvas",
      instructions: "Answer all questions. Calculators must not be used. Show all necessary working clearly.",
      guidance: "Build original structured and unstructured Extended questions. Attach the formula list from the current 0580 syllabus cycle. Do not provide a calculator. A ruler, protractor and pair of compasses are required; tracing paper may also be supplied.",
      requiredDocumentLabel: "current Cambridge 0580 formula list",
    }),
    formatPaper("paper-4", "Paper 4 — Calculator (Extended)", ["Extended"], {
      sessions: ["2026", "2027", "custom"],
      duration: 120,
      maximumMarks: 100,
      subjectWeightPercent: 50,
      deliveryFormat: "Paper-like digital practice",
      toolSummary: "Scientific calculator required (no algebraic or graphical calculators) · current 0580 formula list supplied · digital working canvas",
      instructions: "Answer all questions. A scientific calculator is required; algebraic or graphical calculators must not be used. Show all necessary working clearly and keep unrounded values in your working. Unless stated otherwise, give non-exact answers to three significant figures, or one decimal place for angles in degrees.",
      guidance: "Build original structured and unstructured Extended questions. Attach the formula list from the current 0580 syllabus cycle. Supply a scientific calculator without algebraic or graphical capabilities, ruler, protractor and pair of compasses; tracing paper may also be supplied. PacePaper does not emulate the calculator.",
      requiredDocumentLabel: "current Cambridge 0580 formula list",
    }),
  ],
};

function pearsonMathematicsPaper(number, tier) {
  const suffix = tier === "Foundation" ? "F" : "H";
  return formatPaper(`paper-${number}${suffix.toLowerCase()}`, `Paper ${number}${suffix}`, [tier], {
    sessions: ["2026", "2027", "custom"],
    duration: 120,
    maximumMarks: 100,
    subjectWeightPercent: 50,
    deliveryFormat: "Paper-like digital practice",
    toolSummary: "Calculator permitted · formula sheet supplied · digital working canvas",
    instructions: "Answer all questions. A calculator may be used. Show all stages in any calculations and state units where appropriate.",
    guidance: `Build original ${tier.toLowerCase()} questions in the order students should attempt them. Attach the current authorized formula sheet and supply the permitted calculator and geometry instruments for the rehearsal.`,
    requiredDocumentLabel: "current authorized Mathematics A formula sheet",
  });
}

const PEARSON_MATHEMATICS = {
  value: "pearson-igcse-mathematics-a",
  label: "Mathematics A — linear (4MA1)",
  papers: [
    pearsonMathematicsPaper(1, "Foundation"),
    pearsonMathematicsPaper(2, "Foundation"),
    pearsonMathematicsPaper(1, "Higher"),
    pearsonMathematicsPaper(2, "Higher"),
  ],
};

function pearsonMathematicsUnit(number, tier) {
  const suffix = tier === "Foundation" ? "F" : "H";
  const componentCode = `4WM${number}${suffix}/01`;
  return formatPaper(`unit-${number}${suffix.toLowerCase()}`, `Unit ${number} (${componentCode})`, [tier], {
    sessions: ["2026", "2027", "custom"],
    duration: 120,
    maximumMarks: 100,
    subjectWeightPercent: 50,
    deliveryFormat: "Paper-like digital practice",
    toolSummary: "Calculator permitted · tier formula sheet supplied · digital working canvas",
    instructions: "Answer all questions. A calculator may be used. Show all stages in any calculations and state units where appropriate.",
    guidance: `Build original ${tier.toLowerCase()} Unit ${number} questions using the current modular content map. Attach the current tier formula sheet and supply a suitable calculator, ruler, protractor and pair of compasses; tracing paper may also be supplied. Unit 2 assumes the relevant Unit 1 content.`,
    requiredDocumentLabel: `current Mathematics A Modular ${tier} formula sheet`,
  });
}

const PEARSON_MATHEMATICS_MODULAR = {
  value: "pearson-igcse-mathematics-a-modular",
  label: "Mathematics A — modular (4XMAF/4XMAH)",
  papers: [
    pearsonMathematicsUnit(1, "Foundation"),
    pearsonMathematicsUnit(2, "Foundation"),
    pearsonMathematicsUnit(1, "Higher"),
    pearsonMathematicsUnit(2, "Higher"),
  ],
};

const AP_ENGLISH_LANGUAGE = {
  value: "ap-english-language-composition",
  label: "English Language and Composition",
  papers: [formatPaper("end-of-course", "End-of-course exam — fully digital", ["AP"], {
    sessions: ["may-2027", "custom"],
    duration: 205,
    durationLabel: "Session timer",
    maximumMarks: undefined,
    subjectWeightPercent: undefined,
    mode: "essay",
    materials: ["pdf", "text"],
    responseTypes: ["single-choice", "essay"],
    deliveryFormat: "Fully digital practice",
    fidelity: "adapted",
    toolSummary: "Section I: 45 MCQ / 60 min · 10-minute break · Section II: 3 FRQ / 135 min including an optional 15-minute reading period · typed free response",
    instructions: "Complete the multiple-choice and free-response practice sections. Follow the teacher's instruction for the monitored break.",
    guidance: "Add original items representing the 45-question Section I and all three typed free-response tasks. PacePaper locks Section I after 60 minutes and blocks entry during the fixed 10-minute monitored break. Section II then provides the full 135 minutes; its 15-minute reading period is optional, so students may begin writing immediately. The official app uses a candidate Resume Testing action after its break, so this fixed classroom transition remains an adapted practice implementation.",
    phases: [
      { id: "section-1", label: "Section I — multiple choice", kind: "work", durationMinutes: 60, sectionId: "section-1", tools: ["Digital multiple-choice", "Text highlighting", "Mark for review"], instructions: "Complete Section I. You cannot return after this section ends." },
      { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [], instructions: "Student entry and examination content are locked during the break." },
      { id: "section-2", label: "Section II — free response", kind: "work", durationMinutes: 135, sectionId: "section-2", tools: ["Typed free response", "Text highlighting", "Optional 15-minute reading period"], instructions: "Complete all three free-response tasks. The recommended reading period is optional, so you may begin writing immediately. Section I remains locked." },
    ],
    minimumQuestions: 2,
    initialQuestions: [
      { label: "Section I item", sectionId: "section-1", type: "single-choice", prompt: "Choose the best answer.", options: "Option A\nOption B\nOption C\nOption D" },
      { label: "Section II free response", sectionId: "section-2", type: "essay", prompt: "Write your response using the supplied source material." },
    ],
  })],
};

const AP_BIOLOGY = {
  value: "ap-biology",
  label: "Biology",
  papers: [formatPaper("end-of-course", "End-of-course exam — hybrid digital/paper", ["AP"], {
    sessions: ["may-2027", "custom"],
    duration: 190,
    durationLabel: "Session timer",
    maximumMarks: undefined,
    subjectWeightPercent: undefined,
    materials: ["pdf", "text"],
    responseTypes: ["single-choice", "ink"],
    deliveryFormat: "Hybrid digital/paper practice",
    fidelity: "adapted",
    toolSummary: "Section I: 60 MCQ / 90 min · 10-minute break · Section II: 6 handwritten FRQ / 90 min · nongraphing calculator · equations and formulas sheet",
    instructions: "Complete the multiple-choice practice digitally. Complete free-response practice in the supplied paper booklet or the PacePaper working canvas, as directed by your teacher. Use the AP Biology equations and formulas sheet supplied by your teacher. A four-function calculator with square root or a scientific nongraphing calculator is permitted. For May 2027, handheld graphing calculators and other handheld calculators with storage capabilities are not allowed.",
    guidance: "Add original stimulus-linked multiple-choice sets, two long free-response questions and four short free-response questions spanning different big ideas and units. Before starting, supply the current AP Biology equations and formulas sheet and permitted nongraphing calculators. Bluebook includes Desmos scientific; PacePaper requires a teacher-supplied calculator. PacePaper locks Section I, blocks entry during the fixed 10-minute monitored break, and then opens Section II. For closest rehearsal fidelity, print a practice response booklet. The official app uses a candidate Resume Testing action after its break, so this remains adapted practice.",
    requiredDocumentLabel: "current AP Biology equations and formulas sheet",
    phases: [
      { id: "section-1", label: "Section I — multiple choice", kind: "work", durationMinutes: 90, sectionId: "section-1", tools: ["Scientific nongraphing or four-function calculator", "AP Biology equations and formulas sheet", "Digital multiple-choice", "Text highlighting"], instructions: "Complete Section I. Handheld graphing calculators and other handheld calculators with storage capabilities are not allowed. You cannot return after this section ends." },
      { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [], instructions: "Student entry and examination content are locked during the break." },
      { id: "section-2", label: "Section II — free response", kind: "work", durationMinutes: 90, sectionId: "section-2", tools: ["Physical response booklet", "Scientific nongraphing or four-function calculator", "AP Biology equations and formulas sheet"], instructions: "Complete the free-response questions in the practice booklet or working canvas, as directed by your teacher. Handheld graphing calculators and other handheld calculators with storage capabilities are not allowed." },
    ],
    minimumQuestions: 2,
    initialQuestions: [
      { label: "Section I item", sectionId: "section-1", type: "single-choice", prompt: "Choose the best answer.", options: "Option A\nOption B\nOption C\nOption D" },
      { label: "Section II free response", sectionId: "section-2", type: "ink", prompt: "Write your response and show any required calculations or graphing.", inkPages: 2, inkBackground: "square-grid" },
    ],
  })],
};

const AP_CALCULUS_AB = {
  value: "ap-calculus-ab",
  label: "Calculus AB",
  papers: [formatPaper("end-of-course", "End-of-course exam — hybrid digital/paper", ["AP"], {
    sessions: ["may-2027", "custom"],
    duration: 200,
    durationLabel: "Full session",
    maximumMarks: undefined,
    subjectWeightPercent: undefined,
    materials: ["pdf", "text"],
    responseTypes: ["single-choice", "ink"],
    deliveryFormat: "Hybrid digital/paper practice",
    fidelity: "adapted",
    toolSummary: "Section I: 100 min with calculator change by part · fixed 10-minute break · Section II: 90 min with calculator change by part",
    instructions: "Follow the calculator rule shown for each part. Complete multiple-choice answers digitally and free-response work in the supplied practice booklet or PacePaper working canvas.",
    guidance: "Build original questions for all four timed parts. PacePaper locks each part when its timer ends and changes the displayed calculator rule. Supply an approved handheld graphing calculator for Parts I-B and II-A. The real Bluebook exam also offers built-in Desmos graphing during these parts; PacePaper does not include it. The official hybrid exam uses paper free-response booklets and a candidate-controlled post-break resume, so this is adapted practice.",
    phases: [
      { id: "section-1a", label: "Section I, Part A", kind: "work", durationMinutes: 62, sectionId: "section-1a", tools: ["Calculator not permitted", "Digital multiple-choice"], instructions: "Complete 29 multiple-choice questions without a calculator. You cannot return after this part ends." },
      { id: "section-1b", label: "Section I, Part B", kind: "work", durationMinutes: 38, sectionId: "section-1b", tools: ["Approved graphing calculator required", "Digital multiple-choice"], instructions: "Complete 13 multiple-choice questions using an approved graphing calculator." },
      { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [], instructions: "Student entry and examination content are locked during the break." },
      { id: "section-2a", label: "Section II, Part A", kind: "work", durationMinutes: 30, sectionId: "section-2a", tools: ["Approved graphing calculator required", "Physical response booklet"], instructions: "Complete two free-response questions using an approved graphing calculator." },
      { id: "section-2b", label: "Section II, Part B", kind: "work", durationMinutes: 60, sectionId: "section-2b", tools: ["Calculator not permitted", "Physical response booklet"], instructions: "Complete four free-response questions without a calculator." },
    ],
    minimumQuestions: 4,
    initialQuestions: [
      { label: "Section I, Part A item", sectionId: "section-1a", type: "single-choice", prompt: "Choose the best answer without using a calculator.", options: "Option A\nOption B\nOption C\nOption D" },
      { label: "Section I, Part B item", sectionId: "section-1b", type: "single-choice", prompt: "Choose the best answer. An approved graphing calculator is required.", options: "Option A\nOption B\nOption C\nOption D" },
      { label: "Section II, Part A free response", sectionId: "section-2a", type: "ink", prompt: "Show all required work. An approved graphing calculator is required.", inkPages: 2, inkBackground: "square-grid" },
      { label: "Section II, Part B free response", sectionId: "section-2b", type: "ink", prompt: "Show all required work without using a calculator.", inkPages: 2, inkBackground: "square-grid" },
    ],
  })],
};

const SCHOOL_CUSTOM = {
  value: "school-defined-practice",
  label: "School-defined practice",
  papers: [
    formatPaper("typed-paper", "Typed-response paper", ["All students"], {
      sessions: ["custom"],
      duration: 60,
      readingTime: 0,
      maximumMarks: undefined,
      subjectWeightPercent: undefined,
      mode: "essay",
      responseTypes: ["essay", "short", "single-choice", "ink"],
      deliveryFormat: "School custom",
      fidelity: "school-custom",
      toolSummary: "Teacher-defined timing, questions, resources and response areas",
      instructions: "Answer the questions using the response areas provided.",
      guidance: "Set the timing, instructions, marks, resources and response areas required by your school practice task.",
      question: { type: "essay", prompt: "Write your response." },
    }),
    formatPaper("working-paper", "Mathematics/science working paper", ["All students"], {
      sessions: ["custom"],
      duration: 60,
      maximumMarks: undefined,
      subjectWeightPercent: undefined,
      deliveryFormat: "School custom",
      fidelity: "school-custom",
      toolSummary: "Teacher-defined working paper · digital canvas",
      instructions: "Answer every question and show your working where required.",
      guidance: "Set the timing and calculator/material rules, then add each original question with an appropriate typed or digital-ink response area.",
    }),
  ],
};

export function createExamSystems(ibCourses) {
  return [
    {
      value: "ib-dp",
      label: "IB Diploma Programme",
      qualificationLabel: "IB Diploma Programme",
      description: "Current PacePaper presets for IB Diploma Programme practice papers.",
      courseLabel: "Course",
      levelLabel: "Level",
      paperLabel: "Paper",
      combinedLevel: "SL/HL",
      levelOrder: ["SL", "HL", "SL/HL"],
      sessions: [
        { value: "may-2026", label: "May 2026 — current reference" },
        { value: "may-2027", label: "May 2027 — Psychology first-assessment preview" },
        { value: "custom", label: "Custom or another session" },
      ],
      courses: ibCourses,
    },
    {
      value: "cambridge-igcse",
      label: "Cambridge IGCSE",
      qualificationLabel: "Cambridge IGCSE",
      description: "Verified 2025–2027 Mathematics 0580 structures. More subject profiles can be added after course-specific verification.",
      courseLabel: "Syllabus",
      levelLabel: "Tier",
      paperLabel: "Component",
      levelOrder: ["Core", "Extended"],
      sessions: [
        { value: "2027", label: "2027 — 2025–2027 syllabus profile" },
        { value: "2026", label: "2026 — 2025–2027 syllabus profile" },
        { value: "custom", label: "Custom or another session" },
      ],
      courses: [CAMBRIDGE_MATHEMATICS],
    },
    {
      value: "pearson-edexcel-igcse",
      label: "Pearson Edexcel International GCSE",
      qualificationLabel: "Pearson Edexcel International GCSE",
      description: "Verified Mathematics A linear and modular Foundation/Higher starters. More subject profiles can be added after specification-level verification.",
      courseLabel: "Qualification",
      levelLabel: "Tier",
      paperLabel: "Paper",
      levelOrder: ["Foundation", "Higher"],
      sessions: [
        { value: "2027", label: "2027 — current specification profile" },
        { value: "2026", label: "2026 — current specification profile" },
        { value: "custom", label: "Custom or another session" },
      ],
      courses: [PEARSON_MATHEMATICS, PEARSON_MATHEMATICS_MODULAR],
    },
    {
      value: "ap",
      label: "Advanced Placement (AP)",
      qualificationLabel: "Advanced Placement",
      description: "2027 fully digital and hybrid practice starters with timed, locked sections and fixed monitored breaks.",
      courseLabel: "AP course",
      levelLabel: "Level",
      paperLabel: "Exam format",
      levelOrder: ["AP"],
      sessions: [
        { value: "may-2027", label: "May 2027 — published exam modes" },
        { value: "custom", label: "Custom or another session" },
      ],
      courses: [AP_ENGLISH_LANGUAGE, AP_BIOLOGY, AP_CALCULUS_AB],
    },
    {
      value: "school-custom",
      label: "School custom",
      qualificationLabel: "School custom practice",
      description: "A neutral practice format when no verified awarding-body profile is suitable.",
      courseLabel: "Practice type",
      levelLabel: "Candidate group",
      paperLabel: "Format",
      levelOrder: ["All students"],
      sessions: [{ value: "custom", label: "School custom" }],
      courses: [SCHOOL_CUSTOM],
    },
  ];
}
