const PICKERS = ["builder-system", "builder-session", "builder-subject", "builder-level", "builder-paper"];
const DETAILS = ["builder-title", "builder-paper-label", "builder-reading-time", "builder-duration", "builder-maximum-marks", "builder-instructions", "builder-source-text"];
const FILES = ["builder-pdf", "builder-audio"];

export function captureBuilderDraft(form, questions) {
  const values = Object.fromEntries([...PICKERS, ...DETAILS].map((id) => [id, form.querySelector(`#${id}`).value]));
  return { id: PICKERS.map((id) => values[id]).join("|"), values, updatedAt: Date.now(),
    questions: structuredClone(questions),
    files: Object.fromEntries(FILES.map((id) => [id, [...form.querySelector(`#${id}`).files]])) };
}

// IndexedDB structured cloning preserves uploaded Files as well as text. Wait
// for transaction completion: request success alone is not a durable save.
export async function builderDraftStore(action, value) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open("digitaldp-builder-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Draft storage is blocked in another window"));
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("drafts", action === "list" ? "readonly" : "readwrite");
      const store = transaction.objectStore("drafts");
      const request = action === "list" ? store.getAll() : action === "put" ? store.put(value) : store.delete(value);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? new Error("Draft save failed"));
      transaction.onerror = () => reject(transaction.error ?? new Error("Draft save failed"));
    });
  } finally { database.close(); }
}

export function mountBuilderDrafts(form, questions, restoreSelection, renderQuestions) {
  const panel = document.createElement("div");
  panel.innerHTML = `<p data-draft-status role="status">Drafts are stored in this browser, not shared with other teachers.</p><label>Recover an unfinished paper <select data-draft-picker><option value="">Choose a saved draft</option></select></label><button type="button" data-draft-restore>Restore draft</button>`;
  form.querySelector(".builder-heading").after(panel);
  const status = panel.querySelector("[data-draft-status]");
  const picker = panel.querySelector("select");
  let draftId = crypto.randomUUID();
  const capture = () => ({ ...captureBuilderDraft(form, questions), id: draftId });
  let last = capture();
  let revision = 0;
  let savedRevision = 0;
  let queue = Promise.resolve();
  let drafts = [];
  let busy = false;
  const updateList = async () => {
    drafts = await builderDraftStore("list");
    const selected = picker.value;
    picker.replaceChildren(new Option("Choose a saved draft", ""));
    for (const draft of drafts.sort((a, b) => b.updatedAt - a.updatedAt)) {
      picker.add(new Option(`${draft.values["builder-title"]} · ${new Date(draft.updatedAt).toLocaleString()}`, draft.id));
    }
    picker.value = selected;
  };
  const record = () => {
    last = capture();
    if (!last.values["builder-paper"] || !questions.length) return Promise.resolve(true);
    const snapshot = last;
    const capturedRevision = ++revision;
    status.textContent = "Saving draft in this browser…";
    queue = queue.then(async () => {
      try {
        await builderDraftStore("put", snapshot);
        savedRevision = capturedRevision;
        if (savedRevision === revision) status.textContent = "Draft saved in this browser, including attachments. Save to library when ready.";
        await updateList();
        return true;
      } catch {
        status.textContent = "Draft not saved. Keep this page open; browser storage is unavailable. Save the paper to the library before leaving.";
        return false;
      }
    });
    return queue;
  };
  const changeFormat = async (event, change) => {
    if (busy) return;
    const target = event.target;
    const requested = target.value;
    target.value = last.values[target.id];
    if (questions.length && !confirm("Change exam format? Your current paper will be kept as a recoverable draft in this browser.")) return;
    busy = true;
    form.inert = true;
    try {
      if (!await record()) return;
      draftId = crypto.randomUUID();
      target.value = requested;
      change();
      await record();
    } finally { busy = false; form.inert = false; target.focus(); }
  };
  panel.querySelector("button").addEventListener("click", async () => {
    const draft = drafts.find(({ id }) => id === picker.value);
    if (!draft || busy) return;
    busy = true;
    form.inert = true;
    try {
      if (!await record()) return;
      draftId = draft.id;
      restoreSelection(draft.values);
      for (const id of DETAILS) form.querySelector(`#${id}`).value = draft.values[id];
      for (const id of FILES) {
        const transfer = new DataTransfer();
        for (const file of draft.files[id]) transfer.items.add(file);
        form.querySelector(`#${id}`).files = transfer.files;
      }
      questions.splice(0, questions.length, ...structuredClone(draft.questions));
      renderQuestions();
      await record();
    } catch {
      status.textContent = "Could not restore this draft. The saved copy has been kept; do not overwrite it.";
    } finally { busy = false; form.inert = false; form.querySelector("#builder-title").focus(); }
  });
  for (const eventName of ["input", "change", "click"]) form.addEventListener(eventName, (event) => {
    if (busy || panel.contains(event.target) || event.target.closest(".builder-exam-picker") || event.target.type === "submit") return;
    void record();
  });
  const beforeUnload = (event) => {
    if (!form.isConnected) { window.removeEventListener("beforeunload", beforeUnload); return; }
    if (revision > savedRevision) { event.preventDefault(); event.returnValue = ""; }
  };
  window.addEventListener("beforeunload", beforeUnload);
  form.canLeave = async () => record();
  void updateList().catch(() => { status.textContent = "Draft storage is unavailable. Save papers to the library before leaving."; });
  return { changeFormat, record,
    async savedToLibrary() {
      await queue;
      await builderDraftStore("delete", last.id);
      savedRevision = revision;
      status.textContent = "Paper saved to library.";
      await updateList();
    },
  };
}
