# PacePaper teacher guide

This step-by-step guide covers the current PacePaper classroom demo. PacePaper runs on one teacher computer. Students use a browser to connect to that computer through the school network. Start with the guide supplied with your app download; an older download may not include features described in a newer guide.

This guide matches PacePaper **0.1.0-demo.19**.

PacePaper is for **practice and candidate familiarisation only**. It does not deliver an official examination. A fresh installation starts with one preloaded **Sample paper** that has no subject, level, or IB branding, so you can try the whole exam workflow before building your own. An older app download does not update itself; use the guide supplied with your version.

## The four parts of the teacher dashboard

Use the left-hand menu to move between these areas:

| Area | What it is for |
| --- | --- |
| **Overview** | Confirm classroom sharing is on, copy the student address, and check that PacePaper is connected. |
| **Classes** | Create classes, add students, import class lists, and set extra time. |
| **Sessions** | Give a paper to a class, open its clock, start the exam, watch candidate work live, and review submissions. |
| **Paper library** | Choose an included example, build a paper, import a saved paper, or preview one as a student. |

A **paper** is reusable exam content. A **session** is one sitting of that paper with one class. You can use the same paper again without rebuilding it.

Select **User guide** in the teacher sidebar to open these instructions in another tab. The guide also works offline from the HTML file supplied with the app.

Marking stays with the teacher: a packaged installation includes no worked answers or marking guides. When building a paper, a teacher may add an answer or marking guidance to each question. PacePaper shows that guidance only in authenticated teacher submission views and never sends it to candidate browsers.

## Quick classroom checklist

Follow this order for a complete practice exam:

1. Start PacePaper and sign in as the teacher.
2. Check the **Student sign-in** address shown under **Classroom sharing** in **Overview** (PacePaper shares the classroom network by default; choose a different address there if the network changed).
3. Copy the **Student sign-in** address and test it on one student device. The bare address is enough: opening it goes straight to roster sign-in.
4. In **Classes**, create or import the class and check every student's details.
5. In **Paper library**, choose an included example or create/import a paper. Use **Preview as student** to see exactly what candidates will see before the lesson.
6. In **Sessions**, choose the class, exam system, and paper, then select **Set up exam**.
7. Open that session's clock on the second screen.
8. Ask students to sign in by selecting their class and name.
9. Check that the correct students are present.
10. Select **Start exam**. Reading time begins now, when applicable.
11. Monitor online and submitted counts while students work.
12. After submission, open **View submissions** and select **Print or save PDF**.

The detailed instructions below follow the same order.

## Step 1 — Start PacePaper

PacePaper is a portable app, not an installer. Extract the complete download before opening it.

| Computer | Download | Open |
| --- | --- | --- |
| Apple-silicon or Intel Mac | Use the source option below | `Start PacePaper.command` |
| Windows x64 | `windows-x64.zip` | `PacePaper.exe` |
| Linux x64 | `linux-x64.tar.gz` | `PacePaper` |

Download the latest release bundle for Windows or Linux from the project's releases page. There is no Mac app bundle; on a Mac, install Bun and follow **Run from a source checkout** below, with IT help for the one-time setup.

1. Open PacePaper once on the teacher computer.
2. Leave the application running for the whole lesson.
3. Wait for the teacher dashboard to open in the normal browser.
4. Sign in with username `admin` and password `admin`.

Change the password any time in **Settings** — the current password is required, the new one must be at least 10 characters, changing it signs every teacher device out, and it persists with your data.

The teacher dashboard and the candidate screens offer a **Light/Dark** theme toggle (teacher topbar; student waiting-room and exam toolbars). Teacher and student choices are remembered separately per device, and both start on the system setting.

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

## Step 2 — Let students connect

PacePaper is designed for a teacher computer serving students on their own devices over the same trusted LAN. Classroom sharing is active from launch, using the address saved last time; a new installation chooses and saves the machine's first private network address.

