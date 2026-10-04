# Calculator

Implementation record: 2026-10-05. Scope: calculator workflows relevant to PacePaper's mathematics practice papers.

## Provenance

The expansion was written in this repository from public descriptions of calculator behaviour and standard mathematical definitions. No TI firmware, ROM image, TI SDK, proprietary source, or third-party calculator emulator was obtained or used. It adds no runtime package dependencies. The code does not execute entered JavaScript: a bounded tokenizer, parser and expression-tree evaluator implement an allowlisted mathematical language.

This is an independent implementation, not a claim that a legally supervised, separate specification-team/implementation-team clean-room process occurred. The retained handheld layout predates this engine expansion. No TI certification, compatibility with TNS documents, or exact reproduction of every TI numerical convention is claimed.

Public requirements and mathematics references consulted:

- [TI-Nspire product specifications](https://education.ti.com/en/products/calculators/graphing-calculators/ti-nspire-cx-ii-cx-ii-cas/specifications): capability categories, including matrix operations, regression, statistical inference, distributions and graph modes.
- [TI-Nspire reference guide](https://education.ti.com/html/webhelp/EG_TINspire/EN/Subsystems/EG_RefGuide/Content/EG_Splash/Splash_RefGuide.html): public expression and command vocabulary.
- [NIST DLMF 5.11](https://dlmf.nist.gov/5.11): the asymptotic log-gamma expansion; recurrence shifts positive arguments before evaluation.
- [NIST DLMF 8.9](https://dlmf.nist.gov/8.9): incomplete gamma continued-fraction definitions.
- [NIST DLMF 8.17](https://dlmf.nist.gov/8.17): incomplete beta definitions, symmetry and continued fractions.
- [NIST t distribution reference](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3664.htm): density and distribution conventions.

The implementation expresses standard mathematics in original JavaScript: pivoted elimination, Householder least squares, bracketed quantiles, gamma series/beta and gamma continued fractions, standard inference formulas, annuity balance equations and simultaneous polynomial root iteration. Public documentation supplied requirements and formulas, not implementation source code.

## Implemented capability profile

| Area | Capabilities | Where to find them |
|---|---|---|
| Scientific | Arithmetic, powers, factorial, combinations/permutations, scientific notation, degree/radian trig, inverse trig, hyperbolic functions, arbitrary-base logs, nth roots, gcd/lcm/mod | Calculate; Number, Trig and Catalog |
| Complex | Rectangular values, i, arithmetic and powers, principal square roots/logs, exponential, sin/cos/tan, conjugate, real/imaginary parts, magnitude and argument, polar construction | Calculate; Number and Catalog |
| Lists/functions | Named lists, 1-based indexing, elementwise arithmetic/functions, frequency lists, named functions with up to five parameters, lazy conditionals, finite sequences/sums/products | Lists & Sequences; Algebra |
| Matrices/vectors | Matrix arithmetic/products/integer powers, determinant, inverse, transpose, augment, rref, unique square linear systems; dot/cross products and norm; eigenvalues of 2×2 matrices | Matrices & Linear Systems; Catalog |
| Algebra/calculus | Bounded real numerical solve, polynomial roots through degree 6 (including complex roots), numerical derivatives and definite integrals, direct nDeriv/nInt commands | Algebra; Calculus |
| Graphs/tables | Three Cartesian functions and existing analysis/trace tools; separate parametric, polar and explicit sequence plots, keyboard/pointer tracing and sampled value tables | Graph → Parametric / Polar / Sequence |
| Descriptive statistics | Mean, median, quartiles, extrema, population/sample SD, sum and sum of squares; integer frequency weights | Statistics → Frequency Statistics |
| Regression | Linear, quadratic, cubic, quartic, exponential, logarithmic and power models; coefficients, residuals and R²; store fitted f1(x) for Graph/Table | Statistics → Regression Models |
| Data plots | Scatter, connected x/y, equal-width histogram and modified boxplot with outliers | Statistics → Statistical Plots |
| Probability | Binomial and normal tools; Student t, chi-squared, F, Poisson and geometric PDF/PMF and cumulative probabilities; inverse normal/t/chi-squared/F | Probability |
| Inference | One-sample t and known-σ z, Welch two-sample t, paired t, one/two-proportion z; confidence intervals; chi-squared goodness/independence; one-way ANOVA | Statistics → Tests & Confidence Intervals |
| Finance | Solve N, annual nominal interest, PV, PMT or FV; payments/compounds per year and beginning/end timing; NPV | Finance |

All tools stay inside the handheld screen. Variables, function definitions, history, graph setup and the expanded form inputs use sitting-specific sessionStorage. No calculator entries are sent to an external service. Named lists can be reused by the statistics dialogs. Advanced plot inputs and results are temporary and are not restored after reload.

## Expression examples

These are command syntax examples, not a numerical verification report.

```text
{1,2,3,4}→l1
mean(l1)
l1[2]
l1^2
[[2,1],[1,3]]→a
inverse(a)
a*[[1],[2]]
linsolve(a,{5,7})
a[2,1]
eigvals2(a)
dotp({1,2,3},{4,5,6})
crossp({1,0,0},{0,1,0})
(2+3*i)/(1-i)
sqrt(-4)
polar(2,pi/3)
f1(x):=when(x<0,-x,x)
f1(-3)
seq(k^2,k,1,10)
sum(k^2,k,1,10)
nDeriv(sin(x),x,pi)
nInt(x^2,x,0,1)
polyRoots({1,-3,2})
normalCdf(8,9)
tCdf(-1E99,2,10)
invT(.975,10)
chi2Cdf(0,4,2)
fCdf(0,3,5,10)
poissonPdf(3,2)
geomCdf(.25,4)
npv(5,-1000,{300,400,500})
tvmPmt(60,5,10000,0,12,12,0)
```

Complex construction and trigonometry respect degree/radian mode. Explicit `°` converts a degree argument when the mode is radian. For parametric curves use `t`; for polar radius use `theta` (or `t`), in the selected angle mode; for explicit sequences use `n`. Graph a saved fitted model by entering `f1(x)` in a Cartesian function field. `Ans` remains the previous numeric/list/matrix result after defining a function.

## Limits and conventions

- IEEE-754 finite double precision, with 12 significant digits displayed. Small nonzero results are preserved; true underflow and overflow remain possible. Complex inverse trigonometric/hyperbolic functions are not supported; those functions require real arguments.
- Expressions: 1000 characters, 2048 tokens, nesting depth 32, 50,000 evaluated nodes per calculation, function call depth 32, 100 stored values/functions, 50 history entries. Finite sequences and lists are capped at 1000 entries. Matrices are real and capped at 20×20; matrix powers are integers −100…100.
- Lists use `{...}`. Matrices use `[[...],[...]]`; indices begin at 1. General TI command/file compatibility is not implied. `=` is a comparison; assignment is `:=` or `→`.
- Fraction history for integer arithmetic is calculated with reduced rational intermediates. It is displayed only when numerator and denominator fit safe integers. Decimal input retains decimal intent. Stored values and subsequent arithmetic remain numeric, not a symbolic/rational algebra system.
- Quartiles use linear interpolation at `(n−1)/4` and `3(n−1)/4`; this convention may differ from a physical calculator or a paper's specified method. Histograms include the maximum in the final bin; modified boxplot whiskers use observed values within 1.5 IQR.
- Polynomial coefficients are descending powers. Degrees 1–2 use direct formulas; degrees 3–6 use iteration. Ill-conditioned/repeated roots can fail to converge and produce an explicit error. 2×2 eigenvalues only; general eigenvectors/eigensystems are not supplied.
- Bounded root searches sample the domain and refine sign changes and local minima of |f|. They can miss roots or poorly resolve discontinuities/flat functions. Calculus and graph results are approximations. Parametric/polar/sequence plots are sampled at the chosen step, not symbolic plots or recursive sequence solvers.
- Normal/t/chi-squared/F interval probabilities compute appropriate tails to reduce subtraction cancellation. Poisson/geometric interval probabilities subtract cumulative probabilities and can lose precision in extreme upper tails. Geometric counts the trial of first success, starting at 1. Binomial n is 0…1000. Iterative special functions report failure to converge rather than silently returning an unfinished approximation.
- Inference reports p-values for the selected alternative and a two-sided confidence interval at the entered level. Welch is unpooled; paired t uses first-minus-second differences; proportion tests use null/pooled SE and their intervals use sample/unpooled SE. Normal approximation proportion intervals are not clipped to [0,1]. Statistical sampling assumptions remain part of interpreting results.
- Exponential/power fits minimise squared error on log(y); logarithmic fits use log(x). Original-scale R² and residuals are reported; transformed R² is identified separately. No logistic, sinusoidal or median-median fit is currently supplied.
- Finance uses receipts positive/payments negative. N counts payments; I% is annual nominal percentage; P/Y and C/Y set the effective per-payment rate. N solving searches positive N ≤1,000,000; rate solving searches −99.9%…1000% and returns the first sign-changing solution. Cash-flow rate in NPV is percentage per cash-flow period. IRR/amortisation schedules are not supplied.

Excluded from this exam-practice profile: CAS/symbolic manipulation, TI firmware, TNS import/export, saved documents/programming, dynamic geometry, 3D graphing, hardware/data collection, general cell-reference spreadsheets, Press-to-Test and model certification.

## Implementation structure

The UI entry point `public/calculator.js` retains phase gating and the existing sitting lifecycle. Computation is isolated in `calculator-engine`, `calculator-values`, `calculator-matrix`, `calculator-algebra`, `calculator-numeric`, `calculator-distributions`, `calculator-statistics` and `calculator-finance`. Dialogs share `calculator-tool-form`; plots share `calculator-chart`. All new browser assets are registered for both source serving and embedded executable builds.

Checks performed for this expansion: browser-module bundling, project TypeScript compilation, documentation generation and whitespace review. No new tests were added and no test suites or numerical/browser functional tests were run. The existing expression-limit assertion was updated for the new limit. This expansion needs numerical reference comparisons, physical-calculator workflow comparisons and browser functional validation before an exam-practice reliability claim or release.
