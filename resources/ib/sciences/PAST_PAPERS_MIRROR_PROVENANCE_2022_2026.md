# Sciences past-paper mirror provenance (2022–2026)

Retrieved on 2026-09-02 from the unofficial [IB Documents past-paper archive](https://dl.ibdocs.re/past-papers). The source files are private reference material; they are not evidence of official publication, authenticity, or redistribution permission.

## Scope and storage

- Courses: Biology, Chemistry, and Physics, including SL/HL and language/time-zone variants exposed by the source.
- Materials: question papers, markschemes, and associated/supporting files exposed in the relevant archive branches.
- Private binary root: `resources/private/past-papers/2022-2026/mathematics-sciences/` (ignored by Git).
- This directory contains only the tracked inventory, checksums, and provenance record. It does not contain the mirrored paper binaries.
- `status=downloaded` and `status=already-present` both mean the local file was present and SHA-256 hashed at collection completion; the distinction records whether that collector run transferred the bytes.

## Inventory summary

| Year | Biology files | Biology bytes | Chemistry files | Chemistry bytes | Physics files | Physics bytes | Total files | Total bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2022 | 47 | 88,766,748 | 48 | 47,719,407 | 42 | 41,432,710 | 137 | 177,918,865 |
| 2023 | 85 | 293,342,821 | 86 | 92,122,330 | 72 | 145,569,294 | 243 | 531,034,445 |
| 2024 | 77 | 206,386,213 | 73 | 87,346,771 | 54 | 73,542,658 | 204 | 367,275,642 |
| 2025 | 102 | 170,964,915 | 104 | 108,936,137 | 91 | 207,968,688 | 297 | 487,869,740 |
| 2026 | 2 | 8,939,265 | 4 | 11,806,982 | 6 | 16,025,703 | 12 | 36,771,950 |
| **Total** | **313** | **768,399,962** | **315** | **347,931,627** | **265** | **484,539,053** | **893** | **1,600,870,642** |

The 2026 result is explicitly partial: at retrieval time the source exposed only a `More Papers M26` branch, not a complete May/November session archive. It contained two Biology, four Chemistry, and six Physics files, with no 2026 markschemes or complete session packages for these courses.

## Integrity and limitations

The combined mathematics-and-sciences collection contains 1,413 files (2,194,108,941 bytes): 1,410 PDFs and three plain-text associated files. PDF signature inspection found 1,407 files beginning with `%PDF-`, three 2022 Biology markschemes with a 21-byte binary preamble before `%PDF-`, and no PDF-labelled file without a signature in its first 1,024 bytes.

`pdfinfo` parsed 1,409 of 1,410 PDFs. It could not parse `2026/More Papers M26/Math AASL Paper 2 TZA.pdf`. `qpdf --check` reported 1,044 clean PDFs, 364 warning-status PDFs, and two error-status PDFs: that same 2026 Math AA file (damaged cross-reference/trailer) and `2024/More Papers N24/Chemistry HL - Paper 1.pdf` (broken linearization hint table, although `pdfinfo` reads all 18 pages). Both local sizes exactly match the source `Content-Length`, so these are preserved source defects rather than truncated local downloads. No repair or replacement was attempted.

See `PAST_PAPERS_MIRROR_INVENTORY_2022_2026.csv` for source/listing URLs, session, course, language/variant, size, SHA-256, retrieval status/date, and rights note. Use `PAST_PAPERS_MIRROR_SHA256SUMS_2022_2026.txt` to verify the private files.
