import qrcodegen from "./qrcodegen.js";

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

const QR_QUIET_ZONE_MODULES = 4;
const QR_DISPLAY_TARGET_PX = 192;
const QR_PNG_MODULE_PX = 8;

function isLoopbackUrl(url) {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("127.")
  );
}

function drawStudentQrCanvas(documentRef, matrix, modulePx) {
  const totalModules = matrix.size + QR_QUIET_ZONE_MODULES * 2;
  const canvas = documentRef.createElement("canvas");
  canvas.width = canvas.height = totalModules * modulePx;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.getModule(x, y)) {
        context.fillRect(
          (x + QR_QUIET_ZONE_MODULES) * modulePx,
          (y + QR_QUIET_ZONE_MODULES) * modulePx,
          modulePx,
          modulePx,
        );
      }
    }
  }
  return canvas;
}

function studentQrMatrix(url) {
  return qrcodegen.QrCode.encodeText(url, qrcodegen.QrCode.Ecc.MEDIUM);
}

function ensureStudentQrCanvas(state) {
  if (!state.matrix) state.matrix = studentQrMatrix(state.url);
  if (state.canvas) return;
  const modulePx = Math.max(
    2,
    Math.floor(QR_DISPLAY_TARGET_PX / (state.matrix.size + QR_QUIET_ZONE_MODULES * 2)),
  );
  state.canvas = drawStudentQrCanvas(state.documentRef, state.matrix, modulePx);
  if (typeof state.imageHost.replaceChildren === "function") {
    state.imageHost.replaceChildren(state.canvas);
  } else {
    state.imageHost.textContent = "";
    state.imageHost.append(state.canvas);
  }
}

function clearStudentQrCanvas(state) {
  state.canvas = null;
  if (typeof state.imageHost.replaceChildren === "function") {
    state.imageHost.replaceChildren();
  } else {
    state.imageHost.textContent = "";
  }
}

function reportStudentQrError(state, message) {
  if (!state.status) return;
  state.status.textContent = message;
  state.status.dataset.tone = "error";
  state.status.hidden = false;
}

async function downloadStudentQr(state) {
  try {
    if (!state.matrix) state.matrix = studentQrMatrix(state.url);
    const pngCanvas = drawStudentQrCanvas(state.documentRef, state.matrix, QR_PNG_MODULE_PX);
    const blob = await new Promise((resolve, reject) => {
      if (typeof pngCanvas.toBlob !== "function") {
        reject(new Error("Canvas PNG export is unavailable here"));
        return;
      }
      pngCanvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("Canvas PNG export failed"));
      }, "image/png");
    });
    const objectUrl = URL.createObjectURL(blob);
    try {
      const anchor = state.documentRef.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "student-join-qr.png";
      (state.documentRef.body ?? state.imageHost).append(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    reportStudentQrError(state, "Could not create the QR image. Copy the link instead.");
  }
}

function mountStudentQr(details, { url, available, documentRef, status }) {
  const summary = details.querySelector("summary");
  const imageHost = details.querySelector("[data-student-qr-image]");
  const downloadButton = details.querySelector("[data-download-student-qr]");
  if (!summary || !imageHost || !downloadButton) return;

  let state = details.__digitalDpStudentQrState;
  if (!state || state.url !== url) {
    state = { url, matrix: null, canvas: null, summary, imageHost, downloadButton, documentRef, status };
    details.__digitalDpStudentQrState = state;
    // A new address makes any previous image stale; drop it even while closed.
    clearStudentQrCanvas(state);
  } else {
    state.documentRef = documentRef;
    state.status = status;
  }

  if (!details.__digitalDpStudentQrHandlers) {
    const toggleHandler = () => {
      const current = details.__digitalDpStudentQrState;
      if (!current) return;
      if (details.open) {
        ensureStudentQrCanvas(current);
        current.summary.textContent = "Hide QR code";
      } else {
        current.summary.textContent = "Show QR code";
      }
    };
    const downloadHandler = () => downloadStudentQr(details.__digitalDpStudentQrState);
    if (typeof details.addEventListener === "function") details.addEventListener("toggle", toggleHandler);
    if (typeof downloadButton.addEventListener === "function") downloadButton.addEventListener("click", downloadHandler);
    details.__digitalDpStudentQrHandlers = { toggleHandler, downloadHandler };
  }

  if (!available || isLoopbackUrl(url)) {
    // Loopback or sharing-off: no scannable address exists, so hide and close
    // the panel and drop any stale render.
    details.hidden = true;
    details.open = false;
    state.matrix = null;
    clearStudentQrCanvas(state);
    summary.textContent = "Show QR code";
    return;
  }

  details.hidden = false;
  // Never touch details.open on a same-address re-mount: an open panel stays open.
  if (details.open) {
    ensureStudentQrCanvas(state);
    summary.textContent = "Hide QR code";
  } else {
    summary.textContent = "Show QR code";
  }
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
  available = true,
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

  // The QR panel is optional markup: pages without it keep the link and copy
  // button exactly as before.
  const qrDetails = root.querySelector("[data-student-qr]");
  if (qrDetails) mountStudentQr(qrDetails, { url, available, documentRef, status });

  return url;
}
