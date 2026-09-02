# DigitalDP

DigitalDP is a local-network workspace for supervised IB-style digital examination familiarisation. Teachers prepare papers and classes, students complete timed practice sessions in a focused browser workspace, and teachers review the saved responses afterwards.

DigitalDP is an independent internal practice tool. It is not the IB Digital Examination System, is not affiliated with or endorsed by the International Baccalaureate, and should not be used for high-stakes assessment without local technical, safeguarding, accessibility, and assessment-policy approval.

## Current capabilities

- Temporary prototype teacher sign-in (`admin` / `admin`, reset on every startup)
- Classes, class-code/name sign-in, candidate codes, individual extra time, and reversible roster archiving
- Exam-first Paper Builder with researched 2026 presets plus a separate first-assessment-2027 Psychology preview
- Live, independently scrollable paper preview while a teacher edits
- One-file DigitalDP paper export and re-import, including explicitly authorized attachments
- PDF, image, text, and controlled-play audio resources, including media attached to individual questions; students receive exactly two complete plays per recording, with no pause or restart once a play begins
- Separate reading and writing phases, with individual extra time applied to writing only
- Teacher-controlled second-screen countdown with live-exam defaults, reading/writing phases, editable display timing, and fullscreen mode
- Editable student-name roster on the second-screen clock, without changing student accounts or authoritative timers
- Visible student sign-in address with a copy action on both the teacher dashboard and projected clock
- Timed sessions with autosave, local unsaved-work recovery, and automatic deadline submission
- Student exam selection after sign-in, with per-exam waiting rooms and completed sittings kept separate from new sessions
- Reversible removal and restoration of classes, students, and exam sittings without deleting saved candidate responses
- Rich-text, short-answer, single-choice, and expandable digital-ink responses with blank, ruled, or square-grid pages, Draw/Eraser tools, and Undo/Redo
- Page context menus suppressed on DigitalDP interface controls while normal clicks, keyboard controls, and text selection remain available
- Event-driven teacher status updates that preserve active form controls, plus printable/PDF candidate submission review
- Two original, exportable DigitalDP example papers for each of the 17 current Paper Builder courses

## Run locally

