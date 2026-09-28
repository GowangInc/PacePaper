const MAX_EXPRESSION_LENGTH = 200;
const MAX_TOKENS = 256;
const MAX_DEPTH = 32;

const CONSTANTS = Object.freeze({ pi: Math.PI, e: Math.E });
const FUNCTIONS = Object.freeze({
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  ceil: Math.ceil,
  cos: Math.cos,
  exp: Math.exp,
  floor: Math.floor,
  ln: Math.log,
  log: Math.log10,
  max: Math.max,
  min: Math.min,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
});
const ANGLE_FUNCTIONS = new Set(["sin", "cos", "tan"]);
const INVERSE_ANGLE_FUNCTIONS = new Set(["asin", "acos", "atan"]);

function tokenize(source) {
  if (typeof source !== "string" || !source.trim()) throw new Error("Enter an expression.");
  if (source.length > MAX_EXPRESSION_LENGTH) throw new Error(`Expressions are limited to ${MAX_EXPRESSION_LENGTH} characters.`);
  const input = source.replaceAll("π", "pi").replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-");
  const tokens = [];
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    if (/\s/u.test(character)) { index += 1; continue; }
    if (/[0-9.]/u.test(character)) {
      const match = input.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/iu);
      if (!match) throw new Error(`Invalid number near position ${index + 1}.`);
      const value = Number(match[0]);
      if (!Number.isFinite(value)) throw new Error("Number is outside the supported range.");
      tokens.push({ type: "number", value });
      index += match[0].length;
    } else if (/[a-z]/iu.test(character)) {
      const match = input.slice(index).match(/^[a-z]+/iu);
      const value = match[0].toLowerCase();
      tokens.push({ type: "name", value });
      index += match[0].length;
    } else if ("+-*/^(),".includes(character)) {
      tokens.push({ type: character, value: character });
      index += 1;
    } else {
      throw new Error(`Unsupported character “${character}”.`);
    }
    if (tokens.length > MAX_TOKENS) throw new Error("Expression is too complex.");
  }
  tokens.push({ type: "end", value: "" });
  return tokens;
}

function parser(tokens) {
  let index = 0;
  let depth = 0;
  const current = () => tokens[index];
  const take = (type) => {
    if (current().type !== type) throw new Error(`Expected “${type}”.`);
    return tokens[index++];
  };
  const startsPrimary = () => ["number", "name", "("].includes(current().type);

  function expression() {
    let node = term();
    while (current().type === "+" || current().type === "-") {
      const operator = tokens[index++].type;
      node = { type: "binary", operator, left: node, right: term() };
    }
    return node;
  }

  function term() {
    let node = unary();
    while (current().type === "*" || current().type === "/" || startsPrimary()) {
      const operator = current().type === "*" || current().type === "/" ? tokens[index++].type : "*";
      node = { type: "binary", operator, left: node, right: unary() };
    }
    return node;
  }

  function unary() {
    if (current().type === "+" || current().type === "-") {
      const operator = tokens[index++].type;
      return { type: "unary", operator, value: unary() };
    }
    return power();
  }

  function power() {
    const left = primary();
    return current().type === "^"
      ? { type: "binary", operator: take("^").type, left, right: unary() }
      : left;
  }

  function primary() {
    if (current().type === "number") return { type: "number", value: tokens[index++].value };
    if (current().type === "name") {
      const name = tokens[index++].value;
      if (current().type !== "(") return { type: "name", name };
      if (!Object.hasOwn(FUNCTIONS, name)) throw new Error(`Unknown function “${name}”.`);
      take("(");
      depth += 1;
      if (depth > MAX_DEPTH) throw new Error("Expression nesting is too deep.");
      const argumentsList = [];
      if (current().type !== ")") {
        argumentsList.push(expression());
        while (current().type === ",") { take(","); argumentsList.push(expression()); }
      }
      take(")");
      depth -= 1;
      return { type: "call", name, arguments: argumentsList };
    }
    if (current().type === "(") {
      take("(");
      depth += 1;
      if (depth > MAX_DEPTH) throw new Error("Expression nesting is too deep.");
      const node = expression();
      take(")");
      depth -= 1;
      return node;
    }
    throw new Error("Expression is incomplete.");
  }

  const tree = expression();
  if (current().type !== "end") throw new Error(`Unexpected “${current().value}”.`);
  return tree;
}

