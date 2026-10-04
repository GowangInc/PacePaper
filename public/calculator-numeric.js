import {
  logGamma,
  normalCdf,
  inverseNormal,
} from "./calculator-distributions.js";
export { normalCdf, inverseNormal } from "./calculator-distributions.js";

function checkedRange(lower, upper) {
  if (
    !Number.isFinite(lower) ||
    !Number.isFinite(upper) ||
    lower >= upper ||
    upper - lower > 1e9
  ) {
    throw new Error("Use finite bounds with the minimum below the maximum.");
  }
}

function bisect(fn, lower, upper, fLower, fUpper) {
  const residualScale = Math.min(Math.abs(fLower), Math.abs(fUpper));
  let left = lower,
    right = upper,
    leftValue = fLower;
  for (let iteration = 0; iteration < 80; iteration++) {
    const middle = left + (right - left) / 2,
      value = fn(middle);
    if (!Number.isFinite(value)) return null;
    if (value === 0) return middle;
    if (
      middle === left ||
      middle === right ||
      right - left < 1e-13 * Math.max(1, Math.abs(middle))
    )
      return Math.abs(value) <= 1e-8 * residualScale ? middle : null;
    if (Math.sign(leftValue) !== Math.sign(value)) right = middle;
    else {
      left = middle;
      leftValue = value;
    }
  }
  return null;
}
export function numericalRoots(fn, lower, upper, resolution = 400) {
  checkedRange(lower, upper);
  if (!Number.isInteger(resolution) || resolution < 10 || resolution > 2000)
    throw new Error("Root-search resolution must be 10–2000.");
  const points = Array.from({ length: resolution + 1 }, (_, k) => {
    const x = lower + ((upper - lower) * k) / resolution;
    try {
      const y = fn(x);
      return { x, y: Number.isFinite(y) ? y : NaN };
    } catch {
      return { x, y: NaN };
    }
  });
  const scale = Math.max(
    ...points.map((p) => (Number.isFinite(p.y) ? Math.abs(p.y) : 0)),
  );
  if (!scale)
    throw new Error(
      "No isolated roots: the sampled function is zero throughout or undefined.",
    );
  const normalized = (x) => fn(x) / scale,
    roots = points.filter((p) => p.y === 0).map((p) => p.x);
  for (let k = 1; k < points.length; k++) {
    const left = points[k - 1],
      right = points[k];
    if (
      Number.isFinite(left.y) &&
      Number.isFinite(right.y) &&
      Math.sign(left.y) !== Math.sign(right.y) &&
      left.y !== 0 &&
      right.y !== 0
    ) {
      try {
        const root = bisect(fn, left.x, right.x, left.y, right.y);
        if (root !== null) roots.push(root);
      } catch {
        /* A discontinuity is not a root. */
      }
    }
    if (k >= points.length - 1) continue;
    const after = points[k + 1];
    if (
      ![left.y, right.y, after.y].every(Number.isFinite) ||
      right.y === 0 ||
      Math.abs(right.y) >= Math.abs(left.y) ||
      Math.abs(right.y) >= Math.abs(after.y)
    )
      continue;
    // Minimise |f| locally to find touching roots without a sign change.
    let a = left.x,
      b = after.x;
    const ratio = (Math.sqrt(5) - 1) / 2;
    try {
      for (let iteration = 0; iteration < 80; iteration++) {
        const p = b - ratio * (b - a),
          q = a + ratio * (b - a);
        if (Math.abs(normalized(p)) <= Math.abs(normalized(q))) b = q;
        else a = p;
      }
      const root = (a + b) / 2;
      if (
        Math.abs(normalized(root)) < 1e-12 &&
        Math.abs(fn(root)) < Math.abs(right.y) * 1e-6
      )
        roots.push(root);
    } catch {
      /* Skip undefined neighborhoods. */
    }
  }
  roots.sort((a, b) => a - b);
  return roots.filter(
    (root, i) =>
      i === 0 ||
      Math.abs(root - roots[i - 1]) > 1e-7 * Math.max(1, Math.abs(root)),
  );
}