DigitalDP requires [Bun](https://bun.sh/).

```sh
bun install
bun run check
bun test
bun run dev
```

The server listens on `127.0.0.1:9148` by default. `public/index.html` is the application shell, not a standalone page: start the server and use `http://127.0.0.1:9148/` instead of opening the file with a `file://` URL. In the current demo build, every startup sets the sole teacher account to `admin` / `admin` and invalidates old teacher sessions; open `http://localhost:9148/admin` to sign in.

## Standalone desktop release

The release builder produces shareable, self-contained macOS, Windows, and Linux bundles. They use the normal browser for the existing teacher dashboard and printing workflow; Bun, Node.js, the source checkout, and `public/` folder are not required on the recipient computer.

```sh
bun run release:build
```

The generated archives, standalone user guide, and checksums are placed in `release/`. On macOS, use the `macos-universal` archive (recommended for both Apple-silicon and Intel Macs); extract the correct platform archive and start its DigitalDP app or executable. A packaged release automatically opens the teacher dashboard on the first available local port from `9148` through `9158`, so the address may be different from `9148` when another local instance is running. The initial release is intentionally offline: it makes no licence, activation, telemetry, or other network call. See the teacher-facing [`USER_GUIDE.md`](USER_GUIDE.md) for the complete classroom workflow and [`release/README.md`](release/README.md) for concise install, storage, signing, and classroom-sharing notes.

The release keeps data outside the replaceable executable, in the per-user application-data location for the platform. It does not package a live database, paper library, student response, or protected reference material. For this requested demo release, the teacher login remains `admin` / `admin` and is reset on every launch; it is not suitable for real student data.

For a supervised LAN demo in a packaged release, sign in as the teacher, open **Classroom sharing** on the dashboard, select a detected private IPv4 address, and choose **Apply classroom sharing**. The displayed student sign-in address updates on both the dashboard and examination clock. Choose **This computer only** to stop sharing. The saved interface choice is retained beside the local database, but sharing starts disabled after each launch; it must be deliberately enabled for that session. Sharing cannot be changed while an examination is live.

> **Prototype security warning:** Classroom sharing uses ordinary HTTP, so class codes and responses are not encrypted in transit. This demo intentionally has no student PIN: anyone with a class code can choose a name from that class's roster. Use fake candidates and non-sensitive practice content only. `admin` / `admin` is intentionally weak, has no password-change flow, and is restricted to loopback; real student data requires HTTPS, stronger teacher authentication, student identity checks, and school approval.

### Source/development network configuration

`HOST` and `DIGITALDP_LAN_ORIGIN` apply only when running the source checkout with `bun run start` or `bun run dev`. Packaged releases use the in-app **Classroom sharing** control instead; they do not use those two variables.

- `PORT`: source-server port; defaults to `9148`
- `HOST`: source-server listening address. It defaults to `127.0.0.1`, or `0.0.0.0` when `DIGITALDP_LAN_ORIGIN` is configured.
- `DIGITALDP_LAN_ORIGIN`: source-only exact private-IPv4 origin, including `PORT`, that enables the student-only LAN surface and displays the correct student URL

### Data and testing configuration

- `DIGITALDP_DB`: SQLite database path; defaults to `data/digitaldp.sqlite`
- `DIGITALDP_TEST_READING_SECONDS`: optional whole-second reading-time override for local testing; it does not alter saved papers

For packaged releases, `PORT` may be set by an advanced launcher; otherwise DigitalDP chooses the first free port from `9148`–`9158`. `DIGITALDP_DATA_DIR` chooses the release data directory (which otherwise defaults to the platform's per-user application-data location), `DIGITALDP_DB` overrides the exact SQLite path, and `DIGITALDP_OPEN_BROWSER=0` prevents automatic opening of the teacher dashboard.

The `data/` directory is intentionally excluded from Git. Back up the live database separately before any real classroom pilot.

Saved papers live in the current installation's SQLite library. A new paper defaults to local-only. To download one `.digitaldp-paper` file, the teacher must both classify it as teacher-authored or school-authorized and separately attest that the paper and every attachment may be copied. The visible import form restores that file into another installation with a new local paper ID. Classification alone never grants export permission.

The Exams section creates a draft session from the selected class and Paper Library record; the same paper can be reused for any number of separate sittings. Students sign in, choose the exact session, and wait until the teacher starts it. The room clock opens in a new tab for a projector or second screen. It follows the live session's authoritative start, reading period, and standard writing period; display-only timing or student-name corrections never change candidate timers or accounts. Candidate-specific extra time remains separate.

Teacher-facing **Remove** actions archive records instead of permanently deleting them. Removed students cannot sign in, removed classes are unavailable for new sittings, and removed sittings disappear from the active exam list; all remain available under the corresponding **Removed** disclosure for restoration. Existing submissions stay retained and printable. Live sittings cannot be removed, classes with a live sitting must be ended first, and a student with unfinished live work cannot be removed until that response is submitted or the sitting ends.

Four original demonstrations are ready to import from `examples/portable/`, with editable manifests, simulated candidate work, and teacher assessments under `examples/papers/`. These four audited bundles are the only `.digitaldp-paper` files allowlisted for Git; all other portable bundles are ignored. See `examples/README.md` for the exact coverage and rebuild commands.

The wider course library contains 34 additional original examples under `examples/course-samples/`: two for every course currently shown by the Paper Builder. Run `bun run samples:build` to regenerate their editable manifests and ignored portable files, then `bun run samples:seed` to add any missing examples to the active local teacher library. These are custom familiarisation papers with integrated response areas, not official IB session papers.

## Project structure

```text
public/           Browser interface
src/              Validation, authentication, paper model, and SQLite access
examples/         Original sample manifests, portable bundles, and seed/build tools
paper-authoring/  Structured paper-package authoring guidance
release/          Standalone release guide and generated shareable bundles
USER_GUIDE.md     Teacher and student operating guide
resources/ib/     Retained official/public IB reference material and provenance
resources/private/ Local copyrighted references excluded from Git
research/         Assessment findings and product-design decisions
server.ts         Bun HTTP, API, static-file, and WebSocket server
```

## Source and rights policy

Official course guides, specimen materials, and related references belong under `resources/ib/`, grouped by subject family. Every retained item must have a source URL, retrieval date, curriculum or first-assessment year when known, SHA-256 checksum, and access/rights note.

Reference binaries under `resources/` are retained locally and ignored by Git; the repository tracks provenance catalogues and derived product requirements. User-supplied, licensed, portal-only, or questionably mirrored papers belong only under the ignored `resources/private/` tree. Portable paper bundles are also ignored globally because they can encapsulate the same media. Keep this repository private; source material remains subject to its original rights and licensing terms.

## Verification

```sh
bun run check
bun test
```

Before a classroom pilot, also test the complete teacher and student journey on the actual managed browsers or Safe Exam Browser configuration, including reconnects, simultaneous candidates, printing, backup recovery, and stylus input where used.
