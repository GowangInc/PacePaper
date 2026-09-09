const PAGE_WIDTH = 10_000;
const PAGE_HEIGHT = 7_500;
const STROKE_WIDTH_UNIT = 12;
const MAX_INK_PAGES = 12;
const MAX_ANSWER_BYTES = 900_000;
const MAX_STROKES_PER_PAGE = 500;
const MAX_POINTS_PER_STROKE = 2_500;
const MAX_TOTAL_POINTS = 50_000;
const POINT_COMPACT_AT = 2_000;
const TOTAL_COMPACT_AT = 45_000;
const MIN_POINT_DISTANCE = 18;
const START_STROKE_DISTANCE = MIN_POINT_DISTANCE * 2;
const ERASER_RADIUS_PX = 20;
const BACKGROUND_OPTIONS = [
  { value: "blank", label: "Blank" },
  { value: "lined", label: "Ruled" },
  { value: "square-grid", label: "Square grid" },
];
let responseSequence = 0;
const textEncoder = new TextEncoder();

function backgroundLabel(value) {
  return BACKGROUND_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function resolveInkBackgroundChange(teacherDefault, current, requested) {
  if (requested === current) return { type: "unchanged", background: current };
  if (requested === teacherDefault) return { type: "restore", background: teacherDefault };
  return { type: "confirm", background: current, requestedBackground: requested };
}

function blankPage() {
  return { strokes: [] };
}

function blankAnswer(settings) {
  return {
    version: 1,
    pages: Array.from({ length: settings.pages }, blankPage),
    background: settings.background,
    typed: "",
  };
}

function validPoint(value) {
  return Array.isArray(value)
    && value.length >= 2
    && value.length <= 3
    && Number.isInteger(value[0])
    && value[0] >= 0
    && value[0] <= PAGE_WIDTH
    && Number.isInteger(value[1])
    && value[1] >= 0
    && value[1] <= PAGE_HEIGHT
    && (value[2] === undefined || (Number.isInteger(value[2]) && value[2] >= 0 && value[2] <= 1_000));
}

function cloneStroke(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Number.isInteger(value.width) || value.width < 1 || value.width > 12) {
    throw new Error("Invalid stroke");
  }
  if (
    !Array.isArray(value.points)
    || value.points.length === 0
    || value.points.length > MAX_POINTS_PER_STROKE
    || !value.points.every(validPoint)
  ) {
    throw new Error("Invalid stroke points");
  }
  return {
    width: value.width,
    points: value.points.map((point) => [point[0], point[1], point[2] ?? 500]),
  };
}

export function parseInkResponse(value, settings) {
  if (!value) return { ok: true, answer: blankAnswer(settings) };
  try {
    if (typeof value !== "string" || textEncoder.encode(value).byteLength > MAX_ANSWER_BYTES) {
      throw new Error("Invalid response size");
    }
    const answer = JSON.parse(value);
    if (!answer || typeof answer !== "object" || Array.isArray(answer) || answer.version !== 1) {
      throw new Error("Unsupported response version");
    }
    if (!Array.isArray(answer.pages) || answer.pages.length === 0 || answer.pages.length > MAX_INK_PAGES) {
      throw new Error("Invalid response pages");
    }
    const pages = answer.pages.map((page) => {
      if (
        !page
        || typeof page !== "object"
        || Array.isArray(page)
        || !Array.isArray(page.strokes)
        || page.strokes.length > MAX_STROKES_PER_PAGE
      ) {
        throw new Error("Invalid response page");
      }
      return { strokes: page.strokes.map(cloneStroke) };
    });
    while (pages.length < settings.pages) pages.push(blankPage());
    const background = answer.background === undefined ? settings.background : answer.background;
    if (!BACKGROUND_OPTIONS.some((option) => option.value === background)) throw new Error("Invalid response background");
    if (answer.typed !== undefined && (typeof answer.typed !== "string" || answer.typed.length > 20_000)) {
      throw new Error("Invalid typed working");
    }
    const normalized = {
      version: 1,
      pages,
      background,
      typed: answer.typed ?? "",
    };
    if (pointCount(normalized) > MAX_TOTAL_POINTS) throw new Error("Invalid response points");
    return { ok: true, answer: normalized };
  } catch {
    return { ok: false, raw: typeof value === "string" ? value : String(value) };
  }
}

