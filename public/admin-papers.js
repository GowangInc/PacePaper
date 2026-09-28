import {
  emptyState,
  lifecycleButton,
  paperOptionsForSystem,
  paperSystemLabel,
  paperSystemOptions,
  syncOptions,
} from "/admin-collections.js";

const SOURCE_LABELS = {
  "teacher-authored": "Teacher-authored",
  "school-authorized": "School-authorized",
  "official-public-reference": "Official public reference",
  "public-educational-practice": "Public educational practice",
  "unknown-local-only": "Local source",
};

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

function sourceLabel(paper) {
  const source = SOURCE_LABELS[paper.sourceClassification] ?? "Local source";
  const exportable = ["teacher-authored", "school-authorized"].includes(paper.sourceClassification)
    && paper.exportAuthorized;
  return `${source} · ${exportable ? "Export available" : "Export unavailable"}`;
}

function addedLabel(paper) {
  return Number.isFinite(paper.createdAt)
    ? `Added ${new Date(paper.createdAt).toLocaleDateString()}`
    : "Import date unavailable";
}

function appendActivePaper(list, paper, documentRoot) {
  const row = documentRoot.createElement("li");
  const main = documentRoot.createElement("span");
  const usage = paper.sessionCount
    ? ` · Used in ${paper.sessionCount} exam sitting${paper.sessionCount === 1 ? "" : "s"}`
    : "";
  main.append(
    text("strong", paper.title),
    text("small", [paperSystemLabel(paper), paper.level].filter(Boolean).join(" · ")),
    text("small", `Paper ID · ${paper.id}`),
    text("small", `${sourceLabel(paper)} · ${addedLabel(paper)}${usage}`),
  );
  const actions = documentRoot.createElement("div");
  actions.className = "paper-list-actions";
  actions.append(text("small", paperTiming(paper)));
  const preview = text("a", "Preview as student", "quiet-action compact");
  preview.href = `/student?preview=${encodeURIComponent(paper.id)}`;
  preview.target = "_blank";
  preview.rel = "noopener";
  preview.setAttribute("aria-label", `Preview ${paper.title} as a student`);
  actions.append(preview);
  if (["teacher-authored", "school-authorized"].includes(paper.sourceClassification) && paper.exportAuthorized) {
    const link = text("a", "Export", "quiet-action compact");
    link.href = `/api/admin/papers/${paper.id}/export`;
    link.download = "";
    link.setAttribute("aria-label", `Export ${paper.title}`);
    actions.append(link);
  }
  const remove = lifecycleButton(documentRoot, {
    action: "archive",
    collection: "papers",
    id: paper.id,
    label: paper.title,
    text: "Remove",
    className: "danger-action compact",
  });
  if (paper.liveSessionCount) {
    const guidanceId = `paper-live-guidance-${paper.id}`;
    remove.disabled = true;
    remove.setAttribute("aria-describedby", guidanceId);
    const guidance = text("small", "End the live exam first.", "action-guidance");
    guidance.id = guidanceId;
    actions.append(remove, guidance);
  } else {
    actions.append(remove);
  }
  row.append(main, actions);
  list.append(row);
}

function renderArchivedPapers(papers, documentRoot) {
  const list = documentRoot.querySelector("#archived-paper-list");
  const counter = documentRoot.querySelector("#archived-paper-count");
  if (!list || !counter) return;
  counter.textContent = String(papers.length);
  list.replaceChildren();
  if (!papers.length) {
    emptyState(list, "No removed papers.");
    return;
  }
  for (const paper of papers) {
    const row = documentRoot.createElement("li");
    const main = documentRoot.createElement("span");
    main.append(
      text("strong", paper.title),
      text("small", `Paper ID · ${paper.id}`),
      text("small", `${sourceLabel(paper)} · ${addedLabel(paper)}`),
    );
    row.append(main, lifecycleButton(documentRoot, {
      action: "restore",
      collection: "papers",
      id: paper.id,
      label: paper.title,
      text: "Restore",
    }));
    list.append(row);
  }
}

export function renderPaperLibrary(papers, archivedPapers = [], documentRoot = document) {
  const list = documentRoot.querySelector("#paper-list");
  const system = documentRoot.querySelector("#library-system");
  syncOptions(system, "All exam systems", paperSystemOptions(papers));
  const query = documentRoot.querySelector("#library-search").value.trim().toLocaleLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const visible = papers.filter((paper) => {
    if (system.value && paperSystemLabel(paper) !== system.value) return false;
    const content = [paper.title, paper.subjectLabel, paper.level, paper.paper, paperSystemLabel(paper)].join(" ").toLocaleLowerCase();
    return words.every((word) => content.includes(word));
  });
  documentRoot.querySelector("#library-count").textContent = `${visible.length} of ${papers.length} papers`;
  list.replaceChildren();
  if (!visible.length) {
    emptyState(list, papers.length ? "No papers match. Try another search or exam system." : "Create or import your first practice paper below.");
  }
  visible.forEach((paper) => appendActivePaper(list, paper, documentRoot));
  renderArchivedPapers(archivedPapers, documentRoot);
}

export function confirmPaperReplacement(conflicts, documentRoot = document) {
  const dialog = documentRoot.querySelector("#paper-replacement-dialog");
  const list = dialog.querySelector("#paper-conflict-list");
  const select = dialog.querySelector("#paper-replacement-target");
  const confirm = dialog.querySelector("#confirm-paper-replacement");
  const cancel = dialog.querySelector("[data-cancel-paper-replacement]");
  list.replaceChildren();
  select.replaceChildren();
  const eligible = conflicts.filter(({ replaceable }) => replaceable);
  for (const conflict of conflicts) {
    const item = documentRoot.createElement("li");
    const usage = conflict.sessionCount
      ? `used in ${conflict.sessionCount} exam sitting${conflict.sessionCount === 1 ? "" : "s"}`
      : "unused and replaceable";
    item.textContent = `${conflict.title} · ${sourceLabel(conflict)} · ${addedLabel(conflict)} · ${usage}`;
    list.append(item);
    if (conflict.replaceable) {
      const option = documentRoot.createElement("option");
      option.value = conflict.id;
      option.textContent = `${conflict.title} · ${addedLabel(conflict)}`;
      select.append(option);
    }
  }
  select.disabled = eligible.length === 0;
  confirm.disabled = eligible.length === 0;
  dialog.returnValue = "";
  dialog.showModal();
  (eligible.length ? select : cancel).focus();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      resolve(dialog.returnValue === "confirm" ? select.value : null);
    }, { once: true });
  });
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
