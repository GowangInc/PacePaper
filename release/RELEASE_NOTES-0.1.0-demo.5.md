# DigitalDP 0.1.0-demo.5 — Windows/Linux practice demo

This review candidate expands DigitalDP from an IB-oriented classroom prototype into a provider-neutral practice-exam application while retaining the existing paper and response format.

## Downloads and update instructions

- Windows x64: extract the complete ZIP, then open `DigitalDP.exe`.
- Linux x64 (glibc): extract the archive, then run `DigitalDP`.
- macOS: **no Mac app is included in this release**. Apple Developer ID signing and notarization credentials are not configured. Use the updated source with `Start DigitalDP.command` or `bun run start:app` after the one-time Bun setup. Earlier Mac downloads remain unsupported.
- The illustrated HTML guide, text guide, these release notes, and SHA-256 checksums accompany the executables. This is a portable demo, not an installer or automatic updater. Windows may display a warning because the executable is not publisher-signed.

Before replacing an older app, finish all exams, stop DigitalDP, and back up its complete data folder using the guide. Replace the executable, not the data folder. The first launch safely adds or upgrades original examples while preserving teacher edits and earlier sittings. Restart the app and refresh all browser pages to use the new code.

## Current safety verification

The source safety pass completed 280 automated tests with 10,456 assertions and no failures, TypeScript checking, and browser failure-path checks for clock synchronization, stale timing edits, AP phases, attachment draft recovery, interrupted response saving, and End exam confirmation. The historical sections below record earlier checkpoints, not claims that old downloads contain these fixes. Platform build results are recorded separately on the GitHub release and workflow run.

The final source check, including explicit platform-selection tests, passed **284 tests with 10,467 assertions**, TypeScript checking, and the staged whitespace check. Native Windows and Linux startup/API checks are required before publishing the draft; macOS signing remains mandatory whenever a Mac target is selected.

## What to review

- Choose an exam system first in Paper Builder: IB DP, Cambridge IGCSE, Pearson Edexcel International GCSE, Advanced Placement, or School custom.
- Use the exact Cambridge 0580, Pearson Mathematics A linear or modular, AP English Language, AP Biology, or AP Calculus AB starters.
- Run an AP paper through multiple work sections and its monitored break. Prior sections disappear and are locked on the server after each boundary.
- Check that the current calculator or physical-material rule changes with the section on both the student page and second-screen clock.
- Use one of the accelerated AP walkthroughs to review the entire phase sequence in five to eight minutes.
- Confirm that all 52 original papers appear in a fresh standalone data directory, including 15 full-length non-IB mocks and three short AP walkthroughs.
- Review, print, or save the submitted candidate paper from the teacher dashboard.

## Important boundaries

- This is independent practice and familiarisation software, not an official examination-delivery system.
- Every included question is original. Protected guides, past papers, and the private `resources/` collection are not packaged.
- AP profiles are labelled adapted practice. The fixed classroom break advances automatically, whereas the official application requires a candidate resume action.
- DigitalDP states when an approved graphing calculator is required; it does not emulate or certify one.
- The demo teacher credentials remain `admin` / `admin` and are not suitable for real student data.
- A macOS download must not be distributed until the release workflow has Developer ID signed, notarized, stapled, and assessed it successfully.

## Verification completed on 4 September 2026

The following is the historical pre-expansion record. See the 5 September update below for the current library and release boundary.

- All 208 automated tests and TypeScript checking pass for legacy timing, ordered phases, profile serialization, server phase access, sample seeding, static assets, rosters, sessions, audio, ink, highlighting, printing state, and release runtime.
- A clean browser walkthrough covers roster creation, student exam selection, waiting room, teacher start, AP Calculus section changes, break lock, additional canvas page, final submission, teacher review, and the second-screen clock.
- The macOS host executable compiled and ran successfully, seeded 46 papers into a fresh data directory, passed SQLite integrity checking, served the embedded phase module, and restarted without duplicating papers. Windows x64 and Linux x64 cross-compilation also completed successfully.

## Source update on 5 September 2026 — not published

The library now contains 52 papers: 34 IB-oriented examples, 15 full-length non-IB mocks covering every currently supported component/tier, and three AP walkthroughs. Teacher-only worked guides, safe resource tables, long-title layout fixes and updated operating guides are included. The [delivery report](../resources/research/2026-09-05-full-mock-delivery.md) records research, 273 passing tests, all-15 API checks, representative browser/print checks and macOS arm64 embedding verification. These checks do not certify difficulty or official grade equivalence.

At the time of the library update, clock synchronization remained a release blocker. The subsequent source safety-fix pass below supersedes that finding. No new downloadable release or installer was published; the earlier compiled smoke test is not a signed/notarized distribution build.

## Subsequent safety fixes — 5 September 2026, still not published

- Linked clocks use saved timing even after decorative edits; stale ready-timing saves are rejected. Live and fixed-section timing edits are explicitly unavailable.
- Editing AP instructions or marks retains the phase plan; preview and saved schedule agree.
- Builder drafts retain attachments in browser storage, format changes require confirmation, and question removal has undo.
- End exam names affected candidates and requires explicit confirmation.
- Student save status distinguishes server, device-only and unsaved work. Retry, recovery downloads and leave-page warnings protect failure paths.

See [verification and remaining limits](../resources/research/2026-09-05-ux-safety-fixes.md). New signed builds and release publication are not part of this source-fix pass.
