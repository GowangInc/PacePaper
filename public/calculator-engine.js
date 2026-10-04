import {
  binaryValue,
  unaryValue,
  complex,
  complexLog,
  complexExp,
  isComplex,
  real,
  validValue,
} from "./calculator-values.js";
import {
  determinant,
  inverse,
  transpose,
  rref,
  identity,
  augment,
  solveSystem,
} from "./calculator-matrix.js";
import { distributionFunctions } from "./calculator-distributions.js";
import { listFunctions } from "./calculator-statistics.js";
import { algebraFunctions } from "./calculator-algebra.js";
import { financeFunctions } from "./calculator-finance.js";
import {
  binomialProbability,
  numericalDerivative,
  numericalIntegral,
} from "./calculator-numeric.js";
export const MAX_EXPRESSION_LENGTH = 1000;
const CONSTANTS = Object.freeze({
  pi: Math.PI,
  e: Math.E,
  i: complex(0, 1),
  inf: 1e99,
});
function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170)
    throw new Error("Factorial requires an integer from 0 to 170.");
  let v = 1;
  for (let k = 2; k <= n; k++) v *= k;
  return v;
}
function selection(n, r, combination) {
  if (![n, r].every(Number.isInteger) || n < 0 || r < 0 || r > n || n > 1000)
    throw new Error("Use integers with 0 ≤ r ≤ n ≤ 1000.");
  if (combination) r = Math.min(r, n - r);
  let v = 1;
  for (let k = 1; k <= r; k++) v *= (n - r + k) / (combination ? k : 1);
  return real(v);
}
const realFn =
  (fn) =>
  (v, ...args) =>
    unaryValue(v, (x) => fn(real(x), ...args.map(real)));
