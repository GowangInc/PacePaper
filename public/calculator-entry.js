// Entry state follows the Scratchpad: stored variables, Ans and reusable history.
export function evaluateHandheldEntry(source, compile, angleMode, variables = {}, ans = 0) {
  const store = source.match(/^(.+?)\s*→\s*([a-z][a-z0-9_]*)$/iu);
  const assignment = source.match(/^([a-z][a-z0-9_]*)\s*:=\s*(.+)$/iu);
  const name = (store?.[2] ?? assignment?.[1])?.toLowerCase();
  if (name && ["pi", "e", "ans", "constructor", "prototype", "__proto__"].includes(name)) throw new Error("This variable name is reserved.");
  const expression = store?.[1] ?? assignment?.[2] ?? source;
  const value = compile(expression, angleMode)({ ...variables, ans });
  return { value, variables: name ? { ...variables, [name]: value } : variables };
}

export function fractionResult(source, value) {
  // Only integer arithmetic can be displayed as an exact rational here.
  if (!source.includes("/") || !/^[\d\s()+*/−-]+$/u.test(source) || Number.isInteger(value)) return null;
  let remainder = Math.abs(value), numerator = 1, previousNumerator = 0, denominator = 0, previousDenominator = 1;
  for (let step = 0; step < 32; step += 1) {
    const whole = Math.floor(remainder);
    const nextNumerator = whole * numerator + previousNumerator;
    const nextDenominator = whole * denominator + previousDenominator;
    if (!Number.isSafeInteger(nextNumerator) || nextDenominator > 1e6) return null;
    previousNumerator = numerator; numerator = nextNumerator;
    previousDenominator = denominator; denominator = nextDenominator;
    if (Math.abs(numerator / denominator - Math.abs(value)) < 1e-13) return { numerator: value < 0 ? -numerator : numerator, denominator };
    const fractional = remainder - whole;
    if (!fractional) break;
    remainder = 1 / fractional;
  }
  return null;
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
    else if (item.type === "unary") {
      precedence = 3;
      result = mathNode("mrow", mathNode("mo", item.operator === "-" ? "−" : "+"), render(item.value, precedence));
    } else if (item.type === "postfix") result = mathNode("mrow", render(item.value, 6), mathNode("mo", item.operator));
    else if (item.type === "binary") {
      if (item.operator === "^") result = mathNode("msup", render(item.left, 5), render(item.right));
      else if (item.operator === "/") result = mathNode("mfrac", render(item.left), render(item.right));
      else {
        precedence = item.operator === "*" ? 2 : 1;
        result = mathNode("mrow", render(item.left, precedence), mathNode("mo", item.operator === "*" ? "×" : item.operator === "-" ? "−" : "+"), render(item.right, precedence + (item.operator === "-" ? 1 : 0)));
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