function serialize(answer) {
  return JSON.stringify(answer);
}

function answerHasContent(answer) {
  return answer.typed.trim().length > 0 || answer.pages.some((page) => page.strokes.length > 0);
}

export function hasInkResponse(value, settings) {
  const parsed = parseInkResponse(value, settings);
  return parsed.ok && answerHasContent(parsed.answer);
}

function pointCount(answer) {
  return answer.pages.reduce(
    (total, page) => total + page.strokes.reduce((pageTotal, stroke) => pageTotal + stroke.points.length, 0),
    0,
  );
}

function decimateStroke(stroke) {
  if (stroke.points.length <= 2) return 0;
  const previousLength = stroke.points.length;
  const lastIndex = previousLength - 1;
  stroke.points = stroke.points.filter((_, index) => index === 0 || index === lastIndex || index % 2 === 0);
  return previousLength - stroke.points.length;
}

function compactDetailedStrokes(answer) {
  let removed = 0;
  for (const page of answer.pages) {
    for (const stroke of page.strokes) removed += decimateStroke(stroke);
  }
  return removed;
}

function answerLimits(answer) {
  return {
    bytes: textEncoder.encode(serialize(answer)).byteLength,
    points: pointCount(answer),
    longestStroke: Math.max(0, ...answer.pages.flatMap((page) => page.strokes.map((stroke) => stroke.points.length))),
  };
}

export function fitInkAnswerToLimits(answer) {
  let compacted = false;
  for (let pass = 0; pass < 16; pass += 1) {
    const limits = answerLimits(answer);
    if (
      limits.bytes <= MAX_ANSWER_BYTES
      && limits.points <= MAX_TOTAL_POINTS
      && limits.longestStroke <= MAX_POINTS_PER_STROKE
    ) {
      return { ok: true, compacted, ...limits };
    }
    if (compactDetailedStrokes(answer) === 0) return { ok: false, compacted, ...limits };
    compacted = true;
  }
  return { ok: false, compacted, ...answerLimits(answer) };
}

function squaredDistanceToSegment(point, start, end) {
  const segmentX = end[0] - start[0];
  const segmentY = end[1] - start[1];
  const lengthSquared = segmentX ** 2 + segmentY ** 2;
  if (lengthSquared === 0) return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2;
  const projection = Math.max(0, Math.min(1,
    ((point[0] - start[0]) * segmentX + (point[1] - start[1]) * segmentY) / lengthSquared,
  ));
  const closestX = start[0] + projection * segmentX;
  const closestY = start[1] + projection * segmentY;
  return (point[0] - closestX) ** 2 + (point[1] - closestY) ** 2;
}

export function strokeIntersectsEraser(stroke, point, radius) {
  const threshold = radius + stroke.width * STROKE_WIDTH_UNIT / 2;
  const thresholdSquared = threshold ** 2;
  if (stroke.points.length === 1) {
    return squaredDistanceToSegment(point, stroke.points[0], stroke.points[0]) <= thresholdSquared;
  }
  for (let index = 1; index < stroke.points.length; index += 1) {
    if (squaredDistanceToSegment(point, stroke.points[index - 1], stroke.points[index]) <= thresholdSquared) {
      return true;
    }
  }
  return false;
}

export function eraseStrokesAtPoint(strokes, point, radius) {
  const removed = [];
  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    if (!strokeIntersectsEraser(strokes[index], point, radius)) continue;
    removed.push({ index, stroke: strokes[index] });
    strokes.splice(index, 1);
  }
  return removed;
}

export function applyInkHistoryAction(strokes, action, direction) {
  if (action.type === "draw") {
    if (direction === "undo") {
      const index = strokes.indexOf(action.stroke);
      if (index < 0) return 0;
      strokes.splice(index, 1);
      return -action.stroke.points.length;
    }
    strokes.splice(Math.min(action.index, strokes.length), 0, action.stroke);
    return action.stroke.points.length;
  }

  if (direction === "undo") {
    let restoredPoints = 0;
    for (const entry of [...action.removed].reverse()) {
      strokes.splice(Math.min(entry.index, strokes.length), 0, entry.stroke);
      restoredPoints += entry.stroke.points.length;
    }
    return restoredPoints;
  }

  let erasedPoints = 0;
  for (const entry of action.removed) {
    const index = strokes.indexOf(entry.stroke);
    if (index < 0) continue;
    strokes.splice(index, 1);
    erasedPoints += entry.stroke.points.length;
  }
  return -erasedPoints;
}

