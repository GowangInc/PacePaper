# AP English Language full-length mock — 5 September 2026

## Deliverable

`AP_ENGLISH_FULL_MOCK` supplies one complete original mock for the implemented AP English Language and Composition route: 45 multiple-choice questions and three essay tasks, not a short sample retaining a long timer. It contains 12 candidate text resources and 48 teacher-only marking entries. Candidate papers and exports must not include the marking companion.

## Current format verification

The [current May 2027 exam page](https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam) specifies five MCQ sets, 45 questions in 60 minutes, and three essays in 135 minutes. This mock uses 24 reading questions and 21 writing-revision questions, within the published ranges of 23–25 and 20–22. Four options per question follow the [course page's change effective from the 2025 exam](https://apcentral.collegeboard.org/courses/ap-english-language-and-composition?course=556). The real exam is fully digital; this remains adapted DigitalDP practice.

The [2026 released Section II directions, page 2](https://apcentral.collegeboard.org/media/pdf/ap26-frq-english-language.pdf) make the suggested synthesis reading/planning time optional within Section II and allow movement among its questions. Accordingly, this paper has no locked reading phase: its schedule is **60 minutes work + 10 minutes break + 135 minutes work**, 205 minutes elapsed but 195 working. The [standard AP break information](https://accommodations.collegeboard.org/how-accommodations-work/for-each-test/ap-exams) supports the ten-minute break. DigitalDP's automatic advance remains different from [Bluebook's candidate resume action](https://apcentral.collegeboard.org/help-center/how-does-scheduled-break-work-digital-ap-exams-two-sections).

## Workload and source architecture

These are measured editorial lengths, not claimed official word-count rules. Counts exclude headnotes for the main passages and drafts.

| Resource/set | Words | Tasks |
|---|---:|---|
| Reading A: public archives and searchable descriptions | 712 | MCQ1–12 |
| Reading B: field notebooks and revisable observations | 699 | MCQ13–24 |
| Writing C: community tool lending | 377 | MCQ25–31; 18 numbered sentences |
| Writing D: street-lighting policy | 404 | MCQ32–38; 20 numbered sentences |
| Writing E: student oral history | 383 | MCQ39–45; 18 numbered sentences |
| Separate orchestra welcome speech | 719 | Rhetorical-analysis essay |
| Six-source rail-corridor dossier | 207–257 each including headnotes | Synthesis essay |
| Options and meaningful freedom | Standalone prompt | Argument essay |

The synthesis dossier contains a planning proposal, adjacent residents' letter, quantitative options table, ecologist's note, access advocate's article and transport historian's essay. Source C is a real table of the invented scenario's capital costs, recurring costs, route lengths, connections and habitat disturbance—not a reference to an absent graph. Its qualifications distinguish preliminary estimates from bids or measured outcomes. The six resources offer genuine tensions over access, maintenance, consultation, ecological effects and reversibility. The prompt requires using at least three sources in a reasoned position; using all six is optional.

**Provenance boundary:** every attributed author, institution, event and research-like number is expressly fictional. The writing imitates nonfiction genres and rhetorical situations; it is not represented as authentic historical testimony or real scientific research. That is a deliberate rights-safe adaptation from the actual exam's authentic published nonfiction. All wording is original; no College Board question, licensed passage, logo or source image is copied.

## MCQ blueprint

The [course framework](https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-course-and-exam-description.pdf) distinguishes eight reading/writing skill families. The authoring blueprint below gives every family five or six questions (11.1% or 13.3% of 45), fitting its published weight ranges. A question may involve secondary skills; the table records its intended primary demand.

| Primary family | Question numbers | Count |
|---|---|---:|
| Rhetorical situation — reading | 1,4,7,13,20,22 | 6 |
| Claims/evidence — reading | 2,11,15,19,21,23 | 6 |
| Reasoning/organisation — reading | 5,6,10,14,17,24 | 6 |
| Style — reading | 3,8,9,12,16,18 | 6 |
| Rhetorical situation — writing | 25,32,39,43,44 | 5 |
| Claims/evidence — writing | 26,30,33,35,37,40 | 6 |
| Reasoning/organisation — writing | 27,28,34,41,42 | 5 |
| Style — writing | 29,31,36,38,45 | 5 |

Questions address purpose and audience assumptions, evidence functions, causal limits, qualification, analogy, diction, paragraph relationships, substantive revision, balanced syntax and tone. They are not a collection of grammar correction drills. Correct positions are balanced: A12/B11/C11/D11. Each teacher entry identifies the correct option and explains why it fits better than the alternatives.

## Marking and limits

All three essay schemes paraphrase the [official 1/4/1 rubric architecture](https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-frqs-1-2-3-scoring-rubrics.pdf), distinguish performance levels and provide prompt-specific evidence routes. They permit cogent alternative positions. The synthesis guidance checks attribution and avoids treating the fictional table as measured health evidence; the rhetorical guidance connects choices to this audience and occasion; the argument scheme rewards specific developed evidence rather than a prescribed opinion.

Teachers should report MCQ `/45` and essays `/18` separately. Optional weighted practice percentage:

`45 × (MCQ / 45) + 55 × (essay points / 18)`

The application's raw `/63` is **not** the weighted percentage. No transformation into an official AP 1–5 score or grade threshold is supplied.

## Verification

- `bun test examples/sample-source/full-mocks/ap-english.test.ts`: **7 pass, 789 assertions** after the independent content-review repairs.
- Tests cover full item totals, 24/21 split, five set sizes, four unique options, balanced keys, eight-family blueprint, measured passage length, continuous paragraph/sentence numbering, source links, six-source synthesis, separate rhetoric/argument resources, timing without a reading lock, and teacher-key isolation.
- Focused regression checks also bind Q30 to draft C's lost-equipment replacement policy and Q40 to draft E's three existing perspectives plus the proposed additional perspective.
- `bun run check` and `git diff --check` passed after authoring.
- Source C is a pipe-delimited table in a text resource. Student/print layout verification belongs to the root integration review; content tests do not certify its rendered alignment.

### Independent internal content review

A separate agent reviewed all five MCQ texts and all 45 option sets and answer rationales against their passages, together with the six synthesis sources, rhetorical-analysis speech, essay prompts and teacher criteria. It also rechecked the current official format and the optional pacing in the 2026 released directions. No incorrect key or missing stimulus was found. Two wording issues were repaired:

- Q40 now asks for **another** perspective, not a third: sentences 5–6 already give a supervisor, shopkeeper and moved-away worker.
- Q30 now concerns paying to **replace lost equipment**, matching sentence 16, rather than damage charges that the source does not establish. Its correct option and rationale identify an unsupported blanket exemption rather than claiming that acknowledging costs necessarily dictates who must pay them.

The review found enough distinct evidence and rhetorical choices for the essay tasks, with synthesis sources supporting qualified alternative positions. It also noted that several distractors are conspicuously absolute or irrelevant, so difficulty is not established by correct keys or by the full question count. This is independent internal review, not external subject-teacher moderation or statistical calibration.

The mock is full-length in workload and clock, but **has not been externally moderated by an AP English teacher/reader or statistically equated to a live examination**. Review distractor difficulty, genre authenticity limits and essay marking locally before using marks for consequential decisions. Browser navigation, PDF layout and the shared live-clock issue are separate application-level checks, not solved by expanding question content.
