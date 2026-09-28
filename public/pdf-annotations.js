let pdfjs;

async function loadPdfJs() {
  if (!pdfjs) {
    pdfjs = await import("/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjs;
}

function button(label, className = "") {
  const control = document.createElement("button");
  control.type = "button";
  control.className = className;
  control.textContent = label;
  return control;
}

function annotationRects(range, pageElement) {
  const page = pageElement.getBoundingClientRect();
  return [...range.getClientRects()]
    .map((rect) => ({
      x: Math.max(0, (rect.left - page.left) / page.width),
      y: Math.max(0, (rect.top - page.top) / page.height),
      width: Math.min(1, rect.width / page.width),
      height: Math.min(1, rect.height / page.height),
    }))
    .filter((rect) => rect.width > 0 && rect.height > 0);
}

function overlayAnnotation(annotation, pageElement) {
  const overlay = document.createElement("span");
  overlay.className = `pdf-annotation pdf-annotation-${annotation.kind}`;
  overlay.dataset.annotationId = annotation.id;
  if (annotation.kind === "note") overlay.title = annotation.note;
  for (const rect of annotation.rects) {
    const mark = document.createElement("span");
    mark.className = "pdf-annotation-rect";
    mark.style.left = `${rect.x * 100}%`;
    mark.style.top = `${rect.y * 100}%`;
    mark.style.width = `${rect.width * 100}%`;
    mark.style.height = `${rect.height * 100}%`;
    overlay.append(mark);
  }
  pageElement.append(overlay);
}

function stableAnnotation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const kind = value.kind === "note" ? "note" : value.kind === "highlight" ? "highlight" : null;
  if (!kind || typeof value.id !== "string" || typeof value.resourceKey !== "string" || typeof value.page !== "number" || !Array.isArray(value.rects)) return null;
  const rects = value.rects.filter((rect) => rect && typeof rect === "object" &&
    ["x", "y", "width", "height"].every((key) => Number.isFinite(rect[key]))).slice(0, 50);
  if (!rects.length) return null;
  return {
    id: value.id,
    resourceKey: value.resourceKey,
    kind,
    page: Math.max(1, Math.floor(value.page)),
    quote: typeof value.quote === "string" ? value.quote.slice(0, 2_000) : "",
    note: kind === "note" && typeof value.note === "string" ? value.note.slice(0, 2_000) : "",
    rects,
  };
}

export function normalizePdfAnnotations(value) {
  if (!Array.isArray(value)) return [];
  return value.map(stableAnnotation).filter(Boolean).slice(0, 500);
}

export function createPdfAnnotationViewer({ resource, annotations = [], signal, locked = false, readOnly = false, onChange }) {
  const root = document.createElement("section");
  root.className = "pdf-annotation-viewer";
  root.setAttribute("aria-label", `${resource.label} PDF annotation viewer`);
  const toolbar = document.createElement("div");
  toolbar.className = "pdf-annotation-toolbar";
  toolbar.setAttribute("aria-label", "PDF annotation tools");
  const highlight = button("Highlight selection", "compact");
  const note = button("Add note to selection", "compact");
  const status = document.createElement("span");
  status.className = "pdf-annotation-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const canAuthor = !readOnly && !locked;
  highlight.disabled = !canAuthor;
  note.disabled = !canAuthor;
  toolbar.append(highlight, note, status);
  if (!readOnly) root.append(toolbar);
  const pages = document.createElement("div");
  pages.className = "pdf-annotation-pages";
  root.append(pages);
  const state = { annotations: normalizePdfAnnotations(annotations), selection: null };
  let destroyed = false;

  function announce(message) {
    status.textContent = message;
  }
  function update() {
    onChange?.(state.annotations);
  }
  function add(kind) {
    if (readOnly) return;
    if (locked) {
      announce("PDF annotations are locked in this phase.");
      return;
    }
    const selection = state.selection;
    if (!selection) {
      announce("Select text in the PDF first.");
      return;
    }
    let text = "";
    if (kind === "note") {
      text = window.prompt("Note for this selection", "")?.trim() ?? "";
      if (!text) return;
    }
    state.annotations.push({
      id: crypto.randomUUID(),
      resourceKey: resource.key,
      kind,
      page: selection.page,
      quote: selection.quote,
      note: text,
      rects: selection.rects,
    });
    renderOverlays();
    update();
    announce(kind === "note" ? "Note saved." : "Highlight saved.");
    window.getSelection()?.removeAllRanges();
  }
  highlight.addEventListener("click", () => add("highlight"), { signal });
  note.addEventListener("click", () => add("note"), { signal });

  function renderOverlays() {
    pages.querySelectorAll(".pdf-page").forEach((page) => {
      page.querySelectorAll(".pdf-annotation").forEach((item) => item.remove());
      const pageNumber = Number(page.dataset.page);
      for (const annotation of state.annotations.filter((item) => item.page === pageNumber)) {
        overlayAnnotation(annotation, page);
      }
    });
  }

  async function render() {
    try {
      const { getDocument } = await loadPdfJs();
      const documentProxy = await getDocument({ url: resource.url }).promise;
      for (let pageNumber = 1; pageNumber <= documentProxy.numPages && !destroyed; pageNumber += 1) {
        const pdfPage = await documentProxy.getPage(pageNumber);
        const viewport = pdfPage.getViewport({ scale: 1.25 });
        const page = document.createElement("article");
        page.className = "pdf-page";
        page.dataset.page = String(pageNumber);
        page.setAttribute("aria-label", `PDF page ${pageNumber}`);
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.setAttribute("aria-hidden", "true");
        page.append(canvas);
        const textLayer = document.createElement("div");
        textLayer.className = "pdf-text-layer";
        textLayer.addEventListener("pointerup", () => {
          const selection = window.getSelection();
          const quote = selection?.toString().trim() ?? "";
          if (!selection || !quote || selection.rangeCount === 0) return;
          const range = selection.getRangeAt(0);
          if (!page.contains(range.commonAncestorContainer)) return;
          const rects = annotationRects(range, page);
          if (rects.length) {
            state.selection = { page: pageNumber, quote, rects };
            announce("Selection ready for a highlight or note.");
          }
        }, { signal });
        page.append(textLayer);
        pages.append(page);
        await pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        const textContent = await pdfPage.getTextContent();
        await new pdfjs.TextLayer({ textContentSource: textContent, container: textLayer, viewport }).render();
        renderOverlays();
      }
      announce(readOnly ? "Candidate annotations" : locked ? "PDF annotations are locked in this phase." : "Select text to highlight or annotate.");
    } catch {
      pages.replaceChildren();
      announce("This PDF could not be rendered for annotation.");
      const fallback = document.createElement("iframe");
      fallback.src = resource.url;
      fallback.title = resource.label;
      pages.append(fallback);
    }
  }
  render();
  signal?.addEventListener("abort", () => { destroyed = true; }, { once: true });
  return root;
}
