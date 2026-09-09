---
name: digitaldp-paper-authoring
description: Convert a teacher's prepared assessment and its source files into a validated PacePaper paper package.
---

# PacePaper Paper Authoring

Upload this `SKILL.md` and the prepared assessment files to an AI authoring tool. It must produce a `paper.json` that PacePaper can import with the assessment's referenced files. Do not upload `SKILL.md` to PacePaper.

## Required output

Return exactly one JSON object saved as `paper.json`. Do not invent questions, source text, instructions, timing, answer options, or files. If the assessment is ambiguous, stop and ask the teacher for the missing decision.

Place `paper.json` beside the source files. In PacePaper's **Structured paper package** importer, select `paper.json` and every referenced asset at the same time.

## Supported package files

- PDF: `application/pdf`
- Images: PNG, JPEG, WebP
- Audio: MP3, M4A, OGG, WAV
- Do not reference DOCX, PowerPoint, ZIP, HTML, video, or fonts. Convert a document to PDF first.
- Keep each asset at or below 50 MB; all assets together at or below 200 MB.

## Conversion procedure

1. Inventory every supplied file and identify which are displayed to the candidate.
2. Preserve the teacher's title, subject, level, paper label, assessment session, reading time, writing time, instructions, source labels, question order, and wording.
3. Use a text resource only when the source text is supplied as extractable text and must appear directly in the resource pane. Otherwise retain the teacher's source as a PDF, image, or audio file.
4. Add one resource object for each candidate-visible source. Its `key` is a lowercase identifier such as `text-a`, `source-1`, or `audio-1`.
5. Add one question object for each response required from the candidate. Put only the resource keys used by that question in `resourceKeys`; this is how images, PDFs, text, or audio are scoped to the applicable question.
6. Use `essay` for a rich-text extended response, `short` for a typed short response, `single-choice` only when the supplied assessment has explicit choices, and `ink` when candidates must draw, graph, annotate, or show handwritten working. A single-choice question needs at least two `options` in the exact teacher order. An ink question needs an `ink` configuration with 1–4 pages, a `blank`, `lined`, or `square-grid` background, and an explicit typed-alternative setting.
7. Use `selectionMode: "all"` unless the entire assessment requires the candidate to choose exactly one essay question. For that simple choice paper use `selectionMode: "one"`. The current schema does not express mixed compulsory-and-choice sections: create the compulsory questions normally, then use one required question card whose prompt contains that section's alternatives. Do not mark the entire mixed paper as `"one"`.
8. For listening, set `mode: "listening"` and include at least one audio resource. Set `maxPlays: 2` on every audio resource. This is a fixed PacePaper rule: each recording has two complete plays, and a play cannot be paused or restarted once it begins.
9. Before returning, validate the checklist below. Output no prose around the JSON.

## Manifest shape

```json
{
  "version": 1,
  "assessmentSession": "custom",
  "sourceClassification": "teacher-authored",
  "exportAuthorized": false,
  "title": "Exact assessment title",
  "subject": "english-b",
  "subjectLabel": "English B",
  "level": "SL/HL",
  "paper": "Paper 2 – Reading",
  "durationMinutes": 60,
  "readingTimeMinutes": 5,
  "maximumMarks": 40,
  "subjectWeightPercent": 25,
  "mode": "reading",
  "instructions": "Exact candidate instructions.",
  "selectionMode": "all",
  "resources": [
    {
      "key": "text-a",
      "label": "Text A",
      "kind": "document",
      "file": "text-a.pdf"
    },
    {
      "key": "text-b",
      "label": "Text B",
      "kind": "text",
      "text": "Exact source text, when supplied as text."
    }
  ],
  "questions": [
    {
      "id": "q1",
      "label": "Question 1",
      "prompt": "Exact question wording.",
      "type": "short",
      "marks": 5,
      "resourceKeys": ["text-a"]
    },
    {
      "id": "q2",
      "label": "Question 2",
      "prompt": "Write a response using both texts.",
      "type": "essay",
      "resourceKeys": ["text-a", "text-b"],
      "wordCountMin": 250,
      "wordCountMax": 400
    },
    {
      "id": "q3",
      "label": "Question 3",
      "prompt": "Show your working and final answer.",
      "type": "ink",
      "resourceKeys": ["text-a"],
      "ink": {
        "pages": 2,
        "background": "square-grid",
        "allowTypedAlternative": true
      }
    }
  ]
}
```

## Resource rules

| `kind` | Required field | Rules |
| --- | --- | --- |
| `text` | `text` | Direct source text; no `file`. |
| `document` | `file` | PDF only. |
| `image` | `file` | PNG, JPEG, or WebP. |
| `audio` | `file`, optional `maxPlays` | MP3, M4A, OGG, or WAV; omitted `maxPlays` defaults to `2`, and any explicit value must be exactly `2`. Each play runs to the end without pause or restart. |

## Validation checklist

- `version` is `1`.
- `subject` is a lowercase slug, for example `english-b` or `history`.
- `level` is exactly `SL`, `HL`, or `SL/HL`.
- `mode` is exactly `essay`, `reading`, or `listening`.
- `durationMinutes` is an integer from 5 to 360.
- `readingTimeMinutes` is the separate pre-writing period as an integer from 0 to 60; use `0` when none applies.
- `maximumMarks` and `subjectWeightPercent` are optional positive integers for a verified preset. Each question may also carry optional positive integer `marks`; do not invent any of these values.
- `assessmentSession` and `examProfileId` are included when the teacher or verified exam profile supplies them; do not guess them.
- `sourceClassification` is exactly `teacher-authored`, `school-authorized`, `official-public-reference`, or `unknown-local-only`; classification records provenance but never grants copying or redistribution rights.
- `exportAuthorized` is a separate boolean attestation. Set it to `true` only when the paper and every attachment may be copied into a portable PacePaper export; otherwise use `false`.
- There are 0–30 resources and 1–100 questions.
- Every resource key and question ID matches `^[a-z0-9][a-z0-9_-]{0,63}$` and is unique.
- Every `resourceKeys` item exists in `resources`.
- A question lists only its own media plus genuinely paper-wide resources; question-specific media is not copied into unrelated questions.
- Every `file` value exactly matches one supplied filename, including its extension and case.
- Every supplied asset is referenced exactly once; no extra files are uploaded.
- A `single-choice` question has 2–12 explicit options.
- Every listening paper has at least one audio resource, and every audio resource either omits `maxPlays` or sets it to exactly `2`.
- An `ink` question has 1–4 pages and a `blank`, `lined`, or `square-grid` background. Keep `allowTypedAlternative: true` unless an approved accommodation policy says otherwise.
- Word limits are positive integers no greater than 10,000, with minimum no greater than maximum.
- All teacher-provided wording is preserved. No answer key, markscheme, examiner notes, or hidden instructions appear in `paper.json`.
