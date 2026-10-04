import { multiply, matrixPower } from "./calculator-matrix.js";
export const isComplex = (v) => v?.kind === "complex";
export const isMatrix = (v) => Array.isArray(v) && Array.isArray(v[0]);
export function complex(re, im = 0) {
  if (![re, im].every(Number.isFinite))
    throw new Error("Complex result is outside the supported range.");
  return im === 0 ? re : { kind: "complex", re, im };
}
const parts = (v) => (isComplex(v) ? [v.re, v.im] : [real(v), 0]);
export function real(v) {
  if (!Number.isFinite(v))
    throw new Error("Result is undefined or outside the supported real range.");
  return v;
}
export function validValue(v, depth = 0) {
  if (depth > 3) return false;
  if (Number.isFinite(v)) return true;
  if (isComplex(v)) return Number.isFinite(v.re) && Number.isFinite(v.im);
  if (Array.isArray(v))
    return (
      v.length > 0 &&
      v.length <= 1000 &&
      v.every((item) => validValue(item, depth + 1))
    );
  return false;
}
export function unaryValue(v, fn) {
  return Array.isArray(v) ? v.map((item) => unaryValue(item, fn)) : fn(v);
}
export function complexLog(v) {
  const [a, b] = parts(v);
  return complex(Math.log(Math.hypot(a, b)), Math.atan2(b, a));
}
export function complexExp(v) {
  const [a, b] = parts(v),
    magnitude = Math.exp(a);
  return complex(magnitude * Math.cos(b), magnitude * Math.sin(b));
}
export function binaryValue(op, a, b) {
  if (isMatrix(a) && isMatrix(b) && op === "*") return multiply(a, b);
  if (isMatrix(a) && op === "^") return matrixPower(a, real(b));
  if (Array.isArray(a) || Array.isArray(b)) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length || isMatrix(a) !== isMatrix(b))
        throw new Error("List or matrix dimensions do not agree.");
      return a.map((v, i) => binaryValue(op, v, b[i]));
    }
    return Array.isArray(a)
      ? a.map((v) => binaryValue(op, v, b))
      : b.map((v) => binaryValue(op, a, v));
  }
  if (["=", "!=", "<", ">", "<=", ">="].includes(op)) {
    const x = real(a),
      y = real(b);
    return Number(
      {
        "=": x === y,
        "!=": x !== y,
        "<": x < y,
        ">": x > y,
        "<=": x <= y,
        ">=": x >= y,
      }[op],
    );
  }
  if (
    isComplex(a) ||
    isComplex(b) ||
    (op === "^" && a < 0 && !Number.isInteger(b))
  ) {
    if (
      op === "^" &&
      typeof b === "number" &&
      Number.isInteger(b) &&
      Math.abs(b) <= 1000
    ) {
      let n = Math.abs(b),
        value = 1,
        base = a;
      while (n) {
        if (n % 2) value = binaryValue("*", value, base);
        n = Math.floor(n / 2);
        if (n) base = binaryValue("*", base, base);
      }
      return b < 0 ? binaryValue("/", 1, value) : value;
    }
    const [x, y] = parts(a),
      [u, v] = parts(b);
    if (op === "+") return complex(x + u, y + v);
    if (op === "-") return complex(x - u, y - v);
    if (op === "*") return complex(x * u - y * v, x * v + y * u);
    if (op === "/") {
      const scale = Math.max(Math.abs(u), Math.abs(v));
      if (!scale) throw new Error("Division by zero.");
      const ur = u / scale,
        vr = v / scale,
        d = ur * ur + vr * vr;
      return complex(
        ((x / scale) * ur + (y / scale) * vr) / d,
        ((y / scale) * ur - (x / scale) * vr) / d,
      );
    }
    return complexExp(binaryValue("*", b, complexLog(a)));
  }
  const result = {
    "+": () => a + b,
    "-": () => a - b,
    "*": () => a * b,
    "/": () => a / b,
    "^": () => a ** b,
  }[op]?.();
  return real(result);
}
export function formatValue(v) {
  if (Array.isArray(v))
    return isMatrix(v)
      ? `[${v.map((row) => `[${row.map(formatValue).join(", ")}]`).join(", ")}]`
      : `{${v.map(formatValue).join(", ")}}`;
  if (isComplex(v))
    return `${formatValue(v.re)} ${v.im < 0 ? "−" : "+"} ${formatValue(Math.abs(v.im))}i`;
  if (v?.kind === "function")
    return `${v.name}(${v.parameters.join(",")}) := ${v.source}`;
  real(v);
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  return Number(v.toPrecision(12)).toString();
}
