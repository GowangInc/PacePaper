import { createPaperPreview } from "./paper-preview.js";

const RESPONSE_PATTERNS = {
  analysis: {
    mode: "essay",
    duration: 75,
    readingTime: 5,
    selectionMode: "one",
    instructions: "Read the examination material and write your response.",
    materials: ["pdf", "text"],
    question: { type: "essay", prompt: "Write your response.", wordCountMin: "", wordCountMax: "" },
  },
  comparison: {
    mode: "essay",
    duration: 105,
    readingTime: 5,
    selectionMode: "one",
    instructions: "Choose the required question and write your response.",
    materials: ["pdf"],
    question: { type: "essay", prompt: "Write your comparative response.", wordCountMin: "", wordCountMax: "" },
  },
  writing: {
    mode: "essay",
    duration: 75,
    readingTime: 5,
    selectionMode: "one",
    instructions: "Choose the required task and write your response.",
    materials: ["pdf", "text"],
    question: { type: "essay", prompt: "Write your response.", wordCountMin: "", wordCountMax: "" },
  },
  working: {
    mode: "reading",
    duration: 90,
    readingTime: 5,
    selectionMode: "all",
    instructions: "Answer every question. Show your working where required.",
    materials: ["pdf", "text"],
    question: { type: "ink", prompt: "Show your working and final answer.", inkPages: 1, inkBackground: "square-grid" },
  },
  multipleChoice: {
    mode: "reading",
    duration: 45,
    readingTime: 5,
    selectionMode: "all",
    instructions: "Answer every question.",
    materials: ["pdf", "text"],
    question: { type: "single-choice", prompt: "Choose one answer.", options: "Option A\nOption B\nOption C\nOption D" },
  },
  shortAnswer: {
    mode: "reading",
    duration: 75,
    readingTime: 5,
    selectionMode: "all",
    instructions: "Read the material and answer every question.",
    materials: ["pdf", "text"],
    question: { type: "short", prompt: "Enter your answer." },
  },
  scienceWritten: {
    mode: "reading",
    duration: 90,
    readingTime: 5,
    selectionMode: "all",
    instructions: "Answer every question. Show calculations, diagrams and scientific working where required.",
    materials: ["pdf", "text"],
    question: { type: "ink", prompt: "Enter your answer and show any required working.", inkPages: 1, inkBackground: "lined" },
  },
  listening: {
    mode: "listening",
    duration: 45,
    readingTime: 5,
    selectionMode: "all",
    instructions: "Listen to the recording and answer every question.",
    materials: ["audio", "pdf", "text"],
    question: { type: "short", prompt: "Enter your answer." },
  },
};

function exam(value, label, pattern, levels = ["SL", "HL"], overrides = {}) {
  const base = RESPONSE_PATTERNS[pattern];
  return {
    value,
    label,
    levels,
    sessions: ["may-2026", "custom"],
    ...base,
    ...overrides,
    question: { ...base.question, ...(overrides.question ?? {}) },
  };
}

const LANGUAGE_A_PAPERS = [
  exam("paper-1", "Paper 1 — textual analysis", "analysis", ["SL", "HL"], {
    durationByLevel: { SL: 75, HL: 135 },
    selectionModeByLevel: { SL: "one", HL: "all" },
    instructionsByLevel: {
      SL: "Choose one of the two unseen texts and write an analysis.",
      HL: "Write a separate analysis of each of the two unseen texts.",
    },
    guidanceByLevel: {
      SL: "Add the two unseen texts as separate questions so the student can choose one response.",
      HL: "Add both unseen texts as required questions, with one response area for each analysis.",
    },
  }),
  exam("paper-2", "Paper 2 — comparative essay", "comparison", ["SL", "HL"], {
    duration: 105,
    guidance: "Add the four prompts as separate questions. The student chooses one and compares two studied works.",
  }),
];

const LANGUAGE_B_PAPERS = [
  exam("paper-1", "Paper 1 — productive skills", "writing", ["SL", "HL"], {
    durationByLevel: { SL: 75, HL: 90 },
    maximumMarks: 30,
    subjectWeightPercent: 25,
    questionByLevel: {
      SL: { wordCountMin: 250, wordCountMax: 400 },
      HL: { wordCountMin: 450, wordCountMax: 600 },
    },
    guidance: "Add the three tasks as separate questions. The student chooses one response and the appropriate text type.",
  }),
  exam("paper-2-reading", "Paper 2 — reading component", "shortAnswer", ["SL", "HL"], {
    duration: 60,
    maximumMarks: 40,
    subjectWeightPercent: 25,
    guidance: "Attach or enter the three source texts, then add their required questions and answer areas.",
  }),
  exam("paper-2-listening", "Paper 2 — listening component", "listening", ["SL", "HL"], {
    durationByLevel: { SL: 45, HL: 60 },
    readingTime: 0,
    maximumMarks: 25,
    subjectWeightPercent: 25,
    guidance: "Attach the three recordings and their questions. Current public specimens use two plays per text, with a four-minute preview and a two-minute pause around each recording; confirm the live-session procedure before formal use.",
  }),
];

const MATHEMATICS_PAPERS = [
  exam("paper-1", "Paper 1", "working", ["SL", "HL"], {
    durationByLevel: { SL: 90, HL: 120 },
    maximumMarksByLevel: { SL: 80, HL: 110 },
    subjectWeightPercentByLevel: { SL: 40, HL: 30 },
    requiredDocumentLabel: "current clean mathematics formula booklet",
  }),
  exam("paper-2", "Paper 2", "working", ["SL", "HL"], {
    durationByLevel: { SL: 90, HL: 120 },
    maximumMarksByLevel: { SL: 80, HL: 110 },
    subjectWeightPercentByLevel: { SL: 40, HL: 30 },
    requiredDocumentLabel: "current clean mathematics formula booklet",
  }),
  exam("paper-3", "Paper 3", "working", ["HL"], {
    duration: 75,
    maximumMarks: 55,
    subjectWeightPercent: 20,
    requiredDocumentLabel: "current clean mathematics formula booklet",
  }),
];

