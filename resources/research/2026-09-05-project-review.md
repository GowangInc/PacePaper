# DigitalDP project review — 5 September 2026

## Result and scope

Reviewed and updated the local `0.1.0-demo.5` source, teacher/student flows, illustrated guide, bundled examples and current non-IB presets. Three parallel reviews covered AP accuracy, IGCSE/Pearson accuracy and guide consistency. This is a verified practice-app review, not certification for administering official examinations or a complete subject-specialist moderation of every question.

## Changes completed

- Paper library now has an exam-system filter, multi-word search, result count and bounded scrolling. Long titles and Export controls fit without squeezing titles into a narrow column.
- Session selection starts with the exam system. Filtered paper labels no longer repeat the system. A **Before you start** panel shows actual question-card count, marks, time, calculator/reference requirements and expandable instructions.
- Teacher desk, Classes and students, Sessions and Paper library wording is consistent. Sidebar navigation is immediate rather than animated. Student-reference validation is explained alongside the field.
- Fixed the student connection indicator staying on “Connecting” after a connected view was rebuilt. Real socket state survives view changes; polling alone does not imply a live connection. Stale events from stopped sockets are ignored.
- Long clock titles no longer push the timer outside a classroom-sized display. The full title, URL, names and schedule remain visible at the tested desktop sizes.
- Updated AP Biology's May 2027 nongraphing-calculator rules and equations/formulas-sheet reminders. Explained the difference between real Bluebook calculators and DigitalDP's teacher-supplied devices.
- Added normal 2027 session choices for Cambridge/Pearson. Added Cambridge's calculator restrictions and answer-accuracy conventions.
- All 46 generated manifests and portable sample packages were rebuilt. Non-IB instructions explicitly distinguish compact content from full-clock timing and accelerated walkthroughs.
- Sample refresh now recognizes known untouched bundled examples, upgrades unused copies safely and preserves teacher changes and session-bound papers/responses. Old session-bound examples are labelled “earlier demo version” when superseded. Restart is idempotent.
- Teacher results now include timed-phase metadata, so AP totals are not mislabelled as writing time. Printed single-choice questions include every answer choice as well as the student's response. Internal sample-version slugs are shown as “Original practice sample.” Print rules keep short choice questions and prompt paragraphs together where possible.
- Updated Markdown and self-contained illustrated HTML guides, screenshots, startup instructions, backup guidance and source-versus-release wording. The teacher sidebar opens `/guide`; compiled builds include it with a stylesheet-specific CSP hash. No personal computer name or user-specific filesystem path remains in either guide.

## Non-IB timing and format spot check

| Implemented format | Verified timing | Other verified details |
| --- | --- | --- |
| Cambridge 0580 Core P1/P3 | 90 minutes each; no separate reading time | 80 marks; 50% each. P1 no calculator, P3 scientific calculator. |
| Cambridge 0580 Extended P2/P4 | 120 minutes each; no separate reading time | 100 marks; 50% each. P2 no calculator, P4 scientific calculator. |
| Pearson Mathematics A linear, Foundation/Higher | 120 minutes per paper; no separate reading time | 100 marks; 50% each; calculator permitted; tier-specific formula sheet. |
| Pearson Mathematics A modular, Foundation/Higher | 120 minutes per unit; no separate reading time | 100 marks; 50% each; calculator permitted; correct unit/topic allocation in sampled questions. |
| AP English Language, May 2027 | 60 + 10-minute break + 135 = 205 minutes elapsed | Real exam: 45 MCQ and three essays. Suggested 15-minute synthesis reading/planning is within the FRQ time, not a locked pre-reading period. |
| AP Biology, May 2027 | 90 + 10-minute break + 90 = 190 minutes elapsed | Real exam: 60 MCQ; two 9-point long and four 4-point short FRQ. Scientific nongraphing/four-function calculator and equations/formulas sheet. |
| AP Calculus AB, May 2027 | 62 + 38 + 10-minute break + 30 + 60 = 200 minutes elapsed | Real exam: 29/13 MCQ split and 2/4 FRQ split; no/graphing/graphing/no calculator across work parts. This is the new May 2027 pattern. |

