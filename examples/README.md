# DigitalDP original sample papers

These four packages are entirely original DigitalDP demonstration material. They are not IB papers, do not reproduce IB questions, and do not claim to match a live examination.

## Sample set

| Folder | Level | Mode | Main behaviours exercised |
| --- | --- | --- | --- |
| `sl-prose-choose-one` | SL | Essay | One shared prose source, two prompts, choose exactly one |
| `sl-hl-mixed-data` | SL/HL | Reading | Single choice, short response, and two-page ink working |
| `hl-language-b-listening` | HL | Listening | Original MP3 recording, two-play limit, single-choice and short responses |
| `business-quantitative` | SL/HL | Reading | Quantitative working, qualitative factor, and extended recommendation |

## Import a package

The quickest demonstration route is the teacher dashboard's **DigitalDP paper file** importer. Select any one file from `examples/portable/`; each file already contains its manifest and permitted candidate asset.

The editable sources remain under `examples/papers/`. To test the structured-package route instead:

- For the prose, mixed-data, and Business examples, select only that folder's `paper.json`.
- For the listening example, select `paper.json` and `repair-cafe-interview.mp3` together.
- Do not select anything inside `teacher-materials/`. Those files contain a simulated candidate submission, source transcript where applicable, and a worked teacher review. They exist for development and teacher evaluation, not for candidates.

Every manifest uses `assessmentSession: "custom"`, has no `examProfileId`, records its source classification as `teacher-authored`, and separately authorizes portable export because every included question and asset is original to this demo. Marks are local practice allocations rather than official grade boundaries.

Run `bun examples/build-portable.ts` from the project root to rebuild all four files in `examples/portable/`. The script immediately re-imports every generated file and compares its manifest and assets with the editable source.

Run `bun examples/validate.ts` to parse every structured package, verify referenced assets, check mark totals, and validate the simulated responses—including the ink-answer payloads.
