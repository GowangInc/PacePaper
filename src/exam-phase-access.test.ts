import { describe, expect, test } from "bun:test";
import { parseManifest } from "./papers.ts";
import { responseFitsPhase } from "./exam-phase-access.ts";
import { examTimeline } from "./timing.ts";

const manifest = parseManifest({
  version: 1,
  title: "Sectioned practice",
  subject: "example",
  subjectLabel: "Example",
  level: "AP",
  paper: "End-of-course exam",
  durationMinutes: 25,
  readingTimeMinutes: 0,
  mode: "reading",
  instructions: "Complete both sections.",
  selectionMode: "all",
  resources: [],
  phases: [
    { id: "one", label: "Section I", kind: "work", durationMinutes: 10, sectionId: "one", tools: [] },
    { id: "break", label: "Break", kind: "break", durationMinutes: 5, tools: [] },
    { id: "two", label: "Section II", kind: "work", durationMinutes: 10, sectionId: "two", tools: [] },
  ],
  questions: [
    { id: "q1", label: "Question 1", prompt: "One", type: "short", resourceKeys: [], sectionId: "one" },
    { id: "q2", label: "Question 2", prompt: "Two", type: "short", resourceKeys: [], sectionId: "two" },
  ],
});

const timeline = examTimeline({
  startedAt: 0,
  readingTimeMinutes: 0,
  durationMinutes: 25,
  extraMinutes: 0,
  phases: manifest.phases,
});

describe("phase-specific server response access", () => {
  const previous = { answers: { q1: "saved" }, flags: ["q1"], selectedQuestionId: null };

  test("accepts changes only inside the active section", () => {
    expect(responseFitsPhase(manifest, previous, {
      answers: { q1: "saved", q2: "new" }, flags: ["q1", "q2"], selectedQuestionId: "q2",
    }, timeline[2]!)).toBeTrue();
    expect(responseFitsPhase(manifest, previous, {
      answers: { q1: "changed", q2: "new" }, flags: ["q1"], selectedQuestionId: "q2",
    }, timeline[2]!)).toBeFalse();
  });

  test("rejects every response mutation during a locked break", () => {
    expect(responseFitsPhase(manifest, previous, previous, timeline[1]!)).toBeFalse();
  });
});
