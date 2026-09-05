# DigitalDP framework-alignment and regression QA

| Field | Value |
| --- | --- |
| Date | 2026-09-04 |
| Candidate | `0.1.0-demo.5` working tree |
| Source runtime | `http://127.0.0.1:9166` with a fresh temporary SQLite database |
| Compiled runtime | Fresh macOS arm64 executable at `http://127.0.0.1:9167` with a separate fresh data directory |
| Browser | Google Chrome 152 via agent-browser 0.26.0 |
| Scope | Official-format reconciliation, original demonstration papers, Paper Builder controls, student waiting-room transition, responsive layout, complete automated suite, sample regeneration, and embedded standalone runtime |

## Outcome

The implemented Cambridge IGCSE Mathematics 0580, Pearson Edexcel International GCSE Mathematics A, AP English Language and Composition, AP Biology, and AP Calculus AB profiles now agree with the consequential timings, marks, parts, calculator rules, and response modes in the current official sources listed below. The application and its original demonstrations are ready for focused source review.

This result does **not** make DigitalDP an official examination platform. The AP profiles remain visibly labelled adapted where DigitalDP differs from Bluebook, and the standalone release is not publishable until the macOS app is Developer ID signed and notarized and the Windows/Linux bundles are exercised on their native systems.

## Official-source reconciliation

| Implemented route | Official facts checked | Result in DigitalDP |
| --- | --- | --- |
| Cambridge IGCSE Mathematics 0580, Core | Papers 1 and 3; 90 minutes; 80 marks; Paper 1 non-calculator; Paper 3 scientific calculator; current formula list supplied | Exact tier/components, timing, marks, calculator policy, required formula-list attachment, and physical instrument guidance |
| Cambridge IGCSE Mathematics 0580, Extended | Papers 2 and 4; 120 minutes; 100 marks; Paper 2 non-calculator; Paper 4 scientific calculator; current formula list supplied | Exact tier/components, timing, marks, calculator policy, required formula-list attachment, and physical instrument guidance |
| Pearson Mathematics A, linear 4MA1 | Foundation 1F/2F and Higher 1H/2H; 120 minutes, 100 marks and 50% per paper; calculator and tier formula sheet | Separate linear course route with exact tier/component choices and required formula sheet |
| Pearson Mathematics A, modular 4XMAF/4XMAH | Foundation/Higher Unit 1 and Unit 2; exact 4WM component codes; 120 minutes, 100 marks and 50% per unit; calculator and tier formula sheet | Added a distinct modular route with exact unit codes and required formula sheet |
| AP English Language and Composition | Fully digital; 45 multiple-choice questions in 60 minutes; 10-minute break; three free-response questions in 135 minutes including an optional 15-minute reading period | One 60-minute Section I, fixed 10-minute break, and writable 135-minute Section II; six original sources and three six-point free responses in the full-timing compact sample |
| AP Biology | Hybrid; 60 multiple-choice questions in 90 minutes; 10-minute break; six free-response questions in 90 minutes; two long questions worth nine points and four short questions worth four points | Exact phase timing and a full six-question, correctly weighted ink-response section; compact multiple-choice set remains explicitly labelled |
| AP Calculus AB | Hybrid; 29 non-calculator multiple-choice questions in 62 minutes, 13 graphing-calculator questions in 38 minutes, 10-minute break, two graphing-calculator free responses in 30 minutes, and four non-calculator free responses in 60 minutes | Exact five-phase timing/tool sequence and 2+4 nine-point ink free responses; compact multiple-choice set remains explicitly labelled |

Primary evidence:

- Cambridge, *Mathematics 0580 syllabus for 2025–2027*: <https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf>
- Cambridge, *FAQs for IGCSE Mathematics 0580/0980*: <https://help.cambridgeinternational.org/hc/en-gb/articles/360000559338-FAQs-for-IGCSE-Mathematics-0580-0980>
- Pearson, *International GCSE Mathematics A specification, linear*: <https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf>
- Pearson, *International GCSE Mathematics A modular qualification*: <https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses/mathematics-a-2024-modular.html>
- Pearson, *International GCSE Mathematics A specification, modular*: <https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2024/specification-and-sample-assessments/int-gcse-mathematics-spec-a-modular.pdf>
- College Board, *AP exam modes*: <https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/digital-ap-exams/exam-modes>
- College Board, *AP English Language and Composition exam*: <https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam>
- College Board, *AP English Language paper exam instructions*: <https://apcentral.collegeboard.org/media/pdf/ap-eng-lang-comp-paper-exam-instructions.pdf>
- College Board, *AP Biology exam*: <https://apcentral.collegeboard.org/courses/ap-biology/exam>
- College Board, *AP Calculus AB exam*: <https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam>
- College Board, *scheduled digital AP break*: <https://apcentral.collegeboard.org/help-center/how-does-scheduled-break-work-digital-ap-exams-two-sections>

## Corrections made