1. Select **Overview** on the teacher computer.
2. Find **Classroom sharing**.
3. Check the private network used by the teacher and student devices.
4. If the network changed, choose another detected private IPv4 address and select **Apply classroom sharing**.
5. Find the **Student sign-in** address.
6. Select **Copy URL**.
7. Open that exact address on one real student device.
8. Confirm that the PacePaper student sign-in page appears.

Do this test before students begin. Students must use the private-network address from their own devices; `localhost` and `127.0.0.1` work only on the teacher computer.

The **Student sign-in** address on the dashboard and on the examination clock is always the private-network address that student devices open — it never shows `127.0.0.1` or `localhost`, and students can type it without adding `/student` because the bare address opens candidate sign-in. If classroom sharing is disabled, the examination clock still shows the network address but warns that students cannot connect until sharing is applied.

The teacher and students must be on a network that allows their devices to communicate. Guest Wi-Fi, different school networks, or network isolation may block access.

Classroom sharing cannot be changed while any examination is live. Do not quit or restart PacePaper during an exam.

## Step 3 — Prepare the class

Select **Classes**. Add students one at a time or import a prepared CSV class list.

### Option A — Add students manually

1. Under **Create class**, enter a clear **Class name**.
2. Select **Create class**.
3. Under **Add student**, select the class.
4. Enter the student's **Student name**.
5. Enter **Extra time in minutes**, or leave it at `0`.
6. Select **Add student**.
7. Repeat for the rest of the class.
8. Check the class list before moving on.

### Option B — Import a class list

1. Select **Download blank template**.
2. Open the CSV file in Excel, Numbers, or Google Sheets.
3. Add one row for each student.
4. Repeat the class name on every student row.
5. Enter `0` in `extra_minutes` when a student has no extra time.
6. Save or download the completed sheet as a CSV file.
7. Back in PacePaper, choose the file under **Class-list CSV**.
8. Select **Import class list**.
9. Check the displayed classes and students.

The blank template uses `class_name`, `student_name`, and `extra_minutes`. Student names must be unique within a class. One CSV file may contain several classes. To create an empty class, include one row with the student name and extra-time fields left blank.

Importing the same file again updates matching class and student names plus extra time; it adds missing students and does not remove students. Restore a removed class or student before importing a row with the same name.

Select **Export active classes** to save the current active rosters as CSV. Store exported files securely because they contain student names.

### Check before starting

Add or edit every candidate before selecting **Start exam**. PacePaper creates the candidate responses from the active class list when the exam starts. Students added afterwards are not added to that live sitting. Avoid changing extra time during a live exam.

## Step 4 — Choose or create the paper

Select **Paper library**, the final dashboard section. A fresh standalone installation includes one preloaded **Sample paper**:

- **Sample paper** — three original texts with short-answer and multiple-choice questions across a reading period, showing the main question styles and the student reader experience. It carries no subject, level, or IB branding.

You can build or import other papers for your own approved practice materials. An installation with past sessions may also show papers labelled **earlier demo version**. Choose the current version for a new session; the earlier one remains available with its previous work.

### Use an included paper

The only paper a fresh installation includes is the **Sample paper** above. For approved practice material, build a paper in the Paper Builder below, or import a prepared PacePaper paper file.

If your installation also shows development example papers — a source checkout may seed them — choose an **Exam system** to narrow the list, use **Find a paper**, and read the full title, paper number, and level or tier. Use the chosen paper when setting up the session in Step 5.

Read the label in each title before using an example:

- **Full-length mock** provides a complete original question workload with the researched timing and mark allocation. Review the questions before use.
- **Full-format practice** identifies an IB-oriented example following the researched paper structure, timing, and allocated marks. The questions still need a subject teacher's review for suitability and difficulty.
- **Format rehearsal** demonstrates the type of paper and still needs subject-language review.
- **Walkthrough** uses short timings to demonstrate section changes, breaks, and submission in a few minutes.

