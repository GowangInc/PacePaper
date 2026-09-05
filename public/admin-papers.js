import { emptyState, paperOptionsForSystem, paperSystemLabel, paperSystemOptions, syncOptions } from "/admin-collections.js";

function text(tag, value, className = "") {
  const node = document.createElement(tag);
  node.textContent = value;
  node.className = className;
  return node;
}

function paperTiming(paper) {
  if (paper.phaseCount) return `${paper.durationMinutes} min total, including breaks`;
  return paper.readingTimeMinutes
    ? `${paper.readingTimeMinutes} min reading + ${paper.durationMinutes} min writing`
    : `${paper.durationMinutes} min`;
}

export function renderPaperLibrary(papers) {
  const list = document.querySelector("#paper-list");
  const system = document.querySelector("#library-system");
  syncOptions(system, "All exam systems", paperSystemOptions(papers));
  const query = document.querySelector("#library-search").value.trim().toLocaleLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const visible = papers.filter((paper) => {
    if (system.value && paperSystemLabel(paper) !== system.value) return false;
    const content = [paper.title, paper.subjectLabel, paper.level, paper.paper, paperSystemLabel(paper)].join(" ").toLocaleLowerCase();
    return words.every((word) => content.includes(word));
  });
  document.querySelector("#library-count").textContent = `${visible.length} of ${papers.length} papers`;
  list.replaceChildren();
  if (!visible.length) emptyState(list, papers.length ? "No papers match. Try another search or exam system." : "Create or import your first practice paper below.");
  for (const paper of visible) {
    const row = document.createElement("li");
    const main = document.createElement("span");
    main.append(text("strong", paper.title), text("small", [paperSystemLabel(paper), paper.level].filter(Boolean).join(" · ")));
    const actions = document.createElement("div");
    actions.className = "paper-list-actions";
    actions.append(text("small", paperTiming(paper)));
    if (["teacher-authored", "school-authorized"].includes(paper.sourceClassification) && paper.exportAuthorized) {
      const link = text("a", "Export", "quiet-action compact");
      link.href = `/api/admin/papers/${paper.id}/export`;
      link.download = "";
      link.setAttribute("aria-label", `Export ${paper.title}`);
      actions.append(link);
    }
    row.append(main, actions);
    list.append(row);
  }
}

export function renderSelectedPaper(papers) {
  const summary = document.querySelector("#session-paper-summary");
  const selectedId = document.querySelector("#session-paper").value;
  const paper = papers.find((item) => item.id === selectedId);
  summary.replaceChildren();
  summary.hidden = !paper;
  if (!paper) return;
  const details = [paperTiming(paper)];
  if (Number.isInteger(paper.questionCount)) details.unshift(`${paper.questionCount} question cards`);
  if (paper.maximumMarks) details.push(`${paper.maximumMarks} marks`);
  summary.append(text("strong", "Before you start"), text("p", details.join(" · ")));
  if (paper.rulesSummary) summary.append(text("p", paper.rulesSummary));
  if (paper.instructions) {
    const instructions = document.createElement("details");
    instructions.append(text("summary", "Read instructions and equipment requirements"), text("p", paper.instructions));
    summary.append(instructions);
  }
}

export function renderSessionPaperSelectors(papers) {
  const system = document.querySelector("#session-system");
  const select = document.querySelector("#session-paper");
  syncOptions(system, "Choose exam system", paperSystemOptions(papers));
  syncOptions(select, system.value ? "Choose paper" : "Choose exam system first", paperOptionsForSystem(papers, system.value));
  select.disabled = !system.value;
  renderSelectedPaper(papers);
}