export function inkPointerStartMode(event, selectedTool = "draw") {
  if (event.isPrimary === false) return null;
  const penEraser = event.pointerType === "pen" && (event.button === 5 || (event.buttons & 32) !== 0);
  if (penEraser) return "erase";
  if (event.button !== 0) return null;
  return selectedTool;
}

export function snapshotInkCanvasGeometry(bounds) {
  const coordinate = (value, fallback) => Number.isFinite(value) ? value : fallback;
  return {
    left: coordinate(bounds?.left, 0),
    top: coordinate(bounds?.top, 0),
    width: Math.max(1, coordinate(bounds?.width, 1)),
    height: Math.max(1, coordinate(bounds?.height, 1)),
  };
}

export function inkPointFromEvent(event, geometry) {
  const pressure = Number.isFinite(event.pressure) && event.pressure > 0 ? event.pressure : 0.5;
  return [
    Math.round(Math.max(0, Math.min(1, (event.clientX - geometry.left) / geometry.width)) * PAGE_WIDTH),
    Math.round(Math.max(0, Math.min(1, (event.clientY - geometry.top) / geometry.height)) * PAGE_HEIGHT),
    Math.round(Math.max(0, Math.min(1, pressure)) * 1_000),
  ];
}

export function isIntentionalInkMovement(start, next) {
  return Math.hypot(next[0] - start[0], next[1] - start[1]) >= START_STROKE_DISTANCE;
}

function strokePath(stroke) {
  return stroke.points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");
}

function drawStroke(context, stroke, scaleX, scaleY) {
  const first = stroke.points[0];
  if (!first) return;
  context.beginPath();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.width * STROKE_WIDTH_UNIT * Math.min(scaleX, scaleY);
  context.strokeStyle = "#172033";
  if (stroke.points.length === 1) {
    context.arc(first[0] * scaleX, first[1] * scaleY, context.lineWidth / 2, 0, Math.PI * 2);
    context.fillStyle = context.strokeStyle;
    context.fill();
    return;
  }
  context.moveTo(first[0] * scaleX, first[1] * scaleY);
  for (const point of stroke.points.slice(1)) context.lineTo(point[0] * scaleX, point[1] * scaleY);
  context.stroke();
}

function createRecoveryNotice(raw, label) {
  const root = document.createElement("section");
  root.className = "ink-response ink-recovery";
  root.setAttribute("role", "alert");
  const heading = document.createElement("h4");
  heading.textContent = "Handwritten work needs recovery";
  const copy = document.createElement("p");
  copy.textContent = "This saved response could not be opened, so PacePaper has left its original data unchanged. Ask your teacher for help before continuing.";
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Show recovery data";
  const recoveryLabel = document.createElement("label");
  recoveryLabel.textContent = `Recovery data for ${label}`;
  const recovery = document.createElement("textarea");
  recovery.readOnly = true;
  recovery.rows = 5;
  recovery.value = raw;
  recovery.spellcheck = false;
  recoveryLabel.append(recovery);
  details.append(summary, recoveryLabel);
  root.append(heading, copy, details);
  return root;
}

