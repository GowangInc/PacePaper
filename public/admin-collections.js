const COLLECTIONS = new Set(["classes", "students", "sessions"]);
const LIFECYCLE_ACTIONS = new Set(["archive", "restore"]);
const LEVEL_ORDER = new Map([["SL", 0], ["HL", 1], ["SL/HL", 2]]);
const PAPER_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const IB_SUBJECTS = new Set([
  "english-a-language-literature", "english-a-literature", "english-b",
  "korean-a-language-literature", "korean-a-literature", "japanese-a-language-literature", "japanese-a-literature",
  "spanish-a-language-literature", "spanish-a-literature", "spanish-b",
  "mathematics-analysis-approaches", "mathematics-applications-interpretation",
  "biology", "chemistry", "physics", "psychology", "business-management",
]);
const SYSTEM_ORDER = new Map([
  ["IB Diploma Programme", 0],
  ["IB MYP eAssessment", 1],
  ["Cambridge IGCSE", 2],
  ["Pearson Edexcel International GCSE", 3],
  ["Advanced Placement", 4],
  ["Advanced Placement (AP)", 4],
  ["School/custom", 99],
]);

function option(select, value, label) {
  const item = select.ownerDocument.createElement("option");
  item.value = value;
  item.textContent = label;
  select.append(item);
}

export function formatClassLabel(schoolClass) {
  const name = schoolClass.name.trim();
  const code = schoolClass.code.trim();
  return name.localeCompare(code, undefined, { sensitivity: "accent" }) === 0
    ? `${name} · login code`
    : `${name} · login code ${code}`;
}

export function formatPaperOptionLabel(paper) {
  const title = paper.title.trim();
  const component = paper.paper.trim();
  const detail = title.toLocaleLowerCase().includes(component.toLocaleLowerCase()) ? title : `${title} · ${component}`;
  return [paper.examSystemLabel, detail, paper.level].filter(Boolean).join(" · ");
}

export function paperSystemLabel(paper) {
  if (paper.examSystemLabel) return paper.examSystemLabel;
  return IB_SUBJECTS.has(paper.subject) ? "IB Diploma Programme" : "School/custom";
}

export function paperSystemOptions(papers) {
  return [...new Set(papers.map(paperSystemLabel))]
    .sort((left, right) => (SYSTEM_ORDER.get(left) ?? 50) - (SYSTEM_ORDER.get(right) ?? 50) || PAPER_COLLATOR.compare(left, right))
    .map((label) => ({ value: label, label }));
}

export function paperOptions(papers) {
  return [...papers]
    .sort((left, right) => (
      PAPER_COLLATOR.compare(left.subjectLabel, right.subjectLabel)
      || PAPER_COLLATOR.compare(left.paper, right.paper)
      || (LEVEL_ORDER.get(left.level) ?? 99) - (LEVEL_ORDER.get(right.level) ?? 99)
      || PAPER_COLLATOR.compare(left.title, right.title)
      || PAPER_COLLATOR.compare(left.id, right.id)
    ))
    .map((paper) => ({ value: paper.id, label: formatPaperOptionLabel(paper) }));
}

export function paperOptionsForSystem(papers, systemLabel) {
  if (!systemLabel) return [];
  return paperOptions(papers.filter((paper) => paperSystemLabel(paper) === systemLabel).map((paper) => ({
    ...paper,
    examSystemLabel: "",
    title: paper.title.toLocaleLowerCase().includes(paper.subjectLabel.toLocaleLowerCase())
      ? paper.title : `${paper.subjectLabel} · ${paper.title}`,
  })));
}

export function syncOptions(select, placeholder, items) {
  const desired = [{ value: "", label: placeholder }, ...items];
  const unchanged = select.options.length === desired.length
    && desired.every((item, index) => select.options[index].value === item.value && select.options[index].textContent === item.label);
  if (unchanged) return;
  const selectedValue = select.value;
  select.replaceChildren();
  desired.forEach((item) => option(select, item.value, item.label));
  select.value = desired.some((item) => item.value === selectedValue) ? selectedValue : "";
}

export function emptyState(container, message) {
  const paragraph = container.ownerDocument.createElement("p");
  paragraph.className = "empty-state";
  paragraph.textContent = message;
  container.append(paragraph);
}

export function partitionDashboardState(state) {
  return {
    active: {
      classes: state.classes ?? [],
      students: state.students ?? [],
      sessions: state.sessions ?? [],
    },
    archived: {
      classes: state.archived?.classes ?? [],
      students: state.archived?.students ?? [],
      sessions: state.archived?.sessions ?? [],
    },
  };
}

