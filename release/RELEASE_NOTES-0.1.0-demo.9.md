# PacePaper 0.1.0-demo.9 release notes

First downloadable build to carry the post-demo.8 feature set, plus two new candidate-facing capabilities.

## What is new since 0.1.0-demo.8

- **Teacher password Settings.** The dashboard has a Settings section: change the saved teacher password (current password required, new password at least 10 characters). Changing it signs every teacher device out, and the saved password persists across restarts. Fresh installs still start with `admin` / `admin`.
- **Independent light/dark themes.** The teacher top bar, the student waiting screens, and the candidate exam toolbar each offer a light/dark toggle. Teacher and student choices are stored separately per device and default to the operating-system preference. Printed output always uses the light palette.
- **IB MYP eAssessment exam system.** The Paper Builder gains an IB MYP eAssessment option (six subject groups, an On-screen level, May/November sessions), alongside IB DP, Cambridge IGCSE Mathematics 0580, Pearson Edexcel International GCSE Mathematics A, selected 2027 AP formats, and school-custom practice. MYP-style papers are adapted practice, not official papers.
- **Video and YouTube stimulus material.** Paste a video link as a shared paper material or attach one to an individual question. Candidates see an embedded player: YouTube links play via youtube-nocookie.com, and direct https video URLs stream inline. Links are validated structurally at import. Streaming requires internet access at exam time unless the video is hosted on the school network.
- **Full-screen suggestion on the candidate exam.** One click enters browser full screen; the suggestion returns if full screen exits, and an explicit dismissal is remembered for the sitting. It is a harmless no-op in Safe Exam Browser or managed-kiosk environments that already run full screen.
- **Paper Builder drafts remember video links.** The shared video URL and per-question video links survive draft save/restore like every other builder field.
- **Documentation overhaul.** The README now walks the whole workflow with fresh PacePaper-branded screenshots (including a live focus alert and a filled writing-time response area), and the user guide was corrected and updated: current exam systems, the Settings password flow, appearance toggles, focus alerts, and accurate scoping of what ships in a release versus the development course library.
- **Open source.** The repository is public under the MIT License; the PacePaper name and icon artwork are excluded from the grant (see the LICENSE notice).

## Verification

- 296 automated tests across 43 files pass; TypeScript checking is clean.
- The MYP + video pipeline was exercised end to end in a real browser: import a prepared MYP package with a YouTube link, start a live session, and confirm the candidate view renders the youtube-nocookie embed.
- The full-screen flow was exercised in a real browser: entering the exam shows the suggestion, the button enters full screen, exiting re-shows it, and dismissal persists across a reload.
- The password change flow, restart persistence, and per-role theme independence were verified in prior browser regression runs on this source.
- Linux native startup smoke is run on the published tarball (see the release page); a Windows native smoke is still not possible from this fleet — the Windows bundle is exercised through the shared code path only.

## Important boundaries

- PacePaper is practice and familiarisation software. It is not an official examination-delivery system and is not affiliated with or endorsed by the International Baccalaureate, Cambridge University Press & Assessment, Pearson, College Board, or any awarding body.
- MYP eAssessment papers built from this profile are adapted practice format rehearsal, not official eAssessments; teachers should moderate every paper before classroom use.
- Video stimulus requires network access at exam time unless the file is hosted on the local network. A packaged release ships exactly one generic Sample paper; no video sample is bundled.
- Live timing corrections remain limited to simple reading/writing papers; fixed multi-phase schedules and ended exams stay read-only.
- The product retains its demo-era storage identifiers (environment variables, database file names, and the `.digitaldp-paper` portable format) so existing data and papers keep working across upgrades.