export function createInkResponse({ value, settings, label, onChange, signal }) {
  const parsed = parseInkResponse(value, settings);
  if (!parsed.ok) return createRecoveryNotice(parsed.raw, label);
  const answer = parsed.answer;
  const undoActions = answer.pages.map((page) => page.strokes.map((stroke, index) => ({ type: "draw", stroke, index })));
  const redoActions = answer.pages.map(() => []);
  let totalPoints = pointCount(answer);
  const responseId = `ink-response-${++responseSequence}`;
  let activePage = 0;
  let activePointer = null;
  let activePageIndex = null;
  let activeMode = null;
  let activeStroke = null;
  let activeEraseAction = null;
  let activeEraserPoint = null;
  let activeGeometry = null;
  let activeStartPoint = null;
  let activeStrokeWidth = null;
  let selectedTool = "draw";

  const root = document.createElement("section");
  root.className = "ink-response";
  const toolbar = document.createElement("div");
  toolbar.className = "ink-toolbar";

  const pageControls = document.createElement("div");
  pageControls.className = "ink-page-controls";
  const pageTabs = document.createElement("nav");
  pageTabs.className = "ink-page-tabs";
  pageTabs.setAttribute("aria-label", "Working pages");
  const addPage = document.createElement("button");
  addPage.type = "button";
  addPage.className = "ink-add-page";
  addPage.textContent = "Add page";
  const pageStatus = document.createElement("output");
  pageStatus.className = "ink-page-status";
  pageStatus.id = `${responseId}-page-status`;
  pageStatus.setAttribute("aria-live", "polite");
  addPage.setAttribute("aria-describedby", pageStatus.id);
  pageControls.append(pageTabs, addPage, pageStatus);

  const inputTools = document.createElement("div");
  inputTools.className = "ink-input-tools";
  inputTools.setAttribute("role", "group");
  inputTools.setAttribute("aria-label", `Ink tool for ${label}`);
  const drawTool = document.createElement("button");
  drawTool.type = "button";
  drawTool.className = "ink-tool-button";
  drawTool.dataset.tool = "draw";
  drawTool.textContent = "Draw";
  drawTool.setAttribute("aria-pressed", "true");
  const eraserTool = document.createElement("button");
  eraserTool.type = "button";
  eraserTool.className = "ink-tool-button";
  eraserTool.dataset.tool = "erase";
  eraserTool.textContent = "Eraser";
  eraserTool.setAttribute("aria-pressed", "false");
  const toolStatus = document.createElement("output");
  toolStatus.className = "ink-tool-status";
  toolStatus.value = "Current tool: Draw";
  inputTools.append(drawTool, eraserTool, toolStatus);

  const editTools = document.createElement("div");
  editTools.className = "ink-edit-tools";
  editTools.setAttribute("role", "group");
  editTools.setAttribute("aria-label", `Drawing tools for ${label}`);
  const undo = document.createElement("button");
  undo.type = "button";
  undo.textContent = "Undo";
  const redo = document.createElement("button");
  redo.type = "button";
  redo.textContent = "Redo";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear page";
  editTools.append(undo, redo, clear);
  toolbar.append(pageControls, inputTools, editTools);

  const surface = document.createElement("div");
  surface.className = "ink-surface";
  surface.dataset.background = answer.background;
  surface.dataset.tool = selectedTool;
  const backgroundPicker = document.createElement("fieldset");
  backgroundPicker.className = "ink-background-picker";
  const backgroundLegend = document.createElement("legend");
  backgroundLegend.textContent = "Canvas background";
  const backgroundDefault = document.createElement("p");
  backgroundDefault.className = "ink-background-default";
  backgroundDefault.textContent = `Teacher default: ${backgroundLabel(settings.background)}.`;
  const backgroundOptions = document.createElement("div");
  backgroundOptions.className = "ink-background-options";
  const backgroundOverride = document.createElement("div");
  backgroundOverride.className = "ink-background-override";
  const backgroundOverrideCopy = document.createElement("p");
  const restoreBackground = document.createElement("button");
  restoreBackground.type = "button";
  restoreBackground.textContent = "Restore teacher default";
  backgroundOverride.append(backgroundOverrideCopy, restoreBackground);
  backgroundPicker.append(backgroundLegend, backgroundDefault, backgroundOptions, backgroundOverride);
  const backgroundInputs = [];
  for (const option of BACKGROUND_OPTIONS) {
    const optionId = `${responseId}-background-${option.value}`;
    const optionLabel = document.createElement("label");
    optionLabel.htmlFor = optionId;
    const input = document.createElement("input");
    input.id = optionId;
    input.type = "radio";
    input.name = `${responseId}-background`;
    input.value = option.value;
    input.checked = answer.background === option.value;
    const optionText = document.createElement("span");
    optionText.textContent = option.label;
    optionLabel.append(input, optionText);
    backgroundInputs.push(input);
    backgroundOptions.append(optionLabel);
  }
  const canvasHint = document.createElement("p");
  canvasHint.id = `${responseId}-hint`;
  canvasHint.className = "ink-canvas-hint";
  canvasHint.textContent = "Choose Draw or Eraser, then press and drag with a pen, touch, or mouse. Changing the background or page never removes your work.";
  const workspaceStatus = document.createElement("p");
  workspaceStatus.className = "ink-workspace-status";
  workspaceStatus.setAttribute("role", "status");
  workspaceStatus.setAttribute("aria-live", "polite");
  workspaceStatus.hidden = true;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", `${label} handwriting surface`);
  canvas.setAttribute("aria-describedby", canvasHint.id);
  canvas.setAttribute("role", "img");
  surface.append(canvas);

  function selectTool(tool) {
    selectedTool = tool;
    surface.dataset.tool = tool;
    drawTool.setAttribute("aria-pressed", String(tool === "draw"));
    eraserTool.setAttribute("aria-pressed", String(tool === "erase"));
    toolStatus.value = `Current tool: ${tool === "draw" ? "Draw" : "Eraser"}`;
  }

  drawTool.addEventListener("click", () => selectTool("draw"), { signal });
  eraserTool.addEventListener("click", () => selectTool("erase"), { signal });

  const clearDialog = document.createElement("dialog");
  clearDialog.className = "exam-dialog compact-dialog ink-clear-dialog";
  const clearForm = document.createElement("form");
  clearForm.method = "dialog";
  const clearHeading = document.createElement("h3");
  clearHeading.textContent = "Clear this working page?";
  const clearCopy = document.createElement("p");
  clearCopy.textContent = "Every handwritten stroke on this page will be removed.";
  const clearFooter = document.createElement("footer");
  const cancelClear = document.createElement("button");
  cancelClear.value = "cancel";
  cancelClear.textContent = "Keep working";
  const confirmClear = document.createElement("button");
  confirmClear.type = "button";
  confirmClear.className = "danger-action";
  confirmClear.textContent = "Clear page";
  clearFooter.append(cancelClear, confirmClear);
  clearForm.append(clearHeading, clearCopy, clearFooter);
  clearDialog.append(clearForm);

  const backgroundDialog = document.createElement("dialog");
  backgroundDialog.className = "exam-dialog compact-dialog ink-background-dialog";
  const backgroundForm = document.createElement("form");
  backgroundForm.method = "dialog";
  const backgroundHeading = document.createElement("h3");
  backgroundHeading.id = `${responseId}-background-dialog-heading`;
  backgroundDialog.setAttribute("aria-labelledby", backgroundHeading.id);
  const backgroundCopy = document.createElement("p");
  const backgroundFooter = document.createElement("footer");
  const cancelBackground = document.createElement("button");
  cancelBackground.value = "cancel";
  cancelBackground.autofocus = true;
  const confirmBackground = document.createElement("button");
  confirmBackground.value = "confirm";
  backgroundFooter.append(cancelBackground, confirmBackground);
  backgroundForm.append(backgroundHeading, backgroundCopy, backgroundFooter);
  backgroundDialog.append(backgroundForm);
  let pendingBackground = null;

  function setWorkspaceStatus(message = "", tone = "info") {
    workspaceStatus.textContent = message;
    workspaceStatus.dataset.tone = tone;
    workspaceStatus.hidden = !message;
  }

  function emitChange() {
    const fitted = fitInkAnswerToLimits(answer);
    totalPoints = fitted.points;
    if (!fitted.ok) {
      setWorkspaceStatus("This working space is full. Continue in the typed working area so your response remains safely saved.", "warning");
      return;
    }
    if (fitted.compacted) {
      draw();
      setWorkspaceStatus("Handwriting was optimized to keep the response safely saved.");
    }
    onChange(serialize(answer));
  }

  function syncBackgroundControls() {
    surface.dataset.background = answer.background;
    backgroundInputs.forEach((input) => { input.checked = input.value === answer.background; });
    const overridden = answer.background !== settings.background;
    backgroundOverride.hidden = !overridden;
    if (overridden) {
      backgroundOverrideCopy.textContent = `Using ${backgroundLabel(answer.background)}. Teacher default: ${backgroundLabel(settings.background)}.`;
    }
  }

  function saveBackground(background) {
    answer.background = background;
    syncBackgroundControls();
    emitChange();
  }

  function requestBackgroundChange(requestedBackground) {
    const transition = resolveInkBackgroundChange(settings.background, answer.background, requestedBackground);
    if (transition.type === "unchanged") {
      syncBackgroundControls();
      return;
    }
    if (transition.type === "restore") {
      saveBackground(transition.background);
      return;
    }
    pendingBackground = transition.requestedBackground;
    backgroundHeading.textContent = `Change canvas background to ${backgroundLabel(pendingBackground)}?`;
    backgroundCopy.textContent = `Your teacher chose ${backgroundLabel(settings.background)}. Use ${backgroundLabel(pendingBackground)} for all working pages in this question? Your writing will be retained.`;
    cancelBackground.textContent = `Keep ${backgroundLabel(answer.background)}`;
    confirmBackground.textContent = `Use ${backgroundLabel(pendingBackground)}`;
    syncBackgroundControls();
    backgroundDialog.returnValue = "";
    backgroundDialog.showModal();
  }

  for (const input of backgroundInputs) {
    input.addEventListener("change", () => {
      if (input.checked) requestBackgroundChange(input.value);
    }, { signal });
  }
  restoreBackground.addEventListener("click", () => saveBackground(settings.background), { signal });
  backgroundDialog.addEventListener("close", () => {
    const confirmedBackground = backgroundDialog.returnValue === "confirm" ? pendingBackground : null;
    pendingBackground = null;
    if (confirmedBackground) saveBackground(confirmedBackground);
    else syncBackgroundControls();
  }, { signal });

  function page() {
    return answer.pages[activePage];
  }

  function updateControls() {
    undo.disabled = undoActions[activePage].length === 0;
    redo.disabled = redoActions[activePage].length === 0;
    clear.disabled = page().strokes.length === 0;
    addPage.disabled = answer.pages.length >= MAX_INK_PAGES;
    addPage.title = addPage.disabled ? `Maximum ${MAX_INK_PAGES} pages reached` : "Add another working page";
    pageStatus.value = addPage.disabled
      ? `Page ${activePage + 1} of ${answer.pages.length}. Maximum ${MAX_INK_PAGES} pages reached.`
      : `Page ${activePage + 1} of ${answer.pages.length}`;
    [...pageTabs.children].forEach((item, index) => {
      if (index === activePage) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  function draw() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    const scaleX = width / PAGE_WIDTH;
    const scaleY = height / PAGE_HEIGHT;
    for (const stroke of page().strokes) drawStroke(context, stroke, scaleX, scaleY);
    updateControls();
  }

  function selectPage(index) {
    if (activePointer !== null || index < 0 || index >= answer.pages.length) return;
    activePage = index;
    setWorkspaceStatus();
    draw();
    pageTabs.children[index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function appendPageButton(index) {
    const pageButton = document.createElement("button");
    pageButton.type = "button";
    pageButton.textContent = `Page ${index + 1}`;
    pageButton.addEventListener("click", () => selectPage(index), { signal });
    pageTabs.append(pageButton);
  }

  function addWorkingPage() {
    if (answer.pages.length >= MAX_INK_PAGES) {
      setWorkspaceStatus(`The maximum of ${MAX_INK_PAGES} working pages has been reached.`, "warning");
      return;
    }
    answer.pages.push(blankPage());
    undoActions.push([]);
    redoActions.push([]);
    activePage = answer.pages.length - 1;
    appendPageButton(activePage);
    draw();
    setWorkspaceStatus(`Working page ${activePage + 1} added.`);
    emitChange();
    pageTabs.children[activePage]?.focus();
  }

  answer.pages.forEach((_, index) => appendPageButton(index));
  addPage.addEventListener("click", addWorkingPage, { signal });
  pageTabs.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...pageTabs.querySelectorAll("button")];
    const focusedIndex = buttons.indexOf(event.target);
    if (focusedIndex < 0) return;
    event.preventDefault();
    let nextIndex = focusedIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else nextIndex = (focusedIndex + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    selectPage(nextIndex);
    buttons[nextIndex].focus();
  }, { signal });

  function logicalEraserRadius() {
    return ERASER_RADIUS_PX * Math.max(
      PAGE_WIDTH / activeGeometry.width,
      PAGE_HEIGHT / activeGeometry.height,
    );
  }

  function appendPoint(next) {
    if (!activeStroke) return;
    const previous = activeStroke.points.at(-1);
    if (previous && Math.hypot(next[0] - previous[0], next[1] - previous[1]) < MIN_POINT_DISTANCE) return;

    if (activeStroke.points.length >= POINT_COMPACT_AT) {
      totalPoints -= decimateStroke(activeStroke);
    }
    if (totalPoints >= TOTAL_COMPACT_AT) {
      const removed = compactDetailedStrokes(answer);
      totalPoints -= removed;
      if (removed > 0) setWorkspaceStatus("Handwriting was optimized to keep the response safely saved.");
    }
    if (totalPoints >= MAX_TOTAL_POINTS || activeStroke.points.length >= MAX_POINTS_PER_STROKE) {
      activeStroke.points[activeStroke.points.length - 1] = next;
      setWorkspaceStatus("This working space has reached its handwriting limit. Add a page or continue in typed working.", "warning");
      return;
    }
    activeStroke.points.push(next);
    totalPoints += 1;
  }

  function drawToward(event) {
    const next = inkPointFromEvent(event, activeGeometry);
    if (!activeStroke) {
      if (!isIntentionalInkMovement(activeStartPoint, next)) return;
      activeStroke = { width: activeStrokeWidth, points: [activeStartPoint] };
      answer.pages[activePageIndex].strokes.push(activeStroke);
      totalPoints += 1;
    }
    appendPoint(next);
  }

  function eraseToward(event) {
    if (!activeEraseAction || activePageIndex === null) return;
    const next = inkPointFromEvent(event, activeGeometry);
    const radius = logicalEraserRadius();
    const previous = activeEraserPoint ?? next;
    const distance = Math.hypot(next[0] - previous[0], next[1] - previous[1]);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.75)));
    const strokes = answer.pages[activePageIndex].strokes;
    for (let step = 1; step <= steps; step += 1) {
      const amount = step / steps;
      const point = [
        Math.round(previous[0] + (next[0] - previous[0]) * amount),
        Math.round(previous[1] + (next[1] - previous[1]) * amount),
      ];
      const removed = eraseStrokesAtPoint(strokes, point, radius);
      activeEraseAction.removed.push(...removed);
      totalPoints -= removed.reduce((sum, entry) => sum + entry.stroke.points.length, 0);
    }
    activeEraserPoint = next;
  }

  canvas.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    if (activePointer !== null) return;
    const mode = inkPointerStartMode(event, selectedTool);
    if (!mode) return;
    if (mode === "draw" && page().strokes.length >= MAX_STROKES_PER_PAGE) {
      setWorkspaceStatus("This page is full. Add another page or continue in typed working.", "warning");
      return;
    }
    event.preventDefault();
    setWorkspaceStatus();
    activePointer = event.pointerId;
    activePageIndex = activePage;
    activeMode = mode;
    activeGeometry = snapshotInkCanvasGeometry(canvas.getBoundingClientRect());
    canvas.setPointerCapture(event.pointerId);
    if (mode === "draw") {
      activeStartPoint = inkPointFromEvent(event, activeGeometry);
      activeStrokeWidth = event.pointerType === "pen" ? 3 : 4;
    } else {
      activeEraseAction = { type: "erase", removed: [] };
      activeEraserPoint = null;
      eraseToward(event);
    }
    draw();
  }, { signal });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer) return;
    event.preventDefault();
    const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    for (const item of events) {
      if (activeMode === "draw") drawToward(item);
      else eraseToward(item);
    }
    draw();
  }, { signal });

  const finishGesture = (event) => {
    if (event.pointerId !== activePointer) return;
    if (event.type !== "pointercancel") {
      if (activeMode === "draw") drawToward(event);
      else eraseToward(event);
    }
    const finishedPage = activePageIndex;
    let action = null;
    if (activeMode === "draw" && activeStroke && finishedPage !== null) {
      action = {
        type: "draw",
        stroke: activeStroke,
        index: answer.pages[finishedPage].strokes.indexOf(activeStroke),
      };
    } else if (activeEraseAction?.removed.length) {
      action = activeEraseAction;
      setWorkspaceStatus(`${action.removed.length} stroke${action.removed.length === 1 ? "" : "s"} erased.`);
    }
    if (action && finishedPage !== null) {
      undoActions[finishedPage].push(action);
      redoActions[finishedPage] = [];
    }
    activePointer = null;
    activePageIndex = null;
    activeMode = null;
    activeStroke = null;
    activeEraseAction = null;
    activeEraserPoint = null;
    activeGeometry = null;
    activeStartPoint = null;
    activeStrokeWidth = null;
    draw();
    if (action) emitChange();
  };
  canvas.addEventListener("pointerup", finishGesture, { signal });
  canvas.addEventListener("pointercancel", finishGesture, { signal });

  undo.addEventListener("click", () => {
    const action = undoActions[activePage].pop();
    if (action) {
      totalPoints += applyInkHistoryAction(page().strokes, action, "undo");
      redoActions[activePage].push(action);
    }
    setWorkspaceStatus();
    draw();
    emitChange();
  }, { signal });
  redo.addEventListener("click", () => {
    const action = redoActions[activePage].pop();
    if (action) {
      totalPoints += applyInkHistoryAction(page().strokes, action, "redo");
      undoActions[activePage].push(action);
    }
    setWorkspaceStatus();
    draw();
    emitChange();
  }, { signal });
  clear.addEventListener("click", () => clearDialog.showModal(), { signal });
  confirmClear.addEventListener("click", () => {
    totalPoints -= page().strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
    page().strokes = [];
    undoActions[activePage] = [];
    redoActions[activePage] = [];
    clearDialog.close();
    setWorkspaceStatus("Working page cleared.");
    draw();
    emitChange();
  }, { signal });

  syncBackgroundControls();
  root.append(toolbar, backgroundPicker, canvasHint, workspaceStatus, surface);
  const typed = document.createElement("details");
  typed.className = "ink-typed-alternative";
  typed.open = Boolean(answer.typed.trim());
  const summary = document.createElement("summary");
  summary.textContent = "Type working instead";
  const typedLabel = document.createElement("label");
  typedLabel.textContent = "Typed working (alternative to drawing)";
  const textarea = document.createElement("textarea");
  textarea.rows = 5;
  textarea.maxLength = 20_000;
  textarea.value = answer.typed;
  textarea.spellcheck = false;
  typedLabel.append(textarea);
  typed.append(summary, typedLabel);
  textarea.addEventListener("input", () => {
    answer.typed = textarea.value;
    emitChange();
  }, { signal });
  root.append(typed);
  root.append(clearDialog, backgroundDialog);

  const resizeObserver = new ResizeObserver(draw);
  resizeObserver.observe(surface);
  signal.addEventListener("abort", () => resizeObserver.disconnect(), { once: true });
  requestAnimationFrame(draw);
  return root;
}

