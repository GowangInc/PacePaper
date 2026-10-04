import { createHandheldControls, wireHandheld } from "./calculator-handheld.js";
import { evaluateHandheldEntry, fractionResult, entryAfterResult, mathExpression } from "./calculator-entry.js";
import { createNumericalTools } from "./calculator-tools.js";

const MAX_EXPRESSION_LENGTH = 200;
const MAX_TOKENS = 256;
const MAX_DEPTH = 32;

const CONSTANTS = Object.freeze({ pi: Math.PI, e: Math.E });
function factorial(value) {
  if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error("Factorial requires an integer from 0 to 170.");
  let result = 1;
  for (let n = 2; n <= value; n += 1) result *= n;
  return result;
}
function permutation(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 1000) throw new Error("Use integers with 0 ≤ r ≤ n ≤ 1000.");
  let result = 1;
  for (let i = 0; i < r; i += 1) result *= n - i;
  return finite(result);
}
function combination(n, r) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 1000) throw new Error("Use integers with 0 ≤ r ≤ n ≤ 1000.");
  let result = 1;
  for (let i = 1; i <= Math.min(r, n - r); i += 1) result *= (n - Math.min(r, n - r) + i) / i;
  return finite(result);
}
const FUNCTIONS = Object.freeze({
  factorial,
  npr: permutation,
  ncr: combination,
  binompdf: (n, p, x) => binomialProbability(n, p, x),
  binomcdf: (n, p, lower, upper) => upper === undefined ? binomialProbability(n, p, lower, "atMost") : binomialProbability(n, p, upper, "atMost") - binomialProbability(n, p, lower - 1, "atMost"),
  normalcdf: (lower, upper, mean = 0, sd = 1) => normalCdf(upper, mean, sd) - normalCdf(lower, mean, sd),
  normalpdf: (x, mean = 0, sd = 1) => { if (sd <= 0) throw new Error("Standard deviation must be positive."); return Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)); },
  invnorm: inverseNormal,
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
const FUNCTION_ARITIES = { npr: [2], ncr: [2], binompdf: [3], binomcdf: [3, 4], normalcdf: [2, 3, 4], normalpdf: [1, 2, 3], invnorm: [1, 2, 3] };

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
      const match = input.slice(index).match(/^[a-z][a-z0-9_]*/iu);
      const value = match[0].toLowerCase();
      tokens.push({ type: "name", value });
      index += match[0].length;
    } else if ("+-*/^(),!°".includes(character)) {
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
    let left = primary();
    while (["!", "°"].includes(current().type)) {
      const operator = tokens[index++].type;
      left = { type: "postfix", operator, value: left };
    }
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
  if (node.type === "postfix") {
    const value = evaluateNode(node.value, variables, angleMode);
    return node.operator === "!" ? factorial(value) : angleMode === "radian" ? value * Math.PI / 180 : value;
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
  if (!values.length || (!["min", "max"].includes(node.name) && !(FUNCTION_ARITIES[node.name] ?? [1]).includes(values.length))) {
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

function checkedRange(lower, upper) {
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower >= upper || upper - lower > 1e9) {
    throw new Error("Use finite bounds with the minimum below the maximum.");
  }
}

function bisect(fn, lower, upper, fLower, fUpper) {
  let left = lower;
  let right = upper;
  let leftValue = fLower;
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const middle = (left + right) / 2;
    const middleValue = fn(middle);
    if (!Number.isFinite(middleValue)) return null;
    if (Math.abs(middleValue) < 1e-11 || right - left < 1e-11 * Math.max(1, Math.abs(middle))) return middle;
    if (Math.sign(leftValue) !== Math.sign(middleValue)) right = middle;
    else { left = middle; leftValue = middleValue; }
  }
  const root = (left + right) / 2;
  return Math.abs(fn(root)) < 1e-7 * Math.max(1, Math.abs(fLower), Math.abs(fUpper)) ? root : null;
}

export function numericalRoots(fn, lower, upper, resolution = 400) {
  checkedRange(lower, upper);
  const roots = [];
  let previousX = lower;
  let previousY;
  try { previousY = fn(previousX); } catch { previousY = Number.NaN; }
  for (let step = 1; step <= resolution; step += 1) {
    const x = lower + (upper - lower) * step / resolution;
    let y;
    try { y = fn(x); } catch { y = Number.NaN; }
    if (Number.isFinite(y) && Math.abs(y) < 1e-10) roots.push(x);
    if (Number.isFinite(previousY) && Number.isFinite(y) && previousY * y < 0) {
      let root = null;
      try { root = bisect(fn, previousX, x, previousY, y); } catch { /* Skip discontinuities. */ }
      if (root !== null) roots.push(root);
    }
    previousX = x;
    previousY = y;
  }
  roots.sort((a, b) => a - b);
  return roots.filter((root, index) => index === 0 || Math.abs(root - roots[index - 1]) > 1e-6 * Math.max(1, Math.abs(root)));
}

export function numericalDerivative(fn, x) {
  if (!Number.isFinite(x)) throw new Error("Enter a finite x value.");
  const step = 0.0001 * Math.max(1, Math.abs(x));
  const result = (-fn(x + 2 * step) + 8 * fn(x + step) - 8 * fn(x - step) + fn(x - 2 * step)) / (12 * step);
  if (!Number.isFinite(result)) throw new Error("The derivative is undefined at that x value.");
  return result;
}

export function numericalIntegral(fn, lower, upper, tolerance = 1e-8) {
  if (lower === upper) return 0;
  const sign = lower > upper ? -1 : 1;
  const a = Math.min(lower, upper);
  const b = Math.max(lower, upper);
  checkedRange(a, b);
  const midpoint = (a + b) / 2;
  const fa = fn(a), fm = fn(midpoint), fb = fn(b);
  if (![fa, fm, fb].every(Number.isFinite)) throw new Error("The function is undefined within the integration range.");
  const simpson = (left, right, fLeft, fMiddle, fRight) => (right - left) * (fLeft + 4 * fMiddle + fRight) / 6;
  function refine(left, right, fLeft, fMiddle, fRight, whole, remaining, depth) {
    const middle = (left + right) / 2;
    const leftMiddle = (left + middle) / 2;
    const rightMiddle = (middle + right) / 2;
    const fLeftMiddle = fn(leftMiddle), fRightMiddle = fn(rightMiddle);
    if (![fLeftMiddle, fRightMiddle].every(Number.isFinite)) throw new Error("The function is undefined within the integration range.");
    const leftArea = simpson(left, middle, fLeft, fLeftMiddle, fMiddle);
    const rightArea = simpson(middle, right, fMiddle, fRightMiddle, fRight);
    const delta = leftArea + rightArea - whole;
    if (depth <= 0 || Math.abs(delta) <= 15 * remaining) return leftArea + rightArea + delta / 15;
    return refine(left, middle, fLeft, fLeftMiddle, fMiddle, leftArea, remaining / 2, depth - 1)
      + refine(middle, right, fMiddle, fRightMiddle, fRight, rightArea, remaining / 2, depth - 1);
  }
  return sign * refine(a, b, fa, fm, fb, simpson(a, b, fa, fm, fb), tolerance, 16);
}

export function numericalExtremum(fn, lower, upper, kind = "maximum") {
  checkedRange(lower, upper);
  const minimize = kind === "minimum";
  const points = Array.from({ length: 401 }, (_, index) => {
    const x = lower + (upper - lower) * index / 400;
    let y;
    try { y = fn(x); } catch { y = Number.NaN; }
    return { x, y };
  });
  const candidates = [points[0], points.at(-1)].filter((point) => Number.isFinite(point.y));
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index], before = points[index - 1], after = points[index + 1];
    const isCandidate = [point.y, before.y, after.y].every(Number.isFinite)
      && (minimize ? point.y <= before.y && point.y <= after.y : point.y >= before.y && point.y >= after.y);
    if (!isCandidate) continue;
    let left = before.x, right = after.x;
    const ratio = (Math.sqrt(5) - 1) / 2;
    let first = right - ratio * (right - left);
    let second = left + ratio * (right - left);
    const score = (x) => {
      try {
        const value = fn(x);
        return Number.isFinite(value) ? (minimize ? value : -value) : Number.POSITIVE_INFINITY;
      } catch { return Number.POSITIVE_INFINITY; }
    };
    let firstScore = score(first), secondScore = score(second);
    for (let iteration = 0; iteration < 48; iteration += 1) {
      if (firstScore <= secondScore) {
        right = second; second = first; secondScore = firstScore;
        first = right - ratio * (right - left); firstScore = score(first);
      } else {
        left = first; first = second; firstScore = secondScore;
        second = left + ratio * (right - left); secondScore = score(second);
      }
    }
    const x = (left + right) / 2;
    let y;
    try { y = fn(x); } catch { y = Number.NaN; }
    if (Number.isFinite(y)) candidates.push({ x, y });
  }
  if (!candidates.length) throw new Error("No defined function values were found in this range.");
  return candidates.reduce((best, candidate) => (minimize ? candidate.y < best.y : candidate.y > best.y) ? candidate : best);
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - polynomial * Math.exp(-x * x));
}

