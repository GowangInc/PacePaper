import { formatValue } from "./calculator-values.js";
export function resultText(result) {
  if (typeof result === "string") return result;
  if (typeof result === "number" || Array.isArray(result) || result?.kind)
    return formatValue(result);
  return Object.entries(result)
    .filter(([, v]) => v !== undefined && typeof v !== "function")
    .map(
      ([key, value]) =>
        `${key}: ${value === null ? "undefined" : typeof value === "string" ? value : formatValue(value)}`,
    )
    .join("\n");
}
export function createToolForm({
  title,
  fields,
  calculate,
  signal,
  note = "",
  initial = [],
  onChange = () => {},
  store,
}) {
  const section = document.createElement("section");
  section.className = "calculator-numeric-tool";
  if (note) {
    const p = document.createElement("p");
    p.className = "calculator-tool-note";
    p.textContent = note;
    section.append(p);
  }
  const inputs = fields.map(([name, value, options], index) => {
    const label = document.createElement("label");
    label.textContent = name;
    const input = document.createElement(options ? "select" : "input");
    if (options)
      for (const [key, text] of options) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = text;
        input.append(option);
      }
    else {
      input.type = "text";
      input.spellcheck = false;
      input.maxLength = 1000;
      input.autocapitalize = "off";
    }
    input.value = initial[index] ?? value;
    if (options && input.selectedIndex < 0) input.value = value;
    input.addEventListener("input", onChange, { signal });
    input.addEventListener("change", onChange, { signal });
    label.append(input);
    section.append(label);
    return input;
  });
  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-action";
  button.textContent = title;
  const output = document.createElement("output");
  output.setAttribute("aria-live", "polite");
  output.className = "calculator-tool-result";
  let lastResult;
  const calculateNow = () => {
    try {
      lastResult = calculate(inputs.map((input) => input.value));
      output.textContent = resultText(lastResult);
      delete output.dataset.error;
    } catch (error) {
      lastResult = undefined;
      output.textContent = error.message;
      output.dataset.error = "true";
    }
  };
  button.addEventListener("click", calculateNow, { signal });
  section.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        event.target instanceof HTMLInputElement &&
        !event.defaultPrevented
      ) {
        event.preventDefault();
        calculateNow();
      }
    },
    { signal },
  );
  section.append(button, output);
  if (store) {
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = store.label;
    save.addEventListener(
      "click",
      () => {
        try {
          if (lastResult === undefined)
            throw new Error("Calculate a result first.");
          store.run(lastResult);
          output.textContent += `\n${store.message}`;
        } catch (error) {
          output.textContent = error.message;
          output.dataset.error = "true";
        }
      },
      { signal },
    );
    section.append(save);
  }
  return { section, inputs, state: () => inputs.map((input) => input.value) };
}
