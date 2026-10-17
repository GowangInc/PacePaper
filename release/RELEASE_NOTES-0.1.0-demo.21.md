# PacePaper 0.1.0-demo.21 release notes

Release date: 17 October 2026.

## What is new

- **macOS source download.** The release includes a source archive for Apple-silicon and Intel Macs. Its double-click launcher offers to install Bun, installs project dependencies when needed, and prints the Gatekeeper recovery command. The first setup needs internet; bundled content works offline. Optional YouTube or externally hosted HTTPS video needs internet unless hosted on the school network.
- **Clear platform coverage.** Windows 10/11 x64 and Linux x64 receive self-contained apps that work offline with bundled content. macOS receives the source archive, not a compiled or notarized application.
- **Canonical MIT licence.** The repository now has an unmodified MIT licence text; the PacePaper name and icon notice is in `TRADEMARK.md`.

## Downloads

- `PacePaper-0.1.0-demo.21-windows-x64.zip` — Windows 10/11, x64.
- `PacePaper-0.1.0-demo.21-linux-x64.tar.gz` — Linux x64 using glibc.
- `PacePaper-0.1.0-demo.21-macos-source.zip` — macOS source archive for Apple silicon and Intel.
- `PacePaper-0.1.0-demo.21-User-Guide.html` and `.txt` — illustrated and plain-text user guides.

The Windows/Linux applications are unsigned; Windows SmartScreen may warn. The macOS source launcher is not notarized and may be blocked by Gatekeeper. See the root README for the one-time open/quarantine instructions.

## Build and verification scope

Release verification results are recorded in `VERIFICATION-0.1.0-demo.21.md` after the local build and GitHub checks complete. The macOS source archive is syntax-checked, but this release does not include a native macOS application smoke test. Windows and Linux packaged applications are checked on their native GitHub runners.

PacePaper remains a supervised practice and familiarisation tool, not an official examination-delivery system. Classroom sharing uses ordinary HTTP on a trusted local network; use only approved practice materials and fake candidates.
