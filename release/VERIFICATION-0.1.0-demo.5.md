# DigitalDP demo.5 release verification

Published **5 September 2026, 13:16:46 UTC** as a prerelease in the private repository.

- [Release and downloads](https://github.com/GowangInc/DigitalDP/releases/tag/v0.1.0-demo.5)
- [Successful build and native checks](https://github.com/GowangInc/DigitalDP/actions/runs/33968263520)
- Application source: tag `v0.1.0-demo.5`, commit `241ef6c`.
- Release workflow: commit `926ac86`; its additional change selects Windows' native archive tool for the Windows check.

## Verified

- 292 automated tests passed, 10,475 assertions; TypeScript passed.
- Native Windows x64 and Linux x64 executables started in clean temporary working/data directories.
- Both loaded all 52 original papers, allowed demo teacher sign-in, served embedded browser modules and the illustrated guide, and contained no classroom records.
- Teacher-only marking guides required authentication; database, protected-resource, and source paths were inaccessible over HTTP.
- Archive integrity, bundled guide/notes equality, and the exact six-asset release inventory passed.
- Every uploaded GitHub asset digest matched the checksum manifest; downloaded guides and release notes matched the source files.
- The published files were also downloaded into the local ignored `release/` output directory; all five manifest checksums and both archive-integrity checks passed there.

| Executable archive | Bytes | SHA-256 |
| --- | ---: | --- |
| Windows x64 ZIP | 41,475,011 | `43c54c2d63c776b0285657d337e258c2ca5ab41afcb9d113012ae58078994b86` |
| Linux x64 archive | 40,053,227 | `7e2bd0bbc8520985237b92384632fc84bb8b92d6d856f50d5887cd9c1d58356c` |

The other downloads are the illustrated HTML guide, text guide, release notes, and `SHA256SUMS.txt`.

## Corrections made before publication

The first run exposed an incomplete global UI-test mock under Linux's different discovery order. The mock contract was corrected and eight isolated ordering regressions added. No assets were built by that failed run. The unpublished draft tag was advanced to the corrected test source; no published release tag was changed.

The next run built both packages and passed the Linux native check. Its Windows check failed during extraction because Git Bash's archive tool interpreted a drive letter as a remote host. The workflow now invokes Windows' native archive tool explicitly. Both native checks passed in the final run before publication.

## Limits and exclusions

**No macOS app is included.** No valid local Developer ID signing identity or repository signing/notarization secrets were available. Mac distribution remains gated on Developer ID signing, Apple notarization, stapling, and Gatekeeper verification. Mac users should run the updated source for now.

Windows is not publisher-signed and can show a security warning. Native startup checks are not a comprehensive hardware/OS compatibility certification or a real classroom LAN trial.

Protected reference papers/media, classroom databases, recovery responses, and raw QA logs/rosters remain excluded from Git and application bundles. Original mock papers require subject-teacher moderation; the demo is not an official examination system and its temporary credentials are unsuitable for real student data.
