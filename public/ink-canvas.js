const PAGE_WIDTH = 10_000;
const PAGE_HEIGHT = 7_500;
const STROKE_WIDTH_UNIT = 12;

function blankAnswer(settings) {
  return {
    version: 1,
    pages: Array.from({ length: settings.pages }, () => ({ strokes: [] })),
    typed: "",
  };
}

function parseAnswer(value, settings) {
  if (!value) return blankAnswer(settings);
  try {
    const answer = JSON.parse(value);
    if (answer?.version !== 1 || !Array.isArray(answer.pages) || answer.pages.length !== settings.pages) {
      return blankAnswer(settings);
    }
    return {
      version: 1,
      pages: answer.pages.map((page) => ({ strokes: Array.isArray(page?.strokes) ? page.strokes : [] })),
      typed: typeof answer.typed === "string" ? answer.typed : "",
    };
  } catch {
    return blankAnswer(settings);
  }
}

function serialize(answer) {
  return JSON.stringify(answer);
}

function answerHasContent(answer) {
  return answer.typed.trim().length > 0 || answer.pages.some((page) => page.strokes.length > 0);
}

export function hasInkResponse(value, settings) {
  return answerHasContent(parseAnswer(value, settings));
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

export function createInkResponse({ value, settings, label, onChange, signal }) {
  const answer = parseAnswer(value, settings);
  const redos = answer.pages.map(() => []);
  let activePage = 0;
  let activePointer = null;
  let activeStroke = null;

  const root = document.createElement("section");
  root.className = "ink-response";
  const toolbar = document.createElement("div");
  toolbar.className = "ink-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", `Drawing tools for ${label}`);

  const pageTabs = document.createElement("div");
  pageTabs.className = "ink-page-tabs";
  pageTabs.setAttribute("aria-label", "Working pages");
  const undo = document.createElement("button");
  undo.type = "button";
  undo.textContent = "Undo";
  const redo = document.createElement("button");
  redo.type = "button";
  redo.textContent = "Redo";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear page";
  toolbar.append(pageTabs, undo, redo, clear);

  const surface = document.createElement("div");
  surface.className = "ink-surface";
  surface.dataset.background = settings.background;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", `${label} handwriting surface`);
  canvas.setAttribute("role", "img");
  surface.append(canvas);

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

  function emitChange() {
    onChange(serialize(answer));
  }

  function page() {
    return answer.pages[activePage];
  }

  function updateControls() {
    undo.disabled = page().strokes.length === 0;
    redo.disabled = redos[activePage].length === 0;
    clear.disabled = page().strokes.length === 0;
    [...pageTabs.children].forEach((item, index) => item.setAttribute("aria-current", index === activePage ? "page" : "false"));
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
    activePage = index;
    draw();
  }

  answer.pages.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = settings.pages === 1 ? "Working page" : `Page ${index + 1}`;
    button.addEventListener("click", () => selectPage(index), { signal });
    pageTabs.append(button);
  });

  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return [
      Math.round(Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * PAGE_WIDTH),
      Math.round(Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) * PAGE_HEIGHT),
      Math.round(Math.max(0, Math.min(1, event.pressure || 0.5)) * 1_000),
    ];
  }

  function appendPoint(event) {
    if (!activeStroke) return;
    const next = pointFromEvent(event);
    const previous = activeStroke.points.at(-1);
    if (previous && Math.hypot(next[0] - previous[0], next[1] - previous[1]) < 6) return;
    activeStroke.points.push(next);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (activePointer !== null) return;
    event.preventDefault();
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    activeStroke = { width: event.pointerType === "pen" ? 3 : 4, points: [pointFromEvent(event)] };
    page().strokes.push(activeStroke);
    redos[activePage] = [];
    draw();
  }, { signal });

  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer || !activeStroke) return;
    event.preventDefault();
    const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    for (const item of events) appendPoint(item);
    draw();
  }, { signal });

  const finishStroke = (event) => {
    if (event.pointerId !== activePointer) return;
    appendPoint(event);
    activePointer = null;
    activeStroke = null;
    draw();
    emitChange();
  };
  canvas.addEventListener("pointerup", finishStroke, { signal });
  canvas.addEventListener("pointercancel", finishStroke, { signal });

  undo.addEventListener("click", () => {
    const stroke = page().strokes.pop();
    if (stroke) redos[activePage].push(stroke);
    draw();
    emitChange();
  }, { signal });
  redo.addEventListener("click", () => {
    const stroke = redos[activePage].pop();
    if (stroke) page().strokes.push(stroke);
    draw();
    emitChange();
  }, { signal });
  clear.addEventListener("click", () => clearDialog.showModal(), { signal });
  confirmClear.addEventListener("click", () => {
    page().strokes = [];
    redos[activePage] = [];
    clearDialog.close();
    draw();
    emitChange();
  }, { signal });

  root.append(toolbar, surface);
  if (settings.allowTypedAlternative) {
    const typed = document.createElement("details");
    typed.className = "ink-typed-alternative";
    typed.open = Boolean(answer.typed.trim());
    const summary = document.createElement("summary");
    summary.textContent = "Type working instead";
    const typedLabel = document.createElement("label");
    typedLabel.textContent = "Typed working";
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
  }
  root.append(clearDialog);

  const resizeObserver = new ResizeObserver(draw);
  resizeObserver.observe(surface);
  signal.addEventListener("abort", () => resizeObserver.disconnect(), { once: true });
  requestAnimationFrame(draw);
  return root;
}

export function renderInkSubmission(value, settings) {
  const answer = parseAnswer(value, settings);
  const wrapper = document.createElement("div");
  wrapper.className = "ink-submission";
  if (!answerHasContent(answer)) {
    wrapper.classList.add("empty-state");
    wrapper.textContent = "No response";
    return wrapper;
  }

  answer.pages.forEach((page, index) => {
    if (page.strokes.length === 0) return;
    const figure = document.createElement("figure");
    figure.className = "ink-submission-page";
    figure.dataset.background = settings.background;
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
    caption.textContent = settings.pages === 1 ? "Handwritten working" : `Handwritten working · page ${index + 1}`;
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
