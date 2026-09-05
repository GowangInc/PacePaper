# DigitalDP clock: usability and timing audit

Date: 5 September 2026. Scope: read-only application review, isolated synthetic-data browser/API checks, and a proposed standalone multi-clock workflow. **No application fix or new timer feature was implemented in this audit.**

## Outcome

The existing clock is useful as a large, quiet second-screen display, but it is not yet a dependable control surface for changing an examination's timing. A confirmed synchronization defect can leave the projected clock on a different reading duration from the students even when both changes were saved before the examination started. Fix this before treating clock controls as safe for classroom timing corrections.

There is already a **Custom countdown**, requiring no paper or candidate response records. It is only one in-memory countdown in each tab, defaults to an automatic scheduled start, and loses its configuration on refresh. A persistent board containing several independent exam clocks is **proposed, not implemented**.

## Methods and evidence limits

- Applied the installed **Usability Test Plan** skill to the clock-focused pilot plan below; used **Web Interface Guidelines** and the forms guidance returned by **Modern Web Guidance** to assess clarity, state and errors. These are evaluation aids, not proof of usability.
- Inspected `public/countdown.js`, `public/countdown-model.js`, `public/countdown.css`, `public/student.js`, `public/exam.js`, `server.ts`, `src/db.ts`, `src/db-schema.ts`, and `src/timing.ts`.
- Ran the existing countdown and timing tests: **19 passed, 0 failed, 44 assertions**.
- Exercised real Chromium and HTTP APIs against an owned loopback server on port **9155**, backed by `/tmp/digitaldp-ux-clock.CbIahG/exam.sqlite`. It contained 52 seeded examples, synthetic classes and a fictional student; the classroom database was not used.
- Browser interactions used labels/controls discovered in live snapshots. API requests were used to simulate another teacher window saving timing and to inspect the student-facing authority independently.
- The API fixture is `output/playwright/ux-clock-fixture.ts`. Viewport screenshots are linked below. They show the relevant scrolled controls, not a full-page visual review.
- The owned server and browser were stopped after testing; no listener remains on 9155. The synthetic database and evidence are retained for reproduction.
- No real teacher participants, screen-reader listening test, physical projector legibility study, Safari/Firefox/Windows test, long-duration drift study or intermittent-network study was completed. Do not report SUS scores, task-success percentages or real-user confidence from this agent walkthrough.

## Current capabilities — verified versus absent

| Capability | Current behavior |
|---|---|
| Clock for an existing examination | Supported through a session-specific clock link. An unspecified `/clock` chooses a live examination first, otherwise a ready one. |
| Ready linked examination | Remains ready until the dashboard starts it. A displayed future start date does not start the real sitting. |
| Edit simple ready reading/writing duration | Saved through the session timing API; decimals are accepted for reading minutes. `0.1` means six seconds. |
| Edit live or ended linked duration | Display-only; candidate timing API rejects live changes. |
| Edit a ready paper with separately timed phases | The API rejects this; changing the displayed total removes its phase plan from the display only. |
| Multiple real examinations | Three live sittings in three different classes succeeded in this audit. Only one live sitting per class is supported. Each has its own clock window; there is no combined clock board. |
| Custom clock without a paper | Supported while the application and teacher sign-in are available. It defaults to five minutes reading plus 60 minutes writing, beginning at the next five-minute boundary. |
| Multiple independent custom clocks | Separate tabs could each hold different temporary configurations; no persistent collection or common start/control board exists. |
| Start/Pause/Resume a custom clock | No dedicated controls. Teachers manipulate an absolute start date/time instead. |
| Recovery after refresh | Linked defaults reload; custom selection, entered names, title and timing are not persisted. An active linked sitting can replace the custom display on refresh. |
| Student names | Editable locally, independent of accounts. The parser silently caps displayed names at 60. |
| Presentation | Fullscreen request, hide-controls toggle, large tabular digits, phase labels and accessible phase-change announcements are present. |

## Ranked findings

### P1 — Previously applied linked clock ignores newer saved timing

`public/countdown.js:372` — a clock marked `displayCustomised` stops copying authoritative durations during same-status synchronization.

`public/countdown.js:384` and `public/countdown-model.js:165` — a later start transition updates the start timestamp/status, but preserves the stale durations.

`public/countdown.js:445` — even a successful save of ready timing marks the display customized. Cosmetic title/details changes use the same flag, coupling presentation to timing authority.

**Reproduction, observed:**

