# Resources

This directory stores retained project references, grouped by provenance and subject rather than by application feature.

Protected and copyrighted reference collections (the `resources/private/` past-paper archive and the per-subject mirror inventories, SHA lists, and indexes under `resources/ib/`) are kept local-only: they are excluded from Git and never ship in releases. Only original practice material and provenance/citation documents are tracked.

```text
resources/
  exam-systems/
    SOURCES.md
  ib/
    mathematics/
    sciences/
    languages/
    business-management/
    policies/
  private/
    past-papers/
    incomplete/
```

Each subject-family directory should contain a `SOURCES.md` or equivalent catalogue recording:

- exact document title
- official source URL
- publication or curriculum cycle and first assessment year, when verified
- retrieval date
- local filename and SHA-256 checksum
- access and rights note
- whether the document is a guide, subject brief, specimen paper, sample task, or other reference

Do not automatically acquire paywalled, portal-only, or questionably mirrored examination material. A URL-only catalogue entry is preferable to an unauthorized copy.

PDF, image, and audio reference binaries under `resources/` are excluded from Git. The tracked repository contains catalogues, provenance, and derived structural requirements; local source files remain subject to their original rights and licensing terms.

`resources/private/` is excluded from Git. It is the local holding area for school-authorized or user-supplied copyrighted material, including past papers. Files there may inform local research but must not be pushed to GitHub. Keep a local checksum inventory so duplicates and provenance gaps remain visible.

The current 2022–2026 private archive is summarized in [`ib/PAST_PAPERS_2022_2026_INDEX.md`](ib/PAST_PAPERS_2022_2026_INDEX.md). It records exact coverage, checksums, source limitations, and the tracked inventory files without exposing the copyrighted binaries.

The official-source register for platform-level compatibility with Cambridge, Pearson, AP, UK GCSE/GCE, SAT, and ACT is in [`exam-systems/SOURCES.md`](exam-systems/SOURCES.md). It records public structural evidence only; it is not a collection of examination-paper binaries.

The [full-length non-IB mock delivery report](research/2026-09-05-full-mock-delivery.md) links the component research, official references, original authoring blueprints and test evidence for the 15 complete non-IB mocks. Teacher-only worked answers are generated separately under `docs/mock-marking/`, never attached to candidate papers.
