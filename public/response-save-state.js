// Track the newest edit, not just whether the last request succeeded. A late
// acknowledgement must never claim that edits made during that request are safe.
export function createResponseSaveState() {
  let revision = 0;
  let serverRevision = 0;
  let deviceRevision = 0;
  let failure = "";
  return {
    edit() { failure = ""; return ++revision; },
    backedUp(ok) { if (ok) deviceRevision = revision; },
    acknowledge(sentRevision) { serverRevision = Math.max(serverRevision, sentRevision); if (serverRevision === revision) failure = ""; },
    fail(message) { failure = message; },
    get revision() { return revision; },
    get pending() { return serverRevision < revision; },
    get unsafe() { return serverRevision < revision && deviceRevision < revision; },
    status() {
      if (serverRevision === revision) return { message: "Saved to server", tone: "saved" };
      if (deviceRevision < revision) return {
        message: "Not saved — keep this page open. Tell your teacher and download a recovery copy.", tone: "error",
      };
      return failure
        ? { message: `${failure} — saved on this device only. Keep this page open and retry.`, tone: "error" }
        : { message: "Saved on this device — awaiting server", tone: "local" };
    },
  };
}

export function downloadResponseRecovery(recovery) {
  const blob = new Blob([JSON.stringify(recovery, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `PacePaper-response-recovery-${recovery.sessionId}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