function sciencePapers(subject) {
  const dataBooklet = subject === "Chemistry" || subject === "Physics" ? ` Attach the current clean ${subject} data booklet.` : "";
  const markMatrix = {
    Biology: { paper1: { SL: 55, HL: 75 }, paper2: { SL: 50, HL: 80 } },
    Chemistry: { paper1: { SL: 55, HL: 75 }, paper2: { SL: 50, HL: 90 } },
    Physics: { paper1: { SL: 45, HL: 60 }, paper2: { HL: 90 } },
  }[subject];
  const paperTwoGuidance = subject === "Biology"
    ? {
        SL: "Add the compulsory questions, then represent the Section B one-of-two choice as one question card containing both alternatives.",
        HL: "Add the compulsory questions, then create two Section B response cards, each containing the shared set of three alternatives. Distinct-choice validation is not yet automatic.",
      }
    : {
        SL: "All questions are compulsory. Add each item with the response area it needs.",
        HL: "All questions are compulsory. Add each item with the response area it needs.",
      };
  return [
    exam("paper-1", "Paper 1 — combined 1A + 1B", "multipleChoice", ["SL", "HL"], {
    durationByLevel: { SL: 90, HL: 120 },
    maximumMarksByLevel: markMatrix.paper1,
    subjectWeightPercent: 36,
    instructions: "Complete Paper 1A and Paper 1B under one timer. Answer every question and show working where required.",
      guidance: `Paper 1A and 1B form one timed paper. Starter cards for each component are included; add the remaining items and choose short response or digital working for 1B as needed.${dataBooklet}`,
      minimumQuestions: 2,
      ...(dataBooklet ? { requiredDocumentLabel: `current clean ${subject} data booklet` } : {}),
      initialQuestions: [
        { label: "Paper 1A item", type: "single-choice", prompt: "Choose one answer.", options: "Option A\nOption B\nOption C\nOption D" },
        { label: "Paper 1B item", type: "ink", prompt: "Enter your answer and show any required working.", inkPages: 1, inkBackground: "lined" },
      ],
    }),
    exam("paper-2", "Paper 2 — short and extended response", "scienceWritten", ["SL", "HL"], {
      durationByLevel: { SL: 90, HL: 150 },
      maximumMarksByLevel: markMatrix.paper2,
      subjectWeightPercent: 44,
      ...(dataBooklet ? { requiredDocumentLabel: `current clean ${subject} data booklet` } : {}),
      guidanceByLevel: Object.fromEntries(Object.entries(paperTwoGuidance).map(([level, text]) => [level, `${text}${dataBooklet}`])),
    }),
  ];
}

const BIOLOGY_PAPERS = sciencePapers("Biology");
const CHEMISTRY_PAPERS = sciencePapers("Chemistry");
const PHYSICS_PAPERS = sciencePapers("Physics");

const PSYCHOLOGY_PAPERS = [
  exam("paper-1", "Paper 1", "shortAnswer", ["SL", "HL"], {
    duration: 120,
    maximumMarks: 49,
    subjectWeightPercentByLevel: { SL: 50, HL: 40 },
    instructions: "Answer the required short-answer questions and one extended-response question.",
    guidance: "This is the legacy syllabus last assessed in 2026. Add required short-answer cards, then one card containing the essay alternatives.",
  }),
  exam("paper-2", "Paper 2", "writing", ["SL", "HL"], {
    durationByLevel: { SL: 60, HL: 120 },
    maximumMarksByLevel: { SL: 22, HL: 44 },
    subjectWeightPercentByLevel: { SL: 25, HL: 20 },
    selectionModeByLevel: { SL: "one", HL: "all" },
    instructionsByLevel: {
      SL: "Answer one essay question.",
      HL: "Answer two essay questions, one from each required option.",
    },
    guidanceByLevel: {
      SL: "Add the available essay prompts as separate questions so the student can choose one.",
      HL: "Create two required response cards and place each option's alternative prompts together in its card.",
    },
  }),
  exam("paper-3", "Paper 3", "shortAnswer", ["HL"], {
    duration: 60,
    maximumMarks: 24,
    subjectWeightPercent: 20,
    instructions: "Use the supplied research stimulus and answer every question.",
    guidance: "Attach the research-method stimulus, then add the required response areas. Typed response is the default; ink can be enabled for scratch work if useful.",
  }),
  exam("paper-1", "Paper 1 — first assessment 2027", "shortAnswer", ["SL", "HL"], {
    sessions: ["may-2027"],
    duration: 90,
    maximumMarks: 35,
    subjectWeightPercentByLevel: { SL: 35, HL: 25 },
    instructions: "Answer the four compulsory short-response questions and one of the two concept-based extended-response questions.",
    guidance: "This is the first-assessment-2027 cycle. Add four required short-response cards, then one card containing the two Section C alternatives.",
  }),
  exam("paper-2", "Paper 2 — first assessment 2027", "shortAnswer", ["SL", "HL"], {
    sessions: ["may-2027"],
    duration: 90,
    maximumMarks: 35,
    subjectWeightPercentByLevel: { SL: 35, HL: 25 },
    instructions: "Answer all questions on class practicals and the unseen research study.",
    guidance: "Attach the unseen study and add all required response areas. Typed response is the default.",
  }),
  exam("paper-3", "Paper 3 — first assessment 2027", "shortAnswer", ["HL"], {
    sessions: ["may-2027"],
    duration: 105,
    maximumMarks: 30,
    subjectWeightPercent: 30,
    instructions: "Use the supplied resource booklet and answer all four source-based questions.",
    guidance: "Attach the resource booklet and keep it available to all four response cards. Typed response is the default.",
  }),
];

