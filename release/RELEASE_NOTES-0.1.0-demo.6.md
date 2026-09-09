# DigitalDP 0.1.0-demo.6 — Windows/Linux practice demo

This release adds browser-level exam-focus telemetry and a compact, live teacher view for it. It also reduces a fresh release database to one original IB-aligned familiarisation example: English B Paper 2 Reading.

## Downloads and update instructions

- Windows x64: extract the complete ZIP, then open `DigitalDP.exe`.
- Linux x64 (glibc): extract the archive, then run `DigitalDP`.
- macOS: **no Mac app is included in this release**. Apple Developer ID signing and notarization credentials are not configured. Use the source with `Start DigitalDP.command` or `bun run start:app` after the one-time Bun setup.
- The illustrated HTML guide, text guide, these release notes, and SHA-256 checksums accompany the executables. This is a portable demo, not an installer or automatic updater. Windows may display a warning because the executable is not publisher-signed.

Before replacing an older app, finish all exams, stop DigitalDP, and back up its complete data folder using the guide. Replace the executable, not the data folder. Restart the app and refresh all browser pages to use the new code.

## What changed

- A fresh standalone release now seeds **one** original IB-aligned English B Paper 2 Reading example, rather than the former multi-paper sample library.
- Visiting the app root now takes candidates directly to the student login.
- Browser right-click is suppressed throughout the app as a classroom deterrent.
- Student exam pages record `focus_lost` and `focus_gained` events during live exams.
- The teacher dashboard shows a live Focus alerts area under Sessions. Each candidate row reports focus-loss count, current away state, and last event time; expand it to inspect the chronological focus-event list.
- The detailed Focus integrity history remains available with submitted responses.

## What to review

- Start the seeded English B Paper 2 Reading session and join it as a candidate.
- During a live exam, move the candidate browser away from the exam and return. Confirm that Focus alerts updates with the loss count, away state, and event time.
- Expand the candidate row to inspect the chronological left/returned entries.
- Confirm that a fresh standalone data directory contains the one English B example paper.

## Important boundaries

- Focus telemetry is audit evidence and a deterrent, not proof of candidate compliance. A browser crash, disconnect, or deliberate local bypass can prevent an event from arriving.
- Right-click suppression is a deterrent, not an enforcement boundary.
- This is independent practice and familiarisation software, not an official examination-delivery system.
- Every included question is original. Protected guides, past papers, and the private `resources/` collection are not packaged.
- The demo teacher credentials remain `admin` / `admin` and are not suitable for real student data.
