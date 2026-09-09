# PacePaper teacher guide

This step-by-step guide covers the current PacePaper classroom demo. PacePaper runs on one teacher computer. Students use a browser to connect to that computer through the school network. Start with the guide supplied with your app download; an older download may not include features described in a newer guide.

PacePaper is for **practice and candidate familiarisation only**. It does not deliver an official examination. A fresh installation starts with one preloaded **Sample paper** that has no subject, level, or IB branding, so you can try the whole exam workflow before building your own. An older app download does not update itself; use the guide supplied with your version.

## The four parts of the teacher dashboard

Use the left-hand menu to move between these areas:

| Area | What it is for |
| --- | --- |
| **Overview** | Turn classroom sharing on, copy the student address, and check that PacePaper is connected. |
| **Classes** | Create classes, add students, import class lists, and set extra time. |
| **Sessions** | Give a paper to a class, open its clock, start the exam, and review submissions. |
| **Paper library** | Choose an included example, build a paper, or import a saved paper. |

A **paper** is reusable exam content. A **session** is one sitting of that paper with one class. You can use the same paper again without rebuilding it.

Select **User guide** in the teacher sidebar to open these instructions in another tab. The guide also works offline from the HTML file supplied with the app.

The included example has its own teacher-authored markscheme. Keep marking materials separate from candidate copies.

## Quick classroom checklist

Follow this order for a complete practice exam:

1. Start PacePaper and sign in as the teacher.
2. In **Overview**, turn on **Classroom sharing**.
3. Copy the **Student sign-in** address and test it on one student device.
4. In **Classes**, create or import the class and check every student's details.
5. In **Paper library**, choose an included example or create/import a paper. Review its questions, materials, and matching marking guide before the lesson.
6. In **Sessions**, choose the class, exam system, and paper, then select **Set up exam**.
7. Open that session's clock on the second screen.
8. Ask students to sign in, select the exam, and wait.
9. Check that the correct students are present.
10. Select **Start exam**. Reading time begins now, when applicable.
11. Monitor online and submitted counts while students work.
12. After submission, open **View submissions** and select **Print or save PDF**.

The detailed instructions below follow the same order.

## Step 1 — Start PacePaper

PacePaper is a portable app, not an installer. Extract the complete download before opening it.

| Computer | Download | Open |
| --- | --- | --- |
| Apple-silicon or Intel Mac | No Mac app in demo.5; use the source option below | `Start PacePaper.command` |
| Windows x64 | `windows-x64.zip` | `PacePaper.exe` |
| Linux x64 | `linux-x64.tar.gz` | `PacePaper` |

The demo.5 portable downloads are for Windows and Linux. A new Mac app is on hold until it can be signed and notarized by Apple. For a Mac, follow **Run from a source checkout** below, with IT help for the one-time setup.

1. Open PacePaper once on the teacher computer.
2. Leave the application running for the whole lesson.
3. Wait for the teacher dashboard to open in the normal browser.
4. Sign in with username `admin` and password `admin`.

The local address usually looks like `http://127.0.0.1:9148/admin`. It may use a port from `9148` to `9158` if another program is already using the first one.

Do not open `public/index.html` or any `file://` address. Run only one copy of PacePaper at a time.

### Run from a source checkout

