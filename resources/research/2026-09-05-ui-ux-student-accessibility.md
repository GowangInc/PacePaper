# DigitalDP student accessibility and trust review

Date: 5 September 2026. Reviewed current source: `public/student.js`, `public/exam.js`, `public/ink-canvas.js`, relevant `public/styles.css`, and shared view/status helpers. No application edits or student-data writes were made.

This is a targeted source audit against W3C guidance, not a WCAG conformance certificate or a study with assistive-technology users. Code paths are confirmed below; predicted effects on focus/speech are identified as needing browser/assistive-technology validation. The main review performs the separate browser walkthrough. Engineering priorities: P1 before a dependable classroom trial; P2 important corrective work.

## Actionable findings

### P1 — A failed local backup can still be described as safely saved

`public/exam.js:339` — `persistLocal()` catches storage failure and returns false. `markDirty()` recognizes that result at line 367, but the network-error branch at line 400 unconditionally says **Offline — saved on this device**. With both storage and server unavailable, the newest work is only held in memory. The unload handler at line 975 retries local persistence but only requests a warning for playing audio, not an unsaved, unbacked-up answer.

**Code-confirmed condition; data-loss consequence inferred:** storage quota or unavailable storage plus a network failure can produce reassuring text even though reload/close would discard the newest work. This is primarily a correctness/recoverability defect, not a claim that every save-status string fails WCAG.

**Recommendation:** retain the local-persistence outcome for the current draft revision. Distinguish server saved, device only, and not saved anywhere. The last state needs persistent, actionable wording, an accessible announcement, and a leave-page guard where supported. Do not claim saved until the corresponding revision is actually persisted. [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) supports programmatically exposing important save/error states.

**Acceptance:** simulate quota failure, disable networking, enter an answer, then attempt reload. No message claims device persistence; the student receives an actionable warning. Once storage/network recovers, verify the exact newest revision—not merely an earlier request—before announcing saved.

### P2 — Important dialogs lack an accessible name

`public/exam.js:248` — Instructions, Notepad, Accessibility, Response summary, and Final submission dialogs at lines 248–267 have visible headings but no `aria-labelledby` or `aria-label` on the dialog. `public/ink-canvas.js:469` has the same problem for Clear page. By contrast, the background-change dialog explicitly associates its heading at line 495.

**Code-confirmed:** visible heading text alone is not the dialog's programmatic label. Whether and how a particular screen reader compensates has not been tested. **Recommendation:** give each heading a unique ID and associate it with its dialog; link the concise final-submission/clear-page consequence where appropriate. Keep native modal behavior. [W3C Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) and the [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) establish the relevant semantics.

**Acceptance:** inspect the accessibility tree for each open dialog; it has the expected distinct name. Verify reading order, Escape/Cancel, and focus return with actual keyboard and screen-reader testing, including the long Instructions case.

### P2 — Choosing an essay prompt removes the focused radio control

`public/exam.js:674` — A choice change calls `renderQuestionPanel()` at line 678. `renderEssayChoice()` then replaces the viewer's children at line 655, including the focused radio, with no focus restoration. This differs from Response summary navigation, which deliberately focuses the chosen card at line 812.

**Code-confirmed removal; focus destination/browser impact to verify:** ordinary arrow-key selection can lose its place after one choice, frustrating comparison of prompts. **Recommendation:** preserve the choice controls and update the response area, or explicitly restore focus to the selected radio after replacement. Do not move focus into the editor on each arrow key. [W3C Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) provides the governing goal of an understandable, operable sequence.

**Acceptance:** Tab to the radio group; use arrows to inspect/change multiple choices; focus remains in the group and Tab then reaches the selected response area. Repeat with a screen reader; verify existing responses survive a choice change.

### P2 — Canvas/typed-working interaction can leave the global Flag aimed at another question

`public/exam.js:608` — The ink-response `onChange` only updates the answer and marks it dirty (lines 615–618). The card's pointer handler expressly skips the entire ink response at lines 645–647. `public/ink-canvas.js:845` saves typed working on input but does not report a question-focus change. The global Flag button uses the previously active ID at `public/exam.js:986`, and active-question state also controls relevant resources (`public/exam.js:429`).

**Code-confirmed mismatch path; reproduce in a multi-question paper:** after working in a different ink card, global Flag can target the prior card. Keyboard users entering the typed alternative do not trigger the ordinary short-answer/essay focus handlers. The inline per-question Flag remains a workaround, but the global control's target is not explicit.

**Recommendation:** give each response type a consistent, stable active-question/focus contract; include the active question in the global Flag label. Preserve the previous fix that prevents moving/resizing the canvas during pen-down. This is a functional consistency defect informed by [W3C Keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), not a demand to emulate freehand drawing with keys.

