# PacePaper 0.1.0-demo.19 release notes

Release date: 5 October 2026.

This release brings the practice calculator much closer to the TI-Nspire CX II handheld and includes the pending roster sign-in and LAN-browser fixes.

## What is new since 0.1.0-demo.18

- **Handheld calculator interface.** A portrait body, 4:3 screen, physical numeric and alphabet key layout, directional touchpad, blue Ctrl functions, and Shift controls replace the earlier web-form layout.
- **Calculator navigation.** Home, Scratchpad Calculate/Graph switching, numbered application menus, document settings, history recall, and contextual Escape behavior work inside the screen. Enter submits a new history line; operators continue from Ans; Ctrl+Enter requests a decimal result.
- **Natural math display.** Calculation history displays stacked fractions, roots and powers using native MathML. Stored numeric variables support arrow assignment (`5→a`) and `:=` assignment; history and variables persist for the current browser sitting.
- **Additional numeric tools.** Factorials, permutations, combinations, direct binomial/normal probability commands, bounded numerical solving, and numerical derivative/integral dialogs complement graph analysis, tracing, tables and statistics.
- **Graph tracing.** Graphs display coordinate labels and a trace marker controlled by the pointer or arrow keys.
- **Roster sign-in.** Students select their class and name from the active roster. New sittings no longer create candidate PINs, and the schema upgrade removes the PIN requirement from existing sittings. Existing scoped links remain supported.
- **HTTP LAN compatibility.** Candidate response identifiers and PDF annotations work in browsers where `crypto.randomUUID` is unavailable on a private-network HTTP origin.
- **Documentation and packaging.** The user guide covers the new calculator controls. Native package checks also require every new calculator module and the client-ID helper to be embedded.

## Downloads and upgrade

Windows x64 and Linux x64 packages include the executable, illustrated guide, text guide and release notes. They start with one generic Sample paper and contain no classroom database or candidate work.

A macOS application is not included because Developer ID signing and Apple notarization credentials are not configured. Mac users can download the source and use `Start PacePaper.command` after installing Bun and running `bun install` once.

Finish any live sittings, stop PacePaper, and back up the complete data folder before replacing an older executable. Database schema version 5 creates a verified pre-migration snapshot through the existing upgrade safeguards.

## Verification

- Source type-check and the full suite pass: 364 tests, 10,820 assertions.
- Browser checks pass for calculations, fractions, variables, history, menus, probability, numerical solving/calculus, graph entry, trace, tables, settings, persistence and mobile layout, with no browser errors.
- The release workflow builds Windows/Linux archives, verifies archive contents and SHA-256 checksums, and runs each executable on its native platform before publication.

## Calculator limitations

The calculator implements selected TI-Nspire CX II workflows with an independent numeric engine. It does not run TI firmware and does not implement TI document files, programming, complex arithmetic, matrices, geometry, finance, CAS or Press-to-Test. Numerical search and calculus remain approximations. It is not made by or approved by Texas Instruments and does not replace an approved physical calculator where one is required.

PacePaper remains a familiarisation tool. Classroom sharing uses HTTP on a trusted private network; use only approved practice materials.
