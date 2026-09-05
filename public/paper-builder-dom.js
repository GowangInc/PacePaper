export function field(tag, attributes, text) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes ?? {})) {
    if (name === "className") element.className = value;
    else if (name === "value") element.value = value;
    else element.setAttribute(name, value);
  }
  if (text !== undefined) element.textContent = text;
  return element;
}

export function option(value, label) {
  return field("option", { value }, label);
}

export function responseFields(question, prefix) {
  const container = field("div", { className: "builder-response-settings" });
  if (question.type === "single-choice") {
    const label = field("label", { for: `${prefix}-options` }, "Answer choices — one per line");
    const textarea = field("textarea", { id: `${prefix}-options`, rows: "4", required: "", maxlength: "2000" });
    textarea.value = question.options;
    textarea.addEventListener("input", () => { question.options = textarea.value; });
    container.append(label, textarea);
  } else if (question.type === "essay") {
    const pair = field("div", { className: "inline-fields" });
    const minimumLabel = field("label", { for: `${prefix}-minimum` }, "Minimum words");
    const minimum = field("input", { id: `${prefix}-minimum`, type: "number", min: "1", max: "10000", value: question.wordCountMin });
    const maximumLabel = field("label", { for: `${prefix}-maximum` }, "Maximum words");
    const maximum = field("input", { id: `${prefix}-maximum`, type: "number", min: "1", max: "10000", value: question.wordCountMax });
    minimum.addEventListener("input", () => { question.wordCountMin = minimum.value; });
    maximum.addEventListener("input", () => { question.wordCountMax = maximum.value; });
    minimumLabel.append(minimum);
    maximumLabel.append(maximum);
    pair.append(minimumLabel, maximumLabel);
    container.append(pair);
  } else if (question.type === "ink") {
    const pair = field("div", { className: "inline-fields" });
    const pagesLabel = field("label", { for: `${prefix}-pages` }, "Canvas pages");
    const pages = field("select", { id: `${prefix}-pages` });
    [1, 2, 3, 4].forEach((value) => pages.append(option(String(value), String(value))));
    pages.value = String(question.inkPages);
    const backgroundLabel = field("label", { for: `${prefix}-background` }, "Default canvas background");
    const background = field("select", { id: `${prefix}-background` });
    background.append(option("blank", "Blank"), option("lined", "Ruled"), option("square-grid", "Square grid"));
    background.value = question.inkBackground;
    pages.addEventListener("change", () => { question.inkPages = Number(pages.value); });
    background.addEventListener("change", () => { question.inkBackground = background.value; });
    pagesLabel.append(pages);
    backgroundLabel.append(background);
    pair.append(pagesLabel, backgroundLabel);
    const help = field("small", {}, "Students start with this background and can change it only after confirming the change; their writing remains intact. A typed alternative remains available for accessibility.");
    container.append(pair, help);
  }
  return container;
}
