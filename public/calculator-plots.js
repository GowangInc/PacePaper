import { dataList, oneVariable } from "./calculator-statistics.js";
import { chart, autoBounds, toolCanvas } from "./calculator-chart.js";
import { createToolForm } from "./calculator-tool-form.js";
export function createDataPlots({ list, signal }) {
  const canvas = toolCanvas("Statistical plot; calculate to draw");
  const form = createToolForm({
    title: "Plot data",
    signal,
    note: "Scatter uses matched x/y lists. Histograms and boxplots use the first list. Modified boxplots mark outliers beyond 1.5 IQR.",
    fields: [
      [
        "Plot",
        "scatter",
        [
          ["scatter", "Scatter"],
          ["xyline", "Connected x/y"],
          ["histogram", "Histogram"],
          ["boxplot", "Modified boxplot"],
        ],
      ],
      ["x / data list", "{1,2,3,4,5}"],
      ["y list (scatter / connected only)", "{1,4,9,16,25}"],
      ["Number of equal-width bins (histogram)", "5"],
    ],
    calculate: ([kind, first, second, bins]) => {
      const xs = dataList(list(first));
      if (["scatter", "xyline"].includes(kind)) {
        const ys = dataList(list(second));
        if (xs.length !== ys.length)
          throw new Error("x and y counts must match.");
        const c = chart(canvas, autoBounds(xs, ys));
        c.ctx.strokeStyle = c.ctx.fillStyle = "#245da8";
        c.ctx.lineWidth = 1.5;
        xs.forEach((v, i) => {
          if (kind === "xyline" && i) {
            c.ctx.beginPath();
            c.ctx.moveTo(c.x(xs[i - 1]), c.y(ys[i - 1]));
            c.ctx.lineTo(c.x(v), c.y(ys[i]));
            c.ctx.stroke();
          }
          c.ctx.beginPath();
          c.ctx.arc(c.x(v), c.y(ys[i]), 3, 0, 2 * Math.PI);
          c.ctx.fill();
        });
        c.done();
        canvas.setAttribute(
          "aria-label",
          `${kind}: ${xs.length} matched points`,
        );
        return `${xs.length} matched points. x: ${xs.join(", ")}; y: ${ys.join(", ")}`;
      }
      const summary = oneVariable(xs),
        sorted = [...xs].sort((a, b) => a - b);
      if (kind === "histogram") {
        const count = Number(bins);
        if (!Number.isInteger(count) || count < 1 || count > 50)
          throw new Error("Use 1–50 bins.");
        const lower = summary.min,
          span = summary.max - lower || 1,
          width = span / count,
          frequencies = Array(count).fill(0);
        xs.forEach((v) => {
          frequencies[Math.min(count - 1, Math.floor((v - lower) / width))]++;
        });
        const c = chart(canvas, [
          lower,
          lower + span,
          0,
          Math.max(...frequencies) * 1.1,
        ]);
        c.ctx.fillStyle = "#5790c4";
        c.ctx.strokeStyle = "#245da8";
        frequencies.forEach((v, i) => {
          const px = c.x(lower + i * width),
            py = c.y(v),
            w = c.x(lower + (i + 1) * width) - px;
          c.ctx.fillRect(px, py, w, c.y(0) - py);
          c.ctx.strokeRect(px, py, w, c.y(0) - py);
        });
        c.done();
        canvas.setAttribute(
          "aria-label",
          `Histogram: ${count} bins with counts ${frequencies.join(", ")}`,
        );
        return frequencies
          .map(
            (v, i) =>
              `[${lower + i * width}, ${lower + (i + 1) * width}${i === count - 1 ? "]" : ")"}: ${v}`,
          )
          .join("\n");
      }
      const iqr = summary.q3 - summary.q1,
        inside = sorted.filter(
          (v) => v >= summary.q1 - 1.5 * iqr && v <= summary.q3 + 1.5 * iqr,
        ),
        outliers = sorted.filter((v) => !inside.includes(v));
      const c = chart(canvas, [...autoBounds(xs, [0, 1]).slice(0, 2), 0, 1]);
      c.ctx.strokeStyle = c.ctx.fillStyle = "#245da8";
      c.ctx.lineWidth = 1.5;
      c.ctx.strokeRect(
        c.x(summary.q1),
        c.y(0.7),
        c.x(summary.q3) - c.x(summary.q1),
        c.y(0.3) - c.y(0.7),
      );
      for (const v of [inside[0], summary.median, inside.at(-1)]) {
        c.ctx.beginPath();
        c.ctx.moveTo(c.x(v), c.y(0.3));
        c.ctx.lineTo(c.x(v), c.y(0.7));
        c.ctx.stroke();
      }
      c.ctx.beginPath();
      c.ctx.moveTo(c.x(inside[0]), c.y(0.5));
      c.ctx.lineTo(c.x(summary.q1), c.y(0.5));
      c.ctx.moveTo(c.x(summary.q3), c.y(0.5));
      c.ctx.lineTo(c.x(inside.at(-1)), c.y(0.5));
      c.ctx.stroke();
      outliers.forEach((v) => {
        c.ctx.beginPath();
        c.ctx.arc(c.x(v), c.y(0.5), 3, 0, 2 * Math.PI);
        c.ctx.fill();
      });
      c.done();
      canvas.setAttribute(
        "aria-label",
        `Boxplot: Q1 ${summary.q1}, median ${summary.median}, Q3 ${summary.q3}, ${outliers.length} outliers`,
      );
      return {
        lowerWhisker: inside[0],
        q1: summary.q1,
        median: summary.median,
        q3: summary.q3,
        upperWhisker: inside.at(-1),
        outliers: outliers.length ? `{${outliers.join(", ")}}` : "none",
      };
    },
  });
  form.section.append(canvas);
  function update() {
    const kind = form.inputs[0].value;
    form.inputs[2].parentElement.hidden = !["scatter", "xyline"].includes(kind);
    form.inputs[3].parentElement.hidden = kind !== "histogram";
  }
  form.inputs[0].addEventListener("change", update, { signal });
  update();
  return form;
}
