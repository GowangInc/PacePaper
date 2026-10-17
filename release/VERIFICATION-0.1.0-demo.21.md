# PacePaper 0.1.0-demo.21 release verification

Verified on 17 October 2026 (Asia/Shanghai).

Published [demo.21](https://github.com/GowangInc/PacePaper/releases/tag/v0.1.0-demo.21) at 2026-10-17 11:11:08 UTC with seven uploaded assets. It is now **GitHub Latest**, with `draft=false` and `prerelease=false`, as requested. Both the public Latest page and `releases/latest` API resolve to this release. The `demo.21` version name is retained; the GitHub release-channel flag is independent of that name.

## Source and automated checks

- Release tag: `v0.1.0-demo.21`, source commit `f888c65b0947fc63cf1bbd3a0efca0646d36cec7`.
- Local `bun run check` and `bun test` passed: 364 tests, zero failures across 52 files. Guide generation and the local three-platform archive build completed.
- [Release build and native checks](https://github.com/GowangInc/PacePaper/actions/runs/39026303962) passed all three jobs: build/upload, Linux x64 startup, and Windows x64 startup.
- The GitHub release page shows nine assets: the seven uploaded release files below plus GitHub's two generated source-code archives. All seven uploaded assets are in `uploaded` state at the `v0.1.0-demo.21` download URLs.
- The public 639-byte `SHA256SUMS.txt` downloaded successfully. Its SHA-256 matches GitHub's asset digest; each of its six payload hashes also matches the corresponding GitHub release-asset SHA-256 digest. Full local archive downloads timed out; partial downloads were not used as integrity evidence. Archive integrity and native startup passed in the GitHub workflow above.
- The macOS deliverable is a source archive with the executable launcher, not a compiled macOS application. The launcher passed shell syntax and executable-mode checks. Interactive first-run installation and Finder/Gatekeeper behavior were not exercised.
- GitHub classifies the repository licence as MIT.

## Published release asset inventory

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `PacePaper-0.1.0-demo.21-Release-Notes.txt` | 2,009 | `cdda3d259b34ff277cafb09e7d32cfe5e7dfb0c2816b0cac93b8aaa8e707e130` |
| `PacePaper-0.1.0-demo.21-User-Guide.html` | 1,742,580 | `9c89f47f0b69f2328ee381d0e385ee24aeccfc0cdc2ce4bd4467a41f489661d7` |
| `PacePaper-0.1.0-demo.21-User-Guide.txt` | 39,333 | `06ad4b56dacb332310f997724fb56b0622d14901dabf57f3639f8bf6cd57d427` |
| `PacePaper-0.1.0-demo.21-linux-x64.tar.gz` | 39,100,418 | `021f03f76a9971da76076ff38e7fe9ded4bd27a27626cabe16b494c0cc06f489` |
| `PacePaper-0.1.0-demo.21-macos-source.zip` | 29,296,697 | `9e13c363fcd5ba47d210ad14551efdef45d10a5f5a739bd86abbd4915bac1029` |
| `PacePaper-0.1.0-demo.21-windows-x64.zip` | 41,462,181 | `0b3742242520afa27f2375448f021477cf39a848e04f5147c61d63c14b81a34e` |
| `SHA256SUMS.txt` | 639 | `9be97c0be67a0eb849ff6f3481f4fc12083f3800972a099719536e6b4ee0e247` |

## Platform and release-channel scope

Windows x64 and Linux x64 are self-contained applications. macOS receives the source archive and launcher; it is not a signed or notarized application. The version remains `0.1.0-demo.21`. GitHub marks this release Latest rather than prerelease so teachers can find the downloads; this does not change PacePaper's practice-only scope.
