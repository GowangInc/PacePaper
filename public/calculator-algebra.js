import { binaryValue, complex, isComplex, real } from "./calculator-values.js";
import { matrix } from "./calculator-matrix.js";
export function polynomialRoots(coefficients) {
  if (
    !Array.isArray(coefficients) ||
    coefficients.length < 2 ||
    coefficients.length > 7 ||
    !coefficients.every(Number.isFinite)
  )
    throw new Error(
      "Use 2–7 real coefficients, highest power first (degree ≤6).",
    );
  const c = [...coefficients];
  while (c.length > 1 && c[0] === 0) c.shift();
  const n = c.length - 1;
  if (!n) throw new Error("A non-constant polynomial is required.");
  if (n === 1) return [real(-c[1] / c[0])];
  if (n === 2) {
    const scale = Math.max(...c.map(Math.abs)),
      [a, b, d] = c.map((v) => v / scale),
      discriminant = b * b - 4 * a * d;
    if (discriminant < 0) {
      const re = -b / (2 * a),
        im = Math.sqrt(-discriminant) / (2 * Math.abs(a));
      return [complex(re, -im), complex(re, im)];
    }
    const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
    return q === 0 ? [0, 0] : [real(q / a), real(d / q)].sort((x, y) => x - y);
  }
  const monic = c.map((v) => real(v / c[0])),
    radius = 1 + Math.max(...monic.slice(1).map(Math.abs));
  if (radius > 1e30)
    throw new Error(
      "Polynomial coefficients are too poorly scaled; rescale the variable.",
    );
  let roots = Array.from({ length: n }, (_, k) =>
    complex(
      radius * Math.cos((2 * Math.PI * (k + 0.23)) / n),
      radius * Math.sin((2 * Math.PI * (k + 0.23)) / n),
    ),
  );
  const magnitude = (v) =>
    isComplex(v) ? Math.hypot(v.re, v.im) : Math.abs(v);
  for (let iteration = 0; iteration < 1000; iteration++) {
    let largest = 0;
    const next = roots.map((z, i) => {
      const value = monic.reduce(
        (sum, coefficient) =>
          binaryValue("+", binaryValue("*", sum, z), coefficient),
        0,
      );
      const denominator = roots.reduce(
        (prod, other, j) =>
          j === i ? prod : binaryValue("*", prod, binaryValue("-", z, other)),
        1,
      );
      if (!magnitude(denominator))
        throw new Error(
          "Polynomial roots did not separate; try numerical solve in narrower bounds.",
        );
      const correction = binaryValue("/", value, denominator);
      largest = Math.max(
        largest,
        magnitude(correction) / Math.max(1, magnitude(z)),
      );
      return binaryValue("-", z, correction);
    });
    roots = next;
    if (largest < 1e-12)
      return roots.sort(
        (a, b) => (isComplex(a) ? a.re : a) - (isComplex(b) ? b.re : b),
      );
  }
  throw new Error(
    "Polynomial roots did not converge; repeated roots may require numerical solve or factorisation.",
  );
}
export function eigenvalues2(a) {
  const m = matrix(a, true);
  if (m.length !== 2) throw new Error("eigvals2 supports 2 × 2 matrices.");
  return polynomialRoots([
    1,
    -(m[0][0] + m[1][1]),
    m[0][0] * m[1][1] - m[0][1] * m[1][0],
  ]);
}
function vector(v) {
  if (
    !Array.isArray(v) ||
    v.length < 1 ||
    v.length > 20 ||
    !v.every(Number.isFinite)
  )
    throw new Error("Use a real vector with 1–20 entries.");
  return v;
}
export function dot(a, b) {
  vector(a);
  vector(b);
  if (a.length !== b.length) throw new Error("Vector lengths must match.");
  return a.reduce((s, v, k) => s + v * b[k], 0);
}
export function cross(a, b) {
  vector(a);
  vector(b);
  if (a.length !== 3 || b.length !== 3)
    throw new Error("Cross product needs two 3D vectors.");
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
export const algebraFunctions = {
  polyroots: polynomialRoots,
  eigvals2: eigenvalues2,
  dotp: dot,
  crossp: cross,
  norm: (v) => Math.hypot(...vector(v)),
};
