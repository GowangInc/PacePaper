# IB DP Business Management assessment and Paper Builder findings

Research snapshot: **2026-09-01**
Scope: May and November 2026 Business Management, standard level (SL) and higher level (HL).
Evidence policy: factual claims use official IB sources. The local November 2025 papers are labelled separately as private structural observations and are not curriculum authority. Source provenance is in [`resources/ib/business-management/PROVENANCE.md`](../../resources/ib/business-management/PROVENANCE.md).

## Decision summary

1. Business Management needs a **mixed-response exam surface**, not an all-purpose blank canvas. Most answers are prose; Paper 2 also requires calculations, shown working, tables, charts, and diagram construction.
2. Digital ink is **useful and sometimes the simplest input for Paper 2**, but no official source reviewed says that a stylus or freehand canvas is an IB requirement. Typed text, structured numeric entry, and accessible diagram tools should remain available.
3. The teacher must first choose `assessment session/cycle → Business Management → level → paper`. The preset should then lock timing, marks, sections, choice rules, and materials, while revealing only response controls that suit that paper.
4. The retained public guide is the first-assessment-2024 guide but is not its latest revision: the public file says updated May 2022, while the official 2026 examiner instructions cite a July 2024 update. The current instructions and both 2026 schedules agree with the core paper model below; schools should still refresh the full guide and session documents in the PRC before official delivery.
5. No official Business Management specimen/question-paper pack was publicly listed on the IB sample-paper page. Use the authenticated Programme Resource Centre, IB store, or licensed [IB Questionbank](https://questionbank.ibo.org/) for official questions; do not build an unlicensed archive from private papers.

Do not use the public [Business management subject page](https://www.ibo.org/programmes/diploma-programme/curriculum/individuals-and-societies/business-and-management/) as the preset source. Although it says it was updated in March 2026, its assessment summary still describes the superseded two-paper-at-both-levels model and old SL/HL internal-assessment split. The first-assessment-2024 guide, 2026 examiner instructions, and 2026 schedules are mutually consistent and take precedence in this research.

## Current 2026 exam presets

The writing durations below are independently confirmed by both the official [May 2026](../../resources/ib/mathematics/may-2026-dp-cp-examination-schedule.pdf) and [November 2026](../../resources/ib/mathematics/november-2026-dp-cp-examination-schedule.pdf) schedules. Weights and maximum marks come from the official [first-assessment-2024 guide](../../resources/ib/business-management/business-management-guide-first-assessment-2024.pdf). Current question counts, choice rules, and response details are cross-checked against the official [2026 examiner instructions](https://ibpublishing.ibo.org/exinst/apps/exinst/index.html?chapter=1&doc=EX_instructions_2026_e&part=10).

| Exam preset | Writing time | Weight | Marks | Current structure and choice | Default response model |
|---|---:|---:|---:|---|---|
| SL Paper 1 | 90 min | 35% | 30 | Same paper as HL. Section A: six compulsory structured questions, 20 marks. Section B: choose one of two evaluative extended responses, 10 marks. | Short/medium prose plus one long response; optional calculation working. |
| SL Paper 2 | 90 min | 35% | 40 | Section A: two compulsory structured quantitative questions, 10 marks each. Section B: choose one of two 20-mark questions containing structured parts and a 10-mark evaluative response. | Integrated answer areas; calculation working, units, prose, and diagram/chart regions. |
| HL Paper 1 | 90 min | 25% | 30 | Identical question paper and structure to SL Paper 1. | Short/medium prose plus one long response; optional calculation working. |
| HL Paper 2 | 105 min | 30% | 50 | Section A: three compulsory structured quantitative questions, 10 marks each. Section B: choose one of two 20-mark questions containing structured parts and a 10-mark evaluative response. | Integrated answer areas; calculation working, units, prose, and diagram/chart regions. |
| HL Paper 3 | 75 min | 25% | 25 | One compulsory social-enterprise task with three questions worth 2, 6, and 17 marks. | Resource-linked short response, medium explanation, and long decision-making plan/recommendation. |

There is an apparent typographical inconsistency in the indexed 2026 examiner-instructions text for **SL Paper 2**: immediately after specifying two 10-mark Section A questions, it calls that section’s maximum 30. The current guide, the 40-mark paper total, and the stated two-by-10 structure all establish **20 marks** for Section A; the preset should use 20.

### Paper 1: shared SL/HL case study paper

Verified facts:

- About three months before the examination, the IB releases a statement containing a small set of contextual research topics and approximately the first 200 words of the case study. The guide anticipates about five hours of research on those topics.
- The examination supplies the unseen remainder of one fictitious-business case study; the guide describes the unseen case study as approximately 800–1,000 words.
- Most questions are qualitative, though minor calculations may appear.
- Section A is compulsory and analytically marked. Section B offers two evaluative questions and the student answers one.

Builder consequence: Paper 1 needs a pre-release attachment/status field, a readable case-study panel, six configurable structured prompts, and a two-option branch for the final response. The SL/HL selector should change the weighting label, not the paper body or timing.

### Paper 2: separate quantitative SL and HL papers

Verified facts:

- SL and HL receive different but similarly formed papers. The stimulus is first seen in the examination and can combine text, charts, infographics, and other diagrams.
- The 2026 examiner instructions say students write responses in the question booklet. Section A is compulsory; Section B offers two questions and the student answers one.
- Quantitative items can require a calculator. For calculations, the 2026 instructions require shown working for full marks except where a one-mark question explicitly says working is not required. Correct units matter, and subsequent correct use of an earlier result can receive own-figure credit.
- The HL paper has one more compulsory Section A question than SL and includes HL extension content.

Builder consequence: each quantitative subpart should offer `answer + working + unit`, not a bare numeric field. It also needs `draw on supplied axes/diagram`, `table`, and flexible multi-line explanation modes. Preserve the student’s intermediate working so a teacher can apply own-figure reasoning.

### Paper 3: HL social-enterprise decision document

Verified facts:

- The stimulus begins with a short organization introduction and a visual representation of a product, followed by five or six excerpts such as emails, social-media posts, or news material.
- All three questions are compulsory: a 2-mark description of the human need, a 6-mark explanation of two challenges, and a 17-mark plan/recommendation.
- The 17-mark response is assessed for use of resource materials, business tools/theories, evaluation, and sequencing of the plan. The 2026 instructions say a conclusion is not required.
- Calculators are allowed.

Builder consequence: show numbered resource cards in a persistent, zoomable side panel and make resource references easy to insert. The long response should be a structured prose workspace with an optional planning area, not a mandatory drawing canvas.

## Reading time and materials

### Fixed five-minute pre-start phase

The Business Management guide says that, in common with all DP papers, SL and HL students receive **five minutes of reading time before answering**. The current public IB [Access and inclusion policy](https://www.ibo.org/globalassets/new-structure/programmes/dp/pdfs/access-and-inclusion-policy-en.pdf) independently says written/on-screen examinations are preceded by five minutes of reading time and that additional time is not authorized for that period. No Business Management exception was found in the current 2026 examiner instructions or schedules.

The durations in the preset table are therefore writing time, not totals including reading time. Model `reading time: 5 min` as a separate locked phase before the paper timer. Response entry should remain locked during that phase; confirm the exact permitted navigation and annotation interactions against the current PRC conduct instructions before using DigitalDP for a live official examination.

### Calculators and formulae

- The guide says all calculator questions can be completed with four-function arithmetic, while graphic display calculators are allowed. The current 2026 examiner instructions explicitly allow calculators on Papers 2 and 3 and say Paper 2 parts may require one.
- The guide says a copy of the Business Management formulae is provided for the examination; a discount table is included when a question requires it.
- Session-specific permitted models and examination conditions are controlled by the annually revised calculator guidance in the PRC. “Calculator allowed” must not mean access to an unrestricted browser or general-purpose application.

Safe preset defaults:

| Paper | Calculator setting | Formula/resource setting |
|---|---|---|
| Paper 1 | Permitted; minor calculation support only | Do not auto-attach a formula sheet without the session paper instructions; allow an authorized clean resource to be attached. |
| Paper 2 | Permitted and potentially required | Formulae-sheet viewer enabled; school must provide/validate the current clean official copy. Include a discount table with the prompt when required. |
| Paper 3 | Permitted | Resource pack is intrinsic; formula sheet off by default unless current session instructions say otherwise. |

The distinction between “permitted” and “required” matters. The guide/2026 examiner instructions establish permission and sufficiency; an individual paper’s candidate instructions can impose the operational requirement. DigitalDP should store both fields and let only an authorized session template change them.

## Private November 2025 layout observations

Read-only files inspected in `resources/private/past-papers/2025-november/business-management/`:

| Private reference | Observed layout | Observed media/response demand |
|---|---|---|
| HL/SL Paper 1 | Compact prompt-only booklet; six Section A items and two Section B options; no printed response boxes in the retained file. | Dense case-study reading, short structured prose, one sustained evaluative response, and possible minor calculation. |
| HL Paper 2 | Long question-and-answer booklet with fixed answer boxes; three compulsory Section A questions and two Section B options. | Financial tables, multi-step calculations with units and visible working, a chart construction, a network/critical-path diagram, plotted data, and extended prose. |
| HL Paper 3 | Compact resource booklet; five numbered resources followed by three compulsory questions; no printed response boxes in the retained file. | Mixed document excerpts, a product visual, table/chart reading, short explanations, and a sustained resource-synthesizing plan. |

These are observations of three files, not rules for 2026 or guarantees of future layout. They support flexible response heights, prompt-linked continuation pages, zoomable visual stimulus, draw-on-prompt regions, and configurable answer-space allocation. No private question wording or case-study content is reproduced here.

## Is a stylus canvas required?

### Verified facts

- Paper 2 calculations must normally show working for full credit.
- Official descriptions allow diagrammatic stimulus and the observed reference paper includes tasks that require construction on supplied figures.
- No reviewed official source says Business Management candidates must use a stylus, pen tablet, or freehand digital canvas.

### Design inference

Digital ink should be an **available response type**, especially for Paper 2 working and draw-on-figure tasks, not the default for every Business Management response. A simple paper-faithful set is:

- `Short answer` — typed text with optional working scratchpad;
- `Calculation` — final answer, unit, and expandable ink/equation working;
- `Extended response` — long-form typed answer with optional planning page;
- `Draw on figure` — bounded vector ink over teacher-supplied axes, table, or diagram;
- `Resource response` — prose editor beside numbered, zoomable source cards.

Store editable strokes and text separately, then produce a deterministic paginated PDF for review/export. Avoid an infinite whiteboard: question-linked A4-like pages and explicit continuation pages map better to the assessment and are easier to mark.

## Minimal teacher workflow

1. Choose the assessment session/cycle, then `Business Management`, `SL` or `HL`, and the paper. Hide Paper 3 for SL.
2. Show a one-line locked preset summary: reading phase, writing time, marks, sections, choice rule, calculator status, and supplied resources.
3. Add/import the prompt or stimulus. For Paper 1, add the pre-release reference; for Paper 3, add numbered resource cards.
4. Add questions. Load the correct compulsory/choice skeleton, but allow subparts and response-space sizes to vary.
5. Select a response type per subpart. Reveal ink/graph controls only for `Calculation` or `Draw on figure`.
6. Preview the exact student flow and validate totals, unanswered choice branches, missing response space, missing formula/resource attachments, and source-rights classification before publishing.

An explicit “Custom/mock paper” action may unlock official defaults, but the resulting paper must no longer be labelled an exact 2026 IB preset.

## Rights boundary and source gaps

The retained guide states that all rights are reserved and specifically flags third-party curriculum-mapping and teacher-resource platforms as requiring permission for commercial use. DigitalDP may encode independently described assessment settings, but it should not ship official question text, case studies, markschemes, formula sheets, or visual assets without authorization.

No official public Business Management specimen/question-paper pack was found on the [IB sample-paper page](https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/sample-exam-papers/) on 2026-09-01. The guide directs authorized teachers to the [Programme Resource Centre](https://resources.ibo.org/) for specimens and support materials and to the IB store for past papers. The licensed [IB Questionbank](https://questionbank.ibo.org/) is the proper source for building custom tests from official questions.

Store one provenance classification on every imported item:

- `teacher-authored`;
- `school-authorized/licensed`;
- `official public reference — not for redistribution`;
- `private reference — not for redistribution`;
- `unknown — block sharing`.

## Confidence and required refresh

- **High confidence:** 2026 paper matrix, writing durations, weights, marks, core section/choice model, fixed five-minute reading phase, Paper 2 working requirement, and Paper 3 task shape.
- **High confidence:** digital ink is useful but is a product inference, not an identified IB requirement.
- **Medium confidence:** exact 2026 stationery and paper-specific resource wording. The public full-guide binary is the May 2022 revision and no official current specimen paper was public.
- **Known official-source defect:** the indexed 2026 examiner-instructions text contains the SL Paper 2 Section A maximum-mark typo described above.

Before a live official session, school staff should obtain and compare the current Business Management guide (February 2022, updated July 2024), session assessment procedures, calculator guidance, formulae sheet, and digital specimen from the PRC. Refresh the preset if any differs from this research snapshot.
