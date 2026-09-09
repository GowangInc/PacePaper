# DigitalDP 0.1.0-demo.7 — Windows/Linux practice demo

This release makes timing corrections practical and the student address trustworthy. A teacher can now change reading or writing minutes on the examination clock while a simple exam is live, and candidate deadlines move immediately. The dashboard and clock always advertise the classroom-network address students open on their own devices — never a loopback `127.0.0.1` — and the dashboard raises a visible notification when a candidate leaves the exam window.

## Downloads and update instructions

- Windows x64: extract the complete ZIP, then open `DigitalDP.exe`.
- Linux x64 (glibc): extract the archive, then run `DigitalDP`.
- macOS: **no Mac app is included in this release**. Apple Developer ID signing and notarization credentials are not configured. Use the source with `Start DigitalDP.command` or `bun run start:app` after the one-time Bun setup.
- The illustrated HTML guide, text guide, these release notes, and SHA-256 checksums accompany the executables. This is a portable demo, not an installer or automatic updater. Windows may display a warning because the executable is not publisher-signed.

Before replacing an older app, finish all exams, stop DigitalDP, and back up its complete data folder using the guide. Replace the executable, not the data folder. Restart the app and refresh all browser pages to use the new code.

## What changed

- **Live timing corrections from the examination clock.** For a simple paper (one reading period, one writing period), changing **Reading minutes** or **Writing minutes** and selecting **Save exam timing and update display** now works while the exam is ready **and while it is live**. A live save moves the reading/writing boundary and the deadline for every candidate on their next refresh, so a teacher can extend a sitting or repair a wrong duration without restarting anything. Ended exams and fixed multi-phase (sectioned) papers remain read-only on the clock; the Paper Builder prepares those schedules.
- **The student address is always the network address.** When classroom sharing is on, the clock and dashboard show that origin. When sharing is off, they show this computer's detected private-network address instead of `http://127.0.0.1`, because student devices can never reach a loopback address. The clock adds an amber note when classroom sharing is off so the teacher knows students cannot connect yet.
- **Focus-loss notifications.** When a candidate leaves the exam window during a live exam, the teacher dashboard now raises a notification box (bottom-right, auto-dismissing, with a Dismiss control) in addition to updating the Focus alerts list. Events that happened before the dashboard was opened stay silent in the list and do not spam notifications.

## What to review

- Start the seeded English B Paper 2 Reading session as a live exam, join it as a candidate, and change the **Writing minutes** on the examination clock. Confirm the clock confirmation message and that the candidate's on-screen deadline moves to the new time.
- With classroom sharing off and on, confirm the dashboard **Student sign-in** and the clock **Students connect at** always show the private-network address, never `127.0.0.1` or `localhost`.
- During a live exam, leave the candidate window and confirm a notification box appears on the dashboard within a second, with the time, candidate name, and candidate code.
- Confirm that opening the dashboard after events have already occurred does not raise notifications for that past history.
- Confirm a fixed multi-phase paper still shows read-only timing fields on the clock.

## Important boundaries

- Live timing corrections change the room schedule for every candidate immediately; only adjust writing time before a candidate's individual deadline has already been auto-submitted. Ending a sitting still submits every outstanding response.
- Focus telemetry is audit evidence and a deterrent, not proof of candidate compliance. A browser crash, disconnect, or deliberate local bypass can prevent an event from arriving.
- Showing the private-network address while classroom sharing is off does not admit student traffic: the server still rejects non-loopback clients until sharing is applied. The clock note says so.
- This is independent practice and familiarisation software, not an official examination-delivery system.
- Every included question is original. Protected guides, past papers, and the private `resources/` collection are not packaged.
- The demo teacher credentials remain `admin` / `admin` and are not suitable for real student data.