const BUSINESS_MANAGEMENT_PAPERS = [
  exam("paper-1", "Paper 1 — pre-released context and unseen case", "shortAnswer", ["SL", "HL"], {
    duration: 90,
    maximumMarks: 30,
    subjectWeightPercentByLevel: { SL: 35, HL: 25 },
    instructions: "Answer all six structured questions in Section A and one of the two extended-response questions in Section B.",
    guidance: "Add the six compulsory Section A questions. Add one final response card containing both Section B alternatives so the student chooses within that card.",
  }),
  exam("paper-2", "Paper 2 — quantitative case material", "working", ["SL", "HL"], {
    durationByLevel: { SL: 90, HL: 105 },
    maximumMarksByLevel: { SL: 40, HL: 50 },
    subjectWeightPercentByLevel: { SL: 35, HL: 30 },
    instructionsByLevel: {
      SL: "Answer both compulsory quantitative questions in Section A and one of the two questions in Section B. Show working and units.",
      HL: "Answer all three compulsory quantitative questions in Section A and one of the two questions in Section B. Show working and units.",
    },
    guidance: "A calculator is permitted and a clean formula sheet may be required. Add compulsory questions first, then one response card containing the two Section B alternatives; enable ink for calculations, charts or diagrams.",
    requiredDocumentLabel: "current authorized Business Management formulae sheet",
  }),
  exam("paper-3", "Paper 3 — social enterprise", "analysis", ["HL"], {
    duration: 75,
    maximumMarks: 25,
    subjectWeightPercent: 25,
    selectionMode: "all",
    instructions: "Use the supplied social-enterprise resources and answer all three questions.",
    guidance: "Attach the resource pack and add the compulsory 2-mark, 6-mark and 17-mark response areas. Typed prose is the default; optional ink can be used for planning.",
  }),
];

export const COURSES = [
  { value: "english-a-language-literature", label: "English A: Language and Literature", papers: LANGUAGE_A_PAPERS },
  { value: "english-a-literature", label: "English A: Literature", papers: LANGUAGE_A_PAPERS },
  { value: "english-b", label: "English B", papers: LANGUAGE_B_PAPERS },
  { value: "mathematics-analysis-approaches", label: "Mathematics: Analysis and Approaches", papers: MATHEMATICS_PAPERS },
  { value: "mathematics-applications-interpretation", label: "Mathematics: Applications and Interpretation", papers: MATHEMATICS_PAPERS },
  { value: "biology", label: "Biology", papers: BIOLOGY_PAPERS },
  { value: "chemistry", label: "Chemistry", papers: CHEMISTRY_PAPERS },
  { value: "physics", label: "Physics", papers: PHYSICS_PAPERS },
  { value: "psychology", label: "Psychology", papers: PSYCHOLOGY_PAPERS },
  { value: "business-management", label: "Business Management", papers: BUSINESS_MANAGEMENT_PAPERS },
  { value: "korean-a-language-literature", label: "Korean A: Language and Literature", papers: LANGUAGE_A_PAPERS },
  { value: "korean-a-literature", label: "Korean A: Literature", papers: LANGUAGE_A_PAPERS },
  { value: "japanese-a-language-literature", label: "Japanese A: Language and Literature", papers: LANGUAGE_A_PAPERS },
  { value: "japanese-a-literature", label: "Japanese A: Literature", papers: LANGUAGE_A_PAPERS },
  { value: "spanish-a-language-literature", label: "Spanish A: Language and Literature", papers: LANGUAGE_A_PAPERS },
  { value: "spanish-a-literature", label: "Spanish A: Literature", papers: LANGUAGE_A_PAPERS },
  { value: "spanish-b", label: "Spanish B", papers: LANGUAGE_B_PAPERS },
];

let nextQuestionId = 1;

function questionFrom(template, number = 1) {
  return {
    key: nextQuestionId++,
    label: template.label ?? `Question ${number}`,
    prompt: template.prompt,
    type: template.type,
    options: template.options ?? "Option A\nOption B",
    marks: template.marks ?? "",
    wordCountMin: template.wordCountMin ?? "",
    wordCountMax: template.wordCountMax ?? "",
    inkPages: template.inkPages ?? 1,
    inkBackground: template.inkBackground ?? "square-grid",
    mediaFiles: [],
  };
}

function field(tag, attributes, text) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes ?? {})) {
    if (name === "className") element.className = value;
    else if (name === "value") element.value = value;
    else element.setAttribute(name, value);
  }
  if (text !== undefined) element.textContent = text;
  return element;
}

function option(value, label) {
  return field("option", { value }, label);
}

function selectedCourse(form) {
  return COURSES.find((course) => course.value === form.querySelector("#builder-subject").value);
}

export const BUILDER_LEVELS = ["SL", "HL", "SL/HL"];

function paperSupportsLevel(paper, level) {
  return level === "SL/HL"
    ? paper.levels.includes("SL") && paper.levels.includes("HL")
    : paper.levels.includes(level);
}

export function levelsForCourse(course, assessmentSession) {
  const directLevels = new Set(course.papers
    .filter((paper) => paper.sessions.includes(assessmentSession))
    .flatMap((paper) => paper.levels));
  if (directLevels.has("SL") && directLevels.has("HL")) directLevels.add("SL/HL");
  return BUILDER_LEVELS.filter((level) => directLevels.has(level));
}

export function papersForLevel(course, assessmentSession, level) {
  return course.papers.filter((paper) => (
    paper.sessions.includes(assessmentSession) && paperSupportsLevel(paper, level)
  ));
}

function selectedExam(form) {
  const assessmentSession = form.querySelector("#builder-session").value;
  const course = selectedCourse(form);
  const level = form.querySelector("#builder-level").value;
  const paperValue = form.querySelector("#builder-paper").value;
  const paper = course && papersForLevel(course, assessmentSession, level).find((item) => item.value === paperValue);
  return assessmentSession && course && level && paper ? { assessmentSession, course, level, paper } : null;
}

