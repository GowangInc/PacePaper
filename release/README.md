# PacePaper standalone demo release

This folder receives the shareable PacePaper bundles made by `bun run release:build`.

Bundles built from the current source are self-contained: they include the PacePaper executable and all browser interface files. Teachers do not need Bun, Node.js, or source code. Students need only a browser and a connection to the teacher's computer; an Internet connection is not needed during use. The current builder excludes existing databases, teacher papers, submissions, and protected reference resources. A fresh release installs one generic **Sample paper** with no subject, level, or IB branding, so new users can try the exam workflow immediately.

Version **0.1.0-demo.20** targets Windows x64 and Linux x64, under the PacePaper name. There is no Mac application in this release because Apple signing and notarization credentials are not configured. Mac users can run the source as described below. A previously downloaded app retains its own code and examples. Check the release notes supplied with that download.

Student sign-in is deliberately low-friction for a trusted school network: students choose their class and name from the active roster. No candidate PIN or direct link is created or required.

PacePaper now checks the SQLite database at startup. Before a schema upgrade, it creates and verifies a snapshot in the data folder's `backups` directory. It refuses to continue if the database check, disk-space check, migration, or post-migration integrity check fails.

Candidate responses now use revision checks to reject stale saves from another tab or device. Ending an exam waits for each active candidate's latest confirmed save; the teacher can keep the exam running or enter a reason to end it despite unresolved candidates.

Start with `USER-GUIDE.html`, included beside the app or executable in each bundle. It covers the complete teacher and student workflow. A plain-text `USER-GUIDE.txt` is included as an accessible fallback. Both guides are also provided as separate release downloads.

## Choose the correct download

- macOS — run the source for now; no Mac archive is included in demo.20
- `PacePaper-*-windows-x64.zip` — most Windows PCs
- `PacePaper-*-linux-x64.tar.gz` — 64-bit Linux PCs using glibc
- `PacePaper-*-User-Guide.html` — illustrated, browser-friendly guide
- `PacePaper-*-User-Guide.txt` — the same full guide included inside each platform archive
- `PacePaper-*-Release-Notes.txt` — review focus, important limitations, and verification evidence

The Windows executable uses the PacePaper application icon. The Linux archive includes `PacePaper.png` for launchers or desktop shortcuts.

Extract the entire archive before starting it. Do not run an executable from inside the archive.

On Windows, double-click `PacePaper.exe`. On Linux, make `PacePaper` executable if required and run it. The app opens the teacher dashboard in the normal browser on the first free local port from `9148` through `9158`; use the address that opens automatically. If every port in that range is occupied, close the conflicting local app or have an advanced launcher set `PORT` before starting PacePaper. A future macOS download must be notarized before use.

The current source is labelled `0.1.0-demo.20`, and a fresh release installs the generic **Sample paper** described above. See `RELEASE_NOTES-0.1.0-demo.20.md` for the dated review record. Later source edits require a new build and verification. Existing downloads are unchanged.

The release builder will not create a Mac archive without Developer ID signing and successful Apple notarization. Windows may still show a SmartScreen warning while the demo lacks an established publisher reputation.

## Run from a source checkout

Source use requires Bun and a one-time `bun install` in the project folder. On a Mac, open that folder and double-click `Start PacePaper.command`. On Windows or Linux, open a terminal in the folder and run `bun run start:app`. Keep the terminal open while using PacePaper and press Control-C there to stop it. This source launcher uses the same app data, example papers, automatic browser opening, and classroom-sharing controls as a build made from that source.

For source development, `bun run samples:build` regenerates manifests, ignored portable papers, and teacher marking guides. `bun run samples:seed` adds or safely upgrades the library, preserving teacher edits and earlier session versions. The app launcher performs the library upgrade automatically; unchanged input does not create duplicates.

## Demo boundaries

- It is fully offline: no telemetry, account registration, activation, or licence call is made.
- A fresh installation starts with teacher login `admin` / `admin`. Change the password in **Settings**.
- Student sign-in uses the active class roster and student name. It does not require candidate PINs, direct links, accounts, or internet access.
- It is for familiarisation only. Do not use it with real student data, high-stakes assessment, or copyrighted papers without school approval.
- The bundle contains no IB or user-supplied reference papers. Add only materials you are permitted to use.
- The bundled example is the generic **Sample paper** (no subject, level, or IB branding) used to demonstrate the app. Build or import other materials only when you are permitted to use them.
- The included teacher-authored markscheme is for teachers only; keep it separate from candidate copies. PacePaper does not automatically mark responses.

## Keeping work safe

The application binary is replaceable; classroom data is deliberately stored outside it. The folder name remains `DigitalDP` so existing release data keeps working:

- macOS: `~/Library/Application Support/DigitalDP/`
- Windows: `%LOCALAPPDATA%\DigitalDP\`
- Linux: `$XDG_DATA_HOME/DigitalDP/` or `~/.local/share/DigitalDP/`

Back up the complete data folder only after PacePaper has stopped. Use the step-by-step backup and restoration instructions in `USER-GUIDE.html`. Exporting a class list or a paper does not back up sessions or student responses.

For managed installations, IT can set `DIGITALDP_DATA_DIR` before launch to place data elsewhere, or `DIGITALDP_DB` to use an exact SQLite path. SQLite may have matching `-wal` and `-shm` files while it is running, so stop the application before copying its data.

## Classroom sharing

The standalone app is designed for a teacher computer serving students on their own devices over the same trusted LAN. Teacher pages remain limited to the host computer; students use the private-network **Student sign-in** address in a browser on each student device.

Classroom sharing is active from launch. The app restores the saved private IPv4 address, or chooses and saves the machine's first private network address on a new installation. On the teacher dashboard:

1. Check the **Classroom sharing** address against the network used by the teacher and student devices.
2. If the network changed, choose the correct detected private IPv4 address and select **Apply classroom sharing**.
3. Give students the **Student sign-in** address shown on the dashboard or examination clock.

Students do not use the teacher's `localhost` address. `localhost` and `127.0.0.1` work only on the teacher computer. Choose **This computer only** and apply the change to disable LAN access. The selected address is saved next to the local database and restored on the next launch. Confirm the address on an actual student device: guest Wi-Fi or VLAN isolation can prevent classroom connections even when the host is configured correctly.

The standalone package does not use `HOST` or `DIGITALDP_LAN_ORIGIN`; those are developer-only source-checkout controls described in the root README. Classroom sharing uses ordinary HTTP, so use only approved non-sensitive demo material on a trusted private school network.

## Licensing

PacePaper is distributed under the MIT License. This release has no network licensing or entitlement service, and none is planned for the data format: any later entitlement layer must stay external to the SQLite data and paper/import format, so an unavailable licence service can never strand teacher work.
