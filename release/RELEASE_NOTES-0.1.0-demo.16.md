# PacePaper 0.1.0-demo.16 release notes

This release simplifies trusted-LAN student access, response saves, exam ending, and database upgrades.

## What is new since 0.1.0-demo.15

- **Roster student access.** Students choose their class and name from the active roster. New sittings do not create candidate PINs or direct links.
- **Classroom-only student sessions.** Class-and-name sign-in opens the current class sittings without a second credential.
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

Existing sittings remain compatible. Legacy scoped candidate links remain accepted, but the normal classroom path is class-and-name sign-in from the active roster.

## Verification

- `bun run check` passes against the source.
- The full test suite passes with 358 tests and 10,780 assertions.
- Browser checks cover roster sign-in, calculator use, safe exam ending, and mobile layouts.
- Database tests cover integrity checks, snapshot verification, migration failure recovery, credential replacement, and revision conflicts.
- The Windows x64 and Linux x64 archives are rebuilt and pass checksum/archive-content verification. Native Windows/Linux runtime smoke was not performed in this environment.
- The release remains a familiarisation tool, not an official examination-delivery system. Classroom sharing uses ordinary HTTP on a trusted private network. Use approved non-sensitive materials only.
