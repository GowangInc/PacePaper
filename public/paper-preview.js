import { renderResourceText } from "./resource-text.js";

const RESPONSE_NAMES = {
  essay: "Long typed response",
  short: "Short typed response",
  "single-choice": "Multiple-choice response",
  ink: "Digital working canvas",
};

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function metadata(label, value) {
  const item = node("div", "paper-preview-meta-item");
  item.append(node("dt", "", label), node("dd", "", value));
  return item;
}

function fileLabel(resource) {
  const kind = resource.kind === "document" ? "PDF" : resource.kind === "audio" ? "Audio" : "Image";
  const playLimit = resource.kind === "audio" && resource.maxPlays
    ? ` · ${resource.maxPlays} complete plays · no pause or restart`
    : "";
  return `${kind} · ${resource.name}${playLimit}`;
}

function responseArea(question) {
  const wrapper = node("div", "paper-preview-response");
  const label = node("p", "paper-preview-response-label", RESPONSE_NAMES[question.type] ?? "Student response");
  wrapper.dataset.responseType = question.type;
  wrapper.append(label);

  if (question.type === "single-choice") {
    const options = node("ul", "paper-preview-options");
    for (const option of question.options) {
      const item = node("li", "");
      item.append(node("span", "paper-preview-option-marker", "○"), node("span", "", option));
      options.append(item);
    }
    wrapper.append(options);
  } else if (question.type === "ink") {
    const pages = node("div", "paper-preview-ink-pages");
    const pageCount = Math.min(4, Math.max(1, Number(question.inkPages) || 1));
    for (let page = 1; page <= pageCount; page += 1) {
      const sheet = node("div", "paper-preview-ink-page");
      sheet.dataset.background = question.inkBackground;
      sheet.setAttribute("aria-label", `Digital working page ${page} of ${pageCount}, ${question.inkBackground} background`);
      sheet.append(node("span", "", `${page}/${pageCount}`));
      pages.append(sheet);
    }
    wrapper.append(pages);
  } else {
    const lines = node("div", "paper-preview-writing-lines");
    lines.setAttribute("aria-hidden", "true");
    wrapper.append(lines);
    if (question.type === "essay" && (question.wordCountMin || question.wordCountMax)) {
      const range = question.wordCountMin && question.wordCountMax
        ? `${question.wordCountMin}–${question.wordCountMax} words`
        : question.wordCountMin
          ? `At least ${question.wordCountMin} words`
          : `Up to ${question.wordCountMax} words`;
      wrapper.append(node("small", "paper-preview-word-range", range));
    }
  }
  return wrapper;
}

export function createPaperPreview(container) {
  const objectUrls = new Map();

  function objectUrl(file) {
    if (!objectUrls.has(file)) objectUrls.set(file, URL.createObjectURL(file));
    return objectUrls.get(file);
  }

  function releaseUnused(activeFiles) {
    for (const [file, url] of objectUrls) {
      if (activeFiles.has(file)) continue;
      URL.revokeObjectURL(url);
      objectUrls.delete(file);
    }
  }

  function mediaItem(resource, activeFiles) {
    if (resource.kind !== "image") return node("li", "paper-preview-file", fileLabel(resource));
    activeFiles.add(resource.file);
    const figure = node("figure", "paper-preview-image");
    const image = document.createElement("img");
    image.src = objectUrl(resource.file);
    image.alt = resource.name;
    figure.append(image, node("figcaption", "", resource.name));
    return figure;
  }

  function render(model) {
    if (!model) {
      container.replaceChildren();
      releaseUnused(new Set());
      return;
    }

    const previousScroll = container.scrollTop;
    const activeFiles = new Set();
    const paper = node("article", "paper-preview-document");
    const header = node("header", "paper-preview-document-header");
    header.append(
      node("p", "paper-preview-kicker", model.examSystem
        ? `DigitalDP · ${model.examSystem} practice preview`
        : "DigitalDP · practice paper preview"),
      node("h4", "", model.title || "Untitled practice paper"),
      node("p", "paper-preview-subject", [model.subject, model.level, model.paper].filter(Boolean).join(" · ")),
    );
    const meta = node("dl", "paper-preview-meta");
    meta.append(
      metadata("Reading", `${model.readingTimeMinutes || 0} min`),
      metadata(model.durationLabel || "Writing", `${model.durationMinutes || 0} min`),
      metadata("Marks", model.maximumMarks ? String(model.maximumMarks) : "Confirm"),
      metadata("Session", model.sessionLabel),
    );
    if (model.deliveryFormat) meta.append(metadata("Format", model.deliveryFormat));
    if (model.subjectWeightPercent) meta.append(metadata("Subject weight", `${model.subjectWeightPercent}%`));
    header.append(meta);
    paper.append(header);

    const instructions = node("section", "paper-preview-instructions");
    instructions.append(node("h5", "", "Instructions"), node("p", "", model.instructions || "Student instructions will appear here."));
    if (model.toolSummary) instructions.append(node("p", "paper-preview-rules", model.toolSummary));
    paper.append(instructions);

    if (model.phases?.length) {
      const phases = node("section", "paper-preview-phases");
      phases.append(node("h5", "", "Timed phase plan"));
      const list = node("ol", "paper-preview-phase-list");
      for (const phase of model.phases) {
        const tools = phase.tools?.length ? ` · ${phase.tools.join(" · ")}` : " · response entry locked";
        list.append(node("li", "", `${phase.label}: ${phase.durationMinutes} min${tools}`));
      }
      phases.append(list);
      paper.append(phases);
    }

    if (model.sourceText || model.sharedResources.length) {
      const resources = node("section", "paper-preview-resources");
      resources.append(node("h5", "", "Paper resources"));
      if (model.sourceText) resources.append(renderResourceText(node("div", "paper-preview-source-text"), model.sourceText, { label: "Paper resources" }));
      if (model.sharedResources.length) {
        const list = node("ul", "paper-preview-files");
        for (const resource of model.sharedResources) list.append(mediaItem(resource, activeFiles));
        resources.append(list);
      }
      paper.append(resources);
    }

    const questionList = node("div", "paper-preview-questions");
    if (!model.questions.length) {
      questionList.append(node("p", "paper-preview-empty", "Add a question to see its wording and student entry area."));
    }
    model.questions.forEach((question, index) => {
      const section = node("section", "paper-preview-question");
      if (question.sectionId) section.dataset.sectionId = question.sectionId;
      const heading = node("header", "paper-preview-question-heading");
      heading.append(
        node("span", "paper-preview-question-number", String(index + 1).padStart(2, "0")),
        node("h5", "", question.label || `Question ${index + 1}`),
      );
      if (question.marks) heading.append(node("span", "paper-preview-marks", `[${question.marks}]`));
      section.append(heading, node("p", "paper-preview-prompt", question.prompt || "Question wording will appear here."));
      if (question.media.length) {
        const media = node("div", "paper-preview-question-media");
        for (const resource of question.media) media.append(mediaItem(resource, activeFiles));
        section.append(media);
      }
      section.append(responseArea(question));
      questionList.append(section);
    });
    paper.append(questionList, node("footer", "paper-preview-footer", "Live authoring preview · final candidate records include submitted responses."));

    container.replaceChildren(paper);
    releaseUnused(activeFiles);
    container.scrollTop = Math.min(previousScroll, Math.max(0, container.scrollHeight - container.clientHeight));
  }

  return {
    render,
    clear() {
      render(null);
    },
  };
}
