# DigitalDP teacher workflow: source audit

Date: 5 September 2026. Scope: current working files, not the published release. Read-only application audit; the only file created by this reviewer is this report.

## Evidence and limits

Reviewed the teacher dashboard, collections, paper library, builder, and relevant persistence/manifest paths. Fetched the current [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), and searched/retrieved the Modern Web Guidance `forms` guide. The review prioritizes error prevention, recoverability, truthful status, and keyboard operation; stylistic preferences are not treated as usability requirements.

Findings below distinguish code-confirmed behavior from its inferred classroom consequence. One serializer/parser defect was also reproduced with a synthetic in-memory fixture. This is not a participant study, screen-reader certification, live-network test, or teacher-observed task-success measurement. No classroom records were modified. The separate browser walkthrough provides additional evidence, not invented user observations.

Priority: P1 = fix before a dependable classroom trial; P2 = important workflow/accessibility improvement. These priorities are engineering judgments, not a numerical usability score.

## Findings by file

### `public/admin.js`

- **P1 — `public/admin.js:592` — End exam immediately submits every remaining candidate.** Lines 592–597 send the action without confirmation. `src/db.ts:736` ends the sitting and lines 744–747 submit all its responses, including candidates whose extra-time allowance may not be exhausted. No undo/reopen action is provided by the session action model (`public/admin-collections.js:356`). **Code-confirmed; consequence inferred:** an accidental click or wrong-row selection can terminate an entire class. Reuse the existing confirmation-dialog pattern, naming the class, paper, and affected candidates; explicitly explain final submission. Acceptance: Cancel leaves status/responses unchanged; confirmation affects only the named sitting and clearly warns about remaining extra time.

- **P2 — `public/admin.js:441` — Form submission errors are not tied to the relevant fields.** Generic mutation failures only call `announce` at line 451, rendered in the top-of-dashboard region at line 738. There is no field association or focus transfer in this handler. The student editor and builder already focus their own error regions (`public/admin.js:478`, `public/paper-builder.js:1004`), so error recovery varies across workflows. **Code-confirmed; consequence inferred:** a teacher at a long form can be told that saving failed without an efficient route to the correction. Add an in-form error summary with field links and associated messages; retain entered values. Acceptance: keyboard-only submission of invalid data announces the error and provides a direct route to the field without losing valid entries.

- **P2 — `public/admin.js:712` — Sidebar section navigation scrolls but does not move keyboard focus.** Buttons at lines 724–727 call only `scrollIntoView`. **Code-confirmed; consequence inferred:** after choosing Paper library with the keyboard, subsequent Tab presses continue from the rail rather than the destination. Use native section links and appropriate destination focus/scroll behavior. Related: `public/admin-collections.js:395` gives repeated Start exam/End exam buttons no contextual accessible label, although export, remove, and submissions actions already have one. Acceptance: keyboard users reach the destination controls in logical order, and a controls list distinguishes the exam/class for each start/end action.

### `public/paper-builder.js`

- **P1 — `public/paper-builder.js:561` — Editing ordinary AP instructions silently removes the timed section plan.** `presetMatches` requires exact original instructions, paper label, marks, timing, and any required document (lines 561–568). Line 593 serializes phases only when that entire match holds, while preview always shows the selected format's phases at line 439. `src/papers.ts:267` accepts absent phases. **Runtime-confirmed:** AP English Language changed from 3 saved phases to no phases after appending one instruction sentence, while the preview retained 3 phases and total duration remained 205 minutes. **Consequence inferred from timing/access code:** the adapted paper loses separate section/break enforcement, not merely its profile label. Separate format-fidelity metadata from the functional schedule; derive preview and saved data from the same effective plan. If timings are incompatible, require an explicit adjustment rather than silently dropping phases. Acceptance: changing title/instructions/marks alone preserves section/break rules; incompatible timing changes explain the choice; preview equals the saved schedule.

- **P1 — `public/paper-builder.js:752` — A format change destroys an in-progress paper without an intervention at the point of loss.** `hideSetup()` clears the questions, PDF/audio selection, and source text (lines 752–760); all format selectors invoke that path (lines 974–978). The warning at line 631 describes this but does not prevent an accidental change. Removing a question immediately splices it at line 886. No draft recovery, undo, or unsaved-navigation guard appears in the reviewed builder/dashboard code; sign-out replaces the view (`public/admin.js:658`). **Code-confirmed; consequence inferred:** one wrong selection can lose substantial teacher authoring work. Preserve a recoverable draft, confirm incompatible format changes, and provide question-removal undo. Acceptance: Cancel preserves all questions/media; deliberate conversion explains incompatible fields; reload/navigation can recover the draft or explicitly warns before losing it.

- **P2 — `public/paper-builder.js:650` — Maximum-marks limits contradict the server.** The input permits 10,000; client validation at lines 556–558 agrees. `src/papers.ts:367` permits only 1,000. **Code-confirmed:** inputs from 1,001 through 10,000 can pass these client constraints but fail server parsing. Align the contract and provide a field-level explanation. This is an edge case rather than a common exam requirement, but it illustrates why frontend/backend form limits should share tests. Acceptance: the highest permitted value saves; the next value receives an actionable error at Maximum marks.

