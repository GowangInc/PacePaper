export function endExamImpact(results) {
  const remaining = results.responses.filter((response) => response.submittedAt === null);
  return {
    title: `End ${results.session.paperTitle}?`,
    description: `${results.session.className} · ${remaining.length} student${remaining.length === 1 ? " has" : "s have"} not submitted. Ending now submits their last saved responses, including students with extra time. Unsaved work may be lost. This cannot be undone.`,
    names: remaining.map((response) => response.studentName),
  };
}

export function confirmEndExam({ trigger, loadResults }) {
  const dialog = document.createElement("dialog");
  dialog.className = "exam-dialog compact-dialog";
  dialog.setAttribute("aria-labelledby", "end-exam-title");
  dialog.setAttribute("aria-describedby", "end-exam-impact");
  dialog.innerHTML = `<form method="dialog"><header><h2 id="end-exam-title">End examination?</h2><p id="end-exam-impact" role="status">Checking students and last saved responses…</p></header><ul data-end-names></ul><footer><button value="cancel" autofocus>Keep exam running</button><button class="danger-action" value="end" disabled>End exam and submit remaining responses</button></footer></form>`;
  document.body.append(dialog);
  const result = new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      const confirmed = dialog.returnValue === "end";
      dialog.remove();
      requestAnimationFrame(() => { if (trigger.isConnected && !trigger.disabled) trigger.focus(); });
      resolve(confirmed);
    }, { once: true });
  });
  dialog.showModal();
  void loadResults().then((results) => {
    if (!dialog.isConnected) return;
    if (results.session.status !== "live") throw new Error("This exam is no longer live. Close this message and refresh the dashboard.");
    const impact = endExamImpact(results);
    dialog.querySelector("h2").textContent = impact.title;
    dialog.querySelector("#end-exam-impact").textContent = impact.description;
    for (const name of impact.names) {
      const item = document.createElement("li"); item.textContent = name;
      dialog.querySelector("ul").append(item);
    }
    dialog.querySelector("[value=end]").disabled = false;
  }).catch((error) => {
    if (dialog.isConnected) dialog.querySelector("#end-exam-impact").textContent = `Could not confirm who would be affected: ${error.message}. Keep the exam running and try again.`;
  });
  return result;
}
