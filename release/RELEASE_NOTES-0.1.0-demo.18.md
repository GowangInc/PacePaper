# PacePaper 0.1.0-demo.18 release notes

This release clarifies the classroom-network workflow: the teacher runs PacePaper on one computer, while students connect from their own devices over the trusted private LAN.

## What is new since 0.1.0-demo.17

- **Separate student devices documented.** Students use the private-network Student sign-in address from their own computers or tablets. They do not use the teacher's `localhost` page.
- **LAN startup behavior documented accurately.** Packaged releases restore the saved private IPv4 address or choose one on first launch, so student access is available without an initial Apply action. Apply is needed only when changing the selected network address or turning sharing off.
- **Release workflow default updated.** Manual asset builds now default to the current demo.18 draft tag.

The application continues to keep teacher pages and teacher administration on the host computer while exposing only the student shell and student APIs through the exact private-network origin.

## Verification

- `bun run check` passes against the source.
- The full test suite passes with 358 tests and 10,780 assertions.
- The Windows x64 and Linux x64 archives pass checksum and archive-content verification.
- Hosted Windows and Linux native smoke checks confirm startup, seeded papers, and embedded pages.
- The release remains a familiarisation tool, not an official examination-delivery system. Classroom sharing uses ordinary HTTP on a trusted private network. Use approved non-sensitive materials only.
