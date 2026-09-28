# Student tools and calculator profiles

Research snapshot: **2026-09-27**\
Scope: DigitalDP’s current course set and a demonstration-first release.\
Status: the built-in practice calculator is implemented; session-specific examination procedures, annual calculator guidance, and approved physical calculators remain authoritative for live use.

## Recommendation

Use a paper profile to determine the official calculator rule. For teacher-authored or custom mathematics practice, expose one explicit opt-in setting for PacePaper’s built-in calculator.

Every paper preset should still load a versioned **student tool profile** from:

`assessment cycle → course → level → paper/component`

The profile should separate:

1. **Core exam controls** — question navigation, timing, autosave/recovery, zoom, text size, highlighter, notepad, and permitted answer canvases.
2. **Authorized reference material** — formula/data booklets, periodic table, case-study or source documents, and question-scoped images/PDFs/audio.
3. **Computational tools** — calculator or graphing technology, available only where the paper profile permits or requires it.
4. **Access arrangements** — candidate-specific adjustments controlled separately from the paper and never treated as casual teacher preferences.

The current `calculatorEnabled` Boolean means only “provide PacePaper’s numeric practice calculator.” It does not claim that a calculator is officially allowed, required, or model-approved. Enabling it makes an otherwise official-format paper a customized practice paper. A future full tool-profile schema should retain the separate policy states below.

## Course and paper matrix

| Course/paper | Calculator or technology | Reference material | DigitalDP response/tool emphasis |
|---|---|---|---|
| Mathematics AA SL/HL Paper 1 | **Not permitted** | Mathematics formula booklet | Ink/equation entry, graph grid, straight-line tool, expandable pages |
| Mathematics AA SL/HL Paper 2 | **GDC required** | Mathematics formula booklet | Same writing tools plus an approved external or validated graphing-calculator route |
| Mathematics AA HL Paper 3 | **GDC required** | Mathematics formula booklet | Extended working, graphing, expandable pages |
| Mathematics AI SL/HL Papers 1–2 | **GDC required** | Mathematics formula booklet | Technology-supported calculation, graphs, tables, visible working |
| Mathematics AI HL Paper 3 | **GDC required** | Mathematics formula booklet | Extended problem solving with the same technology profile |
| Biology SL/HL Papers 1–2 | Calculator **permitted** by the guide; current specimen instructions may say required | Paper- or question-provided data | Calculation working, graph/table response, diagram annotation |
| Chemistry SL/HL Papers 1–2 | Calculator permitted; current specimen instructions say required | **Clean Chemistry data booklet for all papers**, including the periodic table | Calculation working, chemical notation, diagram/graph tools |
| Physics SL/HL Papers 1–2 | Calculator permitted | **Clean Physics data booklet for all papers** | Calculation working, vector/diagram/graph tools |
| Business Management SL/HL Papers 1–2; HL Paper 3 | Four-function capability is sufficient for calculator questions; GDCs are allowed | Formulae or discount table when the paper requires them; source/resource packs by paper | Typed prose, tables, calculations with workings, draw-on-chart/network tools |
| Psychology | No public course-guide evidence reviewed here establishes a special calculator requirement | Question/source material | Typed short and extended responses, source viewer; default computational tool off pending paper instructions |
| Language A Papers 1–2 | No calculator need identified | Persistent source-text/image viewer for Paper 1 | Rich typed prose, highlighter, planning/notepad; optional ink only |
| Language B Paper 1 and Paper 2 reading | No calculator need identified | Written passages for reading | Rich typed prose or source-linked short responses |
| Language B Paper 2 listening | No calculator need identified | Three audio texts and linked questions | Locked playback sequence, questions visible at the correct phase, short/selected responses |

### Evidence notes

- The retained current Mathematics AA guide distinguishes Paper 1 (“No technology allowed”) from Papers 2 and 3 (“Technology required”). The current Mathematics AI guide requires technology for every external paper and says students must have access to a GDC. The IB’s current mathematics page also says students become proficient with GDCs.
- The Biology, Chemistry, and Physics guides for first assessment 2025 say calculators are permitted on Papers 1 and 2. The Chemistry and Physics guides require a clean subject data booklet for all SL and HL examination papers.
- The official public 2025 Biology Paper 1B and Chemistry Paper 2 candidate instructions say a calculator is required. This is why the data model needs separate `allowed`, `required`, and `providedBy` fields instead of a Boolean switch.
- The Business Management guide says four-function capability is sufficient while GDCs are allowed. The official 2026 examiner instructions confirm calculators are allowed on Papers 2 and 3 and that Paper 2 parts may require one.
- Official 2026 Language B examiner instructions confirm that Paper 2 listening uses three audio texts. The retained public specimen sets a per-text sequence of question-reading time, two complete plays, and a pause between plays. DigitalDP’s exact live sequence still needs comparison with current PRC conduct instructions.

## Built-in practice calculator

### Shipped on 2026-09-27

- An opt-in **Provide PacePaper’s built-in scientific and graphing calculator** setting appears only for mathematics, calculus, or math-labelled courses.
- The setting is stored in the portable paper manifest and browser draft.
- The student **Calculator** button appears only when the paper enables it and the current work phase does not prohibit calculator use. It is absent during reading, breaks, locked phases, and after submission.
- The calculator runs entirely in the page. Its expression parser uses an allowlist and does not use `eval`, `Function`, external scripts, or network calls.
- Supported numeric work: arithmetic, implicit multiplication, powers, parentheses, π, e, `Ans`, square roots, absolute values, trigonometric and inverse-trigonometric functions, degree/radian modes, natural/common logs, exponentials, rounding, minima, and maxima.
- Graphing supports up to three numeric functions of `x` with teacher-independent student bounds. History, angle mode, expressions, functions, and bounds persist only in `sessionStorage` for the current sitting.
- The UI deliberately identifies itself as a practice tool, not a TI product or approved calculator emulator.

