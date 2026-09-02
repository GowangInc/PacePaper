# Paper Builder demo QA

Date: **2026-09-02**

This report records direct checks of the current prototype. The sample papers are original DigitalDP demonstrations, not official IB papers or replicas.

## Current packaged-release classroom sharing preflight

- Packaged DigitalDP uses the teacher dashboard's **Classroom sharing** panel: the teacher selects a detected private IPv4 address and applies it in-app. No teacher shell command or `DIGITALDP_LAN_ORIGIN` setting is required for a standalone release.
- A packaged release starts on the first free local port from `9148` through `9158`, then opens the teacher dashboard at that chosen port. The generated macOS deliverable is the universal `DigitalDP-*-macos-universal.zip` archive, containing one app for both Apple-silicon and Intel Macs.
- The managed-release smoke test enabled a selected LAN address in-app and confirmed a LAN student request returned HTTP 200 while a LAN `/admin` request returned HTTP 403. Teacher pages and teacher APIs therefore remain host-only while the student surface is shared.
- `bun test` currently passed **178 tests, 0 failures**. This includes release port selection, managed classroom-sharing state, and the LAN authority/access-policy coverage; the universal macOS archive is verified as a release-build artifact separately.
- A real second-device test remains open: guest Wi-Fi, managed-browser policy, or VLAN/client isolation can still block a student device even when the packaged host passes the HTTP smoke test.

## Historical source-server LAN evidence

The following records the earlier source-checkout test path. It documents module loading and host-policy evidence, but is **not** the way a packaged release is configured: source mode used the explicit `DIGITALDP_LAN_ORIGIN` environment variable, whereas the release uses in-app Classroom sharing.

- A failed student exam load was reproduced against a stale Bun process: `/exam.js` returned JavaScript, but its newly added `/exam-audio.js` dependency returned a JSON 404. The browser therefore reported the parent dynamic import as failed. The student import remains root-relative and correctly follows whichever origin opened `/student`; no `localhost` URL is hard-coded.
- Static browser assets now use a constrained root-file resolver instead of a manually maintained route list. A module-closure test checks every root-relative JavaScript import is both servable and present, including `/exam-audio.js`.
- The historical source-mode LAN test required an exact `DIGITALDP_LAN_ORIGIN` using a private IPv4 address and the listening port. Loopback remained the default when it was absent. The LAN authority was exact; forged hosts, other interfaces, public addresses, HTTPS mismatches, and wrong ports were rejected.
- Over LAN, DigitalDP exposes the student page, static browser assets, student login/state/save/submit/audio APIs, student-authorized paper assets, and student WebSockets. The teacher page, clock, setup, teacher login, teacher APIs, and teacher WebSocket remain local to the host Mac, so the temporary `admin` / `admin` credential is not accepted from a student device.
- A localhost teacher now receives the configured LAN student origin in bootstrap data. The dashboard and projected clock display and copy that address rather than `localhost`, which would point students back to their own computers.
- A temporary no-audio browser fixture completed LAN student sign-in, exam selection, and examination rendering at `http://10.80.20.178:9152/student` with no module, CSP, or console errors. Direct probes returned 200 JavaScript for the complete student module graph and 403 for LAN teacher routes/login.
- The live database was backed up and the main server restarted at `http://10.80.20.178:9148/student` with the ten-second reading-time test override. It listens on all IPv4 interfaces; localhost teacher access, LAN student HTML, `/exam.js`, and `/exam-audio.js` returned 200, while LAN `/admin` returned 403. SQLite integrity was `ok`; the macOS application firewall reported disabled.
- Historical automated verification passed 141 tests plus TypeScript and JavaScript syntax checks. The current 178-test packaged-release result is recorded above; a real second-device check is still required because school Wi-Fi client isolation or VLAN policy can block peer-to-peer traffic even when the Mac is correctly listening.

## Verified teacher authoring

- A teacher can sign in with the demo credentials `admin` / `admin`.
- Startup was tested against a database containing an `oldteacher` account and four teacher sessions. After restart, the sole teacher username was `admin`, old teacher sessions were gone, the old login returned HTTP 401, and `admin` / `admin` returned HTTP 200.
- Historical source-mode startup evidence: the server bound to `127.0.0.1` by default and bound for student LAN access only when an exact private `DIGITALDP_LAN_ORIGIN` was supplied; teacher authentication remained loopback-only because the demo credential is deliberately weak and reset at every startup. Packaged releases now use the in-app Classroom sharing workflow recorded above.
- Mathematics: Analysis and Approaches exposed the level options in the order SL, HL, and SL/HL. The combined Paper 1 starter became a custom profile rather than claiming an official level-specific profile.
- The live preview updated title, prompt, marks, timing, instructions, response-area type, and level while typing.
- At 1440 by 1000 pixels the builder used a two-column layout with a sticky preview. The preview had its own `overflow: auto` region and retained a 250-pixel scroll position across live updates.
- At 390 by 844 pixels the editor and preview stacked into one column. Document width and scroll width were both 390 pixels, so no page-level horizontal overflow was present.