1. Open a ready Biology examination clock; reading is five minutes.
2. In the UI set reading to `0.1` and select **Save exam timing and update display**. Confirmation and server both report `0.1`.
3. A separate authenticated timing request saves `0.2` for the same ready session. It returns HTTP 200 and the admin state reports `0.2`.
4. The original clock still displays `0.1`; its loaded controls and schedule do not update.
5. Start that examination. The original clock preserves a six-second reading phase, while the actual student state contains a **12,000 ms** reading phase.

This is not merely an unsupported request to edit an already-live sitting. Both duration changes were made while the examination was ready. The stale start behavior is a confirmed correctness defect.

Evidence: [stale ready-clock controls](../../output/playwright/ux-clock-stale-draft.png). Session ID: `58ae2081-522c-4fb2-8805-381e9748e2a8` in the isolated database.

**Recommendation:** Separate decorative preferences from authoritative timing. Use a server-owned timeline/revision for linked clocks and candidate views; never detach timing because a teacher changed a heading. On conflicting edits, show the newer saved values and require an intentional new save rather than silently preserving obsolete time.

### P1 — Linked live controls visibly create a different room schedule

`public/countdown.js:157` and `public/countdown.js:448` — the same form changes from saving candidate time to display-only when an examination becomes live.

`server.ts:771` / `src/db.ts:699` — the only timing mutation updates ready sessions. A live timing request was rejected with HTTP 409, “Only a ready exam can have its timing changed.”

**Observed:** Change the live clock's writing duration from 90 to 30. The screen counts down roughly 29 minutes while the server retains 90 minutes; the success message says candidate records were not changed. The warning is accurate but is below the form and vanishes from view when controls are hidden. The projected heading remains the linked examination's name.

**Recommendation:** Do not permit silent timing divergence in linked mode. Until synchronized live corrections are implemented, make linked live timing read-only and provide an explicitly separate **Make a standalone clock** action. Later add a scoped correction dialog stating exactly which candidates/phases are affected, old/new deadlines, reason and confirmation. Do not flatten section schedules as a shortcut.

### P1 — Changing a phased total removes breaks and sections only from the room display

`public/countdown.js:200` — `phases` is retained only when both entered durations exactly match the saved session.

`public/countdown.js:526` — a small help message explains that editing the total turns the display into a custom writing countdown, but no deliberate conversion action is required.

**Observed:** The AP Biology walkthrough has 3 minutes multiple choice, 1 minute monitored break, and 3 minutes free response. Editing **Total timed minutes** from 7 to 8 changes the room schedule into **Reading 0 / Writing 8**. The server still holds 3/1/3. The phased timing API correctly rejects the attempted override with HTTP 409.

Evidence: [flattened phase display](../../output/playwright/ux-clock-flattened-phases.png).

**Recommendation:** Preserve the phase plan and expose phase-specific duration editing only where supported. A display linked to a candidate sitting must not advertise writing during a server-enforced break. A standalone copy should visibly say **Standalone — no student exam connected**.

### P1/P2 — Custom refresh can display the wrong exam; standalone state is ephemeral

`public/countdown.js:273` — choosing custom removes the session parameter instead of persisting an explicit standalone identity.

`public/countdown.js:578` / `public/countdown-model.js:156` — a reload with no session parameter prefers an ongoing real examination.

**Observed:** Select Custom countdown, set title **Standalone Chemistry Room A**, apply it, then reload. The title becomes the live Biology paper, the selection becomes its session ID, and its roster replaces the custom names. There is no warning or recovery of the custom configuration.

Severity is P1 if projected as the room's official schedule; otherwise P2 workflow/data-loss friction. A teacher can reasonably expect a configured clock to survive an accidental refresh.

**Recommendation:** Give every standalone timer a stable ID and explicit URL. Persist its configuration, start state and revisions. Restore the same timer after refresh. Do not automatically substitute a different exam when that ID is absent, deleted or inaccessible.

### P2 — Names and connection messaging do not reflect standalone operation

`public/countdown.js:540` — a student connection URL and extra-time messaging are shown even for a custom countdown with no candidate sitting.

`public/countdown-model.js:147` — only the first 60 names are rendered, without an error or count indicating omission.

**Recommendation:** In standalone mode hide student sign-in messaging by default; use optional **Names / room notes** with a visible count and a warning before a display limit. Keep names editable throughout. Offer name visibility independently from timer operation so a projector need not expose a full roster.

### P2 — Examination switching/reloading silently discards local work

`public/countdown.js:422` / `public/countdown.js:338` — switching examinations or reloading defaults replaces title, names and timing fields without asking about unapplied edits. `formDirty` protects against some background overwrite, but not intentional navigation or reload actions.

**Recommendation:** Autosave presentation fields per timer. Confirm discarding unsaved timing edits; keep field-level validation and place saved/error feedback next to the action. Use **Reading duration: minutes / seconds** instead of relying on decimal conversion for short demos.

