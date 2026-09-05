# DigitalDP multi-system compatibility — research source report

**Research date:** 2026-09-04\
**Scope:** platform-level compatibility for school practice and candidate familiarisation across IB, Cambridge IGCSE, Pearson Edexcel International GCSE, AP, adjacent international/UK qualifications, and later SAT/ACT consideration.\
**Exclusions:** official live-exam delivery, protected-content acquisition, branding imitation, complete component-by-component implementation.

## Research question

Can DigitalDP's current IB-oriented practice workflow become compatible in form and function with other major examination systems, and what platform abstractions are required to do so honestly?

## Finding

Yes, if compatibility is defined as a versioned practice profile that reproduces consequential candidate behaviours. No, if it is defined as one generic IGCSE/AP switch or superficial visual imitation.

The reusable core is classroom assignment, local session control, autosave, response capture, media, ink, review, printing, import/export, and concurrent sessions. The blocking abstractions are identity/taxonomy, arbitrary phases, navigation policy, phase-specific tools, more response modes, hybrid response handling, profile-controlled audio/recording, candidate-specific arrangements, and adaptive routing.

## Implemented component verification

The September 2026 review checked each shipped non-IB preset against a current official qualification page, specification or administration page. Values below are the contract now encoded in `public/exam-format-profiles.js`; compact demonstration papers are allowed to contain fewer questions and marks, but their labels must say **compact sample** and their free-response shape and point allocations must not contradict the official structure.

| Shipped profile | Verified structure | DigitalDP treatment | Known deviation |
| --- | --- | --- | --- |
| Cambridge IGCSE Mathematics 0580, Core | Papers 1 and 3; 90 minutes and 80 marks each; Paper 1 non-calculator, Paper 3 scientific calculator; current formula list on page 2 | Exact component names, timing, marks, calculator rule and required formula-list attachment | Digital ink replaces handwriting on the paper; physical ruler, protractor and compasses remain teacher-supplied |
| Cambridge IGCSE Mathematics 0580, Extended | Papers 2 and 4; 120 minutes and 100 marks each; Paper 2 non-calculator, Paper 4 scientific calculator; current formula list on page 2 | Exact component names, timing, marks, calculator rule and required formula-list attachment | Same paper-to-canvas adaptation |
| Pearson Edexcel International GCSE Mathematics A, linear 4MA1 | Foundation 1F/2F and Higher 1H/2H; each paper 120 minutes, 100 marks and 50%; calculator and tier formula sheet | Separate tier/component choices with required formula-sheet attachment | Digital canvas replaces the written paper |
| Pearson Edexcel International GCSE Mathematics A, modular 4XMAF/4XMAH | Mandatory Unit 1 and Unit 2; codes 4WM1F/01, 4WM2F/01, 4WM1H/01 and 4WM2H/01; each unit 120 minutes, 100 marks and 50%; calculator and tier formula sheet | Separate modular course route, tier and exact unit-code choices | Digital canvas replaces the written unit; Unit 2 prerequisite knowledge is advisory, not enforced |
| AP English Language and Composition, 2027 | Fully digital; Section I has 45 MCQ in 60 minutes; Section II has 3 FRQ in 135 minutes, including an optional 15-minute reading period; 10-minute scheduled break | Locked Section I, fixed break, one 135-minute typed Section II; synthesis source set has six original sources and FRQs use six-point allocations | Break ends automatically for the room rather than waiting for each candidate's **Resume Testing** action |
| AP Biology, 2027 | Hybrid; 60 digital MCQ in 90 minutes; 6 handwritten FRQ in 90 minutes; 2 long 9-point questions and 4 short 4-point questions; calculator and reference information available | Locked digital Section I, fixed break, six correctly shaped ink FRQs, calculator rule and reference-material guidance | Canvas is offered as a school-practice alternative to the official paper booklet; sample MCQ set is compact |
| AP Calculus AB, 2027 | Hybrid; MCQ Part A 29/62 minutes without calculator, Part B 13/38 minutes with graphing calculator; FRQ Part A 2/30 minutes with graphing calculator, Part B 4/60 minutes without; 10-minute break | Four locked work parts, exact timings/calculator changes, 2+4 nine-point ink FRQs | Canvas is offered as a practice alternative to the paper booklet; graphing calculator is teacher-supplied; break resumes automatically |

