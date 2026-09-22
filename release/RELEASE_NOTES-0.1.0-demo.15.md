# PacePaper 0.1.0-demo.15 release notes

Adds teacher-only answer and marking guidance to the paper-building and response-review workflow.

## What is new since 0.1.0-demo.14

- **Custom exam type names.** School custom papers can use a teacher-entered exam type instead of the generic profile name. Drafts and paper manifests retain that name.
- **Teacher-only marking guidance.** Paper Builder can store an answer or marking notes for each question. Signed-in teachers see the guidance beside live or submitted candidate work.
- **Candidate-safe paper data.** Candidate previews and live student payloads exclude marking guidance. Marks and question wording remain visible to candidates as normal.
- **Portable paper support.** Paper exports, imports, and browser draft recovery preserve the guidance with its question.
- **Plain-text review.** PacePaper displays guidance as text, preserves line breaks, and does not interpret HTML-like content.

PacePaper does not mark responses automatically. The guidance helps teachers apply their own marking decisions.

## Upgrade guidance

Finish every live sitting, close PacePaper, and back up the complete data folder before replacing an existing app. Existing papers remain valid. Add guidance when you edit or rebuild a paper.

## Verification

- `bun run check` passes against the source.
- The full test suite passes with 322 tests and 10,618 assertions.
- A browser check confirmed that a teacher can save guidance, a candidate cannot receive it, and the teacher can review it beside a submitted answer.
- The Windows x64 and Linux x64 bundles are rebuilt from this tag. The packaged Linux app is smoke-tested after extraction.
- The release remains a familiarisation tool, not an official examination-delivery system. Classroom sharing uses ordinary HTTP on a trusted private network. Use approved non-sensitive materials only.
