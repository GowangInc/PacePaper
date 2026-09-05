# DigitalDP usability review — findings and next steps

Reviewed 5 September 2026. **Audit completed; application fixes are not implemented.**

Historical audit snapshot. The later [safety-fix report](2026-09-05-ux-safety-fixes.md) records the implemented P1 fixes, verification and remaining limitations; the findings below describe the pre-fix state.

## Outcome

DigitalDP has a sensible utilitarian structure, working class/name selection, exam-system filtering, visible student submission controls and useful teacher response review. It is **not ready to be described as dependable for unsupervised classroom use**: the review reproduced timing disagreement, silent AP phase loss and an inaccurate save reassurance. These should take priority over another visual redesign.

Installed and applied **Owl-Listener Usability Test Plan**, alongside fresh **Web Interface Guidelines (WIG)**, **Modern Web Guidance** for forms and **Playwright** for browser evidence. The usability skill changed the review from a visual checklist into goal-based tasks with explicit success, failure and recovery criteria. Impeccable and AccessLint were not installed; Hallmark remains optional visual polish. See the [selection rationale](2026-09-05-ui-ux-skill-selection.md).

This is an agent-run technical/heuristic review, not a completed study with teachers or students, and not a WCAG certification. No usability score, SUS result or human task-success percentage is claimed. W3C explicitly requires knowledgeable human evaluation in addition to tools. [W3C evaluation guidance](https://www.w3.org/WAI/test-evaluate/)

## Fix-first findings

Priorities describe classroom risk, not a formal accessibility-conformance classification.

| Priority | Problem | Evidence | Required outcome |
| --- | --- | --- | --- |
| P1 | Linked clocks can disagree with the student examination | Live browser/API reproduction: a ready clock saved at 0.1 minutes ignores another saved update to 0.2; after Start, projection uses 6 seconds while students use 12. Live display-only edits can also show 30 minutes against the students' 90. | One authoritative timeline for every linked display and student; separate decorative settings from timing. Make unsupported edits unavailable or require an explicit standalone copy. |
| P1 | Editing AP instructions removes timed sections/breaks from the saved paper | Runtime package/parser comparison: unchanged preview/package/parsed phases `3/3/3`; append one instruction sentence and get `3/0/0`, with total duration still 205 minutes. | Editing wording or marks must not silently change timing enforcement. Preview and saved paper must use the same effective schedule. |
| P1 | A student can be told work is saved when it is not | Browser fault injection: failed save requests plus storage quota errors produced “Offline — saved on this device”. Reload showed no leave warning and the newest answer was absent from the recovered server response. | Distinguish server saved, device only and not saved anywhere; actionable persistent warning and recovery for the last state. |
| P1 | End exam is immediate and irreversible through the UI | Source-confirmed action submits all remaining responses, including extra-time candidates, without confirmation. | Name the class/paper and affected candidates; explain consequences; Cancel must change nothing. |
| P1 | Changing paper format can discard the draft | Source-confirmed reset clears questions and attachments; no recovery or point-of-loss confirmation. Question removal also has no undo. | Preserve recoverable drafts, confirm incompatible conversion and support undo. |

Exact source locations, reproduction details and acceptance checks are in the [teacher code review](2026-09-05-ui-ux-teacher-code-audit.md), [student accessibility/trust review](2026-09-05-ui-ux-student-accessibility.md) and [clock review](2026-09-05-ui-ux-clock-audit.md).

### Next-priority usability work

- Saved papers need **Preview**, **Edit a copy** and **Use for an exam**, without changing already-used paper versions.
- Ready sittings need their own waiting count/names. A signed-in class member is not necessarily waiting for that exam. In this pilot, the student showed a connected waiting room while the ready session's API candidate count was zero.
- Give repeat sittings dates and make older history accessible; the current list stops after the newest 30 in each active/archived query.
- Keep keyboard focus at the destination after sidebar navigation. Live test: activate Overview, then Tab, and focus moves to the sidebar Classes button rather than the overview controls.
- Give dialogs programmatic names; preserve focus when changing essay choices and correct the active-question target for global Flag when using canvas/typed working.
- Place errors next to their fields and link them from a focused summary. This is supported by the [GOV.UK error-summary pattern](https://design-system.service.gov.uk/components/error-summary/), not merely a stylistic preference.
- Correct source-launch messaging: the raw `bun server.ts` dashboard says classroom sharing is “below”, but those controls are only present in managed app mode. The isolated source launch demonstrated this mismatch. This is not a finding that packaged classroom sharing is broken.

## What the technical pilot actually exercised

The complete human-study protocol is in [Usability Test Plan](2026-09-05-usability-test-plan.md). The eight tasks below were sampled with different evidence methods; this is deliberately not an “8/8 passed” claim.

| Task | Evidence collected this run | Outcome / limit |
| --- | --- | --- |
| T1 Prepare a class | Created fictional class and student in the UI; exported and reimported CSV through actual APIs | Export 200, import 201; one class and one student unchanged, no duplicate. Late-arrival UI scenario not separately exercised. |
| T2 Prepare/check a paper | Current builder source review and AP packaging/parser probe | Phase-loss defect verified. Draft-loss path source-confirmed. No complete new paper authored through the browser in this pass. |
| T3 Arrange a sitting | Selected class → IB system → English B reading paper → Set up exam | Correct draft appeared for the signed-in student; remained waiting until Start. |
| T4 Join/read | Chose student name, selected sitting, entered waiting room; automatic exam transition after teacher Start | Three resource buttons; all 34 question cards and answer choices exposed during reading; response inputs disabled. Text C selectable without changing which question is selected. |
| T5 Correct timing | Independent clock browser/API probes, including simple ready, live and AP phased timing | Reproduced disagreement. Three simultaneous exams succeeded across three different classes; only one live sitting per class is currently supported. |
| T6 Save/recover/submit | Typed one synthetic answer and a notepad entry; reload/re-enter; injected storage+save failure; recovered; submitted | Normal saved answer/notepad survived. New fault-probe answer did not; misleading save status verified. Submission warned of 33 incomplete questions and showed a final receipt. Canvas-page and audio flows were not newly browser-tested here. |
| T7 Retrieve result | Opened candidate in teacher submissions | Original saved answer, all question content and notepad available in review, with print controls. OS print dialog/PDF pagination were not exercised in this pass. Older-history limitation source-confirmed. |
| T8 Multiple timer-only exams | Custom-clock runtime/refresh tests and code review | Single temporary custom countdown exists. Persistent independently controlled multi-clock board does not; proposal below. |

### Automated verification

- `bun test`: **273 passed, 0 failed, 10,410 assertions across 38 files**.
- `bun run check`: passed.
- Clock reviewer separately reran the existing countdown/timing subset: **19 passed / 44 assertions**. This is a subset, not 19 additional unique tests.
- Teacher viewport at 390 CSS pixels measured document/client width **390/390**; submission view at 1440 measured **1440/1440**. This does not establish full zoom/reflow compliance.

The passing suite does not invalidate the reproduced defects: it does not currently cover these combinations of edits, windows and persistence failure.

## Screenshots from this review

### Teacher dashboard

![Teacher desk with current sample count](../../output/playwright/ux-teacher-overview.png)

### English B reading time

This synthetic sitting used **30 seconds reading**, set through the ready-session API to keep the technical pilot short; the 60-minute writing duration and saved library paper were unchanged. The screenshot shows Text C while question/answer content remains available in the other pane. No claim about completing a full-duration exam is made.

![Three-text reading view during the reading lock](../../output/playwright/ux-student-reading.png)

### Fault-injected save reassurance

![Incorrect device-saved reassurance under synthetic storage and save failure](../../output/playwright/ux-save-false-assurance.png)

### Teacher response review

![Teacher can open the submitted candidate paper](../../output/playwright/ux-teacher-submission.png)

Additional captures: [student waiting](../../output/playwright/ux-student-waiting.png), [submission confirmation](../../output/playwright/ux-student-submit-confirm.png), [390px teacher view](../../output/playwright/ux-teacher-mobile.png), [stale linked clock](../../output/playwright/ux-clock-stale-draft.png), [flattened AP display](../../output/playwright/ux-clock-flattened-phases.png).

## Standalone clock: proposed workflow

Give teachers an explicit choice between **Linked exam clocks** and **Clocks only**. A clocks-only timer does not require a digital paper, class roster or student-response record.

Each timer should have a saved identity, exam/room label, reading duration, working duration and optional names/notes. It remains **Ready** until Start. A board should display one or several independent timers, with an **Open display** action for a second-screen window. Editing a timer should show which exam is affected and never silently switch modes, remove breaks or alter another timer. Reload should restore the same board and timer state. Keep sounds off by default.

This is a design proposal, not an implemented feature. The [clock report](2026-09-05-ui-ux-clock-audit.md) details lifecycle, persistence, separate controller/display roles and acceptance tests. First fix linked-clock authority; adding another interface on top of inconsistent timing would not make it safe.

## Suggested delivery order

1. Resolve clock/student timing authority and AP schedule serialization; add regression tests for stale and concurrent views.
2. Make save status truthful; protect student answers and teacher drafts; confirm End exam.
3. Improve saved-paper review, waiting rosters, dated history, field errors and keyboard/dialog behavior.
4. Build the explicit standalone multi-clock workflow.
5. Run the prepared protocol with non-technical teachers/students, then update the guide screenshots from the verified interface.

Task-based observation and neutral prompts follow [GOV.UK moderated usability-testing guidance](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing). Use actual participants to test terminology, discoverability and confidence; agent completion is not a substitute.

## Reproduction and scope record

- Source checkout HEAD: `7efdfbf7005ab2deb27b092071d41665ece05923`, **with substantial existing uncommitted changes**. The hash alone is not the tested application version.
- Runtime: Bun 1.3.14; browser reported version `152.0.7977.77` on this Mac. Main teacher/student sessions used port 9154 and fresh database `/tmp/digitaldp-ux-qa.NW4qbb/digitaldp.sqlite`. Clock reviewer used a separate fresh database/port 9155.
- Direct source launch begins with an empty paper library; seeded the existing 52 original demo papers into the scratch database for this review. This does not represent a packaged-app seeding failure.
- Main fictional sitting: `0971ac60-f236-4557-a6ee-5b38c5aad956`; class code `UXQA`. No real names or classroom database were used.
- Fault probe aborted only `/api/student/response` and made `Storage.prototype.setItem` throw a synthetic quota exception. After the failure, reload generated no navigation-warning dialog, and the server still held the earlier answer. Fault hooks were removed and a clean reload restored normal operation before submission. A transient bootstrap screen during fault teardown is not classified here as an independently reproduced production defect.
- Installed skill SHA-256: `df2dfa5a4508d5c6e1b1c220fc4edb324f05d6c0ff8c3c6071ccfb5eccf4fc5b`.
- Reviewed file SHA-256: `public/admin.js` `5e472019ada6e12e3c61485c4d2ba09bce6cd04320a36395b7cb9e350be53fdc`; `public/paper-builder.js` `b1488aca6c53394a0a7eb73c5c77769e0f99ea3f66b9d40e00cf278a2042efb7`; `public/countdown.js` `cb7e8a1265d23297425237fbcb5248dac878d4182f16d344568f7382813ec5f3`; `public/exam.js` `43fcd29634c4f142b4ba5b298c14efd8253eaffa954b7c33c19797fbef6d9413`.
- Owned teacher/student/clock browsers and test servers were stopped. No listeners remained on 9154/9155. Scratch data retained for reproduction.
- No application code fixes, Git commits/pushes, release builds or publishing occurred. Main user guides were not refreshed in this audit; screenshots above are audit evidence, not replacements silently inserted into the guide.
- Not covered: real participant sessions, real screen-reader speech, physical pen/projector use, LAN student devices, Windows/Linux/Safari/Firefox runtime behavior, signed standalone installers or full-duration exam pacing.
