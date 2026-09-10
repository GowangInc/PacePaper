# PacePaper 0.1.0-demo.12 release notes

Rehearse any paper as a student before the lesson.

## What is new since 0.1.0-demo.11

- **Preview as student.** Every paper in the **Paper library** now has a **Preview as student** action. It opens the real candidate interface in a new tab — the same reader, questions, tools, phase banner, timer, and audio player a candidate gets — so a teacher can check what the class will actually see instead of reading the paper's settings.
- **The preview uses the paper's own timings.** Reading time, phase changes, locked sections, calculator and tool rules, and the final-submission window behave exactly as they will in the sitting. A teacher can therefore confirm that a long paper flows correctly before a lesson, not during one.
- **Nothing is recorded.** The preview saves no answers, submits nothing, counts no audio listens, and creates no class, session, or response. There is no cleanup afterwards, and the dashboard, clock, and focus alerts are unaffected.
- **The preview is teacher-only.** It requires the teacher session, so the link does not expose a paper to a student who happens to guess the address. Opening it without a signed-in teacher explains that sign-in is needed and links to the dashboard.
- **Audio previews work.** A listening paper plays in the preview with the same two-listen behaviour shown, without spending a candidate's listens.

## Verification

- 306 automated tests pass, TypeScript checking is clean. The new app-level test boots the packaged application, signs in as the teacher, and checks that the preview endpoint refuses an unauthenticated request, rejects an unknown paper, returns the candidate state for a real paper, and leaves the database with zero exam sessions and zero responses.
- The preview was exercised in a real browser against a running installation: the candidate interface rendered 34 question cards from the bundled Sample paper and 4 from an imported listening paper, the preview banner and **Preview · responses are not saved** status were present, typed answers produced no student API request, audio played to the listening phase without a server ticket, and final submission reported that nothing is submitted without opening the confirmation dialog.
- The database was checked directly after that browser session: zero rows in `responses`, `exam_sessions`, and `student_focus_events`.
- The screenshots in the README and the user guide were captured from the running application, at the same size as the existing documentation images.
- Linux native startup smoke is run on the published tarball (see the release page); a Windows native smoke is still not possible from this fleet — the Windows bundle is exercised through the shared code path only.

## Important boundaries

- A preview is not a marked or stored sitting. It proves what candidates see; it does not produce a response, a mark, or an audit trail.
- PacePaper is practice and familiarisation software. It is not an official examination-delivery system and is not affiliated with or endorsed by the International Baccalaureate, Cambridge University Press & Assessment, Pearson, College Board, or any awarding body.
- Classroom sharing uses ordinary HTTP on the local network; class codes and responses are not encrypted in transit. Use fake candidates and non-sensitive practice content.
- Students must be on the same network as the teacher's computer, and the teacher should confirm the displayed address matches the network students use. Guest networks that isolate clients, a phone VPN, or a different subnet will show "site can't be reached" independently of this app.
- Video stimulus requires network access at exam time unless the file is hosted on the local network. A packaged release ships exactly one generic Sample paper; no video sample is bundled.
- Live timing corrections remain limited to simple reading/writing papers; fixed multi-phase schedules and ended exams stay read-only.
- The product retains its demo-era storage identifiers (environment variables, database file names, and the `.digitaldp-paper` portable format) so existing data and papers keep working across upgrades.