### Supporting issue — mounted student timing cannot absorb a revised timeline

`public/student.js:401` — a new live state for the currently mounted session does not remount or update the exam component.

`public/exam.js:107` and `public/exam.js:909` — the timer retains its mount-time server offset and session timeline.

This was source-confirmed, not a separate supported live-update reproduction: the current API intentionally does not offer live session timing edits. It must be addressed as part of any live correction implementation, without remounting the page and losing focus, ink, audio position or unsaved text. Merely adding an API endpoint or websocket event would not solve this.

## What is already working well

- Linked ready sessions do not run before the teacher starts them; the normal start is server-authoritative.
- The clock anchors elapsed time to `performance.now()` after server synchronization; its visible phase labels are not color-only.
- Automatic phase announcements avoid announcing every second. Keep that behavior rather than turning the entire counter into a continually speaking live region.
- The interface uses real labels, form controls, buttons, status regions and a fullscreen failure fallback.
- Standard room time is distinguished from individual extra time. Do not change a room clock to claim that it represents every candidate's deadline.
- Three concurrent real exams across different classes succeeded. The same-class rejection worked, although the error “That code or active session already exists” should say **This class already has a live exam** and identify it.

## Proposed standalone clock workflow

This section is a design proposal, not a delivered feature or a claim about official exam regulations.

### Entry and setup

Add **Examination clocks** as an independent teacher tool with two explicit paths:

1. **Display a DigitalDP exam** — choose a prepared/live sitting. Timing remains linked to that examination's server authority.
2. **Use clocks only** — no class, paper upload, student sign-in or response records required.

In clocks-only mode select **Add clock**, then enter a short examination name, reading duration and writing duration. A researched format preset may prefill timings, but the teacher should see and confirm the actual schedule. An optional **Sections and breaks** expander handles complex exams without burdening simple ones. Student names and room notes remain optional and editable.

Default to **Start when I press Start**. **Schedule a start time** is a clearly labeled alternative, with the date, local timezone and upcoming start shown for confirmation. Do not start a countdown merely by opening or saving the setup form.

### Running one or several clocks

- Each clock gets its own **Start**, **Pause/Resume**, **Adjust time**, and **Finish** controls in standalone mode. Paused state must be explicit; **Finish** needs confirmation and should not delete the saved configuration.
- A board can show one, two, three or four selected clocks simultaneously. Use a stable layout, large digits and clear examination titles; no carousel or automatic focus switching.
- **Start selected clocks together** lists the selected clocks and confirms their durations. Different clocks can also start independently.
- Each tile shows current phase, remaining time and expected end time. Phase names and next transitions remain visible; color is supplementary. No beeping by default.
- **Present board** opens a separate display window containing the selected clocks. Teachers keep editing in the control window; changes propagate to the display with a concise adjustment notice.
- More than four saved clocks may exist, but the teacher selects a readable group to project or opens another board. Validate physical projector readability before choosing the minimum tile size.
- Keep the roster optional on the display. In clocks-only mode omit the student-connection URL unless the teacher explicitly asks to show one for another purpose.

### Minimal persistence and synchronization design

Prefer a small timer/board model inside the existing local application, separate from `exam_sessions` and `responses`. “No student exam running” need not mean inventing another server or packaging system. Standalone timers should persist with the app's local data and require no cloud account.

Store a stable timer ID, configuration, phase plan, state, authoritative start/pause offsets and revision. Store board membership separately. Compute remaining time from timestamps, not decremented counter values. Presentation settings must not override a linked exam's timeline.

On reconnection, fetch the latest revision. Reject stale writes or show a conflict; do not silently overwrite another clock controller's change. After sleep/refresh/restart, restore the same identity and state. A disconnected display should show a persistent **Offline — using last saved schedule** label while continuing from its last valid anchor; it must not claim synchronized changes.

Allow simple export/import of timer templates and boards, excluding optional student names by default. The first iteration need not include cloud sharing, licensing, analytics or a new framework.

## Clock-focused usability study / pilot plan

### Research questions

1. Can a teacher distinguish a linked exam clock from a clocks-only timer before changing time?
2. Can a non-technical teacher set up and project two differently timed exams without help?
3. Can teachers correctly predict when reading starts and when student entry unlocks?
4. Can teachers recover from a refresh, mistaken duration or interruption without changing the wrong exam?
5. Can students identify their own exam and current phase on a classroom display?

### Method, participants and facilitation

Run moderated, in-person think-aloud sessions with **5–8 teachers** spanning low/high confidence and experience of simple/sectioned exams. Add **5–8 students** for display recognition and legibility, and include keyboard/low-vision access needs rather than treating those as optional cosmetic checks. Recruit through the school; use fictional names and test sittings. Obtain consent for any recording and keep records local/private.

