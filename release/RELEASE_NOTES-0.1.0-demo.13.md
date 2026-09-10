# PacePaper 0.1.0-demo.13 release notes

Watch candidate work live during a sitting.

## What is new since 0.1.0-demo.12

- **Watch work.** While a sitting is live, its session row on the dashboard offers **Watch work**. The teacher picks a candidate and reads their paper as it is being written: current answers, choice selections, drawing pages, flags, and the candidate's notepad — read-only, in the same layout used for reviewing a finished paper.
- **It follows the candidate.** The view refreshes as candidates save, so progress is visible without walking the room or making anyone stop. Each candidate row shows their candidate code, how many questions they have answered, and when they last saved.
- **Candidates are told.** The candidate sign-in screen and the waiting room both state that the teacher can see their work during a sitting — answers, drawings, notes, and flagged questions — and that this covers PacePaper only, not the rest of their computer. There is no hidden monitoring, and nothing on the candidate's screen changes while a teacher is watching.
- **Read-only, and only the teacher.** Watching cannot change a candidate's paper, cannot submit, and is not visible to the candidate. It reuses the existing teacher-only response endpoint; no new student endpoint, no new storage, and no schema change.
- **Everything from 0.1.0-demo.12 remains:** the candidate rehearsal preview, the classroom address chosen from a physical network adapter, the descriptive per-view tab titles, and the single generic Sample paper.

## Verification

- 310 automated tests pass across 45 files, TypeScript checking is clean. The session action model test covers the new **Watch work** action for a live sitting.
- The live view was exercised end to end in a real browser against a running installation with a started sitting and a signed-in candidate: the dashboard offered **Watch work** on the live row, the dialog opened with the candidate listed as "1 of 34 answered", and after a fresh candidate save the view updated on its own to "2 of 34 answered" and showed the new answer text and notepad — with no action in the candidate's browser and no signal to the candidate.
- The candidate notice was read back from the running application on both surfaces it appears: the sign-in screen and the waiting room.
- The screenshot in the README and the guide was captured from the running application at the same size as the other documentation images.
- Linux native startup smoke is run on the published tarball (see the release page); a Windows native smoke is still not possible from this fleet — the Windows bundle is exercised through the shared code path only.

## Honest limits of the live view

- It shows what a candidate has **saved**. The candidate screen saves about a second after typing stops, so the newest keystrokes can lag, and unsaved work in a browser that closes mid-question is never seen.
- A candidate whose browser is offline, closed, or crashed simply stops updating: the view keeps their last saved work and its timestamp. Treat a stalled view as "no new saves", not as evidence of what the candidate is doing.
- It cannot show anything outside PacePaper — not other tabs, other applications, or the screen itself. That would require software on the candidate's computer, which this product deliberately does not install and which Safe Exam Browser or a managed kiosk already prevents.
- Focus-loss alerts remain the separate, best-effort signal for a candidate leaving the exam window.

## Important boundaries

- PacePaper is practice and familiarisation software. It is not an official examination-delivery system and is not affiliated with or endorsed by the International Baccalaureate, Cambridge University Press & Assessment, Pearson, College Board, or any awarding body.
- A candidate preview and a live view are teacher-facing aids, not marking: PacePaper still does not mark or grade responses.
- Classroom sharing uses ordinary HTTP on the local network; class codes and responses are not encrypted in transit. Use fake candidates and non-sensitive practice content.
- Students must be on the same network as the teacher's computer, and the teacher should confirm the displayed address matches the network students use. Guest networks that isolate clients, a phone VPN, or a different subnet will show "site can't be reached" independently of this app.
- Video stimulus requires network access at exam time unless the file is hosted on the local network. A packaged release ships exactly one generic Sample paper; no video sample is bundled.
- Live timing corrections remain limited to simple reading/writing papers; fixed multi-phase schedules and ended exams stay read-only.
- The product retains its demo-era storage identifiers (environment variables, database file names, and the `.digitaldp-paper` portable format) so existing data and papers keep working across upgrades.