Primary evidence and fuller caveats are in [AP spot check](2026-09-05-ap-spot-check.md) and [Cambridge/Pearson spot check](2026-09-05-igcse-spot-check.md). Sources include the [College Board calculator policy](https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/exam-policies/calculator-policy), [official fall-2026 Calculus changes](https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications-effective-fall-2026.pdf), [Cambridge 2025–2027 syllabus](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf), [Pearson linear specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf) and [Pearson modular specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2024/specification-and-sample-assessments/int-gcse-mathematics-spec-a-modular.pdf).

## Verification

- Full suite: **235 tests passed, 0 failed, 2,349 assertions across 31 files**. TypeScript check and `git diff --check` passed. The guide-generation test caught a stale HTML copy during editing; rebuilding the guide resolved it before the final passing run.
- Real browser walkthrough against a separate temporary database: teacher login, create class/student, choose system/paper, start an AP Biology walkthrough, student class-code/name login, exam selection, MCQ answers saved, automatic progression to FRQ, timeout submission, and teacher retrieval of the recorded answers. No real class data was used or changed.
- Result print button invoked the browser print flow; an A4 PDF was produced and all pages visually inspected. The three saved MCQ responses and their complete choices are present. Unanswered FRQ are correctly labelled, not invented or scored.
- Teacher layout measurements at 375, 768 and 1280 pixels show no document-level horizontal overflow. The library was checked with 46 papers and a two-result AP Biology filter. Selected paper/focus remained stable across an 11-second presence-update interval.
- Clock checked at 1280×720 and 1920×1080, including controls shown/hidden. The student reconnect status was checked after a deliberate test-server restart. Console errors during that restart were connection-refused/teacher-session-expiry events, not unexplained JavaScript exceptions.
- Fresh locally compiled macOS arm64 executable ran from a temporary directory, without source-directory fallback. Checked embedded admin, new paper-library module, student, clock styles, format profiles and guide against source bytes. Guide CSP matched. Database integrity passed; fresh seed 46, restart unchanged 46, zero conflicts or duplicates. Separate migration tests preserve edited papers and draft/live/ended-session records.
- No Windows/Linux installer, signed/notarized macOS download, real LAN student device, tablet/stylus hardware, listening-audio session or screen-reader workflow was independently exercised in this review. Automated tests cover relevant existing behaviours, but are not equivalent to those device checks.

## Remaining work before wider distribution

1. **Full non-IB mocks are not complete.** Cambridge/Pearson examples contain four questions each; Core/Foundation examples are absent. AP examples have a small MCQ selection; English source material and Biology topic range are too narrow for a full examination. Keep them as demonstration/training material until expanded, given worked mark schemes and moderated by subject teachers.
2. **Coverage is limited.** The implemented non-IB catalogue currently covers mathematics for Cambridge/Pearson and AP English Language, Biology and Calculus AB. It does not cover every counterpart to the IB subjects.
3. **Reference sheets are preparation requirements, not magically bundled assets.** Teachers must attach or distribute the correct current formula/reference sheet and supply permitted calculators. DigitalDP does not yet reproduce Bluebook's built-in calculator experience.
4. **AP break behaviour is adapted.** DigitalDP automatically advances after a fixed break; real Bluebook requires Resume Testing. Hybrid AP written responses are adapted to DigitalDP canvas/typed working. Recheck administration details when the May 2027 proctor guidance is published.
5. **The GitHub download is not this reviewed source.** Release listing checked during this review showed `demo.4 — Mac download unsupported` as the newest published prerelease. This review did not push, tag or publish a release. The local compile test does not establish Gatekeeper/notarization or Windows/Linux distribution readiness.
6. **Demo credentials remain intentional.** Startup resets teacher credentials to admin/admin, with local teacher access and trusted-network classroom sharing. This is not an appropriate public-internet production authentication model.

Existing unrelated worktree changes were preserved. Downloaded reference papers remain excluded from Git. Temporary testing servers were isolated from the user's normal ports and data.
