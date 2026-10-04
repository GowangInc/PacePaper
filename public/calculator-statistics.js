import { summarizeData, linearRegression } from "./calculator-numeric.js";
import {
  normalTails,
  tTails,
  chiTails,
  fTails,
  inverseCdf,
  inverseNormal,
} from "./calculator-distributions.js";
export function dataList(v, min = 1) {
  if (
    !Array.isArray(v) ||
    v.length < min ||
    v.length > 1000 ||
    !v.every(Number.isFinite)
  )
    throw new Error(`Use a real list with ${min}–1000 values.`);
  return v;
}
export function frequencyData(values, frequencies) {
  dataList(values);
  dataList(frequencies);
  if (
    values.length !== frequencies.length ||
    frequencies.some((f) => !Number.isInteger(f) || f < 0) ||
    frequencies.reduce((s, f) => s + f, 0) > 1000
  )
    throw new Error(
      "Use matching non-negative integer frequencies, total at most 1000.",
    );
  return dataList(values.flatMap((v, i) => Array(frequencies[i]).fill(v)));
}
export function oneVariable(values, frequencies) {
  const data = frequencies
    ? frequencyData(values, frequencies)
    : dataList(values);
  const result = summarizeData(data);
  return {
    ...result,
    sampleSd: Number.isFinite(result.sampleSd) ? result.sampleSd : null,
    sum: data.reduce((s, v) => s + v, 0),
    sumSquares: data.reduce((s, v) => s + v * v, 0),
  };
}
// Householder QR avoids forming normal equations for polynomial least squares.
function leastSquares(rows, values) {
  const a = rows.map((row) => [...row]),
    b = [...values],
    n = a.length,
    p = a[0].length;
  if (n < p) throw new Error("There are too few points for this model.");
  for (let k = 0; k < p; k++) {
    const norm = Math.hypot(...a.slice(k).map((row) => row[k]));
    if (norm < 1e-12)
      throw new Error("The data cannot determine this model uniquely.");
    const v = a.slice(k).map((row) => row[k]);
    v[0] += Math.sign(v[0] || 1) * norm;
    const length = Math.hypot(...v);
    v.forEach((_, i) => {
      v[i] /= length;
    });
    for (let c = k; c < p; c++) {
      const dot = v.reduce((sum, z, i) => sum + z * a[k + i][c], 0);
      v.forEach((z, i) => {
        a[k + i][c] -= 2 * z * dot;
      });
    }
    const dot = v.reduce((sum, z, i) => sum + z * b[k + i], 0);
    v.forEach((z, i) => {
      b[k + i] -= 2 * z * dot;
    });
  }
  const result = Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--)
    result[i] =
      (b[i] -
        result
          .slice(i + 1)
          .reduce((sum, v, j) => sum + a[i][i + 1 + j] * v, 0)) /
      a[i][i];
  return result;
}
export function regression(xs, ys, model = "linear") {
  dataList(xs, 2);
  dataList(ys, 2);
  if (xs.length !== ys.length)
    throw new Error("x and y lists must have matching lengths.");
  let coefficients, predict, equation, transformedRSquared;
  if (["linear", "logarithmic", "exponential", "power"].includes(model)) {
    const logX = ["logarithmic", "power"].includes(model),
      logY = ["exponential", "power"].includes(model);
    if ((logX && xs.some((x) => x <= 0)) || (logY && ys.some((y) => y <= 0)))
      throw new Error(
        "This model needs positive values for logged coordinates.",
      );
    const fit = linearRegression(
      xs.map((x) => (logX ? Math.log(x) : x)),
      ys.map((y) => (logY ? Math.log(y) : y)),
    );
    const a = logY ? Math.exp(fit.intercept) : fit.intercept,
      b = fit.slope;
    coefficients = [a, b];
    transformedRSquared = Number.isFinite(fit.rSquared) ? fit.rSquared : null;
    predict = (x) =>
      logY
        ? a * Math.exp(b * (logX ? Math.log(x) : x))
        : a + b * (logX ? Math.log(x) : x);
    equation =
      model === "linear"
        ? "a + b·x"
        : model === "logarithmic"
          ? "a + b·ln(x)"
          : model === "exponential"
            ? "a·exp(b·x)"
            : "a·x^b";
  } else {
    const degree = { quadratic: 2, cubic: 3, quartic: 4 }[model];
    if (!degree) throw new Error("Unknown regression model.");
    const center = xs.reduce((s, x) => s + x, 0) / xs.length,
      scale = Math.max(...xs.map((x) => Math.abs(x - center)));
    if (!scale) throw new Error("Regression needs variation in x.");
    const scaled = leastSquares(
      xs.map((x) =>
        Array.from(
          { length: degree + 1 },
          (_, k) => ((x - center) / scale) ** k,
        ),
      ),
      ys,
    );
    coefficients = Array(degree + 1).fill(0);
    const choose = (n, k) => {
      let v = 1;
      for (let j = 1; j <= k; j++) v *= (n - j + 1) / j;
      return v;
    };
    scaled.forEach((v, k) => {
      for (let j = 0; j <= k; j++)
        coefficients[j] +=
          (v * choose(k, j) * (-center) ** (k - j)) / scale ** k;
    });
    predict = (x) =>
      scaled.reduceRight((sum, v) => sum * ((x - center) / scale) + v, 0);
    equation = coefficients
      .map((_, k) => `a${k}${k ? `·x^${k}` : ""}`)
      .join(" + ");
  }
  const residuals = ys.map((y, i) => y - predict(xs[i])),
    mean = ys.reduce((s, y) => s + y, 0) / ys.length;
  const sse = residuals.reduce((s, r) => s + r * r, 0),
    sst = ys.reduce((s, y) => s + (y - mean) ** 2, 0);
  return {
    coefficients,
    equation,
    residuals,
    rSquared: sst ? 1 - sse / sst : null,
    transformedRSquared,
    predict,
  };
}
const sample = (v) => {
  const s = oneVariable(dataList(v, 2));
  if (!s.sampleSd) throw new Error("Inference needs a sample with variation.");
  return s;
};
const level = (c) => {
  if (!(c > 0 && c < 1))
    throw new Error("Confidence level must be strictly between 0 and 1.");
  return c;
};
function pValue(tails, statistic, alternative) {
  const [left, right] = tails(statistic);
  if (alternative === "less") return left;
  if (alternative === "greater") return right;
  if (alternative !== "different")
    throw new Error("Choose less, greater or different.");
  return Math.min(1, 2 * Math.min(left, right));
}
function inference(
  estimate,
  nullValue,
  se,
  tails,
  confidence,
  alternative,
  df,
) {
  if (!Number.isFinite(nullValue) || !Number.isFinite(se) || se <= 0)
    throw new Error("Use a finite null value and a positive standard error.");
  level(confidence);
  const statistic = (estimate - nullValue) / se;
  const critical = inverseCdf(tails, (1 + confidence) / 2);
  return {
    estimate,
    standardError: se,
    statistic,
    pValue: pValue(tails, statistic, alternative),
    ...(df === undefined ? {} : { df }),
    confidence,
    lower: estimate - critical * se,
    upper: estimate + critical * se,
  };
}
export function meanInference(
  values,
  nullMean = 0,
  confidence = 0.95,
  alternative = "different",
  knownSd,
) {
  const s = knownSd === undefined ? sample(values) : oneVariable(values),
    sd = knownSd ?? s.sampleSd;
  if (knownSd !== undefined && (!Number.isFinite(knownSd) || knownSd <= 0))
    throw new Error("Known population σ must be positive.");
  return inference(
    s.mean,
    nullMean,
    sd / Math.sqrt(s.count),
    knownSd === undefined ? (x) => tTails(x, s.count - 1) : normalTails,
    confidence,
    alternative,
    knownSd === undefined ? s.count - 1 : undefined,
  );
}
export function twoMeanInference(
  first,
  second,
  difference = 0,
  confidence = 0.95,
  alternative = "different",
  paired = false,
) {
  if (paired) {
    dataList(first, 2);
    dataList(second, 2);
    if (first.length !== second.length)
      throw new Error("Paired samples must have equal lengths.");
    return meanInference(
      first.map((v, i) => v - second[i]),
      difference,
      confidence,
      alternative,
    );
  }
  const a = sample(first),
    b = sample(second),
    va = a.sampleSd ** 2 / a.count,
    vb = b.sampleSd ** 2 / b.count;
  const df =
    (va + vb) ** 2 / (va ** 2 / (a.count - 1) + vb ** 2 / (b.count - 1));
  return inference(
    a.mean - b.mean,
    difference,
    Math.sqrt(va + vb),
    (x) => tTails(x, df),
    confidence,
    alternative,
    df,
  );
}
function counts(x, n) {
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(x) || x < 0 || x > n)
    throw new Error("Use integer counts with 0 ≤ successes ≤ sample size.");
}
export function proportionInference(
  x,
  n,
  p0 = 0.5,
  confidence = 0.95,
  alternative = "different",
) {
  counts(x, n);
  if (!(p0 > 0 && p0 < 1))
    throw new Error("Null proportion must be strictly between 0 and 1.");
  level(confidence);
  const p = x / n,
    result = inference(
      p,
      p0,
      Math.sqrt((p0 * (1 - p0)) / n),
      normalTails,
      confidence,
      alternative,
    );
  const margin =
    inverseNormal((1 + confidence) / 2) * Math.sqrt((p * (1 - p)) / n);
  return {
    ...result,
    lower: p - margin,
    upper: p + margin,
    note: "Normal approximation; interval uses sample proportion. Check success/failure conditions.",
  };
}
export function twoProportionInference(
  x1,
  n1,
  x2,
  n2,
  confidence = 0.95,
  alternative = "different",
) {
  counts(x1, n1);
  counts(x2, n2);
  level(confidence);
  const a = x1 / n1,
    b = x2 / n2,
    pooled = (x1 + x2) / (n1 + n2);
  const result = inference(
    a - b,
    0,
    Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2)),
    normalTails,
    confidence,
    alternative,
  );
  const margin =
    inverseNormal((1 + confidence) / 2) *
    Math.sqrt((a * (1 - a)) / n1 + (b * (1 - b)) / n2);
  return {
    ...result,
    lower: a - b - margin,
    upper: a - b + margin,
    note: "Pooled null test; unpooled normal interval. Check success/failure conditions.",
  };
}
export function chiGoodness(observed, expected, estimatedParameters = 0) {
  dataList(observed, 2);
  dataList(expected, 2);
  if (
    observed.length !== expected.length ||
    observed.some((v) => v < 0) ||
    expected.some((v) => v <= 0) ||
    !Number.isInteger(estimatedParameters) ||
    estimatedParameters < 0
  )
    throw new Error(
      "Use matching non-negative observed and positive expected counts.",
    );
  const total = observed.reduce((s, x) => s + x, 0),
    expectedTotal = expected.reduce((s, x) => s + x, 0),
    df = observed.length - 1 - estimatedParameters;
  if (Math.abs(total - expectedTotal) > 1e-8 * Math.max(1, total) || df <= 0)
    throw new Error(
      "Totals must match and degrees of freedom must be positive.",
    );
  const statistic = observed.reduce(
    (sum, v, i) => sum + (v - expected[i]) ** 2 / expected[i],
    0,
  );
  return {
    statistic,
    df,
    pValue: chiTails(statistic, df)[1],
    note: expected.some((v) => v < 5)
      ? "Some expected counts are below 5; check approximation conditions."
      : "Check independent counts and sampling assumptions.",
  };
}
export function chiIndependence(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length < 2 ||
    rows.length > 20 ||
    !rows.every(
      (r) =>
        Array.isArray(r) &&
        r.length === rows[0].length &&
        r.length >= 2 &&
        r.every((v) => Number.isFinite(v) && v >= 0),
    )
  )
    throw new Error(
      "Use a rectangular contingency matrix of non-negative counts.",
    );
  const sums = rows.map((r) => r.reduce((s, v) => s + v, 0)),
    columns = rows[0].map((_, c) => rows.reduce((s, r) => s + r[c], 0)),
    total = sums.reduce((s, v) => s + v, 0);
  if (sums.some((v) => !v) || columns.some((v) => !v))
    throw new Error("Every row and column needs a positive total.");
  const expected = sums.map((sum) => columns.map((col) => (sum * col) / total));
  const statistic = rows.reduce(
      (sum, row, r) =>
        sum +
        row.reduce(
          (s, v, c) => s + (v - expected[r][c]) ** 2 / expected[r][c],
          0,
        ),
      0,
    ),
    df = (rows.length - 1) * (rows[0].length - 1);
  return {
    statistic,
    df,
    pValue: chiTails(statistic, df)[1],
    expected,
    note: expected.flat().some((v) => v < 5)
      ? "Some expected counts are below 5; check approximation conditions."
      : "Check independent counts and sampling assumptions.",
  };
}
export function anova(groups) {
  if (!Array.isArray(groups) || groups.length < 2 || groups.length > 20)
    throw new Error("ANOVA needs 2–20 sample lists.");
  groups.forEach((group) => dataList(group, 2));
  const summaries = groups.map((g) => oneVariable(g)),
    n = summaries.reduce((sum, s) => sum + s.count, 0);
  const grandMean = summaries.reduce((sum, s) => sum + s.mean * s.count, 0) / n;
  const betweenSS = summaries.reduce(
      (sum, s) => sum + s.count * (s.mean - grandMean) ** 2,
      0,
    ),
    withinSS = summaries.reduce(
      (sum, s) => sum + (s.count - 1) * s.sampleSd ** 2,
      0,
    );
  const numeratorDf = groups.length - 1,
    denominatorDf = n - groups.length;
  if (withinSS <= 0)
    throw new Error("ANOVA needs nonzero within-group variation.");
  const statistic = betweenSS / numeratorDf / (withinSS / denominatorDf);
  return {
    statistic,
    numeratorDf,
    denominatorDf,
    betweenSS,
    withinSS,
    pValue: fTails(statistic, numeratorDf, denominatorDf)[1],
    note: "One-way ANOVA assumes independent samples, approximately normal residuals and equal population variances.",
  };
}
export const listFunctions = {
  dim: (v) =>
    Array.isArray(v[0]) ? [v.length, v[0].length] : dataList(v).length,
  sum: (v) => dataList(v).reduce((s, x) => s + x, 0),
  product: (v) => dataList(v).reduce((s, x) => s * x, 1),
  mean: (v, f) => oneVariable(v, f).mean,
  median: (v, f) => oneVariable(v, f).median,
  stdev: (v, f) => {
    const s = oneVariable(v, f);
    if (s.count < 2)
      throw new Error("Sample standard deviation needs at least two values.");
    return s.sampleSd;
  },
  stddevpop: (v, f) => oneVariable(v, f).populationSd,
  variance: (v) => {
    dataList(v, 2);
    return oneVariable(v).sampleSd ** 2;
  },
  sort: (v) => [...dataList(v)].sort((a, b) => a - b),
  cumsum: (v) => {
    let total = 0;
    return dataList(v).map((x) => (total += x));
  },
};
