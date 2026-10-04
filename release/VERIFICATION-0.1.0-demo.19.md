# PacePaper 0.1.0-demo.19 release verification

Verified on 5 October 2026 (Asia/Shanghai).

## Source and automated checks

- Release tag: `v0.1.0-demo.19`, source commit `e87d27b9f24d0cc4f538ec3c2dea777e09d35555`.
- Local type-check passed. The full source suite passed with 364 tests and 10,820 assertions.
- [Main CI](https://github.com/GowangInc/PacePaper/actions/runs/37222357665) and [tag CI](https://github.com/GowangInc/PacePaper/actions/runs/37222358191) both passed.
- [Release build and native checks](https://github.com/GowangInc/PacePaper/actions/runs/37222361938) completed successfully: Windows x64 and Linux x64 both launched on their native hosted runners.
- Native checks confirmed one generic Sample paper, teacher sign-in, empty classroom/student/session data, embedded pages including every calculator module and the LAN client-ID helper, guide content, and private-route restrictions.
- Browser verification covered handheld controls, numbered menus, variables, history, natural math display, probability, numerical calculus/solving, graph entry/tracing, tables, settings, reload persistence and mobile layout; no page errors were reported.

## Downloaded release assets

The six draft assets were downloaded from GitHub and checked locally before publication. Archive integrity, packaged documentation, uploaded byte sizes and the SHA-256 inventory all matched.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `PacePaper-0.1.0-demo.19-Release-Notes.txt` | 3,755 | `20e6e1de55ee9760823b5f38d798cee45a31377e86876f41ef3307a27f4aebe8` |
| `PacePaper-0.1.0-demo.19-User-Guide.html` | 1,740,837 | `562df0db4ac4b529bb5e14aaa2722c0f6e008e59875429b08ef600ff81364d7a` |
| `PacePaper-0.1.0-demo.19-User-Guide.txt` | 37,762 | `a9e5310c6feffdc73593c44255733d06144121fab33021d180aeff6d9e1745e0` |
| `PacePaper-0.1.0-demo.19-linux-x64.tar.gz` | 39,074,646 | `bb44e9ccce8fb8ef9e07d1e1438143b3b5cbb35ff436b429f7cc79318ad6458c` |
| `PacePaper-0.1.0-demo.19-windows-x64.zip` | 41,436,109 | `e786e2ff784a561ab5958421f2b82c2392264f276eaaa5d342b277e85003a51b` |
| `SHA256SUMS.txt` | 532 | `2010f788dae7c6afc0230825e76ad4152afb477b2c7e4fd67c788037095e94d9` |

## Platform scope

Windows x64 and Linux x64 are the standalone packages. macOS signing credentials remain absent, so no Mac application was built or uploaded. `Start PacePaper.command` is present in the release tag with executable mode `100755` for source use.

The calculator uses an independent numeric engine; it does not run TI firmware. Formal examination approval and classroom-network connectivity beyond the hosted native checks were not established by this release verification.
