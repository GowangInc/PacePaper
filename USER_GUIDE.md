# DigitalDP quick user guide

This guide is for the `0.1.0-demo.2` standalone classroom demo. DigitalDP runs on one teacher computer; students connect through the school network.

## Run a classroom exam

1. Extract the DigitalDP download and open the app.
2. Sign in with username `admin` and password `admin`.
3. In **Classroom sharing**, choose the classroom network and select **Apply classroom sharing**.
4. Copy the **Student sign-in** URL and test it on one student device.
5. In **Classes and candidates**, create a class and add or edit every student.
6. Check **Extra time in minutes** before starting the exam.
7. In **Paper library**, build or import a paper.
8. In **Set up an exam**, choose the class and paper, then select **Set up exam**.
9. Students sign in, choose the exam, and wait. Select **Start exam** when everyone is ready.
10. When finished, select **View submissions**, then **Print or save PDF**.

## Install and open

DigitalDP is a portable app, not an installer. Extract the whole download before opening it.

| Computer | Download | Open |
| --- | --- | --- |
| Apple-silicon or Intel Mac | `macos-universal.zip` | `DigitalDP.app` |
| Windows x64 | `windows-x64.zip` | `DigitalDP.exe` |
| Linux x64 | `linux-x64.tar.gz` | `DigitalDP` |

The app may show a security warning because this demo is unsigned. On Mac, Control-click `DigitalDP.app`, choose **Open**, and confirm. On Windows, continue only if the file came from the private DigitalDP release.

Run only one copy of DigitalDP at a time. Do not open `public/index.html` or a `file://` address. Sign in with username `admin` and password `admin`. The dashboard opens in a normal browser at an address like `http://127.0.0.1:9148/admin`.

## Let students connect

DigitalDP starts in **This computer only** mode each time it opens.

1. Open **Classroom sharing**.
2. Choose the private network address used by the classroom.
3. Select **Apply classroom sharing**.
4. Use **Copy URL** beside **Student sign-in**.
5. Open that exact URL on one real student device before the exam.

Student devices must be on a network that allows them to reach the teacher computer. Guest Wi-Fi or separate school networks may block the connection.

Do not quit or restart DigitalDP during a live exam. Classroom sharing cannot be changed while an exam is live.

## Create a class and add students

Open **Classes and candidates**.

1. Enter the **Class name** and a short **Class code**, then select **Create class**.
2. Under **Add student**, choose the **Class**.
3. Enter the **Student name**, **Candidate code**, and any **Extra time in minutes**.
4. Select **Add student**.

Use **Edit** and **Save changes** to update a student's name, candidate code, or extra time.

### Import a class list

For a whole class, use a CSV spreadsheet instead of adding students one at a time.

1. Select **Download blank template**.
2. Open the file in Excel, Numbers, or Google Sheets.
3. Add one row for each student. Repeat the class name and class code on every row.
4. Enter `0` in **extra_minutes** when a student has no extra time.
5. Save or download the sheet as a CSV file.
6. Choose the file under **Class-list CSV**, then select **Import class list**.

The same file can contain several classes. A class with no students needs one row with the three student fields left blank.

Class codes and candidate codes identify existing records. Importing the same file again updates names and extra time; it adds missing students but never removes anyone. Restore a removed class or student before importing a row with the same code.

Select **Export active classes** to download the current active class lists as a CSV file. Keep exported files secure because they contain student names.

Add or edit all students before selecting **Start exam**. Changes made afterwards do not change the candidates or extra time in that live sitting.

**Remove** hides a class, student, or sitting without deleting previous responses. Use **Restore** in the relevant removed-items section if needed.

## Create a paper

Open **Paper Builder** in the **Paper library**.

The standalone app includes 34 original DigitalDP example papers: two for each course currently supported by the builder. They appear automatically and do not replace papers made by a teacher.

1. Under **Choose the exam**, select the **Assessment session**, **Course**, **Level**, and **Paper**.
2. Check the **Practice paper title**, **Paper name**, **Reading time in minutes**, **Writing time in minutes**, and **Maximum marks**.
3. Add clear **Student instructions**.
4. Add each question under **Questions and student entry areas**.
5. Choose **Long typed response**, **Short typed response**, **Multiple-choice**, or **Digital working canvas** for each question.
6. Check the **Paper preview**.
7. Select **Save paper to library**.

Choose the exam type before adding questions. Changing it clears questions and attachments already entered in the builder.

The suggested settings are starting points. Check the current course guide before using them.

### Paper files and canvas

- Add **Paper-wide PDFs**, **Source text**, or **Listening audio** under **Details and student materials**.
- Add an image or PDF to one question when only that question needs it. Listening papers can also use question-specific audio.
- Images print with the response. PDFs and audio are listed as companion material.
- Enter the complete question wording in **Question or prompt**. Attached PDF pages are not copied into the final response PDF.
- Listening audio allows two complete listens. Students cannot pause, restart, seek, or change speed once a listen begins.
- For a canvas question, choose the starting pages and **Default canvas background**: **Blank**, **Ruled**, or **Square grid**.
- Students can draw, erase, undo, redo, add pages, and change the background. DigitalDP warns them before changing the teacher's default.

