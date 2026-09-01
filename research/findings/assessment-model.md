# DigitalDP cross-subject assessment model — 2026

Research snapshot: **2026-09-01**
Scope: the current 2026 external written papers for the courses already researched for this project. Internal assessments, orals, and investigations need submission/recording workflows and are intentionally outside the timed-paper matrix. Detailed evidence remains in the [mathematics](mathematics.md), [sciences and psychology](sciences.md), [Business Management](business-management.md), and [language](languages.md) findings.

## Implementation contract

- Key every locked preset by `assessment session/cycle + subject + level + paper/component`. Psychology changes after its last-assessment-2026 cycle; Mathematics and Language B already have later revisions announced. Never silently update an old preset in place.
- Treat every duration below as **examination/writing time**. `+5R` means a separate five-minute pre-start reading phase whose time is not increased by an approved additional-time percentage.
- Use question-linked, bounded response areas and explicit continuation pages. There is no evidence-based need for an infinite canvas.
- Digital ink is normally preselected for mathematics and available for science/Business Management working. It is optional support for language and psychology, whose assessed answers are primarily typed prose or short responses. No reviewed official source makes a stylus itself mandatory.
- A preset supplies timing, paper shape, materials, and choice rules. A question supplies its prompt/resources and response type. “Custom/mock” may unlock preset values, but must remove any claim that the result exactly reproduces an official session paper.

## 2026 paper and response matrix

### Languages

The Language A rows apply to Literature and Language & Literature in the response languages currently in project scope: English, Korean, Japanese, and Spanish. Language B rows apply to English B and Spanish B.

| Preset | Time | Official response/choice shape | Default DigitalDP input | Required or prohibited materials | Manifest mapping |
|---|---:|---|---|---|---|
| Language A SL Paper 1 | 75 min +5R | Analyse one of two unseen texts | Two source-linked `essay` cards | Two unseen texts; no studied works | `mode: essay`, `selectionMode: one` |
| Language A HL Paper 1 | 135 min +5R | Separate analysis of both unseen texts | Two required source-linked `essay` cards | Two unseen texts | `mode: essay`, `selectionMode: all` |
| Language A SL/HL Paper 2 | 105 min +5R | One comparative essay chosen from four prompts | Four `essay` cards | Closed book; compare two studied works from memory | `mode: essay`, `selectionMode: one` |
| Language B SL Paper 1 | 75 min +5R | Complete one of three writing tasks; 250–400 words | Three rich-text `essay` cards | No dictionaries or reference material | `mode: essay`, `selectionMode: one`, word range |
| Language B HL Paper 1 | 90 min +5R | Complete one of three writing tasks; 450–600 words | Three rich-text `essay` cards | No dictionaries or reference material | Same as SL with HL word range |
| Language B SL/HL Paper 2 — reading | 60 min +5R | All questions on three written texts | Mixed `short` and `single-choice`, scoped to each text | Three text resources; no dictionaries/reference material | `mode: reading`, `selectionMode: all` |
| Language B SL Paper 2 — listening | 45 min; paper-level `+5R` off; audio cadence below | All questions on three audio texts | Mixed `short` and `single-choice`, persistent question view | Three audio resources; no dictionaries/reference material | `mode: listening`, `selectionMode: all`, `readingTimeMinutes: 0`; current playback is an approximation |
| Language B HL Paper 2 — listening | 60 min; paper-level `+5R` off; audio cadence below | Same structure as SL | Same as SL | Same as SL | Same as SL, including `readingTimeMinutes: 0` |

Language A Paper 1 defaults to prose even where a source contains an image or multimodal text: the source pane must preserve visual layout and zoom, while the response remains an essay. Korean and Japanese profiles additionally require verified IME composition, font coverage, line wrapping, copy/paste policy, and export rendering before release.

The 2026 examiner instructions refer to first-assessment-2026 Language A guides, while the retained full public guides are earlier first-assessment-2021 copies. The current examiner instructions and 2026 schedules support the matrix, but current full guides and recent Korean/Japanese/Spanish specimens remain PRC-only checks before a profile is labelled official-current.

### Mathematics

All mathematics papers require the correct clean formula booklet. “GDC required” means an approved graphic display calculator under the current annual rules, not an unrestricted web/CAS application.