export function normalCdf(value, mean = 0, standardDeviation = 1) {
  if (![value, mean, standardDeviation].every(Number.isFinite) || standardDeviation <= 0) throw new Error("Standard deviation must be positive.");
  return (1 + erf((value - mean) / (standardDeviation * Math.SQRT2))) / 2;
}

export function inverseNormal(probability, mean = 0, standardDeviation = 1) {
  if (!(probability > 0 && probability < 1) || !Number.isFinite(mean) || !Number.isFinite(standardDeviation) || standardDeviation <= 0) {
    throw new Error("Use a probability between 0 and 1 and a positive standard deviation.");
  }
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425, high = 1 - low;
  let z;
  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (probability <= high) {
    const q = probability - 0.5;
    const r = q * q;
    z = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
      / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    z = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  return mean + standardDeviation * z;
}

function logGamma(value) {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.50734327868691, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  const shifted = value - 1;
  let sum = 0.9999999999998099;
  coefficients.forEach((coefficient, index) => { sum += coefficient / (shifted + index + 1); });
  const t = shifted + coefficients.length - 0.5;
  return 0.9189385332046727 + (shifted + 0.5) * Math.log(t) - t + Math.log(sum);
}

function binomialMass(n, p, k) {
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

export function binomialProbability(n, p, value, tail = "exact") {
  if (!Number.isInteger(n) || n < 0 || n > 1000 || !Number.isFinite(p) || p < 0 || p > 1 || !Number.isInteger(value)) {
    throw new Error("Use whole-number n from 0 to 1000, p from 0 to 1, and a whole-number x.");
  }
  if (tail === "exact" && (value < 0 || value > n)) return 0;
  if (tail === "atMost" && value < 0) return 0;
  if (tail === "atLeast" && value > n) return 0;
  if (tail === "exact") return binomialMass(n, p, value);
  const start = tail === "atLeast" ? Math.max(0, value) : 0;
  const end = tail === "atMost" ? Math.min(n, value) : n;
  let total = 0;
  for (let k = start; k <= end; k += 1) total += binomialMass(n, p, k);
  return total;
}

export function summarizeData(values) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("Enter at least one finite data value.");
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const quantile = (position) => {
    const lower = Math.floor(position), fraction = position - lower;
    return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
  };
  const squaredDifferences = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return {
    count: values.length, mean, median: quantile((values.length - 1) / 2),
    q1: quantile((values.length - 1) / 4), q3: quantile(3 * (values.length - 1) / 4),
    min: sorted[0], max: sorted[sorted.length - 1],
    populationSd: Math.sqrt(squaredDifferences / values.length),
    sampleSd: values.length > 1 ? Math.sqrt(squaredDifferences / (values.length - 1)) : Number.NaN,
  };
}

export function linearRegression(xValues, yValues) {
  if (xValues.length < 2 || xValues.length !== yValues.length || [...xValues, ...yValues].some((value) => !Number.isFinite(value))) {
    throw new Error("Enter at least two finite x-y pairs with matching counts.");
  }
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
  const yMean = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const xx = xValues.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  const yy = yValues.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  if (xx === 0) throw new Error("Regression needs variation in the x values.");
  const xy = xValues.reduce((sum, value, index) => sum + (value - xMean) * (yValues[index] - yMean), 0);
  const slope = xy / xx;
  return {
    slope, intercept: yMean - slope * xMean,
    r: yy === 0 ? Number.NaN : xy / Math.sqrt(xx * yy),
    rSquared: yy === 0 ? Number.NaN : (xy * xy) / (xx * yy),
  };
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
    "Graph tools: plot, trace, roots, intersections, extrema, derivatives, integrals, and value tables.",
    "Statistics: one-variable summaries, linear regression, binomial probabilities, and normal probabilities/inverse normal.",
    "Keyboard: Enter submits a line; Ctrl+Enter gives a decimal; F1 opens Menu; Escape dismisses menus first. Use the physical Scratchpad key to switch Calculate/Graph.",
    "This independent simulator reproduces common exam workflows. TI firmware, document files, programming, complex arithmetic, matrices, geometry, and CAS are not implemented.",
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

  let ans = Number.isFinite(Number(saved.ans)) ? Number(saved.ans) : 0;
  let traceX = null;
  let graphImage = null;
  let graphGeometry = null;
  let activePanelName = "calculate";
  let variables = Object.fromEntries(Object.entries(saved.variables ?? {}).filter(([name, value]) => /^[a-z][a-z0-9_]*$/u.test(name) && !["constructor", "prototype", "__proto__", "pi", "e", "ans"].includes(name) && Number.isFinite(value)).slice(0, 100));
  const historyItems = (Array.isArray(saved.history) ? saved.history : []).filter((item) => typeof item?.expression === "string" && typeof item?.result === "string").slice(-50);
  let newEntry = false;
  let recallIndex = historyItems.length;

  function state() {
    return {
      expression: expressionField.input.value.slice(0, MAX_EXPRESSION_LENGTH),
      angleMode: mode.value,
      ans, variables, history: historyItems,
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
      try { use.replaceChildren(mathExpression(parser(tokenize(item.expression)))); } catch { /* Store commands retain their entered notation. */ }
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
      ans = evaluated.value;
      display.textContent = formatNumber(ans);
      delete display.dataset.error;
      historyItems.push({ expression, result: display.textContent, fraction: approximate ? null : fractionResult(expression, ans) });
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
    const cursor = Math.min(start + (emptySlot >= 0 ? emptySlot + 1 : value.length), next.length);
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
        let probability = normalCdf(x, mean, standardDeviation);
        if (normalTail.value === "right") probability = 1 - probability;
        if (normalTail.value === "between") {
          const upper = numericField(normalUpperX.input, "upper bound b");
          if (upper < x) throw new Error("The upper bound must be at least the lower bound.");
          probability = normalCdf(upper, mean, standardDeviation) - probability;
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
  const panelMap = { calculate: calculatePanel, graph: graphPanel, table: tablePanel, statistics: statisticsPanel };
  const hardware = wireHandheld({
    dialog, screen, content: screenContent, controls: deviceControls, expression: expressionField.input, mode,
    panels: panelMap, tools: { ...tools, settings, functions: functionFields, bounds, analysis, tableSettings: tableControls, data: dataGroup, regression: regressionGroup, binomial: binomialPanel, normal: normalPanel },
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