Full-length does not mean official or difficulty-calibrated. No awarding body has approved these papers, and no official grade boundaries are supplied. Have your subject team check the questions, materials, difficulty, and marking before using a mock with a class.

### Build a new paper

1. Find **Paper Builder** in the Paper library area.
2. Under **Choose the exact exam format**, select the **Exam system**. The builder currently offers IB Diploma Programme, IB MYP eAssessment, Cambridge IGCSE Mathematics 0580, Pearson Edexcel International GCSE Mathematics A, selected 2027 AP formats, and a school-custom practice option.
3. Select the assessment session or profile year.
4. Select the course, syllabus, qualification, or practice type. For **School custom**, choose **Enter a custom exam type…**, enter the assessment type in the box, then select **Use this exam type**.
5. Select the level or tier when the chosen system uses one.
6. Select the exact paper, component, or delivery format.
7. Read the **practice profile**, timing facts, tool rules, and teacher guidance that appear.
8. Check the **Practice paper title** and **Paper name**.
9. Check the **Reading time**, **Writing time**, and **Maximum marks**.
10. Add clear **Student instructions**.
11. For an eligible mathematics paper, choose whether to **Provide PacePaper's built-in scientific and graphing calculator**. Leave it off when students must use a physical approved calculator or no calculator.
12. Add the first question under **Questions and student entry areas**.
13. Enter the complete question wording and its marks. When an answer or marking guidance is available, add it in the teacher-only field; students do not receive this field.
14. Choose one of the response areas offered for that exam format.
15. Attach any image, PDF, or audio required only for that question. To add an image from the clipboard, select **Paste image** on its question card, then press ⌘V or Ctrl+V.
16. Repeat for the remaining questions.
17. Scroll through **Paper preview** and check the full student view.
18. Confirm that the marks a student can earn match **Maximum marks**. For a choose-one paper, count the selected question rather than adding all alternatives together.
19. Select **Save paper to library**.
20. Confirm that the paper appears in the **Paper library** with the correct exam-system name.

Choose the exam system, session, course or custom exam type, and format before entering questions. If you change format, PacePaper asks first and keeps the old paper as a recoverable draft in this browser, including attachments. Select **Recover an unfinished paper**, choose the draft, then **Restore draft**. **Undo question removal** restores the last removed question and its attachments.

Wait for **Draft saved in this browser** before closing the page. Drafts belong to this browser and this PacePaper address; they are not in the shared paper library or a database backup. Use **Save paper to library**, then export the paper, when you want to keep or move it. If draft storage fails, keep the page open and save to the library; format changes and sign-out are blocked to protect the draft.

For papers with fixed timed sections, the reading and total-time fields are read-only. Editing the instructions, title or marks keeps the sections and breaks intact. Choose a custom format if you need a different schedule.

The selected profile changes the terminology, timing, marks, materials, suggested question cards, available response areas, delivery description, phase plan, and tool guidance. For an AP paper, assign every question to the correct section or part using the field shown on its question card. PacePaper then locks earlier sections, blocks entry during explicitly locked phases and the monitored break, and changes the displayed calculator/material rule for each part. AP English's optional 15-minute reading period remains inside its writable 135-minute free-response phase; it is not a separate lock.

The AP profiles target **May 2027** and remain visibly marked **Adapted practice**. PacePaper currently uses one fixed classroom break timer that advances automatically; the official digital application waits for each candidate to select **Resume Testing** after the break timer. AP hybrid free-response practice should use a physical response booklet when closest format rehearsal is required. For eligible mathematics practice papers, PacePaper can provide its own numeric practice calculator with graph analysis, tables, and basic statistics/probability tools when the teacher enables it. The calculator uses a handheld layout and does not replace the calculator allowed by an official paper. Check the current official course guide, specification, and session instructions before a full mock exam.

### Add paper materials