| Preset | Time | Default DigitalDP input | Technology/materials | Choice/layout note |
|---|---:|---|---|---|
| AA SL Paper 1 | 90 min +5R | Inline ink/equation working, then booklet pages where configured | No calculator/technology; formula booklet | All questions required; global `all` works |
| AA SL Paper 2 | 90 min +5R | Inline ink/equation working plus booklet pages | GDC required; formula booklet | All required |
| AA HL Paper 1 | 120 min +5R | Same pattern as AA SL Paper 1 | No calculator/technology; formula booklet | All required |
| AA HL Paper 2 | 120 min +5R | Same pattern as AA SL Paper 2 | GDC required; formula booklet | All required |
| AA HL Paper 3 | 75 min +5R | Paginated extended mathematical working | GDC required; formula booklet | Two compulsory questions |
| AI SL Paper 1 | 90 min +5R | Inline ink/equation/graph response | GDC required; formula booklet | All required |
| AI SL Paper 2 | 90 min +5R | Paginated extended mathematical working | GDC required; formula booklet | All required |
| AI HL Paper 1 | 120 min +5R | Inline ink/equation/graph response | GDC required; formula booklet | All required |
| AI HL Paper 2 | 120 min +5R | Paginated extended mathematical working | GDC required; formula booklet | All required |
| AI HL Paper 3 | 75 min +5R | Paginated extended problem-solving | GDC required; formula booklet | Two compulsory questions |

For all mathematics profiles use `selectionMode: all`. Question counts and exact space are not preset invariants. Each item may combine editable ink, keyboard/equation entry, graph grid, draw-on-prompt, and A4-like continuation pages.

### Biology, Chemistry, and Physics

Science Paper 1 is one paper made of 1A and 1B under one uninterrupted timer. Do not create two official timers or a second reading phase. A teacher may make a clearly labelled 1A-only or 1B-only practice component.

| Preset | Time | Default DigitalDP input | Required materials | Choice workaround |
|---|---:|---|---|---|
| Biology SL/HL Paper 1 (1A+1B) | SL 90 / HL 120 min +5R | 1A `single-choice` + unsubmitted scratch; 1B short/numeric/ink/graph | SL public paper requires a calculator; HL guide permits it and the official specimen requires it; session-confirm; no Biology data booklet identified | All required; `selectionMode: all` |
| Biology SL Paper 2 | 90 min +5R | Short/numeric + working, draw/graph, extended prose | Calculator required on the reviewed public paper; session-confirm | Compulsory A + choose 1 of 2 in B: use one required B response card containing both alternatives |
| Biology HL Paper 2 | 150 min +5R | Same hybrid response | Calculator permitted/required across the reviewed official course materials; session-confirm the live paper | Compulsory A + choose 2 of 3 in B: use two required B response cards linked to all three alternatives; uniqueness cannot be validated |
| Chemistry SL/HL Paper 1 (1A+1B) | SL 90 / HL 120 min +5R | 1A selected response; 1B text, calculation, equation/structure, graph/ink | Approved calculator + clean Chemistry data booklet | All required |
| Chemistry SL/HL Paper 2 | SL 90 / HL 150 min +5R | Text + equation/chemical notation + ink/graph | Approved calculator + clean Chemistry data booklet | All required |
| Physics SL/HL Paper 1 (1A+1B) | SL 90 / HL 120 min +5R | 1A selected response; 1B numeric/equation/diagram/graph/ink | Approved calculator + clean Physics data booklet | All required |
| Physics SL/HL Paper 2 | SL 90 / HL 150 min +5R | Numeric + working, equations/units, diagram/graph, prose | Approved calculator + clean Physics data booklet | All required; current SL mark total must remain unresolved until PRC confirmation |

The manifest can attach clean data booklets as authorized PDF resources but cannot express “required calculator”, “no calculator”, or material-version policy as validated fields. Repeat those rules in candidate instructions and block an “official-current” publish action unless the preset’s school-side material checklist is confirmed.

### Psychology — legacy course, last assessment 2026

Do not mix these profiles with the first-assessment-2027 course.

| Preset | Time | Official response/choice shape | Default input/materials | Manifest mapping/workaround |
|---|---:|---|---|---|
| SL/HL Paper 1 | 120 min +5R | Three compulsory short answers plus one essay chosen from three | Typed short + extended prose; optional scratch ink; no public calculator/booklet requirement found | `selectionMode: all`; one required essay card contains the three alternatives |
| SL Paper 2 | 60 min +5R | One essay chosen from three questions in the studied option | Typed `essay` | Three essay cards with global `selectionMode: one` |
| HL Paper 2 | 120 min +5R | Two essays, one from each of two studied options | Two required typed essay cards | `selectionMode: all`; put each option’s alternatives inside its own required card |
| HL Paper 3 | 60 min +5R | Three compulsory short responses to research-method stimulus | Typed `short` responses with persistent stimulus pane | `selectionMode: all` |

### Psychology — separate May 2027 preview cycle

These are future-cycle presets and must never replace the legacy 2026 profiles in place.

