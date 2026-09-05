# DigitalDP examination-system compatibility plan

**Status:** product direction\
**Research date:** 4 September 2026\
**Purpose:** supervised school practice and candidate familiarisation—not official examination delivery

**Implementation note, 4 September 2026:** The Paper Builder now begins with an exam-system selector and includes tuned, versioned starters for the existing IB DP catalogue, Cambridge IGCSE Mathematics 0580, Pearson Edexcel International GCSE Mathematics A in both linear and modular forms, AP English Language, AP Biology and AP Calculus AB, plus a school-custom route. Selected format metadata is retained in exported papers. Multi-section papers now enforce timed work/break phases in the student UI and on the server, hide earlier sections, change phase-specific tool rules, and extend only the final work phase for individual extra time. AP English now treats its 15-minute reading period correctly as optional time within the 135-minute free-response section rather than a response lock. The AP starters remain adapted because the current fixed classroom break advances automatically rather than waiting for each candidate's official-app resume action, and DigitalDP displays but does not emulate an approved graphing calculator.

## Decision

DigitalDP should become a provider-neutral **examination practice platform**. It should reproduce the consequential behaviours of an examination—timing, sections, navigation, permitted tools, media, response formats, breaks, and submission—without claiming to be an awarding body's official platform or copying its branding.

The existing classroom, paper library, session, autosave, media, ink, review, and PDF features are a useful common foundation. The current paper definition is nevertheless IB-specific: it assumes `SL`, `HL`, or `SL/HL`, one optional reading phase followed by one writing phase, four question types, and a fixed two-play audio rule. Those assumptions cannot accurately describe IGCSE and AP practice.

The product should therefore use **versioned exam-system profiles** inside one universal teacher and student shell.

## What “compatible” means

Compatibility means that a school can build an original or properly licensed practice paper whose experience follows the chosen examination's published rules closely enough for useful rehearsal.

DigitalDP should provide:

- the awarding body's terminology, such as **tier**, **level**, **component**, or **section**;
- the correct sequence of instructions, reading time, timed sections, breaks, and submission;
- the correct forward/back navigation policy for each section;
- only the tools permitted in that part, including the correct calculator class;
- typed, selected, numeric, handwritten, listening, or recorded-speaking responses as required;
- candidate-specific approved adjustments without changing the assessment demand;
- durable local autosave and recovery;
- an unambiguous **Practice** label in the teacher view, student view, exports, and printouts.

Compatibility does **not** mean:

- delivering a live awarding-body examination;
- copying Bluebook, RM Assessment Master, Pearson Onscreen Platform, or another product's appearance;
- using official logos or implying approval, certification, or affiliation;
- bundling protected past papers, recordings, mark schemes, or question banks without permission;
- promising compliance with an awarding body's live-exam security rules.

This is behaviour fidelity, not brand or security certification.

## Why one generic “IGCSE mode” would be wrong

IGCSE is not a single operational exam format. For example:

| Example | Published structure that affects DigitalDP |
| --- | --- |
| Cambridge IGCSE Mathematics 0580 Extended | Paper 2 is a two-hour non-calculator paper; Paper 4 is a two-hour paper requiring a scientific calculator. |
| Pearson Edexcel International GCSE Mathematics A Higher | Two two-hour papers; a calculator may be used in both. The qualification uses Foundation/Higher rather than Cambridge's Core/Extended labels. |
| Cambridge digital examinations | Current guidance describes typed responses, selectable/drag-and-drop items, resizable stimulus and response areas, highlighting, a notepad, accessibility controls, autosave, and recovery from connection loss. |
| Pearson onscreen examinations | Public guidance describes highlighting, sticky notes, a notepad, zoom, colour filters, access arrangements, and local recovery when a connection is lost. |
| AP fully digital | Multiple-choice and free-response work are completed in Bluebook, with movement governed by timed sections or parts. |
| AP hybrid digital | Questions and multiple-choice answers are in Bluebook while free responses are handwritten in a paper booklet. |
| AP world languages from 2027 | Listening and speaking are digital, including recorded spoken responses. |

