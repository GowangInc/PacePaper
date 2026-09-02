# DigitalDP user guide

This guide applies to the `0.1.0-demo.1` standalone classroom demo. DigitalDP is an independent tool for supervised IB-style examination familiarisation. It is not the IB Digital Examination System and is not affiliated with or endorsed by the International Baccalaureate.

## Before you begin

DigitalDP runs on one teacher computer and opens in its normal web browser. The teacher computer stores the classes, papers, attachments, sittings, and responses. Student devices connect to that computer over the local school network.

This demo has important limits:

- The only teacher login is `admin` / `admin`. It is reset to those credentials whenever the app starts.
- Students enter a class code and choose a name from the class list. There is no student PIN.
- Classroom traffic uses ordinary, unencrypted HTTP.
- Data and paper libraries are local to one installation; they are not automatically shared or synchronized with other teachers.
- The app is offline and makes no telemetry, activation, licensing, or other Internet call.
- A fresh standalone bundle contains no existing database, paper library, responses, or IB/reference papers. Create papers or import only material the school is permitted to use.
- The release is unsigned. It is intended for internal demonstrations with fake candidates and approved, non-sensitive practice material—not high-stakes assessment.

## Ten-minute quick start

1. Download and fully extract the correct DigitalDP release for the teacher computer.
2. Start `DigitalDP.app`, `DigitalDP.exe`, or `DigitalDP`. The teacher dashboard should open automatically.
3. Sign in with username `admin` and password `admin`.
4. Under **Classroom sharing**, select the private network address students can reach and choose **Apply classroom sharing**.
5. Under **Classes and candidates**, create a class and add its students.
6. Build or import a paper under **Paper library**.
7. Under **Exams**, choose the class and paper, then select **Set up exam**.
8. Give students the displayed **Student sign-in** URL and the class code. They choose their name, select the exam, and enter its waiting room.
9. Optionally select **Open clock ↗** for a projector or second screen, then choose **Start exam** on the dashboard.
10. After submission, choose **View submissions**, then **Print or save PDF**.

## Install and start DigitalDP

DigitalDP is distributed as a portable archive, not an installer. Bun, Node.js, source code, and an Internet connection are not needed after download.

| Computer | Download | Start the app |
| --- | --- | --- |
| Apple-silicon or Intel Mac | `DigitalDP-*-macos-universal.zip` | Extract the ZIP, then open `DigitalDP.app`. Moving the app to Applications is optional. |
| Windows x64 | `DigitalDP-*-windows-x64.zip` | Extract the ZIP, then open `DigitalDP.exe`. |
| Linux x64 using glibc | `DigitalDP-*-linux-x64.tar.gz` | Extract the archive, make `DigitalDP` executable if needed, then run it. |

On Linux, the terminal commands are:

```sh
chmod +x DigitalDP
./DigitalDP
```

Extract the complete archive before starting it; do not run the app from inside the downloaded archive. Each bundle also contains `README.txt` with release-specific notes.

The first launch may show an operating-system warning because the demo is unsigned:

- On macOS, Control-click `DigitalDP.app`, choose **Open**, and confirm the prompt.
- On Windows, SmartScreen may appear. Continue only if the file came from the private DigitalDP release and doing so complies with school policy.

DigitalDP opens the teacher dashboard on the first available local port from `9148` through `9158`. The address normally resembles `http://127.0.0.1:9148/admin`, but the port can change when another local program or development server occupies the usual port. Use the address that DigitalDP opens.

Run only one packaged DigitalDP copy for each operating-system user and data folder. Two copies would share the same classroom database while maintaining separate live-connection state. If DigitalDP was opened twice accidentally, close the newer or extra process before continuing.

> Opening `public/index.html` or another file with a `file://` address will not work. DigitalDP must be running, and the page must be opened through its `http://127.0.0.1:…` address.

Closing a browser tab does not necessarily stop the DigitalDP server. Stop or quit the DigitalDP process before backing up its data or replacing a running copy.

## Teacher sign-in and classroom sharing

Sign in on the teacher computer with:

