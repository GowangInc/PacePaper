# IB DP mathematics assessment and Paper Builder findings

Research snapshot: **2026-09-01**
Courses: Mathematics: analysis and approaches (AA) and Mathematics: applications and interpretation (AI), SL and HL.
Evidence policy: factual claims below use only official IB sources. The local May 2026 papers are separately labelled as private structural observations and are not used as curriculum authority. Download provenance is in [`resources/ib/mathematics/PROVENANCE.md`](../../resources/ib/mathematics/PROVENANCE.md).

## Decision summary

1. A digital writing surface is **appropriate for mathematics**, because IB awards method/reasoning marks and explicitly expects written working, equations, diagrams, and graph sketches. It is **not an identified IB requirement** that students use a stylus or a freehand canvas.
2. The closest paper analogue is not an infinite whiteboard. It is a **question-linked, paginated writing surface**: inline answer boxes for some papers, separate booklet pages for others, plus draw-on-diagram and graph-grid variants.
3. The builder must begin with **assessment cycle/session → course → level → paper**. These choices should load locked defaults and reveal only relevant response controls. Current 2026 rules and announced 2029 rules differ.
4. Never hard-code question counts. Four private May 2026 Paper 1 references contain different counts across AA/AI and SL/HL, while keeping stable response patterns.
5. Do not build an unlicensed library of IB questions. IB already sells a licensed [Questionbank](https://questionbank.ibo.org/) that creates custom exams from official questions. DigitalDP should accept teacher-authored material and authorized exports, then provide delivery, response capture, timing, and review.

## Version boundary: current 2026 versus announced 2029

The current courses began teaching in August 2019 with first assessment in May 2021. The IB has announced revised AA and AI courses for first teaching in August 2027 and first assessment in May 2029. The [AA update](https://www.ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-analysis-and-approaches-updates/) says the new course launches in February 2027; the [AI update](https://www.ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-applications-and-interpretation-updates/) describes the same first-assessment-2029 revision.

This has a concrete product consequence: a single timeless “AA HL Paper 3” preset would be wrong. The preset key needs at least:

`assessment cycle/session + course + level + paper`

Add an optional `timezone/form` field for source provenance, not for changing candidate settings automatically.

## Current exam-specific catalog (2026 sessions)

The assessment weights, marks, paper purposes, and calculator rules come from the official first-assessment-2021 guides/specimens, cross-checked against the official 2026 schedules and the official 2029 update pages. The May and November 2026 schedules are decisive for session duration: both list AA HL Paper 3 and AI HL Paper 3 as **1 hour 15 minutes**. This supersedes the 60-minute duration printed in the older public guide/specimen copies. The 2029 update pages independently describe 60 minutes as a reduction from 75 minutes.

| Exam preset | Current time | Weight | Marks | Technology rule | Official public specimen response layout |
|---|---:|---:|---:|---|---|
| AA SL Paper 1 | 90 min | 40% | 80 | No calculator/technology | Section A: answers and working in boxes in the question paper. Section B: separate answer booklet; start each question on a new page. |
| AA SL Paper 2 | 90 min | 40% | 80 | Graphic display calculator (GDC) required | Section A: answer boxes in the question paper. Section B: separate answer booklet. |
| AA HL Paper 1 | 120 min | 30% | 110 | No calculator/technology | Section A: answer boxes in the question paper. Section B: separate answer booklet; start each question on a new page. |
| AA HL Paper 2 | 120 min | 30% | 110 | GDC required | Section A: answer boxes in the question paper. Section B: separate answer booklet. |
| AA HL Paper 3 | **75 min** | 20% | 55 | GDC required | Two compulsory extended problem-solving questions; separate answer booklet, with each question starting on a new page in the public specimen. |
| AI SL Paper 1 | 90 min | 40% | 80 | GDC required | All answers and working in boxes in the question paper. |
| AI SL Paper 2 | 90 min | 40% | 80 | GDC required | Compulsory extended responses in a separate answer booklet; start each question on a new page. |
| AI HL Paper 1 | 120 min | 30% | 110 | GDC required | All answers and working in boxes in the question paper. |
| AI HL Paper 2 | 120 min | 30% | 110 | GDC required | Compulsory extended responses in a separate answer booklet; start each question on a new page. |
| AI HL Paper 3 | **75 min** | 20% | 55 | GDC required | Two compulsory extended problem-solving questions in a separate answer booklet; start each question on a new page. |

Sources: retained [AA guide](../../resources/ib/mathematics/mathematics-analysis-and-approaches-guide-public-first-assessment-2021.pdf), [AI guide](../../resources/ib/mathematics/mathematics-applications-and-interpretation-guide-public-first-assessment-2021.pdf), [AA specimen pack](../../resources/ib/mathematics/mathematics-analysis-and-approaches-specimen-papers-and-markschemes-first-assessment-2021.pdf), [AI specimen pack](../../resources/ib/mathematics/mathematics-applications-and-interpretation-specimen-papers-and-markschemes-first-assessment-2021.pdf), [May 2026 schedule](../../resources/ib/mathematics/may-2026-dp-cp-examination-schedule.pdf), and [November 2026 schedule](../../resources/ib/mathematics/november-2026-dp-cp-examination-schedule.pdf).

### Reading time: fixed five-minute pre-start phase

The current public IB [Access and inclusion policy](https://www.ibo.org/globalassets/new-structure/programmes/dp/pdfs/access-and-inclusion-policy-en.pdf) applies to DP assessments and states that written/on-screen examinations are preceded by **five minutes of reading time**. Section 4.12 says additional time is not authorized for those five minutes. Therefore, the durations in the table above are writing/examination time and each current AA/AI written-paper preset should also carry a separate fixed five-minute reading phase; an approved percentage of additional time must not scale that phase.

No mathematics exception was found in the official AA/AI full public guides, public specimen packs, 2026 examiner instructions, May/November 2026 schedules, 2029 briefs, or curriculum-update pages reviewed. The mathematics question papers say candidates must not open the paper until instructed, but their failure to restate the general reading-time rule is not an override. For an official live session, the current PRC assessment procedures and conduct-of-examinations instructions remain the final operational authority.

Product consequence for 2026 presets: represent this as `reading time: 5 min` followed by the paper's `exam time`; keep response entry locked during the reading phase. This is a sourced timing requirement, while the exact permitted UI interactions during that phase should be confirmed against the current PRC conduct instructions before live use.

### Rules common to the current written papers

- A clean, course-and-level-specific mathematics formula booklet is required for every paper.
- Method, accuracy, answers, reasoning, and interpretation can carry marks. A correct final answer without working does not necessarily receive full marks.
- Written working and/or explanations are expected. When a GDC is used, a result should be supported by suitable working; where a graph produces the solution, the official specimens tell candidates to include a sketch.
- Questions can combine words, symbols, diagrams, tables, and graphs. Extended-response questions require sustained reasoning.
- Unless a question says otherwise, numerical answers are exact or to three significant figures.
- “Technology required” in these documents means access to an approved **GDC**, not unrestricted access to a laptop, CAS website, or general-purpose app. Current approved-device details are session-specific and live in the PRC/annual assessment procedures; the public [calculator policy](https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/exam-calculator-policy/) deliberately sends schools there.

The 20% mathematical exploration is a written internal assessment completed over the course, not another timed paper. It should use a document/submission workflow, not the exam canvas.

## Announced first-assessment-2029 presets

The public 2029 subject briefs say the paper structure, technology split, timings, and weights remain the same except for fewer items/marks and a shorter HL Paper 3. Both courses retain a 20% mathematical exploration.

| 2029 preset | Time | Weight | Marks | Technology |
|---|---:|---:|---:|---|
| AA SL Paper 1 | 90 min | 40% | 75 | No technology |
| AA SL Paper 2 | 90 min | 40% | 75 | Technology required |
| AA HL Paper 1 | 120 min | 30% | 100 | No technology |
| AA HL Paper 2 | 120 min | 30% | 100 | Technology required |
| AA HL Paper 3 | 60 min | 20% | 50 | Technology required |
| AI SL Paper 1 | 90 min | 40% | 75 | Technology required |
| AI SL Paper 2 | 90 min | 40% | 75 | Technology required |
| AI HL Paper 1 | 120 min | 30% | 100 | Technology required |
| AI HL Paper 2 | 120 min | 30% | 100 | Technology required |
| AI HL Paper 3 | 60 min | 20% | 50 | Technology required |

Sources: retained [AA 2029 brief](../../resources/ib/mathematics/mathematics-analysis-and-approaches-subject-brief-first-assessment-2029.pdf), [AI 2029 brief](../../resources/ib/mathematics/mathematics-applications-and-interpretation-subject-brief-first-assessment-2029.pdf), and the official [AA](https://www.ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-analysis-and-approaches-updates/) and [AI](https://www.ibo.org/university-admission/latest-curriculum-updates/dp-mathematics-applications-and-interpretation-updates/) update pages.

The complete 2029 guides and specimen papers were not public on 2026-09-01. Do not lock response stationery for 2029 from the briefs alone; refresh after the February 2027 course launch.

## What the private May 2026 references add

Read-only files inspected in `resources/private/past-papers/2026-may/mathematics/`:

| Private reference | Observed questions | Observed response pattern | Observed visual/ink demand |
|---|---:|---|---|
| AA HL Paper 1 | 12 | Section A in question-paper boxes; Section B begins at question 10 and uses a separate booklet/new page per question. | Multi-line algebra/calculus working, probability reasoning, diagrams, and vector notation. |
| AA SL Paper 1 | 9 | Section A in question-paper boxes; Section B begins at question 7 and uses a separate booklet/new page per question. | Multi-line symbolic working, functions, graphs/asymptotes, and diagrams. |
| AI HL Paper 1 | 15 | All responses in question-paper boxes. | Tables, matrices/vectors, supplied axes, drawing a line and a solution curve, slope fields, models, and calculator-supported working. |
| AI SL Paper 1 | 12 | All responses in question-paper boxes. | Tables, diagrams, geometric construction directly on a supplied figure, Voronoi edges, probability/statistics, and calculator-supported working. |

These counts and page arrangements are **observations of those four files, not IB invariants**. They confirm the public specimen layouts and show why the builder needs dynamic question counts, multi-page questions, continuation handling, prompt diagrams, draw-on-prompt regions, and flexible response heights. The private files were not moved, copied, or added to the public source collection, and no question content is reproduced here.

## Is a stylus canvas required?

### Verified facts

- The official paper materials require visible working and support method marks; several response types naturally include equations, diagrams, graph sketches, and construction on supplied figures.
- The IB says DP/CP digital exams are being introduced gradually from 2026, initially mirroring paper assessments, while schools may continue using paper during the transition. Public information does not identify a mathematics stylus requirement. The live digital specimens are available only to IB World Schools through the PRC. See [Digital examinations for the DP and CP](https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/digital-examinations-for-the-dp-and-cp/).
- No public official source found in this research says AA or AI candidates must use a pen tablet, stylus, or freehand canvas.

### Design inference

A pen-capable response area is the lowest-friction way to preserve the mathematics that is actually marked. It should be available and normally preselected for mathematics, but it should not be labelled “IB required.” Alternatives matter: some students will use a mouse/touchscreen, some need keyboard/equation entry, and accessibility arrangements may require other input.

The strongest design is therefore:

- **primary:** paginated vector ink with optional pressure, palm rejection, undo/redo, eraser, and pan/zoom;
- **contextual:** draw-on-diagram and graph-grid overlays;
- **fallback:** keyboard text/equation entry without removing the ink surface;
- **storage:** retain editable strokes plus a deterministic PDF rendering for teacher review/export.

Avoid an unbounded infinite canvas. A4-like pages and explicit extra pages map to IB answer booklets, keep work associated with a question, print predictably, and simplify marking.

## Minimal teacher flow

### 1. Choose the exam

Show four short selectors, with later selectors filtered by earlier choices:

1. Assessment cycle/session: `Current (2021 cycle / 2026 session)` or `2029 preview`
2. Course: `Analysis & approaches` or `Applications & interpretation`
3. Level: `SL` or `HL`
4. Paper: only valid papers (`1–2` for SL; `1–3` for HL)

Then display a one-line preset summary: duration, marks, calculator status, formula booklet, and response pattern. Official preset values should be locked. An explicit “Make this a custom/mock paper” action can unlock overrides without mislabelling the result as an exact IB preset.

### 2. Add questions

For each question, keep the visible controls to:

- question number/title and total marks;
- prompt/pages or imported PDF region;
- response area: `Inline working`, `Booklet pages`, `Draw on diagram`, `Graph grid`, or `Short typed answer + working`;
- starting space/number of pages and `Students may add pages`;
- optional private markscheme/rubric attachment.

The selected exam should supply sensible defaults:

- AA Papers 1–2: section-aware inline or booklet response;
- AA HL Paper 3: booklet pages;
- AI Paper 1: inline response areas;
- AI Papers 2–3: booklet pages.

Graph-grid and draw-on-diagram controls should appear only when chosen. Calculator and formula-booklet settings belong to the paper preset, not each question.

### 3. Preview and validate

Before publishing, show the student view and block/warn on:

- marks not matching the selected official preset;
- invalid calculator status;
- missing response space;
- a booklet question without a fresh first page;
- a draw/graph instruction without an ink-enabled region;
- a future-2029 preset being presented as current;
- missing source-rights/provenance classification.

## Rights boundary

The public specimen packs are explicitly offered for information and remain copyrighted. Actual past papers/markschemes are licensed through official channels. The [IB Questionbank](https://questionbank.ibo.org/) already supports filtering by examination date, paper, level, time zone, and question type and can build custom tests from licensed official questions. The [IB intellectual-property terms](https://www.ibo.org/terms-and-conditions/intellectual-property/) restrict copying and redistribution.

DigitalDP should store source classification on every imported paper/question:

- `teacher-authored`;
- `school-authorized/licensed`;
- `official public specimen — reference only`;
- `unknown — blocked from sharing`.

This keeps the product useful without turning the repository into an unofficial past-paper archive.

## Evidence limits and refresh actions

- **High confidence:** course/level/paper matrix; current 2026 durations; calculator split; need for shown working; formula-booklet requirement; observed Paper 1 layouts.
- **High confidence:** a fixed five-minute reading phase precedes current written/on-screen examinations and is not increased by additional-time arrangements; no AA/AI exception was found in the reviewed official sources.
- **Medium confidence:** treating the older public specimen stationery as the exact current layout for Papers 2 and 3. Obtain the current guides and digital specimens from the PRC before making these layouts immutable.
- **High confidence that no public requirement was found:** stylus/digital ink is a product inference, not an IB rule.

Required school-side refresh:

1. Download the current AA guide (updated November 2024) and AI guide (updated August 2025) from the PRC; the retained [2026 examiner instructions](../../resources/ib/mathematics/examiner-instructions-2026-mathematics.pdf) establish those revision dates.
2. Review the PRC live digital specimens and their permitted input tools; public pages do not expose those details.
3. Re-check calculator lists and annual assessment procedures for each examination session.
4. Refresh the 2029 templates after the full course launch in February 2027 and again when official specimens appear.
