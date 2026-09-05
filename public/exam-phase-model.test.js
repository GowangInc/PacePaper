import { describe, expect, test } from "bun:test";
import { phaseAtTime, phaseLockMessage, questionsForPhase, resourcesForExamContext } from "./exam-phase-model.js";

describe("student exam phase model", () => {
  const timeline = [
    { id: "one", kind: "work", sectionId: "one", startsAt: 0, endsAt: 60_000 },
    { id: "break", kind: "break", startsAt: 60_000, endsAt: 70_000 },
    { id: "two", kind: "work", sectionId: "two", startsAt: 70_000, endsAt: 130_000 },
  ];

  test("selects the exact phase at a boundary", () => {
    expect(phaseAtTime(timeline, 59_999)?.id).toBe("one");
    expect(phaseAtTime(timeline, 60_000)?.id).toBe("break");
    expect(phaseAtTime(timeline, 130_000)).toBeNull();
  });

  test("shows only the current section and nothing during a break", () => {
    const questions = [{ id: "q1", sectionId: "one" }, { id: "q2", sectionId: "two" }];
    expect(questionsForPhase(questions, timeline[0]).map(({ id }) => id)).toEqual(["q1"]);
    expect(questionsForPhase(questions, timeline[1])).toEqual([]);
    expect(questionsForPhase(questions, timeline[2]).map(({ id }) => id)).toEqual(["q2"]);
  });

  test("provides a clear locked-state explanation", () => {
    expect(phaseLockMessage({ kind: "break", instructions: "Remain in the room." })).toBe("Remain in the room.");
    expect(phaseLockMessage({ kind: "reading" })).toContain("Student entry");
  });

  test("shows every text in a reading paper without coupling text selection to a question", () => {
    const resources = [{ key: "text-a" }, { key: "text-b" }, { key: "text-c" }];
    const questions = [
      { id: "q1", resourceKeys: ["text-a"] },
      { id: "q2", resourceKeys: ["text-b"] },
      { id: "q3", resourceKeys: ["text-c"] },
    ];
    expect(resourcesForExamContext(resources, questions, "q1", { kind: "work" }, "reading"))
      .toEqual(resources);
  });

  test("shows all resources permitted in reading time but not future-section resources", () => {
    const resources = [{ key: "source-one" }, { key: "source-two" }];
    const currentSectionQuestions = [{ id: "q1", resourceKeys: ["source-one"] }];
    expect(resourcesForExamContext(resources, currentSectionQuestions, "q1", { kind: "reading" }, "short"))
      .toEqual([{ key: "source-one" }]);
  });

  test("keeps ordinary work-phase media attached to its individual question", () => {
    const resources = [{ key: "diagram-a" }, { key: "diagram-b" }];
    const questions = [
      { id: "q1", resourceKeys: ["diagram-a"] },
      { id: "q2", resourceKeys: ["diagram-b"] },
    ];
    expect(resourcesForExamContext(resources, questions, "q2", { kind: "work" }, "short"))
      .toEqual([{ key: "diagram-b" }]);
    expect(resourcesForExamContext(resources, questions, "q2", { kind: "break" }, "short"))
      .toEqual([]);
  });
});
