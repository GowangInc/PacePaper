function unresolvedCopy(candidates) {
  if (!candidates.length) return "Every candidate device confirmed its latest response. You can end the examination safely.";
  return `${candidates.length} candidate device${candidates.length === 1 ? " has" : "s have"} not confirmed the latest response. Keep waiting, or enter a reason to override this safety check.`;
}

export function endExamImpact(results) {
  const unresolved = results.unresolvedCandidates ?? [];
  return {
    title: unresolved.length ? "End despite unresolved candidates?" : "End examination?",
    description: unresolvedCopy(unresolved),
    names: unresolved.map(({ name }) => name),
  };
}


export function confirmEndExam({ trigger, beginEnd, loadReadiness, cancelEnd }) {
  const dialog = document.createElement("dialog");
  dialog.className = "exam-dialog compact-dialog";
  dialog.setAttribute("aria-labelledby", "end-exam-title");
  dialog.setAttribute("aria-describedby", "end-exam-impact");
  dialog.innerHTML = `<form method="dialog"><header><h2 id="end-exam-title">End examination?</h2><p id="end-exam-impact" role="status">Freezing candidate entry and checking final saves…</p></header><ul data-end-names></ul><label data-override hidden><span>Reason for ending before every device confirms</span><textarea name="overrideReason" maxlength="500"></textarea></label><footer><button value="cancel" formnovalidate autofocus>Keep exam running</button><button class="danger-action" value="end" disabled>End exam and submit responses</button></footer></form>`;
  document.body.append(dialog);
  const impact = dialog.querySelector("#end-exam-impact");
  const names = dialog.querySelector("[data-end-names]");
  const override = dialog.querySelector("[data-override]");
  const reason = dialog.querySelector("[name=overrideReason]");
  const end = dialog.querySelector("[value=end]");
  let readiness = null;
  let pollTimer = null;

  const render = (next) => {
    readiness = next;
    const decision = endExamImpact(next);
    dialog.querySelector("h2").textContent = decision.title;
    impact.textContent = decision.description;
    names.replaceChildren(...decision.names.map((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      return item;
    }));
    override.hidden = decision.names.length === 0;
    reason.required = decision.names.length > 0;
    end.disabled = decision.names.length > 0 && !reason.value.trim();
  };

  reason.addEventListener("input", () => {
    end.disabled = Boolean(readiness?.unresolvedCandidates?.length) && !reason.value.trim();
  });

  const beginPromise = beginEnd();
  const result = new Promise((resolve) => {
    dialog.addEventListener("close", async () => {
      clearInterval(pollTimer);
      const confirmed = dialog.returnValue === "end";
      const overrideReason = confirmed && readiness?.unresolvedCandidates?.length ? reason.value.trim() : null;
      let cancellationError = null;
      if (!confirmed) {
        try {
          await beginPromise.catch(() => undefined);
          await cancelEnd();
        } catch (error) {
          cancellationError = error instanceof Error ? error : new Error("Could not resume candidate entry");
        }
      }
      dialog.remove();
      requestAnimationFrame(() => { if (trigger.isConnected && !trigger.disabled) trigger.focus(); });
      resolve({ confirmed, overrideReason, cancellationError });
    }, { once: true });
  });

  dialog.showModal();
  void beginPromise.then((initial) => {
    if (!dialog.isConnected) return;
    render(initial);
    pollTimer = setInterval(() => {
      void loadReadiness().then((next) => {
        if (dialog.isConnected) render(next);
      }).catch((error) => {
        if (dialog.isConnected) impact.textContent = `Could not verify candidate saves: ${error.message}. Keep the exam running and try again.`;
      });
    }, 1_000);
  }).catch((error) => {
    if (dialog.isConnected) impact.textContent = `Could not prepare the examination to end: ${error.message}. Keep the exam running and try again.`;
  });
  return result;
}
