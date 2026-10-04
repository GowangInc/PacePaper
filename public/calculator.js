import { createHandheldControls, wireHandheld } from "./calculator-handheld.js";
import { evaluateHandheldEntry, fractionResult, entryAfterResult, mathExpression, storeVariable, validFunction } from "./calculator-entry.js";
import { createNumericalTools } from "./calculator-tools.js";

import { compileExpression, parseExpression, MAX_EXPRESSION_LENGTH } from "./calculator-engine.js";
import { numericalRoots, numericalDerivative, numericalIntegral, numericalExtremum, normalCdf, inverseNormal, binomialProbability, summarizeData, linearRegression } from "./calculator-numeric.js";
import { normalTails, between } from "./calculator-distributions.js";
import { formatValue, validValue } from "./calculator-values.js";
import { createExamTools } from "./calculator-exam-tools.js";
export { compileExpression } from "./calculator-engine.js";
export { numericalRoots, numericalDerivative, numericalIntegral, numericalExtremum, normalCdf, inverseNormal, binomialProbability, summarizeData, linearRegression } from "./calculator-numeric.js";

export function phaseAllowsCalculator(phase) {
  if (!phase?.responseAllowed || phase.kind !== "work") return false;
  const rule = (phase.tools ?? []).join(" ");
  return !/(?:\b(?:no|without)\s+(?:a\s+)?calculators?\b|\bcalculator(?:s|\s+use)?\s+(?:(?:is|are)\s+)?(?:not\s+(?:permitted|allowed)|prohibited)\b)/iu.test(rule);
}

const formatNumber = formatValue;

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

function parseNumberList(source) {
  const tokens = source.trim().split(/[\s,;]+/u).filter(Boolean);
  const values = tokens.map(Number);
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("Enter one or more finite numbers, separated by commas or spaces.");
  return values;
}

