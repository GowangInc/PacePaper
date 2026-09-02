# Mathematics past-paper mirror provenance (2022–2026)

Retrieved on 2026-09-02 from the unofficial [IB Documents past-paper archive](https://dl.ibdocs.re/past-papers). The source files are private reference material; they are not evidence of official publication, authenticity, or redistribution permission.

## Scope and storage

- Courses: Mathematics: Analysis and Approaches (AA) and Mathematics: Applications and Interpretation (AI), including SL/HL and language/time-zone variants exposed by the source.
- Materials: question papers, markschemes, and associated/supporting files exposed in the relevant archive branches.
- Private binary root: `resources/private/past-papers/2022-2026/mathematics-sciences/` (ignored by Git).
- This directory contains only the tracked inventory, checksums, and provenance record. It does not contain the mirrored paper binaries.
- `status=downloaded` and `status=already-present` both mean the local file was present and SHA-256 hashed at collection completion; the distinction records whether that collector run transferred the bytes.

## Inventory summary

| Year | Math AA files | Math AA bytes | Math AI files | Math AI bytes | Total files | Total bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2022 | 67 | 51,307,572 | 47 | 34,499,913 | 114 | 85,807,485 |
| 2023 | 71 | 168,560,332 | 56 | 60,593,598 | 127 | 229,153,930 |
| 2024 | 63 | 47,531,514 | 52 | 45,662,861 | 115 | 93,194,375 |
| 2025 | 88 | 85,022,526 | 65 | 66,148,437 | 153 | 151,170,963 |
| 2026 | 7 | 26,093,130 | 4 | 7,818,416 | 11 | 33,911,546 |
| **Total** | **296** | **378,515,074** | **224** | **214,723,225** | **520** | **593,238,299** |

The 2026 result is explicitly partial: at retrieval time the source exposed only a `More Papers M26` branch, not a complete May/November session archive. It contained 11 mathematics files and no 2026 markschemes or complete session package for these courses.

## Integrity and limitations

The combined mathematics-and-sciences collection contains 1,413 files (2,194,108,941 bytes): 1,410 PDFs and three plain-text associated files. PDF signature inspection found 1,407 files beginning with `%PDF-`, three 2022 Biology markschemes with a 21-byte binary preamble before `%PDF-`, and no PDF-labelled file without a signature in its first 1,024 bytes.

`pdfinfo` parsed 1,409 of 1,410 PDFs. It could not parse `2026/More Papers M26/Math AASL Paper 2 TZA.pdf`. `qpdf --check` reported 1,044 clean PDFs, 364 warning-status PDFs, and two error-status PDFs: that same 2026 Math AA file (damaged cross-reference/trailer) and `2024/More Papers N24/Chemistry HL - Paper 1.pdf` (broken linearization hint table, although `pdfinfo` reads all 18 pages). Both local sizes exactly match the source `Content-Length`, so these are preserved source defects rather than truncated local downloads. No repair or replacement was attempted.

See `PAST_PAPERS_MIRROR_INVENTORY_2022_2026.csv` for source/listing URLs, session, course, language/variant, size, SHA-256, retrieval status/date, and rights note. Use `PAST_PAPERS_MIRROR_SHA256SUMS_2022_2026.txt` to verify the private files.
