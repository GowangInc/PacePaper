import { describe, expect, test } from "bun:test";
import { COURSES, packageData } from "./paper-builder.js";

function builderForm(values = {}) {
  const controls = {
    "#builder-session": { value: "may-2026" },
    "#builder-subject": { value: "mathematics-analysis-approaches" },
    "#builder-level": { value: "SL" },
    "#builder-paper": { value: "paper-1" },
    "#builder-pdf": { files: [] },
    "#builder-audio": { files: [] },
    "#builder-source-text": { value: "Shared formula note" },
    "#builder-audio-plays": { value: "2" },
    "#builder-title": { value: "Media scoping test" },
    "#builder-paper-label": { value: "Paper 1" },
    "#builder-duration": { value: "90" },
    "#builder-reading-time": { value: "5" },
    "#builder-instructions": { value: "Answer every question." },
    "#builder-source-classification": { value: "teacher-authored" },
    ...values,
  };
  return { querySelector: (selector) => controls[selector] };
}

describe("Paper Builder exam presets", () => {
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

  test("current mathematics choices apply the 2026 timing matrix", () => {
    for (const courseId of ["mathematics-analysis-approaches", "mathematics-applications-interpretation"]) {
      const course = COURSES.find((item) => item.value === courseId);
      const paper1 = course.papers.find((paper) => paper.value === "paper-1");
      const paper2 = course.papers.find((paper) => paper.value === "paper-2");
      const paper3 = course.papers.find((paper) => paper.value === "paper-3");
      expect(paper1.durationByLevel).toEqual({ SL: 90, HL: 120 });
      expect(paper2.durationByLevel).toEqual({ SL: 90, HL: 120 });
      expect(paper3.duration).toBe(75);
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
      "#builder-instructions": { value: "Use the supplied resource booklet and answer all four source-based questions." },
      "#builder-source-text": { value: "Resource booklet extract" },
    });
    const question = [{ label: "Question 1", prompt: "Interpret the source.", type: "short", mediaFiles: [] }];
    const manifest = JSON.parse(await packageData(form, question).getAll("packageFiles")[0].text());
    expect(manifest.examProfileId).toBe("may-2027:psychology:HL:paper-3");
    expect(manifest.durationMinutes).toBe(105);
    expect(() => packageData(builderForm({
      "#builder-session": { value: "may-2027" },
      "#builder-subject": { value: "english-b" },
      "#builder-paper": { value: "paper-1" },
    }), question)).toThrow("Choose a course, level and examination paper first");
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
    expect(official.examProfileId).toBe("may-2026:mathematics-analysis-approaches:SL:paper-1");
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
      "#builder-audio-plays": { value: "3" },
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
      maxPlays: 3,
    }]);
    expect(manifest.questions[0].resourceKeys).toEqual(["q1-media-1"]);
    expect(manifest.questions[1].resourceKeys).toEqual([]);
  });
});