Introduction: “We are testing the software, not you. Please say what you expect before clicking. You may stop at any time.” Deliver one task at a time without naming buttons. Ask neutral probes such as “What do you expect to happen?” and “How can you tell it saved?” Avoid coaching until recording the first unaided outcome; then provide a hint and log it.

Debrief: Ask what would make the teacher hesitate during a real exam, what they believe a time correction changes, and which clock they would trust if the displays disagree. Do not collect numerical confidence for the current automated walkthrough as if a participant supplied it.

### Tasks and proposed targets

Targets below are planning hypotheses, not measured performance or universal standards.

| Task | Success condition | Initial target |
|---|---|---|
| Prepare a paper-only room clock with five minutes reading and 60 minutes writing | Timer is ready, no student sitting created, no countdown started | 2 minutes |
| Add a second exam with a different duration and project both | Correct names/timings simultaneously legible | 3 minutes |
| Begin both exams after the room is ready | Explicit start; reading begins together; writing follows each correct schedule | 1 minute |
| Correct a ready linked exam to six seconds reading for a demo | Saved value reaches clock and student; teacher can explain six seconds | 2 minutes |
| Change only the heading and then receive a timing correction from another control window | Heading retained; authoritative duration updates; no stale schedule | 1 minute |
| Pause one standalone exam for an interruption, then resume | Other clock unaffected; pause and new end time clear | 1 minute |
| Refresh the presentation and recover the same clocks | Same IDs, titles, phases and remaining times; no accidental switch to a live sitting | 1 minute |
| From the back of the room, identify one exam's phase and remaining time | Student reads correct tile without relying on color or teacher explanation | 10 seconds |

Record completion (unaided/assisted/failed), time on task, wrong-exam actions, unsaved changes, errors, hints, and participant explanations. Ask a short post-task ease rating (SEQ) and optionally the standard SUS questionnaire after the full workflow. Preserve the instruments' scoring; label small-sample findings as formative.

Observation template: `participant segment | task | expected behavior | action/quote | observed result | help needed | time | error/recovery | severity | evidence link`. Aggregate by failure pattern; prioritize timing divergence and wrong-exam actions above cosmetic improvements. Do not turn a small sample into a population-level success-rate claim.

### Pilot and engineering acceptance checklist

- Confirm the app and student devices share the intended local origin; use a disposable database and synthetic roster.
- Before participants: fix confirmed divergent schedules or mark the related tasks as prototype-only; do not run a real examination on knowingly inconsistent timers.
- Verify zero/6-second/five-minute reading, simple and multi-phase plans, reading/work/break/end boundaries, and standard versus individual extra time.
- Exercise two control windows, two display windows and mounted students; include stale writes, repeated save/start clicks, start/save races and reconnects.
- Test refresh, back/forward, closing/reopening a display, server restart, device sleep and system-clock change. Verify identity and timing, not just that a page rendered.
- Test keyboard-only form operation and projected status notices with a screen reader. Announce important changes, not every timer tick.
- Check one/two/three/four-clock boards on the actual classroom projector at normal viewing distance, at 1280×720 and 1920×1080, and with browser zoom.
- Confirm adjusting one standalone timer never modifies another timer or any student sitting. Confirm end/reset actions require deliberate targeting.
- Stop and record the failure if the projected phase disagrees with a student's allowed entry. A successful unit suite is not sufficient evidence of classroom readiness.

## Research basis

- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): supports explicit labels, useful action feedback, stateful navigation, unsaved-change protection and destructive-action confirmation. Style preferences are not treated as mandatory classroom requirements.
- [Nielsen Norman Group: usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): useful framing for visible system state, real-world language, consistent behavior and preventing mistakes. The clock-specific recommendations above are our application of these principles, not participant evidence.
- [W3C: status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): significant non-focus updates must be programmatically available to assistive technology. Preserve phase/status announcements without continuous per-second speech.
- [W3C: timing adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): discusses adjustment and exceptions where timing is essential. Do not assume every practice workflow is exempt or let students independently change a controlled exam's time; confirm accommodation policy and offer an appropriate untimed practice route when needed.

## Recommended implementation order

1. Repair linked clock authority, cross-window reconciliation and the mounted-student update path; add adversarial synchronization tests.
2. Remove confusing display-only timing controls from linked mode, preserving cosmetic editing.
3. Add persistent clocks-only identities with explicit Start and refresh recovery.
4. Add the small multi-clock presentation board and scoped controls.
5. Run the teacher/student pilot above; revise from real observations and refresh the screenshot guide after the workflow settles.
