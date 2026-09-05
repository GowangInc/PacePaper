import { describe, expect, test } from "bun:test";
import { CURRENT_SAMPLE_COURSE_IDS } from "../examples/sample-source/index.ts";
import {
  BUILDER_LEVELS,
  COURSES,
  EXAM_SYSTEMS,
  levelsForCourse,
  packageData,
  paperPreviewData,
  papersForLevel,
  valueForLevel,
} from "./paper-builder.js";

function builderForm(values = {}) {
  const controls = {
    "#builder-session": { value: "may-2026" },
    "#builder-subject": { value: "mathematics-analysis-approaches" },
    "#builder-level": { value: "SL" },
    "#builder-paper": { value: "paper-1" },
    "#builder-pdf": { files: [] },
    "#builder-audio": { files: [] },
    "#builder-source-text": { value: "Shared formula note" },
    "#builder-title": { value: "Media scoping test" },
    "#builder-paper-label": { value: "Paper 1" },
    "#builder-duration": { value: "90" },
    "#builder-reading-time": { value: "5" },
    "#builder-maximum-marks": { value: "80" },
    "#builder-instructions": { value: "Answer every question." },
    ...values,
  };
  return { querySelector: (selector) => controls[selector] };
}

describe("Paper Builder exam presets", () => {
  test("offers SL, HL and a safe combined level in stable order", () => {
    const mathematics = COURSES.find((course) => course.value === "mathematics-analysis-approaches");
    expect(BUILDER_LEVELS).toEqual(["SL", "HL", "SL/HL"]);
    expect(levelsForCourse(mathematics, "may-2026")).toEqual(BUILDER_LEVELS);
    expect(papersForLevel(mathematics, "may-2026", "SL/HL").map((paper) => paper.value)).toEqual(["paper-1", "paper-2"]);
    const paper1 = mathematics.papers.find((paper) => paper.value === "paper-1");
    expect(valueForLevel(paper1, "duration", "SL/HL")).toBe(120);
    expect(valueForLevel(paper1, "maximumMarks", "SL/HL")).toBeUndefined();
    expect(valueForLevel(paper1, "subjectWeightPercent", "SL/HL")).toBeUndefined();
  });

  test("offers exact exam-system profiles with system-specific terminology and formats", () => {
    expect(EXAM_SYSTEMS.map((system) => system.value)).toEqual([
      "ib-dp",
      "cambridge-igcse",
      "pearson-edexcel-igcse",
      "ap",
      "school-custom",
    ]);

    const cambridge = EXAM_SYSTEMS.find((system) => system.value === "cambridge-igcse");
    const cambridgeMaths = cambridge.courses[0];
    expect(cambridge.levelLabel).toBe("Tier");
    expect(levelsForCourse(cambridgeMaths, "2026", cambridge)).toEqual(["Core", "Extended"]);
    expect(papersForLevel(cambridgeMaths, "2026", "Extended").map((item) => item.value)).toEqual(["paper-2", "paper-4"]);
    expect(cambridgeMaths.papers.find((item) => item.value === "paper-2")).toMatchObject({
      duration: 120,
      maximumMarks: 100,
      responseTypes: ["short", "ink"],
    });

    const pearson = EXAM_SYSTEMS.find((system) => system.value === "pearson-edexcel-igcse");
    expect(levelsForCourse(pearson.courses[0], "2026", pearson)).toEqual(["Foundation", "Higher"]);
    expect(papersForLevel(pearson.courses[0], "2026", "Higher").map((item) => item.label)).toEqual(["Paper 1H", "Paper 2H"]);
    expect(pearson.courses.map(({ value }) => value)).toEqual([
      "pearson-igcse-mathematics-a",
      "pearson-igcse-mathematics-a-modular",
    ]);
    expect(papersForLevel(pearson.courses[1], "2026", "Higher").map((item) => item.label)).toEqual([
      "Unit 1 (4WM1H/01)",
      "Unit 2 (4WM2H/01)",
    ]);

    const ap = EXAM_SYSTEMS.find((system) => system.value === "ap");
    expect(ap.courses.find((course) => course.value === "ap-english-language-composition").papers[0]).toMatchObject({
      fidelity: "adapted",
      deliveryFormat: "Fully digital practice",
      responseTypes: ["single-choice", "essay"],
    });
    expect(ap.courses.find((course) => course.value === "ap-biology").papers[0]).toMatchObject({
      fidelity: "adapted",
      deliveryFormat: "Hybrid digital/paper practice",
      duration: 190,
      durationLabel: "Session timer",
      responseTypes: ["single-choice", "ink"],
    });
    expect(ap.courses.find((course) => course.value === "ap-calculus-ab").papers[0]).toMatchObject({
      duration: 200,
      minimumQuestions: 4,
      phases: [
        { id: "section-1a", durationMinutes: 62, tools: ["Calculator not permitted", "Digital multiple-choice"] },
        { id: "section-1b", durationMinutes: 38 },
        { id: "break", durationMinutes: 10 },
        { id: "section-2a", durationMinutes: 30 },
        { id: "section-2b", durationMinutes: 60 },
      ],
    });
  });

  test("stores AP timed sections and assigns each question to its section", async () => {
    const form = builderForm({
      "#builder-system": { value: "ap" },
      "#builder-session": { value: "may-2027" },
      "#builder-subject": { value: "ap-english-language-composition" },
      "#builder-level": { value: "AP" },
      "#builder-paper": { value: "end-of-course" },
      "#builder-title": { value: "AP English Language practice" },
      "#builder-paper-label": { value: "End-of-course exam — fully digital" },
      "#builder-duration": { value: "205" },
      "#builder-reading-time": { value: "0" },
      "#builder-maximum-marks": { value: "" },
      "#builder-instructions": { value: "Complete the multiple-choice and free-response practice sections. Follow the teacher's instruction for the monitored break." },
      "#builder-source-text": { value: "" },
    });
    const questions = [
      { label: "Section I item", prompt: "Choose.", type: "single-choice", options: "A\nB", sectionId: "section-1", mediaFiles: [] },
      { label: "Section II response", prompt: "Write.", type: "essay", sectionId: "section-2", mediaFiles: [] },
    ];
    const manifest = JSON.parse(await packageData(form, questions).getAll("packageFiles")[0].text());
    expect(manifest.phases.map(({ id, kind, durationMinutes }) => ({ id, kind, durationMinutes }))).toEqual([
      { id: "section-1", kind: "work", durationMinutes: 60 },
      { id: "break", kind: "break", durationMinutes: 10 },
      { id: "section-2", kind: "work", durationMinutes: 135 },
    ]);
    expect(manifest.questions.map(({ sectionId }) => sectionId)).toEqual(["section-1", "section-2"]);
    expect(manifest.examFormat.fidelity).toBe("adapted");
    form.querySelector("#builder-instructions").value += " Show your working clearly.";
    form.querySelector("#builder-maximum-marks").value = "50";
    const edited = JSON.parse(await packageData(form, questions).getAll("packageFiles")[0].text());
    expect(edited.phases).toEqual(manifest.phases);
    expect(edited.phases).toEqual(paperPreviewData(form, questions).phases);
    form.querySelector("#builder-duration").value = "206";
    expect(() => packageData(form, questions)).toThrow("fixed timed sections");
    expect(() => paperPreviewData(form, questions)).toThrow("fixed timed sections");
  });

  test("keeps all verified IGCSE components available for 2027 with the same timing and tiers", () => {
    for (const systemId of ["cambridge-igcse", "pearson-edexcel-igcse"]) {
      const system = EXAM_SYSTEMS.find(({ value }) => value === systemId);
      expect(system.sessions.some(({ value }) => value === "2027")).toBeTrue();
      for (const course of system.courses) {
        for (const level of system.levelOrder) {
          const components = papersForLevel(course, "2027", level);
          expect(components).toHaveLength(2);
          expect(components).toEqual(papersForLevel(course, "2026", level));
          for (const component of components) {
            expect(component.duration).toBe(systemId === "cambridge-igcse" && level === "Core" ? 90 : 120);
            expect(component.maximumMarks).toBe(systemId === "cambridge-igcse" && level === "Core" ? 80 : 100);
            expect(component.readingTime).toBe(0);
          }
        }
      }
    }
  });

  test("provides current calculator and reference rules before non-IB papers are built", () => {
    const cambridge = EXAM_SYSTEMS.find(({ value }) => value === "cambridge-igcse").courses[0];
    for (const id of ["paper-3", "paper-4"]) {
      const paper = cambridge.papers.find(({ value }) => value === id);
      expect(paper.instructions).toContain("algebraic or graphical calculators must not be used");
      expect(paper.instructions).toContain("three significant figures");
      expect(paper.instructions).toContain("one decimal place for angles in degrees");
    }
    const ap = EXAM_SYSTEMS.find(({ value }) => value === "ap");
    const biology = ap.courses.find(({ value }) => value === "ap-biology").papers[0];
    expect(biology.requiredDocumentLabel).toContain("AP Biology equations and formulas sheet");
    expect(biology.instructions).toContain("four-function calculator with square root");
    for (const phase of biology.phases.filter(({ kind }) => kind === "work")) {
      expect(phase.tools.join(" ")).toContain("nongraphing");
      expect(phase.tools).toContain("AP Biology equations and formulas sheet");
      expect(phase.instructions).toContain("handheld calculators with storage capabilities are not allowed");
    }
  });

  test("stores the selected Cambridge format and tuned rules in the paper manifest", async () => {
    const form = builderForm({
      "#builder-system": { value: "cambridge-igcse" },
      "#builder-session": { value: "2026" },
      "#builder-subject": { value: "cambridge-igcse-mathematics-0580" },
      "#builder-level": { value: "Extended" },
      "#builder-paper": { value: "paper-2" },
      "#builder-title": { value: "Mathematics 0580 Extended Paper 2 practice" },
      "#builder-paper-label": { value: "Paper 2 — Non-calculator (Extended)" },
      "#builder-duration": { value: "120" },
      "#builder-reading-time": { value: "0" },
      "#builder-maximum-marks": { value: "100" },
      "#builder-instructions": { value: "Answer all questions. Calculators must not be used. Show all necessary working clearly." },
      "#builder-pdf": { files: [new File(["formula list"], "0580-formula-list.pdf", { type: "application/pdf" })] },
      "#builder-source-text": { value: "" },
    });
    const question = [{
      label: "Question 1",
      prompt: "Show your working.",
      type: "ink",
      inkPages: 1,
      inkBackground: "square-grid",
      mediaFiles: [],
    }];
    const manifest = JSON.parse(await packageData(form, question).getAll("packageFiles")[0].text());

    expect(manifest).toMatchObject({
      assessmentSession: "2026",
      examProfileId: "cambridge-igcse:2026:cambridge-igcse-mathematics-0580:Extended:paper-2",
      level: "Extended",
      durationMinutes: 120,
      maximumMarks: 100,
      examFormat: {
        systemId: "cambridge-igcse",
        systemLabel: "Cambridge IGCSE",
        deliveryMode: "Paper-like digital practice",
        fidelity: "official-format",
      },
    });
    expect(manifest.examFormat.rulesSummary).toContain("No calculator");
    expect(manifest.resources).toContainEqual({
      key: "paper-1",
      label: "Paper-wide PDF",
      kind: "document",
      file: "0580-formula-list.pdf",
    });
  });

  test("builds preview data from the live combined-level fields without claiming one level's marks", () => {
    const form = builderForm({
      "#builder-level": { value: "SL/HL" },
      "#builder-title": { value: "Combined mathematics sampler" },
      "#builder-duration": { value: "120" },
      "#builder-maximum-marks": { value: "" },
      "#builder-instructions": { value: "Complete the shared practice questions." },
    });
    const preview = paperPreviewData(form, [{
      label: "Reasoning",
      prompt: "Show two methods.",
      type: "ink",
      marks: "6",
      inkPages: 2,
      inkBackground: "square-grid",
      mediaFiles: [],
    }]);
    expect(preview).toMatchObject({
      title: "Combined mathematics sampler",
      level: "SL/HL",
      durationMinutes: 120,
      maximumMarks: undefined,
      subjectWeightPercent: undefined,
      instructions: "Complete the shared practice questions.",
      questions: [{ label: "Reasoning", prompt: "Show two methods.", marks: "6", type: "ink", inkPages: 2 }],
    });
  });

  test("saves a combined-level starter as custom rather than claiming an official profile", async () => {
    const form = builderForm({
      "#builder-level": { value: "SL/HL" },
      "#builder-duration": { value: "120" },
      "#builder-maximum-marks": { value: "" },
      "#builder-pdf": { files: [new File(["formulae"], "formula-booklet.pdf", { type: "application/pdf" })] },
    });
    const data = packageData(form, [{
      label: "Question 1",
      prompt: "Show your working.",
      type: "ink",
      inkPages: 1,
      inkBackground: "square-grid",
      mediaFiles: [],
    }]);
    const manifest = JSON.parse(await data.getAll("packageFiles")[0].text());

    expect(manifest).toMatchObject({ level: "SL/HL", durationMinutes: 120, assessmentSession: "custom-from-may-2026" });
    expect(manifest.examProfileId).toBeUndefined();
    expect(manifest.maximumMarks).toBeUndefined();
    expect(manifest.subjectWeightPercent).toBeUndefined();
  });

  test("serializes the teacher's default canvas background for an ink question", async () => {
    const data = packageData(builderForm(), [{
      label: "Question 1",
      prompt: "Show your working.",
      type: "ink",
      inkPages: 2,
      inkBackground: "lined",
      mediaFiles: [],
    }]);
    const manifest = JSON.parse(await data.getAll("packageFiles")[0].text());

    expect(manifest.questions[0].ink).toEqual({
      pages: 2,
      background: "lined",
      allowTypedAlternative: true,
    });
  });

  test("treats papers built in the internal teacher workflow as portable school papers", async () => {
    const question = [{ label: "Question 1", prompt: "Explain your reasoning.", type: "short", mediaFiles: [] }];
    const manifest = JSON.parse(await packageData(builderForm(), question).getAll("packageFiles")[0].text());
    expect(manifest).toMatchObject({ sourceClassification: "school-authorized", exportAuthorized: true });
  });

  test("every course exposes valid level-specific paper choices", () => {
    expect(new Set(COURSES.map((course) => course.value)).size).toBe(COURSES.length);
    for (const course of COURSES) {
      expect(course.label.length).toBeGreaterThan(0);
      expect(course.papers.length).toBeGreaterThan(0);
      const sessions = new Set(course.papers.flatMap((paper) => paper.sessions));
      for (const session of sessions) {
        const sessionPapers = course.papers.filter((paper) => paper.sessions.includes(session));
        for (const level of new Set(sessionPapers.flatMap((paper) => paper.levels))) {
          const papers = sessionPapers.filter((paper) => paper.levels.includes(level));
          expect(papers.length).toBeGreaterThan(0);
          expect(new Set(papers.map((paper) => paper.value)).size).toBe(papers.length);
        }
      }
    }
  });

  test("the example library stays aligned with every course in the builder", () => {
    const profiledCourses = EXAM_SYSTEMS
      .filter((system) => system.value !== "school-custom")
      .flatMap((system) => system.courses.map((course) => course.value));
    expect([...CURRENT_SAMPLE_COURSE_IDS].sort()).toEqual(profiledCourses.sort());
  });

  test("current mathematics choices apply the 2026 timing matrix", () => {
    for (const courseId of ["mathematics-analysis-approaches", "mathematics-applications-interpretation"]) {
      const course = COURSES.find((item) => item.value === courseId);
      const paper1 = course.papers.find((paper) => paper.value === "paper-1");
      const paper2 = course.papers.find((paper) => paper.value === "paper-2");
      const paper3 = course.papers.find((paper) => paper.value === "paper-3");
      expect(paper1.durationByLevel).toEqual({ SL: 90, HL: 120 });
      expect(paper2.durationByLevel).toEqual({ SL: 90, HL: 120 });
      expect(paper3.duration).toBe(60);
      expect(paper3.levels).toEqual(["HL"]);
      expect(paper1.maximumMarksByLevel).toEqual({ SL: 80, HL: 110 });
      expect(paper1.subjectWeightPercentByLevel).toEqual({ SL: 40, HL: 30 });
    }
  });

  test("current language, science, psychology and business choices apply the 2026 timing matrix", () => {
    const englishA = COURSES.find((item) => item.value === "english-a-literature");
    expect(englishA.papers.find((paper) => paper.value === "paper-1").durationByLevel).toEqual({ SL: 75, HL: 135 });
    expect(englishA.papers.find((paper) => paper.value === "paper-2").duration).toBe(105);

    const englishB = COURSES.find((item) => item.value === "english-b");
    expect(englishB.papers.find((paper) => paper.value === "paper-1").durationByLevel).toEqual({ SL: 75, HL: 90 });
    expect(englishB.papers.find((paper) => paper.value === "paper-1").questionByLevel).toEqual({
      SL: { wordCountMin: 250, wordCountMax: 400 },
      HL: { wordCountMin: 450, wordCountMax: 600 },
    });
    expect(englishB.papers.find((paper) => paper.value === "paper-2-reading").duration).toBe(60);
    expect(englishB.papers.find((paper) => paper.value === "paper-2-listening").durationByLevel).toEqual({ SL: 45, HL: 60 });
    expect(englishB.papers.find((paper) => paper.value === "paper-2-listening").readingTime).toBe(0);

    const biology = COURSES.find((item) => item.value === "biology");
    expect(biology.papers.map((paper) => paper.value)).toEqual(["paper-1", "paper-2"]);
    expect(biology.papers.find((paper) => paper.value === "paper-1").durationByLevel).toEqual({ SL: 90, HL: 120 });
    expect(biology.papers.find((paper) => paper.value === "paper-2").durationByLevel).toEqual({ SL: 90, HL: 150 });
    expect(biology.papers.find((paper) => paper.value === "paper-2").guidanceByLevel.SL).toContain("one-of-two");
    for (const courseId of ["chemistry", "physics"]) {
      const course = COURSES.find((item) => item.value === courseId);
      expect(course.papers.find((paper) => paper.value === "paper-2").guidanceByLevel.SL).toContain("All questions are compulsory");
    }
    const physics = COURSES.find((item) => item.value === "physics");
    expect(physics.papers.find((paper) => paper.value === "paper-2").maximumMarksByLevel).toEqual({ SL: 50, HL: 90 });

    const psychology = COURSES.find((item) => item.value === "psychology");
    const legacyPsychology = psychology.papers.filter((paper) => paper.sessions.includes("may-2026"));
    expect(legacyPsychology.find((paper) => paper.value === "paper-1").duration).toBe(120);
    expect(legacyPsychology.find((paper) => paper.value === "paper-2").durationByLevel).toEqual({ SL: 60, HL: 120 });
    expect(legacyPsychology.find((paper) => paper.value === "paper-3").levels).toEqual(["HL"]);
    const futurePsychology = psychology.papers.filter((paper) => paper.sessions.includes("may-2027"));
    expect(futurePsychology.find((paper) => paper.value === "paper-1").duration).toBe(90);
    expect(futurePsychology.find((paper) => paper.value === "paper-2").duration).toBe(90);
    expect(futurePsychology.find((paper) => paper.value === "paper-3").duration).toBe(105);

    const business = COURSES.find((item) => item.value === "business-management");
    expect(business.papers.find((paper) => paper.value === "paper-1").duration).toBe(90);
    expect(business.papers.find((paper) => paper.value === "paper-2").durationByLevel).toEqual({ SL: 90, HL: 105 });
    expect(business.papers.find((paper) => paper.value === "paper-2").maximumMarksByLevel).toEqual({ SL: 40, HL: 50 });
    expect(business.papers.find((paper) => paper.value === "paper-3").duration).toBe(75);
    expect(business.papers.find((paper) => paper.value === "paper-3").levels).toEqual(["HL"]);
  });

  test("level-specific selection rules are resolved into the manifest", async () => {
    const question = {
      label: "Text 1",
      prompt: "Analyse the text.",
      type: "essay",
      wordCountMin: "",
      wordCountMax: "",
      mediaFiles: [],
    };
    const common = {
      "#builder-subject": { value: "english-a-literature" },
      "#builder-paper": { value: "paper-1" },
      "#builder-source-text": { value: "" },
    };
    const slData = packageData(builderForm({ ...common, "#builder-level": { value: "SL" } }), [question]);
    const hlData = packageData(builderForm({ ...common, "#builder-level": { value: "HL" } }), [question]);
    const slManifest = JSON.parse(await slData.getAll("packageFiles")[0].text());
    const hlManifest = JSON.parse(await hlData.getAll("packageFiles")[0].text());
    expect(slManifest.selectionMode).toBe("one");
    expect(hlManifest.selectionMode).toBe("all");
  });

  test("complete written presets carry five minutes while Language B listening uses its own cadence", () => {
    for (const course of COURSES) {
      for (const paper of course.papers) {
        if (paper.mode === "listening") expect(paper.readingTime).toBe(0);
        else expect(paper.readingTime).toBe(5);
      }
    }
  });

  test("the May 2027 session resolves only the new Psychology cycle", async () => {
    const form = builderForm({
      "#builder-session": { value: "may-2027" },
      "#builder-subject": { value: "psychology" },
      "#builder-level": { value: "HL" },
      "#builder-paper": { value: "paper-3" },
      "#builder-paper-label": { value: "Paper 3 — first assessment 2027" },
      "#builder-duration": { value: "105" },
      "#builder-reading-time": { value: "5" },
      "#builder-maximum-marks": { value: "30" },
      "#builder-instructions": { value: "Use the supplied resource booklet and answer all four source-based questions." },
      "#builder-source-text": { value: "Resource booklet extract" },
    });
    const question = [{ label: "Question 1", prompt: "Interpret the source.", type: "short", mediaFiles: [] }];
    const manifest = JSON.parse(await packageData(form, question).getAll("packageFiles")[0].text());
    expect(manifest.examProfileId).toBe("ib-dp:may-2027:psychology:HL:paper-3");
    expect(manifest.durationMinutes).toBe(105);
    expect(() => packageData(builderForm({
      "#builder-session": { value: "may-2027" },
      "#builder-subject": { value: "english-b" },
      "#builder-paper": { value: "paper-1" },
    }), question)).toThrow("Choose an exam system, course, level or tier, and examination format first");
  });

  test("edited or custom timing cannot retain an official-looking exam profile", async () => {
    const formulaBooklet = new File(["formulae"], "formula-booklet.pdf", { type: "application/pdf" });
    const question = {
      label: "Question 1",
      prompt: "Show your working.",
      type: "ink",
      inkPages: 1,
      inkBackground: "square-grid",
      marks: "8",
      mediaFiles: [],
    };
    const officialControls = {
      "#builder-paper-label": { value: "Paper 1" },
      "#builder-duration": { value: "90" },
      "#builder-reading-time": { value: "5" },
      "#builder-instructions": { value: "Answer every question. Show your working where required." },
      "#builder-pdf": { files: [formulaBooklet] },
    };
    const official = JSON.parse(await packageData(builderForm(officialControls), [question]).getAll("packageFiles")[0].text());
    const edited = JSON.parse(await packageData(builderForm({ ...officialControls, "#builder-duration": { value: "42" } }), [question]).getAll("packageFiles")[0].text());
    const custom = JSON.parse(await packageData(builderForm({ ...officialControls, "#builder-session": { value: "custom" } }), [question]).getAll("packageFiles")[0].text());
    expect(official.examProfileId).toBe("ib-dp:may-2026:mathematics-analysis-approaches:SL:paper-1");
    expect(official.examFormat).toMatchObject({ systemId: "ib-dp", fidelity: "official-format" });
    expect(official.assessmentSession).toBe("may-2026");
    expect(official.resources[0]).toMatchObject({ key: "paper-1", kind: "document", file: "formula-booklet.pdf" });
    expect(official).toMatchObject({ maximumMarks: 80, subjectWeightPercent: 40 });
    expect(official.questions[0].marks).toBe(8);
    expect(edited.examProfileId).toBeUndefined();
    expect(edited.assessmentSession).toBe("custom-from-may-2026");
    expect(custom.examProfileId).toBeUndefined();
    expect(custom.assessmentSession).toBe("custom");
    const { "#builder-pdf": _pdf, ...withoutRequiredBooklet } = officialControls;
    const missingRequiredBooklet = JSON.parse(await packageData(builderForm(withoutRequiredBooklet), [question]).getAll("packageFiles")[0].text());
    expect(missingRequiredBooklet.examProfileId).toBeUndefined();
    expect(missingRequiredBooklet.assessmentSession).toBe("custom-from-may-2026");
  });

  test("uses a teacher-edited positive maximum in the preview and saved manifest", async () => {
    const form = builderForm({ "#builder-maximum-marks": { value: "72" } });
    const question = [{ label: "Question 1", prompt: "Show your reasoning.", type: "short", mediaFiles: [] }];
    expect(paperPreviewData(form, question).maximumMarks).toBe(72);

    const manifest = JSON.parse(await packageData(form, question).getAll("packageFiles")[0].text());
    expect(manifest.maximumMarks).toBe(72);
    expect(manifest.examProfileId).toBeUndefined();
    expect(manifest.assessmentSession).toBe("custom-from-may-2026");
    expect(() => packageData(builderForm({ "#builder-maximum-marks": { value: "0" } }), question)).toThrow("Maximum marks");
    expect(() => packageData(builderForm({ "#builder-maximum-marks": { value: "4.5" } }), question)).toThrow("Maximum marks");
  });

  test("combined science Paper 1 requires both component starter cards", () => {
    const form = builderForm({ "#builder-subject": { value: "biology" } });
    const oneQuestion = [{
      label: "Paper 1A item",
      prompt: "Choose one answer.",
      type: "single-choice",
      options: "A\nB\nC\nD",
      mediaFiles: [],
    }];
    expect(() => packageData(form, oneQuestion)).toThrow("at least 2 question");
  });

  test("presets always provide a valid initial student entry area", () => {
    const responseTypes = new Set(["essay", "short", "single-choice", "ink"]);
    for (const course of COURSES) {
      for (const paper of course.papers) {
        expect(responseTypes.has(paper.question.type)).toBe(true);
        expect(paper.question.prompt.length).toBeGreaterThan(0);
        expect(paper.materials.length).toBeGreaterThan(0);
        expect(["one", "all"]).toContain(paper.selectionMode);
        for (const selectionMode of Object.values(paper.selectionModeByLevel ?? {})) {
          expect(["one", "all"]).toContain(selectionMode);
        }
        expect(paper.readingTime).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("question media stays scoped to its question while shared resources stay shared", async () => {
    const diagram = new File(["diagram"], "diagram.png", { type: "image/png" });
    const questions = [
      {
        label: "Question 1",
        prompt: "Use the diagram.",
        type: "short",
        mediaFiles: [diagram],
      },
      {
        label: "Question 2",
        prompt: "Answer without the diagram.",
        type: "short",
        mediaFiles: [],
      },
    ];
    const data = packageData(builderForm(), questions);
    const [manifestFile, uploadedDiagram] = data.getAll("packageFiles");
    const manifest = JSON.parse(await manifestFile.text());

    expect(uploadedDiagram.name).toBe("diagram.png");
    expect(manifest.resources.map((resource) => resource.key)).toEqual(["source-text", "q1-media-1"]);
    expect(manifest.questions[0].resourceKeys).toEqual(["source-text", "q1-media-1"]);
    expect(manifest.questions[1].resourceKeys).toEqual(["source-text"]);
  });

  test("listening papers require audio and allow a recording to be scoped to one question", async () => {
    const form = builderForm({
      "#builder-subject": { value: "english-b" },
      "#builder-paper": { value: "paper-2-listening" },
      "#builder-audio": { files: [] },
      "#builder-source-text": { value: "" },
    });
    const questions = [
      { label: "Text 1", prompt: "Listen and answer.", type: "short", mediaFiles: [] },
      { label: "Text 2", prompt: "Answer without audio.", type: "short", mediaFiles: [] },
    ];
    expect(() => packageData(form, questions)).toThrow("Attach at least one audio file");

    questions[0].mediaFiles.push(new File(["audio"], "text-1.mp3", { type: "audio/mpeg" }));
    const data = packageData(form, questions);
    const [manifestFile] = data.getAll("packageFiles");
    const manifest = JSON.parse(await manifestFile.text());

    expect(manifest.resources).toEqual([{
      key: "q1-media-1",
      label: "Text 1 media 1",
      kind: "audio",
      file: "text-1.mp3",
      maxPlays: 2,
    }]);
    expect(manifest.questions[0].resourceKeys).toEqual(["q1-media-1"]);
    expect(manifest.questions[1].resourceKeys).toEqual([]);
  });

  test("packages shared recordings with the fixed two-play policy", async () => {
    const recording = new File(["audio"], "paper-audio.mp3", { type: "audio/mpeg" });
    const form = builderForm({
      "#builder-subject": { value: "english-b" },
      "#builder-paper": { value: "paper-2-listening" },
      "#builder-audio": { files: [recording] },
      "#builder-source-text": { value: "" },
    });
    const questions = [{ label: "Text 1", prompt: "Listen and answer.", type: "short", mediaFiles: [] }];

    const preview = paperPreviewData(form, questions);
    expect(preview.sharedResources[0]).toMatchObject({ name: "paper-audio.mp3", kind: "audio", maxPlays: 2 });

    const manifest = JSON.parse(await packageData(form, questions).getAll("packageFiles")[0].text());
    expect(manifest.resources[0]).toMatchObject({ file: "paper-audio.mp3", kind: "audio", maxPlays: 2 });
    expect(manifest.questions[0].resourceKeys).toEqual(["audio-1"]);
  });
});