function finite(value) {
  if (!Number.isFinite(value)) throw new Error("Result is undefined or outside the supported range.");
  return Math.abs(value) < 1e-14 ? 0 : value;
}

function evaluateNode(node, variables, angleMode) {
  if (node.type === "number") return node.value;
  if (node.type === "name") {
    if (Object.hasOwn(variables, node.name)) return finite(Number(variables[node.name]));
    if (Object.hasOwn(CONSTANTS, node.name)) return CONSTANTS[node.name];
    throw new Error(`Unknown value “${node.name}”.`);
  }
  if (node.type === "unary") {
    const value = evaluateNode(node.value, variables, angleMode);
    return node.operator === "-" ? -value : value;
  }
  if (node.type === "binary") {
    const left = evaluateNode(node.left, variables, angleMode);
    const right = evaluateNode(node.right, variables, angleMode);
    if (node.operator === "+") return finite(left + right);
    if (node.operator === "-") return finite(left - right);
    if (node.operator === "*") return finite(left * right);
    if (node.operator === "/") return finite(left / right);
    return finite(left ** right);
  }
  const values = node.arguments.map((argument) => evaluateNode(argument, variables, angleMode));
  if (!values.length || (!["min", "max"].includes(node.name) && values.length !== 1)) {
    throw new Error(`${node.name} has the wrong number of arguments.`);
  }
  if (ANGLE_FUNCTIONS.has(node.name) && angleMode === "degree") values[0] *= Math.PI / 180;
  let result = FUNCTIONS[node.name](...values);
  if (INVERSE_ANGLE_FUNCTIONS.has(node.name) && angleMode === "degree") result *= 180 / Math.PI;
  return finite(result);
}

export function compileExpression(source, angleMode = "radian") {
  if (!new Set(["radian", "degree"]).has(angleMode)) throw new Error("Unknown angle mode.");
  const tree = parser(tokenize(source));
  return (variables = {}) => evaluateNode(tree, variables, angleMode);
}

export function phaseAllowsCalculator(phase) {
  if (!phase?.responseAllowed || phase.kind !== "work") return false;
  const rule = (phase.tools ?? []).join(" ");
  return !/(?:\b(?:no|without)\s+(?:a\s+)?calculators?\b|\bcalculator(?:s|\s+use)?\s+(?:(?:is|are)\s+)?(?:not\s+(?:permitted|allowed)|prohibited)\b)/iu.test(rule);
}

function formatNumber(value) {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  const absolute = Math.abs(value);
  return absolute !== 0 && (absolute >= 1e12 || absolute < 1e-9)
    ? value.toExponential(10).replace(/\.?(?:0+)(e)/u, "$1")
    : Number(value.toPrecision(12)).toString();
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function labelledInput(labelText, value, className = "") {
  const label = element("label", className);
  const span = element("span", "", labelText);
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.maxLength = MAX_EXPRESSION_LENGTH;
  input.spellcheck = false;
  input.autocomplete = "off";
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  label.append(span, input);
  return { label, input };
}

function readState(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}

function writeState(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Calculator state is optional. */ }
}

