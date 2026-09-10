# PacePaper original sample papers

These four packages are entirely original PacePaper demonstration material. They are not IB papers, do not reproduce IB questions, and do not claim to match a live examination.

A wider original course library used for development and library seeding lives under `course-samples/`; see each course folder's own notes. Subject teachers should moderate every paper before classroom use.

Run `bun run samples:build` to regenerate the editable manifests and ignored portable bundles. Run `bun run samples:seed` to add or safely upgrade examples in a source-development teacher library; teacher edits and earlier session versions are preserved, and unchanged input does not add duplicates. `bun run start:app` and builds made from the current source perform this library upgrade automatically. A downloaded app contains the examples from its own build.

Exported `.digitaldp-paper` files contain the paper only: no answers or marking notes are included. Subject teachers should moderate papers and prepare their own marking before use.

## Sample set

| Folder | Level | Mode | Main behaviours exercised |
| --- | --- | --- | --- |
| `sl-prose-choose-one` | SL | Essay | One shared prose source, two prompts, choose exactly one |
| `sl-hl-mixed-data` | SL/HL | Reading | Single choice, short response, and two-page ink working |
| `hl-language-b-listening` | HL | Listening | Original MP3 recording, two-play limit, single-choice and short responses |
| `business-quantitative` | SL/HL | Reading | Quantitative working, qualitative factor, and extended recommendation |

## Import a package

In **Paper library**, find **Import a saved paper**. Choose any one file from `examples/portable/` under **PacePaper paper file**, then select **Import paper**. Each file contains its questions, settings, and permitted candidate asset.

The editable sources remain under `examples/papers/`. To test the structured-package route instead, expand **Advanced: import a prepared paper package** in **Paper library**:

- For the prose, mixed-data, and Business examples, select only that folder's `paper.json`.
- For the listening example, select `paper.json` and `repair-cafe-interview.mp3` together.
- Do not select anything inside `teacher-materials/`. Those files contain a simulated candidate submission, source transcript where applicable, and a worked teacher review. They exist for development and teacher evaluation, not for candidates.

After selecting the files, choose **Add paper package**.

Every manifest uses `assessmentSession: "custom"`, has no `examProfileId`, records its source classification as `teacher-authored`, and separately authorizes portable export because every included question and asset is original to this demo. Marks are local practice allocations rather than official grade boundaries.

Run `bun examples/build-portable.ts` from the project root to rebuild all four files in `examples/portable/`. The script immediately re-imports every generated file and compares its manifest and assets with the editable source.

Run `bun examples/validate.ts` to parse every structured package, verify referenced assets, check mark totals, and validate the simulated responses—including the ink-answer payloads.
