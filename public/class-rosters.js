function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatClassRosterImportResult(result) {
  const changed = [
    [result.classesCreated, "class created", "classes created"],
    [result.classesUpdated, "class updated", "classes updated"],
    [result.studentsCreated, "student added", "students added"],
    [result.studentsUpdated, "student updated", "students updated"],
  ].filter(([count]) => count > 0).map(([count, singular, plural]) => countLabel(count, singular, plural));
  const unchanged = (result.classesUnchanged ?? 0) + (result.studentsUnchanged ?? 0);
  if (changed.length === 0) return `Class list checked: ${countLabel(unchanged, "record was", "records were")} already current.`;
  return `Class list imported: ${changed.join(", ")}.${unchanged ? ` ${countLabel(unchanged, "record was", "records were")} already current.` : ""}`;
}

export function mountClassRosterTransfer(container, { request, onImported, notify }) {
  container.innerHTML = `
    <form data-class-roster-form class="utility-form" method="post" action="/api/admin/class-rosters/import" enctype="multipart/form-data">
      <fieldset>
        <legend>Import or export class lists</legend>
        <p class="form-help">Prepare one or more classes in Excel, Numbers or Google Sheets, then save the sheet as CSV.</p>
        <label for="class-roster-file">Class-list CSV</label>
        <input id="class-roster-file" name="classRoster" type="file" accept=".csv,text/csv" required aria-describedby="class-roster-help">
        <small id="class-roster-help">Matching class and candidate codes update names and extra time. Importing does not remove anyone.</small>
        <button type="submit">Import class list</button>
        <div class="class-roster-links" aria-label="Class-list downloads">
          <a href="/api/admin/class-rosters/template" download>Download blank template</a>
          <a href="/api/admin/class-rosters/export" download>Export active classes</a>
        </div>
        <small>Keep exported files secure because they contain student names.</small>
        <p data-class-roster-status class="status-message" role="status" aria-live="polite" aria-atomic="true" hidden></p>
      </fieldset>
    </form>
  `;

  const form = container.querySelector("[data-class-roster-form]");
  const submit = form.querySelector("button[type=submit]");
  const status = form.querySelector("[data-class-roster-status]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    status.hidden = true;
    try {
      const result = await request(form.action, { method: "POST", body: new FormData(form) });
      const message = formatClassRosterImportResult(result);
      form.reset();
      await onImported();
      status.textContent = message;
      status.dataset.tone = "success";
      status.hidden = false;
      notify(message, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import the class list";
      status.textContent = message;
      status.dataset.tone = "error";
      status.hidden = false;
      notify(message, "error");
    } finally {
      submit.disabled = false;
    }
  });
}
