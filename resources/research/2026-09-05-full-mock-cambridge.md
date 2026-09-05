# Cambridge 0580 full-length original mocks — 5 September 2026

## Scope

Four distinct original papers replace the previous workload gap: Core Paper 1 and Paper 3 each have 24 question cards and 80 marks; Extended Paper 2 and Paper 4 each have 24 cards and 100 marks. Every card has integrated working space and a teacher-only worked answer with part allocations. No past-paper question, board diagram, logo or answer is included.

The current [2025–2027 Cambridge syllabus, version 3](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf) confirms Core papers are 90 minutes and Extended papers 120 minutes. Papers 1/2 prohibit calculators; Papers 3/4 require scientific calculators without algebraic/graphical capability. Each component contributes half of its route's assessment. These mocks use no extra reading period. Formula facts are independently typeset in a candidate resource, with additional quadratic/trigonometric facts only at Extended tier. The calculator papers specify the syllabus's answer-accuracy convention. Do not silently apply the separate 2028–2030 syllabus.

## Blueprint

Numbers below are **our authored question numbers and mark allocations**, not Cambridge-mandated topic percentages or a claim that every possible syllabus objective appears on a single paper.

| Topic family | Core P1 (80) | Core P3 (80) | Extended P2 (100) | Extended P4 (100) |
|---|---|---|---|---|
| Number | Q1–8,22: 26 | Q1–5,21,24: 20 | Q1–7: 20 | Q1–4: 11 |
| Algebra and graphs | Q9–12,14: 19 | Q6–8,14,18: 17 | Q8–13,23–24: 36 | Q5–8,10,17,22–24: 40 |
| Coordinate geometry | Q13: 4 | Q9: 3 | Q14: 4 | Q9: 4 |
| Geometry | Q15,24: 6 | Q10,13,22–23: 12 | Q15: 4 | Q11: 4 |
| Mensuration | Q16,23: 8 | Q11: 4 | Q17: 5 | Q15–16: 9 |
| Trigonometry | Q17: 3 | Q12: 4 | Q16: 5 | Q12–14: 12 |
| Transformations/vectors | Q18: 3 | Q19: 4 | Q18,22: 11 | Q21: 5 |
| Probability | Q19,21: 7 | Q17,20: 8 | Q19: 5 | Q20: 5 |
| Statistics | Q20: 4 | Q15–16: 8 | Q20–21: 10 | Q18–19: 10 |

The papers mix short calculations, multi-step contexts, graphs and explanations. P2 concludes with vector intersection, stationary-point reasoning and an exact quadratic geometry problem. P4 includes three-dimensional trigonometry, unequal-class statistics, dependent probability, a cubic graph, optimisation and a growth threshold. Core uses simpler algebra, measurement, interpretation and probability rather than diluted Extended questions. The formula resource is attached to every question; data and geometrical descriptions are complete and do not depend on an external booklet.

## Source alignment and deliberate digital differences

The public specimen cover information was checked for the matching component, calculator status, mark total and working requirement: [Paper 1](https://www.cambridgeinternational.org/Images/663662-2025-specimen-paper-1.pdf), [Paper 2](https://www.cambridgeinternational.org/Images/663664-2025-specimen-paper-2.pdf), [Paper 3](https://www.cambridgeinternational.org/Images/663666-2025-specimen-paper-3.pdf), [Paper 4](https://www.cambridgeinternational.org/Images/663668-2025-specimen-paper-4.pdf). The [official past-paper page](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/past-papers/) cautions that older papers may not follow the current syllabus. These are newly authored practice papers, not replicas of one specimen's question sequence.

Focused syllabus checks prevented Core scope drift: C2.6 only represents/interprets inequalities, so P1 Q10(b) draws an interval instead of solving a linear inequality; C1.8 restricts Core standard-form calculation to P3; Core uses measurement endpoints rather than arithmetic on bounds, replacement-only combined probability, separate rather than combined transformations, and ungrouped means. Differentiation is confined to Extended polynomials with permitted non-negative integer powers. No logarithms are needed for the growth threshold.

Candidates draw their own axes on the digital square grid. There is no compulsory compass construction or task requiring centimetre-calibrated screen measurement. This is an explicit medium adaptation, not an assertion that the app reproduces all instrument-based assessment. Teachers may provide physical geometry instruments and must provide the permitted calculator for P3/P4; there is no embedded calculator.

## Internal verification

- All four manifests parse; 24 cards each; 96 worked marking entries; 360 marks overall.
- Every question's bracketed part marks sum to its declared total. Formula resources resolve on all cards. Candidate manifests contain no worked answer text.
- `bun test examples/sample-source/full-mocks/cambridge.test.ts`: 5 passed, 766 assertions. Structural checks cover every question; numerical regression checks recompute nontrivial finance, trigonometry, mensuration, polynomial, vector and probability answers.
- Calculator values were recomputed at full precision. Initial transcription errors in unrounded interest, depreciation and trigonometry benchmarks were corrected before completion. Drawing answers include expected vertices, curves, intervals or reasonable estimate tolerances, not only a final number.
- `bun run check` passed after the four-paper implementation; root integration and end-to-end tests are recorded separately.

**Remaining moderation boundary:** these are complete full-mark/full-time internal mocks, not externally moderated or psychometrically calibrated examinations. A mathematics teacher should check demand, local taught coverage, drawing tolerances and the worked scheme before consequential grading. Do not infer official grades or cut scores from these raw marks. No external mathematics teacher has yet moderated this set.

## Source files

`examples/sample-source/full-mocks/cambridge.ts` exports `CAMBRIDGE_FULL_MOCKS`. The common builder, Core question data, Extended question data and focused tests are in adjacent `cambridge-*.ts` / `cambridge.test.ts` files. Teacher-only answers are held in the `FullMock.marking` companion, not in the candidate manifest or attached formula resource.