- Distinguished Pearson's current modular Mathematics A qualification from linear 4MA1 and added all four exact Foundation/Higher unit codes.
- Required the current Cambridge 0580 formula list in all four Cambridge presets.
- Removed calculator-dependent decimal work from the Cambridge non-calculator demonstration.
- Replaced an out-of-syllabus correlation-coefficient/least-squares task with scatter-diagram correlation and a line of best fit drawn by eye.
- Removed the artificial AP English input lock: the official 15-minute reading period is optional time inside the 135-minute free-response section.
- Rebuilt each AP full-timing sample to follow the published free-response count and point pattern while keeping shortened multiple-choice content clearly labelled `compact sample`.
- Relabelled the shortened Cambridge and Pearson demonstrations as `compact` so their full component timers cannot be mistaken for full 80- or 100-mark papers.
- Corrected the student live-state selector so a waiting room is not mistaken for an already-rendered exam.
- Stacked teacher paper-library and heading action rows at narrow widths to eliminate horizontal overflow.

## Automated verification

| Check | Result |
| --- | --- |
| `bun test --timeout 15000` | **208 passed, 0 failed, 2,008 assertions across 29 files** |
| Targeted builder/student/admin/sample tests | **45 passed, 0 failed, 1,355 assertions** |
| `bun run check` | Passed TypeScript checking |
| `bun run samples:build` | Wrote 46 editable manifests and portable DigitalDP papers |
| Course-library count | 46 manifests: 34 IB-oriented and 12 non-IB examples |
| `git diff --check` | Passed |

## Browser verification

- Cambridge Extended Paper 2 displayed 0 minutes reading, 120 minutes writing, 100 marks, no calculator, a required current 0580 formula-list attachment, and ruler/protractor/compasses guidance. [Screenshot](screenshots/cambridge-paper-2-builder.png)
- AP English displayed its optional reading period inside the writable 135-minute Section II rather than as a locked phase. [Screenshot](screenshots/ap-english-builder.png)
- AP Biology displayed 90-minute multiple-choice and 90-minute free-response phases around a fixed 10-minute break. [Screenshot](screenshots/ap-biology-builder.png)
- AP Calculus displayed the exact 62/38/10/30/60-minute sequence and changed calculator availability by part. [Screenshot](screenshots/ap-calculus-builder.png)
- A student signed in by class code and roster name, selected a draft Cambridge sitting, and entered its waiting room. [Before teacher start](screenshots/student-waiting-before-start.png)
- Starting that sitting through the authenticated teacher API changed the existing student page to `.exam-shell` automatically within 1.2 seconds. The exam title and Submit button were present, the waiting shell was gone, and no browser refresh was used. [After teacher start](screenshots/student-exam-after-start.png)
- Student layout at 390 px had a 390 px document width and no horizontal overflow.
- Teacher layout at 320 px had a 320 px document width, no horizontal overflow, and column-stacked heading/paper actions. [Final 320 px view](screenshots/admin-papers-320-final.png)
- Browser error and console collections were empty for both teacher and student sessions after the walkthrough.

## Compiled standalone verification

- A fresh macOS arm64 executable compiled from `release-app.ts`, launched on port 9167, accepted `admin` / `admin`, and exposed the embedded browser assets.
- A fresh external data directory seeded exactly 46 papers. SQLite `pragma integrity_check` returned `ok`.
- Restarting against the same directory reported `SEEDED 0` and `unchanged 46`, proving idempotent seed behaviour.
- The embedded `exam-format-profiles.js` contained the Pearson modular route and the corrected optional AP English reading-period description.
- Current sources cross-compiled successfully as Mach-O arm64, Mach-O x86_64, Windows PE32+ x86-64, and Linux ELF x86-64 executables.

## Deliberate limitations and remaining gates

- DigitalDP uses a fixed room-wide AP break; Bluebook waits for each candidate to select **Resume Testing**. AP profiles therefore remain `adapted`, not `official-format`.
- The AP Biology and Calculus canvas is a practice substitute for the official paper free-response booklet.
- DigitalDP describes graphing-calculator requirements but does not supply or certify an approved graphing calculator.
- Included demonstrations are original compact practice materials, not copied official or past papers.
- Formula/reference PDFs are required or recommended by the builder but must be supplied by a teacher who is authorized to use them.
- No real student device, isolated school VLAN, Windows host, or Linux host was available in this pass. Those remain mandatory pilot checks.
- No Developer ID Application identity or notary credentials are installed on this Mac. The protected release builder correctly refuses to produce another unnotarized Mac download.
- The `demo.5` working tree remains uncommitted and no release tag or GitHub asset was created in this pass.

## Review decision

The source application is ready for a human review of the implemented pilot profiles and original samples. It is **not yet ready for external binary distribution**. The next acceptance gate is a school-side pilot on one real student device for each delivery shape (paper-like canvas, fully digital typed, and hybrid), followed by native Windows/Linux smoke tests and Apple signing/notarization.
