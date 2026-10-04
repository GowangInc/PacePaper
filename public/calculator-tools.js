import { compileExpression, numericalDerivative, numericalIntegral, numericalRoots } from "./calculator.js";

export function createNumericalTools({ mode, getVariables, signal }) {
  function tool(title, fields, calculate) {
    const section = document.createElement("section");
    section.className = "calculator-numeric-tool";
    const inputs = fields.map(([name, initial]) => {
      const label = document.createElement("label");
      label.textContent = name;
      const input = document.createElement("input");
      input.value = initial;
      input.type = "text";
      input.spellcheck = false;
      input.maxLength = 200;
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
    button.addEventListener("click", () => {
      try {
        const result = calculate(inputs.map((input) => input.value));
        output.textContent = typeof result === "number" ? Number(result.toPrecision(12)).toString() : result;
        delete output.dataset.error;
      } catch (error) { output.textContent = error.message; output.dataset.error = "true"; }
    }, { signal });
    section.append(button, output);
    return section;
  }
  const numeric = (value) => {
    const result = compileExpression(value, mode.value)(getVariables());
    if (!Number.isFinite(result)) throw new Error("Enter a finite value.");
    return result;
  };
  const fn = (source) => { const compiled = compileExpression(source, mode.value); return (x) => compiled({ ...getVariables(), x }); };
  return {
    solver: tool("Solve", [["Equation in x", "x^2=4"], ["Lower bound", "0"], ["Upper bound", "10"]], ([equation, lower, upper]) => {
      const sides = equation.split("=");
      if (sides.length !== 2 || sides.some((side) => !side.trim())) throw new Error("Enter an equation such as x^2=4.");
      const left = fn(sides[0]), right = fn(sides[1]);
      const roots = numericalRoots((x) => left(x) - right(x), numeric(lower), numeric(upper));
      return roots.length ? `x = ${roots.map((value) => Number(value.toPrecision(12))).join(", ")}` : "No root found in these bounds.";
    }),
    derivative: tool("Calculate derivative", [["Expression in x", "x^2"], ["At x", "1"]], ([expression, x]) => numericalDerivative(fn(expression), numeric(x))),
    integral: tool("Calculate integral", [["Expression in x", "x^2"], ["Lower bound", "0"], ["Upper bound", "1"]], ([expression, lower, upper]) => numericalIntegral(fn(expression), numeric(lower), numeric(upper))),
  };
}
