# PacePaper 0.1.0-demo.20 release notes

Release date: 5 October 2026.

This release expands the calculator with mathematical tools for examination practice. The documentation calls the tool simply **calculator**.

## What is new since 0.1.0-demo.19

- **Scientific and complex calculation.** Complex values, principal roots/logs, conjugates, polar construction, hyperbolic functions, arbitrary-base logarithms, nth roots, gcd/lcm/mod and vector operations.
- **Lists and functions.** Named lists, 1-based list/matrix indexing, reusable function definitions, conditional expressions, finite sequences, sums and products. Lists and functions persist for the browser sitting.
- **Matrices and algebra.** Determinant, inverse, transpose, augment, reduced row echelon form, integer matrix powers and linear systems. Polynomial roots through degree six and eigenvalues of 2×2 matrices.
- **Graph modes.** Parametric, polar and explicit sequence plots with pointer/keyboard tracing and sampled value tables, alongside the existing Cartesian graphs and numerical analysis tools.
- **Statistics.** Frequency-weighted summaries; linear, quadratic, cubic, quartic, exponential, logarithmic and power regression; coefficients, residuals and R²; fitted models can be stored for Graph/Table.
- **Statistical plots and inference.** Scatter, connected x/y, histogram and modified boxplot; one-sample t/known-σ z, Welch/paired t, one/two-proportion z tests and intervals; chi-squared goodness/independence and one-way ANOVA.
- **Probability.** Student t, chi-squared, F, Poisson and geometric distributions join binomial and normal tools, with inverse tools for continuous distributions. Continuous interval tools use appropriate probability tails to reduce cancellation.
- **Finance.** TVM solves N, nominal annual interest, PV, PMT or FV, with payments/compounds per year and beginning/end timing. Cash-flow NPV is also available.
- **Numerical and display improvements.** Small nonzero values are preserved. Fraction history uses rational arithmetic for integer expressions. Bounded root searches now include endpoints and refine local minima for touching roots.
- **Structure and documentation.** Computation is separated from the interface into independent modules. The updated guide explains menus, expressions, conventions and limits. Provenance and the detailed capability profile are recorded in `research/calculator/independent-engine.md`.

## Downloads and upgrade

Windows x64 and Linux x64 packages include the executable, illustrated guide, text guide and release notes. They start with one generic Sample paper and contain no classroom database or candidate work.

A macOS application is not included because Developer ID signing and Apple notarization credentials are not configured. Mac users can download the source and use `Start PacePaper.command` after installing Bun and running `bun install` once.

Finish any live sittings, stop PacePaper and back up the complete data folder before replacing an older executable. This release retains the existing database schema and migration safeguards.

## Build and verification scope

Browser-module bundling, executable compilation, TypeScript compilation and documentation generation pass locally. The existing release workflow checks the source, builds Windows/Linux bundles, verifies packaged documentation and checksums, and launches both executables on their native hosted runners. Publication follows successful workflow completion.

The expanded numerical features have not received comprehensive numerical reference comparisons or browser/physical-calculator workflow validation. Existing automated checks do not establish mathematical parity or examination certification. The post-build verification record reports the actual workflow outcomes and downloaded asset hashes.

## Calculator limits

The calculator is independently implemented from public behaviour descriptions and standard mathematics; no proprietary firmware, ROM, SDK or implementation source was used. Expressions are limited to 1000 characters, lists/sequences to 1000 entries and real matrices to 20×20. Polynomial roots are limited to degree six and eigenvalues to 2×2 matrices. Iterative methods can fail on ill-conditioned inputs, repeated roots or unresolved discontinuities. Quartiles use linear interpolation; inference and finance conventions are explained in the guide.

The calculator does not provide CAS, saved programs/documents, general cell-reference spreadsheets, dynamic geometry, 3D graphs, hardware data collection, an examination lock mode or model certification. It does not replace an approved physical calculator where one is required.

PacePaper remains a familiarisation tool. Classroom sharing uses HTTP on a trusted private network; use only approved practice materials.
