# DigitalDP standalone demo release

This folder receives the shareable DigitalDP bundles made by `bun run release:build`.

Bundles built from the current source are self-contained: they include the DigitalDP executable and all browser interface files. Teachers do not need Bun, Node.js, or source code. Students need only a browser and a connection to the teacher's computer; an Internet connection is not needed during use. The current builder excludes existing databases, teacher papers, submissions, and protected reference resources, and includes the 52 original DigitalDP paper definitions for the local library: 34 IB-oriented examples, 15 full-length non-IB mocks, and three AP walkthroughs.

Version **0.1.0-demo.5** targets Windows x64 and Linux x64. There is no Mac application in this release: Apple signing and notarization credentials are not configured. Mac users can run the source as described below. A previously downloaded app retains its own code and examples; check the release notes supplied with that download.

Linked clocks follow the saved exam timeline across windows. Unsupported live/ended and multi-section timing edits are disabled, not display-only. Ready-session edits reject stale writes. The [fix report](../resources/research/2026-09-05-ux-safety-fixes.md) records browser and automated checks; the bundled release notes identify the platform and verification limits.

Start with `USER-GUIDE.html`, included beside the app or executable in each bundle. It contains screenshots and covers the complete teacher and student workflow, including paper creation, classroom sharing, timed sittings, submission, printing, backups, and troubleshooting. A plain-text `USER-GUIDE.txt` is included as an accessible fallback. Both guides are also provided as separate release downloads.

## Choose the correct download

- macOS — run the source for now; no Mac archive is included in demo.5
- `DigitalDP-*-windows-x64.zip` — most Windows PCs
- `DigitalDP-*-linux-x64.tar.gz` — 64-bit Linux PCs using glibc
- `DigitalDP-*-User-Guide.html` — illustrated, browser-friendly guide
- `DigitalDP-*-User-Guide.txt` — the same full guide included inside each platform archive
- `DigitalDP-*-Release-Notes.txt` — review focus, important limitations, and verification evidence

The macOS application and Windows executable use the DigitalDP application icon. The Linux archive includes `DigitalDP.png` for launchers or desktop shortcuts.

Extract the entire archive before starting it. Do not run an executable from inside the archive.

On macOS, double-click `DigitalDP.app`. Use only a release whose notes say the Mac app is notarized; the earlier `0.1.0-demo.3` and `0.1.0-demo.4` Mac downloads are superseded and can be rejected as damaged. On Windows, double-click `DigitalDP.exe`. On Linux, make `DigitalDP` executable if required and run it. The app opens the teacher dashboard in the normal browser on the first free local port from `9148` through `9158`; use the address that opens automatically. If every port in that range is occupied, close the conflicting local app or have an advanced launcher set `PORT` before starting DigitalDP.

The current source is labelled `0.1.0-demo.5`, with exam-system profiles, timed AP sections, and the 52-paper library. See `RELEASE_NOTES-0.1.0-demo.5.md` for the dated review record. Later source edits require a new build and verification; existing downloads are unchanged.

The release builder will not create a Mac archive without Developer ID signing and successful Apple notarization. Windows may still show a SmartScreen warning while the demo lacks an established publisher reputation.

## Run from a source checkout

Source use requires Bun and a one-time `bun install` in the project folder. On a Mac, open that folder and double-click `Start DigitalDP.command`. On Windows or Linux, open a terminal in the folder and run `bun run start:app`. Keep the terminal open while using DigitalDP and press Control-C there to stop it. This source launcher uses the same app data, example papers, automatic browser opening, and classroom-sharing controls as a build made from that source.

For source development, `bun run samples:build` regenerates manifests, ignored portable papers, and teacher marking guides. `bun run samples:seed` adds or safely upgrades the library, preserving teacher edits and earlier session versions. The app launcher performs the library upgrade automatically; unchanged input does not create duplicates.

## Demo boundaries

- It is fully offline: no telemetry, account registration, activation, or licence call is made.
- The teacher login remains `admin` / `admin` and is reset on each app start, as requested for the demo.
- It is for familiarisation only. Do not use it with real student data, high-stakes assessment, or copyrighted papers without school approval.
- The bundle contains no IB or user-supplied reference papers. Add only materials you are permitted to use.
- The 15 full-length mocks comprise four Cambridge Mathematics 0580 components/tiers (2025–2027 format), eight Pearson Mathematics A linear/modular components/tiers, and three AP courses (May 2027). The 52-paper library covers 23 course entries, not every course or component available in Paper Builder.
- Full-length means a complete original question workload, not official endorsement, calibrated difficulty, or official grade boundaries. Subject teachers must review the content and marking. The three AP walkthroughs deliberately shorten timing and workload.
- **Mock marking guides** in the teacher sidebar opens the teacher-sign-in-protected `/mock-guides` page. The source's generated offline copy is `docs/mock-marking/index.html`. Keep those worked answers private from students; exported `.digitaldp-paper` files contain no marking guide.
- AP raw totals are not AP scores. Matching guides explain weighted practice calculations without official 1–5 conversions. DigitalDP does not automatically mark responses.

## Keeping work safe

The application binary is replaceable; classroom data is deliberately stored outside it:

- macOS: `~/Library/Application Support/DigitalDP/`
- Windows: `%LOCALAPPDATA%\DigitalDP\`
- Linux: `$XDG_DATA_HOME/DigitalDP/` or `~/.local/share/DigitalDP/`

Back up the complete data folder only after DigitalDP has stopped. Use the step-by-step backup and restoration instructions in `USER-GUIDE.html`. Exporting a class list or a paper does not back up sessions or student responses.

For managed installations, IT can set `DIGITALDP_DATA_DIR` before launch to place data elsewhere, or `DIGITALDP_DB` to use an exact SQLite path. SQLite may have matching `-wal` and `-shm` files while it is running, so stop the application before copying its data.

## Classroom sharing

The standalone app starts with student access limited to this computer. To admit students on the same trusted LAN, sign in as the teacher and use the **Classroom sharing** panel on the dashboard:

1. Choose one of the detected private IPv4 addresses.
2. Select **Apply classroom sharing**.
3. Give students the student sign-in address shown on the dashboard or examination clock.

Choose **This computer only** and apply the change to turn sharing off. The selected address is saved next to the local database for convenience, but sharing begins disabled after every app launch and cannot be changed while an examination is live. Teacher pages remain limited to the host computer. Confirm the address on an actual student device: guest Wi-Fi or VLAN isolation can prevent classroom connections even when the host is configured correctly.

The standalone package does not use `HOST` or `DIGITALDP_LAN_ORIGIN`; those are developer-only source-checkout controls described in the root README. Classroom sharing uses ordinary HTTP, so use only approved non-sensitive demo material on a trusted private school network.

## Future licensing

Licensing is intentionally deferred. The release has no network licensing code or hidden service dependency. A later entitlement layer must be external to the SQLite data and paper/import format, so an unavailable licence service can never strand teacher work.
