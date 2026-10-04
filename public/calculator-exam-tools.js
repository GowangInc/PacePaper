import { compileExpression } from "./calculator-engine.js";
import { functionDefinition } from "./calculator-entry.js";
import { formatValue, real } from "./calculator-values.js";
import {
  determinant,
  inverse,
  transpose,
  rref,
  solveSystem,
} from "./calculator-matrix.js";
import { distributionFunctions } from "./calculator-distributions.js";
import {
  oneVariable,
  regression,
  meanInference,
  twoMeanInference,
  proportionInference,
  twoProportionInference,
  chiGoodness,
  chiIndependence,
  anova,
} from "./calculator-statistics.js";
import { polynomialRoots } from "./calculator-algebra.js";
import { tvm, npv } from "./calculator-finance.js";
import { createToolForm } from "./calculator-tool-form.js";
import { createDataPlots } from "./calculator-plots.js";
import { createCurveTool } from "./calculator-curves.js";
const alternatives = [
  ["different", "≠ (two-sided)"],
  ["less", "< (left tail)"],
  ["greater", "> (right tail)"],
];
export function createExamTools({
  mode,
  getVariables,
  setVariable,
  saved = {},
  signal,
  persist,
}) {
  const forms = {},
    tools = {};
  const evaluate = (source) =>
    compileExpression(source, mode.value)(getVariables());
  const numeric = (s) => real(evaluate(s));
  const list = (source) => {
    try {
      const value = evaluate(source);
      if (Array.isArray(value)) return value;
    } catch {
      /* Plain comma/space data is accepted below. */
    }
    const text = source.trim();
    return evaluate(
      `{${text.includes(",") ? text : text.replace(/\s+/gu, ",")}}`,
    );
  };
  function add(id, title, fields, calculate, options = {}) {
    const form = createToolForm({
      title,
      fields,
      calculate,
      signal,
      initial: saved[id],
      onChange: persist,
      ...options,
    });
    forms[id] = form;
    tools[id] = form.section;
    return form;
  }
  add(
    "lists",
    "Store list",
    [
      ["List name", "l1"],
      ["Values or expression", "{1,2,3,4,5}"],
    ],
    ([name, source]) => {
      setVariable(name, list(source));
      return `${name} = ${formatValue(getVariables()[name.trim().toLowerCase()])}`;
    },
    {
      note: "Lists: {1,2,3}. Reuse named lists in statistics, regression or expressions; l1[1] reads the first value.",
    },
  );
  add(
    "matrix",
    "Calculate",
    [
      [
        "Operation",
        "inverse",
        [
          ["inverse", "Inverse"],
          ["det", "Determinant"],
          ["transpose", "Transpose"],
          ["rref", "Reduced row echelon form"],
          ["solve", "Solve A·x = b"],
          ["store", "Store matrix A"],
        ],
      ],
      ["Matrix A", "[[2,1],[1,3]]"],
      ["Right-hand-side list b (solve only)", "{5,7}"],
    ],
    ([operation, source, b]) => {
      const a = evaluate(source);
      return {
        inverse,
        det: determinant,
        transpose,
        rref,
        solve: (v) => solveSystem(v, list(b)),
        store: (v) => v,
      }[operation](a);
    },
    {
      note: "Matrices use [[a,b],[c,d]]. Matrix products use *; A^(-1) gives the inverse. Store the last result as mat1.",
      store: {
        label: "Store result → mat1",
        run: (v) => setVariable("mat1", v),
        message: "Stored as mat1.",
      },
    },
  );
  add(
    "define",
    "Define function",
    [
      ["Function name", "f1"],
      ["Parameters (comma separated)", "x"],
      ["Expression", "x^2-3*x+2"],
    ],
    ([name, parameters, source]) => {
      return functionDefinition(name, parameters.split(","), source);
    },
    {
      note: "Use f1(x):=x^2 in Calculate, or define here. when(x<0,-x,x) supplies a conditional branch.",
      store: {
        label: "Store function",
        run: (v) => setVariable(v.name, v),
        message: "Function stored; use its name in Calculate or Graph.",
      },
    },
  );
  add(
    "polynomial",
    "Solve polynomial",
    [["Coefficients, highest power first", "{1,-3,2}"]],
    ([c]) => polynomialRoots(list(c)),
    {
      note: "Degree 1–6. Returns numeric real/complex roots; higher degrees use iterative approximation and repeated roots can fail to converge.",
      store: {
        label: "Store roots → roots1",
        run: (v) => setVariable("roots1", v),
        message: "Stored as roots1.",
      },
    },
  );
  add(
    "anova",
    "One-way ANOVA",
    [["Sample lists", "{{8,9,10},{10,11,12},{12,13,14}}"]],
    ([groups]) => anova(evaluate(groups)),
  );
  add(
    "frequency",
    "One-variable statistics",
    [
      ["Data list", "{1,2,3,4,5}"],
      ["Frequency list (optional)", ""],
    ],
    ([values, freq]) =>
      oneVariable(list(values), freq.trim() ? list(freq) : undefined),
    {
      note: "Frequencies are non-negative integers, total ≤1000. Quartiles use linear interpolation at (n−1)/4 and 3(n−1)/4.",
    },
  );
  const models = [
    ["linear", "Linear"],
    ["quadratic", "Quadratic"],
    ["cubic", "Cubic"],
    ["quartic", "Quartic"],
    ["exponential", "Exponential"],
    ["logarithmic", "Logarithmic"],
    ["power", "Power"],
  ];
  add(
    "models",
    "Fit regression",
    [
      ["Model", "quadratic", models],
      ["x list", "{1,2,3,4,5}"],
      ["y list", "{1,4,9,16,25}"],
    ],
    ([model, x, y]) => ({ ...regression(list(x), list(y), model), model }),
    {
      note: "Coefficients are in ascending powers. R² and residuals are reported on the original y scale; transformed R² is also shown for log fits.",
      store: {
        label: "Store fitted model → f1(x)",
        run: (fit) => {
          const c = fit.coefficients.map((v) => `(${v})`);
          const source =
            fit.model === "exponential"
              ? `${c[0]}*exp(${c[1]}*x)`
              : fit.model === "power"
                ? `${c[0]}*x^${c[1]}`
                : fit.model === "logarithmic"
                  ? `${c[0]}+${c[1]}*ln(x)`
                  : c.map((v, k) => `${v}*x^${k}`).join("+");
          setVariable("f1", {
            kind: "function",
            name: "f1",
            parameters: ["x"],
            source,
          });
        },
        message: "Stored f1(x). Enter f1(x) in Graph or Table.",
      },
    },
  );
  const families = [
    ["t", "Student t"],
    ["chi2", "Chi-squared"],
    ["f", "F"],
    ["poisson", "Poisson"],
    ["geom", "Geometric"],
  ];
  const distribution = add(
    "distributions",
    "Calculate probability",
    [
      ["Distribution", "t", families],
      [
        "Calculation",
        "cdf",
        [
          ["pdf", "Density / point probability"],
          ["cdf", "Between bounds (inclusive for discrete)"],
          ["inverse", "Inverse left-tail probability"],
        ],
      ],
      ["Parameter 1", "10"],
      ["Parameter 2 (F only)", "12"],
      ["x / lower bound / probability", "-1"],
      ["Upper bound (between only)", "1"],
    ],
    ([family, operation, param1, param2, first, upper]) => {
      const p = numeric(param1),
        q = family === "f" ? numeric(param2) : undefined,
        a = numeric(first);
      if (operation === "pdf")
        return family === "f"
          ? distributionFunctions.fpdf(a, p, q)
          : distributionFunctions[`${family}pdf`](
              ...[family === "poisson" || family === "geom" ? [p, a] : [a, p]],
            );
      if (operation === "inverse") {
        if (["poisson", "geom"].includes(family))
          throw new Error(
            "Discrete inverse is not supplied; use cumulative probabilities.",
          );
        return distributionFunctions[`inv${family}`](
          ...[family === "f" ? [a, p, q] : [a, p]],
        );
      }
      const b = numeric(upper);
      if (a > b) throw new Error("Lower bound must not exceed upper bound.");
      if (["poisson", "geom"].includes(family)) {
        if (!Number.isInteger(a) || !Number.isInteger(b))
          throw new Error("Discrete bounds must be integers.");
        return (
          distributionFunctions[`${family}cdf`](p, b) -
          distributionFunctions[`${family}cdf`](p, a - 1)
        );
      }
      return distributionFunctions[`${family}cdf`](
        ...[family === "f" ? [a, b, p, q] : [a, b, p]],
      );
    },
    {
      note: "Geometric x is the trial of first success (starts at 1). Use ±1E99 for unbounded continuous tails.",
    },
  );
  const updateDistribution = () => {
    const [family, operation, p, q, first, upper] = distribution.inputs;
    p.parentElement.firstChild.textContent = {
      t: "Degrees of freedom",
      chi2: "Degrees of freedom",
      f: "Numerator df",
      poisson: "Mean λ",
      geom: "Success probability p",
    }[family.value];
    q.parentElement.hidden = family.value !== "f";
    upper.parentElement.hidden = operation.value !== "cdf";
    first.parentElement.firstChild.textContent =
      operation.value === "inverse"
        ? "Left-tail probability"
        : operation.value === "pdf"
          ? "x"
          : "Lower bound";
  };
  distribution.inputs
    .slice(0, 2)
    .forEach((input) =>
      input.addEventListener("change", updateDistribution, { signal }),
    );
  updateDistribution();
  const inferenceNote =
    "Reports a test and confidence interval. Check independence, sampling and distribution assumptions before interpretation.";
  const inferenceFields = [
    ["Null mean / difference", "0"],
    ["Confidence level", ".95"],
    ["Alternative", "different", alternatives],
  ];
  add(
    "ttest",
    "t test / interval",
    [["Sample", "{8,9,10,11,12}"], ...inferenceFields],
    ([a, nullValue, c, alternative]) =>
      meanInference(list(a), numeric(nullValue), numeric(c), alternative),
    { note: inferenceNote },
  );
  add(
    "ztest",
    "z test / interval",
    [
      ["Sample", "{8,9,10,11,12}"],
      ["Known population σ", "2"],
      ...inferenceFields,
    ],
    ([a, sd, nullValue, c, alternative]) =>
      meanInference(
        list(a),
        numeric(nullValue),
        numeric(c),
        alternative,
        numeric(sd),
      ),
    { note: inferenceNote },
  );
  for (const paired of [false, true])
    add(
      paired ? "pairedtest" : "twottest",
      paired ? "Paired t test / interval" : "Welch t test / interval",
      [
        ["Sample 1", "{8,9,10,11,12}"],
        ["Sample 2", "{6,8,9,10,11}"],
        ...inferenceFields,
      ],
      ([a, b, nullValue, c, alternative]) =>
        twoMeanInference(
          list(a),
          list(b),
          numeric(nullValue),
          numeric(c),
          alternative,
          paired,
        ),
      { note: inferenceNote },
    );
  add(
    "proptest",
    "Proportion z test / interval",
    [
      ["Successes x", "42"],
      ["Sample size n", "100"],
      ["Null proportion", ".5"],
      ["Confidence level", ".95"],
      ["Alternative", "different", alternatives],
    ],
    ([x, n, p0, c, alternative]) =>
      proportionInference(
        numeric(x),
        numeric(n),
        numeric(p0),
        numeric(c),
        alternative,
      ),
    { note: inferenceNote },
  );
  add(
    "twoproptest",
    "Two-proportion z test / interval",
    [
      ["Successes x₁", "42"],
      ["Sample size n₁", "100"],
      ["Successes x₂", "32"],
      ["Sample size n₂", "100"],
      ["Confidence level", ".95"],
      ["Alternative", "different", alternatives],
    ],
    ([x1, n1, x2, n2, c, alternative]) =>
      twoProportionInference(
        numeric(x1),
        numeric(n1),
        numeric(x2),
        numeric(n2),
        numeric(c),
        alternative,
      ),
    { note: inferenceNote },
  );
  add(
    "chigoodness",
    "Chi-squared goodness of fit",
    [
      ["Observed counts", "{20,30,25,25}"],
      ["Expected counts", "{25,25,25,25}"],
      ["Estimated parameters", "0"],
    ],
    ([o, e, params]) => chiGoodness(list(o), list(e), numeric(params)),
    { note: inferenceNote },
  );
  add(
    "chiindependence",
    "Chi-squared independence",
    [["Contingency matrix", "[[20,30],[30,20]]"]],
    ([rows]) => chiIndependence(evaluate(rows)),
    { note: inferenceNote },
  );
  const finance = add(
    "finance",
    "Solve TVM",
    [
      [
        "Solve for",
        "pmt",
        [
          ["n", "N (payments)"],
          ["rate", "Annual nominal I%"],
          ["pv", "Present value"],
          ["pmt", "Payment"],
          ["fv", "Future value"],
        ],
      ],
      ["N", "60"],
      ["Annual nominal I%", "5"],
      ["PV", "10000"],
      ["PMT", "0"],
      ["FV", "0"],
      ["Payments per year P/Y", "12"],
      ["Compounds per year C/Y", "12"],
      [
        "Payment timing",
        "0",
        [
          ["0", "End"],
          ["1", "Beginning"],
        ],
      ],
    ],
    ([solve, n, rate, pv, pmt, fv, payments, compounds, beginning]) => ({
      [solve]: tvm(
        solve,
        Object.fromEntries(
          Object.entries({
            n,
            rate,
            pv,
            pmt,
            fv,
            payments,
            compounds,
            beginning,
          }).map(([k, v]) => [k, k === solve ? 0 : numeric(v)]),
        ),
      ),
    }),
    {
      note: "Cash received is positive; paid is negative. Rates are annual nominal percentages. Rate solving returns the first bracketed solution; multiple rates may exist.",
    },
  );
  const updateFinance = () => {
    finance.inputs.slice(1, 6).forEach((input, i) => {
      const solving =
        ["n", "rate", "pv", "pmt", "fv"][i] === finance.inputs[0].value;
      input.disabled = solving;
      input.parentElement.classList.toggle("calculator-solving-field", solving);
    });
  };
  finance.inputs[0].addEventListener("change", updateFinance, { signal });
  updateFinance();
  add(
    "cashflow",
    "Net present value",
    [
      ["Discount per period %", "5"],
      ["Initial cash flow", "-1000"],
      ["Subsequent equally spaced cash flows", "{300,400,500}"],
    ],
    ([rate, initial, flows]) =>
      npv(numeric(rate), numeric(initial), list(flows)),
  );
  tools.plots = createDataPlots({ list, signal }).section;
  tools.curves = createCurveTool({
    compile: (s) => compileExpression(s, mode.value),
    getVariables,
    mode,
    signal,
  }).section;
  return {
    tools,
    state: () =>
      Object.fromEntries(
        Object.entries(forms).map(([id, form]) => [id, form.state()]),
      ),
  };
}
