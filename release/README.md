# PacePaper standalone demo release

This folder receives the shareable PacePaper bundles made by `bun run release:build`.

The Windows and Linux bundles are self-contained: each includes the PacePaper executable and browser interface. The macOS download is a source archive with the project files and launcher; it needs Bun and dependencies, which the launcher offers to install on first run with an internet connection. Students need only a browser and a connection to the teacher's computer. Bundled content works offline; optional YouTube or externally hosted HTTPS video needs internet unless hosted on the school network. The builder excludes existing databases, teacher papers, submissions, and protected reference resources. A fresh release installs one generic **Sample paper** with no subject, level, or IB branding.

Version **0.1.0-demo.21** includes self-contained Windows x64 and Linux x64 applications and a macOS source archive for Apple-silicon and Intel Macs. The source archive is not a compiled macOS app; its launcher offers to install Bun and installs the project dependencies. The first Mac launch needs an internet connection. A previously downloaded app retains its own code and examples. Check the release notes supplied with that download.

Student sign-in is deliberately low-friction for a trusted school network: students choose their class and name from the active roster. No candidate PIN or direct link is created or required.

PacePaper now checks the SQLite database at startup. Before a schema upgrade, it creates and verifies a snapshot in the data folder's `backups` directory. It refuses to continue if the database check, disk-space check, migration, or post-migration integrity check fails.

Candidate responses now use revision checks to reject stale saves from another tab or device. Ending an exam waits for each active candidate's latest confirmed save; the teacher can keep the exam running or enter a reason to end it despite unresolved candidates.

For the Windows and Linux apps, start with `USER-GUIDE.html` included beside the executable; `USER-GUIDE.txt` is the accessible fallback. The macOS source archive contains the editable project guide files. Both standalone guide formats are also provided as release downloads.

## Choose the correct download

- `PacePaper-0.1.0-demo.21-macos-source.zip` — macOS source archive (Apple silicon or Intel)
- `PacePaper-0.1.0-demo.21-windows-x64.zip` — Windows 10/11 x64
- `PacePaper-0.1.0-demo.21-linux-x64.tar.gz` — Linux x64 using glibc
- `PacePaper-*-User-Guide.html` — illustrated, browser-friendly guide
- `PacePaper-*-User-Guide.txt` — the same full guide included inside each platform archive
- `PacePaper-*-Release-Notes.txt` — review focus, important limitations, and verification evidence

The Windows executable uses the PacePaper application icon. The Linux archive includes `PacePaper.png` for launchers or desktop shortcuts.

Extract the entire archive before starting it. Do not run an executable from inside the archive.

On macOS, extract the complete source archive and double-click `Start PacePaper.command`; if Bun is missing, the launcher offers to install it and installs dependencies. On Windows, double-click `PacePaper.exe`. On Linux, make `PacePaper` executable if required and run it. The packaged apps open the teacher dashboard in the normal browser on the first free local port from `9148` through `9158`; use the address that opens automatically. If every port in that range is occupied, close the conflicting local app or have an advanced launcher set `PORT` before starting PacePaper.

The current source is labelled `0.1.0-demo.21`, and a fresh release installs the generic **Sample paper** described above. See `RELEASE_NOTES-0.1.0-demo.21.md` for the release record. Later source edits require a new build and verification. Existing downloads are unchanged.

This release does not include a compiled macOS app because Developer ID signing and Apple notarization credentials are not configured; it includes the macOS source archive instead. The Windows and Linux builds are unsigned, so Windows may show a SmartScreen warning. macOS may report that the launcher cannot be opened; right-click it and choose **Open**, or remove the quarantine attribute once as described in the root README.

## Run from a source checkout

Source use requires Bun and project dependencies. On a Mac, double-click `Start PacePaper.command`; it offers to install Bun and runs `bun install` when dependencies are missing, so the first launch needs internet. On Windows or Linux, open a terminal in the project folder and run `bun run start:app` after installing Bun and dependencies. Keep the terminal open while using PacePaper and press Control-C there to stop it. The source launcher uses the same app data, example papers, automatic browser opening, and classroom-sharing controls as a build made from that source.

For source development, `bun run samples:build` regenerates manifests, ignored portable papers, and teacher marking guides. `bun run samples:seed` adds or safely upgrades the library, preserving teacher edits and earlier session versions. The app launcher performs the library upgrade automatically; unchanged input does not create duplicates.

## Demo boundaries

- The apps make no telemetry, account-registration, activation, or licence calls. Windows and Linux work offline with bundled content; optional hosted video and first-time Mac source setup need internet.
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