### Deliberate boundary

The first implementation covers the two core TI-Nspire Scratchpad activities documented by Texas Instruments: calculations with history and function graphing. It does not reproduce TI-Nspire trade dress or firmware and does not provide CAS, symbolic solving, saved documents/programs, statistics, spreadsheets, matrices, geometry, finance packages, data collection, Press-to-Test, or model certification.

Use school-approved physical calculators whenever an official or live examination requires an approved model. PacePaper should display the paper rule (“GDC required”, “calculator permitted”, or “not permitted”) even when its built-in tool is unavailable. Before a full mock, compare the paper against the current course guide, PRC conduct instructions, and annual calculator guidance.

### Other student tools still required

- Question navigator with answered/unanswered status.
- Highlighter for selectable paper text.
- Zoom/text-size and contrast controls that do not change the paper’s meaning.
- Typed response, equation-friendly plain text, and paginated ink response modes.
- Canvas backgrounds: plain, ruled, square grid, and graph grid.
- Pen, eraser, straight-line tool, undo/redo, and add-page control.
- Persistent question-scoped image/PDF viewer.
- Paper-scoped clean formula/data booklet viewer where required.
- Question- or section-scoped audio with enforced play count and playback history.
- A teacher-visible and student-visible **Allowed tools** summary before the sitting begins.
- A print/PDF candidate record containing prompts, typed responses, ink pages, and the notepad, while keeping non-printing interface metadata out of the paper.

### Later, after validation

- A separately validated GDC/graphing engine with an exact feature profile and offline examination mode.
- Geometry instruments such as protractor/compass only where a real assessment need is verified.
- Structured table/spreadsheet entry only where it cannot introduce functions unavailable in the actual examination.
- Candidate-specific accessibility profiles reviewed against current access-and-inclusion rules.

## Suggested paper schema

```json
{
  "toolProfile": {
    "profileId": "2026-math-aa-hl-paper-1",
    "authority": "official-preset",
    "calculator": {
      "status": "not-permitted",
      "providedBy": "none"
    },
    "references": [
      {
        "kind": "formula-booklet",
        "status": "required",
        "providedBy": "school-authorized-file"
      }
    ],
    "responseTools": [
      "typed-text",
      "equation-entry",
      "ink",
      "eraser",
      "straight-line",
      "graph-grid",
      "add-page"
    ],
    "customized": false
  }
}
```

Recommended calculator states:

- `not-permitted`
- `permitted`
- `required`
- `not-applicable`
- `unverified`

Recommended provider states:

- `none`
- `student-external-device`
- `school-device`
- `digitaldp-validated-tool`

## Teacher and student presentation

In the teacher builder, show a compact locked summary immediately after the teacher selects the exact exam:

> **Exam tools · Math AA HL Paper 1**\
> Calculator: not permitted · Formula booklet: required · Responses: ink, equation entry, graph canvas

In the student waiting room, show the same rule before the exam begins. During the exam, show only permitted tools. Do not display disabled icons for forbidden tools; their absence is clearer and reduces accidental policy breaches.

If a teacher changes an official profile:

> **Custom practice settings**\
> Calculator access differs from the selected official paper profile. This paper will be saved as a custom practice paper.

## Primary public sources

- [IB exam calculator policy](https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/exam-calculator-policy/)
- [IB mathematics curriculum page](https://www.ibo.org/programmes/diploma-programme/curriculum/mathematics/)
- [Mathematics: analysis and approaches guide](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/subject-guides/mathematics-analysis-approaches-guide.pdf)
- [Mathematics: applications and interpretation guide](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf)
- [Biology 2025 SL Paper 1B sample](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/subject-guides-documents/sl-sample-exam-paper-1b--biology.pdf)
- [Chemistry 2025 SL Paper 2 sample](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/subject-guides-documents/sl-sample-exam-paper-2--chemistry.pdf)
- [Chemistry guide, first assessment 2025](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/subject-guides/chemistry-guide.pdf)
- [2026 Language B examiner instructions](https://ibpublishing.ibo.org/exinst/apps/exinst/index.html?chapter=1&doc=EX_instructions_2026_e&part=9)
- [2026 Business Management examiner instructions](https://ibpublishing.ibo.org/exinst/apps/exinst/index.html?chapter=1&doc=EX_instructions_2026_e&part=10)
- [IB’s May 2025 examination-procedure update](https://www.ibo.org/news/news-about-the-ib/ib-updates-assessment-procedures-for-may-2025-exams/)
- [TI-Nspire CX II Handhelds Guidebook, version 6.3](https://education.ti.com/en/guidebook/details/en/4BEBB458C6A64278A3249BA6443E8688/TI-NspireCXIIHHGuidebook)
- [TI-Nspire CX II exam preparation and Press-to-Test guide](https://education.ti.com/en/resources/test-preparation/education-test-prep-guides/ti-nspire-cx-ii)

## Local retained guide evidence

The public guide copies used for the matrix are stored in `resources/ib/` for internal reference. The PDF files are intentionally excluded from Git. Existing subject-specific findings remain in `research/findings/` and should continue to be treated as the detailed preset record.

Before using DigitalDP for any live official examination, an authorized school staff member must compare the profile with the current session’s paper instructions, conduct instructions, assessment procedures, access arrangements, and annual calculator guidance in the PRC.