export function mountExamCalculator(shell, { signal, storageKey }) {
  const saved = readState(storageKey);
  const dialog = element("dialog", "exam-dialog calculator-dialog");
  dialog.id = "calculator-dialog";
  dialog.setAttribute("aria-labelledby", "calculator-title");
  const form = document.createElement("form");
  form.method = "dialog";
  const header = element("header");
  header.append(element("p", "eyebrow", "Candidate tool"), element("h2", "", "Graphing calculator"));
  header.querySelector("h2").id = "calculator-title";
  header.append(element("p", "", "Scientific calculations and function graphs. This practice tool is not a TI product or an approved calculator emulator."));
  const help = element("details", "calculator-help");
  const helpSummary = element("summary", "", "Supported functions and keyboard controls");
  const helpCopy = element("div", "calculator-help-copy");
  const helpList = element("ul");
  for (const item of [
    "Arithmetic: +, −, ×, ÷, powers (^), parentheses, π, e, and Ans.",
    "Functions: sqrt, abs, sin, cos, tan, asin, acos, atan, ln, log, exp, min, max, floor, ceil, and round.",
    "Graphing: up to three numeric functions of x with adjustable x and y bounds.",
    "Keyboard: Enter evaluates or plots; Escape closes the calculator.",
    "Numeric practice only: no CAS, symbolic solving, stored programs, statistics, matrices, geometry, or calculator-model certification.",
  ]) helpList.append(element("li", "", item));
  helpCopy.append(helpList);
  help.append(helpSummary, helpCopy);

  const tabs = element("div", "calculator-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Calculator views");
  const calculateTab = element("button", "", "Calculate");
  const graphTab = element("button", "", "Graph");
  for (const tab of [calculateTab, graphTab]) { tab.type = "button"; tab.setAttribute("role", "tab"); }
  calculateTab.id = "calculator-calculate-tab";
  calculateTab.setAttribute("aria-controls", "calculator-calculate-panel");
  graphTab.id = "calculator-graph-tab";
  graphTab.setAttribute("aria-controls", "calculator-graph-panel");
  tabs.append(calculateTab, graphTab);

  const calculatePanel = element("section", "calculator-panel calculator-evaluate");
  calculatePanel.setAttribute("role", "tabpanel");
  calculatePanel.id = "calculator-calculate-panel";
  calculatePanel.setAttribute("aria-labelledby", calculateTab.id);
  const expressionField = labelledInput("Expression", typeof saved.expression === "string" ? saved.expression.slice(0, MAX_EXPRESSION_LENGTH) : "");
  expressionField.input.id = "calculator-expression";
  expressionField.input.inputMode = "text";
  const display = element("output", "calculator-display", "0");
  display.setAttribute("for", expressionField.input.id);
  display.setAttribute("aria-live", "polite");
  const controls = element("div", "calculator-controls");
  const modeLabel = element("label", "calculator-mode", "Angle mode");
  const mode = document.createElement("select");
  mode.append(new Option("Radians", "radian"), new Option("Degrees", "degree"));
  mode.value = saved.angleMode === "degree" ? "degree" : "radian";
  modeLabel.append(mode);
  const evaluateButton = element("button", "primary-action", "Evaluate");
  evaluateButton.type = "button";
  controls.append(modeLabel, evaluateButton);
  const keypad = element("div", "calculator-keypad");
  keypad.setAttribute("aria-label", "Calculator keypad");
  const keys = [
    ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["√", "sqrt("], ["⌫", "backspace"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["÷", "/"], ["(", "("],
    ["4", "4"], ["5", "5"], ["6", "6"], ["×", "*"], [")", ")"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["−", "-"], ["xʸ", "^"],
    ["0", "0"], [".", "."], ["π", "pi"], ["+", "+"], ["C", "clear"],
    ["ln", "ln("], ["log", "log("], ["e", "e"], ["Ans", "ans"], ["=", "evaluate"],
  ];
  for (const [label, action] of keys) {
    const key = element("button", action === "evaluate" ? "calculator-equals" : "", label);
    key.type = "button";
    key.dataset.calculatorKey = action;
    keypad.append(key);
  }
  const historyTitle = element("h3", "", "History");
  const history = element("ol", "calculator-history");
  calculatePanel.append(expressionField.label, display, controls, keypad, historyTitle, history);

  const graphPanel = element("section", "calculator-panel calculator-graph");
  graphPanel.setAttribute("role", "tabpanel");
  graphPanel.id = "calculator-graph-panel";
  graphPanel.setAttribute("aria-labelledby", graphTab.id);
  graphPanel.hidden = true;
  const graphFields = ["y₁", "y₂", "y₃"].map((label, index) => labelledInput(label, Array.isArray(saved.graphs) && typeof saved.graphs[index] === "string" ? saved.graphs[index].slice(0, MAX_EXPRESSION_LENGTH) : index === 0 ? "sin(x)" : "", "calculator-function"));
  const functionFields = element("div", "calculator-functions");
  for (const { label } of graphFields) functionFields.append(label);
  const bounds = element("fieldset", "calculator-bounds");
  const legend = element("legend", "", "Graph window");
  bounds.append(legend);
  const savedBounds = Array.isArray(saved.bounds) && saved.bounds.length === 4 ? saved.bounds : [-10, 10, -10, 10];
  const boundFields = ["x min", "x max", "y min", "y max"].map((label, index) => {
    const field = labelledInput(label, String(Number.isFinite(Number(savedBounds[index])) ? Number(savedBounds[index]) : [-10, 10, -10, 10][index]), "calculator-bound");
    field.input.inputMode = "decimal";
    bounds.append(field.label);
    return field.input;
  });
  const plot = element("button", "primary-action", "Plot graph");
  plot.type = "button";
  const graphStatus = element("p", "calculator-graph-status", "Enter up to three functions of x.");
  graphStatus.setAttribute("role", "status");
  const canvas = document.createElement("canvas");
  canvas.className = "calculator-canvas";
  canvas.width = 720;
  canvas.height = 420;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Function graph from x negative 10 to 10 and y negative 10 to 10");
  graphPanel.append(functionFields, bounds, plot, graphStatus, canvas);

  const footer = element("footer");
  const close = element("button", "", "Close calculator");
  close.type = "button";
  footer.append(close);
  form.append(header, help, tabs, calculatePanel, graphPanel, footer);
  dialog.append(form);
  shell.append(dialog);

  let ans = Number.isFinite(Number(saved.ans)) ? Number(saved.ans) : 0;
  const historyItems = [];

  function state() {
    return {
      expression: expressionField.input.value.slice(0, MAX_EXPRESSION_LENGTH),
      angleMode: mode.value,
      ans,
      graphs: graphFields.map(({ input }) => input.value.slice(0, MAX_EXPRESSION_LENGTH)),
      bounds: boundFields.map((input) => Number(input.value)),
    };
  }

  function persist() { writeState(storageKey, state()); }

  function showError(error, target = display) {
    target.textContent = error instanceof Error ? error.message : "Calculation failed.";
    target.dataset.error = "true";
  }

  function evaluate() {
    try {
      const expression = expressionField.input.value;
      const value = compileExpression(expression, mode.value)({ ans });
      ans = value;
      display.textContent = formatNumber(value);
      delete display.dataset.error;
      historyItems.unshift({ expression, result: display.textContent });
      historyItems.splice(10);
      history.replaceChildren(...historyItems.map((item) => {
        const row = element("li");
        const use = element("button", "", `${item.expression} = ${item.result}`);
        use.type = "button";
        use.addEventListener("click", () => { expressionField.input.value = item.expression; expressionField.input.focus(); }, { signal });
        row.append(use);
        return row;
      }));
      persist();
    } catch (error) { showError(error); }
  }

  function insert(value) {
    const input = expressionField.input;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const next = `${input.value.slice(0, start)}${value}${input.value.slice(end)}`.slice(0, MAX_EXPRESSION_LENGTH);
    input.value = next;
    const cursor = Math.min(start + value.length, next.length);
    input.setSelectionRange(cursor, cursor);
    input.focus();
  }

  function graph() {
    try {
      const values = boundFields.map((input) => Number(input.value));
      const [xMin, xMax, yMin, yMax] = values;
      if (!values.every(Number.isFinite) || xMin >= xMax || yMin >= yMax || Math.max(xMax - xMin, yMax - yMin) > 1e9) {
        throw new Error("Use finite graph bounds with each minimum below its maximum.");
      }
      const compiled = graphFields.flatMap(({ input }) => input.value.trim() ? [{ source: input.value.trim(), evaluate: compileExpression(input.value.trim(), mode.value) }] : []);
      if (!compiled.length) throw new Error("Enter at least one function of x.");
      const width = Math.min(900, Math.max(320, Math.round(canvas.clientWidth || 720)));
      const height = Math.round(width * 7 / 12);
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = getComputedStyle(canvas).getPropertyValue("--calculator-canvas").trim() || "#f7f7f2";
      context.fillRect(0, 0, width, height);
      const toX = (x) => (x - xMin) / (xMax - xMin) * width;
      const toY = (y) => height - (y - yMin) / (yMax - yMin) * height;
      context.strokeStyle = "#b8bec8";
      context.lineWidth = 1;
      for (let step = 0; step <= 10; step += 1) {
        const x = width * step / 10;
        const y = height * step / 10;
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
        context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
      }
      context.strokeStyle = "#4b5563";
      context.lineWidth = 1.5;
      if (xMin <= 0 && xMax >= 0) { const x = toX(0); context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
      if (yMin <= 0 && yMax >= 0) { const y = toY(0); context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
      const colours = ["#1d4ed8", "#b42318", "#047857"];
      compiled.forEach((item, graphIndex) => {
        context.strokeStyle = colours[graphIndex];
        context.lineWidth = 2;
        context.beginPath();
        let drawing = false;
        for (let pixel = 0; pixel <= width; pixel += 1) {
          const x = xMin + pixel / width * (xMax - xMin);
          let y;
          try { y = item.evaluate({ x, ans }); } catch { drawing = false; continue; }
          const screenY = toY(y);
          if (!Number.isFinite(screenY) || screenY < -height * 2 || screenY > height * 3) { drawing = false; continue; }
          if (drawing) context.lineTo(pixel, screenY); else { context.moveTo(pixel, screenY); drawing = true; }
        }
        context.stroke();
      });
      canvas.setAttribute("aria-label", `Graph of ${compiled.map(({ source }) => source).join(", ")} from x ${xMin} to ${xMax} and y ${yMin} to ${yMax}`);
      graphStatus.textContent = `Plotted ${compiled.length} function${compiled.length === 1 ? "" : "s"}.`;
      delete graphStatus.dataset.error;
      persist();
    } catch (error) { showError(error, graphStatus); }
  }

  function selectPanel(name) {
    const showGraph = name === "graph";
    calculatePanel.hidden = showGraph;
    graphPanel.hidden = !showGraph;
    calculateTab.setAttribute("aria-selected", String(!showGraph));
    graphTab.setAttribute("aria-selected", String(showGraph));
    if (showGraph) requestAnimationFrame(graph); else expressionField.input.focus();
  }

  calculateTab.addEventListener("click", () => selectPanel("calculate"), { signal });
  graphTab.addEventListener("click", () => selectPanel("graph"), { signal });
  evaluateButton.addEventListener("click", evaluate, { signal });
  expressionField.input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); evaluate(); } }, { signal });
  mode.addEventListener("change", persist, { signal });
  keypad.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.calculatorKey;
    if (!action) return;
    if (action === "evaluate") evaluate();
    else if (action === "clear") { expressionField.input.value = ""; display.textContent = "0"; delete display.dataset.error; expressionField.input.focus(); }
    else if (action === "backspace") {
      const input = expressionField.input;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      if (start !== end) input.value = input.value.slice(0, start) + input.value.slice(end);
      else if (start > 0) input.value = input.value.slice(0, start - 1) + input.value.slice(end);
      const cursor = start === end ? Math.max(0, start - 1) : start;
      input.setSelectionRange(cursor, cursor);
      input.focus();
    } else insert(action);
    persist();
  }, { signal });
  plot.addEventListener("click", graph, { signal });
  graphFields.forEach(({ input }) => input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); graph(); } }, { signal }));
  close.addEventListener("click", () => dialog.close(), { signal });
  form.addEventListener("submit", (event) => event.preventDefault(), { signal });
  selectPanel("calculate");

  return {
    open() { if (!dialog.open) dialog.showModal(); requestAnimationFrame(() => expressionField.input.focus()); },
    close() { if (dialog.open) dialog.close(); },
    setEnabled(enabled) { if (!enabled && dialog.open) dialog.close(); },
  };
}
