import { parseExpression, reservedName, MAX_EXPRESSION_LENGTH } from "./calculator-engine.js";
export function functionDefinition(name, parameters, source) {
  name = name.toLowerCase();
  const args = parameters.map((p) => p.trim().toLowerCase());
  if (!/^[a-z][a-z0-9_]*$/u.test(name) || reservedName(name) || !args.length || args.length > 5 || new Set(args).size !== args.length || args.some((p) => !/^[a-z][a-z0-9_]*$/u.test(p) || reservedName(p))) throw new Error("Use distinct unreserved function and parameter names (at most 5).");
  parseExpression(source);
  return { kind: "function", name, parameters: args, source };
}
export function storeVariable(variables, name, value) {
  name = name.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]*$/u.test(name) || reservedName(name)) throw new Error("This variable name is invalid or reserved.");
  if (!Object.hasOwn(variables, name) && Object.keys(variables).length >= 100) throw new Error("At most 100 stored variables/functions are supported.");
  return { ...variables, [name]: value };
}
export function validFunction(value) {
  try { return value?.kind === "function" && typeof value.source === "string" && value.source.length <= MAX_EXPRESSION_LENGTH && Array.isArray(value.parameters) && functionDefinition(value.name, value.parameters, value.source).name === value.name; } catch { return false; }
}
// Stored values and function definitions remain serializable for the current sitting.
export function evaluateHandheldEntry(source, compile, angleMode, variables = {}, ans = 0) {
  const definition = source.match(/^([a-z][a-z0-9_]*)\s*\(([^()]*)\)\s*:=\s*(.+)$/iu);
  if (definition) {
    const value = functionDefinition(definition[1], definition[2].split(","), definition[3]);
    return { value, variables: storeVariable(variables, value.name, value) };
  }
  const store = source.match(/^(.+?)\s*→\s*([a-z][a-z0-9_]*)$/iu);
  const assignment = source.match(/^([a-z][a-z0-9_]*)\s*:=\s*(.+)$/iu);
  const name = (store?.[2] ?? assignment?.[1])?.toLowerCase();
  const expression = store?.[1] ?? assignment?.[2] ?? source;
  const value = compile(expression, angleMode)({ ...variables, ans });
  return { value, variables: name ? storeVariable(variables, name, value) : variables };
}

export function fractionResult(source, value) {
  // Compute integer arithmetic as rationals rather than guessing a fraction from a rounded float.
  if (typeof value !== "number" || !source.includes("/") || !/^[\d\s()+*/^−-]+$/u.test(source) || Number.isInteger(value)) return null;
  const gcd = (a, b) => { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a; };
  const reduce = (n, d) => { if (!d || n.toString().length > 150 || d.toString().length > 150) throw new Error("Rational limit."); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  function rational(node) {
    if (node.type === "number" && Number.isSafeInteger(node.value)) return [BigInt(node.value), 1n];
    if (node.type === "unary") { const [n, d] = rational(node.value); return [node.operator === "-" ? -n : n, d]; }
    if (node.type !== "binary") throw new Error("Not rational arithmetic.");
    const [a, b] = rational(node.left), [c, d] = rational(node.right);
    if (node.operator === "+") return reduce(a * d + c * b, b * d);
    if (node.operator === "-") return reduce(a * d - c * b, b * d);
    if (node.operator === "*") return reduce(a * c, b * d);
    if (node.operator === "/") return reduce(a * d, b * c);
    if (node.operator === "^" && d === 1n && c >= -100n && c <= 100n) return c < 0n ? reduce(b ** -c, a ** -c) : reduce(a ** c, b ** c);
    throw new Error("Unsupported rational operation.");
  }
  try {
    const [n, d] = rational(parseExpression(source)), numerator = Number(n), denominator = Number(d);
    return Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator) ? { numerator, denominator } : null;
  } catch { return null; }
}

export function entryAfterResult(value, token) {
  return /^[+*/^−-]/u.test(token) ? `ans${token}` : token;
}

// Native MathML gives history the same stacked fractions, roots and powers as a handheld.
export function mathExpression(tree) {
  const mathNode = (tag, ...children) => {
    const item = document.createElementNS("http://www.w3.org/1998/Math/MathML", tag);
    for (const child of children) item.append(typeof child === "string" ? document.createTextNode(child) : child);
    return item;
  };
  const grouped = (item) => mathNode("mrow", mathNode("mo", "("), item, mathNode("mo", ")"));
  function render(item, parentPrecedence = 0) {
    let result, precedence = 9;
    if (item.type === "number") result = mathNode("mn", String(item.value));
    else if (item.type === "name") result = mathNode("mi", item.name === "pi" ? "π" : item.name === "ans" ? "Ans" : item.name);
    else if (item.type === "list") {
      const row = mathNode("mrow");
      item.items.forEach((value, index) => { if (index) row.append(mathNode("mo", ",")); row.append(render(value)); });
      result = mathNode("mrow", mathNode("mo", item.bracket), row, mathNode("mo", item.bracket === "{" ? "}" : "]"));
    } else if (item.type === "index") {
      const row = mathNode("mrow"); item.arguments.forEach((value, index) => { if (index) row.append(mathNode("mo", ",")); row.append(render(value)); });
      result = mathNode("mrow", render(item.value), mathNode("mo", "["), row, mathNode("mo", "]"));
    } else if (item.type === "unary") {
      precedence = 3;
      result = mathNode("mrow", mathNode("mo", item.operator === "-" ? "−" : "+"), render(item.value, precedence));
    } else if (item.type === "postfix") result = mathNode("mrow", render(item.value, 6), mathNode("mo", item.operator));
    else if (item.type === "binary") {
      if (item.operator === "^") result = mathNode("msup", render(item.left, 5), render(item.right));
      else if (item.operator === "/") result = mathNode("mfrac", render(item.left), render(item.right));
      else {
        precedence = item.operator === "*" ? 2 : 1;
        result = mathNode("mrow", render(item.left, precedence), mathNode("mo", ({ "*": "×", "-": "−", "<=": "≤", ">=": "≥", "!=": "≠" })[item.operator] ?? item.operator), render(item.right, precedence + (item.operator === "-" ? 1 : 0)));
      }
    } else if (item.type === "call") {
      if (item.name === "sqrt") result = mathNode("msqrt", render(item.arguments[0]));
      else if (item.name === "exp") result = mathNode("msup", mathNode("mi", "e"), render(item.arguments[0]));
      else {
        const argumentsRow = mathNode("mrow");
        item.arguments.forEach((argument, index) => { if (index) argumentsRow.append(mathNode("mo", ",")); argumentsRow.append(render(argument)); });
        result = mathNode("mrow", mathNode("mi", item.name), grouped(argumentsRow));
      }
    }
    return precedence < parentPrecedence ? grouped(result) : result;
  }
  return mathNode("math", render(tree));
}
