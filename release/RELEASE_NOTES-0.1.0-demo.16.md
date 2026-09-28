# PacePaper 0.1.0-demo.16 release notes

This release hardens candidate access, response saves, exam ending, and database upgrades.

## What is new since 0.1.0-demo.15

- **Optional candidate access.** A sitting may allow class-and-name sign-in, or the teacher may issue one private PIN and direct link per active student. Access credentials are scoped to that sitting and can be reset.
- **One-time access list.** When candidate access is enabled, teachers can download the list when they create or reset a sitting. PacePaper stores only protected credential hashes and cannot show the same PINs again.
- **Scoped candidate sessions.** A PIN or direct link opens only its assigned sitting. Name-only sign-in remains available for sittings that do not require candidate access.
- **Revision-safe saves.** Each candidate save includes its expected response revision. PacePaper rejects stale saves from another tab or device instead of overwriting newer work.
- **Safe exam ending.** PacePaper waits for each active candidate's latest confirmed save. The teacher can keep the exam running, or enter a reason to end it despite unresolved candidates; final acknowledgement remains available while the exam is locked.
- **Server-enforced exam phases.** The server rejects answer, drawing, note, audio, and submission writes when the current phase does not permit them, while final acknowledgement remains available in locked phases.
- **Database recovery checks.** PacePaper checks SQLite at startup. Before a schema upgrade, it checks free space and creates a verified snapshot. It also checks the migrated database before startup continues.

## Upgrade guidance

1. Finish every live sitting.
2. Close PacePaper.
3. Back up the complete data folder.
4. Replace the app.
5. Start PacePaper and check one class, paper, and saved response.

PacePaper creates a verified pre-migration snapshot in the data folder's `backups` directory when a schema upgrade is required. This does not replace the full backup in step 3.

Existing sittings remain compatible. They can continue to use name-only candidate sign-in. Candidate access is optional for new sittings; enable it when scoped PIN or direct-link access is useful.

## Verification

- `bun run check` passes against the source.
- The full test suite passes with 350 tests and 10,751 assertions.
- Browser checks confirmed candidate PIN creation, direct-link sign-in, wrong-PIN rejection, credential reset, scoped session access, calculator use, safe exam ending, and mobile layouts.
- Database tests cover integrity checks, snapshot verification, migration failure recovery, credential replacement, and revision conflicts.
- The Windows x64 and Linux x64 bundles are rebuilt from this tag. The packaged Linux app is smoke-tested after extraction.
- The release remains a familiarisation tool, not an official examination-delivery system. Classroom sharing uses ordinary HTTP on a trusted private network. Use approved non-sensitive materials only.