export function collectionActionPath(collection, id, action) {
  if (!COLLECTIONS.has(collection) || !LIFECYCLE_ACTIONS.has(action)) {
    throw new TypeError("Unknown dashboard collection action");
  }
  return `/api/admin/${collection}/${encodeURIComponent(id)}/${action}`;
}

export function archiveDialogCopy(collection, label) {
  const descriptions = {
    classes: "Students will no longer be able to sign in with this class.",
    students: "This student will no longer be available at sign-in.",
    sessions: "This exam sitting will no longer be available to students.",
  };
  if (!descriptions[collection]) throw new TypeError("Unknown dashboard collection");
  return {
    title: collection === "classes" ? `Remove class ${label}?` : `Remove ${label}?`,
    description: `${descriptions[collection]} Previous responses stay saved, and you can restore it later.`,
    confirmLabel: collection === "classes" ? "Remove class" : collection === "students" ? "Remove student" : "Remove exam sitting",
  };
}

function lifecycleButton(documentRoot, { action, collection, id, label, text, className = "compact" }) {
  const button = documentRoot.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.collectionAction = action;
  button.dataset.collection = collection;
  button.dataset.collectionId = id;
  button.dataset.collectionLabel = label;
  button.textContent = text;
  button.setAttribute("aria-label", `${text}: ${label}`);
  return button;
}

function responseButton(documentRoot, session) {
  const button = documentRoot.createElement("button");
  button.type = "button";
  button.dataset.responses = session.id;
  button.className = "compact";
  button.textContent = "View submissions";
  button.setAttribute("aria-label", `View submissions: ${session.paperTitle} for ${session.className}`);
  return button;
}

function classLookup(partitions) {
  return new Map(
    [...partitions.active.classes, ...partitions.archived.classes]
      .map((schoolClass) => [schoolClass.id, schoolClass]),
  );
}

export function classHasLiveSession(sessions, classId) {
  return sessions.some((session) => session.classId === classId && session.status === "live");
}

function renderActiveClasses(partitions, container) {
  const documentRoot = container.ownerDocument;
  if (partitions.active.classes.length === 0) emptyState(container, "Create a class before adding students.");

  for (const schoolClass of partitions.active.classes) {
    const students = partitions.active.students.filter((student) => student.classId === schoolClass.id);
    const hasLiveSession = classHasLiveSession(partitions.active.sessions, schoolClass.id);
    const section = documentRoot.createElement("section");
    section.className = "roster-group";
    const heading = documentRoot.createElement("div");
    heading.className = "roster-heading";
    const name = documentRoot.createElement("strong");
    name.textContent = formatClassLabel(schoolClass);
    const actions = documentRoot.createElement("div");
    actions.className = "roster-actions";
    const remove = lifecycleButton(documentRoot, {
      action: "archive",
      collection: "classes",
      id: schoolClass.id,
      label: schoolClass.name,
      text: "Remove class",
      className: "danger-action compact",
    });
    if (hasLiveSession) {
      const guidanceId = `class-live-guidance-${schoolClass.id}`;
      remove.disabled = true;
      remove.setAttribute("aria-describedby", guidanceId);
      const guidance = documentRoot.createElement("small");
      guidance.id = guidanceId;
      guidance.className = "action-guidance";
      guidance.textContent = "End the live exam first.";
      actions.append(remove, guidance);
    } else {
      actions.append(remove);
    }
    heading.append(name, actions);
    section.append(heading);

    if (students.length === 0) {
      emptyState(section, "No students yet.");
    } else {
      const list = documentRoot.createElement("ul");
      list.className = "roster-list";
      for (const student of students) {
        const item = documentRoot.createElement("li");
        const summary = documentRoot.createElement("span");
        const identity = documentRoot.createElement("strong");
        identity.textContent = `${student.name} · ${student.candidateCode}`;
        const metadata = documentRoot.createElement("small");
        const online = student.lastSeenAt && Date.now() - student.lastSeenAt < 20_000;
        metadata.dataset.studentPresence = student.id;
        metadata.dataset.online = String(Boolean(online));
        metadata.textContent = ` · ${online ? "online" : "offline"}${student.extraMinutes ? ` · +${student.extraMinutes} min` : ""}`;
        summary.append(identity, metadata);
        const studentActions = documentRoot.createElement("div");
        studentActions.className = "roster-actions";
        const edit = documentRoot.createElement("button");
        edit.type = "button";
        edit.className = "compact";
        edit.dataset.editStudent = student.id;
        edit.setAttribute("aria-controls", "student-edit-dialog");
        edit.setAttribute("aria-haspopup", "dialog");
        edit.setAttribute("aria-label", `Edit details for ${student.name}`);
        edit.textContent = "Edit";
        const removeStudent = lifecycleButton(documentRoot, {
          action: "archive",
          collection: "students",
          id: student.id,
          label: student.name,
          text: "Remove",
          className: "danger-action compact",
        });
        studentActions.append(edit, removeStudent);
        item.append(summary, studentActions);
        list.append(item);
      }
      section.append(list);
    }
    container.append(section);
  }
}

