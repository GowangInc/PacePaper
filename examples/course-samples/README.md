# DigitalDP course sample library

This directory contains 52 original DigitalDP papers across 23 course entries. It is not a complete catalogue of every course, paper, level, tier, or session available in Paper Builder.

| Included material | Papers |
| --- | ---: |
| IB-oriented examples across 17 course entries | 34 |
| Cambridge IGCSE Mathematics 0580 full mocks: Papers 1/3 Core and 2/4 Extended, 2025–2027 format | 4 |
| Pearson Edexcel International GCSE Mathematics A full mocks: linear 1F/2F/1H/2H and modular Units 1/2 at Foundation/Higher | 8 |
| AP English Language, Biology, and Calculus AB full mocks, May 2027 format | 3 |
| Short AP section-and-break walkthroughs | 3 |

Read the title before choosing a paper:

- **Full-length mock** contains a complete original question workload with the researched component timing and mark allocation. It does not imply official endorsement, calibrated difficulty, or official grade boundaries. Subject teachers must review suitability and marking.
- **Full-format practice** identifies an IB-oriented example following its researched structure, timing, and allocated marks, with subject review still required.
- **Format rehearsal** needs further subject-language review.
- **Walkthrough** accelerates the AP section and break sequence for a short demonstration; it is not a full mock.

The Pearson examples distinguish the linear and modular Mathematics A routes. Check the precise syllabus, paper, and tier when setting up a session.

Every paper is independent practice material. Questions, source texts, data, and diagrams described in text were authored for this project. Responses are entered beside the questions without a separate answer sheet. This is an adaptation for AP hybrid free-response sections, which use a physical answer booklet in the official exam. DigitalDP also uses a fixed classroom break that advances automatically; the official digital application requires each candidate to resume after the break. DigitalDP displays calculator requirements but does not include an approved exam calculator. The full mathematics mocks include independently typeset formula facts; read each paper's instructions and supply any further permitted equipment or materials.

## Marking

Paper files contain no answers or marking notes: teachers prepare their own marking from the questions, and nothing in the app grades responses. AP raw totals are not AP scores, and no official 1–5 conversion or grade boundaries are implied.

## Regenerate or load the library

Run `bun run samples:build` to regenerate editable manifests and ignored portable `.digitaldp-paper` files. Run `bun run samples:seed` to add or safely upgrade the current examples in the source-development library. Repeating unchanged input does not add duplicates. Teacher-edited papers are preserved, and previous sessions retain their saved version. The app launcher performs the library upgrade automatically.

Previously downloaded apps keep the papers from their own build. This source-library update has not published a new application release. Clock-to-student timing synchronization remains an unresolved release blocker; consult the main README before a timed classroom trial.
