# Cambridge and Pearson Mathematics spot check — 5 September 2026

**Integration status:** 2027 session choices, Cambridge calculator/accuracy instructions, explicit compact-demo scope and a teacher preparation panel were added. Complete mocks and supplied formula-sheet assets remain separate work. See the [completed project review](2026-09-05-project-review.md) for final changes and test evidence; the findings below preserve the initial audit.

## Scope and result

Reviewed the 12 Cambridge IGCSE Mathematics 0580 and Pearson Edexcel International GCSE Mathematics A linear/modular component presets, plus the six bundled mathematics samples. The headline component names, tiers, minutes, marks, weighting and calculator/no-calculator split are correct. The samples are compact demonstrations, not complete mock examinations. No shared application source was edited for this audit.

This review used the current official Cambridge and Pearson publications linked below. Pearson's modular PDF did not parse through the web reader; its official PDF was downloaded to a temporary audit directory and extracted using Poppler instead. This is a spot check, not independent validation of every question's mark scheme, difficulty or curriculum coverage.

## Verified assessment structure

| Profile | Components | Each component | Calculator | Evidence |
|---|---|---|---|---|
| Cambridge 0580 Core | Paper 1; Paper 3 | 90 minutes, 80 marks, 50% | P1 prohibited; P3 scientific required | 2025–2027 syllabus, pp. 9, 57–59 |
| Cambridge 0580 Extended | Paper 2; Paper 4 | 120 minutes, 100 marks, 50% | P2 prohibited; P4 scientific required | Same |
| Pearson 4MA1 Foundation | 1F; 2F | 120 minutes, 100 marks, 50% | Permitted | Linear specification, pp. 5–6 |
| Pearson 4MA1 Higher | 1H; 2H | 120 minutes, 100 marks, 50% | Permitted | Same |
| Pearson 4XMAF modular | 4WM1F/01; 4WM2F/01 | 120 minutes, 100 marks, 50% | Permitted | Modular specification, pp. 6–7 |
| Pearson 4XMAH modular | 4WM1H/01; 4WM2H/01 | 120 minutes, 100 marks, 50% | Permitted | Same |

The app's zero separate reading-time setting is appropriate for these components. Cambridge's current cycle is 2025–2027. Its papers mix structured and unstructured questions and provide a formula list; scientific calculators cannot be algebraic or graphical. Pearson supplies tier-specific formula sheets. Its modular Unit 2 assumes relevant Unit 1 knowledge. The sampled modular topics are assigned to the correct units: surds, completing the square, bounds and sets in Unit 1; repeated percentage change, simultaneous equations, arithmetic series and calculus in Unit 2.

Sources: [Cambridge 0580 syllabus](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf), [Pearson Mathematics A linear specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf), [Pearson Mathematics A modular specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2024/specification-and-sample-assessments/int-gcse-mathematics-spec-a-modular.pdf).

## Findings for implementation

### 1. Cambridge calculator-paper instructions omit the standard answer-accuracy rule

**Medium.** `public/exam-format-profiles.js:50` and `:72`, and `examples/sample-source/international.ts:65`, do not tell students how to round unspecified non-exact answers. This matters to the sample's triangle and growth questions (`:70`, `:72`). Add the syllabus convention: three significant figures, or one decimal place for angles in degrees, unless a question says otherwise; keep unrounded working. Cambridge also expressly prohibits algebraic/graphical calculators. Add that qualifier to the teacher preparation guidance so "scientific calculator" cannot be mistaken for an unrestricted device. Evidence: [Cambridge syllabus, pp. 57–59](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf).

### 2. 2027 teachers must choose a misleading custom-session fallback

**Low/medium usability.** All IGCSE paper presets allow only `2026` and `custom` (`public/exam-format-profiles.js:33–74`, `:82`, `:109`). Both system menus likewise omit 2027 (`:285–287`, `:300–302`). Add 2027 as an ordinary selectable year, keeping the same verified Cambridge 2025–2027 cycle and current Pearson specification. Do not apply Cambridge's separate 2028–2030 syllabus to 2027. Evidence: [Cambridge syllabus-year guidance](https://help.cambridgeinternational.org/hc/en-gb/articles/37190057441298-General-FAQ-Which-syllabus-year-should-I-use).

### 3. Four-question samples retain a two-hour clock

**Medium teaching/clarity issue, not a wrong preset duration.** Every IGCSE sample has four questions, 24–26 marks and a 120-minute clock (`examples/sample-source/international.ts:34–162`). All are labelled "compact", which is honest, but their time-per-mark is around four times the full examination ratio. They should be presented clearly as short demonstrations with an appropriate classroom duration, or explicitly as demonstrations retaining the full examination clock. They cannot substantiate a claim that the bundled IGCSE library contains complete mocks. Core/Foundation samples are also absent. This finding comes from the local manifests, not an asserted fixed official question count.

### 4. Required reference sheets remain a manual preparation step for bundled examples

**Medium demo usability.** The examples tell teachers to supply the formula list/sheet but contain no such resource (`international.ts:45–47`, `:65–67`, `:95–99`, `:132–134`, `:152–154`). The builder correctly asks for a document and downgrades fidelity when one is missing (`public/paper-builder.js:568`, `:960–963`), but bundled samples can be started immediately. A visible "Before starting" note listing the missing formula sheet and calculator/equipment would prevent a teacher discovering this after candidates join. This is a preparation gap, not a reason to claim the sheet is already included.

## Content checks and limits

The Cambridge sampled topics are within Extended content, including completing the square and exponential growth. The growth-threshold question can be solved by calculator trial and improvement; it need not require logarithms. Pearson's calculus text explicitly permits differentiation of integer powers, so the cylinder surface-area optimization question was **not** flagged as out of syllabus merely because it introduces a negative integer power. For extrema, Pearson specifies classification from the graph's general shape; the sample asks for classification without mandating a conflicting method. These findings are based on [Cambridge subject content](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf) and [Pearson linear calculus section 3.4](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf).

The official current Pearson qualification page confirms modular first assessment in 2025 and its availability outside the UK. The older linear specification lists January/June availability; current Pearson information instead lists May/June and November. DigitalDP currently makes no incorrect month claim for these IGCSE profiles. Sources: [Modular qualification page](https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses/mathematics-a-2024-modular.html), [current International GCSE subject availability](https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses.html).