export function numericalDerivative(fn, x) {
  if (!Number.isFinite(x)) throw new Error("Enter a finite x value.");
  const step = 0.0001 * Math.max(1, Math.abs(x));
  const result =
    (-fn(x + 2 * step) +
      8 * fn(x + step) -
      8 * fn(x - step) +
      fn(x - 2 * step)) /
    (12 * step);
  if (!Number.isFinite(result))
    throw new Error("The derivative is undefined at that x value.");
  return result;
}

export function numericalIntegral(fn, lower, upper, tolerance = 1e-8) {
  if (lower === upper) return 0;
  const sign = lower > upper ? -1 : 1;
  const a = Math.min(lower, upper);
  const b = Math.max(lower, upper);
  checkedRange(a, b);
  const midpoint = (a + b) / 2;
  const fa = fn(a),
    fm = fn(midpoint),
    fb = fn(b);
  if (![fa, fm, fb].every(Number.isFinite))
    throw new Error("The function is undefined within the integration range.");
  const simpson = (left, right, fLeft, fMiddle, fRight) =>
    ((right - left) * (fLeft + 4 * fMiddle + fRight)) / 6;
  function refine(
    left,
    right,
    fLeft,
    fMiddle,
    fRight,
    whole,
    remaining,
    depth,
  ) {
    const middle = (left + right) / 2;
    const leftMiddle = (left + middle) / 2;
    const rightMiddle = (middle + right) / 2;
    const fLeftMiddle = fn(leftMiddle),
      fRightMiddle = fn(rightMiddle);
    if (![fLeftMiddle, fRightMiddle].every(Number.isFinite))
      throw new Error(
        "The function is undefined within the integration range.",
      );
    const leftArea = simpson(left, middle, fLeft, fLeftMiddle, fMiddle);
    const rightArea = simpson(middle, right, fMiddle, fRightMiddle, fRight);
    const delta = leftArea + rightArea - whole;
    if (depth <= 0 || Math.abs(delta) <= 15 * remaining)
      return leftArea + rightArea + delta / 15;
    return (
      refine(
        left,
        middle,
        fLeft,
        fLeftMiddle,
        fMiddle,
        leftArea,
        remaining / 2,
        depth - 1,
      ) +
      refine(
        middle,
        right,
        fMiddle,
        fRightMiddle,
        fRight,
        rightArea,
        remaining / 2,
        depth - 1,
      )
    );
  }
  return (
    sign * refine(a, b, fa, fm, fb, simpson(a, b, fa, fm, fb), tolerance, 16)
  );
}

export function numericalExtremum(fn, lower, upper, kind = "maximum") {
  checkedRange(lower, upper);
  const minimize = kind === "minimum";
  const points = Array.from({ length: 401 }, (_, index) => {
    const x = lower + ((upper - lower) * index) / 400;
    let y;
    try {
      y = fn(x);
    } catch {
      y = Number.NaN;
    }
    return { x, y };
  });
  const candidates = [points[0], points.at(-1)].filter((point) =>
    Number.isFinite(point.y),
  );
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index],
      before = points[index - 1],
      after = points[index + 1];
    const isCandidate =
      [point.y, before.y, after.y].every(Number.isFinite) &&
      (minimize
        ? point.y <= before.y && point.y <= after.y
        : point.y >= before.y && point.y >= after.y);
    if (!isCandidate) continue;
    let left = before.x,
      right = after.x;
    const ratio = (Math.sqrt(5) - 1) / 2;
    let first = right - ratio * (right - left);
    let second = left + ratio * (right - left);
    const score = (x) => {
      try {
        const value = fn(x);
        return Number.isFinite(value)
          ? minimize
            ? value
            : -value
          : Number.POSITIVE_INFINITY;
      } catch {
        return Number.POSITIVE_INFINITY;
      }
    };
    let firstScore = score(first),
      secondScore = score(second);
    for (let iteration = 0; iteration < 48; iteration += 1) {
      if (firstScore <= secondScore) {
        right = second;
        second = first;
        secondScore = firstScore;
        first = right - ratio * (right - left);
        firstScore = score(first);
      } else {
        left = first;
        first = second;
        firstScore = secondScore;
        second = left + ratio * (right - left);
        secondScore = score(second);
      }
    }
    const x = (left + right) / 2;
    let y;
    try {
      y = fn(x);
    } catch {
      y = Number.NaN;
    }
    if (Number.isFinite(y)) candidates.push({ x, y });
  }
  if (!candidates.length)
    throw new Error("No defined function values were found in this range.");
  return candidates.reduce((best, candidate) =>
    (minimize ? candidate.y < best.y : candidate.y > best.y) ? candidate : best,
  );
}

