# DigitalDP teacher front-end concepts

This folder contains three additive, interactive teacher-interface mockups. They are not connected to the DigitalDP server or production data.

Open [`index.html`](index.html) directly in a browser. No build step or local server is required.

## Concepts

### A. Control room

Starts with current and upcoming exam sessions. It is strongest for supervising concurrent sittings and makes the “start” boundary unambiguous: the reading countdown remains stopped until the teacher selects **Start exam**.

### B. Teacher desk

Starts with the job the teacher wants to complete: prepare, run, or review. It is likely the easiest concept for occasional users because it limits each view to one task.

### C. Paper studio

Keeps the paper outline, selected-question editor, and scrollable student preview visible together. It also demonstrates an exam-controlled tool profile and question-scoped media.

## Review questions

1. Which first screen would make sense without training?
2. Can you find how to build a paper, start an exam, and review responses in each concept?
3. When three exams run simultaneously, which view makes the next required action clearest?
4. In Paper Studio, is the distinction between an official tool profile and a custom practice override clear?
5. Which parts should be combined before any production implementation?

## Interaction notes

- Switch concepts with the A/B/C buttons or `Command/Ctrl + K`.
- The Control Room start button runs a ten-second demonstration reading phase.
- The Teacher Desk task rail switches among prepare, run, and review.
- Paper Studio mirrors edits to the first question and response background into its preview.
- Other controls identify themselves as mock actions and do not change project data.

The companion tool recommendation is in [`research/student-tools-and-calculators.md`](../../../research/student-tools-and-calculators.md).
