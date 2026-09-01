# DigitalDP

DigitalDP is a local-network workspace for supervised IB-style digital examination familiarisation. Teachers prepare papers and classes, students complete timed practice sessions in a focused browser workspace, and teachers review the saved responses afterwards.

DigitalDP is an independent internal practice tool. It is not the IB Digital Examination System, is not affiliated with or endorsed by the International Baccalaureate, and should not be used for high-stakes assessment without local technical, safeguarding, accessibility, and assessment-policy approval.

## Current capabilities

- Teacher account setup and sign-in
- Classes, candidate codes, PINs, and individual extra time
- Exam-first Paper Builder with researched 2026 presets plus a separate first-assessment-2027 Psychology preview
- PDF, image, text, and controlled-play audio resources, including media attached to individual questions
- Separate reading and writing phases, with individual extra time applied to writing only
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

The server listens on `0.0.0.0:9148` by default. Open `http://localhost:9148/admin` on the server to create the first teacher account.

Environment variables:

- `PORT`: listening port; defaults to `9148`
- `DIGITALDP_DB`: SQLite database path; defaults to `data/digitaldp.sqlite`

The `data/` directory is intentionally excluded from Git. Back up the live database separately before any real classroom pilot.

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

Reference binaries under `resources/` are retained locally and ignored by Git; the repository tracks provenance catalogues and derived product requirements. User-supplied, licensed, portal-only, or questionably mirrored papers belong only under the ignored `resources/private/` tree. Keep this repository private; source material remains subject to its original rights and licensing terms.

## Verification

```sh
bun run check
bun test
```

Before a classroom pilot, also test the complete teacher and student journey on the actual managed browsers or Safe Exam Browser configuration, including reconnects, simultaneous candidates, printing, backup recovery, and stylus input where used.
