import { compileExpression } from "./calculator-engine.js";
import { numericalDerivative, numericalIntegral, numericalRoots } from "./calculator-numeric.js";

import { createToolForm } from "./calculator-tool-form.js";

export function createNumericalTools({ mode, getVariables, signal }) {
  const tool = (title, fields, calculate) => createToolForm({ title, fields, calculate, signal }).section;
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
