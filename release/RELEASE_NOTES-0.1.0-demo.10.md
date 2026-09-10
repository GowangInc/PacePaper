# PacePaper 0.1.0-demo.10 release notes

Classroom sharing is active from launch, so student devices join on the first try instead of waiting for a dashboard click.

## What is new since 0.1.0-demo.9

- **Classroom sharing is on by default.** A packaged PacePaper now activates the classroom network as it starts. The address saved last time is reused, and a fresh installation chooses and saves the machine's first private network address. Students on the same network can open the shown address immediately; the teacher no longer has to enable sharing for each sitting.
- **The advertised address is the accepted address.** Previously the dashboard displayed a private-network student address while the server rejected every non-loopback request until sharing was enabled, so students saw `{"error":"Misdirected request"}`. The address shown on the dashboard, the address printed at startup, and the address the server accepts now come from one value.
- **Teachers still control sharing.** The **Classroom sharing** panel switches to another detected address or to **This computer only** for the current sitting; the panel can no longer be changed while an examination is live.
- **Documentation corrected.** The README and the illustrated user guide no longer describe the old "starts in This computer only every launch" behaviour; both now describe sharing at launch and what the panel is for.
- **Worked marking guides removed.** The teacher-facing **Mock marking guides** pages are gone: the sidebar link, the `/mock-guides` route, and the generated `docs/mock-marking/index.html` index. Practice papers ship without answers or point allocations, since teachers are expected to know the tasks they set. Paper files never contained these notes, so existing papers and exports are unaffected; the app still does not mark or grade responses.

## Verification

- 303 automated tests across 44 files pass; TypeScript checking is clean.
- A startup check boots the packaged app and asserts, before any teacher action, that the student address reported at launch is served with HTTP 200 over the private network address, that the dashboard advertises that same address, and that a restart with the saved address serves it again. It also asserts a teacher can still switch sharing off for the sitting.
- The same flow was verified manually on a real private network address, including the student join API answering normally (rather than being refused) from a non-loopback client.
- Linux native startup smoke is run on the published tarball (see the release page); a Windows native smoke is still not possible from this fleet — the Windows bundle is exercised through the shared code path only.

## Important boundaries

- PacePaper is practice and familiarisation software. It is not an official examination-delivery system and is not affiliated with or endorsed by the International Baccalaureate, Cambridge University Press & Assessment, Pearson, College Board, or any awarding body.
- Classroom sharing uses ordinary HTTP on the local network; class codes and responses are not encrypted in transit. Use fake candidates and non-sensitive practice content.
- Sharing is a default, not a lock: a teacher who chooses **This computer only** gets exactly that until the next launch.
- Students must be on the same network as the teacher's computer. Guest networks that isolate clients, a phone VPN, or a different subnet will show "site can't be reached" independently of this app.
- Video stimulus requires network access at exam time unless the file is hosted on the local network. A packaged release ships exactly one generic Sample paper; no video sample is bundled.
- Live timing corrections remain limited to simple reading/writing papers; fixed multi-phase schedules and ended exams stay read-only.
- The product retains its demo-era storage identifiers (environment variables, database file names, and the `.digitaldp-paper` portable format) so existing data and papers keep working across upgrades.
