import { ApiError, announce, api, formatTime, setView } from "/app.js";
import { createInkResponse, hasInkResponse } from "/ink-canvas.js";

const RICH_TAGS = new Set([
  "div", "p", "br", "b", "strong", "i", "em", "u", "sup", "sub", "ol", "ul", "li",
  "table", "thead", "tbody", "tr", "td", "th", "span", "font",
]);
const BLOCKED_TAGS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "link", "meta"]);
const FONT_NAMES = new Set(["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New"]);
const ALIGNMENTS = new Set(["left", "center", "right", "justify"]);
const HIGHLIGHT_COLORS = new Set(["blue", "green", "purple", "yellow"]);
const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter("en", { granularity: "word" }) : null;

function safeRichHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = typeof value === "string" ? value : "";
  for (const element of [...template.content.querySelectorAll("*")]) {
    const tag = element.localName;
    if (BLOCKED_TAGS.has(tag)) {
      element.remove();
      continue;
    }
    if (!RICH_TAGS.has(tag)) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    for (const attribute of [...element.attributes]) {
      const keepFace = tag === "font" && attribute.name === "face" && FONT_NAMES.has(attribute.value);
      const keepSize = tag === "font" && attribute.name === "size" && /^[1-7]$/.test(attribute.value);
      const keepAlign = ["div", "p", "td", "th"].includes(tag) && attribute.name === "align" && ALIGNMENTS.has(attribute.value);
      const keepStyle = attribute.name === "style" && /^\s*text-align\s*:\s*(left|center|right|justify)\s*;?\s*$/i.test(attribute.value);
      if (!keepFace && !keepSize && !keepAlign && !keepStyle) element.removeAttribute(attribute.name);
    }
  }
  return template.innerHTML;
}

function safeHighlightHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = typeof value === "string" ? value : "";
  for (const element of [...template.content.querySelectorAll("*")]) {
    if (element.localName !== "mark" || !HIGHLIGHT_COLORS.has(element.dataset.color)) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    const color = element.dataset.color;
    for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name);
    element.dataset.color = color;
  }
  return template.innerHTML;
}

