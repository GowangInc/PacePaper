// Original numeric matrix routines. Inputs are bounded to keep the handheld responsive.
export function matrix(value, square = false) {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 20 ||
    !value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === value[0].length &&
        row.length > 0 &&
        row.length <= 20 &&
        row.every(Number.isFinite),
    )
  )
    throw new Error("Use a rectangular real matrix, at most 20 × 20.");
  if (square && value.length !== value[0].length)
    throw new Error("Use a square matrix.");
  return value.map((row) => [...row]);
}
export function identity(n) {
  if (!Number.isInteger(n) || n < 1 || n > 20)
    throw new Error("Matrix size must be 1–20.");
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => Number(r === c)),
  );
}
export function transpose(a) {
  const m = matrix(a);
  return m[0].map((_, c) => m.map((row) => row[c]));
}
export function multiply(a, b) {
  const left = matrix(a),
    right = matrix(b);
  if (left[0].length !== right.length)
    throw new Error("Matrix dimensions do not agree for multiplication.");
  return left.map((row) =>
    right[0].map((_, c) => row.reduce((sum, v, k) => sum + v * right[k][c], 0)),
  );
}
export function augment(a, b) {
  const left = matrix(a),
    right = matrix(b);
  if (left.length !== right.length || left[0].length + right[0].length > 20)
    throw new Error(
      "Augment needs matching row counts and at most 20 columns.",
    );
  return left.map((row, i) => [...row, ...right[i]]);
}
export function determinant(a) {
  const m = matrix(a, true);
  let result = 1;
  for (let c = 0; c < m.length; c++) {
    let pivot = c;
    for (let r = c + 1; r < m.length; r++)
      if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    if (m[pivot][c] === 0) return 0;
    if (pivot !== c) {
      [m[c], m[pivot]] = [m[pivot], m[c]];
      result *= -1;
    }
    result *= m[c][c];
    for (let r = c + 1; r < m.length; r++) {
      const factor = m[r][c] / m[c][c];
      for (let k = c + 1; k < m.length; k++) m[r][k] -= factor * m[c][k];
    }
  }
  return result;
}
export function rref(a) {
  const m = matrix(a);
  let row = 0;
  // Scale each row first; a small but uniformly scaled matrix remains meaningful.
  for (const r of m) {
    const scale = Math.max(...r.map(Math.abs));
    if (scale) for (let c = 0; c < r.length; c++) r[c] /= scale;
  }
  for (let c = 0; c < m[0].length && row < m.length; c++) {
    let pivot = row;
    for (let r = row + 1; r < m.length; r++)
      if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    if (Math.abs(m[pivot][c]) < 1e-12) continue;
    [m[row], m[pivot]] = [m[pivot], m[row]];
    const divisor = m[row][c];
    for (let k = 0; k < m[0].length; k++) m[row][k] /= divisor;
    for (let r = 0; r < m.length; r++)
      if (r !== row) {
        const factor = m[r][c];
        for (let k = 0; k < m[0].length; k++) m[r][k] -= factor * m[row][k];
        m[r][c] = 0;
      }
    row++;
  }
  return m;
}
export function inverse(a) {
  const m = matrix(a, true),
    n = m.length;
  // Partial pivot elimination; reject a singular matrix without silently returning a pseudo-inverse.
  const work = m.map((row, i) => [...row, ...identity(n)[i]]);
  const scales = m.map((row) => Math.max(...row.map(Math.abs)));
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++)
      if (
        Math.abs(work[r][c]) / scales[r] >
        Math.abs(work[pivot][c]) / scales[pivot]
      )
        pivot = r;
    if (
      !scales[pivot] ||
      Math.abs(work[pivot][c]) <= Number.EPSILON * n * scales[pivot]
    )
      throw new Error("Matrix is singular or too ill-conditioned to invert.");
    [work[c], work[pivot]] = [work[pivot], work[c]];
    [scales[c], scales[pivot]] = [scales[pivot], scales[c]];
    const divisor = work[c][c];
    for (let k = 0; k < 2 * n; k++) work[c][k] /= divisor;
    for (let r = 0; r < n; r++)
      if (r !== c) {
        const factor = work[r][c];
        for (let k = 0; k < 2 * n; k++) work[r][k] -= factor * work[c][k];
      }
  }
  return work.map((row) => row.slice(n));
}
export function solveSystem(a, b) {
  const m = matrix(a, true);
  if (!Array.isArray(b) || b.length !== m.length || !b.every(Number.isFinite))
    throw new Error("Use one right-hand-side value per equation.");
  return multiply(
    inverse(m),
    b.map((v) => [v]),
  ).map((row) => row[0]);
}
export function matrixPower(a, exponent) {
  const m = matrix(a, true);
  if (!Number.isInteger(exponent) || Math.abs(exponent) > 100)
    throw new Error("Use an integer matrix power from −100 to 100.");
  let result = identity(m.length),
    base = exponent < 0 ? inverse(m) : m,
    n = Math.abs(exponent);
  while (n) {
    if (n % 2) result = multiply(result, base);
    n = Math.floor(n / 2);
    if (n) base = multiply(base, base);
  }
  return result;
}
