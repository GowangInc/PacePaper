# PacePaper 0.1.0-demo.8 — Windows/Linux practice demo

This is the first release under the PacePaper name. It ships a new linework icon and one generic **Sample paper** with no subject, level, or IB branding, so anyone can try the full exam workflow before building their own. The demo.7 timing and focus features remain: a teacher can change reading or writing minutes on the examination clock while an exam is live, and the dashboard raises a visible notification when a candidate leaves the exam window.

## Downloads and update instructions

- Windows x64: extract the complete ZIP, then open `PacePaper.exe`.
- Linux x64 (glibc): extract the archive, then run `PacePaper`.
- macOS: **no Mac app is included in this release**. Apple Developer ID signing and notarization credentials are not configured. Use the source with `Start PacePaper.command` or `bun run start:app` after the one-time Bun setup.
- The illustrated HTML guide, text guide, these release notes, and SHA-256 checksums accompany the executables. This is a portable demo, not an installer or automatic updater. Windows may display a warning because the executable is not publisher-signed.

Before replacing an older app, finish all exams, stop PacePaper, and back up its complete data folder using the guide. Replace the executable, not the data folder. Restart the app and refresh all browser pages to use the new code.

## What changed

- **PacePaper name and icon.** The product and its downloads are branded PacePaper, with a new flat linework icon: a navy tile holding an ivory paper sheet and a rising beat-arc with teal beats and a vermilion finish. The macOS bundle and Windows executable carry the icon; the Linux archive includes the matching PNG.
- **Generic Sample paper.** A fresh installation now seeds one **Sample paper** instead of an English B labelled example. It has no subject, level, or IB branding: three original reading texts with short-answer and multiple-choice questions across a reading period, chosen to demonstrate the main question styles and the student experience. Teachers can delete it and build or import their own papers.
- Retained from demo.7: live reading/writing corrections from the examination clock for a simple ready or live exam, always-classroom-network student addresses, dashboard focus-loss notifications, focus audit telemetry, and the preloaded Paper Builder for creating new exams.

## What to review

- On first launch, confirm the Paper library shows a single **Sample paper** (Sample · Demo · Paper) with no subject or IB branding, then start a live session and join it as a candidate to try the reading questions.
- Confirm the app window and taskbar show the new beat-arc icon (Windows) and that the Linux PNG appears in the file manager.
- With classroom sharing off and on, confirm the dashboard **Student sign-in** and the clock **Students connect at** always show the private-network address, never `127.0.0.1` or `localhost`.
- During a live exam, leave the candidate window and confirm a notification box appears on the dashboard within a second, with the time, candidate name, and candidate code.
- Confirm that live timing corrections still move candidate phase boundaries and deadlines immediately, and that ended exams and fixed multi-phase papers remain read-only.

## Important boundaries

- Live timing corrections change the room schedule for every candidate immediately; only adjust writing time before a candidate's individual deadline has already been auto-submitted. Ending a sitting still submits every outstanding response.
- Focus telemetry is audit evidence and a deterrent, not proof of candidate compliance. A browser crash, disconnect, or deliberate local bypass can prevent an event from arriving.
- The Sample paper is a generic demonstration; it is not aligned to any subject syllabus. Build or import real practice materials only when you are permitted to use them.
- The product retains its demo-era storage identifiers (environment variables, database file names, and the `.digitaldp-paper` portable format) so existing data and papers keep working across upgrades.
- This is independent practice and familiarisation software, not an official examination-delivery system.
- The demo teacher credentials remain `admin` / `admin` and are not suitable for real student data.