function numericField(input, label) {
  const value = Number(input.value);
  if (input.value.trim() === "" || !Number.isFinite(value)) throw new Error(`Enter a finite value for ${label}.`);
  return value;
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
  header.append(element("p", "eyebrow", "Candidate calculator · practice edition"), element("h2", "", "TI-Nspire CX II"));
  header.querySelector("h2").id = "calculator-title";
  header.append(element("p", "", "Graphing and scientific practice interface · Not made by or approved by Texas Instruments."));
  const help = element("details", "calculator-help");
  const helpSummary = element("summary", "", "Supported functions and keyboard controls");
  const helpCopy = element("div", "calculator-help-copy");
  const helpList = element("ul");
  for (const item of [
    "Arithmetic: +, −, ×, ÷, powers (^), parentheses, π, e, and Ans.",
    "Functions: sqrt, abs, sin, cos, tan, asin, acos, atan, ln, log, exp, min, max, floor, ceil, and round.",
    "Graph tools: Cartesian analysis plus parametric, polar and explicit sequence plots, trace, and sampled tables. Matrix tools: determinant, inverse, transpose, rref and linear systems. Finance: TVM and NPV.",
    "Statistics: frequency lists, seven regression models, statistical plots, t/z/proportion/chi-squared tests and intervals. Probability: binomial, normal, t, chi-squared, F, Poisson and geometric distributions.",
    "Lists: {1,2,3}→l1; mean(l1); l1[2]. Matrices: [[2,1],[1,3]]→a; inverse(a); linsolve(a,{5,7}). Functions: f1(x):=x^2; seq(k^2,k,1,10); when(x<0,-x,x).",
    "Limits: 1000 characters per expression; lists/sequences 1000 entries; real matrices 20×20; polynomial roots degree ≤6; eigvals2 is for 2×2 matrices. Catalog lists direct commands by alphabet range.",
    "Conventions: indices start at 1; quartiles use linear interpolation; geometric x starts at trial 1. Confidence intervals are two-sided. Finance uses positive receipts and negative payments.",
    "Keyboard: Enter submits a line; Ctrl+Enter gives a decimal; F1 opens Menu; Escape dismisses menus first. Use the physical Scratchpad key to switch Calculate/Graph.",
    "Independent numeric implementation: lists, matrices, complex values, functions, sequences, statistical tests, regression, and finance. TI firmware, TNS files, programming, geometry, 3D graphs and CAS are not implemented.",
  ]) helpList.append(element("li", "", item));
  helpCopy.append(helpList);
  help.append(helpSummary, helpCopy);

  const handheld = element("section", "calculator-handheld");
  handheld.setAttribute("aria-label", "TI-Nspire CX II handheld simulator");
  const brand = element("div", "calculator-device-brand");
  brand.append(element("strong", "", "TI-nspire"), element("span", "", "CX II"), element("small", "", "HANDHELD SIMULATOR"));
  const screen = element("div", "calculator-device-screen");
  const screenStatus = element("div", "calculator-screen-status", "CX II · PACEPAPER PRACTICE");
  screen.append(screenStatus);

  const tabs = element("div", "calculator-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Calculator views");
  const calculateTab = element("button", "", "Calculate");
  const graphTab = element("button", "", "Graph");
  const tableTab = element("button", "", "Table");
  const statisticsTab = element("button", "", "Statistics");
  const tabsByName = { calculate: calculateTab, graph: graphTab, table: tableTab, statistics: statisticsTab };
  for (const tab of Object.values(tabsByName)) { tab.type = "button"; tab.setAttribute("role", "tab"); }
  calculateTab.id = "calculator-calculate-tab";
  calculateTab.setAttribute("aria-controls", "calculator-calculate-panel");
  graphTab.id = "calculator-graph-tab";
  graphTab.setAttribute("aria-controls", "calculator-graph-panel");
  tableTab.id = "calculator-table-tab";
  tableTab.setAttribute("aria-controls", "calculator-table-panel");
  statisticsTab.id = "calculator-statistics-tab";
  statisticsTab.setAttribute("aria-controls", "calculator-statistics-panel");
  tabs.append(calculateTab, graphTab, tableTab, statisticsTab);

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
  const deviceControls = createHandheldControls();
  const history = element("ol", "calculator-history");
  calculatePanel.append(history, expressionField.label, display);

  const graphPanel = element("section", "calculator-panel calculator-graph");
  graphPanel.setAttribute("role", "tabpanel");
  graphPanel.id = "calculator-graph-panel";
  graphPanel.setAttribute("aria-labelledby", graphTab.id);
  graphPanel.hidden = true;
  const graphFields = ["f₁(x)=", "f₂(x)=", "f₃(x)="].map((label, index) => labelledInput(label, Array.isArray(saved.graphs) && typeof saved.graphs[index] === "string" ? saved.graphs[index].slice(0, MAX_EXPRESSION_LENGTH) : index === 0 ? "sin(x)" : "", "calculator-function"));
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
  functionFields.append(plot);
  const applyBounds = element("button", "primary-action", "Apply Window");
  applyBounds.type = "button";
  applyBounds.addEventListener("click", () => { graph(); hardware.activate("graph"); }, { signal });
  bounds.append(applyBounds);
  const zoomControls = element("div", "calculator-zoom-controls");
  const zoomIn = element("button", "", "Zoom in");
  const zoomOut = element("button", "", "Zoom out");
  const resetView = element("button", "", "Reset window");
  for (const button of [zoomIn, zoomOut, resetView]) button.type = "button";
  zoomControls.append(zoomIn, zoomOut, resetView);
  const graphStatus = element("p", "calculator-graph-status", "Enter up to three functions of x.");
  graphStatus.setAttribute("role", "status");
  const traceStatus = element("p", "calculator-trace-status", "Move over the graph or focus it and use the arrow keys to trace.");
  traceStatus.setAttribute("role", "status");
  const canvas = document.createElement("canvas");
  canvas.className = "calculator-canvas";
  canvas.width = 720;
  canvas.height = 420;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Function graph from x negative 10 to 10 and y negative 10 to 10");
  canvas.tabIndex = 0;

  const graphSelect = (label) => {
    const field = element("label", "calculator-analysis-field");
    field.append(element("span", "", label));
    const select = document.createElement("select");
    graphFields.forEach(({ input }, index) => select.add(new Option(`${label[0] === "F" ? "f" : "y"}${index + 1}: ${input.value || "(empty)"}`, String(index))));
    field.append(select);
    return { field, select };
  };
  const analysis = element("fieldset", "calculator-analysis");
  analysis.append(element("legend", "", "Analyze graphs"));
  const functionChoice = graphSelect("Function");
  const secondFunctionChoice = graphSelect("Second function");
  const analysisX = labelledInput("At x", "1", "calculator-analysis-field");
  const analysisMin = labelledInput("From x", "-10", "calculator-analysis-field");
  const analysisMax = labelledInput("To x", "10", "calculator-analysis-field");
  for (const input of [analysisX.input, analysisMin.input, analysisMax.input]) input.inputMode = "decimal";
  const analysisActions = element("div", "calculator-analysis-actions");
  for (const [label, action] of [["Zeros", "zeros"], ["Intersections", "intersections"], ["Minimum", "minimum"], ["Maximum", "maximum"], ["dy/dx", "derivative"], ["∫ f(x) dx", "integral"]]) {
    const button = element("button", "", label);
    button.type = "button";
    button.dataset.analysis = action;
    analysisActions.append(button);
  }
  const analysisStatus = element("p", "calculator-analysis-status", "Choose a graph tool to calculate a result.");
  analysisStatus.setAttribute("role", "status");
  analysis.append(functionChoice.field, secondFunctionChoice.field, analysisX.label, analysisMin.label, analysisMax.label, analysisActions, analysisStatus);
  graphPanel.append(functionFields, bounds, zoomControls, graphStatus, canvas, traceStatus, analysis);

  const tablePanel = element("section", "calculator-panel calculator-table");
  tablePanel.setAttribute("role", "tabpanel");
  tablePanel.id = "calculator-table-panel";
  tablePanel.setAttribute("aria-labelledby", tableTab.id);
  tablePanel.hidden = true;
  const tableControls = element("div", "calculator-table-controls");
  const tableFunction = graphSelect("Function");
  const tableStart = labelledInput("Start x", "-5", "calculator-analysis-field");
  const tableStep = labelledInput("Step", "1", "calculator-analysis-field");
  const tableRows = labelledInput("Rows", "11", "calculator-analysis-field");
  for (const input of [tableStart.input, tableStep.input, tableRows.input]) input.inputMode = "decimal";
  const buildTable = element("button", "primary-action", "Generate table");
  buildTable.type = "button";
  tableControls.append(tableFunction.field, tableStart.label, tableStep.label, tableRows.label, buildTable);
  const tableStatus = element("p", "calculator-table-status", "Generate values for the selected function.");
  tableStatus.setAttribute("role", "status");
  const valueTable = document.createElement("table");
  valueTable.className = "calculator-value-table";
  const valueCaption = document.createElement("caption");
  valueCaption.textContent = "Function values";
  const valueHead = document.createElement("thead");
  valueHead.innerHTML = "<tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th></tr>";
  const valueBody = document.createElement("tbody");
  valueTable.append(valueCaption, valueHead, valueBody);
  tablePanel.append(tableControls, tableStatus, valueTable);

  const statisticsPanel = element("section", "calculator-panel calculator-statistics");
  statisticsPanel.setAttribute("role", "tabpanel");
  statisticsPanel.id = "calculator-statistics-panel";
  statisticsPanel.setAttribute("aria-labelledby", statisticsTab.id);
  statisticsPanel.hidden = true;
  const dataGroup = element("fieldset", "calculator-stat-group");
  dataGroup.append(element("legend", "", "One-variable data"));
  const dataValues = labelledInput("Values (comma or space separated)", "", "calculator-stat-field");
  dataValues.input.maxLength = 4000;
  const summarizeButton = element("button", "primary-action", "Summarize data");
  summarizeButton.type = "button";
  const summaryOutput = element("dl", "calculator-summary-output");
  summaryOutput.setAttribute("aria-live", "polite");
  dataGroup.append(dataValues.label, summarizeButton, summaryOutput);

  const regressionGroup = element("fieldset", "calculator-stat-group");
  regressionGroup.append(element("legend", "", "Linear regression"));
  const regressionX = labelledInput("x values", "", "calculator-stat-field");
  const regressionY = labelledInput("y values", "", "calculator-stat-field");
  regressionX.input.maxLength = 4000;
  regressionY.input.maxLength = 4000;
  const regressionButton = element("button", "", "Calculate y = ax + b");
  regressionButton.type = "button";
  const regressionOutput = element("p", "calculator-regression-output", "Enter matching lists of x and y values.");
  regressionOutput.setAttribute("role", "status");
  regressionGroup.append(regressionX.label, regressionY.label, regressionButton, regressionOutput);

  const probabilityGroup = element("fieldset", "calculator-stat-group");
  probabilityGroup.append(element("legend", "", "Probability"));
  const probabilityTabs = element("div", "calculator-probability-tabs");
  const binomialTab = element("button", "", "Binomial");
  const normalTab = element("button", "", "Normal");
  for (const tab of [binomialTab, normalTab]) { tab.type = "button"; tab.setAttribute("aria-pressed", "false"); }
  probabilityTabs.append(binomialTab, normalTab);
  const binomialPanel = element("div", "calculator-distribution");
  const binomialN = labelledInput("Trials n", "10", "calculator-stat-field");
  const binomialP = labelledInput("Success probability p", "0.5", "calculator-stat-field");
  const binomialX = labelledInput("Value x", "5", "calculator-stat-field");
  const binomialTail = document.createElement("select");
  binomialTail.add(new Option("P(X = x)", "exact"));
  binomialTail.add(new Option("P(X ≤ x)", "atMost"));
  binomialTail.add(new Option("P(X ≥ x)", "atLeast"));
  const binomialTailLabel = element("label", "calculator-stat-field");
  binomialTailLabel.append(element("span", "", "Probability"), binomialTail);
  const binomialButton = element("button", "", "Calculate probability");
  binomialButton.type = "button";
  const binomialOutput = element("p", "calculator-distribution-output", "Enter n, p, and x.");
  binomialOutput.setAttribute("role", "status");
  binomialPanel.append(binomialN.label, binomialP.label, binomialX.label, binomialTailLabel, binomialButton, binomialOutput);
  const normalPanel = element("div", "calculator-distribution");
  normalPanel.hidden = true;
  const normalX = labelledInput("x value / lower bound a", "", "calculator-stat-field");
  const normalUpperX = labelledInput("Upper bound b", "", "calculator-stat-field");
  const normalProbability = labelledInput("Left-tail probability", "0.95", "calculator-stat-field");
  const normalMean = labelledInput("Mean μ", "0", "calculator-stat-field");
  const normalSd = labelledInput("Standard deviation σ", "1", "calculator-stat-field");
  const normalTail = document.createElement("select");
  normalTail.add(new Option("Left tail: P(X ≤ x)", "left"));
  normalTail.add(new Option("Right tail: P(X ≥ x)", "right"));
  normalTail.add(new Option("Between: P(a ≤ X ≤ b)", "between"));
  const normalTailLabel = element("label", "calculator-stat-field");
  normalTailLabel.append(element("span", "", "Normal probability"), normalTail);
  const normalCdfButton = element("button", "", "Calculate normal probability");
  const inverseNormalButton = element("button", "", "Find x from probability");
  normalCdfButton.type = inverseNormalButton.type = "button";
  const normalOutput = element("p", "calculator-distribution-output", "For inverse normal, enter a probability strictly between 0 and 1.");
  normalOutput.setAttribute("role", "status");
  normalPanel.append(normalX.label, normalUpperX.label, normalTailLabel, normalProbability.label, normalMean.label, normalSd.label, normalCdfButton, inverseNormalButton, normalOutput);
  probabilityGroup.append(probabilityTabs, binomialPanel, normalPanel);
  statisticsPanel.append(dataGroup, regressionGroup, probabilityGroup);

  const screenContent = element("div", "calculator-screen-content");
  screenContent.append(tabs, calculatePanel, graphPanel, tablePanel, statisticsPanel);
  screen.append(screenContent);
  const settings = element("section", "calculator-settings");
  settings.append(modeLabel, element("p", "", "Numeric mode · display precision: 12 digits"));
  const settingsDone = element("button", "primary-action", "OK");
  settingsDone.type = "button";
  settings.append(settingsDone);

  const footer = element("footer");
  const close = element("button", "", "Close calculator");
  close.type = "button";
  footer.append(element("span", "", "Enter to calculate · F1 for Menu"), close);
  handheld.append(brand, screen, deviceControls);
  form.append(header, help, handheld, footer);
  dialog.append(form);
  shell.append(dialog);

  let ans = validValue(saved.ans) ? saved.ans : 0;
  let traceX = null;
  let graphImage = null;
  let graphGeometry = null;
  let activePanelName = "calculate";
  let variables = {};
  for (const [name, value] of Object.entries(saved.variables ?? {}).slice(0, 100)) {
    try { if (validValue(value) || validFunction(value)) variables = storeVariable(variables, name, value); } catch { /* Ignore malformed saved values. */ }
  }
  let examTools;

  const historyItems = (Array.isArray(saved.history) ? saved.history : []).filter((item) => typeof item?.expression === "string" && typeof item?.result === "string").slice(-50);
  let newEntry = false;
  let recallIndex = historyItems.length;

  function state() {
    return {
      expression: expressionField.input.value.slice(0, MAX_EXPRESSION_LENGTH),
      angleMode: mode.value,
      ans, variables, history: historyItems, toolInputs: examTools?.state() ?? saved.toolInputs ?? {},
      graphs: graphFields.map(({ input }) => input.value.slice(0, MAX_EXPRESSION_LENGTH)),
      bounds: boundFields.map((input) => Number(input.value)),
    };
  }

  function persist() { writeState(storageKey, state()); }

  function showError(error, target = display) {
    target.textContent = error instanceof Error ? error.message : "Calculation failed.";
    target.dataset.error = "true";
  }

  function renderHistory() {
    history.replaceChildren(...historyItems.map((item) => {
      const row = element("li");
      const use = element("button", "calculator-history-expression", item.expression.replaceAll("*", "×").replaceAll("/", "÷").replaceAll("pi", "π"));
      use.type = "button";
      try { use.replaceChildren(mathExpression(parseExpression(item.expression))); } catch { /* Store commands retain their entered notation. */ }
      use.setAttribute("aria-label", `Recall ${item.expression}`);
      use.addEventListener("click", () => { newEntry = false; expressionField.input.value = item.expression; expressionField.input.focus(); }, { signal });
      const result = element("span", "calculator-history-result", item.result);
      if (item.fraction) {
        result.replaceChildren(element("span", "", String(item.fraction.numerator)), element("span", "", String(item.fraction.denominator)));
        result.classList.add("calculator-fraction");
        result.setAttribute("aria-label", `${item.fraction.numerator} over ${item.fraction.denominator}`);
      }
      row.append(use, result);
      return row;
    }));
    history.scrollTop = history.scrollHeight;
  }
  function evaluate(approximate = false) {
    if (!expressionField.input.value.trim()) return;
    try {
      const expression = expressionField.input.value;
      const evaluated = evaluateHandheldEntry(expression, compileExpression, mode.value, variables, ans);
      variables = evaluated.variables;
      if (evaluated.value?.kind !== "function") ans = evaluated.value;
      display.textContent = formatValue(evaluated.value);
      delete display.dataset.error;
      historyItems.push({ expression, result: display.textContent, fraction: approximate ? null : fractionResult(expression, evaluated.value) });
      if (historyItems.length > 50) historyItems.shift();
      renderHistory();
      recallIndex = historyItems.length;
      expressionField.input.value = "";
      newEntry = true;
      expressionField.input.focus();
      persist();
    } catch (error) { showError(error); }
  }

  function insert(value, input = expressionField.input) {
    if (newEntry && input === expressionField.input) {
      input.value = "";
      value = entryAfterResult(ans, value);
      newEntry = false;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const next = `${input.value.slice(0, start)}${value}${input.value.slice(end)}`.slice(0, MAX_EXPRESSION_LENGTH);
    input.value = next;
    const emptySlot = value.indexOf("()");
    const listSlot = value.indexOf("{}");
    const cursor = Math.min(start + (emptySlot >= 0 ? emptySlot + 1 : listSlot >= 0 ? listSlot + 1 : value.length), next.length);
    input.setSelectionRange(cursor, cursor);
    input.focus();
    input.dispatchEvent(new Event("input", { bubbles: true }));
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
      const width = Math.min(900, Math.max(240, Math.round(canvas.clientWidth || 320)));
      const height = Math.round(width * 0.58);
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
      context.fillStyle = "#303844";
      context.font = "10px Arial";
      for (let step = 1; step < 10; step += 2) {
        const xValue = xMin + step * (xMax - xMin) / 10;
        const yValue = yMin + step * (yMax - yMin) / 10;
        context.fillText(formatNumber(xValue), toX(xValue) + 2, Math.max(12, Math.min(height - 3, toY(0) + 12)));
        context.fillText(formatNumber(yValue), Math.max(2, Math.min(width - 25, toX(0) + 3)), toY(yValue) - 3);
      }
      const colours = ["#1d4ed8", "#b42318", "#047857"];
      compiled.forEach((item, graphIndex) => {
        context.strokeStyle = colours[graphIndex];
        context.lineWidth = 2;
        context.beginPath();
        let drawing = false;
        for (let pixel = 0; pixel <= width; pixel += 1) {
          const x = xMin + pixel / width * (xMax - xMin);
          let y;
          try { y = item.evaluate({ ...variables, x, ans }); } catch { drawing = false; continue; }
          const screenY = toY(y);
          if (!Number.isFinite(screenY) || screenY < -height * 2 || screenY > height * 3) { drawing = false; continue; }
          if (drawing) context.lineTo(pixel, screenY); else { context.moveTo(pixel, screenY); drawing = true; }
        }
        context.stroke();
      });
      graphImage = context.getImageData(0, 0, canvas.width, canvas.height);
      graphGeometry = { toX, toY, ratio };
      canvas.setAttribute("aria-label", `Graph of ${compiled.map(({ source }) => source).join(", ")} from x ${xMin} to ${xMax} and y ${yMin} to ${yMax}`);
      graphStatus.textContent = `Plotted ${compiled.length} function${compiled.length === 1 ? "" : "s"}.`;
      delete graphStatus.dataset.error;
      persist();
    } catch (error) { showError(error, graphStatus); }
  }

  function selectedFunction(selector) {
    const index = Number(selector.value);
    const source = graphFields[index]?.input.value.trim();
    if (!source) throw new Error(`Enter a function for y${index + 1} first.`);
    return compileExpression(source, mode.value);
  }

  function analyzeGraph(action) {
    try {
      const first = selectedFunction(functionChoice.select);
      const x = numericField(analysisX.input, "x");
      const lower = numericField(analysisMin.input, "the lower x bound");
      const upper = numericField(analysisMax.input, "the upper x bound");
      let result;
      if (action === "zeros") {
        const roots = numericalRoots((value) => first({ ...variables, x: value, ans }), lower, upper);
        result = roots.length ? `Zeros: ${roots.map(formatNumber).join(", ")}` : "No zeros found in this range.";
      } else if (action === "intersections") {
        const second = selectedFunction(secondFunctionChoice.select);
        if (functionChoice.select.value === secondFunctionChoice.select.value) throw new Error("Choose two different functions.");
        const roots = numericalRoots((value) => first({ ...variables, x: value, ans }) - second({ ...variables, x: value, ans }), lower, upper);
        result = roots.length ? `Intersection x-values: ${roots.map(formatNumber).join(", ")}` : "No intersections found in this range.";
      } else if (action === "minimum" || action === "maximum") {
        const point = numericalExtremum((value) => first({ ...variables, x: value, ans }), lower, upper, action);
        result = `${action === "minimum" ? "Minimum" : "Maximum"}: (${formatNumber(point.x)}, ${formatNumber(point.y)})`;
      } else if (action === "derivative") {
        result = `dy/dx at x = ${formatNumber(x)}: ${formatNumber(numericalDerivative((value) => first({ ...variables, x: value, ans }), x))}`;
      } else {
        result = `Definite integral: ${formatNumber(numericalIntegral((value) => first({ ...variables, x: value, ans }), lower, upper))}`;
      }
      analysisStatus.textContent = result;
      delete analysisStatus.dataset.error;
    } catch (error) { showError(error, analysisStatus); }
  }

  function generateTable() {
    try {
      const fn = selectedFunction(tableFunction.select);
      const start = numericField(tableStart.input, "start x");
      const step = numericField(tableStep.input, "step");
      const rows = Number(tableRows.input.value);
      if (step === 0 || !Number.isInteger(rows) || rows < 1 || rows > 101) throw new Error("Use a non-zero step and between 1 and 101 rows.");
      const generated = [];
      for (let index = 0; index < rows; index += 1) {
        const x = start + step * index;
        let value;
        try { value = formatNumber(fn({ ...variables, x, ans })); } catch { value = "undefined"; }
        const row = document.createElement("tr");
        const xCell = document.createElement("td"), valueCell = document.createElement("td");
        xCell.textContent = formatNumber(x);
        valueCell.textContent = value;
        row.append(xCell, valueCell);
        generated.push(row);
      }
      valueBody.replaceChildren(...generated);
      tableStatus.textContent = `${rows} values for f${Number(tableFunction.select.value) + 1}(x).`;
      delete tableStatus.dataset.error;
    } catch (error) { showError(error, tableStatus); }
  }

  function summarize() {
    try {
      const summary = summarizeData(parseNumberList(dataValues.input.value));
      const entries = [
        ["n", summary.count], ["Mean", summary.mean], ["Median", summary.median],
        ["Q1", summary.q1], ["Q3", summary.q3], ["Minimum", summary.min], ["Maximum", summary.max],
        ["Population σ", summary.populationSd], ["Sample s", summary.sampleSd],
      ];
      summaryOutput.replaceChildren(...entries.flatMap(([label, value]) => {
        if (Number.isNaN(value)) return [];
        const term = element("dt", "", label), definition = element("dd", "", typeof value === "number" ? formatNumber(value) : String(value));
        return [term, definition];
      }));
      delete summaryOutput.dataset.error;
    } catch (error) { showError(error, summaryOutput); }
  }

  function regress() {
    try {
      const result = linearRegression(parseNumberList(regressionX.input.value), parseNumberList(regressionY.input.value));
      regressionOutput.textContent = `a = ${formatNumber(result.slope)}; b = ${formatNumber(result.intercept)}; r = ${Number.isFinite(result.r) ? formatNumber(result.r) : "undefined"}; r² = ${Number.isFinite(result.rSquared) ? formatNumber(result.rSquared) : "undefined"}`;
      delete regressionOutput.dataset.error;
    } catch (error) { showError(error, regressionOutput); }
  }

  function calculateBinomial() {
    try {
      const probability = binomialProbability(
        numericField(binomialN.input, "n"), numericField(binomialP.input, "p"),
        numericField(binomialX.input, "x"), binomialTail.value,
      );
      binomialOutput.textContent = `Probability: ${formatNumber(probability)}`;
      delete binomialOutput.dataset.error;
    } catch (error) { showError(error, binomialOutput); }
  }

  function calculateNormal(inverse = false) {
    try {
      const mean = numericField(normalMean.input, "mean");
      const standardDeviation = numericField(normalSd.input, "standard deviation");
      if (inverse) {
        const result = inverseNormal(numericField(normalProbability.input, "left-tail probability"), mean, standardDeviation);
        normalOutput.textContent = `x = ${formatNumber(result)}`;
      } else {
        const x = numericField(normalX.input, normalTail.value === "between" ? "lower bound a" : "x");
        let probability = normalTails(x, mean, standardDeviation)[normalTail.value === "right" ? 1 : 0];
        if (normalTail.value === "between") {
          const upper = numericField(normalUpperX.input, "upper bound b");
          if (upper < x) throw new Error("The upper bound must be at least the lower bound.");
          probability = between((value) => normalTails(value, mean, standardDeviation), x, upper);
        }
        normalOutput.textContent = `Probability: ${formatNumber(probability)}`;
      }
      delete normalOutput.dataset.error;
    } catch (error) { showError(error, normalOutput); }
  }

  function selectPanel(name) {
    activePanelName = name;
    Object.entries({ calculate: calculatePanel, graph: graphPanel, table: tablePanel, statistics: statisticsPanel }).forEach(([panelName, panel]) => {
      const selected = name === panelName;
      panel.hidden = !selected;
      tabsByName[panelName].setAttribute("aria-selected", String(selected));
      tabsByName[panelName].classList.toggle("is-selected", selected);
      tabsByName[panelName].tabIndex = selected ? 0 : -1;
    });
    if (name === "graph") requestAnimationFrame(graph);
    else if (name === "table" && valueBody.childElementCount === 0) generateTable();
    else if (name === "calculate") expressionField.input.focus();
  }

  Object.entries(tabsByName).forEach(([name, tab]) => tab.addEventListener("click", () => selectPanel(name), { signal }));
  analysisActions.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.analysis;
    if (action) analyzeGraph(action);
  }, { signal });
  functionChoice.select.addEventListener("change", () => { analysisStatus.textContent = "Choose a graph tool to calculate a result."; }, { signal });
  secondFunctionChoice.select.addEventListener("change", () => { analysisStatus.textContent = "Choose a graph tool to calculate a result."; }, { signal });
  buildTable.addEventListener("click", generateTable, { signal });
  summarizeButton.addEventListener("click", summarize, { signal });
  regressionButton.addEventListener("click", regress, { signal });
  binomialButton.addEventListener("click", calculateBinomial, { signal });
  normalCdfButton.addEventListener("click", () => calculateNormal(false), { signal });
  inverseNormalButton.addEventListener("click", () => calculateNormal(true), { signal });
  function selectProbabilityPanel(name) {
    const useBinomial = name === "binomial";
    binomialPanel.hidden = !useBinomial;
    normalPanel.hidden = useBinomial;
    binomialTab.setAttribute("aria-pressed", String(useBinomial));
    normalTab.setAttribute("aria-pressed", String(!useBinomial));
  }
  binomialTab.addEventListener("click", () => selectProbabilityPanel("binomial"), { signal });
  normalTab.addEventListener("click", () => selectProbabilityPanel("normal"), { signal });
  selectProbabilityPanel("binomial");

  evaluateButton.addEventListener("click", evaluate, { signal });
  expressionField.input.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    if (event.key === "Enter") { event.preventDefault(); evaluate(event.ctrlKey); }
    else if (["ArrowUp", "ArrowDown"].includes(event.key) && historyItems.length) { event.preventDefault(); recallHistory(event.key === "ArrowUp" ? "up" : "down"); }
  }, { signal });
  expressionField.input.addEventListener("beforeinput", (event) => {
    if (newEntry && event.inputType === "insertText" && event.data) {
      const initial = entryAfterResult(ans, event.data);
      if (initial !== event.data) { event.preventDefault(); insert(event.data); }
      newEntry = false;
    }
  }, { signal });
  expressionField.input.addEventListener("input", () => { newEntry = false; delete display.dataset.error; persist(); }, { signal });
  mode.addEventListener("change", () => { persist(); if (activePanelName === "graph") graph(); }, { signal });
  plot.addEventListener("click", () => hardware.activate("graph"), { signal });
  function zoomGraph(factor) {
    const values = boundFields.map((input) => Number(input.value));
    if (!values.every(Number.isFinite) || values[0] >= values[1] || values[2] >= values[3]) return;
    for (const [minimumIndex, maximumIndex] of [[0, 1], [2, 3]]) {
      const middle = (values[minimumIndex] + values[maximumIndex]) / 2;
      const half = (values[maximumIndex] - values[minimumIndex]) * factor / 2;
      boundFields[minimumIndex].value = formatNumber(middle - half);
      boundFields[maximumIndex].value = formatNumber(middle + half);
    }
    graph();
  }
  zoomIn.addEventListener("click", () => zoomGraph(0.5), { signal });
  zoomOut.addEventListener("click", () => zoomGraph(2), { signal });
  resetView.addEventListener("click", () => {
    [-10, 10, -10, 10].forEach((value, index) => { boundFields[index].value = String(value); });
    graph();
  }, { signal });
  function drawTrace(x, y) {
    if (!graphImage || !graphGeometry) return;
    const context = canvas.getContext("2d");
    context.putImageData(graphImage, 0, 0);
    context.setTransform(graphGeometry.ratio, 0, 0, graphGeometry.ratio, 0, 0);
    const px = graphGeometry.toX(x), py = graphGeometry.toY(y);
    context.strokeStyle = "#102d54";
    context.fillStyle = "#1d4ed8";
    context.lineWidth = 1;
    context.beginPath(); context.moveTo(px - 7, py); context.lineTo(px + 7, py); context.moveTo(px, py - 7); context.lineTo(px, py + 7); context.stroke();
    context.beginPath(); context.arc(px, py, 3, 0, 2 * Math.PI); context.fill();
  }
  canvas.addEventListener("pointermove", (event) => {
    const [xMin, xMax] = boundFields.slice(0, 2).map((input) => Number(input.value));
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) return;
    const rect = canvas.getBoundingClientRect();
    const x = xMin + (event.clientX - rect.left) / rect.width * (xMax - xMin);
    try {
      const index = graphFields.findIndex(({ input }) => Boolean(input.value.trim()));
      const y = selectedFunction({ value: String(index) })({ ...variables, x, ans });
      traceX = x;
      drawTrace(x, y);
      traceStatus.textContent = `Trace f${index + 1}: x = ${formatNumber(x)}, y = ${formatNumber(y)}`;
      delete traceStatus.dataset.error;
    } catch (error) { showError(error, traceStatus); }
  }, { signal });
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const [xMin, xMax] = boundFields.slice(0, 2).map((input) => Number(input.value));
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) return;
    if (event.key === "Home") traceX = xMin;
    else if (event.key === "End") traceX = xMax;
    else traceX = Math.max(xMin, Math.min(xMax, (traceX ?? (xMin + xMax) / 2) + (event.key === "ArrowLeft" ? -1 : 1) * (xMax - xMin) / 100));
    const index = graphFields.findIndex(({ input }) => Boolean(input.value.trim()));
    try {
      const y = selectedFunction({ value: String(index) })({ ...variables, x: traceX, ans });
      drawTrace(traceX, y);
      traceStatus.textContent = `Trace f${index + 1}: x = ${formatNumber(traceX)}, y = ${formatNumber(y)}`;
      delete traceStatus.dataset.error;
    }
    catch (error) { showError(error, traceStatus); }
  }, { signal });
  graphFields.forEach(({ input }, index) => {
    input.addEventListener("input", () => {
      for (const selector of [functionChoice.select, secondFunctionChoice.select, tableFunction.select]) {
        if (selector.options[index]) selector.options[index].textContent = `${selector === secondFunctionChoice.select ? "f" : "y"}${index + 1}: ${input.value || "(empty)"}`;
      }
    }, { signal });
  });
  graphFields.forEach(({ input }) => input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.defaultPrevented) { event.preventDefault(); graph(); } }, { signal }));
  close.addEventListener("click", () => dialog.close(), { signal });
  form.addEventListener("submit", (event) => event.preventDefault(), { signal });
  function recallHistory(direction) {
    recallIndex = Math.max(0, Math.min(historyItems.length, recallIndex + (direction === "up" ? -1 : 1)));
    expressionField.input.value = historyItems[recallIndex]?.expression ?? "";
    newEntry = false;
    expressionField.input.focus();
    expressionField.input.setSelectionRange(expressionField.input.value.length, expressionField.input.value.length);
  }
  renderHistory();
  const tools = createNumericalTools({ mode, getVariables: () => ({ ...variables, ans }), signal });
  examTools = createExamTools({ mode, getVariables: () => ({ ...variables, ans }), setVariable: (name, value) => { variables = storeVariable(variables, name, value); persist(); }, saved: saved.toolInputs, signal, persist });
  const panelMap = { calculate: calculatePanel, graph: graphPanel, table: tablePanel, statistics: statisticsPanel };
  const hardware = wireHandheld({
    dialog, screen, content: screenContent, controls: deviceControls, expression: expressionField.input, mode,
    panels: panelMap, tools: { ...tools, ...examTools.tools, settings, functions: functionFields, bounds, analysis, tableSettings: tableControls, data: dataGroup, regression: regressionGroup, binomial: binomialPanel, normal: normalPanel },
    actions: {
      zoomIn: () => zoomGraph(0.5), zoomOut: () => zoomGraph(2), resetView: () => resetView.click(),
      trace: () => canvas.focus(), recall: recallHistory, undo: () => recallHistory("up"),
      clearHistory: () => { historyItems.length = 0; recallIndex = 0; renderHistory(); persist(); },
      prepareAnalysis: (action) => { analysisActions.querySelectorAll("button").forEach((button) => button.classList.toggle("primary-action", button.dataset.analysis === action)); },
    },
    getPanel: () => activePanelName, selectPanel,
    getVariables: () => variables, insert,
    execute: (approximate) => ({ calculate: () => evaluate(approximate), graph, table: generateTable, statistics: summarize })[activePanelName](),
    persist, signal,
  });
  settingsDone.addEventListener("click", () => hardware.activate(activePanelName), { signal });
  hardware.activate("calculate");

  return {
    open() { if (!dialog.open) dialog.showModal(); requestAnimationFrame(() => hardware.activate(activePanelName)); },
    close() { if (dialog.open) dialog.close(); },
    setEnabled(enabled) { if (!enabled && dialog.open) dialog.close(); },
  };
}