### Pre-generated paper names

- The 34 built-in course samples now derive their titles from the real subject and paper component instead of the generation order. For example, the teacher sees `Business Management · Paper 2 — original quantitative case sample` and `Psychology · Paper 3 — original research-methods sample`, not `DigitalDP Example 1/2`.
- The seed migration matches this controlled sample series by subject and level, updates title-only changes even when a paper already belongs to a sitting, and keeps the existing paper IDs. A temporary copy containing two linked sittings retained all 34 IDs and links; a second seed run reported all 34 unchanged.
- The exam-setup selector sorts papers by subject, component, level and title. It adds the paper component when a teacher-created title does not already contain it, so custom papers remain distinguishable without repeating the built-in names.
- Live browser inspection found 35 selectable papers plus the placeholder, zero legacy `DigitalDP Example` labels, the expected Business Management Paper 2/3 choices, and the expected Psychology Paper 1/3 choices. No browser warnings or errors were recorded.

## Verified paper portability

- An explicitly authorized teacher-authored Business Management demonstration exported with `Cache-Control: no-store` as one gzip-compressed `.digitaldp-paper` file and re-imported with the same manifest under a new local paper ID. A legacy teacher-authored paper without the separate attestation returned HTTP 403.
- Four ready-to-import demonstrations are under `examples/portable/`: SL prose choice, SL/HL mixed data and ink, HL Language B listening, and SL/HL Business Management.
- The browser demo's 269,576-byte original listening MP3 exported and re-imported byte-for-byte. A separate 4,000,000-byte WAV test fixture verifies the larger-file Base64 path that exposed the earlier whole-string validation failure.
- Portable compression and decompression now run asynchronously, with smaller prototype-specific file and expanded-size limits.
- Uploaded PDF, PNG, JPEG, WebP, MP3, M4A, Ogg, and WAV files receive basic signature checks. HTML bytes falsely labelled as a PDF are rejected.
- Server-side export requires both an eligible `teacher-authored` or `school-authorized` classification and the separate export attestation. Official-reference and unknown/local-only papers remain on their installation, and the library shows their source classification.
- New papers default to unknown/local-only. Even a teacher-authored or school-authorized classification remains non-exportable until the teacher separately confirms that the paper and every attachment may be copied into a portable file.
- Normal upload and portable-export limits are aligned at 40 MB per asset and 64 MB total, so an accepted paper does not later become unexpectedly non-portable.
- Portable bundles are ignored globally by Git; only the four reviewed, original demonstration bundles are explicitly allowlisted.
- Portable files contain a manifest and referenced assets only. They do not contain teacher credentials, classes, students, sessions, responses, database IDs, or filesystem paths.

## Verified candidate and teacher flow

### Sign-in and print availability

- Demo student sign-in is deliberately class code plus a roster-name selection; it has no student PIN. This is suitable only for supervised fake-data demonstrations because anyone with the class code can select a listed name.
- The teacher print action invokes the browser's native print dialog synchronously. A PDF is created when the teacher chooses **Save as PDF** there; the ChatGPT in-app browser does not expose that dialog, so printing must be done in Chrome, Safari, or another full browser.

### Mathematics working paper

1. Created a class and candidate with five minutes of extra writing time.
2. Started a combined-level mathematics paper with five minutes of reading time.
3. Signed in through the student browser and confirmed both response areas were locked during reading time.
4. Advanced the test clock past reading time and confirmed the working canvas and short-response area unlocked. The displayed writing time included the candidate's extra time.
5. Entered calculus working through the canvas's typed accessibility alternative, entered a two-line short response, checked the response summary, and submitted.
6. Opened the candidate record as the teacher. The ink alternative and line breaks were preserved.
7. Generated a one-page candidate PDF, checked it with `qpdf --check`, extracted its text with `pdftotext -layout`, and visually inspected its rasterized page. Questions, marks, timing, candidate identity, instructions, and both responses were readable and aligned.

