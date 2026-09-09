# PacePaper original sample papers

These four packages are entirely original PacePaper demonstration material. They are not IB papers, do not reproduce IB questions, and do not claim to match a live examination.

An additional 52-paper course library lives under `course-samples/`: 34 IB-oriented examples, 15 full-length non-IB mocks, and three short AP walkthroughs. The full mocks cover all four Cambridge IGCSE Mathematics 0580 components/tiers in the 2025–2027 format, eight Pearson Edexcel International GCSE Mathematics A linear/modular components/tiers, and May 2027 AP English Language, Biology, and Calculus AB. This is 23 course entries, not every course or paper available in Paper Builder. Full-length means a complete original question workload, not official endorsement, calibrated difficulty, or official grade boundaries. The AP walkthroughs are short demonstrations, not full mocks.

Run `bun run samples:build` to regenerate the editable manifests, ignored portable bundles, and full-mock teacher marking guides. Run `bun run samples:seed` to add or safely upgrade examples in a source-development teacher library. Teacher edits and earlier session versions are preserved; unchanged input does not add duplicates. `bun run start:app` and builds made from the current source perform this library upgrade automatically. A downloaded app contains the examples from its own build; updating source files does not update that app. The latest published app release is `0.1.0-demo.8`; source-library updates reach downloaded apps only through a new build and release.

The teacher sidebar's **Mock marking guides** link opens the sign-in-protected `/mock-guides` page. Its offline version is `docs/mock-marking/index.html`. These guides contain worked answers and point allocations for every full-mock question; keep them separate from student materials. Exported `.digitaldp-paper` files do not contain these answers. AP guides explain weighted practice calculations, not an official AP score conversion. Subject teachers should moderate papers and marking before use.

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
