/**
 * The address students type. The bare origin is enough: loading it redirects to
 * candidate sign-in, which keeps the projected address short and easy to read.
 */
export function studentConnectionUrl(origin) {
  const base = new URL(String(origin));
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new TypeError("Student connections require an HTTP or HTTPS origin");
  }
  return base.origin;
}

export async function copyStudentConnection(text, {
  clipboard = globalThis.navigator?.clipboard,
  documentRef = globalThis.document,
} = {}) {
  if (typeof clipboard?.writeText === "function") {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard access can be blocked on a non-HTTPS school network.
    }
  }

  if (!documentRef?.body || typeof documentRef.createElement !== "function") return false;
  const previouslyFocused = documentRef.activeElement;
  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  Object.assign(textarea.style, {
    position: "fixed",
    inset: "0 auto auto 0",
    opacity: "0",
    pointerEvents: "none",
  });
  documentRef.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange?.(0, text.length);
  try {
    return Boolean(documentRef.execCommand?.("copy"));
  } catch {
    return false;
  } finally {
    textarea.remove();
    try {
      previouslyFocused?.focus?.();
    } catch {
      // The previous element may have been removed while the copy was running.
    }
  }
}

export function mountStudentConnection(root, {
  origin = globalThis.location?.origin,
  clipboard = globalThis.navigator?.clipboard,
  documentRef = globalThis.document,
} = {}) {
  const link = root.querySelector("[data-student-connection-link]");
  const button = root.querySelector("[data-copy-student-connection]");
  const status = root.querySelector("[data-copy-student-connection-status]");
  if (!link || !button || !status) throw new TypeError("Student connection controls are incomplete");

  const url = studentConnectionUrl(origin);
  link.href = url;
  link.textContent = url;
  const previousHandler = button.__digitalDpStudentConnectionHandler;
  if (previousHandler && typeof button.removeEventListener === "function") {
    button.removeEventListener("click", previousHandler);
  }
  const handler = async () => {
    button.disabled = true;
    const copied = await copyStudentConnection(url, { clipboard, documentRef });
    status.textContent = copied
      ? "Student sign-in URL copied."
      : "Copy is unavailable here. Select the URL and copy it manually.";
    status.dataset.tone = copied ? "success" : "error";
    status.hidden = false;
    button.disabled = false;
  };
  button.addEventListener("click", handler);
  button.__digitalDpStudentConnectionHandler = handler;
  return url;
}