export function valueForLevel(paper, property, level) {
  const variants = paper[`${property}ByLevel`];
  if (level !== "SL/HL") return variants?.[level] ?? paper[property];
  if (!variants) return paper[property];
  const sl = variants.SL ?? paper[property];
  const hl = variants.HL ?? paper[property];
  if (sl === hl) return sl;
  if (property === "duration" && Number.isFinite(sl) && Number.isFinite(hl)) return Math.max(sl, hl);
  return paper[property];
}

function questionForLevel(paper, level) {
  if (level === "SL/HL") {
    const sl = paper.questionByLevel?.SL;
    const hl = paper.questionByLevel?.HL;
    return { ...paper.question, ...(JSON.stringify(sl) === JSON.stringify(hl) ? sl : {}) };
  }
  return { ...paper.question, ...(paper.questionByLevel?.[level] ?? {}) };
}

function courseSupportsSession(course, assessmentSession) {
  return course.papers.some((paper) => paper.sessions.includes(assessmentSession));
}

function integerOrUndefined(value) {
  return value === "" ? undefined : Number(value);
}

function uniqueFiles(files) {
  const names = new Set();
  for (const file of files) {
    if (names.has(file.name)) throw new Error(`Two resources are named ${file.name}. Rename one before adding the paper.`);
    names.add(file.name);
  }
}

function previewFile(file) {
  const name = file.name.toLowerCase();
  const kind = file.type === "application/pdf" || name.endsWith(".pdf")
    ? "document"
    : file.type.startsWith("audio/") || /\.(?:m4a|mp3|ogg|wav)$/u.test(name)
      ? "audio"
      : "image";
  return { name: file.name, kind, file };
}

const SOURCE_CLASSIFICATION_LABELS = {
  "teacher-authored": "Teacher-authored material",
  "school-authorized": "School-authorized or licensed material",
  "official-public-reference": "Official public specimen · reference only",
  "unknown-local-only": "Unknown rights · local-only",
};

export function paperPreviewData(form, questions) {
  const selection = selectedExam(form);
  if (!selection) return null;
  const { course, level, paper } = selection;
  const allowedMaterials = new Set(paper.materials);
  const maxPlays = Number(form.querySelector("#builder-audio-plays").value);
  const sharedResources = [
    ...(allowedMaterials.has("pdf") ? [...form.querySelector("#builder-pdf").files].map(previewFile) : []),
    ...(allowedMaterials.has("audio")
      ? [...form.querySelector("#builder-audio").files].map((file) => ({ ...previewFile(file), maxPlays }))
      : []),
  ];
  const classification = form.querySelector("#builder-source-classification").value;
  return {
    title: form.querySelector("#builder-title").value.trim(),
    subject: course.label,
    level,
    paper: form.querySelector("#builder-paper-label").value.trim(),
    sessionLabel: form.querySelector("#builder-session").selectedOptions?.[0]?.textContent ?? selection.assessmentSession,
    readingTimeMinutes: Number(form.querySelector("#builder-reading-time").value),
    durationMinutes: Number(form.querySelector("#builder-duration").value),
    maximumMarks: valueForLevel(paper, "maximumMarks", level),
    subjectWeightPercent: valueForLevel(paper, "subjectWeightPercent", level),
    instructions: form.querySelector("#builder-instructions").value.trim(),
    sourceClassificationLabel: SOURCE_CLASSIFICATION_LABELS[classification] ?? classification,
    sourceText: allowedMaterials.has("text") ? form.querySelector("#builder-source-text").value.trim() : "",
    sharedResources,
    questions: questions.map((question) => ({
      label: question.label,
      prompt: question.prompt,
      marks: question.marks,
      type: question.type,
      options: typeof question.options === "string"
        ? question.options.split("\n").map((value) => value.trim()).filter(Boolean)
        : [],
      wordCountMin: question.wordCountMin,
      wordCountMax: question.wordCountMax,
      inkPages: question.inkPages,
      inkBackground: question.inkBackground,
      media: question.mediaFiles.map((file) => {
        const resource = previewFile(file);
        return resource.kind === "audio" ? { ...resource, maxPlays } : resource;
      }),
    })),
  };
}