function trig(v, kind) {
  if (!isComplex(v)) return Math[kind](real(v));
  if (kind === "sin")
    return complex(
      Math.sin(v.re) * Math.cosh(v.im),
      Math.cos(v.re) * Math.sinh(v.im),
    );
  if (kind === "cos")
    return complex(
      Math.cos(v.re) * Math.cosh(v.im),
      -Math.sin(v.re) * Math.sinh(v.im),
    );
  return binaryValue("/", trig(v, "sin"), trig(v, "cos"));
}
function binomialInterval(n, p, a, b) {
  if (![a, b].every(Number.isInteger) || a > b)
    throw new Error("Use integer counts with lower ≤ upper.");
  // Validate the parameters even when the requested interval is empty.
  binomialProbability(n, p, 0);
  let sum = 0;
  for (let k = Math.max(0, a); k <= Math.min(n, b); k++)
    sum += binomialProbability(n, p, k);
  return Math.min(1, sum);
}
const FUNCTIONS = Object.freeze({
  ...distributionFunctions,
  ...listFunctions,
  stdevsamp: listFunctions.stdev,
  stdevpop: listFunctions.stddevpop,
  ...financeFunctions,
  ...algebraFunctions,
  factorial,
  npr: (n, r) => selection(n, r, false),
  ncr: (n, r) => selection(n, r, true),
  binompdf: (n, p, x) => binomialProbability(n, p, x),
  binomcdf: (n, p, a, b) =>
    b === undefined
      ? binomialProbability(n, p, a, "atMost")
      : binomialInterval(n, p, a, b),
  abs: (v) =>
    unaryValue(v, (x) =>
      isComplex(x) ? Math.hypot(x.re, x.im) : Math.abs(real(x)),
    ),
  real: (v) => unaryValue(v, (x) => (isComplex(x) ? x.re : real(x))),
  imag: (v) => unaryValue(v, (x) => (isComplex(x) ? x.im : (real(x), 0))),
  conj: (v) =>
    unaryValue(v, (x) => (isComplex(x) ? complex(x.re, -x.im) : real(x))),
  angle: (v) =>
    isComplex(v) ? Math.atan2(v.im, v.re) : Math.atan2(0, real(v)),
  complex,
  polar: (r, angle) =>
    complex(real(r) * Math.cos(real(angle)), r * Math.sin(angle)),
  sqrt: (v) =>
    unaryValue(v, (x) => {
      if (!isComplex(x))
        return real(x) < 0 ? complex(0, Math.sqrt(-x)) : Math.sqrt(x);
      const length = Math.hypot(x.re, x.im),
        re = Math.sqrt((length + x.re) / 2),
        im = Math.sign(x.im) * Math.sqrt((length - x.re) / 2);
      return complex(re, im);
    }),
  root: (v, n) => {
    real(n);
    if (!n) throw new Error("Root index cannot be zero.");
    return unaryValue(v, (x) =>
      typeof x === "number" &&
      x < 0 &&
      Number.isInteger(n) &&
      Math.abs(n % 2) === 1
        ? -((-x) ** (1 / n))
        : binaryValue("^", x, 1 / n),
    );
  },
  ln: (v) =>
    unaryValue(v, (x) =>
      isComplex(x) || x < 0 ? complexLog(x) : Math.log(real(x)),
    ),
  log: (v, base = 10) => {
    if (!(base > 0) || base === 1)
      throw new Error("Logarithm base must be positive and different from 1.");
    return unaryValue(v, (x) =>
      binaryValue("/", FUNCTIONS.ln(x), Math.log(base)),
    );
  },
  exp: (v) =>
    unaryValue(v, (x) => (isComplex(x) ? complexExp(x) : Math.exp(real(x)))),
  sin: (v) => unaryValue(v, (x) => trig(x, "sin")),
  cos: (v) => unaryValue(v, (x) => trig(x, "cos")),
  tan: (v) => unaryValue(v, (x) => trig(x, "tan")),
  asin: realFn(Math.asin),
  acos: realFn(Math.acos),
  atan: realFn(Math.atan),
  atan2: Math.atan2,
  sinh: realFn(Math.sinh),
  cosh: realFn(Math.cosh),
  tanh: realFn(Math.tanh),
  asinh: realFn(Math.asinh),
  acosh: realFn(Math.acosh),
  atanh: realFn(Math.atanh),
  ceil: realFn(Math.ceil),
  floor: realFn(Math.floor),
  int: realFn(Math.trunc),
  round: realFn(Math.round),
  sign: realFn(Math.sign),
  min: (...v) => Math.min(...(Array.isArray(v[0]) ? v[0] : v).map(real)),
  max: (...v) => Math.max(...(Array.isArray(v[0]) ? v[0] : v).map(real)),
  mod: (a, b) => {
    real(a);
    real(b);
    if (!b) throw new Error("Modulus cannot be zero.");
    return ((a % b) + b) % b;
  },
  gcd: (a, b) => {
    if (![a, b].every(Number.isSafeInteger))
      throw new Error("gcd requires safe integers.");
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  },
  lcm: (a, b) =>
    a === 0 || b === 0 ? 0 : real(Math.abs((a / FUNCTIONS.gcd(a, b)) * b)),
  det: determinant,
  inverse,
  transpose,
  rref,
  identity,
  augment,
  linsolve: solveSystem,
});
const SPECIAL = new Set(["when", "seq", "sum", "product", "nderiv", "nint"]);
const ARITY = {
  npr: [2],
  ncr: [2],
  binompdf: [3],
  binomcdf: [3, 4],
  normalpdf: [1, 2, 3],
  normalcdf: [2, 3, 4],
  invnorm: [1, 2, 3],
  tpdf: [2],
  tcdf: [3],
  invt: [2],
  chi2pdf: [2],
  chi2cdf: [3],
  invchi2: [2],
  fpdf: [3],
  fcdf: [4],
  invf: [3],
  poissonpdf: [2],
  poissoncdf: [2],
  geompdf: [2],
  geomcdf: [2],
  log: [1, 2],
  root: [2],
  complex: [1, 2],
  polar: [2],
  atan2: [2],
  mod: [2],
  gcd: [2],
  lcm: [2],
  mean: [1, 2],
  median: [1, 2],
  stdev: [1, 2],
  stddevpop: [1, 2],
  stdevsamp: [1, 2],
  stdevpop: [1, 2],
  augment: [2],
  linsolve: [2],
  dotp: [2],
  crossp: [2],
  npv: [3],
  tvmfv: [3, 4, 5, 6, 7],
  tvmpv: [4, 5, 6, 7],
  tvmpmt: [3, 4, 5, 6, 7],
};
export const functionNames = Object.freeze(
  [...new Set([...Object.keys(FUNCTIONS), ...SPECIAL])].sort(),
);
export const reservedName = (name) =>
  Object.hasOwn(CONSTANTS, name) ||
  functionNames.includes(name) ||
  ["ans", "constructor", "prototype", "__proto__"].includes(name);
