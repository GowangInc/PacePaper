# DigitalDP UX safety fixes — 5 September 2026

The five P1 findings from the [UX review](2026-09-05-ui-ux-review.md) have been addressed in source. **No commit, push, new release build or publication was performed.** Existing GitHub downloads are unchanged. Restart the source application and refresh its browser pages to load the changes.

## Implemented boundaries

| Finding | Source behavior now |
| --- | --- |
| Linked clocks disagree with students | Linked displays always use the saved start, duration and phase plan, independently of title/name edits. Ready simple-exam timing changes are saved to the server; stale edits are rejected transactionally. Unsupported live/ended and fixed-section timing fields are disabled, never display-only. Mounted student state updates refresh the timeline without replacing editors. |
| AP instructions silently remove phases | Preview and upload share the effective phase plan. Wording/marks edits cannot remove sections or breaks. Fixed-plan total timing is read-only; inconsistent programmatic changes are rejected. |
| Failed saves falsely reassure students | Revision tracking distinguishes server saved, browser-only and unbacked work. An older acknowledgement cannot label newer edits saved. Retry, a JSON recovery download and a leave-page warning cover failure states. If a teacher ends an exam with unconfirmed work still in memory, the receipt retains an emergency recovery-download option. |
| End exam immediately submits everyone | A named native dialog identifies the paper, class and unsubmitted students and warns about extra time, last-saved responses and irreversibility. Cancel/Escape do not send End. |
| Format changes destroy a draft | IndexedDB retains questions, settings and uploaded Files. Format changes require confirmation and a successful draft save. Separate new drafts of the same format do not overwrite one another. Recovery selection, question-removal undo and sign-out/unload protection are included. |

Live schedule correction and a persistent multi-clock timer-only board are **not implemented**. Existing custom countdown remains temporary. Candidate extra time is separate from the standard room display. The developer reading-time environment override must be removed before clock timing edits; the API now rejects that conflicting configuration explicitly.

## Verification

- `bun test`: **280 passed, 0 failed, 10,456 assertions, 41 files**.
- `bun run check`: passed.
- `git diff --check`: passed; staging area remained empty.
- Static-asset tests include every new production module in the standalone embedding map and verify the served module graph.
- New/extended regression tests cover late acknowledgements, storage failure, transaction aborts, draft attachment snapshots, AP phase preservation, stale timing writes, clock lifecycle/timing authority and End-exam consequence wording.

### Browser/API checks actually run

These were agent-run technical checks in Chromium, not a human usability study or a WCAG certification. Used a fresh synthetic database at `/tmp/digitaldp-fixes-qa.rNoWvn/digitaldp.sqlite`, port 9154, fictional class `FIXQA` and Fictional Alex. No real classroom database was used. Seeded the 52 existing original papers.

1. **Two linked windows:** first clock saved 0.1 reading minutes and a custom room title; second saved 0.2. Both displayed 0.2 and the custom title stayed intact.
2. **Concurrent edit:** first window retained an unsaved 0.3 edit while the second saved 0.4. First display followed 0.4, its input retained 0.3, and its attempted save received a conflict rather than overwriting the newer timing.
3. **Teacher Start:** both clocks began with 24 reading seconds; student API reported exactly 24,000 ms reading and 3,600,000 ms writing. Live timing fields were disabled. The prior stale form value did not survive as projected timing.
4. **Mounted student:** changing candidate extra time by five minutes was picked up on the existing student's normal state refresh. Timer changed from `09:19` to `13:50` after elapsed time; the textarea DOM identity, keyboard focus and answer were unchanged. This verifies refresh without editor replacement, not live editing of the common exam schedule.
5. **AP serialization:** built a new AP English paper through the teacher UI with edited instructions and an attached image. Its saved clock retained 60-minute MCQ, 10-minute break and 135-minute FRQ. Even programmatically setting the disabled total input to 8 and applying display details restored 205 with all phases intact.
6. **Draft recovery:** edited a question and attached `app-icon-64.png` (8,148 bytes); cancelling a format change retained the selection/text/file. Reloading and restoring the draft recovered the same question and File. Removal/Undo changed card count `3 → 2 → 3`. Switching away and back to the same AP format retained both distinct drafts.
7. **Draft storage failure:** injected an IndexedDB open failure. The draft warning was truthful; attempted format change and sign-out preserved the current AP draft. Removing the fault restored successful local draft saves.
8. **Student save failure:** aborted response saves and made browser storage writes throw quota errors. The student saw `Not saved`, Retry and Download recovery; the real browser reload produced a beforeunload prompt. Cancelling retained the answer. Removing the faults and retrying saved it to the server.
9. **Acknowledgement race:** held the first response acknowledgement for two seconds, made a second edit while storage failed, then released the older acknowledgement. Status stayed `Not saved` until the latest edit was actually saved.
10. **End exam:** Cancel and Escape kept the session live. Escape restored focus to End exam. Confirm ended the session and teacher results retained the latest saved answer and notepad. In a second synthetic sitting with network/storage failures, forced ending retained the newer unsent answer in the downloadable recovery JSON; the receipt warned that the server might hold earlier work.
11. **Guide:** generated HTML from current Markdown, then opened `/guide`. Nine screenshot figures and ten images including the product icon all decoded successfully after scrolling. No obsolete unresolved-synchronization warning remained. New teacher and clock screenshots each measured 1280 CSS pixels wide at a 1280px viewport; this is not an exhaustive responsive audit.

## Evidence

- [Student failure warning](../../output/playwright/fixes-save-recovery-warning.png)
- [End confirmation](../../output/playwright/fixes-end-confirmation.png)
- [Builder recovery screen](../../docs/user-guide/screenshots/builder-draft-recovery.png)
- [Linked clock and saved phase plan](../../docs/user-guide/screenshots/linked-clock.png)
- [Downloaded recovery during failure](../../output/playwright/fixes-response-recovery.json)
- [Downloaded unsent work after ending](../../output/playwright/fixes-ended-recovery.json)

Both downloaded JSON files were read back and contained their exact synthetic latest answer. They are emergency response records, not importable teacher papers and not automatic submissions.

## Documentation and exclusions

Updated `USER_GUIDE.md`, regenerated `USER_GUIDE.html`, added/replaced relevant screenshots, and updated root/release documentation. Seven earlier workflow screenshots remain; this is not a claim that every guide image was recaptured this turn. The debugging skills led to failure-path regression tests; accessibility guidance informed native confirmation semantics, focus return and persistent save feedback.

Verified ignore rules for `resources/private/`, reference PDFs/media, local database files and generated release archives. No protected resource PDF/image/audio/video file is tracked in Git. Existing uncommitted project work was preserved; no broad staging occurred.

## Remaining limits and review work

- Browser-local drafts are per browser/origin; changing ports or browser profiles will not migrate them. Save to library and export to move a paper. Do not edit the same restored draft in multiple teacher tabs at once.
- Recovery cannot guarantee survival of a browser crash, cleared browser storage or failed file download. Students should keep the page open and involve the teacher.
- No real participant study, physical pen/device/LAN trial, Safari/Firefox/Windows/Linux runtime check, full-duration pacing assessment or new signed/notarized application build was performed in this fix pass.
- The P2 findings in the original review, such as richer library actions, waiting rosters and history/navigation refinements, remain separate work.

The test browsers and port-9154 server were stopped after verification; synthetic scratch data was retained. Real classroom servers were not restarted.
