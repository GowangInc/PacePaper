import { describe, expect, test } from "bun:test";
import {
  candidateAssetAuthorized,
  candidateVisibleManifest,
  type ExamPhaseAvailability,
} from "./exam-phase-policy.ts";
import { parseManifest } from "./papers.ts";

const manifest = parseManifest({
  version: 1,
  title: "Staged source paper",
  subject: "example",
  subjectLabel: "Example",
  level: "AP",
  paper: "Paper 1",
  durationMinutes: 25,
  readingTimeMinutes: 0,
  mode: "reading",
  instructions: "Complete both sections.",
  selectionMode: "all",
  resources: [
    { key: "current", label: "Current source", kind: "document", file: "current.pdf" },
    { key: "shared", label: "Shared source", kind: "image", file: "shared.png" },
    { key: "future", label: "Future source", kind: "document", file: "future.pdf" },
    { key: "paper-wide", label: "Formula sheet", kind: "document", file: "formula.pdf" },
  ],
  phases: [
    { id: "read-one", label: "Read section one", kind: "reading", durationMinutes: 5, sectionId: "one", tools: [] },
    { id: "work-one", label: "Answer section one", kind: "work", durationMinutes: 10, sectionId: "one", tools: [] },
    { id: "work-two", label: "Answer section two", kind: "work", durationMinutes: 10, sectionId: "two", tools: [] },
  ],
  questions: [
    {
      id: "q1",
      label: "Question 1",
      prompt: "Use the first source.",
      type: "short",
      resourceKeys: ["current", "shared"],
      markingGuidance: "Teacher-only answer guidance.",
      sectionId: "one",
    },
    {
      id: "q2",
      label: "Question 2",
      prompt: "Use the later source.",
      type: "short",
      resourceKeys: ["future", "shared"],
      sectionId: "two",
    },
  ],
});

const availability = (
  availablePhaseIds: readonly string[],
  availablePhaseKinds: ExamPhaseAvailability["availablePhaseKinds"],
  preview = false,
): ExamPhaseAvailability => ({ availablePhaseIds, availablePhaseKinds, preview });

const keys = (items: readonly { key: string }[]) => items.map(({ key }) => key);

describe("candidate exam phase policy", () => {
  test("keeps the first section visible across its reading-to-work transition", () => {
    const reading = candidateVisibleManifest(manifest, availability(["read-one"], ["reading"]));
    const working = candidateVisibleManifest(manifest, availability(["work-one"], ["work"]));

    expect(reading.questions.map(({ id }) => id)).toEqual(["q1"]);
    expect(working.questions.map(({ id }) => id)).toEqual(["q1"]);
  });

  test("omits future-only resources while preserving current, shared, and paper-wide resources", () => {
    const view = candidateVisibleManifest(manifest, availability(["work-one"], ["work"]));

    expect(keys(view.resources)).toEqual(["current", "shared", "paper-wide"]);
    expect(view.questions[0]).not.toHaveProperty("markingGuidance");
  });

  test("requires an explicit preview to reveal the complete candidate paper", () => {
    const hidden = candidateVisibleManifest(manifest, availability([], []));
    const preview = candidateVisibleManifest(manifest, availability([], [], true));

    expect(hidden.questions).toEqual([]);
    expect(keys(hidden.resources)).toEqual(["paper-wide"]);
    expect(preview.questions.map(({ id }) => id)).toEqual(["q1", "q2"]);
    expect(keys(preview.resources)).toEqual(["current", "shared", "future", "paper-wide"]);
    expect(preview.questions[0]).not.toHaveProperty("markingGuidance");
  });

  test("uses phase kinds for an unphased reading/work paper", () => {
    const legacy = parseManifest({ ...manifest, phases: undefined });

    expect(candidateVisibleManifest(legacy, availability([], ["reading"])).questions).toHaveLength(2);
    expect(candidateVisibleManifest(legacy, availability([], ["work"])).questions).toHaveLength(2);
    expect(candidateVisibleManifest(legacy, availability([], ["break"])).questions).toEqual([]);
  });

  test("rejects future-only and unknown asset keys", () => {
    const current = availability(["work-one"], ["work"]);

    expect(candidateAssetAuthorized(manifest, "current", current)).toBeTrue();
    expect(candidateAssetAuthorized(manifest, "shared", current)).toBeTrue();
    expect(candidateAssetAuthorized(manifest, "paper-wide", current)).toBeTrue();
    expect(candidateAssetAuthorized(manifest, "future", current)).toBeFalse();
    expect(candidateAssetAuthorized(manifest, "missing", current)).toBeFalse();
  });
});
