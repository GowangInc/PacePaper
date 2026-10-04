// Handheld controls and screen navigation are kept separate from the math engine.
function node(tag, className, text) {
  const item = document.createElement(tag);
  item.className = className;
  if (text) item.textContent = text;
  return item;
}

function key(label, action, secondary = "", alternate = "", className = "") {
  const button = node("button", `calculator-hardware-key ${className}`);
  button.type = "button";
  button.dataset.key = action;
  if (alternate) button.dataset.alternate = alternate;
  button.setAttribute("aria-label", ({ home: "Home / On", scratchpad: "Scratchpad", backspace: "Delete", enter: "Enter", catalog: "Catalog", templates: "Math templates", shift: "Shift", ctrl: "Ctrl" })[action] ?? label);
  if (secondary) button.append(node("small", "calculator-key-secondary", secondary));
  button.append(node("span", "calculator-key-face", label));
  return button;
}

export function createHandheldControls() {
  const controls = node("div", "calculator-device-controls");
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "TI-Nspire CX II keypad");
  const navigation = node("div", "calculator-navigation");
  const left = node("div", "calculator-navigation-column");
  left.append(key("esc", "escape", "↶", "undo"), key("▤", "scratchpad", "save", "save"), key("tab", "tab"));
  const pad = node("div", "calculator-touchpad");
  pad.setAttribute("role", "group");
  pad.setAttribute("aria-label", "Touchpad");
  for (const [direction, label] of [["up", "▴"], ["left", "◂"], ["center", "◉"], ["right", "▸"], ["down", "▾"]]) {
    const button = key(label, `pad-${direction}`, "", "", `calculator-touchpad-${direction}`);
    button.setAttribute("aria-label", direction === "center" ? "Touchpad select" : `Touchpad ${direction}`);
    pad.append(button);
  }
  const right = node("div", "calculator-navigation-column");
  right.append(key("⌂ on", "home", "off", "off"), key("doc ▾", "document", "+ page", "document"), key("menu", "menu", "▣", "menu"));
  navigation.append(left, pad, right);
  const modifiers = node("div", "calculator-modifiers");
  modifiers.append(key("ctrl", "ctrl", "", "", "calculator-key-ctrl"), key("⇧ shift", "shift", "CAPS", "caps"), key("var", "variables", "sto →", "store"), key("del", "backspace", "clear", "clear"));
  const numeric = node("div", "calculator-keypad");
  numeric.setAttribute("role", "group");
  numeric.setAttribute("aria-label", "Numeric keypad");
  const rows = [
    [["=", "=", "≠ ≥ ≤", "relations"], ["trig", "trig"], ["7", "7"], ["8", "8"], ["9", "9"], ["▦", "templates", "∞", "constants"], ["▤", "catalog"]],
    [["^", "^", "ⁿ√", "root"], ["x²", "^2", "√", "sqrt("], ["4", "4"], ["5", "5"], ["6", "6"], ["×", "*", "▸", "store"], ["÷", "/", "□/□", "fraction"]],
    [["eˣ", "exp(", "ln", "ln("], ["10ˣ", "10^", "log", "log("], ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+", "∫", "integral"], ["−", "-", "d/dx", "derivative"]],
    [["(", "(", "{", "{"], [")", ")", "}", "}"], ["0", "0", "°", "degree"], [".", "."], ["(−)", "negate", "ans", "ans"], ["enter", "enter", "≈", "approximate"]],
  ];
  for (const row of rows) for (const descriptor of row) {
    const button = key(descriptor[0], descriptor[1], descriptor[2] ?? "", descriptor[3] ?? "", /^(\d|\.|\(−\))$/u.test(descriptor[0]) ? "calculator-key-number" : descriptor[1] === "enter" ? "calculator-key-enter" : "");
    numeric.append(button);
  }
  const alphabet = node("div", "calculator-alphabet");
  alphabet.setAttribute("role", "group");
  alphabet.setAttribute("aria-label", "Alphabet keypad");
  const letters = [
    ["EE", "E"], ..."ABCDEFG".split("").map((letter) => [letter, letter.toLowerCase()]), ["?! ▸", "symbols"],
    ["π ▸", "constants"], ..."HIJKLMN".split("").map((letter) => [letter, letter.toLowerCase()]), ["▧", "templates"],
    ["'", "'"], ..."OPQRSTU".split("").map((letter) => [letter, letter.toLowerCase()]), ["▶", "store"],
    ["↵", "enter"], ..."VWXYZ".split("").map((letter) => [letter, letter.toLowerCase()]), ["␣", " "],
  ];
  for (const [label, action] of letters) alphabet.append(key(label, action, "", "", "calculator-letter"));
  controls.append(navigation, modifiers, numeric, alphabet);
  return controls;
}

