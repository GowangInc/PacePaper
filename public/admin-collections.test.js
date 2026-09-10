import { describe, expect, test } from "bun:test";
import {
  archiveDialogCopy,
  classHasLiveSession,
  collectionActionPath,
  currentSessionPhase,
  formatClassLabel,
  formatPaperOptionLabel,
  paperOptions,
  paperOptionsForSystem,
  paperSystemLabel,
  paperSystemOptions,
  partitionDashboardState,
  populateArchiveDialog,
  renderSessions,
  sessionActionModel,
  syncOptions,
} from "./admin-collections.js";

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.textContent = "";
    this.value = "";
    this.hidden = false;
  }

  get options() {
    return this.children;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = children;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

class FakeDocument {
  constructor(selectors = []) {
    this.nodes = new Map(selectors.map((selector) => [selector, new FakeElement("div", this)]));
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  querySelector(selector) {
    return this.nodes.get(selector) ?? null;
  }
}

const session = (overrides = {}) => ({
  id: "session-1",
  classId: "class-1",
  className: "DP2 English",
  paperTitle: "English A Paper 1",
  durationMinutes: 75,
  readingTimeMinutes: 5,
  status: "draft",
  candidateCount: 2,
  submittedCount: 0,
  activeCount: 0,
  ...overrides,
});

function descendants(element) {
  return element.children.flatMap((child) => [child, ...descendants(child)]);
}

describe("teacher dashboard collections", () => {
  test("partitions active and archived state without mixing overview data", () => {
    const activeClass = { id: "active" };
    const archivedClass = { id: "archived" };
    const result = partitionDashboardState({
      classes: [activeClass],
      students: [],
      sessions: [],
      archived: { classes: [archivedClass], students: [{ id: "student-old" }], sessions: [] },
    });
    expect(result.active.classes).toEqual([activeClass]);
    expect(result.archived.classes).toEqual([archivedClass]);
    expect(result.active.students).toEqual([]);
    expect(result.archived.students).toHaveLength(1);
  });

  test("builds only supported lifecycle API paths", () => {
    expect(collectionActionPath("students", "student/a", "archive"))
      .toBe("/api/admin/students/student%2Fa/archive");
    expect(collectionActionPath("sessions", "session-1", "restore"))
      .toBe("/api/admin/sessions/session-1/restore");
    expect(() => collectionActionPath("papers", "paper-1", "archive")).toThrow(TypeError);
  });

  test("labels class names and preserves stable dropdown selections", () => {
    expect(formatClassLabel({ name: "DP2 English", code: "ENG-12" })).toBe("DP2 English · login code ENG-12");
    expect(formatClassLabel({ name: "1234", code: "1234" })).toBe("1234 · login code");
    const select = new FakeElement("select", new FakeDocument());
    select.children = [
      Object.assign(new FakeElement("option", select.ownerDocument), { value: "", textContent: "Choose paper" }),
      Object.assign(new FakeElement("option", select.ownerDocument), { value: "paper-1", textContent: "Paper 1" }),
    ];
    select.value = "paper-1";
    syncOptions(select, "Choose paper", [{ value: "paper-1", label: "Paper 1" }]);
    expect(select.children).toHaveLength(2);
    syncOptions(select, "Choose paper", [
      { value: "paper-1", label: "Paper 1" },
      { value: "paper-2", label: "Paper 2" },
    ]);
    expect(select.value).toBe("paper-1");
  });

  test("names and orders exam paper choices by their actual component", () => {
    const papers = [
      {
        id: "psychology-paper-3",
        title: "Psychology · Paper 3 — original research-methods sample",
        subjectLabel: "Psychology",
        level: "HL",
        paper: "Paper 3 — original research-methods sample",
      },
      {
        id: "business-paper-2",
        title: "Business Management checkpoint",
        subjectLabel: "Business Management",
        level: "SL",
        paper: "Paper 2",
      },
      {
        id: "psychology-paper-1",
        title: "Psychology · Paper 1 — original core sample",
        subjectLabel: "Psychology",
        level: "SL",
        paper: "Paper 1 — original core sample",
      },
    ];

    expect(formatPaperOptionLabel(papers[0])).toBe("Psychology · Paper 3 — original research-methods sample · HL");
    expect(formatPaperOptionLabel(papers[1])).toBe("Business Management checkpoint · Paper 2 · SL");
    expect(formatPaperOptionLabel({ ...papers[1], examSystemLabel: "Cambridge IGCSE" }))
      .toBe("Cambridge IGCSE · Business Management checkpoint · Paper 2 · SL");
    expect(paperOptions(papers).map(({ value }) => value)).toEqual([
      "business-paper-2",
      "psychology-paper-1",
      "psychology-paper-3",
    ]);
    expect(papers[0].id).toBe("psychology-paper-3");
  });

  test("filters exam setup papers behind an explicit exam-system choice", () => {
    const papers = [
      { id: "ib", subject: "biology", subjectLabel: "Biology", title: "Biology Paper 1", paper: "Paper 1", level: "SL" },
      { id: "cambridge", subject: "cambridge-igcse-mathematics-0580", subjectLabel: "Mathematics", title: "0580 Paper 2", paper: "Paper 2", level: "Extended", examSystemLabel: "Cambridge IGCSE" },
      { id: "custom", subject: "school-geography", subjectLabel: "Geography", title: "Geography test", paper: "Unit test", level: "Year 10" },
    ];
    expect(paperSystemLabel(papers[0])).toBe("IB Diploma Programme");
    expect(paperSystemLabel(papers[2])).toBe("School/custom");
    expect(paperSystemOptions(papers).map(({ value }) => value)).toEqual([
      "IB Diploma Programme",
      "Cambridge IGCSE",
      "School/custom",
    ]);
    expect(paperOptionsForSystem(papers, "Cambridge IGCSE").map(({ value }) => value)).toEqual(["cambridge"]);
    expect(paperOptionsForSystem(papers, "")).toEqual([]);
  });

  test("keeps the course and paper readable after an exam system is selected", () => {
    const paper = {
      id: "calculus", subject: "ap-calculus-ab", subjectLabel: "Calculus AB",
      title: "Term practice", paper: "End-of-course exam", level: "AP",
      examSystemLabel: "Advanced Placement (AP)",
    };
    const other = { ...paper, id: "other", examSystemLabel: "Other exam system" };
    const legacy = { ...paper, id: "legacy", examSystemLabel: "Advanced Placement" };
    expect(paperOptionsForSystem([other, paper], "Advanced Placement (AP)"))
      .toEqual([{ value: "calculus", label: "Calculus AB · Term practice · End-of-course exam · AP" }]);
    expect(paperOptionsForSystem([{ ...paper, title: "Calculus AB · End-of-course exam" }], "Advanced Placement (AP)")[0].label)
      .toBe("Calculus AB · End-of-course exam · AP");
    expect(paperOptions([paper])[0].label)
      .toBe("Advanced Placement (AP) · Term practice · End-of-course exam · AP");
    expect(paper.title).toBe("Term practice");
    expect(paper.examSystemLabel).toBe("Advanced Placement (AP)");
    expect(paperSystemOptions([other, paper, legacy]).map(({ value }) => value))
      .toEqual(["Advanced Placement", "Advanced Placement (AP)", "Other exam system"]);
  });

  test("never offers removal for a live sitting and retains ended submissions", () => {
    expect(sessionActionModel(session({ status: "live" }))).toEqual(["watch", "clock", "end", "responses"]);
    expect(sessionActionModel(session({ status: "ended" }))).toEqual(["responses", "archive"]);
    expect(sessionActionModel(session({ status: "ended" }), true)).toEqual(["restore", "responses"]);
    expect(classHasLiveSession([session({ status: "live" })], "class-1")).toBe(true);
    expect(classHasLiveSession([session({ status: "ended" })], "class-1")).toBe(false);
  });

  test("describes the current phase of a simultaneous sectioned sitting", () => {
    const sectioned = session({
      status: "live",
      startedAt: 1_000,
      durationMinutes: 25,
      readingTimeMinutes: 0,
      phases: [
        { id: "one", label: "Section I", durationMinutes: 10 },
        { id: "break", label: "Monitored break", durationMinutes: 5 },
        { id: "two", label: "Section II", durationMinutes: 10 },
      ],
    });
    expect(currentSessionPhase(sectioned, 1_000 + 12 * 60_000)?.label).toBe("Monitored break");
    expect(currentSessionPhase(sectioned, 1_000 + 26 * 60_000)).toBeNull();
  });

  test("renders archived ended submissions without replacing the open disclosure", () => {
    const documentRoot = new FakeDocument([
      "#session-list",
      "#archived-session-list",
      "#archived-session-count",
      "#archived-sessions",
    ]);
    const disclosure = documentRoot.querySelector("#archived-sessions");
    disclosure.open = true;
    renderSessions({
      sessions: [session({ status: "live" })],
      archived: { sessions: [session({ id: "session-old", status: "ended", submittedCount: 2 })] },
    }, documentRoot);
    expect(disclosure.open).toBe(true);
    expect(documentRoot.querySelector("#archived-session-count").textContent).toBe("1");
    const activeButtons = descendants(documentRoot.querySelector("#session-list")).filter((node) => node.tagName === "button");
    expect(activeButtons.some((button) => button.dataset.collectionAction === "archive")).toBe(false);
    const archivedButtons = descendants(documentRoot.querySelector("#archived-session-list")).filter((node) => node.tagName === "button");
    expect(archivedButtons.map((button) => button.textContent)).toEqual(["Restore", "View submissions"]);
  });

  test("populates confirmation copy through text content and clears old errors", () => {
    const content = archiveDialogCopy("students", "Alex Morgan");
    expect(content.description).toContain("Previous responses stay saved");
    const documentRoot = new FakeDocument(["#archive-title", "#archive-context", "#confirm-archive", "#archive-error"]);
    const dialog = { querySelector: (selector) => documentRoot.querySelector(selector) };
    const error = documentRoot.querySelector("#archive-error");
    error.textContent = "Old error";
    error.hidden = false;
    populateArchiveDialog(dialog, { collection: "students", label: "Alex Morgan" });
    expect(documentRoot.querySelector("#archive-title").textContent).toBe("Remove Alex Morgan?");
    expect(documentRoot.querySelector("#confirm-archive").textContent).toBe("Remove student");
    expect(error.hidden).toBe(true);
    expect(error.textContent).toBe("");
  });
});