| Preset | Time | Official response/choice shape | Default input/materials | Manifest mapping/workaround |
|---|---:|---|---|---|
| SL/HL Paper 1 | 90 min +5R | A: two compulsory short answers; B: two compulsory applications to unseen situations; C: one of two concept-based extended responses | Typed short and extended prose; persistent unseen-situation pane; no public calculator/booklet requirement found | `selectionMode: all`; one required Section C card contains both alternatives |
| SL/HL Paper 2 | 90 min +5R | Four compulsory class-practical questions, then evaluation of an unseen research study using at least two concepts | Typed short/extended responses; persistent unseen-study pane | `selectionMode: all` |
| HL Paper 3 | 105 min +5R | Four compulsory source-based responses covering graph interpretation, data analysis, qualitative research, and synthesis | Typed responses; persistent separate resource booklet with quantitative and qualitative sources | `selectionMode: all`; HL only |

### Business Management

| Preset | Time | Official response/choice shape | Default input/materials | Manifest mapping/workaround |
|---|---:|---|---|---|
| SL/HL Paper 1 | 90 min +5R | Six compulsory structured questions + one of two 10-mark evaluations | Typed short/medium + one long response; separate pre-release statement/status plus unseen case-study continuation pane; calculator permitted; formula sheet off unless session instructions require it | `selectionMode: all`; one required Section B card contains both alternatives |
| SL Paper 2 | 90 min +5R | Two compulsory quantitative questions + one of two 20-mark Section B questions | Answer + unit + visible working; text/ink/diagram; calculator permitted/potentially required; current clean formulae resource; attach a discount table when the question requires it | `selectionMode: all`; one required Section B card contains both alternatives |
| HL Paper 2 | 105 min +5R | Three compulsory quantitative questions + one of two 20-mark Section B questions | Same as SL Paper 2, including the conditional discount table | Same workaround |
| HL Paper 3 | 75 min +5R | Three compulsory responses worth 2, 6, and 17 marks | Typed resource-linked responses; persistent social-enterprise resource pack; optional planning ink; calculator permitted; formula sheet off unless session instructions require it | `selectionMode: all` |

Paper 1 is the same question paper at SL and HL, though its subject weighting differs. Paper 2 working must be preserved for method/own-figure marking; do not reduce a calculation to a final-number field.

## Locked mark and weight metadata

Store maximum marks and percentage of the overall subject grade with each exact-session preset even though they do not change the timer. Coursework, explorations, practical work, and oral components account for the remaining subject weight and remain outside this written-paper matrix.

| Course/cycle | SL papers — maximum marks / subject weight | HL papers — maximum marks / subject weight |
|---|---|---|
| Language A (2026) | Pending final current-guide reconciliation; do not publish an official-current mark/weight pair yet | Same release gate |
| Language B (2026) | P1 30 / 25%; P2 listening 25 / 25% + reading 40 / 25% (65 / 50% combined) | Same marks and weights as SL |
| Mathematics AA or AI (2026) | P1 80 / 40%; P2 80 / 40% | P1 110 / 30%; P2 110 / 30%; P3 55 / 20% |
| Biology | P1 55 / 36%; P2 50 / 44% | P1 75 / 36%; P2 80 / 44% |
| Chemistry | P1 55 / 36%; P2 50 / 44% | P1 75 / 36%; P2 90 / 44% |
| Physics | P1 45 / 36%; P2 **unresolved 50 or 55** / 44% | P1 60 / 36%; P2 90 / 44% |
| Psychology — last assessment 2026 | P1 49 / 50%; P2 22 / 25% | P1 49 / 40%; P2 44 / 20%; P3 24 / 20% |
| Psychology — first assessment 2027 | P1 35 / 35%; P2 35 / 35% | P1 35 / 25%; P2 35 / 25%; P3 30 / 30% |
| Business Management | P1 30 / 35%; P2 40 / 35% | P1 30 / 25%; P2 50 / 30%; P3 25 / 25% |

The current manifest now records paper maximum marks, subject weighting, and optional per-question marks. An `official-current` publish path must still validate section/subpart mark sums and the choice rule; those relationships remain a schema blocker rather than a teacher-instruction workaround.

## What the current manifest can and cannot represent

The current [manifest schema](../../src/papers.ts) has one paper-wide `selectionMode` (`one` or `all`) and no section, choice-group, `attempt N of M`, calculator-policy, material-policy, or mark-sum validation. It does carry paper maximum marks/weight and optional question marks. In the candidate UI, global `one` is an essay-paper chooser; it cannot coexist with visible compulsory cards.

Each question also has exactly one response type. An `ink` card may expose a generic field labelled “Type working instead” when `allowTypedAlternative` is enabled, but it cannot separately structure a final numeric answer/unit and its working, or combine a typed assessed answer with a graph/draw overlay. Until composite response blocks exist, either keep answer and working together in one ink card or split them into linked `short` and `ink` cards; label the latter as a DigitalDP approximation rather than an exact reproduction of IB stationery.