function renderArchivedRoster(partitions, container) {
  const documentRoot = container.ownerDocument;
  const total = partitions.archived.classes.length + partitions.archived.students.length;
  const counter = documentRoot.querySelector("#archived-roster-count");
  if (counter) counter.textContent = String(total);
  if (total === 0) {
    emptyState(container, "No removed classes or students.");
    return;
  }

  const classes = classLookup(partitions);
  if (partitions.archived.classes.length > 0) {
    const heading = documentRoot.createElement("h3");
    heading.textContent = "Classes";
    const list = documentRoot.createElement("ul");
    list.className = "archived-list";
    for (const schoolClass of partitions.archived.classes) {
      const item = documentRoot.createElement("li");
      const label = documentRoot.createElement("span");
      label.textContent = formatClassLabel(schoolClass);
      item.append(label, lifecycleButton(documentRoot, {
        action: "restore",
        collection: "classes",
        id: schoolClass.id,
        label: schoolClass.name,
        text: "Restore",
      }));
      list.append(item);
    }
    container.append(heading, list);
  }

  if (partitions.archived.students.length > 0) {
    const heading = documentRoot.createElement("h3");
    heading.textContent = "Students";
    const list = documentRoot.createElement("ul");
    list.className = "archived-list";
    for (const student of partitions.archived.students) {
      const item = documentRoot.createElement("li");
      const identity = documentRoot.createElement("span");
      const className = classes.get(student.classId)?.name ?? "Class unavailable";
      identity.textContent = `${student.name} · ${student.candidateCode} · ${className}`;
      item.append(identity, lifecycleButton(documentRoot, {
        action: "restore",
        collection: "students",
        id: student.id,
        label: student.name,
        text: "Restore",
      }));
      list.append(item);
    }
    container.append(heading, list);
  }
}

export function renderClasses(state, documentRoot = document) {
  const partitions = partitionDashboardState(state);
  const classList = documentRoot.querySelector("#class-list");
  const archivedList = documentRoot.querySelector("#archived-roster-list");
  classList.replaceChildren();
  archivedList.replaceChildren();
  const classOptions = partitions.active.classes.map((schoolClass) => ({
    value: schoolClass.id,
    label: formatClassLabel(schoolClass),
  }));
  syncOptions(documentRoot.querySelector("#student-class"), "Choose class", classOptions);
  syncOptions(documentRoot.querySelector("#session-class"), "Choose class", classOptions);
  renderActiveClasses(partitions, classList);
  renderArchivedRoster(partitions, archivedList);
}

export function updatePresence(state, documentRoot = document) {
  const students = new Map((state?.students ?? []).map((student) => [student.id, student]));
  for (const metadata of documentRoot.querySelectorAll("[data-student-presence]")) {
    const student = students.get(metadata.dataset.studentPresence);
    if (!student) continue;
    const online = student.lastSeenAt && Date.now() - student.lastSeenAt < 20_000;
    metadata.dataset.online = String(Boolean(online));
    metadata.textContent = ` · ${online ? "online" : "offline"}${student.extraMinutes ? ` · +${student.extraMinutes} min` : ""}`;
  }
}