Sources: [Cambridge Mathematics 0580 syllabus](https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf), [Pearson Mathematics A specification](https://qualifications.pearson.com/content/dam/pdf/International%20GCSE/Mathematics%20A/2016/Specification%20and%20sample%20assessments/international-gcse-in-mathematics-spec-a.pdf), [Cambridge digital-exam guidance](https://www.cambridgeinternational.org/programmes-and-qualifications/developing-digital-exams/support-and-guidance-for-digital-exams/), [Pearson onscreen FAQ](https://qualifications.pearson.com/en/about-us/qualification-brands/edexcel/onscreen-assessment/faqs.html), and [College Board AP exam modes](https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/digital-ap-exams/exam-modes).

The exact profile—not the family name alone—must control the experience.

## Compatibility model

Every practice paper should identify this hierarchy:

```text
Awarding body
  Qualification family
    Syllabus or course
      Tier or level, when applicable
        Component or paper
          Series/year and profile version
```

Examples:

```text
Cambridge International → IGCSE → Mathematics 0580 → Extended → Paper 2
Pearson Edexcel → International GCSE → Mathematics A → Higher → Paper 1H
College Board → AP → Biology → no level → End-of-course exam
IB → Diploma Programme → Biology → HL → Paper 1
```

The first teacher selection should be **Exam system**, not subject. Subsequent fields should use the chosen system's language. A teacher may then choose:

1. **Official-format practice** — the profile locks structural rules but accepts original or authorized content.
2. **Adapted practice** — the profile supplies sensible defaults, and every departure is clearly shown.
3. **School custom** — no fidelity claim; the teacher controls all settings.

## Paper-definition direction

The review candidate adds provider identity, profile version, ordered timed phases, question-to-section assignment, phase-specific tool descriptions, and no-return section enforcement without breaking version 1 imports. A later schema revision should finish separating content from delivery rules and add the remaining response modes and candidate-arrangement records below.

```text
identity
  provider, qualification, syllabus/course, tier/level,
  component, series, profile version

delivery
  practice mode, fully digital / hybrid / paper-like,
  candidate instructions, required physical materials

phases[]
  instructions, reading, section, break, review, submission
  duration, navigation policy, included questions, tool profile

questions[]
  response type, marks, resources, allowed tools, print behaviour

candidate adjustments
  extra time by phase, supervised rest breaks, display/accessibility settings
```

The following response types should be available in addition to the current essay, short-answer, single-choice, and ink modes:

- multiple-select;
- numeric and mathematical expression;
- table or structured response;
- matching/order and drag-and-drop;
- labelled image or hotspot;
- file or scanned-page handoff for hybrid practice;
- recorded audio for speaking tasks.

Question-specific text, PDF, image, and audio attachments remain appropriate. Audio policy must move from the current global two-play limit into the exam profile or individual resource. Calculator, formula sheet, periodic table, highlighter, notepad, line reader, and symbol-entry controls must be enabled **by phase**, not merely by paper.

## Six behaviour families

Most target exams fit one of six reusable engines:

| Family | Examples | DigitalDP behaviour |
| --- | --- | --- |
| Linear paper | Many IB, Cambridge, Pearson, GCSE/GCE components | One or more timed phases; typed or ink response; flexible navigation. |
| Sectioned digital | AP fully digital and future international onscreen components | Timed sections/parts, section-specific tools, lock-forward transitions, automatic hand-in. |
| Hybrid digital/paper | AP Biology, Calculus, Chemistry, Physics and other 2027 hybrid exams | Digital question delivery plus explicit handwritten-response handoff; do not pretend ink canvas is the official booklet. |
| Listening/speaking | Language examinations | Profile-controlled audio, headphones check, preparation time, recording, review rules, and upload confirmation. |
| Portfolio/practical | AP Art and Design, AP Research, practical/coursework components | Preparation checklist and external-submission record only at first; do not force these into the timed-paper engine. |
| Adaptive modules | Digital SAT | Separate later engine with module routing and a no-return boundary. It should not be simulated by ordinary sections. |

ACT's current test is largely compatible with the sectioned-linear engine; the digital SAT is not. SAT-style adaptive routing should be deferred until the core profile and phase model is stable.

## Teacher experience

The task-led **Teacher Desk** direction remains suitable. The setup path should be:

1. Choose **Exam system**.
2. Choose the qualification, syllabus/course, tier/level, and component.
3. Choose official-format, adapted, or school-custom practice.
4. Review an automatically generated **candidate experience summary**.
5. Add original or authorized questions and question-level resources.
6. Preview each phase, including tool availability and transition messages.
7. Run a built-in student rehearsal before assigning the paper.

The summary should use plain language, for example:

> Cambridge IGCSE Mathematics 0580 · Extended · Paper 2 practice\
> 2 hours · no calculator · flexible question navigation · automatic hand-in

If a teacher changes a locked rule, DigitalDP should switch the paper to **Adapted practice** and name the difference. It should not silently claim official-format fidelity.

## Student experience

Students should always see the same calm shell, but the controls should be driven by the selected profile. The header should show **Practice**, the exact course/component, current phase, and remaining time. The workspace should show only permitted tools.

Important behaviours include:

- countdown begins only when the teacher starts the session;
- instructions and reading phases can prohibit response entry;
- a break is visibly distinct from working time;
- a section boundary warns before a no-return transition;
- calculator type and availability can change between parts;
- local saves and reconnection state are visible but unobtrusive;
- accessibility preferences persist where the profile permits them;
- hybrid sessions clearly tell students when to use a paper response booklet;
- speaking tasks visibly confirm recording and successful storage.

## Accessibility and reliability baseline

Accessibility settings must be candidate-specific and profile-aware. Cambridge describes background colour, font-size and line-height controls, extra time, rest breaks, volume, captions/transcripts where provided, and pause/resume handling for rest breaks. Pearson describes zoom, colour filters, access arrangements, and limited current compatibility with some assistive technologies. College Board documents extended time, breaks, accessible formats, zoom and keyboard-accessible tools.

DigitalDP should not claim that one generic setting equals an approved arrangement. A session record should retain the selected arrangement, the person who set it, and the version of the profile used.

For classroom trust, the existing local autosave should be expanded into explicit recovery states. Official digital platforms describe continued local work or recovery after transient connection loss. Practice must make the recovery path easy to test before the lesson.

Sources: [Cambridge access arrangements](https://www.cambridgeinternational.org/exam-administration/cambridge-exams-officers-guide/phase-1-preparation/access-arrangements/), [Cambridge digital-exam guidance](https://www.cambridgeinternational.org/programmes-and-qualifications/developing-digital-exams/support-and-guidance-for-digital-exams/), [Pearson accessibility statement](https://qualifications.pearson.com/en/about-us/qualification-brands/edexcel/onscreen-assessment/international-onscreen-accessibility-statement.html), and [College Board Bluebook features](https://bluebook.collegeboard.org/students/accommodations-assistive-technology/accessing-bluebook-features-content).

## Implementation status and remaining order

### Stage 1 — Provider-neutral foundation — review candidate complete

- provider identity and phase fields were added compatibly to version 1 manifests rather than forcing a migration;
- legacy IB papers retain their reading-then-writing behaviour;
- Paper Builder labels and choices now come from the selected exam-system profile;
- imports and exports preserve profile and phase data;
- candidate-facing profile text is labelled as practice or adapted practice.

### Stage 2 — Timing, navigation, and tools — core review path complete

- ordered reading, work, and break phases run on an exact server-issued timeline;
- prior sections are hidden and rejected by the server after a no-return boundary;
- the student and clock views show the current calculator/material rule;
- extra time extends only the final work phase.

Still required after this review: candidate-controlled AP break resume, an embedded approved-calculator integration if one is licensed, reference-sheet controls, and supervised pause/rest-break event records.

### Stage 3 — IGCSE pilot — mathematics profiles complete

The review candidate includes original demonstration profiles for:

- Cambridge IGCSE Mathematics 0580 Extended Paper 2 and Paper 4;
- Pearson Edexcel International GCSE Mathematics A Higher Paper 1H and Paper 2H.

An onscreen English practice component remains a later subject-specific profile; the generic paper, media, typed-response, highlighting, notepad, autosave, and accessibility capabilities it needs are already present.

These four profiles deliberately test tier terminology, calculator differences, paper-like and onscreen practice, and structured resources.

### Stage 4 — AP pilot — review demonstrations complete

The review candidate includes original full-timing and accelerated demonstrations for:

- AP English Language, fully digital;
- AP Biology, hybrid digital/paper;
- AP Calculus, with calculator availability changing by part.

The current fixed break is deliberately labelled adapted because the official app uses a candidate-controlled resume action. Add a world-language listening/speaking demonstration only after recording, device checks, recovery, and teacher playback have been validated.

### Stage 5 — Broader systems

- map Cambridge International AS & A Level and Pearson International A Level onto the same profiles;
- add UK GCSE/GCE profiles where schools request them, using current awarding-body specifications and JCQ rules;
- add linear ACT practice if there is demand;
- design SAT adaptive modules as a separately tested capability.

## Acceptance criteria

Compatibility is ready for a system only when:

- an exact qualification, syllabus/course, tier/level, component, and profile version are recorded;
- a teacher can explain the complete candidate journey from the preview;
- every timed phase and transition has automated tests;
- each prohibited or permitted tool is enforced for the correct phase;
- candidate adjustments are tested independently of standard time;
- disconnect, restart, autosave, submission, and export/import recovery tests pass;
- version 1 IB papers still run with unchanged timing and response behaviour;
- the resulting candidate and teacher PDFs are marked as practice;
- the demonstration contains only original, licensed, or otherwise authorized material;
- a subject specialist has checked the profile against the current official specification before classroom release.

## Research limits

This is a platform-level compatibility decision, not a claim that every subject profile is already researched or implemented. Exact question types, permitted materials, timing, and accessibility arrangements still require a component-by-component pass before a profile is labelled official-format practice. Published digital arrangements are also changing: Cambridge is expanding digital examinations, Pearson is expanding its onscreen subject list, and College Board's AP mode list changes by administration year. Profile rules must therefore be versioned by series/year and reviewed rather than treated as permanent constants.

The retained official-source register is in [`../resources/exam-systems/SOURCES.md`](../resources/exam-systems/SOURCES.md).