### Essay-choice paper

1. Imported the original SL prose demonstration and selected Question 2 as the candidate.
2. Entered a rich-text response containing paragraphs and a two-column table, then submitted.
3. The teacher record showed `Selected prompt: Question 2`, labelled Question 1 as `Not selected by candidate`, and marked Question 2 as the selected prompt.
4. The shared prose source printed once as a paper resource instead of repeating under each prompt.
5. The rich-text table retained visible cell borders in the teacher view and PDF.
6. The three-page PDF passed `qpdf --check`; extracted text and a rasterized final page showed the source, both prompt states, selected response, marks, candidate code, and page footer.

### Listening paper

- The original 89.7-second WAV and all six questions imported successfully.
- A live candidate flow allowed two plays and rejected a third with HTTP 409.
- All six responses were saved and submitted, and the teacher results endpoint returned the submitted candidate.

### Second-screen examination clock

- The Exams section exposed a general countdown launcher and a per-session link that opened the selected clock in a new tab with the same teacher session.
- A live exam supplied the title, class, subject, level, paper, exact server start (including seconds), five-minute reading period, and 75-minute writing period without manual re-entry.
- Display-only edits changed title, start, reading, and writing values while the SQLite session start remained unchanged.
- A future zero-reading custom clock said `Writing starts`; a separate custom clock entered the reading phase and counted to the writing boundary.
- A draft session displayed `Ready to start`, `--:--:--`, and no invented schedule. Starting it through the teacher API synchronized the popout over the admin WebSocket and immediately began reading time.
- An early manual end synchronized the saved clock to `Exam ended` using the actual end time. When the teacher had deliberately adjusted the display, the same lifecycle update preserved the override and clearly reported that the saved exam had ended.
- A missing session link rendered `Exam not found` instead of silently choosing another exam. Signing out visibly marked the retained clock as unsynchronized and exposed a sign-in action.
- A student session could not read `/api/admin/state`, so a session UUID alone does not authorize clock data.
- At 1920×1080 and 1280×960, the clock had no page-level horizontal overflow. Controls could be hidden for a distance-readable display; fullscreen entry and exit worked. A long mixed Japanese/Korean title also remained within the 1280-pixel display width.
- The large number is not an ARIA live region; only phase transitions are announced.

## Original sample assessments

Each sample includes a simulated submission and a teacher-created classroom assessment under its `teacher-materials/` directory:

| Sample | Result | Focus |
| --- | ---: | --- |
| SL prose choose-one | 17/20 | Interpretation, analysis, organization, language |
| SL/HL mixed data | 9/12 | Selection, controlled variables, calculation/chart/recommendation |
| HL Language B listening | 7/10 | Detail retrieval and synthesis from the original recording |
| Business quantitative | 17/18 | Break-even working, qualitative factor, justified recommendation |

These scores use local sample rubrics. DigitalDP does not yet provide a teacher marking or annotation interface, and none of the results should be read as an official IB grade or boundary.

## Automated checks

- `bun run check`: passed
- `bun test`: 178 passed, 0 failed
- `bun examples/validate.ts`: all four packages and simulated submissions passed
- `bun examples/build-portable.ts`: all four portable files rebuilt and round-tripped
- `git diff --check`: passed
- Live security probe: a forged non-loopback `Host` and matching `Origin` received HTTP 421, while the expected loopback authority authenticated and loaded admin state normally.

## Remaining gates

- Run the still-open real second-device test on the actual school Wi-Fi/VLAN and managed browser configuration. The packaged-release LAN smoke test (student HTTP 200, `/admin` HTTP 403) verifies host policy, not peer-to-peer reachability through school infrastructure.
- Keep the prototype on a trusted, non-sensitive demonstration network. Wider network or shared-server use requires real password management, TLS or a trusted proxy, and coherent workspace tenancy.
- The current library is shared within one installation. The recommended later model is personal-by-default papers with explicit workspace sharing, implemented together with ownership boundaries for classes, assets, sessions, responses, and live updates.
- The CSS requests A4 paper, but the automated browser PDF command imposed Letter size. Confirm A4 in the real browser print dialogue on the school machines before a print pilot.
- Test real stylus hardware, managed browsers, reconnects, concurrent candidates, 200% browser zoom, long answers, CJK font availability, images, and multi-page ink before classroom use.
- The four demonstrations are product-behaviour examples. Continue checking live course guides and current specimen materials before treating any preset as exam-accurate.