export function packageData(form, questions) {
  const examSelection = selectedExam(form);
  if (!examSelection) throw new Error("Choose a course, level and examination paper first.");
  const minimumQuestions = examSelection.paper.minimumQuestions ?? 1;
  if (questions.length < minimumQuestions) {
    throw new Error(`Add at least ${minimumQuestions} question and student entry area cards for this paper.`);
  }
  const allowedMaterials = new Set(examSelection.paper.materials);
  const pdfFiles = allowedMaterials.has("pdf") ? [...form.querySelector("#builder-pdf").files] : [];
  const audioFiles = allowedMaterials.has("audio") ? [...form.querySelector("#builder-audio").files] : [];
  const sourceText = allowedMaterials.has("text") ? form.querySelector("#builder-source-text").value.trim() : "";
  const questionMedia = questions.flatMap((question) => question.mediaFiles);
  const files = [...pdfFiles, ...audioFiles, ...questionMedia];
  uniqueFiles(files);
  const isAudioFile = (file) => file.type.startsWith("audio/") || /\.(?:m4a|mp3|ogg|wav)$/iu.test(file.name);
  if (examSelection.paper.mode === "listening" && !files.some(isAudioFile)) {
    throw new Error("Attach at least one audio file for a listening paper.");
  }
  const maxPlays = Number(form.querySelector("#builder-audio-plays").value);

  const resources = [];
  pdfFiles.forEach((pdf, index) => {
    resources.push({
      key: `paper-${index + 1}`,
      label: pdfFiles.length === 1 ? "Paper-wide PDF" : `Paper-wide PDF ${index + 1}`,
      kind: "document",
      file: pdf.name,
    });
  });
  if (sourceText) resources.push({ key: "source-text", label: "Source text", kind: "text", text: sourceText });
  audioFiles.forEach((audio, index) => {
    resources.push({
      key: `audio-${index + 1}`,
      label: audioFiles.length === 1 ? "Listening audio" : `Listening audio ${index + 1}`,
      kind: "audio",
      file: audio.name,
      maxPlays,
    });
  });
  const sharedResourceKeys = resources.map((resource) => resource.key);
  const manifestQuestions = questions.map((question, index) => {
    const resourceKeys = [...sharedResourceKeys];
    question.mediaFiles.forEach((file, mediaIndex) => {
      const key = `q${index + 1}-media-${mediaIndex + 1}`;
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isAudio = isAudioFile(file);
      resources.push({
        key,
        label: `${question.label.trim() || `Question ${index + 1}`} media ${mediaIndex + 1}`,
        kind: isPdf ? "document" : isAudio ? "audio" : "image",
        file: file.name,
        ...(isAudio ? { maxPlays } : {}),
      });
      resourceKeys.push(key);
    });
    const item = {
      id: `q${index + 1}`,
      label: question.label.trim() || `Question ${index + 1}`,
      prompt: question.prompt.trim(),
      type: question.type,
      resourceKeys,
    };
    item.marks = integerOrUndefined(question.marks);
    if (question.type === "single-choice") {
      item.options = question.options.split("\n").map((value) => value.trim()).filter(Boolean);
      if (item.options.length < 2) throw new Error(`${item.label} needs at least two answer choices.`);
    }
    if (question.type === "essay") {
      item.wordCountMin = integerOrUndefined(question.wordCountMin);
      item.wordCountMax = integerOrUndefined(question.wordCountMax);
      if (item.wordCountMin && item.wordCountMax && item.wordCountMin > item.wordCountMax) {
        throw new Error(`${item.label} has a minimum word count above its maximum.`);
      }
    }
    if (question.type === "ink") {
      item.ink = {
        pages: Number(question.inkPages),
        background: question.inkBackground,
        allowTypedAlternative: true,
      };
    }
    return item;
  });
  const paperLabel = form.querySelector("#builder-paper-label").value.trim();
  const durationMinutes = Number(form.querySelector("#builder-duration").value);
  const readingTimeMinutes = Number(form.querySelector("#builder-reading-time").value);
  const instructions = form.querySelector("#builder-instructions").value.trim();
  const presetMatches = examSelection.assessmentSession !== "custom"
    && examSelection.level !== "SL/HL"
    && paperLabel === examSelection.paper.label
    && durationMinutes === valueForLevel(examSelection.paper, "duration", examSelection.level)
    && readingTimeMinutes === examSelection.paper.readingTime
    && instructions === valueForLevel(examSelection.paper, "instructions", examSelection.level)
    && (!examSelection.paper.requiredDocumentLabel || pdfFiles.length > 0);
  const manifest = {
    version: 1,
    assessmentSession: presetMatches ? examSelection.assessmentSession : examSelection.assessmentSession === "custom" ? "custom" : `custom-from-${examSelection.assessmentSession}`,
    ...(presetMatches ? { examProfileId: `${examSelection.assessmentSession}:${examSelection.course.value}:${examSelection.level}:${examSelection.paper.value}` } : {}),
    sourceClassification: form.querySelector("#builder-source-classification").value,
    exportAuthorized: form.querySelector("#builder-export-authorized").checked,
    title: form.querySelector("#builder-title").value.trim(),
    subject: examSelection.course.value,
    subjectLabel: examSelection.course.label,
    level: examSelection.level,
    paper: paperLabel,
    durationMinutes,
    readingTimeMinutes,
    maximumMarks: valueForLevel(examSelection.paper, "maximumMarks", examSelection.level),
    subjectWeightPercent: valueForLevel(examSelection.paper, "subjectWeightPercent", examSelection.level),
    mode: examSelection.paper.mode,
    instructions,
    selectionMode: valueForLevel(examSelection.paper, "selectionMode", examSelection.level),
    resources,
    questions: manifestQuestions,
  };
  const data = new FormData();
  data.set("format", "package");
  data.append("packageFiles", new File([JSON.stringify(manifest, null, 2)], "paper.json", { type: "application/json" }));
  for (const file of files) data.append("packageFiles", file);
  return data;
}

function responseFields(question, prefix) {
  const container = field("div", { className: "builder-response-settings" });
  if (question.type === "single-choice") {
    const label = field("label", { for: `${prefix}-options` }, "Answer choices — one per line");
    const textarea = field("textarea", { id: `${prefix}-options`, rows: "4", required: "", maxlength: "2000" });
    textarea.value = question.options;
    textarea.addEventListener("input", () => { question.options = textarea.value; });
    container.append(label, textarea);
  } else if (question.type === "essay") {
    const pair = field("div", { className: "inline-fields" });
    const minimumLabel = field("label", { for: `${prefix}-minimum` }, "Minimum words");
    const minimum = field("input", { id: `${prefix}-minimum`, type: "number", min: "1", max: "10000", value: question.wordCountMin });
    const maximumLabel = field("label", { for: `${prefix}-maximum` }, "Maximum words");
    const maximum = field("input", { id: `${prefix}-maximum`, type: "number", min: "1", max: "10000", value: question.wordCountMax });
    minimum.addEventListener("input", () => { question.wordCountMin = minimum.value; });
    maximum.addEventListener("input", () => { question.wordCountMax = maximum.value; });
    minimumLabel.append(minimum);
    maximumLabel.append(maximum);
    pair.append(minimumLabel, maximumLabel);
    container.append(pair);
  } else if (question.type === "ink") {
    const pair = field("div", { className: "inline-fields" });
    const pagesLabel = field("label", { for: `${prefix}-pages` }, "Canvas pages");
    const pages = field("select", { id: `${prefix}-pages` });
    [1, 2, 3, 4].forEach((value) => pages.append(option(String(value), String(value))));
    pages.value = String(question.inkPages);
    const backgroundLabel = field("label", { for: `${prefix}-background` }, "Canvas background");
    const background = field("select", { id: `${prefix}-background` });
    background.append(option("blank", "Blank"), option("lined", "Lined"), option("square-grid", "Square grid"));
    background.value = question.inkBackground;
    pages.addEventListener("change", () => { question.inkPages = Number(pages.value); });
    background.addEventListener("change", () => { question.inkBackground = background.value; });
    pagesLabel.append(pages);
    backgroundLabel.append(background);
    pair.append(pagesLabel, backgroundLabel);
    const help = field("small", {}, "Students can write or draw with a digital pen, touch, or mouse. A typed alternative remains available for accessibility.");
    container.append(pair, help);
  }
  return container;
}