**Acceptance:** in a two-question ink paper, type in the second question and activate global Flag by keyboard. The second question is flagged, its context is clear, and drawing a stroke never triggers layout movement or an unintended line.

### P2 — Connection-loss status is not exposed as a live status message

`public/student.js:11` — connection changes replace text in `#connection-state`. The examination-selection and waiting-room elements at lines 246 and 323 are plain paragraphs without a status role/live region; the setter does not call the existing announcer. Other errors and roster updates do have live regions.

**Code-confirmed:** a visual disconnection/reconnection notice appears without equivalent status semantics. A screen-reader user waiting for an exam may not discover it unless they revisit the paragraph. **Recommendation:** announce meaningful connection transitions politely, deduplicate repeated notifications, and provide a clear next step when reconnecting persists. Do not announce every polling request. See [W3C Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

**Acceptance:** interrupt and restore a synthetic student's connection while focus remains elsewhere; exactly one useful notification per state transition is exposed, with no repeated polling chatter.

## Timing, zoom, and media: important boundaries

- **Do not announce the countdown every second.** `public/exam.js:908` updates a normal timer button; the phase summary is separately live, and `applyPhase()` returns early when unchanged (`public/exam.js:869`). That separation is sensible. The five-minute warning currently changes only border/text color (`public/styles.css:1928`) while the numeric time remains readable. Consider a one-time optional textual/announced threshold warning, especially when students are composing, but this is a proposed usability improvement—not a proven WCAG failure or a reason to restore beeping.
- **Do not assume every exam timer must be student-pausable.** W3C describes essential timing exceptions and third-party-controlled test accommodations. Decide the practice/accommodation policy explicitly and verify teacher-controlled extra time; do not let a generic web checklist silently change the examination conditions. [W3C Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)
- **Do not label freehand drawing itself keyboard-inaccessible.** The path-dependent exception is relevant; typed working is already available (`public/ink-canvas.js:831`). Where the underlying task is expressing text/mathematics rather than assessing handwriting, check that the alternative actually permits that task. [W3C Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- **No small-target or zoom violation is established by this source review.** Viewport metadata does not disable browser zoom (`public/index.html:6`), small-screen CSS stacks panes (`public/styles.css:3366`), and tools have substantial sizing (`public/styles.css:1901`). Measure real target rectangles/spacing and 200%/400% browser zoom, including sticky bars and the software keyboard. Apply [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), including their exceptions; a blanket 48-pixel rule is not the WCAG AA requirement.
- Images use resource labels as alternative text and document frames have titles (`public/exam.js:744`). That does not prove the materials are accessible: teacher-supplied diagrams need an appropriate equivalent, and PDFs require content-level review. Listening assessments require a deliberate accommodation route that preserves what is being assessed; adding answer-revealing transcripts or unrestricted pause controls globally is not a neutral accessibility fix.

## Existing strengths to preserve

- Native class-code input/name selection, labelled roster updates, request cancellation, and specific recovery copy (`public/student.js:85`, `public/student.js:136`, `public/student.js:176`).
- Response fields use native radio groups or labelled textareas; the rich editor exposes textbox/multiline semantics (`public/exam.js:513`, `public/exam.js:589`, `public/exam.js:621`). The paste handler inserts plain text rather than forbidding paste (`public/exam.js:529`).
- Two visible submission entry points, a final confirmation, and incomplete-question warning (`public/exam.js:199`, `public/exam.js:243`, `public/exam.js:828`).
- Keyboard-operable pane resizing with arrow/Home/End support (`public/exam.js:938`); keyboard ink-page navigation and focus on newly added pages (`public/ink-canvas.js:629`).
- Canvas background options are native labelled radios, the selected drawing/eraser tool has pressed state, Clear page requires confirmation, and corrupted response data is retained rather than overwritten (`public/ink-canvas.js:310`, `public/ink-canvas.js:368`, `public/ink-canvas.js:409`, `public/ink-canvas.js:817`).
- Global visible focus styling and reduced-motion rules (`public/styles.css:53`, `public/styles.css:3767`). Shared full-view changes focus the main application container (`public/app.js:23`), so a blanket claim that all student navigation lacks focus handling would be wrong.

## Suggested focused verification pass

Use an isolated synthetic class. Cover a single-choice question, essay-choice paper, two ink questions, and an AP phase transition. Test keyboard-only operation first, then actual VoiceOver/Safari and NVDA/Firefox or Chrome. Check named dialogs, prompt changes, resource/flag context, save-status failures, and connection transitions. Record observed focus/speech and task outcome rather than inferring screen-reader success from ARIA attributes. Follow with magnification/reflow and a non-technical student trial. This report contains no claim that those human or assistive-technology sessions have already occurred.