export function renderInkSubmission(value, settings) {
  const parsed = parseInkResponse(value, settings);
  const wrapper = document.createElement("div");
  wrapper.className = "ink-submission";
  if (!parsed.ok) {
    wrapper.classList.add("ink-submission-recovery");
    wrapper.setAttribute("role", "alert");
    wrapper.textContent = "This handwritten response could not be displayed. Its original saved data has been retained for recovery.";
    return wrapper;
  }
  const answer = parsed.answer;
  if (!answerHasContent(answer)) {
    wrapper.classList.add("empty-state");
    wrapper.textContent = "No response";
    return wrapper;
  }

  answer.pages.forEach((page, index) => {
    if (page.strokes.length === 0) return;
    const figure = document.createElement("figure");
    figure.className = "ink-submission-page";
    figure.dataset.background = answer.background;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Handwritten working, page ${index + 1}`);
    for (const stroke of page.strokes) {
      if (stroke.points.length === 1) {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", String(stroke.points[0][0]));
        dot.setAttribute("cy", String(stroke.points[0][1]));
        dot.setAttribute("r", String(stroke.width * STROKE_WIDTH_UNIT / 2));
        dot.setAttribute("fill", "#172033");
        svg.append(dot);
      } else {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", strokePath(stroke));
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#172033");
        path.setAttribute("stroke-width", String(stroke.width * STROKE_WIDTH_UNIT));
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        svg.append(path);
      }
    }
    const caption = document.createElement("figcaption");
    caption.textContent = answer.pages.length === 1 ? "Handwritten working" : `Handwritten working · page ${index + 1}`;
    figure.append(svg, caption);
    wrapper.append(figure);
  });

  if (answer.typed.trim()) {
    const typed = document.createElement("section");
    typed.className = "ink-submission-typed";
    const heading = document.createElement("h4");
    heading.textContent = "Typed working";
    const copy = document.createElement("p");
    copy.textContent = answer.typed;
    typed.append(heading, copy);
    wrapper.append(typed);
  }
  return wrapper;
}
