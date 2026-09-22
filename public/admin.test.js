import { describe, expect, mock, test } from "bun:test";

mock.module("/app.js", () => ({
  ApiError: class extends Error {},
  announce() {},
  api() {},
  connectSocket() {},
  formatTime(value) { return String(value); },
  humanSubject(value) { return value; },
  setView() {},
}));
mock.module("/admin-collections.js", () => ({
  collectionActionPath() { return ""; },
  emptyState() {},
  formatPaperTime() { return ""; },
  paperOptionsForSystem() { return []; },
  paperSystemLabel() { return ""; },
  paperSystemOptions() { return []; },
  populateArchiveDialog() {},
  readCollectionTarget() { return null; },
  renderClasses() {},
  renderSessions() {},
  syncOptions() {},
  updatePresence() {},
}));
mock.module("/ink-canvas.js", () => ({ hasInkResponse() { return false; }, renderInkSubmission() {} }));
mock.module("/admin-network.js", () => ({ mountAdminNetwork() {} }));
mock.module("/admin-papers.js", () => ({ renderPaperLibrary() {}, renderSelectedPaper() {}, renderSessionPaperSelectors() {} }));
mock.module("/class-rosters.js", () => ({ mountClassRosterTransfer() {} }));
mock.module("/paper-builder.js", () => ({ mountPaperBuilder() {} }));
mock.module("/student-connection.js", () => ({ mountStudentConnection() {} }));

const { renderCandidatePaper, renderRevisionAnswers } = await import("./admin.js");
const source = await Bun.file(new URL("./admin.js", import.meta.url)).text();
const styles = await Bun.file(new URL("./styles.css", import.meta.url)).text();

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.classList = { add() {} };
    this.dataset = {};
    this.textContent = "";
  }

  append(...children) {
    this.children.push(...children);
  }

  setAttribute() {}
}

describe("teacher dashboard presentation", () => {
  test("does not poll and rebuild the dashboard every five seconds", () => {
    expect(source).not.toContain("setInterval(() => refreshState");
    expect(source).toContain("setInterval(refreshPresence, 10_000)");
  });

  test("omits source-rights status from the teacher library and candidate papers", () => {
    expect(source).not.toContain("rightsLabel");
    expect(source).not.toContain("rights not recorded");
    expect(source).not.toContain('appendMetadata(metadata, "Source status"');
  });

  test("shows the active student connection address on the dashboard", () => {
    expect(source).toContain("mountStudentConnection(document, { origin: studentConnectionOrigin })");
    expect(source).toContain("bootstrap.studentOrigin ?? location.origin");
    expect(source).toContain("data-student-connection-link");
    expect(source).toContain("data-copy-student-connection");
  });

  test("uses one archive confirmation dialog while restore remains direct", () => {
    expect(source.match(/<dialog id="archive-dialog"/g)).toHaveLength(1);
    expect(source).toContain('dialog.close("cancel")');
    expect(source).toContain('dialog.close("confirmed")');
    expect(source).toContain('target.action === "archive"');
    expect(source).toContain("await changeCollectionLifecycle(target)");
  });

  test("keeps archive disclosures static while their list contents refresh", () => {
    expect(source).toContain('<details id="archived-roster"');
    expect(source).toContain('<details id="archived-sessions"');
    expect(source).not.toContain("archived-roster.replaceChildren");
    expect(source).not.toContain("archived-sessions.replaceChildren");
  });

  test("opens the native print dialog synchronously from the teacher action", () => {
    const start = source.indexOf("function printSubmissions");
    const end = source.indexOf("\nfunction renderState", start);
    const printFunction = source.slice(start, end);
    expect(printFunction).toContain("window.print();");
    expect(printFunction).not.toContain("await");
    expect(printFunction).toContain("Choose Save as PDF to create a file.");
  });

  test("includes saved candidate notes as a separate, printable record", () => {
    expect(source).toContain("function appendCandidateNotepad");
    expect(source).toContain('if (typeof notepad !== "string" || !notepad.trim()) return;');
    expect(source).toContain('copy("h3", "", "Candidate notepad")');
    expect(source).toContain('copy("p", "", notepad)');
    expect(source).toContain("appendCandidateNotepad(paper, response.notepad)");
    expect(styles).toContain(".candidate-paper-notepad p {\n  margin: 0;\n  line-height: 1.55;\n  overflow-wrap: anywhere;\n  white-space: pre-wrap;");
    expect(styles).toContain(".candidate-paper-notepad h3 {\n    margin-bottom: 1.5mm;\n    font-size: 10pt;\n    break-after: avoid-page;");
  });

  test("shows plain-text marking guidance only beside its question", () => {
    const originalDocument = globalThis.document;
    globalThis.document = { createElement: (tagName) => new FakeElement(tagName) };
    try {
      const markingGuidance = "  <img src=x onerror=alert(1)>\nAward one mark.  ";
      const data = {
        session: {
          paperTitle: "Practice paper",
          className: "Class A",
          assessmentSession: "custom",
          selectionMode: "all",
          mode: "short",
        },
        questions: [
          { id: "guided", label: "Question 1", prompt: "Guided prompt", type: "short", markingGuidance },
          { id: "plain", label: "Question 2", prompt: "Plain prompt", type: "short" },
        ],
      };
      const response = {
        studentName: "Candidate",
        answers: { guided: "Candidate answer", plain: "Another answer" },
        updatedAt: "2026-09-22T09:00:00.000Z",
      };

      const paper = renderCandidatePaper(data, response);
      const finalAnswers = paper.children.find((child) => child.className === "submission-answers");
      const guidance = finalAnswers.children[0].children[3];
      expect(finalAnswers.children[0].children[2].textContent).toBe("Candidate answer");
      expect(guidance.className).toBe("candidate-question-guidance");
      expect(guidance.children[0].textContent).toBe("Teacher-only marking guidance");
      expect(guidance.children[1].textContent).toBe(markingGuidance);
      expect(guidance.children[1].innerHTML).toBeUndefined();
      expect(guidance.children[1].children).toHaveLength(0);
      expect(finalAnswers.children[1].children).toHaveLength(3);

      const revisions = renderRevisionAnswers(data, response);
      expect(revisions.children[0].children[3].children[1].textContent).toBe(markingGuidance);
      expect(revisions.children[1].children).toHaveLength(3);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  test("hides unselected essay answers in answer history", () => {
    const originalDocument = globalThis.document;
    globalThis.document = { createElement: (tagName) => new FakeElement(tagName) };
    try {
      const answers = renderRevisionAnswers({
        session: { selectionMode: "one", mode: "essay" },
        questions: [
          { id: "draft", label: "Prompt 1", prompt: "Draft prompt", type: "essay" },
          { id: "selected", label: "Prompt 2", prompt: "Selected prompt", type: "essay" },
        ],
      }, {
        answers: { draft: "<p>Unselected draft</p>", selected: "<p>Submitted answer</p>" },
        selectedQuestionId: "selected",
      });

      expect(answers.children[0].children[2].textContent).toBe("Not selected by candidate");
      expect(answers.children[0].children[2].dataset.answerType).toBe("not-selected");
      expect(answers.children[1].children[2].innerHTML).toBe("<p>Submitted answer</p>");
    } finally {
      globalThis.document = originalDocument;
    }
  });

  test("stacks paper-library rows on narrow teacher screens", () => {
    expect(styles).toContain(".roster-list li,\n  .paper-list li,\n  .archived-list li,\n  .session-row {\n    flex-direction: column;");
  });
});