Use **Export** beside a paper made in the builder to save a `.digitaldp-paper` file. To load the file elsewhere, use **Import a saved paper** and select **Import paper**. It does not contain classes, students, sittings, or responses.

## Set up and run the exam

1. Under **Set up an exam**, choose the **Class** and **Paper**.
2. Select **Set up exam**.
3. Give students the displayed **Student sign-in** URL and class code.
4. Ask students to join the correct waiting room.

The same library paper can be used for more than one sitting.

### Show the examination clock

Select **Open clock ↗** beside the sitting, or **Open countdown display ↗**. Move the new tab to a projector or second screen.

The clock can show the start time, reading time, writing time, student names, and student URL. It stays on **Ready to start** until the teacher selects **Start exam**; reading time begins from that action. Its display settings do not change the timers on student devices.

### Start and finish

1. Ask students to confirm that the correct paper appears in their waiting room.
2. Select **Start exam**.
3. During reading time, students can read but cannot enter responses.
4. Monitor the online and submitted counts.
5. Wait for all students, including extra-time candidates, to submit.
6. Select **End exam** only when the whole sitting should finish.

**Important:** **End exam** submits every remaining candidate immediately, including students who still have extra time.

## Student instructions

You can give this section directly to students.

### Join

1. Open the **Student sign-in** URL from your teacher.
2. Enter the **Class code** and select **Load names**.
3. Choose your name and select **Continue**.
4. Under **Choose your examination**, select **Join waiting room**.
5. Check that the correct paper is shown and wait for the teacher.

If the exam has already started, select **Enter exam**.

### Work

- Answer in the area below each question. Your work saves automatically.
- Keep the exam tab open and check the save message.
- Use **Notepad** for rough notes. These notes are included in the teacher's PDF.
- Select text shown directly on the DigitalDP page, then use **Highlight** to mark it. The tool does not mark inside a PDF or image.
- Use **Flag** to mark a question and **View summary** to review your progress.
- Use **Accessibility** to change text size, colours, typeface, or spacing.
- During reading time, response areas remain locked.

For a drawing question, use **Draw**, **Eraser**, **Undo**, **Redo**, or **Add page**. You may choose **Blank**, **Ruled**, or **Square grid** under **Canvas background**.

For audio, select **Start first listen** only when ready. Let it play to the end. After it finishes, **Start final listen** becomes available.

### Submit

1. Select **Submit** or **Submit examination**.
2. Check **Response summary**.
3. Select **Submit now**.

Submission is final. If time expires, DigitalDP submits the response automatically.

## Review and print responses

1. Select **View submissions** for the sitting.
2. Open a candidate to review the response.
3. Select **Print or save PDF**. For several candidates, use **Print all or save PDF**.
4. In the browser print window, choose a printer or **Save as PDF**.

Use a normal browser such as Chrome, Edge, or Safari. An in-app browser may ignore the print button.

The PDF includes questions, responses, canvas pages, inline images, and the student's notepad.

DigitalDP currently reviews and prints responses but does not mark or grade them.

## Back up classroom data

Class-list and paper exports are not full backups. To back up everything:

1. Finish all live exams.
2. Quit DigitalDP completely.
3. Copy the whole DigitalDP data folder to approved secure storage.

Default data folders:

- Mac: `~/Library/Application Support/DigitalDP/`
- Windows: `%LOCALAPPDATA%\DigitalDP\`
- Linux: `~/.local/share/DigitalDP/`

Back up before replacing the app with a newer version.

## Quick troubleshooting

- **The app will not open:** Extract the full download, use the correct platform file, and close any second copy of DigitalDP.
- **Students cannot connect:** Confirm that **Classroom sharing** is on, use the displayed private-network URL, and test it on a student device. `localhost` and `127.0.0.1` work only on the teacher computer.
- **A name is missing:** Check the class code, select **Refresh names**, and confirm that the student was added before **Start exam**.
- **An exam is missing:** Confirm that the teacher selected **Set up exam**. The student may need to return to **Choose your examination**.
- **The page says Reconnecting:** Keep the page open. Check that DigitalDP is still running and both devices remain on the same network.
- **The print button does nothing:** Open the teacher dashboard in Chrome, Edge, or Safari, then try **Print or save PDF** again.

## Demo safety

This demo uses the weak teacher login `admin` / `admin`. Students use a class code and choose a name; there is no PIN or identity check. Classroom traffic uses unencrypted HTTP.

Use only fake candidates, approved practice material, and a trusted private network. DigitalDP is not the official IB Digital Examination System and is not affiliated with or endorsed by the International Baccalaureate.
