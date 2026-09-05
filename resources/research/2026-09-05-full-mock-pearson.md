# Pearson Mathematics A full-length original mocks — 5 September 2026

## Delivered content

Eight independently authored component papers are exported from `examples/sample-source/full-mocks/pearson.ts` as `PEARSON_FULL_MOCKS`. Each has **22 multipart question cards, 100 allocated marks, 120 working minutes and no additional reading period**. There are 176 candidate cards and 144 unique question prompts: matching Foundation/Higher papers intentionally share 40 marks, with 60 different marks for the respective tier. Linear and modular papers are not renamed duplicates.

| Route | Foundation | Higher |
| --- | --- | --- |
| Linear component 1 | Paper 1F | Paper 1H |
| Linear component 2 | Paper 2F | Paper 2H |
| Modular Unit 1 | 4WM1F/01 | 4WM1H/01 |
| Modular Unit 2 | 4WM2F/01 | 4WM2H/01 |

The component timing, marks, 50% weighting and calculator permission were checked against Pearson's [linear specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf), assessment information pp. 41–43, and [modular specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2024/specification-and-sample-assessments/int-gcse-mathematics-spec-a-modular.pdf), pp. 6–8, 41–44. Those are source specifications, not claims that these original mocks are endorsed.

## Blueprint and content controls

Each paper assigns 60 marks to number/algebra, 25 to geometry/measures and 15 to handling data, within the specifications' assessment-objective bands. In Foundation, questions 1–8 are number/algebra (35), 9–11 geometry (15), 12–14 data (10), followed by eight common questions adding 25/10/5 respectively. Higher places the eight common questions first, then the higher-tier 60-mark block in the same domain order.

Unit 1 follows the detailed content list rather than relying solely on a broad course label: fractions/decimals, indices, sets, bounds, algebraic manipulation, equations and graphs; planar measurement/trigonometry and probability. Higher adds surds, recurring decimals, algebraic fractions, quadratics, perpendicular lines, non-right/3D triangles, conditional probability and histograms. Unit 2 focuses on ratio/percentage/standard-form work, inequalities, simultaneous equations, sequences and formula rearrangement; transformations, similarity, volume and statistics. Higher includes function notation, arithmetic series, proof, differentiation, vectors, circle theorems and cumulative frequency. Relevant Unit 1 prerequisites remain available in Unit 2. Detailed boundaries were checked in the [modular content lists](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2024/specification-and-sample-assessments/int-gcse-mathematics-spec-a-modular.pdf), pp. 13–40.

The review removed draft scatter-diagram and box-plot questions, which are not specified here, replacing them with cumulative-frequency and interquartile-range work. Unit 1 Foundation uses factor identification, not Unit 2's explicit prime-power decomposition/HCF-LCM procedures. It does not require Higher-only set cardinality notation or Unit 2 inequality notation merely to name measurement bounds.

The official [linear sample assessment materials](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-samsa.pdf) were inspected for answer-in-paper layout, multipart marking, supplied references and increasing difficulty. Their question counts vary; 22 is our original authoring choice, not an asserted official fixed count. No original exam questions, figures or answer text were copied into these mocks.

## Student and teacher use

Every question contains all necessary data and an integrated square-grid working area with a typed alternative and add-page support. Geometry is fully defined through dimensions or coordinates; no missing diagram or external answer sheet is needed. Every question links to the tier's formula reference. It is independently typeset mathematical fact content matching the tier appendix, without worked examples or additional formula hints.

Every question has a separate **teacher-only** marking entry containing topic, answer and explicit M/A/B point allocations, with acceptable alternatives and graph tolerances where useful. Answers are never added to the candidate manifest. The teacher companion records calculator restrictions, preparation and moderation limits.

## Verification and limits

- `bun test examples/sample-source/full-mocks/pearson.test.ts`: **6 passing tests, 1764 assertions**. Checks all component identities, timing/marks, 176 part-mark totals and response contracts, exact 40-mark overlap, 144 unique prompts, self-contained references, answer separation and Unit 1 exclusions.
- Numeric checks cover bounds, triangle sides/areas, rounding, depreciation, growth thresholds, arithmetic series, stationary/intersection coordinates and conditional probability. Worked marking was additionally read for consistency. `bun run check` passed after authoring.
- Integration and rendered browser/PDF checks are handled by the parent project task; these checks alone do not establish rendered output quality.
- These are **full-length original practice workloads**, not calibrated or awarding-body-approved replacement assessments. Equal difficulty across tiers/components and official grade equivalence have not been established through student trials. A subject specialist should moderate pacing and difficulty before consequential use; published grade boundaries must not be applied.
- Screen drawing replaces printed diagrams and precise instrument constructions. A separate physical ruler/compass exercise is needed for authentic instrument practice. The papers state this adaptation, and do not claim physical construction fidelity.
- The stated three-significant-figure default is an explicit convention for these mocks, not a claimed universal Pearson cover rule. Part-specific precision overrides it.

Reference PDFs were read online; only this research note, source links and original mock content were added. No copyrighted reference-paper binaries were placed in Git.
