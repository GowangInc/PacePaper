# DigitalDP standalone demo release

This folder receives the shareable DigitalDP bundles made by `bun run release:build`.

Each bundle is self-contained: it includes the DigitalDP executable and all browser interface files. Teachers and students do **not** need Bun, Node.js, source code, or an Internet connection to use the app on the host computer. It deliberately excludes every existing database, paper, submission, and reference resource.

Start with `USER-GUIDE.txt`, included beside the app or executable in each bundle. It covers the complete teacher and student workflow, including paper creation, classroom sharing, timed sittings, submission, printing, backups, and troubleshooting. The same guide is also provided as a separate release download.

## Choose the correct download

- `DigitalDP-*-macos-universal.zip` — **recommended for all supported Macs**; includes both Apple-silicon and Intel code
- `DigitalDP-*-windows-x64.zip` — most Windows PCs
- `DigitalDP-*-linux-x64.tar.gz` — 64-bit Linux PCs using glibc
- `DigitalDP-*-User-Guide.txt` — the same full guide included inside each platform archive

Extract the entire archive before starting it. Do not run an executable from inside the archive.

On macOS, double-click `DigitalDP.app`. On Windows, double-click `DigitalDP.exe`. On Linux, make `DigitalDP` executable if required and run it. The app opens the teacher dashboard in the normal browser on the first free local port from `9148` through `9158`; use the address that opens automatically. If every port in that range is occupied, close the conflicting local app or have an advanced launcher set `PORT` before starting DigitalDP.

The first demo release is intentionally unsigned. macOS may require Control-click → **Open**; Windows may show a SmartScreen warning. Sign/notarize the final distribution before use beyond an internal demo.

## Demo boundaries

- It is fully offline: no telemetry, account registration, activation, or licence call is made.
- The teacher login remains `admin` / `admin` and is reset on each app start, as requested for the demo.
- It is for familiarisation only. Do not use it with real student data, high-stakes assessment, or copyrighted papers without school approval.
- The bundle contains no IB or user-supplied reference papers. Add only materials you are permitted to use.

## Keeping work safe

The application binary is replaceable; classroom data is deliberately stored outside it:

- macOS: `~/Library/Application Support/DigitalDP/`
- Windows: `%LOCALAPPDATA%\DigitalDP\`
- Linux: `$XDG_DATA_HOME/DigitalDP/` or `~/.local/share/DigitalDP/`

Set `DIGITALDP_DATA_DIR` before launch to place data elsewhere, or `DIGITALDP_DB` to use an exact SQLite path. Back up the complete data directory only after DigitalDP has stopped; SQLite may have matching `-wal` and `-shm` files while it is running.

## Classroom sharing

The standalone app starts with student access limited to this computer. To admit students on the same trusted LAN, sign in as the teacher and use the **Classroom sharing** panel on the dashboard:

1. Choose one of the detected private IPv4 addresses.
2. Select **Apply classroom sharing**.
3. Give students the student sign-in address shown on the dashboard or examination clock.

Choose **This computer only** and apply the change to turn sharing off. The selected address is saved next to the local database for convenience, but sharing begins disabled after every app launch and cannot be changed while an examination is live. Teacher pages remain limited to the host computer. Confirm the address on an actual student device: guest Wi-Fi or VLAN isolation can prevent classroom connections even when the host is configured correctly.

The standalone package does not use `HOST` or `DIGITALDP_LAN_ORIGIN`; those are developer-only source-checkout controls described in the root README. Classroom sharing uses ordinary HTTP, so use only approved non-sensitive demo material on a trusted private school network.

## Future licensing

Licensing is intentionally deferred. The release has no network licensing code or hidden service dependency. A later entitlement layer must be external to the SQLite data and paper/import format, so an unavailable licence service can never strand teacher work.
