# Full-length non-IB mock delivery — 5 September 2026

## Delivered scope

The current source now supplies one complete original workload for every **currently implemented non-IB component and tier**. This is not a claim to cover every course offered by these awarding bodies. The library totals **52 papers: 34 existing IB-oriented examples, 15 full-length non-IB mocks, and three accelerated AP walkthroughs**. Nine compact full-clock non-IB examples were replaced; six missing Core/Foundation components were added. The walkthroughs remain explicitly short workflow demonstrations.

| Route | Full mocks | Working time per mock | Raw marks |
| --- | --- | --- | --- |
| Cambridge Mathematics 0580 Core | Papers 1 and 3 | 90 minutes | 80 |
| Cambridge Mathematics 0580 Extended | Papers 2 and 4 | 120 minutes | 100 |
| Pearson Mathematics A linear | 1F, 2F, 1H, 2H | 120 minutes | 100 |
| Pearson Mathematics A modular | Units 1 and 2, Foundation and Higher | 120 minutes | 100 |
| AP English Language | 45 MCQ and 3 essays | 60 + 135 minutes | 45 + 18 |
| AP Biology | 60 MCQ and 6 FRQ | 90 + 90 minutes | 60 + 34 |
| AP Calculus AB | 42 MCQ and 6 FRQ | 62 + 38 + 30 + 60 minutes | 42 + 54 |

Each AP mock also includes one 10-minute monitored break. English's optional 15-minute reading/planning period is inside its 135-minute free-response section, with writing permitted immediately. The AP profiles target May 2027; Cambridge targets 2025–2027. Mathematics question-card counts are authoring choices, not asserted fixed official counts.

The 15 mocks contain **434 question cards**, many multipart, with separate worked teacher marking for every card. Candidate manifests and portable exports do not include the marking companions. The authenticated, local-teacher-only `/mock-guides` route opens the generated [marking guide](../../docs/mock-marking/index.html); responses are not automatically graded.

## Research and independent checks

Official-source references, component blueprints, calculations and limits are retained in these reports:

- [Cambridge 0580](2026-09-05-full-mock-cambridge.md)
- [Pearson linear and modular](2026-09-05-full-mock-pearson.md)
- [AP English Language](2026-09-05-full-mock-ap-english.md)
- [AP Biology and Calculus AB](2026-09-05-full-mock-ap-stem.md)

Separate agents authored and cross-checked the work. Corrections included an incomplete Cambridge distance-graph premise, excluded Pearson topics, an AP Biology chi-square sampling design that did not match its intended test, a direct-DNA-binding experiment clarification, and two AP English questions whose wording overstated their passages. Calculus numerical results were independently recalculated. These are internal reviews, not external moderation or psychometric calibration.

## Application integration and evidence

- `bun run samples:build` generates 52 editable manifests, 52 ignored portable packages, and the 15-guide teacher companion. `bun run guide:build` regenerates the illustrated operating guide. Source documents explain the new library and teacher-only guide.
- `bun run check` passed. Final `bun test`: **273 passed, 0 failed, 10,410 assertions across 38 files**. `git diff --check` passed. Tests include component/tier coverage, phase and mark totals, option bounds, key isolation, reference resolution, numerical solutions, safe sample migration, all 52 export/import round-trips, and safe table rendering.
- [Isolated API harness](../../output/playwright/fullmock-api-qa.ts) and [results](../../output/playwright/fullmock-api-qa-results.json): **15 mocks, 434 synthetic answers, 15,983 checks**, including save/submission/teacher-result round-trips, ink strokes/pages, notepads and 19 AP phase-access rejections. Teacher guide access: anonymous 401, student 401, teacher 200. Cookies were neither recorded nor printed. Test phase advances changed only the explicitly named scratch database's start timestamps; this is **not a real-duration pacing or endurance test**. A final Calculus instructions-only disclosure was added afterwards; the final unit/round-trip and compiled checks use that revision.
- Chromium student UI: all six English synthesis resources available in the active FRQ section; 4-column/6-row Source C table renders semantically; highlighting a table cell persists through reload and exam re-entry. Shared table rendering also covers teacher preview and candidate print. Prose and malformed tables remain plain text; untrusted HTML is not interpreted.
- Long exam titles revealed a shared layout overflow. After the CSS repair, shell, top bar and workspace each measured exactly **1280 pixels at a 1280-pixel viewport** and **1440 at 1440**. At 390 pixels the shell remains 390, while the 480-pixel table scrolls inside its 358-pixel region. [Desktop student evidence](../../output/playwright/fullmock-student-synthesis.png).
- Teacher marking guide visually inspected at 1280 and 390 pixels. English candidate print generated from the actual teacher submission dialog: **29 A4 pages, 48 question cards, one data table, saved responses and candidate notepad**. The table page and final response/notepad page were rendered with Poppler and inspected for clipping, alignment and Unicode output. This is a representative print spot-check, not a rendered review of every page of every mock.
- A fresh **macOS arm64 compiled smoke executable**, run outside the source directory, seeded all 52 papers, served the identical embedded teacher guide and 31 byte-matching browser assets. Restart reported 0 created / 52 unchanged. This verifies embedding and startup, **not Gatekeeper approval, signing, notarization, Windows/Linux runtime behavior, or publication**. Test processes were stopped after QA; no real classroom database was modified.

## Review boundaries and release status

These are complete practice workloads, not awarding-body papers. Subject teachers must review taught coverage, pacing, difficulty, tolerances and marking before consequential assessment. Do not apply official grade boundaries. AP raw totals are not weighted percentages or AP 1–5 scores; the guides give separate practice-weighting calculations.

Original fictional nonfiction-style passages replace authentic published AP English sources. Some mathematical and scientific graphics use exact coordinates, models or text tables. Digital canvases replace paper answer booklets and calibrated instrument work. Teachers supply permitted calculators; DigitalDP does not emulate an approved calculator. AP break resume and administrative transition differences are documented in the individual guides. The current AP Calculus mock locks earlier parts and omits the two one-minute A-to-B administrative transitions; the report distinguishes paper-accommodation directions from hybrid directions instead of asserting an unverified universal revisit rule.

**The earlier clock-to-student synchronization issue remains unresolved and is a release blocker.** Expanding the papers does not fix it. No commit, push, tag, signed installer, GitHub release or update to an existing downloaded app was made in this work. Source users can add the examples with `bun run samples:seed`; app-launcher startup performs the safe library migration. Preserve existing classroom data and restart only outside active sessions.
