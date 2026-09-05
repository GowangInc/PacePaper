# DigitalDP 0.1.0-demo.5 release-candidate QA

| Field | Value |
| --- | --- |
| Date | 4 September 2026 |
| Test installation | Isolated SQLite database on `127.0.0.1:9164` |
| Browsers | Chromium automation plus Codex in-app browser for an independent teacher session |
| Scope | Fresh seed, teacher setup, student delivery, phased timing, clock, submission and review |

## Outcome

No application-blocking issue was found in this pass. The clean installation contained 44 papers and the full AP Calculus accelerated walkthrough completed successfully. The final automated run passed 205 tests with 1,953 expectations and no failures; TypeScript checking also passed.

## Verified path

1. Signed in as the demo teacher and confirmed 44 bundled papers.
2. Created `RC Calculus`, added candidate `Avery Chen`, and set up the AP Calculus AB five-minute walkthrough.
3. Signed in separately as the candidate, selected the sitting, and entered the waiting room.
4. Started the sitting from the teacher dashboard; the student timer began only then.
5. Verified Section I Part A without a calculator, then Section I Part B with the approved-graphing-calculator instruction. Earlier questions were no longer available.
6. Verified that the monitored break hid examination content and disabled response, flag, notepad, summary, and submit controls.
7. Verified the clock's five rows, current phase, next transition, candidate list, and student connection URL.
8. Verified final-section canvas controls and added Page 3.
9. Opened the response summary: earlier section rows were visible for review status but disabled, while current-section rows remained available.
10. Submitted from the final work phase and confirmed the final receipt screen.
11. Opened the completed response from the teacher dashboard and confirmed the browser-native print/save-PDF control.
12. Selected AP Calculus AB in Paper Builder and confirmed the researched 62/38/break/30/60-minute phase plan, part-specific calculator text, and section field on every starter question.
13. Compiled and ran the macOS host executable against a second clean data directory, checked SQLite integrity, verified the embedded phase script over HTTP, and restarted it with all 44 papers unchanged.
14. Cross-compiled the same final source successfully for Windows x64 and Linux x64. Platform-native launch still belongs to the signed release workflow and receiving-system smoke tests.

## Evidence

- [Section I Part A](screenshots/ap-calculus-part-1a.png)
- [Locked monitored break](screenshots/ap-calculus-break.png)
- [Second-screen break clock](screenshots/ap-calculus-clock-break.png)
- [Final submission receipt](screenshots/ap-calculus-submitted.png)
- [AP Calculus Paper Builder](screenshots/ap-calculus-builder.png)

## Known product boundaries, not defects

- AP break handling is adapted practice because the room timer advances automatically instead of waiting for each candidate to resume.
- Graphing-calculator requirements are displayed but no calculator is embedded.
- Printing uses the browser's native print dialog; a host browser may suppress it in an embedded webview.
- Protected source papers and course guides are intentionally excluded from Git and releases.
