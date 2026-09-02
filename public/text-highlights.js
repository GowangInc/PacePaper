const HIGHLIGHT_COLORS = new Set(["blue", "green", "purple", "yellow"]);

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

function readHighlights(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) ?? "null");
    const highlights = Object.create(null);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [scope, html] of Object.entries(value)) if (typeof html === "string") highlights[scope] = html;
    }
    return highlights;
  } catch {
    return Object.create(null);
  }
}

function elementForNode(node) {
  return node instanceof Element ? node : node?.parentElement ?? null;
}

function targetForRange(range) {
  if (!range || range.collapsed) return null;
  const start = elementForNode(range.startContainer)?.closest("[data-highlight-scope]");
  const end = elementForNode(range.endContainer)?.closest("[data-highlight-scope]");
  return start && start === end ? start : null;
}

function unwrapMarks(target) {
  for (const mark of [...target.querySelectorAll("mark[data-color]")]) mark.replaceWith(...mark.childNodes);
  target.normalize();
}

export function createTextHighlighter({ storageKey, obsoleteStorageKey, signal, isLocked, announce }) {
  const storage = window.localStorage;
  const highlights = storageKey ? readHighlights(storage, storageKey) : Object.create(null);
  let savedRange = null;

  if (obsoleteStorageKey && obsoleteStorageKey !== storageKey) {
    try {
      storage.removeItem(obsoleteStorageKey);
    } catch {
      // Storage may be unavailable in a locked-down exam browser; highlighting still works for this page view.
    }
  }

  function persist() {
    if (!storageKey) return;
    try {
      storage.setItem(storageKey, JSON.stringify(highlights));
    } catch {
      // Keep the in-page marks usable even when browser storage is unavailable.
    }
  }

  function decorate(element, scope, text) {
    element.dataset.highlightScope = scope;
    const stored = highlights[scope];
    if (typeof stored !== "string") {
      element.textContent = text;
      return element;
    }

    element.innerHTML = safeHighlightHtml(stored);
    if (element.textContent !== text) {
      element.textContent = text;
      delete highlights[scope];
      persist();
    }
    return element;
  }

  function captureSelection() {
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    savedRange = targetForRange(range) ? range.cloneRange() : null;
  }

  function apply(color) {
    if (isLocked()) {
      announce("Highlighting opens when writing time starts", "error");
      return false;
    }
    if (!HIGHLIGHT_COLORS.has(color)) return false;

    const selection = getSelection();
    const liveRange = selection && selection.rangeCount > 0 && !selection.isCollapsed ? selection.getRangeAt(0) : null;
    if (liveRange && !targetForRange(liveRange)) {
      savedRange = null;
      announce("Select text in a question or reading passage, then choose a highlight colour", "error");
      return false;
    }
    const range = liveRange ? liveRange.cloneRange() : savedRange?.cloneRange();
    const target = targetForRange(range);
    if (!target?.isConnected) {
      announce("Select text in a question or reading passage, then choose a highlight colour", "error");
      return false;
    }

    const mark = document.createElement("mark");
    mark.dataset.color = color;
    mark.append(range.extractContents());
    range.insertNode(mark);
    selection?.removeAllRanges();
    savedRange = null;
    highlights[target.dataset.highlightScope] = target.innerHTML;
    persist();
    announce("Highlight added", "success");
    return true;
  }

  function clearAll() {
    if (isLocked()) {
      announce("Highlights cannot be changed during reading time", "error");
      return false;
    }
    document.querySelectorAll("[data-highlight-scope]").forEach(unwrapMarks);
    for (const scope of Object.keys(highlights)) delete highlights[scope];
    if (storageKey) {
      try {
        storage.removeItem(storageKey);
      } catch {
        // The visible highlights were still cleared.
      }
    }
    savedRange = null;
    announce("All highlights cleared", "success");
    return true;
  }

  function discard() {
    if (!storageKey) return;
    try {
      storage.removeItem(storageKey);
    } catch {
      // Submission must not fail because local storage is unavailable.
    }
  }

  document.addEventListener("selectionchange", captureSelection, { signal });
  return { apply, clearAll, decorate, discard };
}