function binomialMass(n, p, k) {
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(
    logGamma(n + 1) -
      logGamma(k + 1) -
      logGamma(n - k + 1) +
      k * Math.log(p) +
      (n - k) * Math.log1p(-p),
  );
}

export function binomialProbability(n, p, value, tail = "exact") {
  if (
    !Number.isInteger(n) ||
    n < 0 ||
    n > 1000 ||
    !Number.isFinite(p) ||
    p < 0 ||
    p > 1 ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      "Use whole-number n from 0 to 1000, p from 0 to 1, and a whole-number x.",
    );
  }
  if (!["exact", "atMost", "atLeast"].includes(tail))
    throw new Error("Unknown binomial tail.");
  if (tail === "exact" && (value < 0 || value > n)) return 0;
  if (tail === "atMost" && value < 0) return 0;
  if (tail === "atLeast" && value > n) return 0;
  if (tail === "exact") return binomialMass(n, p, value);
  const start = tail === "atLeast" ? Math.max(0, value) : 0;
  const end = tail === "atMost" ? Math.min(n, value) : n;
  let total = 0;
  for (let k = start; k <= end; k += 1) total += binomialMass(n, p, k);
  return Math.min(1, Math.max(0, total));
}

export function summarizeData(values) {
  if (!values.length || values.some((value) => !Number.isFinite(value)))
    throw new Error("Enter at least one finite data value.");
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const quantile = (position) => {
    const lower = Math.floor(position),
      fraction = position - lower;
    return (
      sorted[lower] +
      (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) *
        fraction
    );
  };
  const squaredDifferences = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  );
  return {
    count: values.length,
    mean,
    median: quantile((values.length - 1) / 2),
    q1: quantile((values.length - 1) / 4),
    q3: quantile((3 * (values.length - 1)) / 4),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    populationSd: Math.sqrt(squaredDifferences / values.length),
    sampleSd:
      values.length > 1
        ? Math.sqrt(squaredDifferences / (values.length - 1))
        : Number.NaN,
  };
}

export function linearRegression(xValues, yValues) {
  if (
    xValues.length < 2 ||
    xValues.length !== yValues.length ||
    [...xValues, ...yValues].some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      "Enter at least two finite x-y pairs with matching counts.",
    );
  }
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / xValues.length;
  const yMean = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const xx = xValues.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  const yy = yValues.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  if (xx === 0) throw new Error("Regression needs variation in the x values.");
  const xy = xValues.reduce(
    (sum, value, index) => sum + (value - xMean) * (yValues[index] - yMean),
    0,
  );
  const slope = xy / xx;
  return {
    slope,
    intercept: yMean - slope * xMean,
    r: yy === 0 ? Number.NaN : xy / Math.sqrt(xx * yy),
    rSquared: yy === 0 ? Number.NaN : (xy * xy) / (xx * yy),
  };
}