This option needs [Bun](https://bun.sh/) installed on the teacher computer. If it is not already installed, ask your IT support to install Bun and run `bun install` once in the PacePaper project folder.

On a Mac:

1. Open the PacePaper project folder.
2. Double-click `Start PacePaper.command`.
3. Leave the Terminal window open.
4. Use the teacher page that opens automatically.
5. When completely finished, press Control-C in the Terminal window to stop PacePaper.

On Windows or Linux, open a terminal in the project folder and run `bun run start:app`. Keep the terminal open and press Control-C there when finished. This also works on a Mac.

Use the page that opens automatically. This launcher includes the example library and the **Classroom sharing** controls described below.

Use only a Mac release whose notes say it is notarized. Earlier `0.1.0-demo.3` and `0.1.0-demo.4` Mac downloads are superseded and may be rejected as damaged.

## Step 2 — Let students connect

PacePaper starts in **This computer only** mode every time it opens.

1. Select **Overview**.
2. Find **Classroom sharing**.
3. Choose the private network used by the teacher and student devices.
4. Select **Apply classroom sharing**.
5. Find the **Student sign-in** address.
6. Select **Copy URL**.
7. Open that exact address on one real student device.
8. Confirm that the PacePaper student sign-in page appears.

Do this test before students begin. `localhost` and `127.0.0.1` work only on the teacher computer.

The **Student sign-in** address on the dashboard and on the examination clock is always the private-network address that student devices open — it never shows `127.0.0.1` or `localhost`. If classroom sharing is off, the examination clock still shows the network address but warns that students cannot connect until sharing is applied.

The teacher and students must be on a network that allows their devices to communicate. Guest Wi-Fi, different school networks, or network isolation may block access.

Classroom sharing cannot be changed while any examination is live. Do not quit or restart PacePaper during an exam.

## Step 3 — Prepare the class

Select **Classes**. Add students one at a time or import a prepared CSV class list.

### Option A — Add students manually

1. Under **Create class**, enter a clear **Class name**.
2. Enter a short **Class code** using at least four letters, numbers, or hyphens.
3. Select **Create class**.
4. Under **Add student**, select the class.
5. Enter the student's **Student name** and **Candidate code**.
6. Enter **Extra time in minutes**, or leave it at `0`.
7. Select **Add student**.
8. Repeat for the rest of the class.
9. Check the class list before moving on.

Select **Edit** beside a student to change their name, candidate code, or extra time. Select **Save changes** when finished.

### Option B — Import a class list

1. Select **Download blank template**.
2. Open the CSV file in Excel, Numbers, or Google Sheets.
3. Add one row for each student.
4. Repeat the class name and class code on every student row.
5. Enter `0` in `extra_minutes` when a student has no extra time.
6. Save or download the completed sheet as a CSV file.
7. Back in PacePaper, choose the file under **Class-list CSV**.
8. Select **Import class list**.
9. Check the displayed classes and students.

One CSV file may contain several classes. To create an empty class, include one row with the three student fields left blank.

Class codes and candidate codes identify existing records. Importing the same file again updates matching names and extra time and adds missing students. It does not remove students. Restore a removed class or student before importing a row with the same code.

Select **Export active classes** to save the current active rosters as CSV. Store exported files securely because they contain student names.

### Check before starting

Add or edit every candidate before selecting **Start exam**. PacePaper creates the candidate responses from the active class list when the exam starts. Students added afterwards are not added to that live sitting. Avoid changing extra time during a live exam.

## Step 4 — Choose or create the paper

Select **Paper library**, the final dashboard section. A fresh standalone installation includes one preloaded **Sample paper**:

- **Sample paper** — three original texts with short-answer and multiple-choice questions across a reading period, showing the main question styles and the student reader experience. It carries no subject, level, or IB branding.

You can build or import other papers for your own approved practice materials. An installation with past sessions may also show papers labelled **earlier demo version**. Choose the current version for a new session; the earlier one remains available with its previous work.

### Use an included example

1. In **Paper library**, choose an **Exam system** to narrow the list, or leave **All exam systems** selected.
2. Use **Find a paper** to search by subject, paper number, level, or title.
3. Read the full paper title and paper number.
4. Confirm the displayed level or tier, such as **SL**, **HL**, **Core**, **Extended**, **Foundation**, **Higher**, or **AP**.
5. For a full-length mock, open **Mock marking guides** and review the guide with the matching paper title and tier.
6. Use that paper when setting up the session in Step 5.

Read the label in each title before using an example:

- **Full-length mock** provides a complete original question workload with the researched timing and mark allocation. Review the questions and worked marking guide before use.
- **Full-format practice** identifies an IB-oriented example following the researched paper structure, timing, and allocated marks. The questions still need a subject teacher's review for suitability and difficulty.
- **Format rehearsal** demonstrates the type of paper and still needs subject-language review.
- **Walkthrough** uses short timings to demonstrate section changes, breaks, and submission in a few minutes.

Full-length does not mean official or difficulty-calibrated. No awarding body has approved these papers, and no official grade boundaries are supplied. Have your subject team check the questions, materials, difficulty, and marking before using a mock with a class.

### Build a new paper

1. Find **Paper Builder** in the Paper library area.
2. Under **Choose the exact exam format**, select the **Exam system**.
3. Select the assessment session or profile year.
4. Select the course, syllabus, or qualification.
5. Select the level or tier when the chosen system uses one.
6. Select the exact paper, component, or delivery format.
7. Read the **practice profile**, timing facts, tool rules, and teacher guidance that appear.
8. Check the **Practice paper title** and **Paper name**.
9. Check the **Reading time**, **Writing time**, and **Maximum marks**.
10. Add clear **Student instructions**.
11. Add the first question under **Questions and student entry areas**.
12. Enter the complete question wording and its marks.
13. Choose one of the response areas offered for that exam format.
14. Attach any image, PDF, or audio required only for that question.
15. Repeat for the remaining questions.
16. Scroll through **Paper preview** and check the full student view.
17. Confirm that the marks a student can earn match **Maximum marks**. For a choose-one paper, count the selected question rather than adding all alternatives together.
18. Select **Save paper to library**.
19. Confirm that the paper appears in the **Paper library** with the correct exam-system name.

Choose the exam type before entering questions. If you change format, PacePaper asks first and keeps the old paper as a recoverable draft in this browser, including attachments. Select **Recover an unfinished paper**, choose the draft, then **Restore draft**. **Undo question removal** restores the last removed question and its attachments.

Wait for **Draft saved in this browser** before closing the page. Drafts belong to this browser and this PacePaper address; they are not in the shared paper library or a database backup. Use **Save paper to library**, then export the paper, when you want to keep or move it. If draft storage fails, keep the page open and save to the library; format changes and sign-out are blocked to protect the draft.

For papers with fixed timed sections, the reading and total-time fields are read-only. Editing the instructions, title or marks keeps the sections and breaks intact. Choose a custom format if you need a different schedule.

The selected profile changes the terminology, timing, marks, materials, suggested question cards, available response areas, delivery description, phase plan, and tool guidance. For an AP paper, assign every question to the correct section or part using the field shown on its question card. PacePaper then locks earlier sections, blocks entry during explicitly locked phases and the monitored break, and changes the displayed calculator/material rule for each part. AP English's optional 15-minute reading period remains inside its writable 135-minute free-response phase; it is not a separate lock.

The AP profiles target **May 2027** and remain visibly marked **Adapted practice**. PacePaper currently uses one fixed classroom break timer that advances automatically; the official digital application waits for each candidate to select **Resume Testing** after the break timer. AP hybrid free-response practice should use a physical response booklet when closest format rehearsal is required. PacePaper does not include an exam calculator: supply the type shown for that paper and section. Check the current official course guide, specification, and session instructions before a full mock exam.

### Add paper materials

- Add paper-wide PDFs, source text, or listening audio under **Details and student materials**.
- When building your own paper, attach any reference document required by the selected preset, such as a mathematics formula sheet or the AP Biology equations and formulas sheet.
- The included full mathematics mocks supply independently typeset formula facts. For every included paper, read **Before you start** and supply any further permitted calculator, equipment, or materials listed there.
- Add an image, PDF, or audio file to an individual question when only that question needs it.
- Enter the complete question wording in **Question or prompt**. Attached PDF pages are not copied into the printed candidate response automatically.
- Images appear with the response when printed. PDFs and audio are listed as companion material.
- Listening audio allows two complete listens. Students cannot pause, restart, seek, or change speed after a listen begins.
- For a canvas question, choose its starting page count and default background: **Blank**, **Ruled**, or **Square grid**.
- Students can draw, erase, undo, redo, add pages, and change the background. PacePaper warns them before changing the teacher's default.

### Export or import a paper

To move a teacher-created paper to another PacePaper installation:

1. Find the paper in the library.
2. Select **Export** to save one `.digitaldp-paper` file.
3. On the other installation, open **Paper library**.
4. Under **Import a saved paper**, choose the file.
5. Select **Import paper**.
6. Confirm that it appears in the Paper library.

The paper file contains its questions, settings, and permitted attachments. It does not contain classes, students, exam sessions, responses, or the teacher-only mock marking guide.

## Step 5 — Set up the exam session

Select **Sessions**.

1. Under **Set up an exam**, choose the **Class**.
2. Choose the **Exam system**.
3. Choose the **Paper**. Only papers from the chosen system are shown.
4. Read **Before you start**. Check the number of question cards, marks, timing, instructions, and any calculator or materials requirements.
5. Select **Set up exam**.
6. Find the new session in the list.
7. Confirm that it says **Ready to start**.

Setting up a session does not start its clock. It only makes the exam available for that class to choose and wait for.

One question card may contain several parts. Choose a **full-length mock** for a complete non-IB question workload, or a **walkthrough** for a short AP demonstration. Check the questions and timing before students join.

You may set up several sessions in advance. Different classes can take different exams at the same time. One class can have only one live session at a time.

## Step 6 — Open the examination clock

1. Find the correct session.
2. Select its **Open clock ↗** link.
3. Move the new tab or window to the projector or second screen.
4. Check the paper, class, start time, reading time, and writing time.
5. Edit the displayed student names if needed.
6. Confirm that the student sign-in address is visible.

For a simple paper with one reading period and one writing period (no fixed timed sections), changing **Reading minutes** or **Writing minutes** and selecting **Save exam timing and update display** saves the configured minutes for that sitting. For example, `0.1` reading minutes is six seconds. You can make this change while the exam is ready or after it has started: saving during a live exam moves the reading/writing boundary and the deadline immediately for every candidate, which is the fastest way to correct a mistaken duration. Check the saved confirmation and the session's timing on the teacher dashboard.

The display title, details and student-name list stay local to that clock window. Linked clocks always follow the saved exam start, duration and sections, including changes saved in another window. The start date is read-only; **Start exam** on the teacher dashboard controls the start. An exam that has ended can no longer change its saved timing.

**Fixed timed sections stay read-only.** If the paper uses a fixed multi-phase schedule of sections and breaks, the clock's timing fields are disabled; use the Paper Builder to prepare a paper with a different schedule. Candidate-specific extra time remains separate from the standard room clock.

If another window changes the timing while you are editing, saving shows a conflict message. Select **Reload exam defaults**, review the updated times, then make your change again. A temporary **Custom countdown** is separate from student exams and is not saved after refresh.

For simultaneous exams, open the clock from each specific session row. A clock opened without a chosen session prefers an ongoing exam, so always check its paper and class before projecting it.

The clock remains on **Ready to start** until the teacher selects **Start exam**. Reading time does not count down while students are joining.

## Step 7 — Ask students to join

Give students the **Student sign-in** address and the class code.

Ask each student to:

1. Open the exact address supplied by the teacher.
2. Enter the **Class code**.
3. Select **Load names**.
4. Choose their own name.
5. Select **Continue**.
6. Under **Choose your examination**, find the correct paper.
7. Select **Join waiting room**.
8. Check the paper title and wait for the teacher.

Ask students to confirm that the correct paper title appears in their waiting room. In **Classes**, connected students should show as **online**.

## Step 8 — Start and monitor the exam

1. Return to the correct session on the teacher dashboard.
2. Check the class and paper title one last time.
3. Select **Start exam**.
4. Confirm that the clock changes from ready to reading or writing time.
5. For a sectioned paper, confirm that the clock shows the current section, permitted tools, next transition, and full room schedule.
6. During reading time or a monitored break, confirm that student response areas remain locked.
7. On a reading paper, confirm that students can still open every text, read every question, and inspect every answer option. Reading time locks entry, not inspection.
8. At a section boundary, confirm that the previous section disappears and the next section's questions and tool rule appear.
9. During working time, monitor the **online** and **submitted** counts.
10. Let candidates with extra time continue until their individual time ends.

If a student's page says **Reconnecting**, keep the page open. Check that PacePaper is still running and that both devices remain on the same network.

Students normally finish by selecting **Submit** or **Submit examination**, checking their response summary, and selecting **Submit now**. Submission is final. PacePaper submits automatically when a student's time expires.

Select **End exam** only when the entire sitting must finish. A confirmation names the paper, class and students who have not submitted. Select **Keep exam running** to cancel, or **End exam and submit remaining responses** to finish. Confirming submits their last saved responses, including students who still have extra time. This cannot be undone.

### If a student's work is not saving

1. **Saved to server** means the teacher's computer has the latest response.
2. **Saved on this device** means a browser recovery copy exists, but the server has not confirmed the latest response. Keep the page open and select **Retry save**.
3. **Not saved** means the latest changes are not confirmed safe. Keep the page open, tell the teacher and select **Download recovery copy**. Check that the download completed.
4. Restore the connection and select **Retry save**. Wait for **Saved to server**.

The recovery JSON file includes typed answers, canvas data and notes. It is an emergency copy for the teacher, not a submission or a paper import. If the teacher ends the exam before pending work is confirmed saved, the student page offers the recovery download again. Do not clear browser data, close the app, or rely on recovery after a browser crash.

## Step 9 — Review and save candidate papers

1. Find the session on the teacher dashboard.
2. Select **View submissions**.
3. Open a candidate and check the saved response.
4. Select **Print this candidate** for one student, or **Print all or save PDF** for the group.
5. In the browser print window, choose a printer or **Save as PDF**.
6. Open the saved PDF and check it before closing PacePaper.

The printable record includes questions, typed responses, canvas pages, inline images, and the student's notepad. PDFs and audio used as companion materials are listed rather than reproduced inside the response paper.

Use a normal browser such as Chrome, Edge, or Safari. An in-app browser may ignore the print button.

PacePaper currently collects, reviews, and prints responses. It does not mark or grade them.

### Mark an included full-length mock

1. Select **Mock marking guides** in the teacher sidebar.
2. Choose the guide matching the paper title, component, and tier.
3. Compare each saved answer with its worked solution and point allocation.
4. Apply your subject team's judgement to alternative valid answers.

For AP papers, follow the guide's weighted practice calculation. The raw total shown on a paper is not an AP score, and the guides do not convert results into official 1–5 grades.

The guides require teacher sign-in when opened through the app. A source checkout also has an offline index at `docs/mock-marking/index.html`. Keep those answer-containing files private; do not send them to students. The exported `.digitaldp-paper` contains no teacher marking guide.

### Review the timed AP walkthroughs

Use these short included papers when demonstrating the phase engine:

1. Choose an AP paper whose title ends in **walkthrough**.
2. Set up a session with a small demo class.
3. Open its clock on a second screen.
4. Join as a demo student in another browser.
5. Start the exam and watch each one-minute or short phase change.
6. Confirm that working sections accept only their own questions, the break hides examination content, calculator rules change where applicable, and only the final work section offers final submission.

The walkthroughs deliberately compress the timing and workload. Each of these three AP courses also has a **full-length mock** with a complete original question set and the researched section durations. Choose that paper for a full practice sitting, after reviewing its questions and teacher marking guide.

## After the exam

### Remove or restore items

**Remove** hides a class, student, or exam session without deleting earlier responses. Removed students cannot sign in, and removed classes cannot be used for new sessions.

1. Select **Remove** beside the item.
2. Read the confirmation message.
3. Confirm only after checking the name or session.
4. To bring it back, open the appropriate **Removed** section and select **Restore**.

A live session cannot be removed. A class with a live session must be ended first. A student with unfinished live work cannot be removed until that response is submitted or the session ends.

### Back up all classroom data

Class-list and paper exports are not complete backups.

1. Finish every live exam.
2. Quit PacePaper completely.
3. Copy the entire PacePaper data folder to approved secure storage.

Default data folders:

- Mac: `~/Library/Application Support/PacePaper/`
- Windows: `%LOCALAPPDATA%\PacePaper\`
- Linux: `~/.local/share/PacePaper/`

On a Mac, choose **Go → Go to Folder** in Finder and paste the path above. On Windows, press Windows-R and paste its path. On Linux, paste the path into the file manager's location bar. If IT set a custom data folder, use that folder instead.

These locations apply to the standalone app and `bun run start:app`. The basic development commands `bun run start` and `bun run dev` instead use the project's `data/` folder unless configured otherwise.

Back up the data folder before replacing PacePaper with a newer version. Class-list CSV files move rosters; `.digitaldp-paper` files move individual papers. Only a complete data-folder backup also keeps the sessions and student responses.

### Restore a backup

1. Stop PacePaper completely.
2. Make a separate copy of the current data folder so you can undo the restoration.
3. Replace the data folder's contents with the complete backup.
4. Start PacePaper and check a class, a paper, and a saved response.

Restoring a backup returns the installation to the date of that backup. Later work remains only in the separate copy you made in step 2. If you want to add a roster or paper while keeping current work, use its import option instead.

## Student quick instructions

Teachers may give this section directly to students.

1. Open the address supplied by your teacher.
2. Enter the class code and select **Load names**.
3. Choose your own name and select **Continue**.
4. Choose the correct examination and select **Join waiting room**.
5. Wait for the teacher to start it.
6. Answer in the area below each question. Work saves automatically.
7. Use **Flag** and **View summary** to check unfinished questions.
8. Use the **Notepad** only for rough work. It is included in the teacher's PDF but is separate from your answers.
9. When finished, select **Submit**, check the summary, and select **Submit now**.

During reading time, answer areas remain locked. You can still read the questions and answer choices and switch between the available texts.

You may highlight text shown directly on the PacePaper page. Highlighting does not work inside attached PDFs or images. **Accessibility** controls can change text size, colours, typeface, or spacing without changing the paper.

For a drawing question, use **Draw**, **Eraser**, **Undo**, **Redo**, or **Add page**. You may choose **Blank**, **Ruled**, or **Square grid** under **Canvas background**.

For listening audio, select **Start first listen** only when ready and let it play to the end. After completion, **Start final listen** becomes available.

## Troubleshooting

- **The Mac app says it is damaged:** Do not bypass Gatekeeper. Confirm that the release is notarized. If you are working from a source checkout, use `Start PacePaper.command` from the project folder.
- **The app does not open:** Extract the complete download, use the correct platform file, and close any second copy of PacePaper.
- **Students cannot connect:** Confirm that classroom sharing is on, use the displayed private-network address, and test it on a real student device. Do not give students `localhost` or `127.0.0.1`.
- **A student name is missing:** Check the class code, select **Refresh names**, and confirm that the student is active in the correct class.
- **An exam is missing:** Confirm that the teacher selected **Set up exam**. Ask the student to return to **Choose your examination**.
- **A student is stuck on Connecting or Reconnecting:** Keep the page open. Confirm that PacePaper is running and both devices are still on the same network.
- **The clock is counting the wrong session:** Choose the exam from the clock's session list, or reopen the clock from the correct session row.
- **Clock timing cannot be edited:** Only a ready exam with a simple reading/writing schedule supports timing edits. Live exams and fixed-section papers use the saved schedule. Read Step 6; changing display details never changes student time.
- **The print button does nothing:** Open the teacher dashboard in Chrome, Edge, or Safari, open **View submissions**, and select **Print this candidate** or **Print all or save PDF** again.

## Demo safety

This demonstration uses the weak teacher login `admin` / `admin`. Students use a class code and choose a name; there is no PIN or identity check. Classroom traffic uses unencrypted HTTP.

Use fake candidates, approved practice material, and a trusted private network only. PacePaper is not the official IB Digital Examination System and is not affiliated with or endorsed by the International Baccalaureate.