export function mountPaperBuilder(container, onSubmit) {
  const questions = [];
  container.innerHTML = `
    <form id="paper-builder-form" class="utility-form paper-builder" method="post" enctype="multipart/form-data">
      <header class="builder-heading">
        <p class="eyebrow">Paper Builder</p>
        <h3>Create a practice paper</h3>
        <p>Choose the exact exam first. DigitalDP will then show the useful materials, questions and student entry areas.</p>
      </header>

      <fieldset class="builder-step builder-exam-picker">
        <legend><span>1</span> Choose the exam</legend>
        <label for="builder-session">Assessment session</label>
        <select id="builder-session" required>
          <option value="may-2026">May 2026 — current reference</option>
          <option value="may-2027">May 2027 — Psychology first-assessment preview</option>
          <option value="custom">Custom or another session</option>
        </select>
        <label for="builder-subject">Course</label><select id="builder-subject" required></select>
        <div class="inline-fields">
          <label for="builder-level">Level<select id="builder-level" required disabled></select></label>
          <label for="builder-paper">Paper<select id="builder-paper" required disabled></select></label>
        </div>
        <p class="form-help">Paper choices are starting points for building practice assessments. Check the current course guide for the examination session you are preparing. Changing an exam selector clears questions and attachments already entered.</p>
      </fieldset>

      <div id="builder-exam-setup" hidden>
        <div class="builder-exam-summary" role="status"><span>Selected exam</span><strong id="builder-exam-name"></strong></div>
        <p id="builder-exam-facts" class="builder-exam-facts"></p>
        <p id="builder-exam-guidance" class="builder-exam-guidance"></p>

        <div class="builder-workspace">
          <div class="builder-editor">
            <fieldset class="builder-step">
              <legend><span>2</span> Details and student materials</legend>
              <label for="builder-title">Practice paper title</label><input id="builder-title" required maxlength="160">
              <label for="builder-paper-label">Paper name</label><input id="builder-paper-label" required maxlength="80">
              <div class="inline-fields">
                <label for="builder-reading-time">Reading time in minutes<input id="builder-reading-time" type="number" min="0" max="60" required></label>
                <label for="builder-duration">Writing time in minutes<input id="builder-duration" type="number" min="5" max="360" required></label>
              </div>
              <p class="form-help">Reading time runs first and does not use a student's extra writing time. Enter 0 when the paper has no separate reading period.</p>
              <label for="builder-instructions">Student instructions</label><textarea id="builder-instructions" rows="3" required maxlength="20000"></textarea>
              <label for="builder-source-classification">Question/source rights status</label>
              <select id="builder-source-classification" required>
                <option value="unknown-local-only">Unknown or restricted — local-only</option>
                <option value="teacher-authored">Teacher-authored</option>
                <option value="school-authorized">School-authorized or licensed</option>
                <option value="official-public-reference">Official public specimen — reference only</option>
              </select>
              <p class="form-help">This records provenance; it does not grant reuse rights. Keep restricted or uncertain materials on the private school server.</p>
              <label id="builder-export-attestation" class="builder-attestation" hidden><input id="builder-export-authorized" type="checkbox"><span>I confirm that this paper and every attachment may be copied into a portable DigitalDP export.</span></label>
              <div class="builder-material" data-material="pdf">
                <label for="builder-pdf"><span id="builder-pdf-label">Paper-wide PDFs</span> <small id="builder-pdf-status">optional</small></label><input id="builder-pdf" type="file" accept="application/pdf,.pdf" multiple>
                <small>Attach the question paper, source booklet, and any clean data or formula booklet students need throughout the paper.</small>
              </div>
              <div class="builder-material" data-material="text">
                <label for="builder-source-text">Source text <small>optional</small></label><textarea id="builder-source-text" rows="4" maxlength="100000"></textarea>
              </div>
              <div class="builder-material" data-material="audio">
                <label for="builder-audio">Listening audio</label><input id="builder-audio" type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav" multiple>
                <small>Select one or more recordings. You can instead attach a recording to a specific question below.</small>
                <label for="builder-audio-plays">Maximum plays per recording</label><select id="builder-audio-plays"><option>1</option><option selected>2</option><option>3</option><option>4</option></select>
              </div>
            </fieldset>

            <fieldset class="builder-step">
              <legend><span>3</span> Questions and student entry areas</legend>
              <p class="form-help">Enter the wording that should print beside the student's response, then choose the entry area. Images print inline; PDFs and audio are listed as companion materials.</p>
              <div id="builder-questions" class="builder-questions"></div>
              <button id="builder-add-question" type="button">Add question and entry area</button>
            </fieldset>

            <p id="builder-error" class="status-message" role="alert" tabindex="-1" hidden></p>
            <button class="primary-action builder-submit" type="submit">Save paper to library</button>
          </div>

          <aside class="builder-preview-panel" aria-labelledby="builder-preview-title">
            <header class="builder-preview-heading">
              <div><p class="eyebrow">Paper preview</p><h4 id="builder-preview-title">Student paper</h4></div>
              <span>Updates as you type</span>
            </header>
            <div id="builder-preview-scroll" class="builder-preview-scroll" role="region" aria-label="Scrollable live paper preview" tabindex="0"></div>
          </aside>
        </div>
      </div>
    </form>
  `;

  const form = container.querySelector("#paper-builder-form");
  const assessmentSession = form.querySelector("#builder-session");
  const subject = form.querySelector("#builder-subject");
  const level = form.querySelector("#builder-level");
  const paper = form.querySelector("#builder-paper");
  const setup = form.querySelector("#builder-exam-setup");
  const preview = createPaperPreview(form.querySelector("#builder-preview-scroll"));
  const rights = form.querySelector("#builder-source-classification");
  const exportAttestation = form.querySelector("#builder-export-attestation");
  const exportAuthorized = form.querySelector("#builder-export-authorized");
  let previewFrame;

  function updateExportAttestation() {
    const eligible = ["teacher-authored", "school-authorized"].includes(rights.value);
    exportAttestation.hidden = !eligible;
    if (!eligible) exportAuthorized.checked = false;
  }

  function updatePreview() {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => preview.render(paperPreviewData(form, questions)));
  }

  function resetSelect(select, placeholder) {
    select.replaceChildren(option("", placeholder));
    select.value = "";
    select.disabled = true;
  }

  function populateSubjects() {
    hideSetup();
    resetSelect(level, "Choose level");
    resetSelect(paper, "Choose paper");
    subject.replaceChildren(option("", "Choose course"));
    for (const course of COURSES.filter((item) => courseSupportsSession(item, assessmentSession.value))) {
      subject.append(option(course.value, course.label));
    }
    subject.disabled = false;
  }

  function hideSetup() {
    setup.hidden = true;
    cancelAnimationFrame(previewFrame);
    preview.clear();
    questions.splice(0, questions.length);
    form.querySelector("#builder-questions").replaceChildren();
    form.querySelector("#builder-pdf").value = "";
    form.querySelector("#builder-source-text").value = "";
    form.querySelector("#builder-audio").value = "";
  }

  function populateLevels() {
    hideSetup();
    resetSelect(paper, "Choose paper");
    const course = selectedCourse(form);
    resetSelect(level, "Choose level");
    if (!course) return;
    for (const item of levelsForCourse(course, assessmentSession.value)) {
      level.append(option(item, item === "SL/HL" ? "SL/HL — combined" : item));
    }
    level.disabled = false;
  }

  function populatePapers() {
    hideSetup();
    resetSelect(paper, "Choose paper");
    const course = selectedCourse(form);
    if (!course || !level.value) return;
    for (const item of papersForLevel(course, assessmentSession.value, level.value)) {
      paper.append(option(item.value, item.label));
    }
    paper.disabled = false;
  }

  function renderQuestions(focusTarget) {
    const list = form.querySelector("#builder-questions");
    list.replaceChildren();
    questions.forEach((question, index) => {
      if (/^Question \d+$/u.test(question.label)) question.label = `Question ${index + 1}`;
      const prefix = `builder-q-${question.key}`;
      const card = field("fieldset", { className: "builder-question" });
      card.dataset.questionKey = String(question.key);
      const legend = field("legend", {}, `${question.label} and entry area`);
      const actions = field("div", { className: "builder-question-actions" });
      const up = field("button", { type: "button", title: "Move question up", "aria-label": `Move ${question.label} up` }, "↑");
      const down = field("button", { type: "button", title: "Move question down", "aria-label": `Move ${question.label} down` }, "↓");
      up.dataset.action = "up";
      down.dataset.action = "down";
      const remove = field("button", { type: "button" }, "Remove");
      up.disabled = index === 0;
      down.disabled = index === questions.length - 1;
      const minimumQuestions = selectedExam(form)?.paper.minimumQuestions ?? 1;
      remove.disabled = questions.length <= minimumQuestions;
      actions.append(up, down, remove);

      const labelLabel = field("label", { for: `${prefix}-label` }, "Question label");
      const labelInput = field("input", { id: `${prefix}-label`, required: "", maxlength: "100", value: question.label });
      const promptLabel = field("label", { for: `${prefix}-prompt` }, "Question or prompt — included in printout");
      const prompt = field("textarea", { id: `${prefix}-prompt`, rows: "3", required: "", maxlength: "10000" });
      prompt.value = question.prompt;
      const marksLabel = field("label", { for: `${prefix}-marks` }, "Marks for this question (optional)");
      const marks = field("input", { id: `${prefix}-marks`, type: "number", min: "1", max: "1000", value: question.marks });
      const typeLabel = field("label", { for: `${prefix}-type` }, "Student entry area");
      const type = field("select", { id: `${prefix}-type` });
      type.append(
        option("essay", "Long typed response"),
        option("short", "Short typed response"),
        option("single-choice", "Multiple-choice"),
        option("ink", "Digital working canvas"),
      );
      type.value = question.type;
      const allowsAudio = selectedExam(form)?.paper.mode === "listening";
      const mediaLabel = field(
        "label",
        { for: `${prefix}-media` },
        allowsAudio ? "Question media — images, PDFs or audio (optional)" : "Question media — images or PDFs (optional)",
      );
      const media = field("input", {
        id: `${prefix}-media`,
        type: "file",
        accept: allowsAudio
          ? "application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp,audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
          : "application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp",
        multiple: "",
      });
      const mediaStatus = field("small", { className: "builder-media-status" });
      const clearMedia = field("button", { type: "button", className: "quiet-action compact" }, "Clear question media");
      function updateMediaStatus() {
        mediaStatus.textContent = question.mediaFiles.length
          ? `Attached to this question: ${question.mediaFiles.map((file) => file.name).join(", ")}`
          : "Shown only with this question. Images also print inline.";
        clearMedia.hidden = question.mediaFiles.length === 0;
      }
      if (question.mediaFiles.length && typeof DataTransfer === "function") {
        const transfer = new DataTransfer();
        question.mediaFiles.forEach((file) => transfer.items.add(file));
        media.files = transfer.files;
      }
      media.addEventListener("change", () => {
        question.mediaFiles = [...media.files];
        updateMediaStatus();
      });
      clearMedia.addEventListener("click", () => {
        question.mediaFiles = [];
        media.value = "";
        updateMediaStatus();
        media.focus();
      });
      updateMediaStatus();
      labelInput.addEventListener("input", () => {
        question.label = labelInput.value;
        legend.textContent = `${labelInput.value || `Question ${index + 1}`} and entry area`;
      });
      prompt.addEventListener("input", () => { question.prompt = prompt.value; });
      marks.addEventListener("input", () => { question.marks = marks.value; });
      type.addEventListener("change", () => { question.type = type.value; renderQuestions({ key: question.key, selector: "select[id$='-type']" }); });
      up.addEventListener("click", () => { questions.splice(index - 1, 0, questions.splice(index, 1)[0]); renderQuestions({ key: question.key, selector: "button[data-action='up']" }); });
      down.addEventListener("click", () => { questions.splice(index + 1, 0, questions.splice(index, 1)[0]); renderQuestions({ key: question.key, selector: "button[data-action='down']" }); });
      remove.addEventListener("click", () => { questions.splice(index, 1); renderQuestions(); });
      card.append(
        legend,
        actions,
        labelLabel,
        labelInput,
        promptLabel,
        prompt,
        marksLabel,
        marks,
        mediaLabel,
        media,
        mediaStatus,
        clearMedia,
        typeLabel,
        type,
        responseFields(question, prefix),
      );
      list.append(card);
    });
    if (focusTarget) {
      requestAnimationFrame(() => {
        list.querySelector(`[data-question-key="${focusTarget.key}"] ${focusTarget.selector}`)?.focus();
      });
    }
    updatePreview();
  }

  function applyExam() {
    hideSetup();
    const selection = selectedExam(form);
    if (!selection) return;
    const { assessmentSession: sessionValue, course, level: selectedLevel, paper: selectedPaper } = selection;
    const sessionLabel = assessmentSession.selectedOptions[0]?.textContent ?? sessionValue;
    form.querySelector("#builder-exam-name").textContent = `${sessionLabel} · ${course.label} · ${selectedLevel} · ${selectedPaper.label}`;
    form.querySelector("#builder-title").value = `${course.label} ${selectedLevel} ${selectedPaper.label} practice`;
    form.querySelector("#builder-paper-label").value = selectedPaper.label;
    form.querySelector("#builder-reading-time").value = String(selectedPaper.readingTime);
    const duration = valueForLevel(selectedPaper, "duration", selectedLevel);
    form.querySelector("#builder-duration").value = String(duration);
    form.querySelector("#builder-instructions").value = valueForLevel(selectedPaper, "instructions", selectedLevel);
    const guidance = valueForLevel(selectedPaper, "guidance", selectedLevel);
    const guidanceElement = form.querySelector("#builder-exam-guidance");
    const combinedGuidance = selectedLevel === "SL/HL"
      ? "This is a combined-level custom paper. It uses one shared timer and response rule, so review every default before assigning it to both SL and HL students. "
      : "";
    guidanceElement.textContent = `${combinedGuidance}${guidance ?? "Add each question, then choose the response area students should receive."}`;
    const facts = [
      `${selectedPaper.readingTime} min reading`,
      `${duration} min writing`,
      valueForLevel(selectedPaper, "maximumMarks", selectedLevel) ? `${valueForLevel(selectedPaper, "maximumMarks", selectedLevel)} marks` : "marks: confirm current guide",
      valueForLevel(selectedPaper, "subjectWeightPercent", selectedLevel) ? `${valueForLevel(selectedPaper, "subjectWeightPercent", selectedLevel)}% of subject` : null,
    ].filter(Boolean);
    if (selectedLevel === "SL/HL") facts.unshift("combined custom profile");
    form.querySelector("#builder-exam-facts").textContent = facts.join(" · ");
    const pdfLabel = form.querySelector("#builder-pdf-label");
    const pdfStatus = form.querySelector("#builder-pdf-status");
    pdfLabel.textContent = selectedPaper.requiredDocumentLabel
      ? `Paper-wide PDFs — include the ${selectedPaper.requiredDocumentLabel}`
      : "Paper-wide PDFs";
    pdfStatus.textContent = selectedPaper.requiredDocumentLabel ? "required for verified preset" : "optional";
    for (const material of form.querySelectorAll(".builder-material")) {
      material.hidden = !selectedPaper.materials.includes(material.dataset.material);
    }
    const initialQuestions = selectedPaper.initialQuestions ?? [questionForLevel(selectedPaper, selectedLevel)];
    initialQuestions.forEach((template, index) => questions.push(questionFrom(template, index + 1)));
    renderQuestions();
    setup.hidden = false;
    updatePreview();
  }

  subject.addEventListener("change", populateLevels);
  assessmentSession.addEventListener("change", populateSubjects);
  level.addEventListener("change", populatePapers);
  paper.addEventListener("change", applyExam);
  rights.addEventListener("change", updateExportAttestation);
  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  form.querySelector("#builder-add-question").addEventListener("click", () => {
    const selection = selectedExam(form);
    const suggested = selection
      ? questionForLevel(selection.paper, selection.level)
      : { type: "short", prompt: "Enter your question." };
    questions.push(questionFrom(suggested, questions.length + 1));
    renderQuestions();
    form.querySelector("#builder-questions > :last-child")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    const error = form.querySelector("#builder-error");
    submit.disabled = true;
    error.hidden = true;
    try {
      await onSubmit(packageData(form, questions));
      form.reset();
      updateExportAttestation();
      populateSubjects();
      subject.focus();
    } catch (caught) {
      error.textContent = caught instanceof Error ? caught.message : "Could not add paper";
      error.hidden = false;
      error.focus();
    } finally {
      submit.disabled = false;
    }
  });

  populateSubjects();
  updateExportAttestation();
}
