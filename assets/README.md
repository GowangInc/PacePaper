# PacePaper app icon

`assets/app-icon-master.png` is the 1024×1024 source used for all PacePaper application icons. `assets/app-icon.icns` supplies the macOS application bundle and `assets/app-icon.ico` is embedded in the Windows executable. The browser and installable-web variants are derived into `public/` (`app-icon-64.png`, `app-icon-192.png`, `app-icon-512.png`, `apple-touch-icon.png`).

## Design

Flat linework mark: a navy rounded-square tile (`#172033`, the app's brand field) holding an ivory paper sheet, with a bold ink beat-arc rising from an origin square toward four teal beads and a vermilion finish bead. "Pace" is the steady rhythm of beats along the rising arc; the paper keeps the examination identity. Palette: linework ivory `#F1E7D0`, teal `#2E788F`, vermilion `#B83E35`.

## Generation

The artwork is deterministic geometry, rendered with Pillow at 4× supersampling for crisp edges:

- `assets/icon-source/render-b3-master.py` — renders the 1024 master.
- `assets/icon-source/derive-all-formats.py` — derives every public and bundled size from the master, with size-tiered simplification (full art ≥ 64 px; three-bead variant at 32 px; two-bead variant at 16 px so the mark stays structured in the smallest slots). It regenerates `assets/app-icon-master.png`, `assets/app-icon.icns` (via `iconutil`), `assets/app-icon.ico`, and the `public/` icons.

## History

The previous DigitalDP-era icon (glossy 3D navy sheet with a D-form) shipped through demo.7. Its master and derived formats are preserved in this repository's git history (the pre-rebrand `assets/` tree), with an additional local backup copy kept on the author's machine for reference.