export function wireHandheld({ dialog, screen, content, controls, expression, mode, panels, tools, actions, getPanel, selectPanel, getVariables, insert, execute, persist, signal }) {
  const overlay = node("div", "calculator-screen-overlay");
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  const status = screen.querySelector(".calculator-screen-status");
  const statusPage = node("span", "", "Scratchpad");
  const statusMode = node("span", "calculator-status-mode");
  status.replaceChildren(node("span", "calculator-page-number", "1.1"), statusPage, statusMode);
  screen.append(overlay);
  let lastInput = expression;
  let ctrl = false;
  let shift = false;
  let menuPath = [];
  let currentItems = [];
  let currentIndex = 0;
  let home = false;
  let powered = true;
  let toolOpen = false;
  let toolReturn = null;

  function updateStatus() {
    statusPage.textContent = home ? "Home" : ({ calculate: "Scratchpad A", graph: "Scratchpad B", table: "Lists & Spreadsheet", statistics: "Data & Statistics" })[getPanel()];
    statusMode.textContent = `${ctrl ? "ctrl · " : ""}${shift ? "⇧ · " : ""}${mode.value === "degree" ? "DEG" : "RAD"}`;
    controls.querySelector('[data-key="ctrl"]').setAttribute("aria-pressed", String(ctrl));
    controls.querySelector('[data-key="shift"]').setAttribute("aria-pressed", String(shift));
  }
  function focusInput() {
    const candidates = [...panels[getPanel()].querySelectorAll("input, select, button, canvas[tabindex]")].filter((item) => item.checkVisibility());
    const target = candidates.includes(lastInput) ? lastInput : candidates[0];
    target?.focus();
  }
  function restoreTool() {
    if (!toolReturn) return;
    const { tool, placeholder, hidden } = toolReturn;
    if (placeholder.parentNode) placeholder.replaceWith(tool);
    else tool.remove();
    tool.hidden = hidden;
    toolReturn = null;
  }
  function closeOverlay() {
    restoreTool();
    overlay.hidden = true;
    menuPath = [];
    currentItems = [];
    toolOpen = false;
    focusInput();
  }
  function activate(name) {
    powered = true;
    screen.classList.remove("is-off");
    home = false;
    content.hidden = false;
    closeOverlay();
    selectPanel(name);
    updateStatus();
    focusInput();
  }
  function showTool(title, tool) {
    restoreTool();
    const placeholder = document.createComment("handheld tool position");
    tool.parentNode?.insertBefore(placeholder, tool);
    toolReturn = { tool, placeholder, hidden: tool.hidden };
    content.hidden = false;
    home = false;
    toolOpen = true;
    currentItems = [];
    menuPath = [];
    overlay.replaceChildren(node("div", "calculator-overlay-title", title), tool);
    overlay.setAttribute("aria-label", title);
    overlay.hidden = false;
    tool.hidden = false;
    tool.querySelector("input, select, button")?.focus();
  }
  const goTool = (title, tool) => ({ label: title, run: () => showTool(title, tool) });
  const token = (label, value = label) => ({ label, run: () => { closeOverlay(); insert(value, lastInput); } });
  const menu = (label, items) => ({ label, items });
  const graphTools = [
    goTool("Window Settings", tools.bounds),
    { label: "Zoom In", run: () => { closeOverlay(); actions.zoomIn(); } },
    { label: "Zoom Out", run: () => { closeOverlay(); actions.zoomOut(); } },
    { label: "Zoom Standard", run: () => { closeOverlay(); actions.resetView(); } },
  ];
  const statistics = [goTool("One-Variable Statistics", tools.data), goTool("Linear Regression (mx+b)", tools.regression)];
  const probability = [token("Factorial (!)", "!"), token("Permutations", "nPr("), token("Combinations", "nCr("), goTool("Binomial Distribution", tools.binomial), goTool("Normal Distribution", tools.normal)];
  const calcMenu = [
    menu("Actions", [{ label: "Clear History", run: () => { actions.clearHistory(); closeOverlay(); } }, { label: "Clear Entry", run: () => { expression.value = ""; closeOverlay(); } }]),
    menu("Number", [token("Absolute Value", "abs("), token("Square Root", "sqrt("), token("Logarithm", "log("), token("Natural Logarithm", "ln("), token("Round", "round(")]),
    menu("Algebra", [goTool("Numerical Solve", tools.solver)]),
    menu("Calculus", [goTool("Numerical Derivative", tools.derivative), goTool("Numerical Integral", tools.integral)]),
    menu("Probability", probability), menu("Statistics", statistics),
  ];
  const graphMenu = [
    goTool("Graph Entry/Edit", tools.functions),
    menu("Window / Zoom", graphTools),
    { label: "Graph Trace", run: () => { closeOverlay(); actions.trace(); } },
    menu("Analyze Graph", [["Zero", "zeros"], ["Minimum", "minimum"], ["Maximum", "maximum"], ["Intersection", "intersections"], ["dy/dx", "derivative"], ["Integral", "integral"]].map(([label, action]) => ({ label, run: () => { actions.prepareAnalysis(action); showTool(label, tools.analysis); } }))),
    { label: "Table", run: () => activate("table") },
  ];
  function focusMenu(index) {
    currentIndex = (index + currentItems.length) % currentItems.length;
    const buttons = [...overlay.querySelectorAll(".calculator-menu-item")];
    buttons.forEach((button, i) => { button.tabIndex = i === currentIndex ? 0 : -1; button.classList.toggle("is-active", i === currentIndex); });
    buttons[currentIndex]?.focus();
  }
  function choose(item) {
    if (item.items) { menuPath.push({ title: item.label, items: item.items }); renderMenu(); }
    else item.run();
  }
  function renderMenu() {
    restoreTool();
    const { title, items } = menuPath.at(-1);
    currentItems = items;
    overlay.replaceChildren(node("div", "calculator-overlay-title", title));
    overlay.setAttribute("aria-label", title);
    for (const [index, item] of items.entries()) {
      const button = node("button", "calculator-menu-item");
      button.type = "button";
      button.append(node("span", "calculator-menu-number", String(index + 1)), node("span", "", item.label), node("span", "calculator-menu-arrow", item.items ? "▸" : ""));
      button.addEventListener("click", () => choose(item), { signal });
      overlay.append(button);
    }
    toolOpen = false;
    overlay.hidden = false;
    focusMenu(0);
  }
  function openMenu(title, items) {
    restoreTool();
    menuPath = [{ title, items }];
    renderMenu();
  }
  function showHome() {
    home = true;
    content.hidden = true;
    openMenu("Home", [
      { label: "Scratchpad · Calculate", run: () => activate("calculate") },
      { label: "Scratchpad · Graph", run: () => activate("graph") },
      { label: "Lists & Spreadsheet · Table", run: () => activate("table") },
      { label: "Data & Statistics", run: () => activate("statistics") },
      goTool("Document Settings", tools.settings),
    ]);
    updateStatus();
  }
  function escape() {
    if (!overlay.hidden) {
      if (menuPath.length > 1) { menuPath.pop(); renderMenu(); }
      else if (home) activate(getPanel());
      else closeOverlay();
    } else if (home) activate(getPanel());
    else dialog.close();
  }
  function activeControls() {
    const region = toolOpen ? overlay : panels[getPanel()];
    return [...region.querySelectorAll("input, select, button, canvas[tabindex]")].filter((item) => item.checkVisibility());
  }
  function move(direction) {
    if (currentItems.length && !overlay.hidden) {
      if (direction === "left") { if (menuPath.length > 1) { menuPath.pop(); renderMenu(); } else escape(); }
      else if (direction === "right") choose(currentItems[currentIndex]);
      else focusMenu(currentIndex + (direction === "up" ? -1 : 1));
      return;
    }
    const focused = document.activeElement;
    if (focused instanceof HTMLInputElement && ["left", "right"].includes(direction)) {
      const position = Math.max(0, Math.min(focused.value.length, (focused.selectionStart ?? 0) + (direction === "left" ? -1 : 1)));
      focused.setSelectionRange(position, position);
    } else if (focused instanceof HTMLSelectElement) {
      focused.selectedIndex = Math.max(0, Math.min(focused.options.length - 1, focused.selectedIndex + (["left", "up"].includes(direction) ? -1 : 1)));
      focused.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (focused instanceof HTMLCanvasElement) {
      focused.dispatchEvent(new KeyboardEvent("keydown", { key: `Arrow${direction[0].toUpperCase()}${direction.slice(1)}`, bubbles: true }));
    } else if (getPanel() === "calculate" && !toolOpen && ["up", "down"].includes(direction)) actions.recall(direction);
    else {
      const items = activeControls();
      const index = items.indexOf(focused);
      items[(index + (direction === "up" ? -1 : 1) + items.length) % items.length]?.focus();
    }
    document.activeElement.scrollIntoView({ block: "nearest" });
  }
  function enter(approximate = false) {
    if (currentItems.length && !overlay.hidden) { choose(currentItems[currentIndex]); return; }
    if (toolOpen) {
      const focused = document.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
      else overlay.querySelector("button.primary-action, button:not(.calculator-tool-back)")?.click();
      return;
    }
    execute(approximate);
  }
  function backspace(clear = false) {
    if (clear) lastInput.value = "";
    else {
      const start = lastInput.selectionStart ?? lastInput.value.length;
      const end = lastInput.selectionEnd ?? start;
      lastInput.setRangeText("", start === end ? Math.max(0, start - 1) : start, end, "end");
    }
    lastInput.focus();
    lastInput.dispatchEvent(new Event("input", { bubbles: true }));
    persist();
  }
  const handlers = {
    home: showHome, off: () => { powered = false; closeOverlay(); screen.classList.add("is-off"); },
    scratchpad: () => activate(getPanel() === "graph" ? "calculate" : "graph"),
    escape, tab: () => { const items = activeControls(); items[(items.indexOf(document.activeElement) + 1) % items.length]?.focus(); },
    menu: () => openMenu(getPanel() === "graph" ? "Graphs" : "Calculator", getPanel() === "graph" ? graphMenu : getPanel() === "table" ? [goTool("Table Settings", tools.tableSettings)] : calcMenu),
    document: () => openMenu("Document", [
      menu("Add Application", [{ label: "Calculator", run: () => activate("calculate") }, { label: "Graphs", run: () => activate("graph") }, { label: "Lists & Spreadsheet", run: () => activate("table") }, { label: "Data & Statistics", run: () => activate("statistics") }]),
      goTool("Document Settings", tools.settings), { label: "Clear Scratchpad", run: () => { actions.clearHistory(); expression.value = ""; activate("calculate"); } },
    ]),
    ctrl: () => { ctrl = !ctrl; updateStatus(); }, shift: () => { shift = !shift; updateStatus(); }, caps: () => { shift = !shift; updateStatus(); },
    backspace: () => backspace(), clear: () => backspace(true), enter: () => enter(), approximate: () => enter(true),
    trig: () => openMenu("Trigonometry", ["sin", "cos", "tan", "asin", "acos", "atan"].map((name) => token(name, `${name}(`))),
    constants: () => openMenu("Constants", [token("π", "pi"), token("e")]),
    symbols: () => openMenu("Punctuation", [token(","), token("!"), token("%", "/100")]),
    relations: () => openMenu("Relations", [token("=", "="), token("Store →", "→")]),
    templates: () => openMenu("Math Templates", [token("Fraction", "()/()"), token("Square Root", "sqrt()"), token("Power", "^()"), token("Exponential", "exp()")]),
    fraction: () => insert("()/()", lastInput), root: () => insert("^(1/", lastInput),
    store: () => insert("→", lastInput), negate: () => insert("-", lastInput), degree: () => insert("°", lastInput),
    integral: () => showTool("Numerical Integral", tools.integral), derivative: () => showTool("Numerical Derivative", tools.derivative),
    variables: () => openMenu("Variables", [token("Ans", "ans"), ...Object.keys(getVariables()).map((name) => token(name))]),
    catalog: () => openMenu("Catalog", ["abs", "acos", "asin", "atan", "binomCdf", "binomPdf", "cos", "exp", "floor", "invNorm", "ln", "log", "nCr", "nPr", "normalCdf", "normalPdf", "round", "sin", "sqrt", "tan"].map((name) => token(name, `${name}(`))),
    undo: () => actions.undo(), save: persist,
  };
  function handle(action) {
    if (!powered) { if (action === "home") { powered = true; screen.classList.remove("is-off"); activate(getPanel()); } return; }
    if (action.startsWith("pad-")) { action === "pad-center" ? enter() : move(action.slice(4)); return; }
    if (currentItems.length && !overlay.hidden && /^[1-9]$/u.test(action)) { const item = currentItems[Number(action) - 1]; if (item) choose(item); return; }
    if (handlers[action]) handlers[action]();
    else { if (home) activate("calculate"); insert(shift ? action.toUpperCase() : action, lastInput); }
    if (!["ctrl", "shift", "caps"].includes(action)) { ctrl = false; shift = false; updateStatus(); }
    persist();
  }
  dialog.addEventListener("focusin", (event) => { if (event.target instanceof HTMLInputElement && screen.contains(event.target)) lastInput = event.target; }, { signal });
  // Keep the screen cursor while clicking a physical key.
  controls.addEventListener("pointerdown", (event) => { if (event.target.closest("button")) event.preventDefault(); }, { signal });
  controls.addEventListener("keydown", (event) => {
    const directions = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (!directions[event.key]) return;
    const focused = document.activeElement;
    const rect = focused.getBoundingClientRect();
    const horizontal = ["left", "right"].includes(directions[event.key]);
    const forward = ["right", "down"].includes(directions[event.key]);
    const candidates = [...controls.querySelectorAll("button")].filter((button) => button !== focused).map((button) => {
      const candidate = button.getBoundingClientRect();
      const gap = horizontal ? forward ? candidate.left - rect.right : rect.left - candidate.right : forward ? candidate.top - rect.bottom : rect.top - candidate.bottom;
      const across = horizontal ? Math.abs((candidate.top + candidate.bottom - rect.top - rect.bottom) / 2) : Math.abs((candidate.left + candidate.right - rect.left - rect.right) / 2);
      const aligned = horizontal ? candidate.top < rect.bottom && candidate.bottom > rect.top : candidate.left < rect.right && candidate.right > rect.left;
      return { button, gap, aligned, score: Math.max(0, gap) + 3 * across };
    }).filter((item) => item.gap >= -1).sort((a, b) => Number(b.aligned) - Number(a.aligned) || a.score - b.score);
    if (candidates[0]) { event.preventDefault(); candidates[0].button.focus(); }
  }, { signal });
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-key]");
    if (button) handle(ctrl && button.dataset.alternate ? button.dataset.alternate : button.dataset.key);
  }, { signal });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); escape(); }, { signal });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); escape(); return; }
    if (event.key === "Home" && !(event.target instanceof HTMLCanvasElement)) { event.preventDefault(); handle("home"); return; }
    if (event.key === "F1") { event.preventDefault(); handle("menu"); return; }
    if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); event.stopPropagation(); enter(true); return; }
    if (!overlay.hidden && currentItems.length) {
      if (/^[1-9]$/u.test(event.key)) { event.preventDefault(); handle(event.key); }
      else if (event.key.startsWith("Arrow")) { event.preventDefault(); move(event.key.slice(5).toLowerCase()); }
      else if (event.key === "Enter") { event.preventDefault(); enter(); }
    } else if (toolOpen && event.key === "Enter") { event.preventDefault(); enter(); }
  }, { capture: true, signal });
  mode.addEventListener("change", updateStatus, { signal });
  updateStatus();
  return { activate, updateStatus };
}
