import { real } from "./calculator-values.js";
// Cash-flow sign convention: receipts positive, payments negative; rates are percentages.
function factors(
  n,
  annualRate,
  payments = 1,
  compounds = payments,
  beginning = 0,
) {
  if (
    ![n, annualRate, payments, compounds].every(Number.isFinite) ||
    n <= 0 ||
    payments <= 0 ||
    compounds <= 0 ||
    annualRate <= -100 * compounds ||
    ![0, 1].includes(beginning)
  )
    throw new Error(
      "Use N > 0, positive P/Y and C/Y, and a valid annual rate; timing is 0 (end) or 1 (begin).",
    );
  const rate = Math.expm1(
    (compounds / payments) * Math.log1p(annualRate / (100 * compounds)),
  );
  const growth = Math.exp(n * Math.log1p(rate));
  const annuity =
    (rate === 0 ? n : Math.expm1(n * Math.log1p(rate)) / rate) *
    (1 + rate * beginning);
  if (![growth, annuity].every(Number.isFinite))
    throw new Error("Finance result is outside the supported range.");
  return { growth, annuity };
}
export function tvm(
  solve,
  { n, rate, pv, pmt, fv, payments = 1, compounds = payments, beginning = 0 },
) {
  const values = { n, rate, pv, pmt, fv };
  if (!Object.hasOwn(values, solve))
    throw new Error("Choose N, rate, PV, PMT or FV to solve.");
  for (const [key, v] of Object.entries(values)) if (key !== solve) real(v);
  const balance = (periods, interest) => {
    const f = factors(periods, interest, payments, compounds, beginning);
    return pv * f.growth + pmt * f.annuity + fv;
  };
  if (["pv", "pmt", "fv"].includes(solve)) {
    const f = factors(n, rate, payments, compounds, beginning);
    return solve === "pv"
      ? -(pmt * f.annuity + fv) / f.growth
      : solve === "pmt"
        ? -(pv * f.growth + fv) / f.annuity
        : -(pv * f.growth + pmt * f.annuity);
  }
  if (pv === 0 && pmt === 0 && fv === 0)
    throw new Error("All cash flows are zero; N or rate is not determined.");
  // Find a sign-changing bracket within a documented domain. Rate may have multiple solutions.
  let previous = solve === "n" ? 1e-8 : -99.9,
    previousValue;
  try {
    previousValue =
      solve === "n" ? balance(previous, rate) : balance(n, previous);
  } catch {
    previousValue = NaN;
  }
  for (let step = 1; step <= 2000; step++) {
    const x =
      solve === "n"
        ? Math.exp(Math.log(1e-8) + (step / 2000) * Math.log(1e14))
        : -99.9 + (step / 2000) * 1099.9;
    let value;
    try {
      value = solve === "n" ? balance(x, rate) : balance(n, x);
    } catch {
      value = NaN;
    }
    if (value === 0) return x;
    if (
      Number.isFinite(value) &&
      Number.isFinite(previousValue) &&
      Math.sign(value) !== Math.sign(previousValue)
    ) {
      let a = previous,
        b = x,
        fa = previousValue;
      for (let k = 0; k < 100; k++) {
        const mid = (a + b) / 2,
          fm = solve === "n" ? balance(mid, rate) : balance(n, mid);
        if (Math.sign(fm) === Math.sign(fa)) {
          a = mid;
          fa = fm;
        } else b = mid;
      }
      return (a + b) / 2;
    }
    previous = x;
    previousValue = value;
  }
  throw new Error(
    "No sign-changing solution found: N ≤ 1,000,000 or annual rate −99.9%…1000%. Check cash-flow signs.",
  );
}
export function npv(rate, initial, flows) {
  real(rate);
  real(initial);
  if (
    rate <= -100 ||
    !Array.isArray(flows) ||
    !flows.length ||
    flows.length > 1000 ||
    !flows.every(Number.isFinite)
  )
    throw new Error("Use a rate above −100% and a finite cash-flow list.");
  return real(
    flows.reduce(
      (sum, value, i) => sum + value / (1 + rate / 100) ** (i + 1),
      initial,
    ),
  );
}
export const financeFunctions = {
  npv,
  tvmfv: (
    n,
    rate,
    pv,
    pmt = 0,
    payments = 1,
    compounds = payments,
    beginning = 0,
  ) => tvm("fv", { n, rate, pv, pmt, payments, compounds, beginning }),
  tvmpv: (
    n,
    rate,
    pmt,
    fv,
    payments = 1,
    compounds = payments,
    beginning = 0,
  ) => tvm("pv", { n, rate, pmt, fv, payments, compounds, beginning }),
  tvmpmt: (
    n,
    rate,
    pv,
    fv = 0,
    payments = 1,
    compounds = payments,
    beginning = 0,
  ) => tvm("pmt", { n, rate, pv, fv, payments, compounds, beginning }),
};