function tokenize(source) {
  if (typeof source !== "string" || !source.trim())
    throw new Error("Enter an expression.");
  if (source.length > MAX_EXPRESSION_LENGTH)
    throw new Error(
      `Expressions are limited to ${MAX_EXPRESSION_LENGTH} characters.`,
    );
  const input = source
    .replaceAll("π", "pi")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll("≤", "<=")
    .replaceAll("≥", ">=")
    .replaceAll("≠", "!=");
  const tokens = [];
  let index = 0;
  while (index < input.length) {
    if (/\s/u.test(input[index])) {
      index++;
      continue;
    }
    const rest = input.slice(index),
      number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/iu),
      name = rest.match(/^[a-z][a-z0-9_]*/iu),
      relation = rest.match(/^(?:<=|>=|!=)/u);
    if (number) {
      tokens.push({ type: "number", value: real(Number(number[0])) });
      index += number[0].length;
    } else if (name) {
      tokens.push({ type: "name", value: name[0].toLowerCase() });
      index += name[0].length;
    } else if (relation) {
      tokens.push({ type: relation[0], value: relation[0] });
      index += 2;
    } else if ("+-*/^(),!°{}[]=<>".includes(input[index])) {
      const value = input[index++];
      tokens.push({ type: value, value });
    } else throw new Error(`Unsupported character “${input[index]}”.`);
    if (tokens.length > 2048) throw new Error("Expression is too complex.");
  }
  tokens.push({ type: "end", value: "" });
  return tokens;
}
export function parseExpression(source) {
  const tokens = tokenize(source);
  let index = 0,
    depth = 0;
  const current = () => tokens[index],
    take = (type) => {
      if (current().type !== type) throw new Error(`Expected “${type}”.`);
      return tokens[index++];
    };
  const nested = (fn) => {
    if (++depth > 32) throw new Error("Expression nesting is too deep.");
    const result = fn();
    depth--;
    return result;
  };
  function expression() {
    let node = addition();
    if (["=", "!=", "<", ">", "<=", ">="].includes(current().type))
      node = {
        type: "binary",
        operator: tokens[index++].type,
        left: node,
        right: addition(),
      };
    return node;
  }
  function addition() {
    let node = term();
    while (["+", "-"].includes(current().type))
      node = {
        type: "binary",
        operator: tokens[index++].type,
        left: node,
        right: term(),
      };
    return node;
  }
  function term() {
    let node = unary();
    while (["*", "/", "number", "name", "("].includes(current().type)) {
      const op = ["*", "/"].includes(current().type)
        ? tokens[index++].type
        : "*";
      node = { type: "binary", operator: op, left: node, right: unary() };
    }
    return node;
  }
  function unary() {
    if (["+", "-"].includes(current().type))
      return {
        type: "unary",
        operator: tokens[index++].type,
        value: nested(unary),
      };
    let node = primary();
    while (["!", "°", "["].includes(current().type)) {
      if (current().type === "[") {
        take("[");
        const args = [nested(expression)];
        if (current().type === ",") {
          take(",");
          args.push(nested(expression));
        }
        take("]");
        node = { type: "index", value: node, arguments: args };
      } else
        node = { type: "postfix", operator: tokens[index++].type, value: node };
    }
    if (current().type === "^")
      node = {
        type: "binary",
        operator: take("^").type,
        left: node,
        right: nested(unary),
      };
    return node;
  }
  function primary() {
    if (current().type === "number")
      return { type: "number", value: tokens[index++].value };
    if (current().type === "name") {
      const name = tokens[index++].value;
      if (current().type !== "(") return { type: "name", name };
      take("(");
      const args = nested(() => argumentsList(")"));
      take(")");
      return { type: "call", name, arguments: args };
    }
    if (current().type === "(") {
      take("(");
      const node = nested(expression);
      take(")");
      return node;
    }
    if (["{", "["].includes(current().type)) {
      const open = tokens[index++].type,
        close = open === "{" ? "}" : "]";
      const items = nested(() => argumentsList(close));
      take(close);
      if (!items.length || items.length > 1000)
        throw new Error("Use 1–1000 list entries.");
      return { type: "list", items, bracket: open };
    }
    throw new Error("Expression is incomplete.");
  }
  function argumentsList(close) {
    const args = [];
    if (current().type !== close) {
      args.push(expression());
      while (current().type === ",") {
        take(",");
        args.push(expression());
      }
    }
    return args;
  }
  const tree = expression();
  if (current().type !== "end")
    throw new Error(`Unexpected “${current().value}”.`);
  return tree;
}
function evaluate(node, variables, mode, context) {
  if (--context.remaining < 0)
    throw new Error(
      "Calculation limit reached; simplify the expression or range.",
    );
  if (node.type === "number") return node.value;
  if (node.type === "list") {
    const result = node.items.map((item) =>
      evaluate(item, variables, mode, context),
    );
    if (!validValue(result)) throw new Error("Invalid list or matrix.");
    return result;
  }
  if (node.type === "name") {
    if (Object.hasOwn(variables, node.name)) {
      if (!validValue(variables[node.name]))
        throw new Error(`“${node.name}” is not a numeric value.`);
      return variables[node.name];
    }
    if (Object.hasOwn(CONSTANTS, node.name)) return CONSTANTS[node.name];
    throw new Error(`Unknown value “${node.name}”.`);
  }
  const run = (n) => evaluate(n, variables, mode, context);
  if (node.type === "index") {
    let value = run(node.value);
    for (const n of node.arguments) {
      const k = real(run(n));
      if (
        !Array.isArray(value) ||
        !Number.isInteger(k) ||
        k < 1 ||
        k > value.length
      )
        throw new Error(
          "Index is outside the list or matrix (indices start at 1).",
        );
      value = value[k - 1];
    }
    return value;
  }
  if (node.type === "unary")
    return node.operator === "-"
      ? binaryValue("*", -1, run(node.value))
      : run(node.value);
  if (node.type === "postfix")
    return unaryValue(
      run(node.value),
      node.operator === "!"
        ? factorial
        : (v) => real(v) * (mode === "radian" ? Math.PI / 180 : 1),
    );
  if (node.type === "binary")
    return binaryValue(node.operator, run(node.left), run(node.right));
  const args = node.arguments;
  if (node.name === "when") {
    if (args.length !== 3)
      throw new Error(
        "when(condition, true value, false value) needs three arguments.",
      );
    return run(args[real(run(args[0])) ? 1 : 2]);
  }
  if (
    ["seq", "sum", "product", "nderiv", "nint"].includes(node.name) &&
    args.length > 1
  ) {
    const [expr, variable, from, to, step] = args;
    if (variable?.type !== "name" || reservedName(variable.name))
      throw new Error("Use a variable name as the second argument.");
    const valueAt = (x) =>
      evaluate(expr, { ...variables, [variable.name]: x }, mode, context);
    if (node.name === "nderiv") {
      if (args.length !== 3)
        throw new Error("Use nDeriv(expression, variable, at).");
      return numericalDerivative((x) => real(valueAt(x)), real(run(from)));
    }
    if (node.name === "nint") {
      if (args.length !== 4)
        throw new Error("Use nInt(expression, variable, lower, upper).");
      return numericalIntegral(
        (x) => real(valueAt(x)),
        real(run(from)),
        real(run(to)),
      );
    }
    if (![4, 5].includes(args.length))
      throw new Error(
        "Use expression, variable, start, end and optional step.",
      );
    const a = real(run(from)),
      b = real(run(to)),
      h = step ? real(run(step)) : 1;
    if (!h || (b - a) / h < 0)
      throw new Error("Sequence step must move from start toward end.");
    const count = Math.floor((b - a) / h + 1e-12) + 1;
    if (count < 1 || count > 1000)
      throw new Error("Sequence is limited to 1000 terms.");
    const values = Array.from({ length: count }, (_, k) => valueAt(a + k * h));
    return node.name === "seq"
      ? values
      : values.reduce(
          (v, x) => binaryValue(node.name === "sum" ? "+" : "*", v, x),
          node.name === "sum" ? 0 : 1,
        );
  }
  const values = args.map(run);
  if (Object.hasOwn(FUNCTIONS, node.name)) {
    const counts = ARITY[node.name] ?? [1];
    if (
      ["min", "max"].includes(node.name)
        ? !values.length
        : !counts.includes(values.length)
    )
      throw new Error(`${node.name} has the wrong number of arguments.`);
    if (["sin", "cos", "tan"].includes(node.name) && mode === "degree")
      values[0] = binaryValue("*", values[0], Math.PI / 180);
    if (node.name === "polar" && mode === "degree")
      values[1] = (real(values[1]) * Math.PI) / 180;
    let result = FUNCTIONS[node.name](...values);
    if (
      ["asin", "acos", "atan", "atan2", "angle"].includes(node.name) &&
      mode === "degree"
    )
      result = binaryValue("*", result, 180 / Math.PI);
    if (!validValue(result))
      throw new Error("Result is undefined or outside the supported range.");
    return result;
  }
  const fn = Object.hasOwn(variables, node.name) ? variables[node.name] : null;
  if (fn?.kind !== "function")
    throw new Error(`Unknown function “${node.name}”.`);
  if (values.length !== fn.parameters.length)
    throw new Error(`${node.name} needs ${fn.parameters.length} arguments.`);
  if (++context.calls > 32) throw new Error("Function recursion is too deep.");
  const result = evaluate(
    parseExpression(fn.source),
    {
      ...variables,
      ...Object.fromEntries(fn.parameters.map((name, i) => [name, values[i]])),
    },
    mode,
    context,
  );
  context.calls--;
  return result;
}
export function compileExpression(source, mode = "radian") {
  if (!["radian", "degree"].includes(mode))
    throw new Error("Unknown angle mode.");
  const tree = parseExpression(source);
  return (variables = {}) =>
    evaluate(tree, variables, mode, { remaining: 50000, calls: 0 });
}
