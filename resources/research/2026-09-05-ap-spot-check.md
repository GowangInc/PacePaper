# AP format spot check — 5 September 2026

Scope: the three implemented AP courses, checked against current College Board sources for the **May 2027** examination. This is a bounded structural audit, not external subject-teacher validation of the original sample questions. Source code references below describe the audit snapshot, before any fixes made by the integrating agent.

**Integration status:** calculator/reference-sheet guidance, compact-demo explanations, and generated artifacts were updated during this review. Complete mock-exam content remains unfinished. See the [completed project review](2026-09-05-project-review.md) for the final changes and test evidence; the findings below preserve the initial audit.

## Verified examination structure

| Course | Section I | Section II | Standard break | Student response mode |
| --- | --- | --- | --- | --- |
| English Language and Composition | 45 MCQ, 60 minutes, 45% | Three essays, 135 minutes, 55% | 10 minutes | Fully digital |
| Biology | 60 MCQ, 90 minutes, 50% | Two 9-point long FRQ and four 4-point short FRQ, 90 minutes, 50% | 10 minutes | Digital MCQ; handwritten FRQ in paper booklet |
| Calculus AB | A: 29 MCQ, 62 minutes, no calculator. B: 13 MCQ, 38 minutes, graphing calculator. Combined 50% | A: two FRQ, 30 minutes, graphing calculator. B: four FRQ, 60 minutes, no calculator. Combined 50% | 10 minutes | Digital MCQ; handwritten FRQ in paper booklet |

The code's 205-, 190-, and 200-minute totals include the break. Active assessment time is respectively 195, 180, and 190 minutes. These session totals are correct when presented as including the break. [English Language exam](https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam), [Biology exam](https://apcentral.collegeboard.org/courses/ap-biology/exam), [Calculus AB exam](https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam), [standard break guidance](https://accommodations.collegeboard.org/how-accommodations-work/for-each-test/ap-exams).

The Calculus update is easy to miss: 62/38 minutes and 29/13 questions apply from **May 2027**. The older 60/45-minute, 30/15-question pattern is not the current preset's target. The existing code already uses the new pattern. [Official fall-2026 changes](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications-effective-fall-2026.pdf).

English Language's suggested 15-minute synthesis reading/planning period sits within the 135-minute FRQ section. It does not require students to wait before typing. The current DigitalDP work phase implements this correctly. [2026 released English Language directions, page 2](https://apcentral.collegeboard.org/media/pdf/ap26-frq-english-language.pdf).

## Changes needed

### 1. Biology's 2027 calculator restriction needs to be explicit

**Priority: high for correct preparation information.** `public/exam-format-profiles.js:175`, `:179`, `:181` and `examples/sample-source/international.ts:219`, `:221`, `:228` only say that a calculator is permitted. The updated rule permits four-function calculators with square root or scientific nongraphing calculators; handheld calculators with storage capability, including graphing calculators, are prohibited. Bluebook supplies a Desmos scientific calculator. Teachers should see the permitted type in the preset and students should see it during both work phases. DigitalDP currently needs a teacher-supplied permitted device because it has no corresponding integrated calculator. [Current calculator policy](https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/exam-policies/calculator-policy).

### 2. Biology needs a reference-sheet reminder

**Priority: medium.** The Biology preset has no `requiredDocumentLabel` and the sample's only resource is the population dataset (`public/exam-format-profiles.js:162–188`; `examples/sample-source/international.ts:240`). Official Biology practice should make the equations/formulas reference available. College Board supplies printed and Bluebook copies. Its 2027 reference page currently directs teachers to the CED while updated individual booklets are pending. Add a teacher supply/attachment instruction and visible phase reminder; do not label the dataset as the reference sheet. [Reference-information policy](https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/subject-specific/reference-information), [Biology CED, equations/formulas appendix](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf).

### 3. The AP samples demonstrate timing, not complete papers

**Priority: medium for teacher expectations; substantial content work for full mock-exam status.** The labels already say “full-timing compact sample”, but instructions should make the short question count obvious before a teacher starts a three-hour session.

| Sample | Actual included content | Consequence |
| --- | --- | --- |
| English Language | Three MCQ; three essay tasks; six one-sentence source summaries | Cannot rehearse the demand or pacing of 45 MCQ across five reading/writing sets. The rhetorical analysis asks about a summary sentence rather than a developed nonfiction passage. The synthesis has no actual visual source. |
| Biology | Three MCQ; six FRQ all based on nitrate/algal growth | The FRQ point pattern is correct, but topic coverage and demand are too narrow. The official four short responses span different big ideas and units; the sample does not. |
| Calculus AB | Four MCQ; six FRQ | FRQ count and calculator grouping are correct, but MCQ workload and representation coverage are far below a full paper. Several 9-point prompts have much less structured demand than official multipart examples. |

Evidence in `examples/sample-source/international.ts:168–205`, `:210–250`, `:282–292`. Structural comparators: [English Language exam](https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam), [Biology CED, Exam Information](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf), [Calculus AB exam](https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam). Keep the walkthrough/compact status explicit until the content has been expanded and assessed by subject teachers.

### 4. Generated sample files are behind the source series

**Priority: medium for consistent exports.** `examples/sample-source/helpers.ts:3` selects `digitaldp-original-examples-v2`, while all six AP `examples/course-samples/*/example-*.paper.json` files still contain `digitaldp-original-examples-v1`. The checked Calculus JSON has the right 2027 times, so this is a generated-artifact consistency issue, not a timing error. Regenerate all course manifests and portable sample exports after source changes.

### 5. Explain the real calculator experience in Calculus guidance

**Priority: low; practice adaptation, not wrong timings.** `public/exam-format-profiles.js:206` correctly requires a supplied graphing calculator for DigitalDP. Clarify that the real exam also offers built-in Desmos graphing during the permitted parts, while DigitalDP currently uses a teacher-supplied device. Its absence is already consistent with an adapted practice label. [Calculator policy](https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/exam-policies/calculator-policy).

## Correct behaviour and disclosed adaptations

- Returning to completed AP sections/parts is disallowed in current Bluebook. DigitalDP's section filtering and permanent part locks are correct. Older paper-exam recollections about revisiting Calculus Part A must not override current digital instructions. [Official navigation FAQ](https://apcentral.collegeboard.org/help-center/can-students-go-back-multiple-choice-and-free-response-sections-bluebook).
- DigitalDP automatically opens the next section after its fixed monitored break. Real Bluebook waits for the candidate's **Resume Testing** action. This difference is already explained in the three AP presets and justifies their `adapted` status. [Official scheduled-break FAQ](https://apcentral.collegeboard.org/help-center/how-does-scheduled-break-work-digital-ap-exams-two-sections).
- Digital ink/typed alternatives for Biology and Calculus are classroom accommodations to the product workflow. The real hybrid exams use handwritten booklets; the current labels say so. The sample raw marks must not be presented as official AP scaled scores.
- `sessions: ["may-2027", "custom"]` is correctly scoped. The May 2027 proctor guide is not due until March 2027, so administration details should be rechecked when it is published. [Proctor guidance](https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/proctoring/digital).

No shared application source was edited by this audit. The integrating review should record its fixes separately from these initial observations.