function wordCount(html) {
  const holder = document.createElement("div");
  holder.innerHTML = safeRichHtml(html);
  const text = holder.textContent?.trim() ?? "";
  if (!text) return 0;
  if (segmenter) {
    let count = 0;
    for (const item of segmenter.segment(text)) if (item.isWordLike) count += 1;
    return count;
  }
  return text.split(/\s+/u).filter(Boolean).length;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function button(label, className, attributes = {}) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.className = className;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function textBlock(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function mountExam(state, { onSubmitted }) {
  const paper = state.paper;
  const sessionId = state.session.id;
  const response = state.response;
  const questionIds = new Set(paper.questions.map((question) => question.id));
  const resourceKeys = new Set(paper.resources.map((resource) => resource.key));
  const draftKey = `digitaldp:draft:${sessionId}`;
  const highlightKey = `digitaldp:highlights:${sessionId}`;
  const preferenceKey = "digitaldp:exam-preferences";
  const instructionKey = `digitaldp:instructions:${sessionId}`;
  const timerKey = `digitaldp:timer:${sessionId}`;
  const controller = new AbortController();
  const { signal } = controller;
  let questionController = new AbortController();
  let questionSignal = questionController.signal;
  signal.addEventListener("abort", () => questionController.abort(), { once: true });
  const serverOffset = state.serverTime - Date.now();
  let saveTimer;
  let tickTimer;
  let dirty = false;
  let saving = null;
  let submitting = false;
  let expiredHandled = false;
  let readingActive = Number(state.session.readingEndsAt) > Date.now() + serverOffset;
  let activeAudio = null;
  let activePane = "question";
  let activeQuestionId = response.selectedQuestionId ?? paper.questions[0]?.id ?? null;
  const hasScopedResources = paper.questions.some((question) => question.resourceKeys.length > 0);
  const initialQuestion = paper.questions.find((question) => question.id === activeQuestionId);
  let activeResourceKey = initialQuestion?.resourceKeys.find((key) => resourceKeys.has(key))
    ?? (!hasScopedResources ? paper.resources[0]?.key : null)
    ?? null;
  let timerMode = localStorage.getItem(timerKey) ?? "countdown";
  let highlights = readJson(highlightKey, {});
  const audioElements = new Set();
  const savedRanges = new Map();
  const preferences = {
    textSize: "1",
    scheme: "white",
    font: "standard",
    spacing: "normal",
    ...readJson(preferenceKey, {}),
  };
  const draft = {
    selectedQuestionId: response.selectedQuestionId ?? null,
    answers: Object.fromEntries(
      Object.entries(response.answers ?? {}).filter(([id, value]) => questionIds.has(id) && typeof value === "string"),
    ),
    flags: new Set((response.flags ?? []).filter((id) => questionIds.has(id))),
    audioPlays: Object.fromEntries(
      Object.entries(response.audioPlays ?? {}).filter(([key, value]) => resourceKeys.has(key) && Number.isInteger(value)),
    ),
    notepad: typeof response.notepad === "string" ? response.notepad : "",
    updatedAt: Number(response.updatedAt) || 0,
  };

  const localDraft = readJson(draftKey, null);
  if (localDraft?.unsaved === true && localDraft.sessionId === sessionId && Number(localDraft.updatedAt) > draft.updatedAt) {
    draft.selectedQuestionId = questionIds.has(localDraft.selectedQuestionId) ? localDraft.selectedQuestionId : draft.selectedQuestionId;
    draft.answers = Object.fromEntries(
      Object.entries(localDraft.answers ?? {}).filter(([id, value]) => questionIds.has(id) && typeof value === "string"),
    );
    draft.flags = new Set((localDraft.flags ?? []).filter((id) => questionIds.has(id)));
    draft.notepad = typeof localDraft.notepad === "string" ? localDraft.notepad : draft.notepad;
    draft.updatedAt = Number(localDraft.updatedAt) || draft.updatedAt;
    activeQuestionId = draft.selectedQuestionId ?? activeQuestionId;
    dirty = true;
  }
  else if (localDraft) localStorage.removeItem(draftKey);

  setView(`
    <div class="exam-shell">
      <header class="exam-topbar">
        <div class="exam-identity">
          <span class="product-mark exam-mark" aria-hidden="true">DP</span>
          <div><p id="exam-subject" class="eyebrow"></p><h1 id="exam-title"></h1></div>
        </div>
        <nav class="exam-tools" aria-label="Examination tools">
          <button id="flag-tool" type="button" aria-pressed="false">Flag</button>
          <button id="notepad-tool" type="button">Notepad</button>
          <details class="highlight-menu">
            <summary>Highlight</summary>
            <div aria-label="Highlight colours">
              <button type="button" data-highlight="blue" aria-label="Blue highlight"></button>
              <button type="button" data-highlight="green" aria-label="Green highlight"></button>
              <button type="button" data-highlight="purple" aria-label="Purple highlight"></button>
              <button type="button" data-highlight="yellow" aria-label="Yellow highlight"></button>
              <button type="button" data-clear-highlights>Clear</button>
            </div>
          </details>
          <button id="timer-tool" class="timer-tool" type="button"></button>
          <label class="language-tool"><span class="visually-hidden">Interface language</span><select aria-label="Interface language"><option>English</option></select></label>
          <button id="accessibility-tool" type="button" aria-label="Accessibility settings">Accessibility</button>
        </nav>
      </header>

      <div id="reading-banner" class="reading-banner" role="status" aria-live="polite" hidden>
        <strong>Reading time</strong>
        <span id="reading-copy">Review the materials and questions. Student entry areas will unlock automatically.</span>
      </div>

      <div class="exam-workspace">
        <section id="resource-pane" class="exam-pane resource-pane" aria-label="Examination resources">
          <header class="pane-heading"><h2 id="resource-title">Resources</h2><div class="pane-zoom" aria-label="Resource zoom"><button type="button" data-zoom="resource" data-direction="out" aria-label="Zoom resource out">−</button><button type="button" data-zoom="resource" data-direction="in" aria-label="Zoom resource in">+</button></div></header>
          <div id="resource-viewer" class="pane-scroll resource-viewer" tabindex="0"></div>
          <nav id="resource-tabs" class="resource-tabs" aria-label="Resources"></nav>
        </section>
        <div id="pane-splitter" class="pane-splitter" role="separator" tabindex="0" aria-label="Resize examination panes" aria-orientation="vertical" aria-valuemin="30" aria-valuemax="70" aria-valuenow="50"></div>
        <section id="question-pane" class="exam-pane question-pane" aria-label="Questions and response">
          <header class="pane-heading"><h2 id="question-pane-title">Questions</h2><div class="pane-zoom" aria-label="Question zoom"><button type="button" data-zoom="question" data-direction="out" aria-label="Zoom questions out">−</button><button type="button" data-zoom="question" data-direction="in" aria-label="Zoom questions in">+</button></div></header>
          <div id="question-viewer" class="pane-scroll question-viewer"></div>
        </section>
      </div>

      <footer class="exam-footer">
        <button id="instructions-tool" type="button">Instructions</button>
        <span id="paper-label" class="paper-label"></span>
        <span id="save-status" class="save-status" role="status" aria-live="polite">Saved</span>
        <button id="summary-tool" class="summary-action" type="button">View summary</button>
      </footer>
      <p id="global-status" class="status-message exam-status" role="status" aria-live="polite" hidden></p>

      <dialog id="instructions-dialog" class="exam-dialog">
        <form method="dialog"><header><p class="eyebrow">Before you begin</p><h2>Instructions</h2></header><div id="instructions-copy" class="dialog-copy"></div><footer><button class="primary-action" value="continue">Continue to examination</button></footer></form>
      </dialog>
      <dialog id="notepad-dialog" class="exam-dialog compact-dialog">
        <form method="dialog"><header><p class="eyebrow">Private working area</p><h2>Notepad</h2><p>Notes are saved during this practice session but are not submitted as answers.</p></header><label for="notepad" class="visually-hidden">Notes</label><textarea id="notepad" rows="12" spellcheck="false" autocorrect="off" autocapitalize="off" translate="no"></textarea><footer><button value="close">Close</button></footer></form>
      </dialog>
      <dialog id="accessibility-dialog" class="exam-dialog compact-dialog">
        <form method="dialog"><header><p class="eyebrow">Display</p><h2>Accessibility settings</h2></header><div class="preference-grid">
          <label>Text magnification<select id="text-size"><option value="1">Standard</option><option value="2">Large</option><option value="3">Extra large</option><option value="4">Maximum</option></select></label>
          <label>Colour and contrast<select id="colour-scheme"><option value="white">White</option><option value="cream">Cream</option><option value="blue">Soft blue</option><option value="dark">Dark</option><option value="contrast">High contrast</option></select></label>
          <label>Typeface<select id="font-choice"><option value="standard">Standard</option><option value="serif">Serif</option><option value="readable">Dyslexia-friendly</option></select></label>
          <label>Text spacing<select id="spacing-choice"><option value="normal">Standard</option><option value="wide">Wide</option><option value="maximum">Maximum</option></select></label>
        </div><footer><button value="close">Done</button></footer></form>
      </dialog>
      <dialog id="summary-dialog" class="exam-dialog summary-dialog">
        <form method="dialog"><header><p class="eyebrow">Review</p><h2>Response summary</h2><p id="summary-intro"></p></header><div id="summary-list" class="summary-list"></div><footer><button value="close">Return to examination</button><button id="open-submit" class="primary-action" value="close">Submit examination</button></footer></form>
      </dialog>
      <dialog id="submit-dialog" class="exam-dialog compact-dialog">
        <form method="dialog"><header><p class="eyebrow">Final submission</p><h2>Submit your examination?</h2><p id="submit-warning">You cannot change your response after submission.</p></header><footer><button value="cancel">Return</button><button id="confirm-submit" class="danger-action" value="cancel">Submit now</button></footer></form>
      </dialog>
    </div>
  `);

  const shell = document.querySelector(".exam-shell");
  shell.dataset.sessionId = sessionId;
  shell.dataset.mode = paper.mode;
  shell.dataset.split = "50";
  shell.dataset.resourceZoom = "1";
  shell.dataset.questionZoom = "1";
  shell.dataset.phase = readingActive ? "reading" : "writing";
  if (!activeResourceKey) shell.dataset.noResources = "true";
  document.querySelector("#exam-subject").textContent = `${paper.subjectLabel} · ${paper.level}`;
  document.querySelector("#exam-title").textContent = paper.title;
  document.querySelector("#paper-label").textContent = paper.paper;
  document.querySelector("#instructions-copy").textContent = paper.instructions;
  const notepad = document.querySelector("#notepad");
  notepad.value = draft.notepad;

  function applyPreferences() {
    shell.dataset.textSize = ["1", "2", "3", "4"].includes(preferences.textSize) ? preferences.textSize : "1";
    shell.dataset.scheme = ["white", "cream", "blue", "dark", "contrast"].includes(preferences.scheme) ? preferences.scheme : "white";
    shell.dataset.font = ["standard", "serif", "readable"].includes(preferences.font) ? preferences.font : "standard";
    shell.dataset.spacing = ["normal", "wide", "maximum"].includes(preferences.spacing) ? preferences.spacing : "normal";
    document.querySelector("#text-size").value = shell.dataset.textSize;
    document.querySelector("#colour-scheme").value = shell.dataset.scheme;
    document.querySelector("#font-choice").value = shell.dataset.font;
    document.querySelector("#spacing-choice").value = shell.dataset.spacing;
  }

  function payload() {
    const answers = {};
    for (const [id, value] of Object.entries(draft.answers)) if (questionIds.has(id)) answers[id] = value;
    return {
      sessionId,
      selectedQuestionId: draft.selectedQuestionId,
      answers,
      flags: [...draft.flags],
      notepad: draft.notepad,
    };
  }

  function persistLocal(timestamp = Date.now() + serverOffset) {
    draft.updatedAt = timestamp;
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        sessionId,
        selectedQuestionId: draft.selectedQuestionId,
        answers: draft.answers,
        flags: [...draft.flags],
        notepad: draft.notepad,
        unsaved: true,
        updatedAt: draft.updatedAt,
      }));
      return true;
    } catch {
      return false;
    }
  }

  function setSaveStatus(message, tone = "") {
    const status = document.querySelector("#save-status");
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function markDirty() {
    if (submitting || readingActive) return;
    dirty = true;
    const backedUp = persistLocal();
    setSaveStatus(backedUp ? "Saved on this device" : "Saving to server…", backedUp ? "local" : "");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 1_200);
  }

  async function saveNow() {
    if (saving) return saving;
    if (!dirty || submitting || readingActive) return;
    dirty = false;
    setSaveStatus("Saving…");
    saving = api("/api/student/response", { method: "PUT", body: payload() })
      .then(({ savedAt, expired }) => {
        draft.updatedAt = savedAt;
        if (!dirty) localStorage.removeItem(draftKey);
        setSaveStatus(`Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, "saved");
        if (expired) onSubmitted();
      })
      .catch((error) => {
        dirty = true;
        setSaveStatus("Offline — saved on this device", "error");
        if (error instanceof ApiError && error.status === 409) onSubmitted();
      })
      .finally(() => {
        saving = null;
        if (dirty && !submitting) {
          clearTimeout(saveTimer);
          saveTimer = setTimeout(saveNow, 3_000);
        }
      });
    return saving;
  }

  function attempted(question) {
    const answer = draft.answers[question.id] ?? "";
    if (question.type === "ink" && question.ink) return hasInkResponse(answer, question.ink);
    return question.type === "essay" ? wordCount(answer) > 0 : answer.trim().length > 0;
  }

  function questionStatus(question) {
    if (paper.selectionMode === "one" && question.type === "essay" && draft.selectedQuestionId !== question.id) return "Not selected";
    if (!attempted(question)) return "Not answered";
    if (question.type === "essay" && question.wordCountMin && wordCount(draft.answers[question.id]) < question.wordCountMin) return "In progress";
    return "Answered";
  }

  function resourcesForQuestion(questionId) {
    if (!hasScopedResources) return paper.resources;
    const question = paper.questions.find((item) => item.id === questionId);
    const keys = new Set(question?.resourceKeys ?? []);
    return paper.resources.filter((resource) => keys.has(resource.key));
  }

  function syncResourcesToQuestion(questionId) {
    const available = resourcesForQuestion(questionId);
    if (!available.some((resource) => resource.key === activeResourceKey)) {
      activeResourceKey = available[0]?.key ?? null;
    }
    renderResourceTabs();
    renderResource();
  }

  function updateFlagTool() {
    const tool = document.querySelector("#flag-tool");
    const flagged = activeQuestionId ? draft.flags.has(activeQuestionId) : false;
    tool.disabled = readingActive || !activeQuestionId;
    tool.setAttribute("aria-pressed", String(flagged));
    tool.textContent = flagged ? "Flagged" : "Flag";
  }

  function setActiveQuestion(id) {
    if (!questionIds.has(id)) return;
    const changed = activeQuestionId !== id;
    activeQuestionId = id;
    updateFlagTool();
    document.querySelectorAll(".question-card").forEach((card) => card.toggleAttribute("data-active", card.dataset.questionId === id));
    if (changed) syncResourcesToQuestion(id);
  }

  function captureEditor(editor, question, changed = true) {
    draft.answers[question.id] = safeRichHtml(editor.innerHTML);
    const count = wordCount(draft.answers[question.id]);
    const output = editor.closest(".essay-response")?.querySelector(".word-count");
    if (output) {
      const range = question.wordCountMin && question.wordCountMax ? ` · target ${question.wordCountMin}–${question.wordCountMax}` : "";
      output.textContent = `${count} word${count === 1 ? "" : "s"}${range}`;
      output.dataset.belowMinimum = String(Boolean(question.wordCountMin && count < question.wordCountMin));
    }
    if (changed) markDirty();
  }

  function restoreRange(editor, questionId) {
    const range = savedRanges.get(questionId);
    if (!range || !editor.contains(range.commonAncestorContainer)) return;
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function beginQuestionRender() {
    questionController.abort();
    questionController = new AbortController();
    questionSignal = questionController.signal;
    savedRanges.clear();
  }

  function makeEditor(question) {
    const responseArea = document.createElement("div");
    responseArea.className = "essay-response";
    const toolbar = document.createElement("div");
    toolbar.className = "editor-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", `Formatting for ${question.label}`);
    toolbar.innerHTML = `
      <button type="button" data-command="bold" aria-label="Bold"><strong>B</strong></button>
      <button type="button" data-command="italic" aria-label="Italic"><em>I</em></button>
      <button type="button" data-command="underline" aria-label="Underline"><u>U</u></button>
      <button type="button" data-command="superscript" aria-label="Superscript">x²</button>
      <button type="button" data-command="subscript" aria-label="Subscript">x₂</button>
      <button type="button" data-command="insertOrderedList" aria-label="Numbered list">1.</button>
      <button type="button" data-command="insertUnorderedList" aria-label="Bulleted list">•</button>
      <button type="button" data-command="outdent" aria-label="Decrease indent">←</button>
      <button type="button" data-command="indent" aria-label="Increase indent">→</button>
      <button type="button" data-command="justifyLeft" aria-label="Align left">L</button>
      <button type="button" data-command="justifyCenter" aria-label="Align centre">C</button>
      <button type="button" data-command="justifyRight" aria-label="Align right">R</button>
      <button type="button" data-command="justifyFull" aria-label="Justify">J</button>
      <button type="button" data-command="undo" aria-label="Undo">↶</button>
      <button type="button" data-command="redo" aria-label="Redo">↷</button>
      <button type="button" data-command="table" aria-label="Insert table">Table</button>
      <label><span class="visually-hidden">Font family</span><select data-format="fontName" aria-label="Font family"><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Verdana</option><option>Courier New</option></select></label>
      <label><span class="visually-hidden">Font size</span><select data-format="fontSize" aria-label="Font size"><option value="2">12px</option><option value="3" selected>16px</option><option value="4">18px</option><option value="5">24px</option><option value="6">32px</option></select></label>
    `;
    const editor = document.createElement("div");
    editor.className = "rich-editor";
    editor.contentEditable = "true";
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-label", `Response to ${question.label}`);
    editor.setAttribute("aria-multiline", "true");
    editor.setAttribute("spellcheck", "false");
    editor.setAttribute("autocorrect", "off");
    editor.setAttribute("autocapitalize", "off");
    editor.setAttribute("translate", "no");
    editor.innerHTML = safeRichHtml(draft.answers[question.id] ?? "");
    const count = textBlock("p", "word-count", "");
    responseArea.append(toolbar, editor, count);

    editor.addEventListener("focus", () => setActiveQuestion(question.id), { signal: questionSignal });
    editor.addEventListener("input", () => captureEditor(editor, question), { signal: questionSignal });
    editor.addEventListener("paste", (event) => {
      event.preventDefault();
      document.execCommand("insertText", false, event.clipboardData?.getData("text/plain") ?? "");
    }, { signal: questionSignal });
    toolbar.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    }, { signal: questionSignal });
    toolbar.addEventListener("click", (event) => {
      const control = event.target.closest("button[data-command]");
      if (!control) return;
      restoreRange(editor, question.id);
      editor.focus();
      // ponytail: execCommand is deprecated, but it is the smallest dependency-free editor that works in the managed Chromium targets.
      if (control.dataset.command === "table") {
        document.execCommand("insertHTML", false, "<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>");
      } else {
        document.execCommand(control.dataset.command, false);
      }
      captureEditor(editor, question);
    }, { signal: questionSignal });
    toolbar.querySelectorAll("select[data-format]").forEach((select) => {
      select.addEventListener("change", () => {
        restoreRange(editor, question.id);
        editor.focus();
        document.execCommand(select.dataset.format, false, select.value);
        captureEditor(editor, question);
      }, { signal: questionSignal });
    });
    captureEditor(editor, question, false);
    return responseArea;
  }

  function makeQuestionCard(question, includePrompt = true) {
    const card = document.createElement("article");
    card.className = "question-card";
    card.dataset.questionId = question.id;
    card.tabIndex = -1;
    const header = document.createElement("header");
    const label = textBlock("h3", "question-label", question.label);
    if (question.marks) label.append(textBlock("span", "question-marks", ` [${question.marks}]`));
    const flag = button(draft.flags.has(question.id) ? "Flagged" : "Flag", "inline-flag", { "aria-pressed": String(draft.flags.has(question.id)) });
    flag.disabled = readingActive;
    flag.addEventListener("click", () => {
      setActiveQuestion(question.id);
      if (draft.flags.has(question.id)) draft.flags.delete(question.id); else draft.flags.add(question.id);
      flag.setAttribute("aria-pressed", String(draft.flags.has(question.id)));
      flag.textContent = draft.flags.has(question.id) ? "Flagged" : "Flag";
      updateFlagTool();
      markDirty();
    }, { signal: questionSignal });
    header.append(label, flag);
    card.append(header);
    if (includePrompt) card.append(textBlock("p", "question-prompt", question.prompt));
    if (readingActive) {
      card.append(textBlock("p", "reading-lock", "The student entry area opens when reading time ends."));
      if (question.id === activeQuestionId) card.dataset.active = "";
      return card;
    }

    if (question.type === "essay") {
      card.append(makeEditor(question));
    } else if (question.type === "short") {
      const answerLabel = textBlock("label", "answer-label", "Answer");
      const input = document.createElement("textarea");
      input.rows = 4;
      input.value = draft.answers[question.id] ?? "";
      input.maxLength = 20_000;
      input.spellcheck = false;
      input.setAttribute("autocorrect", "off");
      input.setAttribute("autocapitalize", "off");
      input.setAttribute("translate", "no");
      answerLabel.append(input);
      input.addEventListener("focus", () => setActiveQuestion(question.id), { signal: questionSignal });
      input.addEventListener("input", () => {
        draft.answers[question.id] = input.value;
        markDirty();
      }, { signal: questionSignal });
      card.append(answerLabel);
    } else if (question.type === "ink" && question.ink) {
      card.append(createInkResponse({
        value: draft.answers[question.id] ?? "",
        settings: question.ink,
        label: question.label,
        signal: questionSignal,
        onChange(value) {
          draft.answers[question.id] = value;
          markDirty();
        },
      }));
    } else {
      const choices = document.createElement("fieldset");
      choices.className = "answer-choices";
      choices.append(textBlock("legend", "visually-hidden", `Answer ${question.label}`));
      for (const choice of question.options ?? []) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `answer-${question.id}`;
        input.value = choice;
        input.checked = draft.answers[question.id] === choice;
        input.addEventListener("change", () => {
          setActiveQuestion(question.id);
          draft.answers[question.id] = choice;
          markDirty();
        }, { signal: questionSignal });
        label.append(input, document.createTextNode(choice));
        choices.append(label);
      }
      card.append(choices);
    }
    card.addEventListener("pointerdown", () => setActiveQuestion(question.id), { signal: questionSignal });
    if (question.id === activeQuestionId) card.dataset.active = "";
    return card;
  }

  function renderEssayChoice() {
    const viewer = document.querySelector("#question-viewer");
    viewer.replaceChildren();
    const intro = textBlock("p", "exam-direction", paper.instructions.split(/\n/u)[0] || "Choose one question.");
    const choices = document.createElement("fieldset");
    choices.className = "essay-question-choices";
    choices.append(textBlock("legend", "visually-hidden", "Choose one question"));
    for (const question of paper.questions) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "selected-question";
      input.value = question.id;
      input.checked = draft.selectedQuestionId === question.id;
      input.disabled = readingActive;
      const number = textBlock("strong", "", question.label);
      if (question.marks) number.append(document.createTextNode(` [${question.marks}]`));
      const prompt = document.createTextNode(question.prompt);
      label.append(input, number, prompt);
      input.addEventListener("change", () => {
        draft.selectedQuestionId = question.id;
        setActiveQuestion(question.id);
        markDirty();
        renderQuestionPanel();
      }, { signal: questionSignal });
      choices.append(label);
    }
    viewer.append(intro, choices);
    const selected = paper.questions.find((question) => question.id === draft.selectedQuestionId);
    if (selected) viewer.append(makeQuestionCard(selected, false));
    else viewer.append(textBlock("p", "selection-empty", "Choose a question to open the writing area."));
    updateFlagTool();
  }

  function renderQuestionPanel() {
    beginQuestionRender();
    if (paper.selectionMode === "one" && paper.mode === "essay") {
      renderEssayChoice();
      return;
    }
    const viewer = document.querySelector("#question-viewer");
    viewer.replaceChildren();
    const questions = paper.questions;
    if (!questions.some((question) => question.id === activeQuestionId)) {
      activeQuestionId = questions[0]?.id ?? null;
      syncResourcesToQuestion(activeQuestionId);
    }
    for (const question of questions) viewer.append(makeQuestionCard(question));
    updateFlagTool();
  }

  function renderAudio(resource) {
    const wrapper = document.createElement("section");
    wrapper.className = "audio-player";
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audio.src = resource.url;
    audioElements.add(audio);
    const play = button("Play", "audio-play");
    const progress = document.createElement("progress");
    progress.max = 1;
    progress.value = 0;
    const elapsed = textBlock("output", "audio-time", "00:00 / --:--");
    const volumeLabel = document.createElement("label");
    volumeLabel.className = "volume-control";
    volumeLabel.append(document.createTextNode("Volume "));
    const volume = document.createElement("input");
    volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.05";
    volume.value = "1";
    volume.setAttribute("aria-label", "Audio volume");
    volumeLabel.append(volume);
    const playCount = textBlock("strong", "play-count", "");
    const maxPlays = resource.maxPlays ?? 2;

    function updateCount() {
      const used = Number(draft.audioPlays[resource.key] ?? 0);
      playCount.textContent = `${used} of ${maxPlays} plays`;
      play.disabled = readingActive || used >= maxPlays || Boolean(activeAudio);
    }
    updateCount();
    volume.addEventListener("input", () => { audio.volume = Number(volume.value); }, { signal });
    audio.addEventListener("loadedmetadata", () => {
      elapsed.textContent = `00:00 / ${formatTime(audio.duration * 1000)}`;
    }, { signal });
    audio.addEventListener("timeupdate", () => {
      progress.value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
      elapsed.textContent = `${formatTime(audio.currentTime * 1000)} / ${Number.isFinite(audio.duration) ? formatTime(audio.duration * 1000) : "--:--"}`;
    }, { signal });
    audio.addEventListener("ended", () => {
      activeAudio = null;
      shell.dataset.audioPlaying = "false";
      updateCount();
      document.querySelectorAll(".resource-tabs button").forEach((item) => { item.disabled = false; });
    }, { signal });
    play.addEventListener("click", async () => {
      if (activeAudio || Number(draft.audioPlays[resource.key] ?? 0) >= maxPlays) return;
      play.disabled = true;
      try {
        const result = await api("/api/student/audio-play", { method: "POST", body: { sessionId, resourceKey: resource.key } });
        draft.audioPlays[resource.key] = result.plays;
        activeAudio = audio;
        shell.dataset.audioPlaying = "true";
        document.querySelectorAll(".resource-tabs button").forEach((item) => { item.disabled = true; });
        updateCount();
        await audio.play();
      } catch (error) {
        activeAudio = null;
        shell.dataset.audioPlaying = "false";
        updateCount();
        announce(error instanceof Error ? error.message : "Audio could not start", "error");
      }
    }, { signal });
    wrapper.append(progress, play, elapsed, volumeLabel, playCount, audio);
    return wrapper;
  }

  function renderResource() {
    const viewer = document.querySelector("#resource-viewer");
    for (const audio of audioElements) {
      if (audio !== activeAudio) audio.pause();
    }
    viewer.replaceChildren();
    const resource = paper.resources.find((item) => item.key === activeResourceKey);
    document.querySelector("#resource-title").textContent = resource?.label ?? "Resources";
    if (!resource) return;
    if (resource.kind === "text") {
      const copy = document.createElement("article");
      copy.className = "resource-copy";
      copy.tabIndex = 0;
      if (typeof highlights[resource.key] === "string") copy.innerHTML = safeHighlightHtml(highlights[resource.key]);
      else copy.textContent = resource.text;
      viewer.append(copy);
    } else if (resource.kind === "image") {
      const image = document.createElement("img");
      image.src = resource.url;
      image.alt = resource.label;
      viewer.append(image);
    } else if (resource.kind === "document") {
      const frame = document.createElement("iframe");
      frame.src = resource.url;
      frame.title = resource.label;
      viewer.append(frame);
    } else if (resource.kind === "audio") {
      viewer.append(renderAudio(resource));
    }
    document.querySelectorAll("#resource-tabs button").forEach((item) => {
      item.setAttribute("aria-current", item.dataset.resourceKey === activeResourceKey ? "page" : "false");
    });
  }

  function selectResource(key) {
    if (!resourcesForQuestion(activeQuestionId).some((resource) => resource.key === key) || activeAudio) return;
    activeResourceKey = key;
    renderResource();
  }

  function renderResourceTabs() {
    const tabs = document.querySelector("#resource-tabs");
    tabs.replaceChildren();
    const available = resourcesForQuestion(activeQuestionId);
    if (available.length === 0) {
      activeResourceKey = null;
      shell.dataset.noResources = "true";
      return;
    }
    delete shell.dataset.noResources;
    if (!available.some((resource) => resource.key === activeResourceKey)) activeResourceKey = available[0].key;
    for (const resource of available) {
      const tab = button(resource.label, "resource-tab", { "aria-current": resource.key === activeResourceKey ? "page" : "false" });
      tab.dataset.resourceKey = resource.key;
      tab.addEventListener("click", () => selectResource(resource.key), { signal });
      tabs.append(tab);
    }
  }

  function renderSummary() {
    const list = document.querySelector("#summary-list");
    list.replaceChildren();
    let answered = 0;
    for (const question of paper.questions) {
      const status = questionStatus(question);
      if (status === "Answered") answered += 1;
      const row = button("", "summary-row");
      const identity = textBlock("span", "summary-question", question.label);
      const prompt = textBlock("span", "summary-prompt", question.prompt);
      const stateLabel = textBlock("span", "summary-state", `${draft.flags.has(question.id) ? "Flagged · " : ""}${status}`);
      stateLabel.dataset.status = status.toLowerCase().replaceAll(" ", "-");
      row.append(identity, prompt, stateLabel);
      row.addEventListener("click", () => {
        if (paper.selectionMode === "one" && question.type === "essay" && draft.selectedQuestionId !== question.id) {
          draft.selectedQuestionId = question.id;
          markDirty();
        }
        setActiveQuestion(question.id);
        renderQuestionPanel();
        document.querySelector("#summary-dialog").close();
        requestAnimationFrame(() => document.querySelector(`[data-question-id="${CSS.escape(question.id)}"]`)?.focus());
      }, { signal });
      list.append(row);
    }
    document.querySelector("#summary-intro").textContent = `${answered} of ${paper.questions.length} questions answered.`;
  }

  async function submit(auto = false) {
    if (submitting) return;
    submitting = true;
    shell.dataset.submitting = "true";
    clearTimeout(saveTimer);
    setSaveStatus(auto ? "Time expired — submitting…" : "Submitting…");
    try {
      if (saving) await saving;
      const { submittedAt } = await api("/api/student/submit", { method: "POST", body: payload() });
      localStorage.removeItem(draftKey);
      setSaveStatus(`Submitted ${new Date(submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, "saved");
      onSubmitted();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        onSubmitted();
        return;
      }
      submitting = false;
      shell.dataset.submitting = "false";
      setSaveStatus("Submission failed — response retained", "error");
      announce(error instanceof Error ? error.message : "Submission failed", "error");
    }
  }

  function cycleTimer() {
    timerMode = timerMode === "countdown" ? "countup" : timerMode === "countup" ? "hidden" : "countdown";
    localStorage.setItem(timerKey, timerMode);
    tick();
  }

  function tick() {
    const now = Date.now() + serverOffset;
    const readingRemaining = Math.max(0, Number(state.session.readingEndsAt) - now);
    const readingBanner = document.querySelector("#reading-banner");
    if (readingActive && readingRemaining > 0) {
      readingBanner.hidden = false;
      document.querySelector("#reading-copy").textContent = `Review the materials and questions. Student entry areas unlock in ${formatTime(readingRemaining)}.`;
      const timer = document.querySelector("#timer-tool");
      timer.dataset.warning = "false";
      timer.textContent = `Reading ${formatTime(readingRemaining)}`;
      return;
    }
    if (readingActive) {
      readingActive = false;
      shell.dataset.phase = "writing";
      readingBanner.hidden = true;
      document.querySelector("#notepad-tool").disabled = false;
      document.querySelector("#summary-tool").disabled = false;
      document.querySelectorAll("[data-highlight], [data-clear-highlights]").forEach((control) => { control.disabled = false; });
      renderResource();
      renderQuestionPanel();
      setSaveStatus("Writing time started", "saved");
      if (dirty) saveTimer = setTimeout(saveNow, 1_200);
    }
    const remaining = Math.max(0, state.session.deadline - now);
    const elapsed = Math.max(0, now - Number(state.session.readingEndsAt));
    const timer = document.querySelector("#timer-tool");
    timer.dataset.warning = String(remaining <= 5 * 60_000 && remaining > 0);
    if (timerMode === "hidden") timer.textContent = "Timer hidden";
    else if (timerMode === "countup") timer.textContent = `Elapsed ${formatTime(elapsed)}`;
    else timer.textContent = `Time ${formatTime(remaining)}`;
    if (remaining <= 0 && !expiredHandled) {
      expiredHandled = true;
      submit(true);
    }
  }

  function applyHighlight(color) {
    if (readingActive) {
      announce("Highlighting opens when writing time starts", "error");
      return;
    }
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      announce("Select text in a reading passage before choosing a highlight colour", "error");
      return;
    }
    const range = selection.getRangeAt(0);
    const copy = document.querySelector(".resource-copy");
    if (!copy || !copy.contains(range.commonAncestorContainer)) {
      announce("Highlights can be added to text resources", "error");
      return;
    }
    const mark = document.createElement("mark");
    mark.dataset.color = color;
    mark.append(range.extractContents());
    range.insertNode(mark);
    selection.removeAllRanges();
    highlights[activeResourceKey] = copy.innerHTML;
    localStorage.setItem(highlightKey, JSON.stringify(highlights));
    document.querySelector(".highlight-menu").open = false;
  }

  function clearHighlights() {
    if (readingActive) {
      announce("Highlights cannot be changed during reading time", "error");
      return;
    }
    const copy = document.querySelector(".resource-copy");
    if (!copy) return;
    for (const mark of [...copy.querySelectorAll("mark")]) mark.replaceWith(...mark.childNodes);
    copy.normalize();
    delete highlights[activeResourceKey];
    localStorage.setItem(highlightKey, JSON.stringify(highlights));
    document.querySelector(".highlight-menu").open = false;
  }

  function changeZoom(target, direction) {
    const key = target === "resource" ? "resourceZoom" : "questionZoom";
    const current = Number(shell.dataset[key] ?? 1);
    shell.dataset[key] = String(Math.max(1, Math.min(4, current + (direction === "in" ? 1 : -1))));
  }

  function setSplit(value) {
    const next = Math.max(30, Math.min(70, Math.round(value / 5) * 5));
    shell.dataset.split = String(next);
    document.querySelector("#pane-splitter").setAttribute("aria-valuenow", String(next));
  }

  function bindSplitter() {
    const splitter = document.querySelector("#pane-splitter");
    splitter.addEventListener("pointerdown", (event) => {
      splitter.setPointerCapture(event.pointerId);
      const workspace = document.querySelector(".exam-workspace");
      const move = (moveEvent) => {
        const bounds = workspace.getBoundingClientRect();
        setSplit(((moveEvent.clientX - bounds.left) / bounds.width) * 100);
      };
      const stop = () => {
        splitter.removeEventListener("pointermove", move);
        splitter.removeEventListener("pointerup", stop);
        splitter.removeEventListener("pointercancel", stop);
      };
      splitter.addEventListener("pointermove", move);
      splitter.addEventListener("pointerup", stop);
      splitter.addEventListener("pointercancel", stop);
    }, { signal });
    splitter.addEventListener("keydown", (event) => {
      const current = Number(shell.dataset.split);
      if (event.key === "ArrowLeft") setSplit(current - 5);
      else if (event.key === "ArrowRight") setSplit(current + 5);
      else if (event.key === "Home") setSplit(30);
      else if (event.key === "End") setSplit(70);
      else return;
      event.preventDefault();
    }, { signal });
  }

  document.addEventListener("selectionchange", () => {
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const anchor = selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement;
    const editor = anchor?.closest?.(".rich-editor");
    const card = editor?.closest(".question-card");
    if (editor && card?.dataset.questionId) savedRanges.set(card.dataset.questionId, selection.getRangeAt(0).cloneRange());
  }, { signal });
  window.addEventListener("beforeunload", () => { if (dirty) persistLocal(); }, { signal });
  shell.addEventListener("focusin", (event) => {
    if (event.target.closest("#resource-pane")) activePane = "resource";
    else if (event.target.closest("#question-pane")) activePane = "question";
  }, { signal });
  document.querySelector("#flag-tool").addEventListener("click", () => {
    if (!activeQuestionId) return;
    if (draft.flags.has(activeQuestionId)) draft.flags.delete(activeQuestionId); else draft.flags.add(activeQuestionId);
    updateFlagTool();
    renderQuestionPanel();
    markDirty();
  }, { signal });
  document.querySelector("#notepad-tool").addEventListener("click", () => document.querySelector("#notepad-dialog").showModal(), { signal });
  notepad.addEventListener("input", () => { draft.notepad = notepad.value; markDirty(); }, { signal });
  document.querySelector("#timer-tool").addEventListener("click", cycleTimer, { signal });
  document.querySelector("#accessibility-tool").addEventListener("click", () => document.querySelector("#accessibility-dialog").showModal(), { signal });
  document.querySelector("#instructions-tool").addEventListener("click", () => document.querySelector("#instructions-dialog").showModal(), { signal });
  document.querySelector("#summary-tool").addEventListener("click", () => { renderSummary(); document.querySelector("#summary-dialog").showModal(); }, { signal });
  document.querySelector("#open-submit").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#summary-dialog").close();
    const unanswered = paper.questions.filter((question) => questionStatus(question) !== "Answered").length;
    document.querySelector("#submit-warning").textContent = unanswered > 0
      ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} not complete. You cannot change your response after submission.`
      : "You cannot change your response after submission.";
    document.querySelector("#submit-dialog").showModal();
  }, { signal });
  document.querySelector("#confirm-submit").addEventListener("click", (event) => { event.preventDefault(); document.querySelector("#submit-dialog").close(); submit(false); }, { signal });
  document.querySelectorAll("[data-highlight]").forEach((control) => control.addEventListener("click", () => applyHighlight(control.dataset.highlight), { signal }));
  document.querySelector("[data-clear-highlights]").addEventListener("click", clearHighlights, { signal });
  document.querySelectorAll("[data-zoom]").forEach((control) => control.addEventListener("click", () => changeZoom(control.dataset.zoom ?? activePane, control.dataset.direction), { signal }));
  document.querySelectorAll("#accessibility-dialog select").forEach((select) => select.addEventListener("change", () => {
    preferences.textSize = document.querySelector("#text-size").value;
    preferences.scheme = document.querySelector("#colour-scheme").value;
    preferences.font = document.querySelector("#font-choice").value;
    preferences.spacing = document.querySelector("#spacing-choice").value;
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    applyPreferences();
  }, { signal }));

  applyPreferences();
  document.querySelector("#notepad-tool").disabled = readingActive;
  document.querySelector("#summary-tool").disabled = readingActive;
  document.querySelectorAll("[data-highlight], [data-clear-highlights]").forEach((control) => { control.disabled = readingActive; });
  renderResourceTabs();
  renderResource();
  renderQuestionPanel();
  bindSplitter();
  tick();
  tickTimer = setInterval(tick, 1_000);
  const autosaveTimer = setInterval(saveNow, 15_000);
  if (!localStorage.getItem(instructionKey)) {
    localStorage.setItem(instructionKey, "seen");
    document.querySelector("#instructions-dialog").showModal();
  }
  if (dirty && !readingActive) {
    setSaveStatus("Recovered unsaved work", "local");
    saveTimer = setTimeout(saveNow, 1_200);
  }

  return () => {
    if (dirty) persistLocal();
    clearTimeout(saveTimer);
    clearInterval(tickTimer);
    clearInterval(autosaveTimer);
    for (const audio of audioElements) audio.pause();
    controller.abort();
  };
}