Accordingly, response labels in the matrix describe the required target model, not current feature coverage. The app does not yet have first-class numeric-plus-unit, equation, chemical-structure, graph-primitive, draw-on-stimulus, or separate unsubmitted-scratch response blocks. Ink can be a temporary bounded fallback, but the teacher preview must disclose that approximation and retain the editable strokes.

Use these mappings until a grouped-selection schema exists:

| Official pattern | Safe current representation | Limitation shown to teacher |
|---|---|---|
| Entire paper: choose 1 of N essays | One essay card per option + `selectionMode: one` | Fully representable for essay papers |
| All questions compulsory | One card per required response + `selectionMode: all` | Fully representable |
| Compulsory section + choose 1 of N | `selectionMode: all`; compulsory cards plus one required choice-response card containing/linking all alternatives | DigitalDP cannot validate which alternative was chosen |
| Compulsory section + choose 2 of 3 | `selectionMode: all`; compulsory cards plus two required response cards, both linked to the three alternatives | Cannot prevent choosing the same alternative twice or validate distinctness |
| One response from each of two option groups | `selectionMode: all`; one required card per group, with that group’s alternatives inside it | Choice is instruction-driven inside each card |

Do not represent a mixed paper by setting global `selectionMode: one`: the candidate would see only one selected essay card and the compulsory responses would no longer behave as a mixed paper. Treat `single-choice` as an MCQ answer type, not as a paper-level question-choice mechanism.

## Reading and audio timing

- For complete written/on-screen papers marked `+5R` in the matrix, store `readingTimeMinutes: 5` separately from `durationMinutes`. The five minutes are fixed and additional-time percentages apply only to writing/examination time.
- The public policy does not say whether highlighting, annotation, or navigation is permitted during those five minutes. Keep prompts/resources readable and answer entry locked as the conservative mock default; label the interaction rule `PRC confirmation required` for official delivery.
- A combined science Paper 1 receives one five-minute phase before 1A+1B, not one per booklet.
- Language B listening has a paper-specific cadence: three audio texts; four minutes to read the relevant questions at the start of each text; each text played twice; a two-minute pause before the repeat. Those intervals are part of the scheduled 45-minute SL / 60-minute HL component.
- The current manifest/player stores only `maxPlays` and lets the student start a recording. It cannot schedule the four-minute previews, lock the two-minute inter-play pause, or centrally advance three texts. For an official-cadence mock, either use a proctor-managed playback sequence or one preassembled sequence asset per text containing preview, first play, pause, and repeat, with `maxPlays: 1`. A normal audio resource with `maxPlays: 2` is useful practice but must not be described as an exact official delivery.
- Set Language B listening `readingTimeMinutes: 0` at paper level: the public specimen verifies the embedded per-text previews but does not verify an additional general five-minute phase. Current PRC conduct instructions must authorize any future change to that preset.

## Confidence and release gates

| Status | Items |
|---|---|
| High confidence | 2026 paper availability and durations; general five-minute written-paper phase; mathematics calculator split; science Paper 1 combination; Biology/Chemistry marks and science material needs; legacy Psychology and May 2027 preview structures; Business Management structure; Language A and Language B paper shapes and durations |
| Unresolved | Physics SL Paper 2 current mark total (official public sources conflict at 50/55); whether current PRC instructions add a general pre-start phase to Language B listening; exact permitted actions during reading time |
| PRC/session confirmation required | Current approved calculator models; current clean formula/data booklets; exact digital-exam input tools and stationery; updated school-side guide revisions, especially first-assessment-2026 Language A; recent Korean/Japanese/Spanish specimens; live listening playback procedure; all access arrangements |
| Product inference, not IB rule | Stylus/ink defaults, paginated vector canvas, typed alternatives, resource-pane layout, and the mixed-choice card workarounds |

Never allow an unresolved or PRC-only value to be published under an `official current` badge. Save the source/revision identifier with every preset and show a coordinator confirmation date.

## Rights boundary

DigitalDP should provide structure, timing, response capture, and review around **teacher-authored or school-authorized/licensed** material. It must not become a repository of copied IB questions, case studies, markschemes, stationery, formula/data booklets, audio, or source images.

DigitalDP now records one paper-level rights classification. A later schema should refine this to a value on every imported resource/question:

- `teacher-authored`;
- `school-authorized/licensed`;
- `official public reference — local only`;
- `private/unverified reference — local only`;
- `unknown — block sharing/publication`.

Portable export is a separate decision: the current builder defaults to local-only and requires an explicit teacher attestation that the paper and every attachment may be copied. Classification alone is not redistribution permission.

The licensed [IB Questionbank](https://questionbank.ibo.org/) and authenticated [Programme Resource Centre](https://resources.ibo.org/) are the legitimate routes for official content. Public availability is not permission to bundle an IB asset into the application; the relevant guides and papers retain explicit copyright and third-party-platform restrictions.
