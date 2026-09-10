# PacePaper 0.1.0-demo.11 release notes

Chooses the classroom address from a real network adapter, not a container bridge.

## What is new since 0.1.0-demo.10

- **The default classroom address is now a physical interface.** Private addresses belong to bridge, container, and tunnel adapters too. On a machine running Docker the first private address was often `172.17.x`/`172.18.x` from `docker0`, and Windows lists Hyper-V and WSL adapters the same way. Those adapters are usually unreachable from a student device, so the app now offers physical network interfaces first and lists virtual adapters after them.
- **Nothing was removed.** Every detected private address is still shown in the **Classroom sharing** panel, so a teacher who really does serve students from a virtual adapter can select it deliberately; it is simply no longer chosen automatically.
- **Everything from 0.1.0-demo.10 remains.** Classroom sharing is active at launch, students open the bare classroom address (it redirects to candidate sign-in), each view names itself in the browser tab, and the teacher-facing worked marking guides are gone.

## Verification

- 305 automated tests across 45 files pass; TypeScript checking is clean.
- Interface ordering is covered by unit tests: a physical adapter is offered before `docker0`, `br-*`, and `utun*` adapters, and the same ordering drives the automatic first-run choice.
- The ordering was checked against a real Linux host that runs Docker: its private addresses are `192.168.0.103` (physical) plus `172.17.0.1`, `172.18.0.1`, and `172.19.0.1` (bridges), and the default is now the physical address.
- A startup check boots the packaged app and asserts, before any teacher action, that the student address reported at launch is served with HTTP 200 over the private network address, that the dashboard advertises that same address, and that a restart with the saved address serves it again.
- Linux native startup smoke is run on the published tarball (see the release page); a Windows native smoke is still not possible from this fleet — the Windows bundle is exercised through the shared code path only.

## Important boundaries

- PacePaper is practice and familiarisation software. It is not an official examination-delivery system and is not affiliated with or endorsed by the International Baccalaureate, Cambridge University Press & Assessment, Pearson, College Board, or any awarding body.
- Classroom sharing uses ordinary HTTP on the local network; class codes and responses are not encrypted in transit. Use fake candidates and non-sensitive practice content.
- Sharing is a default, not a lock: a teacher who chooses **This computer only** gets exactly that until the next launch.
- Students must be on the same network as the teacher's computer, and the teacher should confirm the displayed address matches the network students use. Guest networks that isolate clients, a phone VPN, or a different subnet will show "site can't be reached" independently of this app.
- Video stimulus requires network access at exam time unless the file is hosted on the local network. A packaged release ships exactly one generic Sample paper; no video sample is bundled.
- Live timing corrections remain limited to simple reading/writing papers; fixed multi-phase schedules and ended exams stay read-only.
- The product retains its demo-era storage identifiers (environment variables, database file names, and the `.digitaldp-paper` portable format) so existing data and papers keep working across upgrades.
