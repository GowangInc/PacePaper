// Standard probability definitions; independently implemented series and continued fractions.
const EPS = 4e-15,
  TINY = 1e-300,
  LIMIT = 10000;
export function positive(v, name = "Parameter") {
  if (!Number.isFinite(v) || v <= 0)
    throw new Error(`${name} must be positive.`);
  return v;
}
export function probability(p) {
  if (!Number.isFinite(p) || p < 0 || p > 1)
    throw new Error("Probability must be between 0 and 1.");
  return p;
}
export function logGamma(z) {
  positive(z);
  // Stirling's series after recurrence to a well-conditioned argument.
  let adjustment = 0;
  while (z < 16) {
    adjustment -= Math.log(z);
    z++;
  }
  const u = 1 / z,
    u2 = u * u;
  return (
    adjustment +
    (z - 0.5) * Math.log(z) -
    z +
    Math.log(2 * Math.PI) / 2 +
    u *
      (1 / 12 +
        u2 * (-1 / 360 + u2 * (1 / 1260 + u2 * (-1 / 1680 + u2 / 1188))))
  );
}
export function gammaTails(a, x) {
  positive(a);
  if (Number.isNaN(x) || x < 0)
    throw new Error("Gamma argument must be non-negative.");
  if (x === 0) return [0, 1];
  if (x === Infinity) return [1, 0];
  const scale = Math.exp(a * Math.log(x) - x - logGamma(a));
  if (x < a + 1) {
    let term = 1 / a,
      sum = term;
    for (let n = 1; n <= LIMIT; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) <= Math.abs(sum) * EPS) {
        const p = Math.min(1, scale * sum);
        return [p, 1 - p];
      }
    }
  } else {
    let b = x + 1 - a,
      c = 1 / TINY,
      d = 1 / b,
      h = d;
    for (let n = 1; n <= LIMIT; n++) {
      const an = n * (a - n);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < TINY) d = TINY;
      c = b + an / c;
      if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d;
      const delta = c * d;
      h *= delta;
      if (Math.abs(delta - 1) <= EPS) {
        const q = Math.max(0, Math.min(1, scale * h));
        return [1 - q, q];
      }
    }
  }
  throw new Error("Distribution calculation did not converge.");
}
function betaFraction(a, b, x) {
  let c = 1,
    d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let n = 1; n <= LIMIT; n++) {
    const terms = [
      (n * (b - n) * x) / ((a + 2 * n - 1) * (a + 2 * n)),
      (-(a + n) * (a + b + n) * x) / ((a + 2 * n) * (a + 2 * n + 1)),
    ];
    let delta = 1;
    for (const t of terms) {
      d = 1 + t * d;
      if (Math.abs(d) < TINY) d = TINY;
      c = 1 + t / c;
      if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d;
      delta = c * d;
      h *= delta;
    }
    if (Math.abs(delta - 1) < EPS) return h;
  }
  throw new Error("Distribution calculation did not converge.");
}
export function betaTails(a, b, x) {
  positive(a);
  positive(b);
  probability(x);
  if (x === 0) return [0, 1];
  if (x === 1) return [1, 0];
  const front = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log1p(-x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    const p = Math.max(0, Math.min(1, (front * betaFraction(a, b, x)) / a));
    return [p, 1 - p];
  }
  const q = Math.max(0, Math.min(1, (front * betaFraction(b, a, 1 - x)) / b));
  return [1 - q, q];
}
export function normalTails(x, mean = 0, sd = 1) {
  positive(sd, "Standard deviation");
  if (!Number.isFinite(mean) || Number.isNaN(x))
    throw new Error("Use a real mean and bound.");
  const z = (x - mean) / sd,
    q = gammaTails(0.5, (z * z) / 2)[1] / 2;
  return z < 0 ? [q, 1 - q] : [1 - q, q];
}
export function tTails(x, df) {
  positive(df, "Degrees of freedom");
  if (Number.isNaN(x)) throw new Error("Use a real bound.");
  const q = betaTails(df / 2, 0.5, df / (df + x * x))[0] / 2;
  return x < 0 ? [q, 1 - q] : [1 - q, q];
}
export function chiTails(x, df) {
  positive(df, "Degrees of freedom");
  return x <= 0 ? [0, 1] : gammaTails(df / 2, x / 2);
}
export function fTails(x, d1, d2) {
  positive(d1);
  positive(d2);
  if (x <= 0) return [0, 1];
  return betaTails(
    d1 / 2,
    d2 / 2,
    x === Infinity ? 1 : 1 / (1 + d2 / (d1 * x)),
  );
}
export function between(tails, lower, upper) {
  if (Number.isNaN(lower) || Number.isNaN(upper) || lower > upper)
    throw new Error("Lower bound must not exceed upper bound.");
  const a = tails(lower),
    b = tails(upper);
  return Math.max(0, Math.min(1, a[0] > 0.5 ? a[1] - b[1] : b[0] - a[0]));
}
export function inverseCdf(tails, p, lower = -1, upper = 1) {
  probability(p);
  if (p === 0 || p === 1)
    throw new Error("Inverse probability must be strictly between 0 and 1.");
  const upperTail = p > 0.5,
    target = upperTail ? 1 - p : p;
  for (let n = 0; tails(lower)[0] > p && n < 512; n++) lower *= 2;
  for (let n = 0; tails(upper)[0] < p && n < 512; n++) upper *= 2;
  if (tails(lower)[0] > p || tails(upper)[0] < p)
    throw new Error("Quantile lies outside the supported range.");
  for (let n = 0; n < 180; n++) {
    const mid = lower + (upper - lower) / 2,
      t = tails(mid)[Number(upperTail)];
    if (upperTail ? t > target : t < target) lower = mid;
    else upper = mid;
    if (upper - lower <= 2e-14 * Math.max(Math.abs(mid), 1e-100)) break;
  }
  return lower + (upper - lower) / 2;
}
export const normalCdf = (x, mean = 0, sd = 1) => normalTails(x, mean, sd)[0];
export const inverseNormal = (p, mean = 0, sd = 1) => {
  positive(sd);
  if (!Number.isFinite(mean)) throw new Error("Mean must be finite.");
  return mean + sd * inverseCdf(normalTails, p);
};
export function normalPdf(x, mean = 0, sd = 1) {
  positive(sd);
  return (
    Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))
  );
}
export function tPdf(x, df) {
  positive(df);
  return Math.exp(
    logGamma((df + 1) / 2) -
      logGamma(df / 2) -
      Math.log(df * Math.PI) / 2 -
      ((df + 1) / 2) * Math.log1p((x * x) / df),
  );
}
export function chiPdf(x, df) {
  positive(df);
  if (x < 0) return 0;
  if (x === 0) {
    if (df < 2) throw new Error("Density is infinite at zero.");
    return df === 2 ? 0.5 : 0;
  }
  return Math.exp(
    (df / 2 - 1) * Math.log(x) -
      x / 2 -
      (df / 2) * Math.log(2) -
      logGamma(df / 2),
  );
}
export function fPdf(x, d1, d2) {
  positive(d1);
  positive(d2);
  if (x < 0) return 0;
  if (x === 0) {
    if (d1 < 2) throw new Error("Density is infinite at zero.");
    return d1 === 2 ? 1 : 0;
  }
  return Math.exp(
    (d1 / 2) * Math.log(d1 / d2) +
      (d1 / 2 - 1) * Math.log(x) -
      ((d1 + d2) / 2) * Math.log1p((d1 * x) / d2) -
      logGamma(d1 / 2) -
      logGamma(d2 / 2) +
      logGamma((d1 + d2) / 2),
  );
}
export function poissonPdf(lambda, k) {
  positive(lambda, "Mean");
  if (!Number.isInteger(k)) throw new Error("x must be an integer.");
  return k < 0 ? 0 : Math.exp(-lambda + k * Math.log(lambda) - logGamma(k + 1));
}
export function poissonCdf(lambda, k) {
  positive(lambda, "Mean");
  if (!Number.isFinite(k)) throw new Error("Use a finite x.");
  return k < 0 ? 0 : gammaTails(Math.floor(k) + 1, lambda)[1];
}
export function geometricPdf(p, k) {
  positive(p);
  probability(p);
  if (!Number.isInteger(k)) throw new Error("Trial count must be an integer.");
  return k < 1 ? 0 : p * (1 - p) ** (k - 1);
}
export function geometricCdf(p, k) {
  positive(p);
  probability(p);
  if (!Number.isFinite(k)) throw new Error("Use a finite trial count.");
  return k < 1 ? 0 : p === 1 ? 1 : -Math.expm1(Math.floor(k) * Math.log1p(-p));
}
export const distributionFunctions = {
  normalpdf: normalPdf,
  normalcdf: (a, b, m = 0, s = 1) => between((x) => normalTails(x, m, s), a, b),
  invnorm: inverseNormal,
  tpdf: tPdf,
  tcdf: (a, b, df) => between((x) => tTails(x, df), a, b),
  invt: (p, df) => inverseCdf((x) => tTails(x, df), p),
  chi2pdf: chiPdf,
  chi2cdf: (a, b, df) => between((x) => chiTails(x, df), a, b),
  invchi2: (p, df) => inverseCdf((x) => chiTails(x, df), p, 0, 1),
  fpdf: fPdf,
  fcdf: (a, b, d1, d2) => between((x) => fTails(x, d1, d2), a, b),
  invf: (p, d1, d2) => inverseCdf((x) => fTails(x, d1, d2), p, 0, 1),
  poissonpdf: poissonPdf,
  poissoncdf: poissonCdf,
  geompdf: geometricPdf,
  geomcdf: geometricCdf,
};
