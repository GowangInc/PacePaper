# DigitalDP

DigitalDP is a local-network workspace for supervised IB-style digital examination familiarisation. Teachers prepare papers and classes, students complete timed practice sessions in a focused browser workspace, and teachers review the saved responses afterwards.

DigitalDP is an independent internal practice tool. It is not the IB Digital Examination System, is not affiliated with or endorsed by the International Baccalaureate, and should not be used for high-stakes assessment without local technical, safeguarding, accessibility, and assessment-policy approval.

## Current capabilities

- Teacher account setup and sign-in
- Classes, candidate codes, PINs, and individual extra time
- PDF writing papers and structured reading/listening packages
- Timed sessions with autosave, local unsaved-work recovery, and automatic deadline submission
- Rich-text, short-answer, and single-choice responses
- Live teacher status updates and printable submission review
- Work in progress: a teacher Paper Builder and digital-ink working areas

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
research/         Assessment findings and product-design decisions
server.ts         Bun HTTP, API, static-file, and WebSocket server
```

## Source and rights policy

Course guides, subject briefs, specimen materials, and related references belong under `resources/ib/`, grouped by subject family. Every retained item must have a source URL, retrieval date, curriculum or first-assessment year when known, SHA-256 checksum, and access/rights note.

Only official, publicly accessible material should be copied into the repository. Paywalled, school-portal-only, or questionably mirrored papers should be recorded as unavailable rather than copied. Keep this repository private; source material remains subject to its original rights and licensing terms.

## Verification

```sh
bun run check
bun test
```

Before a classroom pilot, also test the complete teacher and student journey on the actual managed browsers or Safe Exam Browser configuration, including reconnects, simultaneous candidates, printing, backup recovery, and stylus input where used.