### Accuracy corrections made by this review

- Removed the artificial AP English response lock during its 15-minute reading period. Official guidance treats the period as optional and permits writing before it ends.
- Added the current Cambridge 0580 formula list as a required builder attachment for all four components.
- Replaced a Cambridge sample request for a least-squares regression and correlation coefficient with the syllabus-defined scatter diagram, correlation description and straight line of best fit drawn by eye.
- Removed calculator-dependent decimal work from the Cambridge non-calculator sample.
- Added Pearson's live modular route instead of treating linear 4MA1 as the only Mathematics A format.
- Rebuilt AP sample free-response sections around the published counts and point allocations while labelling the shortened MCQ content as compact practice.

## Evidence matrix

| System | Verified platform-relevant evidence | Product consequence | Confidence |
| --- | --- | --- | --- |
| Cambridge IGCSE Mathematics 0580 | Extended Paper 2 is non-calculator, 2 hours, 100 marks; Extended Paper 4 requires a scientific calculator, 2 hours, 100 marks. | Calculator is a component/phase rule; Cambridge uses Core/Extended. | High |
| Pearson Edexcel IGCSE Mathematics A | Linear qualification; Foundation/Higher; two 2-hour, 100-mark papers; calculators permitted in both. | “IGCSE mathematics” cannot supply one calculator or tier profile. | High |
| Cambridge digital exams | Typed essay/short responses; radio and drag/drop; adjacent adjustable stimulus; colour/font/line-height controls; notepad/highlighter/zoom; autosave and disrupted-connection recovery; no handwriting in the described system. | Generic stimulus layout, structured item types, accessibility, and recovery states are required. Digital ink is a DigitalDP practice feature, not an exact Cambridge digital equivalent. | High for published common controls; medium for future subject-specific implementations. |
| Pearson onscreen | Highlights, sticky notes, onscreen notepad, zoom, colour filters, extra-time settings, local saving after network loss; paper and onscreen variants can coexist. | Onscreen/paper form must be explicit and candidate settings persistent. | High for published common controls. |
| AP 2027 | Fully digital, hybrid digital/paper, and portfolio-only modes; 2027 world-language exams include digital listening and recorded speaking. | Delivery form is part of the profile; hybrid cannot be flattened into all-digital; recording is a distinct response mode. | High for published 2027 mode list. |
| AP calculator/tools | Built-in calculator type and availability vary by exam and sometimes part; reference sheets can be digital and printed. | Tools must be phase-specific and typed. | High. |
| Bluebook experience | Most AP exams use sections/parts, permit movement inside the current part until time expires, include a break, save locally, and auto-submit. | Arbitrary phases, lock-forward transitions, visible recovery, and automatic hand-in are core. | High for published common experience. |
| JCQ GCSE/GCE | Current rules restrict access to unauthorised applications and calculators; assistive features require approved arrangements. | UK profiles require current awarding-body specification plus JCQ overlay. DigitalDP is not a secure live delivery platform. | High at policy level. |
| Digital SAT | Two timed modules per section; routing uses performance; candidates cannot return to a previous module. | Adaptive delivery requires a separate routing engine and should be deferred. | High at architecture level. |
| ACT | Current enhanced ACT is sectioned and mostly linear; calculator use is limited to mathematics, with Desmos available online. | Fits the phase model more readily than SAT, but remains lower priority. | High at architecture level. |

## Gap matrix against the current application