- Username: `admin`
- Password: `admin`

Only the teacher computer can open teacher administration pages. Restarting the app signs the teacher out and restores the demo credentials, but it does not erase classes, papers, or responses.

### Let students connect

The standalone app starts in **This computer only** mode every time it launches. No command-line setup or environment variable is required.

1. Open **Classroom sharing** on the dashboard.
2. Select the private IPv4 address for the classroom network. It will usually begin with `10.`, `172.16`–`172.31`, or `192.168.`.
3. Choose **Apply classroom sharing**.
4. Use **Copy URL** beside **Student sign-in**, or copy the same URL from the examination clock.
5. Test that exact URL on one real student device before the session.

Choose **This computer only**, then **Apply classroom sharing**, to stop access from other devices. The preferred address is remembered, but sharing still begins disabled after each launch. Sharing cannot be changed while any exam is live; end the live exam first.

> **Do not quit or restart DigitalDP during a live network exam.** Classroom sharing starts disabled after every launch, and it cannot be turned back on while that sitting is still live.

## Create classes and candidates

Open **Classes and candidates**.

### Create a class

Enter a **Class name** and **Class code**, then choose **Create class**. The class code must contain 4–24 letters, numbers, or hyphens. Codes are stored in uppercase.

Use a code that is easy to read aloud but not easily confused with another class. If the class name and code are identical, the dashboard labels it as the login code instead of repeating the same text.

### Add and update students

Choose the class, enter the **Student name**, **Candidate code**, and any **Extra time in minutes**, then select **Add student**.

- Candidate codes contain 2–32 letters, numbers, or hyphens and are stored in uppercase.
- Extra time can be 0–180 minutes. It is added to writing time only, not reading time.
- Students do not type their candidate code in this demo. They use the class code and choose their name from the roster.
- Select **Edit** beside a student to change their display name, candidate code, or extra time.

Finalize the roster before choosing **Start exam**. DigitalDP creates candidate response records for the active students at that moment; a student added after the start is not added to that live sitting.

### Remove or restore records

**Remove** is reversible: it archives the class, student, or sitting instead of deleting saved work. Expand **Removed classes and students** or **Removed exam sittings** and select **Restore** when needed.

- A removed student cannot sign in.
- A removed class cannot be used for a new sitting.
- Previous responses remain available after removal.
- A class with a live exam cannot be removed until the exam ends.
- A student with unfinished work in a live exam cannot be removed until they submit or the teacher ends the exam.

## Build and manage papers

The **Paper library** belongs to this installation and operating-system user. A paper can be reused for any number of classes and sittings. Copying DigitalDP to another computer does not copy its library.

### Create a paper with Paper Builder

Under **Paper Builder**, work through the numbered sections:

1. Under **Choose the exam**, select the **Assessment session**, **Course**, **Level**, and **Paper**. `SL`, `HL`, and combined `SL/HL` are available where the selected course supports them.
2. Review and edit the generated **Practice paper title**, **Paper name**, **Reading time in minutes**, **Writing time in minutes**, **Maximum marks**, and **Student instructions**.
3. Record the **Question/source rights status**.
4. Add paper-wide material and the source text, when appropriate.
5. Under **Questions and student entry areas**, add, remove, or reorder questions and choose an entry area for each.
6. Check the independently scrollable **Paper preview** as you work.
7. Choose **Save paper to library**.

Changing the assessment session, course, level, or paper selector clears the questions and attachments already entered in the builder. Make those choices before authoring the paper.

The generated exam settings are useful starting points, not a guarantee that a future or local examination specification is correct. Check the applicable current course guide before assigning a paper. A combined `SL/HL` paper uses one shared timer and response rule, so review every generated default.

### Choose student entry areas

Each question can use one of four entry areas:

- **Long typed response**, with optional minimum and maximum word counts
- **Short typed response**
- **Multiple-choice**, with one answer choice per line
- **Digital working canvas**

For a digital canvas, the teacher chooses 1–4 initial pages and a **Default canvas background** of **Blank**, **Ruled**, or **Square grid**. Students can add pages during the exam, up to 12 pages for that question. They can change the background after confirming that they are overriding the teacher default; their existing writing remains in place. A typed-working alternative is also available.

