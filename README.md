# DigitalDP

DigitalDP is a local-network workspace for supervised IB-style digital examination familiarisation. Teachers prepare papers and classes, students complete timed practice sessions in a focused browser workspace, and teachers review the saved responses afterwards.

DigitalDP is an independent internal practice tool. It is not the IB Digital Examination System, is not affiliated with or endorsed by the International Baccalaureate, and should not be used for high-stakes assessment without local technical, safeguarding, accessibility, and assessment-policy approval.

## Current capabilities

- Temporary prototype teacher sign-in (`admin` / `admin`, reset on every startup)
- Classes, candidate codes, PINs, and individual extra time
- Exam-first Paper Builder with researched 2026 presets plus a separate first-assessment-2027 Psychology preview
- Live, independently scrollable paper preview while a teacher edits
- One-file DigitalDP paper export and re-import, including explicitly authorized attachments
- PDF, image, text, and controlled-play audio resources, including media attached to individual questions
- Separate reading and writing phases, with individual extra time applied to writing only
- Teacher-controlled second-screen countdown with live-exam defaults, reading/writing phases, editable display timing, and fullscreen mode
- Timed sessions with autosave, local unsaved-work recovery, and automatic deadline submission
- Rich-text, short-answer, single-choice, and paginated digital-ink responses
- Live teacher status updates and printable/PDF candidate submission review

## Run locally

DigitalDP requires [Bun](https://bun.sh/).

```sh
bun install
bun run check
bun test
bun run dev
```

The server listens on `127.0.0.1:9148` by default. In the current demo build, every startup sets the sole teacher account to `admin` / `admin` and invalidates old teacher sessions; open `http://localhost:9148/admin` to sign in. The demo refuses non-loopback bind addresses and rejects requests whose host or port does not match its loopback listener while these credentials are enabled.

> **Prototype security warning:** `admin` / `admin` is intentionally weak, replaces existing teacher credentials at startup, and has no password-change flow. Keep this build bound to the local computer; it is not ready for a shared-server or network pilot.

Environment variables:

- `PORT`: listening port; defaults to `9148`
- `HOST`: listening address; defaults to `127.0.0.1`. The current demo accepts loopback addresses only.
- `DIGITALDP_DB`: SQLite database path; defaults to `data/digitaldp.sqlite`

The `data/` directory is intentionally excluded from Git. Back up the live database separately before any real classroom pilot.

Saved papers live in the current installation's SQLite library. A new paper defaults to local-only. To download one `.digitaldp-paper` file, the teacher must both classify it as teacher-authored or school-authorized and separately attest that the paper and every attachment may be copied. The visible import form restores that file into another installation with a new local paper ID. Classification alone never grants export permission.

The Exams section opens a selected room clock in a new tab for a projector or second screen. It follows the live session's authoritative start, reading period, and standard writing period; display-only corrections never change candidate timers. Candidate-specific extra time remains separate.

Four original demonstrations are ready to import from `examples/portable/`, with editable manifests, simulated candidate work, and teacher assessments under `examples/papers/`. These four audited bundles are the only `.digitaldp-paper` files allowlisted for Git; all other portable bundles are ignored. See `examples/README.md` for the exact coverage and rebuild commands.

## Project structure

```text
public/           Browser interface
src/              Validation, authentication, paper model, and SQLite access
paper-authoring/  Structured paper-package authoring guidance
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