- Add paper-wide PDFs, source text, or listening audio under **Details and student materials**.
- When building your own paper, attach any reference document required by the selected preset, such as a mathematics formula sheet or the AP Biology equations and formulas sheet.
- For any paper you use — including a development example, when present — read **Before you start** and supply any further permitted calculator, equipment, or materials listed there.
- Add an image, PDF, or audio file to an individual question when only that question needs it.
- Enter the complete question wording in **Question or prompt**. Attached PDF pages are not copied into the printed candidate response automatically.
- Images appear with the response when printed. PDFs and audio are listed as companion material.
- Listening audio allows two complete listens. Students cannot pause, restart, seek, or change speed after a listen begins.
- For a canvas question, choose its starting page count and default background. New canvas questions start **Ruled**; **Blank** and **Square grid** remain available when needed.
- Students can draw, erase, undo, redo, add pages, change the background, and add a typed response. PacePaper warns them before changing the teacher's default.

### Preview a paper as a student

Before a lesson, check what candidates will actually see rather than reading the paper's settings:

1. Open **Paper library**.
2. Find the paper and select **Preview as student**. The candidate interface opens in a new tab.
3. Work through the paper as a candidate would: change question, use the tools, play the audio, and print nothing.
4. Close the tab when you have seen enough.

The preview uses the real candidate interface with the paper's own timings, so reading time, phase changes, and locked sections behave exactly as they will in the sitting. Nothing is recorded: answers are not saved, final submission does nothing, audio listens are not counted, and no class, session, or response is created. Clearing a preview sitting therefore needs no cleanup. The preview belongs to your teacher session, so it opens only while you are signed in to the dashboard.

### Export or import a paper

To move a teacher-created paper to another PacePaper installation:

1. Find the paper in the library.
2. Select **Export** to save one `.digitaldp-paper` file.
3. On the other installation, open **Paper library**.
4. Under **Import a saved paper**, choose the file.
5. Select **Import paper**.
6. Confirm that it appears in the Paper library.

The paper file contains its questions, settings, and permitted attachments. It does not contain classes, students, exam sessions, or responses.

If an import matches a paper already in the library, PacePaper lists the matching records instead of creating another copy. Choose an **unused** paper and select **Replace unused paper**, or cancel to leave the library unchanged. A paper that has been used by any exam sitting cannot be replaced. Check the displayed paper ID, source status, import date, and usage before confirming. Use **Remove** to move an obsolete paper into the reversible **Removed papers** list; previous sittings and responses remain attached, and **Restore** returns it to the active library.

## Step 5 — Set up the exam session

Select **Sessions**.

1. Under **Set up an exam**, choose the **Class**.
2. Choose the **Exam system**.
3. Choose the **Paper**. Only papers from the chosen system are shown.
4. Read **Before you start**. Check the number of question cards, marks, timing, instructions, and any calculator or materials requirements.
5. Select **Set up exam**.
6. Find the new session in the list.
7. Confirm that it says **Ready to start**.

Setting up a session makes the exam available to every student in that class. Students choose the class and their own name from the active roster. No candidate PIN or direct link is created.

Setting up a session does not start its clock. It makes the exam available to candidates on the classroom network.

One question card may contain several parts. Check the questions, timing, and marks before students join.

You may set up several sessions in advance. Different classes can take different exams at the same time. One class can have only one live session at a time.

## Step 6 — Open the examination clock

1. Find the correct session.
2. Select its **Open clock ↗** link.
3. Move the new tab or window to the projector or second screen.
4. Check the paper, class, start time, reading time, and writing time.
5. Edit the displayed student names if needed.
6. Confirm that the linked class name and student sign-in address are visible.

For a simple paper with one reading period and one writing period (no fixed timed sections), changing **Reading minutes** or **Writing minutes** and selecting **Save exam timing and update display** saves the configured minutes for that sitting. For example, `0.1` reading minutes is six seconds. You can make this change while the exam is ready or after it has started: saving during a live exam moves the reading/writing boundary and the deadline immediately for every candidate, which is the fastest way to correct a mistaken duration. Check the saved confirmation and the session's timing on the teacher dashboard.

