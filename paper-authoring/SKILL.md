---
name: digitaldp-paper-authoring
description: Convert a teacher's prepared assessment and its source files into a validated DigitalDP paper package.
---

# DigitalDP Paper Authoring

Upload this `SKILL.md` and the prepared assessment files to an AI authoring tool. It must produce a `paper.json` that DigitalDP can import with the assessment's referenced files. Do not upload `SKILL.md` to DigitalDP.

## Required output

Return exactly one JSON object saved as `paper.json`. Do not invent questions, source text, instructions, timing, answer options, or files. If the assessment is ambiguous, stop and ask the teacher for the missing decision.

Place `paper.json` beside the source files. In DigitalDP's **Structured paper package** importer, select `paper.json` and every referenced asset at the same time.

## Supported package files

- PDF: `application/pdf`
- Images: PNG, JPEG, WebP
- Audio: MP3, M4A, OGG, WAV
- Do not reference DOCX, PowerPoint, ZIP, HTML, video, or fonts. Convert a document to PDF first.
- Keep each asset at or below 50 MB; all assets together at or below 200 MB.

## Conversion procedure

1. Inventory every supplied file and identify which are displayed to the candidate.
2. Preserve the teacher's title, subject, level, paper label, duration, instructions, source labels, question order, and wording.
3. Use a text resource only when the source text is supplied as extractable text and must appear directly in the resource pane. Otherwise retain the teacher's source as a PDF, image, or audio file.
4. Add one resource object for each candidate-visible source. Its `key` is a lowercase identifier such as `text-a`, `source-1`, or `audio-1`.
5. Add one question object for each response required from the candidate. Put the resource keys used by that question in `resourceKeys`.
6. Use `essay` for a rich-text extended response, `short` for a typed short response, and `single-choice` only when the supplied assessment has explicit choices. A single-choice question needs at least two `options` in the exact teacher order.
7. Use `selectionMode: "all"` unless the assessment explicitly requires the candidate to choose one question. For a choice paper use `selectionMode: "one"`.
8. For listening, set `mode: "listening"` and add `maxPlays` to every audio resource. Use the supplied play limit; otherwise use `2`.
9. Before returning, validate the checklist below. Output no prose around the JSON.

## Manifest shape

```json
{
  "version": 1,
  "title": "Exact assessment title",
  "subject": "english-b",
  "subjectLabel": "English B",
  "level": "SL/HL",
  "paper": "Paper 2 – Reading",
  "durationMinutes": 60,
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
| `audio` | `file`, optional `maxPlays` | MP3, M4A, OGG, or WAV; `maxPlays` is 1–4 and defaults to 2. |

## Validation checklist

- `version` is `1`.
- `subject` is a lowercase slug, for example `english-b` or `history`.
- `level` is exactly `SL`, `HL`, or `SL/HL`.
- `mode` is exactly `essay`, `reading`, or `listening`.
- `durationMinutes` is an integer from 5 to 360.
- There are 0–30 resources and 1–100 questions.
- Every resource key and question ID matches `^[a-z0-9][a-z0-9_-]{0,63}$` and is unique.
- Every `resourceKeys` item exists in `resources`.
- Every `file` value exactly matches one supplied filename, including its extension and case.
- Every supplied asset is referenced exactly once; no extra files are uploaded.
- A `single-choice` question has 2–12 explicit options.
- Word limits are positive integers no greater than 10,000, with minimum no greater than maximum.
- All teacher-provided wording is preserved. No answer key, markscheme, examiner notes, or hidden instructions appear in `paper.json`.
