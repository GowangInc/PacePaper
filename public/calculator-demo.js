import { setView } from "/app.js";
import { mountExamCalculator } from "./calculator.js";

export function renderCalculatorInspection() {
  document.title = "PacePaper · Calculator inspection";
  setView(`
    <section id="calculator-inspection" class="auth-shell">
      <div class="auth-panel">
        <p class="eyebrow">Local inspection tool</p>
        <h1>Candidate calculator</h1>
        <p>Check the same scientific and graphing calculator that candidates receive on calculator-enabled papers.</p>
        <button id="open-calculator" type="button">Open calculator</button>
        <p><a class="quiet-action" href="/admin">Back to teacher dashboard</a></p>
      </div>
    </section>
  `);
  const controller = new AbortController();
  const calculator = mountExamCalculator(document.querySelector("#calculator-inspection"), {
    signal: controller.signal,
    storageKey: "pacepaper:calculator-inspection",
  });
  document.querySelector("#open-calculator").addEventListener("click", () => calculator.open(), { signal: controller.signal });
  calculator.open();
  return () => controller.abort();
}