The display title, details and student-name list stay local to that clock window. Linked clocks always follow the saved exam start, duration and sections, including changes saved in another window. The start date is read-only; **Start exam** on the teacher dashboard controls the start. An exam that has ended can no longer change its saved timing.

**Fixed timed sections stay read-only.** If the paper uses a fixed multi-phase schedule of sections and breaks, the clock's timing fields are disabled; use the Paper Builder to prepare a paper with a different schedule. Candidate-specific extra time remains separate from the standard room clock.

If another window changes the timing while you are editing, saving shows a conflict message. Select **Reload exam defaults**, review the updated times, then make your change again. A temporary **Custom countdown** is separate from student exams and is not saved after refresh.

For simultaneous exams, open the clock from each specific session row. A clock opened without a chosen session prefers an ongoing exam, so always check its paper and class before projecting it.

The clock remains on **Ready to start** until the teacher selects **Start exam**. Reading time does not count down while students are joining.

## Step 7 — Ask students to join

Give each student the **Student sign-in** address. Students choose their class and own name from the active roster.

Ask each student to:

1. Open the exact address supplied by the teacher.
2. Select the **Class name**.
3. Select your own name.
4. Select **Continue**.
5. Check the paper title and wait for the teacher.

The class and name are used only to join the current classroom sitting. PacePaper does not require a PIN, account, email, or internet access.

Their sign-in screen and waiting room both state that the teacher can see their work during the sitting: answers, drawings, notes, and flagged questions, within PacePaper only.

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

### Watch candidate work as it is written

While a sitting is live, each session row offers **Watch work**:

1. Select **Watch work** on the live session.
2. Choose a student from the list on the left. Each row shows their name, how many questions they have answered, and when they last saved.
3. Read their paper on the right: current answers, choice selections, drawing pages, and their notepad.
4. Leave the window open. It refreshes as candidates save, so you can see progress without walking the room.

What this shows and what it does not:

- It shows what each candidate has **saved**. The candidate screen saves about a second after typing stops, so the very latest keystrokes can lag briefly.
- A candidate whose browser is closed, offline, or crashed simply stops updating; the view keeps the last saved work and its timestamp.
- It shows only PacePaper. It cannot see other tabs, other applications, or the candidate's screen.
- It is read-only. Nothing you open changes a candidate's paper, and nothing appears on their screen while you watch.

Candidates are told at sign-in, and again in their waiting room, that their teacher can see their work during a sitting.
10. Let candidates with extra time continue until their individual time ends.

While an exam runs, the dashboard shows live **Focus** alerts when a candidate leaves the exam window, and the session keeps a per-session audit list; alerts are best-effort, so a crash or disconnect can prevent an event.

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
4. Select **Answer history** to review the response over time. The slider and step buttons move between saved versions, so you can see what the candidate had written earlier in the sitting. Snapshots are taken every 20 seconds or so (less often for drawing-heavy answers), not on every keystroke.
5. Select **Print this candidate** for one student, or **Print all or save PDF** for the group.
6. In the browser print window, choose a printer or **Save as PDF**.
7. Open the saved PDF and check it before closing PacePaper.

The printable record includes questions, typed responses, canvas pages, inline images, and the student's notepad. PDFs and audio used as companion materials are listed rather than reproduced inside the response paper.

Use a normal browser such as Chrome, Edge, or Safari. An in-app browser may ignore the print button.

PacePaper currently collects, reviews, and prints responses. It does not mark or grade them.

### Rehearse the exam phases

To demonstrate the phase engine, use any sectioned paper you have built or imported:

1. Set up a session with a small demo class.
2. Open its clock on a second screen.
3. Join as a demo student in another browser.
4. Start the exam and watch each phase change.
5. Confirm that working sections accept only their own questions, the break hides examination content, calculator rules change where applicable, and only the final work section offers final submission.

Before assembling a demo class, **Preview as student** from **Paper library** shows the same interface, the phase order, and the paper's timings without creating a class, a student, or a stored response.

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
3. Copy the entire data folder to approved secure storage.

