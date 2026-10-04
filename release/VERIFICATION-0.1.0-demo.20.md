# PacePaper 0.1.0-demo.20 release verification

Verified on 5 October 2026 (Asia/Shanghai).

Published [demo.20](https://github.com/GowangInc/PacePaper/releases/tag/v0.1.0-demo.20) at 2026-10-04 19:03:40 UTC as a non-draft prerelease with six uploaded assets.

## Source and automated checks

- Release tag: `v0.1.0-demo.20`, source commit `9121006619ddd01fd3bfe4acbda254d31b81b4b4`.
- Local browser bundling, executable compilation, type-check and guide generation passed.
- [Main CI](https://github.com/GowangInc/PacePaper/actions/runs/37226581842) and [tag CI](https://github.com/GowangInc/PacePaper/actions/runs/37226608002) passed. The existing source suite reports 364 passing tests, zero failures and 10,859 assertions across 52 files.
- [Release build and native checks](https://github.com/GowangInc/PacePaper/actions/runs/37226620185) passed all three jobs: build/upload, Linux x64 startup and Windows x64 startup.
- Existing native checks confirmed one generic Sample paper, teacher sign-in, empty classroom/student/session data, embedded pages and the calculator entry/navigation/tools modules, packaged guide content and private-route restrictions.
- These checks establish source/package consistency and existing application behaviour. Comprehensive numerical reference comparisons and browser/physical-calculator comparisons for the new functions remain outstanding; no new feature tests were added.

## Downloaded release assets

All six draft assets were downloaded from GitHub before publication. Uploaded byte sizes, the SHA-256 inventory, archive integrity and packaged documentation matched. The packaged HTML/text guide calls the tool calculator and contains no TI-Nspire naming.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `PacePaper-0.1.0-demo.20-Release-Notes.txt` | 4,829 | `ad9462321f48e11037c8045fdb6d31ded2c05d60881dd954ba2a3765bddbcd7e` |
| `PacePaper-0.1.0-demo.20-User-Guide.html` | 1,742,203 | `80717db5f6733af3ed260e4caaabc79c6c814a894a2525226e370f8de2ba77cb` |
| `PacePaper-0.1.0-demo.20-User-Guide.txt` | 38,967 | `465a87793a4dae9b8b26f511fa5d59b8a00e36ecdd7d06756b12d18a81500c4b` |
| `PacePaper-0.1.0-demo.20-linux-x64.tar.gz` | 39,101,259 | `071f13292b1ec1e89dfccf1d5f43ea0f426703cf5c66d8c37fd1e21804df0e0f` |
| `PacePaper-0.1.0-demo.20-windows-x64.zip` | 41,462,841 | `7c4966860a91d3fc5087fccac0bb8b2479d5f9a0564676322293c87c43c6dcbd` |
| `SHA256SUMS.txt` | 532 | `45d6fe427e03b7d2f972d89770d1e875fad471293a6279231b7ba0cbeb41d53f` |

## Platform and feature scope

Windows x64 and Linux x64 are the standalone packages. Live checks found no configured GitHub Apple secrets and zero valid local signing identities, so no macOS application was built/uploaded. `Start PacePaper.command` is present at the tag with executable mode `100755` for source use.

The calculator is independently implemented. Its numeric limits and unvalidated areas are recorded in `research/calculator/independent-engine.md` and the release notes. Formal examination approval, mathematical parity and classroom-network connectivity beyond hosted startup checks were not established by this release verification.
