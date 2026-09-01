# Resources

This directory stores retained project references, grouped by provenance and subject rather than by application feature.

```text
resources/
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
