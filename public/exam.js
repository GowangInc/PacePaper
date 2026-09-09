import { ApiError, announce, api, formatTime, setView } from "/app.js";
import { themeToggleMarkup } from "./theme.js";
import { createExamAudioController } from "/exam-audio.js";
import { phaseAtTime, phaseLockMessage, questionsForPhase, resourcesForExamContext } from "/exam-phase-model.js";
import { createInkResponse, hasInkResponse } from "/ink-canvas.js";
import { createTextHighlighter } from "/text-highlights.js";
import { renderResourceText } from "./resource-text.js";
import { createResponseSaveState, downloadResponseRecovery } from "./response-save-state.js";

const RICH_TAGS = new Set([
  "div", "p", "br", "b", "strong", "i", "em", "u", "sup", "sub", "ol", "ul", "li",
  "table", "thead", "tbody", "tr", "td", "th", "span", "font",
]);
const BLOCKED_TAGS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "link", "meta"]);
const FONT_NAMES = new Set(["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New"]);
const ALIGNMENTS = new Set(["left", "center", "right", "justify"]);
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
  if (!key) return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function removeLocalItem(key) {
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Server persistence remains authoritative when local recovery storage is unavailable.
  }
}

function readLocalItem(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeLocalItem(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Preferences are optional; response safety is tracked separately. */ }
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
  const responseId = typeof response.id === "string" && response.id ? response.id : null;
  const questionIds = new Set(paper.questions.map((question) => question.id));
  const resourceKeys = new Set(paper.resources.map((resource) => resource.key));
  const draftKey = responseId ? `digitaldp:draft:${responseId}` : null;
  const highlightKey = responseId ? `digitaldp:highlights:${responseId}` : null;
  const obsoleteDraftKey = `digitaldp:draft:${sessionId}`;
  const obsoleteHighlightKey = `digitaldp:highlights:${sessionId}`;
  const preferenceKey = "digitaldp:exam-preferences";
  const instructionKey = `digitaldp:instructions:${sessionId}`;
  const timerKey = `digitaldp:timer:${sessionId}`;
  const controller = new AbortController();
  const { signal } = controller;
  let questionController = new AbortController();
  let questionSignal = questionController.signal;
  signal.addEventListener("abort", () => questionController.abort(), { once: true });
  let serverOffset = state.serverTime - Date.now();
  const saveState = createResponseSaveState();
  let saveTimer;
  let tickTimer;
  let dirty = false;
  let saving = null;
  let submitting = false;
  let expiredHandled = false;
  let activePhase = phaseAtTime(state.session.timeline, Date.now() + serverOffset) ?? state.session.phase;
  let pendingResourceSync = false;
  let activePane = "question";
  let activeQuestionId = response.selectedQuestionId ?? paper.questions[0]?.id ?? null;
  const hasScopedResources = paper.questions.some((question) => question.resourceKeys.length > 0);
  const initialQuestion = paper.questions.find((question) => question.id === activeQuestionId);
  let activeResourceKey = initialQuestion?.resourceKeys.find((key) => resourceKeys.has(key))
    ?? (!hasScopedResources ? paper.resources[0]?.key : null)
    ?? null;
  let timerMode = readLocalItem(timerKey) ?? "countdown";
  const savedRanges = new Map();
  const preferences = {
    textSize: "1",
    scheme: "white",
    font: "standard",
    spacing: "normal",
    ...readJson(preferenceKey, {}),
  };

  function responseLocked() {
    return !activePhase?.responseAllowed;
  }

  // Report when the candidate leaves the exam window so the teacher sees it live.
  let focusLost = false;
  function reportFocus(kind) {
    api("/api/student/focus-event", { method: "POST", body: { sessionId, kind } })
      .catch(() => { /* Reporting is best-effort; never interrupt the exam over it. */ });
  }
  function handleFocusLost() {
    if (focusLost) return;
    focusLost = true;
    reportFocus("focus_lost");
  }
  function handleFocusGained() {
    if (!focusLost) return;
    focusLost = false;
    reportFocus("focus_gained");
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") handleFocusLost(); else handleFocusGained();
  }, { signal });
  window.addEventListener("blur", handleFocusLost, { signal });
  window.addEventListener("focus", handleFocusGained, { signal });

  // Full-screen encouragement. Browsers require a user gesture, so offer a
  // one-click control on the exam screen and re-offer if full screen exits.
  // SEB and managed-kiosk environments already run full screen; the request is
  // a harmless no-op there. An explicit dismissal is remembered for the sitting.
  const fsRoot = document.documentElement;
  const fsRequest = fsRoot.requestFullscreen ? () => fsRoot.requestFullscreen() : fsRoot.webkitRequestFullscreen ? () => fsRoot.webkitRequestFullscreen() : null;
  const fsChangeEvent = fsRoot.requestFullscreen ? "fullscreenchange" : fsRoot.webkitRequestFullscreen ? "webkitfullscreenchange" : null;
  if (fsRequest && fsChangeEvent) {
    const nudge = document.createElement("div");
    nudge.className = "fullscreen-nudge";
    nudge.setAttribute("role", "group");
    nudge.setAttribute("aria-label", "Full screen");
    nudge.hidden = true;
    const text = document.createElement("p");
    text.textContent = "Take this exam full screen.";
    const go = document.createElement("button");
    go.type = "button";
    go.className = "primary-action";
    go.textContent = "Full screen";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "fullscreen-nudge-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss full-screen suggestion");
    dismiss.textContent = "×";
    nudge.append(text, go, dismiss);
    const dismissedKey = `digitaldp:fullscreen-dismissed:${sessionId}`;
    const isFullScreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    const refreshNudge = () => { nudge.hidden = isFullScreen() || sessionStorage.getItem(dismissedKey) === "1"; };
    go.addEventListener("click", () => { Promise.resolve(fsRequest()).catch(() => {}); }, { signal });
    dismiss.addEventListener("click", () => { sessionStorage.setItem(dismissedKey, "1"); refreshNudge(); }, { signal });
    document.addEventListener(fsChangeEvent, refreshNudge, { signal });
    window.addEventListener("resize", refreshNudge, { signal });
    refreshNudge();
    document.body.append(nudge);
    signal.addEventListener("abort", () => nudge.remove(), { once: true });
  }

  function finalSubmissionAvailable() {
    return Boolean(activePhase?.responseAllowed && activePhase.canSubmit);
  }

  function visibleQuestions() {
    return questionsForPhase(paper.questions, activePhase);
  }
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

  if (obsoleteDraftKey !== draftKey) removeLocalItem(obsoleteDraftKey);
  const localDraft = readJson(draftKey, null);
  const localPending = localDraft?.unsaved === true && localDraft.sessionId === sessionId;
  const restoreLocal = localPending && (Number(localDraft.updatedAt) > draft.updatedAt
    || confirm("Unsent work from this browser was found alongside a newer server save. Restore the browser copy? Cancel keeps the server copy."));
  if (restoreLocal) {
    draft.selectedQuestionId = questionIds.has(localDraft.selectedQuestionId) ? localDraft.selectedQuestionId : draft.selectedQuestionId;
    draft.answers = Object.fromEntries(
      Object.entries(localDraft.answers ?? {}).filter(([id, value]) => questionIds.has(id) && typeof value === "string"),
    );
    draft.flags = new Set((localDraft.flags ?? []).filter((id) => questionIds.has(id)));
    draft.notepad = typeof localDraft.notepad === "string" ? localDraft.notepad : draft.notepad;
    draft.updatedAt = Number(localDraft.updatedAt) || draft.updatedAt;
    activeQuestionId = draft.selectedQuestionId ?? activeQuestionId;
    dirty = true;
    saveState.edit();
    saveState.backedUp(true);
  }
  else if (localDraft && !localPending) removeLocalItem(draftKey);

  const highlighter = createTextHighlighter({
    storageKey: highlightKey,
    obsoleteStorageKey: obsoleteHighlightKey,
    signal,
    isLocked: responseLocked,
    announce,
  });

  function questionHeading(tag, className, question) {
    const heading = textBlock(tag, className, "");
    heading.append(highlighter.decorate(textBlock("span", "", ""), `question:${question.id}:label`, question.label));
    if (question.marks) heading.append(highlighter.decorate(textBlock("span", "question-marks", ""), `question:${question.id}:marks`, ` [${question.marks}]`));
    return heading;
  }

  setView(`
    <div class="exam-shell">
      <header class="exam-topbar">
        <div class="exam-identity">
          <img class="product-mark exam-mark" src="/app-icon-192.png" alt="" width="192" height="192">
          <div><p id="exam-subject" class="eyebrow"></p><h1 id="exam-title"></h1></div>
        </div>
        <div class="exam-phase-summary" aria-live="polite" aria-atomic="true">
          <strong id="exam-phase-label"></strong>
          <span id="exam-phase-tools"></span>
        </div>
        <nav class="exam-tools" aria-label="Examination tools">
          <button data-submit-exam class="submit-tool" type="button">Submit</button>
          <button id="flag-tool" type="button" aria-pressed="false">Flag</button>
          <button id="notepad-tool" type="button">Notepad</button>
          <details class="highlight-menu">
            <summary>Highlight</summary>
            <div class="highlight-palette" role="group" aria-label="Highlight colours">
              <p class="highlight-help">Select exam text, then choose a colour.</p>
              <button type="button" data-highlight="yellow"><span class="highlight-swatch" aria-hidden="true"></span><span>Yellow</span></button>
              <button type="button" data-highlight="blue"><span class="highlight-swatch" aria-hidden="true"></span><span>Blue</span></button>
              <button type="button" data-highlight="green"><span class="highlight-swatch" aria-hidden="true"></span><span>Green</span></button>
              <button type="button" data-highlight="purple"><span class="highlight-swatch" aria-hidden="true"></span><span>Purple</span></button>
              <button class="highlight-clear" type="button" data-clear-highlights>Clear all highlights</button>
            </div>
          </details>
          <button id="timer-tool" class="timer-tool" type="button"></button>
          <label class="language-tool"><span class="visually-hidden">Interface language</span><select aria-label="Interface language"><option>English</option></select></label>
          ${themeToggleMarkup()}
          <button id="accessibility-tool" type="button" aria-label="Accessibility settings">Accessibility</button>
        </nav>
      </header>

      <div id="phase-banner" class="reading-banner phase-banner" role="status" aria-live="polite" hidden>
        <strong id="phase-banner-title">Reading time</strong>
        <span id="phase-banner-copy">Review the materials and questions. Student entry areas will unlock automatically.</span>
      </div>

      <div class="exam-workspace">
        <section id="resource-pane" class="exam-pane resource-pane" aria-label="Examination resources">
          <header class="pane-heading"><h2 id="resource-title">Resources</h2><div class="pane-zoom" aria-label="Resource zoom"><button type="button" data-zoom="resource" data-direction="out" aria-label="Zoom resource out">−</button><button type="button" data-zoom="resource" data-direction="in" aria-label="Zoom resource in">+</button></div></header>
          <nav id="resource-tabs" class="resource-tabs" aria-label="Resources"></nav>
          <div id="resource-viewer" class="pane-scroll resource-viewer" tabindex="0"></div>
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
        <div class="save-recovery"><span id="save-status" class="save-status" role="status" aria-live="polite">Saved to server</span><div id="save-recovery-actions" hidden><button id="retry-save" type="button">Retry save</button><button id="download-recovery" type="button">Download recovery copy</button></div></div>
        <div class="exam-footer-actions">
          <button id="summary-tool" class="summary-action" type="button">View summary</button>
          <button data-submit-exam class="submit-action" type="button">Submit examination</button>
        </div>
      </footer>
      <p id="global-status" class="status-message exam-status" role="status" aria-live="polite" hidden></p>

      <dialog id="instructions-dialog" class="exam-dialog">
        <form method="dialog"><header><p class="eyebrow">Before you begin</p><h2>Instructions</h2></header><div id="instructions-copy" class="dialog-copy"></div><footer><button class="primary-action" value="continue">Continue to examination</button></footer></form>
      </dialog>
      <dialog id="notepad-dialog" class="exam-dialog compact-dialog">
        <form method="dialog"><header><p class="eyebrow">Candidate working area</p><h2>Notepad</h2><p>Notes are saved separately from answers and included in the teacher's PDF record.</p></header><label for="notepad" class="visually-hidden">Notes</label><textarea id="notepad" rows="12" spellcheck="false" autocorrect="off" autocapitalize="off" translate="no"></textarea><footer><button value="close">Close</button></footer></form>
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
  shell.dataset.phase = activePhase?.kind === "work" ? "writing" : activePhase?.kind ?? "transition";
  shell.dataset.phaseId = activePhase?.id ?? "transition";
  if (!activeResourceKey) shell.dataset.noResources = "true";
  document.querySelector("#exam-subject").textContent = `${paper.subjectLabel} · ${paper.level}`;
  document.querySelector("#exam-title").textContent = paper.title;
  document.querySelector("#paper-label").textContent = paper.paper;
  highlighter.decorate(document.querySelector("#instructions-copy"), "paper:instructions", paper.instructions);
  const notepad = document.querySelector("#notepad");
  notepad.value = draft.notepad;
  const audioController = createExamAudioController({
    sessionId,
    draftAudioPlays: draft.audioPlays,
    shell,
    signal,
    api,
    announce,
    formatTime,
    isLocked: responseLocked,
    onBusyChange(busy) {
      setResourceTabsLocked(busy);
      syncSubmitAvailability();
      if (!busy && pendingResourceSync) {
        pendingResourceSync = false;
        syncResourcesToQuestion(activeQuestionId);
      }
    },
  });

  function setResourceTabsLocked(locked) {
    document.querySelectorAll("#resource-tabs button").forEach((item) => { item.disabled = locked; });
  }

  function syncSubmitAvailability() {
    document.querySelectorAll("[data-submit-exam]").forEach((control) => {
      control.disabled = !finalSubmissionAvailable() || submitting || audioController.isBusy();
      control.title = finalSubmissionAvailable() ? "" : "Final submission opens in the last work section";
    });
  }

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
    if (!draftKey) return false;
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
      saveState.backedUp(true);
      return true;
    } catch {
      return false;
    }
  }

  function setSaveStatus(message, tone = "") {
    if (!shell.isConnected) return;
    const status = document.querySelector("#save-status");
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function showSaveState() {
    if (!shell.isConnected) return;
    const status = saveState.status();
    setSaveStatus(status.message, status.tone);
    document.querySelector("#save-recovery-actions").hidden = !saveState.pending;
  }

  function markDirty() {
    if (submitting || responseLocked()) return;
    dirty = true;
    saveState.edit();
    persistLocal();
    showSaveState();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 1_200);
  }

  async function saveNow() {
    if (saving) return saving;
    if (!dirty || submitting || responseLocked()) return;
    dirty = false;
    const sentRevision = saveState.revision;
    showSaveState();
    saving = api("/api/student/response", { method: "PUT", body: payload() })
      .then(({ savedAt, expired }) => {
        saveState.acknowledge(sentRevision);
        if (!saveState.pending) {
          draft.updatedAt = savedAt;
          removeLocalItem(draftKey);
        } else {
          // The server timestamp belongs to the older request, not the newer
          // draft. Keep recovery ordering correct if the page reloads now.
          persistLocal(Math.max(Date.now() + serverOffset, savedAt + 1));
        }
        showSaveState();
        if (expired) onSubmitted();
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 409) {
          persistLocal();
          saveState.fail(error.message);
          showSaveState();
          onSubmitted();
          return;
        }
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          dirty = false;
          persistLocal();
          saveState.fail(error.message);
          showSaveState();
          return;
        }
        dirty = true;
        persistLocal();
        saveState.fail("Server save failed");
        showSaveState();
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

  function availableResources() {
    return resourcesForExamContext(paper.resources, visibleQuestions(), activeQuestionId, activePhase, paper.mode);
  }

  function syncResourcesToQuestion(questionId) {
    if (audioController.isBusy()) {
      pendingResourceSync = true;
      return;
    }
    const available = availableResources();
    if (!available.some((resource) => resource.key === activeResourceKey)) {
      activeResourceKey = available[0]?.key ?? null;
    }
    renderResourceTabs();
    renderResource();
  }

  function updateFlagTool() {
    const tool = document.querySelector("#flag-tool");
    const flagged = activeQuestionId ? draft.flags.has(activeQuestionId) : false;
    tool.disabled = responseLocked() || !activeQuestionId;
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
    const label = questionHeading("h3", "question-label", question);
    const flag = button(draft.flags.has(question.id) ? "Flagged" : "Flag", "inline-flag", { "aria-pressed": String(draft.flags.has(question.id)) });
    flag.disabled = responseLocked();
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
    if (includePrompt) {
      const prompt = textBlock("p", "question-prompt", "");
      card.append(highlighter.decorate(prompt, `question:${question.id}:prompt`, question.prompt));
    }
    const locked = responseLocked();

    if (question.type === "essay") {
      if (locked) card.append(textBlock("p", "locked-response-preview", "Long-response area opens when reading time ends."));
      else card.append(makeEditor(question));
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
      input.disabled = locked;
      input.placeholder = locked ? "Answer area opens when reading time ends." : "";
      answerLabel.append(input);
      input.addEventListener("focus", () => setActiveQuestion(question.id), { signal: questionSignal });
      input.addEventListener("input", () => {
        draft.answers[question.id] = input.value;
        markDirty();
      }, { signal: questionSignal });
      card.append(answerLabel);
    } else if (question.type === "ink" && question.ink) {
      if (locked) card.append(textBlock("p", "locked-response-preview", "Drawing area opens when reading time ends."));
      else card.append(createInkResponse({
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
      for (const [choiceIndex, choice] of (question.options ?? []).entries()) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `answer-${question.id}`;
        input.value = choice;
        input.checked = draft.answers[question.id] === choice;
        input.disabled = locked;
        input.addEventListener("change", () => {
          setActiveQuestion(question.id);
          draft.answers[question.id] = choice;
          markDirty();
        }, { signal: questionSignal });
        const choiceText = document.createElement("span");
        highlighter.decorate(choiceText, `question:${question.id}:option:${choiceIndex}`, choice);
        label.append(input, choiceText);
        choices.append(label);
      }
      card.append(choices);
    }
    if (locked) card.append(textBlock("p", "reading-lock", phaseLockMessage(activePhase)));
    card.addEventListener("pointerdown", (event) => {
      if (event.target instanceof Element && event.target.closest(".ink-response")) return;
      setActiveQuestion(question.id);
    }, { signal: questionSignal });
    if (question.id === activeQuestionId) card.dataset.active = "";
    return card;
  }

  function renderEssayChoice() {
    const viewer = document.querySelector("#question-viewer");
    viewer.replaceChildren();
    const direction = paper.instructions.split(/\n/u)[0] || "Choose one question.";
    const intro = highlighter.decorate(textBlock("p", "exam-direction", ""), "paper:direction", direction);
    const choices = document.createElement("fieldset");
    choices.className = "essay-question-choices";
    choices.append(textBlock("legend", "visually-hidden", "Choose one question"));
    for (const question of visibleQuestions()) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "selected-question";
      input.value = question.id;
      input.checked = draft.selectedQuestionId === question.id;
      input.disabled = responseLocked();
      const number = questionHeading("strong", "", question);
      const prompt = document.createElement("span");
      prompt.className = "essay-choice-prompt";
      highlighter.decorate(prompt, `question:${question.id}:prompt`, question.prompt);
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
    const selected = visibleQuestions().find((question) => question.id === draft.selectedQuestionId);
    if (selected) viewer.append(makeQuestionCard(selected, false));
    else viewer.append(textBlock("p", "selection-empty", "Choose a question to open the writing area."));
    updateFlagTool();
  }

  function renderQuestionPanel() {
    beginQuestionRender();
    const questions = visibleQuestions();
    if (activePhase?.kind === "break" || questions.length === 0) {
      const viewer = document.querySelector("#question-viewer");
      const panel = textBlock("section", "exam-phase-lock", "");
      panel.append(
        textBlock("p", "eyebrow", activePhase?.label ?? "Phase transition"),
        textBlock("h3", "", activePhase?.kind === "break" ? "Examination paused for the monitored break" : "Please wait"),
        textBlock("p", "", phaseLockMessage(activePhase)),
      );
      viewer.replaceChildren(panel);
      activeQuestionId = null;
      updateFlagTool();
      return;
    }
    if (paper.selectionMode === "one" && paper.mode === "essay") {
      renderEssayChoice();
      return;
    }
    const viewer = document.querySelector("#question-viewer");
    viewer.replaceChildren();
    if (!questions.some((question) => question.id === activeQuestionId)) {
      activeQuestionId = questions[0]?.id ?? null;
      syncResourcesToQuestion(activeQuestionId);
    }
    for (const question of questions) viewer.append(makeQuestionCard(question));
    updateFlagTool();
  }

  function isYouTubeUrl(url) {
    return youtubeEmbedUrl(url) !== null;
  }

  function youtubeEmbedUrl(url) {
    if (typeof url !== "string") return null;
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;
    let id = null;
    if ((host === "youtube.com" || host === "m.youtube.com") && path === "/watch") {
      id = parsed.searchParams.get("v");
    } else if (host === "youtu.be") {
      id = path.split("/")[1] || null;
    } else if ((host === "youtube.com" || host === "m.youtube.com") && (path.startsWith("/shorts/") || path.startsWith("/embed/"))) {
      id = path.split("/")[2] || null;
    }
    if (!id || !/^[\w-]+$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
  }

  function renderResource() {
    const viewer = document.querySelector("#resource-viewer");
    if (activePhase?.kind === "break") {
      document.querySelector("#resource-title").textContent = "Monitored break";
      viewer.replaceChildren(textBlock("p", "exam-resource-lock", "Examination materials are hidden during the break."));
      return;
    }
    const resource = paper.resources.find((item) => item.key === activeResourceKey);
    document.querySelector("#resource-title").textContent = resource?.label ?? "Resources";
    if (!resource) {
      viewer.replaceChildren();
      return;
    }
    if (resource.kind === "audio") {
      const player = audioController.render(resource);
      if (viewer.childNodes.length !== 1 || viewer.firstChild !== player) viewer.replaceChildren(player);
    } else {
      viewer.replaceChildren();
    }
    if (resource.kind === "text") {
      const copy = document.createElement("article");
      copy.className = "resource-copy";
      copy.tabIndex = 0;
      renderResourceText(copy, resource.text, { decorate: highlighter.decorate, scope: `resource:${resource.key}`, label: resource.label });
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
    } else if (resource.kind === "video") {
      const embed = youtubeEmbedUrl(resource.url);
      const wrap = document.createElement("div");
      wrap.className = "resource-video";
      if (embed) {
        const frame = document.createElement("iframe");
        frame.src = embed;
        frame.title = resource.label || "Video";
        frame.allowFullscreen = true;
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        wrap.append(frame);
      } else {
        const media = document.createElement("video");
        media.controls = true;
        media.preload = "metadata";
        media.src = resource.url;
        media.title = resource.label || "Video";
        wrap.append(media);
      }
      const caption = document.createElement("p");
      caption.className = "resource-video-caption";
      caption.textContent = resource.label || "Video";
      wrap.append(caption);
      viewer.append(wrap);
    }
    document.querySelectorAll("#resource-tabs button").forEach((item) => {
      item.setAttribute("aria-current", item.dataset.resourceKey === activeResourceKey ? "page" : "false");
    });
  }

  function selectResource(key) {
    if (!availableResources().some((resource) => resource.key === key) || audioController.isBusy()) return;
    activeResourceKey = key;
    renderResource();
  }

  function renderResourceTabs() {
    const tabs = document.querySelector("#resource-tabs");
    tabs.replaceChildren();
    const available = availableResources();
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
      tab.title = resource.label;
      tab.disabled = audioController.isBusy();
      tab.addEventListener("click", () => selectResource(resource.key), { signal });
      tabs.append(tab);
    }
  }

  function renderSummary() {
    const list = document.querySelector("#summary-list");
    list.replaceChildren();
    let answered = 0;
    const currentIds = new Set(visibleQuestions().map(({ id }) => id));
    for (const question of paper.questions) {
      const status = questionStatus(question);
      if (status === "Answered") answered += 1;
      const row = button("", "summary-row");
      const identity = textBlock("span", "summary-question", question.label);
      const prompt = textBlock("span", "summary-prompt", question.prompt);
      const locked = !currentIds.has(question.id);
      const stateLabel = textBlock("span", "summary-state", `${locked ? "Locked section · " : ""}${draft.flags.has(question.id) ? "Flagged · " : ""}${status}`);
      stateLabel.dataset.status = status.toLowerCase().replaceAll(" ", "-");
      row.append(identity, prompt, stateLabel);
      row.disabled = locked;
      row.addEventListener("click", () => {
        if (locked) return;
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

  function openSubmitDialog() {
    if (!finalSubmissionAvailable()) {
      announce("Final submission opens in the last work section.", "error");
      return;
    }
    if (audioController.isBusy()) {
      announce("Wait for the current recording to finish before submitting.", "error");
      return;
    }
    const unanswered = paper.questions.filter((question) => questionStatus(question) !== "Answered").length;
    document.querySelector("#submit-warning").textContent = unanswered > 0
      ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} not complete. You cannot change your response after submission.`
      : "You cannot change your response after submission.";
    document.querySelector("#submit-dialog").showModal();
  }

  async function submit(auto = false) {
    if (submitting || (!auto && audioController.isBusy())) return;
    if (auto && audioController.isBusy()) audioController.stopForDeadline();
    submitting = true;
    shell.inert = true;
    shell.dataset.submitting = "true";
    syncSubmitAvailability();
    clearTimeout(saveTimer);
    setSaveStatus(auto ? "Time expired — submitting…" : "Submitting…");
    try {
      if (saving) await saving;
      const { submittedAt } = await api("/api/student/submit", { method: "POST", body: payload() });
      saveState.acknowledge(saveState.revision);
      dirty = false;
      removeLocalItem(draftKey);
      highlighter.discard();
      setSaveStatus(`Submitted ${new Date(submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, "saved");
      onSubmitted();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await onSubmitted();
        if (!shell.isConnected) return;
      }
      submitting = false;
      shell.inert = false;
      shell.dataset.submitting = "false";
      syncSubmitAvailability();
      persistLocal();
      saveState.fail("Submission failed");
      showSaveState();
      announce(error instanceof Error ? error.message : "Submission failed", "error");
    }
  }

  function cycleTimer() {
    timerMode = timerMode === "countdown" ? "countup" : timerMode === "countup" ? "hidden" : "countdown";
    writeLocalItem(timerKey, timerMode);
    tick();
  }

  function applyPhase(nextPhase, force = false) {
    const changed = nextPhase?.id !== activePhase?.id;
    if (!force && !changed) { activePhase = nextPhase; return; }
    if (changed && dirty && activePhase?.responseAllowed) void saveNow();
    activePhase = nextPhase;
    shell.dataset.phase = activePhase?.kind === "work" ? "writing" : activePhase?.kind ?? "transition";
    shell.dataset.phaseId = activePhase?.id ?? "transition";
    document.querySelector("#exam-phase-label").textContent = activePhase?.label ?? "Phase transition";
    document.querySelector("#exam-phase-tools").textContent = activePhase?.tools?.length
      ? activePhase.tools.join(" · ")
      : activePhase?.kind === "work" ? "Standard examination tools" : "Student entry locked";

    const banner = document.querySelector("#phase-banner");
    banner.hidden = !responseLocked();
    document.querySelector("#phase-banner-title").textContent = activePhase?.label ?? "Please wait";
    document.querySelector("#phase-banner-copy").textContent = phaseLockMessage(activePhase);
    document.querySelector(".exam-workspace").inert = activePhase?.kind === "break";
    document.querySelector("#notepad-tool").disabled = responseLocked();
    document.querySelector("#summary-tool").disabled = activePhase?.kind === "break" || visibleQuestions().length === 0;
    document.querySelectorAll("[data-highlight], [data-clear-highlights]").forEach((control) => {
      control.disabled = responseLocked();
    });
    syncSubmitAvailability();

    const questions = visibleQuestions();
    if (!questions.some(({ id }) => id === activeQuestionId)) {
      activeQuestionId = questions[0]?.id ?? null;
    }
    const available = resourcesForExamContext(paper.resources, questions, activeQuestionId, activePhase, paper.mode);
    if (!available.some(({ key }) => key === activeResourceKey)) activeResourceKey = available[0]?.key ?? null;
    renderResourceTabs();
    renderResource();
    renderQuestionPanel();
    if (changed) {
      announce(`${activePhase?.label ?? "Next phase"}. ${phaseLockMessage(activePhase)}`, "info");
    }
  }

  function tick() {
    const now = Date.now() + serverOffset;
    const nextPhase = phaseAtTime(state.session.timeline, now);
    if (nextPhase) applyPhase(nextPhase);
    const remaining = Math.max(0, Number(activePhase?.endsAt ?? state.session.deadline) - now);
    const elapsed = Math.max(0, now - Number(activePhase?.startsAt ?? state.session.startedAt));
    const timer = document.querySelector("#timer-tool");
    timer.dataset.warning = String(remaining <= 5 * 60_000 && remaining > 0);
    if (timerMode === "hidden") timer.textContent = "Timer hidden";
    else if (timerMode === "countup") timer.textContent = `${activePhase?.label ?? "Phase"} elapsed ${formatTime(elapsed)}`;
    else timer.textContent = `${activePhase?.label ?? "Time"} ${formatTime(remaining)}`;
    if (activePhase?.responseAllowed && dirty && remaining <= 5_000 && remaining > 0) void saveNow();
    if (now >= state.session.deadline && !expiredHandled) {
      expiredHandled = true;
      submit(true);
    }
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
  window.addEventListener("beforeunload", (event) => {
    if (saveState.pending) persistLocal();
    if (saveState.unsafe || audioController.isBusy()) {
      event.preventDefault();
      event.returnValue = "";
    }
  }, { signal });
  document.querySelector("#retry-save").addEventListener("click", () => {
    dirty = true;
    persistLocal();
    showSaveState();
    if (responseLocked()) announce("This section is locked. Keep the page open and ask your teacher for help.", "error");
    else void saveNow();
  }, { signal });
  document.querySelector("#download-recovery").addEventListener("click", () => {
    downloadResponseRecovery(recoveryPayload());
    announce("Recovery copy downloaded. This is not an exam submission; give the file to your teacher.", "info");
  }, { signal });
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
    openSubmitDialog();
  }, { signal });
  document.querySelectorAll("[data-submit-exam]").forEach((control) => control.addEventListener("click", openSubmitDialog, { signal }));
  document.querySelector("#confirm-submit").addEventListener("click", (event) => { event.preventDefault(); document.querySelector("#submit-dialog").close(); submit(false); }, { signal });
  const highlightMenu = document.querySelector(".highlight-menu");
  const highlightSummary = highlightMenu.querySelector("summary");
  document.querySelectorAll("[data-highlight]").forEach((control) => control.addEventListener("click", () => {
    if (highlighter.apply(control.dataset.highlight)) {
      highlightMenu.open = false;
      highlightSummary.focus();
    }
  }, { signal }));
  document.querySelector("[data-clear-highlights]").addEventListener("click", () => {
    if (highlighter.clearAll()) {
      highlightMenu.open = false;
      highlightSummary.focus();
    }
  }, { signal });
  document.querySelectorAll("[data-zoom]").forEach((control) => control.addEventListener("click", () => changeZoom(control.dataset.zoom ?? activePane, control.dataset.direction), { signal }));
  document.querySelectorAll("#accessibility-dialog select").forEach((select) => select.addEventListener("change", () => {
    preferences.textSize = document.querySelector("#text-size").value;
    preferences.scheme = document.querySelector("#colour-scheme").value;
    preferences.font = document.querySelector("#font-choice").value;
    preferences.spacing = document.querySelector("#spacing-choice").value;
    writeLocalItem(preferenceKey, JSON.stringify(preferences));
    applyPreferences();
  }, { signal }));

  applyPreferences();
  applyPhase(activePhase, true);
  bindSplitter();
  tick();
  tickTimer = setInterval(tick, 1_000);
  const autosaveTimer = setInterval(saveNow, 15_000);
  if (!readLocalItem(instructionKey)) {
    writeLocalItem(instructionKey, "seen");
    document.querySelector("#instructions-dialog").showModal();
  }
  if (dirty && !responseLocked()) {
    showSaveState();
    saveTimer = setTimeout(saveNow, 1_200);
  }

  const cleanup = () => {
    if (saveState.pending) persistLocal();
    clearTimeout(saveTimer);
    clearInterval(tickTimer);
    clearInterval(autosaveTimer);
    audioController.dispose();
    controller.abort();
  };
  function recoveryPayload() {
    return { format: "digitaldp-response-recovery", responseId, paperTitle: paper.title,
      exportedAt: new Date().toISOString(), ...payload() };
  }
  cleanup.pendingRecovery = () => saveState.pending ? recoveryPayload() : null;
  cleanup.updateState = (next) => {
    if (next.session.id !== sessionId || next.serverTime < state.serverTime) return;
    state = { ...state, session: next.session, serverTime: next.serverTime };
    serverOffset = next.serverTime - Date.now();
    // Keep the existing editors, ink, audio, focus and unsaved answers mounted.
    tick();
  };
  return cleanup;
}