| Capability | Current state | Required state | Priority |
| --- | --- | --- | --- |
| Provider/qualification identity | IB-oriented session, course, level, paper fields | Provider → qualification → course/syllabus → tier/level → component → series/profile version | P0 |
| Tier/level vocabulary | `SL`, `HL`, `SL/HL` enum | Profile-defined values, including none, Core/Extended, Foundation/Higher | P0 |
| Timing | Ready, optional reading, one writing phase, ended | Ordered instructions/read/work/break/review/submit phases | P0 |
| Navigation | General question navigation | Per-phase flexible, linear, lock-forward, or no-return policy | P0 |
| Delivery form | Assumes all-digital response | Fully digital, hybrid, paper-like practice, portfolio/checklist | P0 |
| Tools | General student features | Profile and phase-specific calculator, references, notepad, highlighter, ruler/symbol/line-reader policy | P0 |
| Question types | Essay, short, single-choice, ink | Multi-select, numeric/maths, structured table, matching/order, drag/drop, hotspot/label, audio record, hybrid handoff | P1 |
| Media | Text/document/image/audio; fixed two complete plays | Resource-specific and profile-specific playback; media checks; transcript/caption policy; recording | P1 |
| Adjustments | Individual extra writing time | Extra time per phase, supervised pause/rest-break event log, persistent display settings | P1 |
| Recovery | Existing autosave/reconnect foundations | Explicit local/remote save state, recovery rehearsal, restart and submission reconciliation tests | P1 |
| Adaptive delivery | None | Module routing, item pools, no-return boundary, separate security/testing model | P3 |
| Fidelity labelling | General familiarisation language | Official-format practice / adapted practice / school custom, with explicit deviations | P0 |

## Proposed manifest contract

The new manifest should be additive and versioned. Existing version 1 IB manifests must be read without behavioural change.

```ts
type PracticeFidelity = "official-format" | "adapted" | "school-custom";
type DeliveryForm = "fully-digital" | "hybrid" | "paper-like" | "portfolio";
type PhaseKind = "instructions" | "reading" | "work" | "break" | "review" | "submission";
type NavigationPolicy = "flexible" | "linear" | "lock-forward";

interface ExamIdentity {
  providerId: string;
  qualificationId: string;
  courseId: string;
  syllabusCode?: string;
  tierOrLevel?: string;
  componentCode?: string;
  series?: string;
  profileId: string;
  profileVersion: string;
}

interface ExamPhase {
  id: string;
  kind: PhaseKind;
  durationSeconds?: number;
  questionIds: string[];
  navigation: NavigationPolicy;
  allowReturnAfterExit: boolean;
  tools: ToolProfile;
  candidateInput: "disabled" | "enabled" | "paper-handoff";
}
```

Profiles should be data, not provider-specific `if` branches distributed across teacher and student code. The paper retains content; the profile supplies defaults/constraints. A resolved session snapshot stores the exact rules used, so later profile updates cannot change an ongoing or completed sitting.

## Backward-compatibility mapping

Version 1 IB paper:

- `assessmentSession` → `identity.series`
- existing course/exam profile → IB DP provider/qualification/course identity
- `level` → `tierOrLevel`
- `paper` → `componentCode`
- `readingTimeMinutes > 0` → reading phase
- `durationMinutes` → work phase
- all existing questions → work phase
- existing resources/questions retained byte-for-byte where valid
- existing audio limit retained for migrated content until explicitly adapted

Database normalization can wait. Store the resolved version 2 manifest JSON first; add provider/qualification index columns only when library filtering requires them.

## Intellectual-property and representation rule

Product compatibility should be grounded in public specifications and official familiarisation materials, while demonstration questions remain original or are included with explicit permission. DigitalDP should never imply that visual similarity, a copied logo, or possession of a past paper makes it an official system. The candidate UI and exports must state practice status.

## Open questions requiring subject-specific research

- Complete component catalogues, timings, tool permissions, and question widgets for each selected Cambridge/Pearson syllabus.
- Final published implementation details for expanding Cambridge and Pearson onscreen series.
- AP administration-year changes after the currently published 2027 mode and calculator policies.
- Recording review/replay rules for each listening/speaking qualification.
- Approved assistive-technology combinations and local school process; public platform statements do not replace candidate approvals.
- The appropriate model for marking rubrics, answer keys, and teacher annotation; not required for the delivery-compatibility foundation.

## Stop rule and conclusion

The platform-level evidence is sufficient because additional broad searching repeats the same architecture: identity, ordered phases, response form, navigation, tools, accessibility, reliability, and profile versioning. Further work should be a bounded, component-by-component profile exercise rather than another general survey.

Recommended next implementation: manifest v2 plus a compatibility layer for existing IB papers, followed by a Cambridge/Pearson IGCSE mathematics pilot. Do not start SAT adaptation before phase and tool profiles are tested.

## Primary sources

The maintained source register, with URLs and relevance notes, is in `resources/exam-systems/SOURCES.md`.