Default data folders (the folder name remains `DigitalDP` so existing release data keeps working):

- Mac: `~/Library/Application Support/DigitalDP/`
- Windows: `%LOCALAPPDATA%\DigitalDP\`
- Linux: `~/.local/share/DigitalDP/`

On a Mac, choose **Go → Go to Folder** in Finder and paste the path above. On Windows, press Windows-R and paste its path. On Linux, paste the path into the file manager's location bar. If IT set a custom data folder, use that folder instead.

These locations apply to the standalone app and `bun run start:app`. The basic development commands `bun run start` and `bun run dev` instead use the project's `data/` folder unless configured otherwise.

Back up the data folder before replacing PacePaper with a newer version. Class-list CSV files move rosters; `.digitaldp-paper` files move individual papers. Only a complete data-folder backup also keeps the sessions and student responses.

Before a database schema upgrade, PacePaper checks the database and creates a verified SQLite snapshot in the data folder's `backups` directory. This automatic snapshot does not replace your full data-folder backup.

If an older data folder contains class names or student names within a class that are indistinguishable at sign-in, PacePaper keeps the record tied to a live sitting; otherwise it keeps the earlier active record and moves later duplicates into **Removed**. If matching records both have live work, PacePaper stops before changing the database. Finish those sittings before upgrading. Review that section after the first upgraded start. Rename the active class or student before restoring a duplicate.

### Restore a backup

1. Stop PacePaper completely.
2. Make a separate copy of the current data folder so you can undo the restoration.
3. Replace the data folder's contents with the complete backup.
4. Start PacePaper and check a class, a paper, and a saved response.

Restoring a backup returns the installation to the date of that backup. Later work remains only in the separate copy you made in step 2. If you want to add a roster or paper while keeping current work, use its import option instead.

## Student quick instructions

Teachers may give this section directly to students.

1. Open the address supplied by your teacher.
2. Select your class.
3. Select your own name.
4. Select **Continue**.
5. Check the paper title and wait for the teacher.
6. Answer in the area below each question. Work saves automatically.
7. Use **Flag** and **View summary** to check unfinished questions.
8. When allowed, select **Calculator** for scientific calculations or to plot up to three functions.
9. Use **Notepad** only for rough work. It is included in the teacher's PDF but is separate from your answers.
10. When finished, select **Submit**, check the summary, and select **Submit now**.
11. While you remain signed in, select **View assessment** to read your own earlier response.

During reading time, answer areas remain locked. You can still read the questions and answer choices and switch between the available texts.

You may highlight text shown directly on the PacePaper page. Highlighting does not work inside attached PDFs or images. **Accessibility** controls can change text size, colours, typeface, or spacing without changing the paper.

For a handwritten question, use **Draw**, **Eraser**, **Undo**, **Redo**, or **Add page**. New pages start **Ruled**. You may choose **Blank**, **Ruled**, or **Square grid** under **Canvas background**, and add a typed response as well.

For listening audio, select **Start first listen** only when ready and let it play to the end. After completion, **Start final listen** becomes available.

The calculator uses a handheld layout. **Enter** submits the current line; the next line starts fresh, and an operator continues from `Ans`. **Ctrl**, then **Enter** gives a decimal result. The **Scratchpad** key switches Calculate/Graph; **Home / On** opens the home screen; **Menu** opens numbered tool menus; **Esc** dismisses menus before closing the calculator. On a computer keyboard, **F1** opens Menu and **Ctrl+Enter** gives a decimal. Use the touchpad or number keys to navigate menus. Blue labels above physical keys are accessed through **Ctrl**.

Enter `5→a` using **Ctrl**, then **var**, to store a value, or type `a:=5`. Recall stored values with **var**. The up/down keys recall calculations. History and stored variables remain available during the current browser sitting. **Menu → Algebra → Numerical Solve** solves an equation within chosen bounds; **Menu → Calculus** provides derivative and integral dialogs; **Menu → Statistics** and **Probability** open data and distribution tools. **doc → Document Settings** changes the angle mode. Fraction, radical and power notation is shown in calculation history.

The built-in calculator has degree/radian scientific calculation, complex values, lists, matrices, named functions, polynomial roots, numerical calculus, graph analysis, statistics, probability and finance. **Menu → Matrices & Linear Systems** provides determinant, inverse, transpose, rref and linear-system tools. **Lists & Sequences** stores named lists; **Algebra → Define Function** stores a reusable function. Examples: `{1,2,3}→l1`, `mean(l1)`, `[[2,1],[1,3]]→a`, `inverse(a)`, `f1(x):=x^2`, and `seq(k^2,k,1,10)`. List/matrix indices start at 1. Complex values use `i`, such as `sqrt(-4)` or `(2+3*i)/(1-i)`.

**Statistics** includes frequency statistics; linear, quadratic, cubic, quartic, exponential, logarithmic and power regression; scatter/connected/histogram/modified-boxplot charts; t/z/proportion/chi-squared tests and confidence intervals; and one-way ANOVA. A fitted model can be stored as `f1(x)` and used in Graph or Table. **Probability** adds Student t, chi-squared, F, Poisson and geometric distributions to the existing binomial and normal tools. Inverse tools are available for the continuous distributions. **Finance** provides a TVM solver and net present value; money received is positive and money paid is negative.

**Graph → Parametric / Polar / Sequence** plots parameter-based curves and explicit sequences with trace and sampled tables. Use `t` for parametric expressions, `theta` for polar radius and `n` for sequence expressions. Arrow keys move the trace; selecting a point traces its nearest sample. Standard Cartesian Graph still supports three functions of `x`, numerical zeros/intersections/extrema, derivative, definite integral and a value table.

These independently implemented tools are for practice and are not validated replacements for approved physical calculators. The calculator does not provide CAS, proprietary firmware or document formats, saved programs, general spreadsheets, geometry, 3D graphing or model certification. Expressions are capped at 1000 characters, lists/sequences at 1000 entries, matrices at 20×20 and polynomial roots at degree 6. Quartiles use linear interpolation, which can differ from a physical calculator. Open **Supported functions and keyboard controls** inside the calculator for commands and conventions.

## Troubleshooting

- **The Mac app says it is damaged:** Do not bypass Gatekeeper. Confirm that the release is notarized. If you are working from a source checkout, use `Start PacePaper.command` from the project folder.
- **The app does not open:** Extract the complete download, use the correct platform file, and close any second copy of PacePaper.
- **Students cannot connect:** Confirm that classroom sharing is on, use the displayed private-network address, and test it on a real student device. Do not give students `localhost` or `127.0.0.1`.
- **A student cannot sign in:** Check that the teacher selected the correct class and that the student name is in the active roster.
- **An exam is missing:** Check that the teacher selected **Set up exam** and that the student selected the correct class.
- **A student is stuck on Connecting or Reconnecting:** Keep the page open. Confirm that PacePaper is running and both devices are still on the same network.
- **The clock is counting the wrong session:** Choose the exam from the clock's session list, or reopen the clock from the correct session row.
- **Clock timing cannot be edited:** Simple reading/writing papers support timing edits while the exam is ready or live — a live save moves candidate deadlines immediately. Fixed-section papers and ended exams use the saved schedule. Read Step 6; changing display details never changes student time.
- **The print button does nothing:** Open the teacher dashboard in Chrome, Edge, or Safari, open **View submissions**, and select **Print this candidate** or **Print all or save PDF** again.

## Demo safety

A fresh installation uses the default teacher login `admin` / `admin`. Change it in **Settings** before real use. Student sign-in uses the active class roster and name only. Classroom traffic uses unencrypted HTTP, so use a trusted private network and approved material.

Use fake candidates, approved practice material, and a trusted private network only. PacePaper is not the official IB Digital Examination System and is not affiliated with or endorsed by the International Baccalaureate.