### `public/admin-papers.js`

- **P2 — `public/admin-papers.js:31` — Saved papers have Export but no Preview, Edit a copy, or Use for an exam action.** Library rows at lines 31–46 expose metadata and export only. The setup summary at lines 50–66 shows counts/timing/instructions, not the actual questions and media. The full preview is available only for the in-progress builder. **Code-confirmed; consequence inferred:** a teacher cannot efficiently moderate a previously saved/imported paper before assigning it, and must leave the ordinary workflow to inspect or amend it. Add a read-only saved-paper preview, a copy-based editing route, and a shortcut to set up a sitting. Preserve immutable papers already used by sessions. Acceptance: a teacher can inspect questions, choices, media, and effective timing without starting a student sitting; changes create a distinct version without altering previous responses.

### `public/admin-collections.js` and `src/db.ts`

- **P2 — `public/admin-collections.js:431` — Ready exams do not show who is waiting for that specific exam.** The row displays only Ready to start. `src/db.ts:770` counts response rows, which are created at start (`src/db.ts:723`), not at waiting-room selection. Class-level online status uses recent activity (`public/admin-collections.js:213`) and is not proof of choosing the intended sitting. **Code-confirmed; consequence inferred:** a teacher cannot distinguish everyone ready for this exam from merely signed in, particularly with concurrent exams. Provide a per-sitting waiting count and names, with explicit disconnected/changed-selection states. Acceptance: two ready exams show separate queues; a candidate switching exams leaves the previous queue; stale devices are not described as ready.

- **P2 — `src/db.ts:784` — Session history stops at the newest 30 without a teacher-facing continuation.** `listExamSessions` applies `LIMIT 30` separately to active and archived lists. Dashboard lists (`public/admin.js:843`) have no pagination/load-older control. Session row details (`public/admin-collections.js:369`) omit dates despite `createdAt`, `startedAt`, and `endedAt` being available. **Code-confirmed; consequence inferred:** older submitted work becomes unreachable through the ordinary list, and repeat sittings of the same paper/class look alike. Add dated sitting labels plus active/completed filters and an explicit older-results route. Acceptance: the 31st and older sitting can be opened, and duplicate paper/class sittings are distinguishable without reading internal IDs.

## What is already working well

- `public/admin.js:724` / `public/admin.js:894` — a small Teacher desk navigation vocabulary, with the long paper library moved to the end.
- `public/admin-papers.js:17` / `public/admin-papers.js:69` — library search and exam-system filtering; setup requires selecting a system before a paper, with useful empty states and timing summaries.
- `public/admin-collections.js:54` / `public/admin-collections.js:76` — stable, natural ordering and selector options left untouched when unchanged. `public/admin.js:97` / `public/admin.js:922` — periodic refresh updates presence rather than rebuilding the whole dashboard. Structural updates still occur on explicit admin-state events; this is not a claim of zero refreshes.
- `public/admin-collections.js:116` / `public/admin.js:608` — removal of classes/students/sittings uses clear consequences, confirmation, reversible archiving, and focus restoration. That pattern is available to improve End exam.
- `public/paper-builder.js:643` / `public/paper-builder.js:668` — authoring is broken into meaningful details/materials and question/response-area groups. Native labels, fieldsets, buttons, and controls support understandable interaction.
- `public/paper-builder.js:884` / `public/paper-builder.js:907` — question reordering has button alternatives and restores focus, rather than relying on drag alone. The live preview is a keyboard-focusable region at line 684.
- `public/admin.js:441` / `public/paper-builder.js:993` — requests generally disable the relevant submit button during the request, not before input is valid.

## Synthetic phase-loss check

Executed `packageData` and `parseManifest` under Bun 1.3.14 using in-memory controls and two synthetic question cards. No browser or database was involved. Required empty optional fields were supplied as empty strings, matching real builder controls.

```json
{"unchanged":{"previewPhases":3,"packagedPhases":3,"parsedPhases":3,"duration":205,"sectionIds":["section-1","section-2"]}}
{"editedInstructions":{"previewPhases":3,"packagedPhases":0,"parsedPhases":0,"duration":205,"sectionIds":["section-1","section-2"]}}
```

The only change between successful samples was appending ` Show your working clearly.` to the default AP English instructions. This check is diagnostic evidence, not a permanent regression test; a production fix should add one.

## Recommended sequence

1. Correct schedule serialization and clock/student timing authority; protect End exam.
2. Add draft recovery and saved-paper preview/copy editing.
3. Make readiness and duplicate sittings explicit, with accessible history navigation and form errors.
4. Repeat the scripted teacher/student walkthrough, then run a small moderated study with actual non-technical teachers. Measure task completion without help, mistakes that affect students, recovery, and confidence; do not convert this source audit into a claimed user success rate.

No redesign is necessary to address these issues. The existing utilitarian Teacher desk structure is a suitable foundation; the highest-risk problems concern trust in state and recovery from mistakes.