export function formatTimedPhase(minutes, phase) {
  if (minutes > 0 && minutes < 1) {
    const seconds = Math.max(1, Math.round(minutes * 60));
    return `${seconds} second${seconds === 1 ? "" : "s"} ${phase}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"} ${phase}`;
}

export function formatPaperTime(session) {
  if (!session.durationMinutes) return "Teacher-defined timing";
  if (session.phases?.length) return `${session.phases.length} timed phases · ${session.durationMinutes} minutes total`;
  const writing = formatTimedPhase(session.durationMinutes, "writing");
  return session.readingTimeMinutes
    ? `${formatTimedPhase(session.readingTimeMinutes, "reading")} · ${writing}`
    : writing;
}

export function currentSessionPhase(session, now = Date.now()) {
  if (session.status !== "live" || !session.startedAt || !session.phases?.length) return null;
  let startsAt = Number(session.startedAt);
  for (const phase of session.phases) {
    const endsAt = startsAt + Number(phase.durationMinutes) * 60_000;
    if (now >= startsAt && now < endsAt) return phase;
    startsAt = endsAt;
  }
  return null;
}

export function sessionActionModel(session, archived = false) {
  const actions = [];
  if (archived) {
    actions.push("restore");
    if (session.status === "ended") actions.push("responses");
    return actions;
  }
  if (session.status !== "ended") actions.push("clock", session.status === "draft" ? "start" : "end");
  if (session.status !== "draft") actions.push("responses");
  if (session.status !== "live") actions.push("archive");
  return actions;
}

function sessionDetail(documentRoot, session) {
  const detail = documentRoot.createElement("div");
  const title = documentRoot.createElement("strong");
  title.textContent = session.paperTitle;
  const metadata = documentRoot.createElement("span");
  const status = session.status === "draft" ? "ready" : session.status;
  const phase = currentSessionPhase(session);
  metadata.textContent = `${session.className} · ${status}${phase ? ` · ${phase.label}` : ""} · ${formatPaperTime(session)}`;
  detail.append(title, metadata);
  return detail;
}

function renderSessionActions(documentRoot, session, actions, archived) {
  const container = documentRoot.createElement("div");
  container.className = "session-actions";
  const label = `${session.paperTitle} for ${session.className}`;
  for (const action of actions) {
    if (action === "clock") {
      const countdown = documentRoot.createElement("a");
      countdown.href = `/clock?session=${encodeURIComponent(session.id)}`;
      countdown.target = "_blank";
      countdown.rel = "noopener";
      countdown.className = "clock-launch compact";
      countdown.textContent = "Open clock ↗";
      countdown.setAttribute("aria-label", `Open countdown for ${session.paperTitle} in a new tab`);
      container.append(countdown);
    } else if (action === "start" || action === "end") {
      const lifecycle = documentRoot.createElement("button");
      lifecycle.type = "button";
      lifecycle.dataset.sessionId = session.id;
      lifecycle.dataset.sessionAction = action;
      lifecycle.className = action === "start" ? "primary-action compact" : "danger-action compact";
      lifecycle.textContent = action === "start" ? "Start exam" : "End exam";
      container.append(lifecycle);
    } else if (action === "responses") {
      container.append(responseButton(documentRoot, session));
    } else {
      container.append(lifecycleButton(documentRoot, {
        action,
        collection: "sessions",
        id: session.id,
        label,
        text: action === "restore" ? "Restore" : "Remove",
        className: action === "archive" ? "danger-action compact" : "compact",
      }));
    }
  }
  if (archived) container.dataset.archivedActions = "true";
  return container;
}

function renderSessionList(sessions, container, archived) {
  const documentRoot = container.ownerDocument;
  if (sessions.length === 0) {
    emptyState(container, archived ? "No removed exam sittings." : "Set up an exam to make a paper available to a class.");
    return;
  }
  for (const session of sessions) {
    const row = documentRoot.createElement("li");
    row.className = "session-row";
    const counts = documentRoot.createElement("span");
    counts.className = "session-counts";
    counts.textContent = session.status === "draft"
      ? "Ready to start"
      : `${session.submittedCount}/${session.candidateCount} submitted · ${session.activeCount} online`;
    row.append(
      sessionDetail(documentRoot, session),
      counts,
      renderSessionActions(documentRoot, session, sessionActionModel(session, archived), archived),
    );
    container.append(row);
  }
}

export function renderSessions(state, documentRoot = document) {
  const partitions = partitionDashboardState(state);
  const activeList = documentRoot.querySelector("#session-list");
  const archivedList = documentRoot.querySelector("#archived-session-list");
  activeList.replaceChildren();
  archivedList.replaceChildren();
  const counter = documentRoot.querySelector("#archived-session-count");
  if (counter) counter.textContent = String(partitions.archived.sessions.length);
  renderSessionList(partitions.active.sessions, activeList, false);
  renderSessionList(partitions.archived.sessions, archivedList, true);
}

export function readCollectionTarget(button) {
  const { collection, collectionAction: action, collectionId: id, collectionLabel: label } = button.dataset;
  if (!COLLECTIONS.has(collection) || !LIFECYCLE_ACTIONS.has(action) || !id || !label) return null;
  return { collection, action, id, label };
}

export function populateArchiveDialog(dialog, target) {
  const content = archiveDialogCopy(target.collection, target.label);
  dialog.querySelector("#archive-title").textContent = content.title;
  dialog.querySelector("#archive-context").textContent = content.description;
  dialog.querySelector("#confirm-archive").textContent = content.confirmLabel;
  const error = dialog.querySelector("#archive-error");
  error.textContent = "";
  error.hidden = true;
  return content;
}