### Attach PDFs, images, and audio

Use the right attachment level:

- **Paper-wide PDFs**, **Source text**, and **Listening audio** are available throughout the paper.
- **Question media** is shown with that individual question. Attach images or PDFs there; listening papers can also accept question-specific audio.
- Images appear inline in the teacher's printed response. PDFs and audio are identified as companion resources in the printout.

For listening papers, at least one audio recording is required. Every recording permits exactly two complete listens. See [Student audio](#student-audio) before running a listening trial.

An individual asset can be at most 40 MB, and all assets in one paper can total at most 64 MB. Use distinct filenames for every attachment in a paper.

### Export, import, and share a paper

A portable `.digitaldp-paper` file contains the paper definition and every attachment permitted for export.

To make **Export** available, the paper must be classified as **Teacher-authored** or **School-authorized or licensed**, and the teacher must tick the separate statement confirming that the paper and every attachment may be copied. Classification alone does not grant permission. Restricted, uncertain, and reference-only papers remain local.

To move an eligible paper:

1. Select **Export** beside it in the Paper library.
2. Move the downloaded `.digitaldp-paper` file through an approved school channel.
3. On the other DigitalDP installation, use **Import a saved paper** and choose **Import paper**.

Import creates a new local paper. It does not merge classes, students, sittings, or responses. The **Advanced** import panels are intended for prepared `paper.json` packages and developer-managed manifests; most teachers should use the single-file format.

## Set up and run an exam

### Create a sitting

Under **Exams**, use **Set up an exam**:

1. Choose the **Class**.
2. Choose the **Paper** from the local library.
3. Select **Set up exam**.

This creates a new draft sitting; it does not alter the library paper. Reuse the same paper to create another sitting, even for the same class. Students select the exact sitting from their examination list, so an earlier completed sitting does not block a new one.

Students can enter the new sitting's waiting room while its status is **Ready to start**. Ask candidates to confirm that their screen names the correct paper before starting; the dashboard's online indicator does not prove which sitting a candidate selected.

### Use the examination clock

Select **Open clock ↗** beside a sitting, or **Open countdown display ↗** at the top of the Exams section. The clock opens in a new tab suitable for a projector or second screen.

The controls allow the teacher to:

- Choose a draft, live, or recent exam—or use **Custom countdown**.
- Edit the display title, details, student names, start date and time, reading minutes, and writing minutes.
- Choose **Apply to display**, **Reload exam defaults**, **Hide controls**, or **Enter fullscreen**.

The clock defaults to the selected or ongoing exam and shows the student connection URL. Student names on the clock are always editable display text; changing them does not change the class roster. Likewise, display timing adjustments do not alter the authoritative timers on student devices. Start and end the actual sitting from the teacher dashboard.

### Start, monitor, and end

1. Choose **Start exam** on the teacher dashboard. Student waiting rooms open automatically.
2. During a separate reading period, students can review the supplied materials and questions, but answer areas, Notepad, Response summary, Submit, and the app's highlighter remain locked. Reading time runs before writing time and receives no candidate extra-time adjustment.
3. Monitor the submitted and online counts on the dashboard. The page uses live updates; brief **Reconnecting** messages should recover without refreshing the whole form.
4. Students can submit early. At each candidate's deadline, DigitalDP automatically submits the current response while connected. If the device is disconnected, only the last response saved to the teacher computer is guaranteed.
5. To finish the sitting for everyone, choose **End exam**. This ends the sitting and submits every remaining response.

> **Extra-time candidates:** do not choose **End exam** merely because the standard room clock has reached zero. Their individual writing timers continue. Leave the sitting live until every extra-time candidate has submitted, unless you deliberately intend to end and submit their work early.

## Student instructions

### Join and choose an exam

1. Open the exact **Student sign-in** URL supplied by the teacher. On another device it must contain the teacher computer's private network address—not `localhost` or `127.0.0.1`.
2. Enter the **Class code** and choose **Load names**.
3. Select your own name, then choose **Continue**.
4. Under **Choose your examination**, select **Join waiting room** for the paper named by the teacher. If it is already live, select **Enter exam**.
5. Keep the page open. The exam opens automatically when the teacher starts it.

Before the teacher starts the sitting, use **Choose a different exam** if the wrong waiting room was selected. Ended and submitted sittings remain labelled separately from new sittings.

### Work in the exam

Questions and their response areas appear in the right pane; the resources currently linked to that question appear in the left pane. Students can drag the divider, zoom either pane, reopen **Instructions**, flag a question, and use **View summary** to check completion.

Other tools include:

- During writing time, select text in the instructions, a question, an answer choice, or an entered source-text passage; then open **Highlight** and choose a colour. The app highlighter does not mark text inside an embedded PDF or image. Highlights are stored only in that student's exam browser, are discarded after submission, and do not appear in the teacher PDF.
- Use **Notepad** for rough notes. Notes are saved separately and included in the teacher PDF.
- Select the timer to cycle between remaining time, elapsed time, and a hidden timer.
- Use **Accessibility** to change text size, contrast, typeface, and spacing.

Responses save automatically and DigitalDP keeps a local recovery copy in the browser. Keep the exam tab open and watch the save status, especially after a network interruption.

### Draw or show working

In a **Digital working canvas** response:

- Choose **Draw** or **Eraser**, then use a pen, touch, or mouse.
- Use **Undo**, **Redo**, or **Clear page** as needed.
- Select **Add page** for more working space, up to 12 pages for the question.
- Choose **Blank**, **Ruled**, or **Square grid** under **Canvas background**. Changing away from the teacher default requires confirmation and does not erase strokes.
- Use **Typed working (alternative to drawing)** when required for accessibility.

### Student audio

Each recording can be listened to completely twice:

1. Choose **Start first listen** only when ready.
2. Once playback begins, it cannot be paused, restarted, moved forwards, or played at another speed. Volume remains adjustable.
3. After the recording finishes, **Start final listen** becomes available.
4. If the browser interrupts playback, choose **Continue**. It resumes the same listen and does not consume an additional one.

The complete audio file is prepared before playback starts. Keep the device connected and do not close or reload the exam during a listen. A student cannot submit while a recording is playing.

### Submit

Use **Submit** at the top of the exam or **Submit examination** at the bottom. Check **Response summary**, then confirm **Submit now**. Submission is final and the response cannot be changed afterwards.

If writing time expires, or the teacher chooses **End exam**, DigitalDP submits the last saved response automatically.

## Review responses and create PDFs

For a live or ended sitting, choose **View submissions**. Expand a candidate to review their paper.

- **Print this candidate** opens the browser print dialog for one candidate.
- **Print or save PDF** prints the only candidate when there is one.
- **Print all or save PDF** combines the class responses when there are several.

In the system print dialog, choose the normal printer or **Save as PDF**. The printable record includes candidate details, paper instructions, questions, marks, student responses, canvas pages, inline images, and the candidate notepad. PDF and audio resources are listed as supplied companion material; the pages of an attached PDF are not embedded in the response PDF. Put the complete printable wording in each **Question or prompt** field. Internal source-rights status is not printed.

Use a normal current browser such as Chrome, Edge, or Safari for PDF output. Embedded in-app browsers may ignore the operating system's print request. If nothing happens, reopen the teacher dashboard in a normal browser at the same local address and try again.

The current demo provides response review and printing, but no teacher marking, annotation, or gradebook interface. Record assessment feedback separately.

## Data, updates, and backups

The executable and the classroom data are stored separately. Replacing the app with a newer version should leave the data intact when the same operating-system user and data location are used, but always back up before updating.

Default data folders:

| Platform | Data folder |
| --- | --- |
| macOS | `~/Library/Application Support/DigitalDP/` |
| Windows | `%LOCALAPPDATA%\DigitalDP\` |
| Linux | `$XDG_DATA_HOME/DigitalDP/`, or `~/.local/share/DigitalDP/` when `XDG_DATA_HOME` is not set |

The SQLite database inside this folder contains papers, permitted attachments, rosters, sittings, and responses. To make a safe backup:

1. Finish or end any live exam.
2. Stop DigitalDP completely. Closing the browser tab alone is not sufficient.
3. Copy the entire `DigitalDP` data folder to approved encrypted school storage.
4. Keep the files together. SQLite may create matching `-wal` and `-shm` files while the app is running.

A `.digitaldp-paper` export is a paper-transfer file, not a complete backup. It does not contain classes or student responses.

## Troubleshooting

### The app does not open

- Confirm that the archive was fully extracted and that the correct platform bundle was downloaded.
- On Mac, use the universal build and try Control-click → **Open**.
- On Windows, check the SmartScreen prompt and school endpoint-security policy.
- Confirm that only one packaged DigitalDP copy is running for this data folder; close any extra process. If ports `9148`–`9158` are all occupied by other programs, the packaged app cannot start.
- If the browser does not open automatically, try `http://127.0.0.1:9148/admin`, then the next ports through `9158`.
- Do not open a `file://` copy of `index.html`.

### Students cannot connect

- Confirm **Classroom sharing is on** and share the currently displayed student URL.
- The student URL must use the teacher computer's private IP address. `localhost` and `127.0.0.1` work only on the teacher computer itself.
- Put teacher and student devices on the same trusted LAN. Guest Wi-Fi, client isolation, or separate school VLANs can block device-to-device connections.
- Allow DigitalDP through the teacher computer's firewall for the private network, if school policy permits.
- If the wrong network was selected, end any live exam before changing **Classroom sharing**.
- Test one actual student device before admitting the class.

### A name or exam is missing

- Recheck the class code, then choose **Refresh names**.
- Confirm that the class and student have not been removed.
- Add students before **Start exam**; additions made afterwards are not part of that live sitting.
- Confirm that the teacher created a new sitting with **Set up exam**. Reusing a library paper does not reuse an old completed response.
- Ask the student to return to **Choose your examination** and select the exact current sitting.

### The page says Connecting or Reconnecting

Wait briefly while the live connection retries. If it persists, confirm that the teacher app is still running, the student device is still on the same network, and the displayed student URL has not changed. Student work is autosaved to the server and also retained locally in the exam browser for recovery.

### A paper will not import or export

- Use **Import a saved paper** for a `.digitaldp-paper` file.
- Ensure the file is not damaged and is smaller than 70 MB.
- Individual attachments cannot exceed 40 MB; all attachments together cannot exceed 64 MB.
- Export appears only for teacher-authored or school-authorized papers with the separate copying attestation selected.
- The current demo does not edit or remove an existing saved library paper. Create and save a corrected paper with a distinctive versioned title; obsolete copies remain listed, so take care when selecting a paper for a sitting.

### Audio will not play

Wait while DigitalDP prepares the complete recording. Keep the network stable. If the browser interrupted a started listen, choose **Continue** rather than starting again. When both complete listens have been used, the recording stays locked.

### The print button does nothing

Use the teacher dashboard in Chrome, Edge, or Safari rather than an embedded app browser. Expand the candidate response, choose the print action again, and select **Save as PDF** in the operating-system print dialog.

## Security and responsible use

- Use fake names and non-sensitive material in this demo.
- Anyone who knows a class code can view that class's active roster and choose a name. Do not treat the current sign-in flow as identity verification.
- LAN traffic is unencrypted HTTP. Use only a trusted private school network.
- Keep the weak `admin` / `admin` account limited to the teacher computer. Teacher pages are deliberately unavailable over the classroom LAN.
- Add only papers and media the school is permitted to use. A rights label records provenance; it does not create a licence.
- Obtain local technical, safeguarding, accessibility, and assessment-policy approval before any classroom pilot.
- Test the complete teacher and student journey—including the actual managed browser, stylus, audio, reconnect behavior, print output, and backup restoration—before relying on it with a class.

For developer startup, build details, and source-only configuration, see the project [README](README.md). For bundle-specific notes, see the [standalone release guide](release/README.md).
