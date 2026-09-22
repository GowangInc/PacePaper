# PacePaper 0.1.0-demo.14 release notes

Protects live candidates during roster upgrades and fixes two examination-flow details.

## What is new since 0.1.0-demo.13

- **Live-safe roster upgrades.** The current name-based class and student sign-in migration preserves the record participating in a live sitting before choosing the earlier record. Later duplicate names move to **Removed**, retaining their papers and results.
- **No silent ambiguity.** If two indistinguishable classes or students both have live work, PacePaper stops before changing the database rather than making either candidate unable to continue. Finish live work before upgrading.
- **Reliable start transition.** A candidate waiting for a sitting now loads the actual examination workspace when the teacher starts it, rather than remaining on a stale waiting screen.
- **Accurate answer history.** For choose-one essay papers, the teacher's answer-history view marks non-selected prompts as not selected instead of showing an unsubmitted draft as an answer.
- **Clearer release sample.** The bundled generic Sample paper is classified as a **Practice sample**, rather than appearing under an unrelated examination system.
- **Correct storage guidance.** Guides now name the existing `DigitalDP` data folders used by the standalone app, so a replacement release continues to use prior classroom data.

## Upgrade guidance

Finish every live sitting, close PacePaper, and back up the complete data folder before replacing an existing app. After the first upgraded start, check **Removed** for duplicate legacy class or student records. Rename the active record before restoring a matching duplicate.

## Verification

- `bun run check` and the full test suite run against the source before release.
- The Windows x64 and Linux x64 bundles are rebuilt from this tag; the packaged Linux app is smoke-tested after extraction.
- The release remains a familiarisation tool, not an official examination-delivery system. Classroom sharing is ordinary HTTP on a trusted private network; use approved non-sensitive materials only.
