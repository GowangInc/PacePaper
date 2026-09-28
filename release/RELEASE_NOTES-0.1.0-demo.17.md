# PacePaper 0.1.0-demo.17 release notes

This release refreshes the GitHub-facing documentation and rebuilds the Windows and Linux standalone packages from the current roster-based classroom workflow.

## What is new since 0.1.0-demo.16

- **Current student sign-in screenshot.** The root README now shows the active class-and-name roster sign-in screen used by the current source.
- **Current release documentation.** The root README, standalone release README, and generated user guide identify demo.17 consistently.
- **Rebuilt standalone packages.** Windows x64 and Linux x64 archives are rebuilt from the current source and include the current user guide and release notes.

The application behavior remains the demo.16 classroom workflow: roster-based student access, revision-safe response saves, server-enforced exam phases, safe exam ending, database integrity checks, and teacher-only review controls.

## Verification

- `bun run check` passes against the source.
- The full test suite passes with 358 tests and 10,780 assertions.
- Browser smoke covers roster sign-in, logout, and roster re-login.
- The Windows x64 and Linux x64 archives pass checksum and archive-content verification. Native Windows/Linux runtime smoke was not performed in this environment.
- The release remains a familiarisation tool, not an official examination-delivery system. Classroom sharing uses ordinary HTTP on a trusted private network. Use approved non-sensitive materials only.
