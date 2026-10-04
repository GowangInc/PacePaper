import { real, formatValue } from "./calculator-values.js";
import { createToolForm } from "./calculator-tool-form.js";
import { chart, toolCanvas } from "./calculator-chart.js";
export function createCurveTool({ compile, getVariables, mode, signal }) {
  const canvas = toolCanvas("Parametric, polar or explicit sequence plot");
  const trace = document.createElement("output");
  trace.setAttribute("aria-live", "polite");
  const table = document.createElement("table");
  table.className = "calculator-value-table";
  let points = [],
    index = 0,
    geometry,
    image;
  const number = (s) => real(compile(s)(getVariables()));
  function drawTrace() {
    if (!geometry || !image || !points.length) return;
    geometry.ctx.putImageData(image, 0, 0);
    const point = points[index];
    trace.textContent = `Trace: ${point.parameterName} = ${formatValue(point.t)}, x = ${formatValue(point.x)}, y = ${formatValue(point.y)}`;
    geometry.ctx.fillStyle = "#b84628";
    geometry.ctx.beginPath();
    geometry.ctx.arc(
      geometry.x(point.x),
      geometry.y(point.y),
      4,
      0,
      Math.PI * 2,
    );
    geometry.ctx.fill();
  }
  const form = createToolForm({
    title: "Plot curve",
    signal,
    note: "Trace with ←/→ or click a point. Sequence mode plots an explicit expression in n. The table shows every sampled value (maximum 1000).",
    fields: [
      [
        "Mode",
        "parametric",
        [
          ["parametric", "Parametric x(t), y(t)"],
          ["polar", "Polar r(θ)"],
          ["sequence", "Explicit sequence u(n)"],
        ],
      ],
      ["x(t) / r(θ) / u(n)", "cos(t)"],
      ["y(t) (parametric only)", "sin(t)"],
      ["Parameter start", "0"],
      ["Parameter end", "2*pi"],
      ["Parameter step", ".05"],
      ["x minimum", "-2"],
      ["x maximum", "2"],
      ["y minimum", "-2"],
      ["y maximum", "2"],
    ],
    calculate: ([kind, first, second, start, end, step, ...bounds]) => {
      const a = number(start),
        b = number(end),
        h = number(step),
        count = Math.floor((b - a) / h + 1e-12) + 1;
      if (
        !h ||
        (b - a) / h < 0 ||
        !Number.isFinite(count) ||
        count < 1 ||
        count > 1000
      )
        throw new Error("Use a step toward the end, with 1–1000 samples.");
      if (kind === "sequence" && ![a, b, h].every(Number.isInteger))
        throw new Error("Sequence indices and step must be integers.");
      const f = compile(first),
        g = kind === "parametric" ? compile(second) : null;
      const plotted = [],
        rows = [];
      let gaps = 0;
      for (let k = 0; k < count; k++) {
        const t = a + k * h,
          variables = { ...getVariables(), t, theta: t, n: t };
        try {
          const v = real(f(variables)),
            angle = t * (mode.value === "degree" ? Math.PI / 180 : 1);
          const x =
              kind === "parametric"
                ? v
                : kind === "polar"
                  ? v * Math.cos(angle)
                  : t,
            y =
              kind === "parametric"
                ? real(g(variables))
                : kind === "polar"
                  ? v * Math.sin(angle)
                  : v;
          if (![x, y].every(Number.isFinite))
            throw new Error("Undefined point.");
          const p = {
            t,
            x,
            y,
            k,
            parameterName:
              kind === "sequence" ? "n" : kind === "polar" ? "θ" : "t",
          };
          plotted.push(p);
          rows.push(p);
        } catch {
          gaps++;
          rows.push({ t, undefined: true });
        }
      }
      if (!plotted.length)
        throw new Error("No real points in this parameter range.");
      const c = chart(canvas, bounds.map(number));
      c.ctx.strokeStyle = c.ctx.fillStyle = "#245da8";
      c.ctx.lineWidth = 1.5;
      plotted.forEach((p, i) => {
        if (
          kind !== "sequence" &&
          i &&
          p.k === plotted[i - 1].k + 1 &&
          Math.hypot(
            c.x(p.x) - c.x(plotted[i - 1].x),
            c.y(p.y) - c.y(plotted[i - 1].y),
          ) < c.w
        ) {
          c.ctx.beginPath();
          c.ctx.moveTo(c.x(plotted[i - 1].x), c.y(plotted[i - 1].y));
          c.ctx.lineTo(c.x(p.x), c.y(p.y));
          c.ctx.stroke();
        } else {
          c.ctx.beginPath();
          c.ctx.arc(c.x(p.x), c.y(p.y), 2, 0, Math.PI * 2);
          c.ctx.fill();
        }
      });
      c.done();
      points = plotted;
      index = 0;
      geometry = c;
      image = c.ctx.getImageData(0, 0, canvas.width, canvas.height);
      table.replaceChildren();
      const caption = document.createElement("caption");
      caption.textContent = "Sampled values";
      table.append(caption);
      const header = document.createElement("tr");
      for (const text of [points[0].parameterName, "x", "y"]) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = text;
        header.append(th);
      }
      table.append(header);
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        for (const value of [
          formatValue(row.t),
          row.undefined ? "undefined" : formatValue(row.x),
          row.undefined ? "undefined" : formatValue(row.y),
        ]) {
          const td = document.createElement("td");
          td.textContent = value;
          tr.append(td);
        }
        table.append(tr);
      });
      canvas.setAttribute(
        "aria-label",
        `${kind} plot: ${points.length} defined samples; value table below`,
      );
      drawTrace();
      return `${points.length} defined points${gaps ? `; ${gaps} undefined samples` : ""}.`;
    },
  });
  const details = document.createElement("details"),
    summary = document.createElement("summary");
  summary.textContent = "Value table";
  details.append(summary, table);
  form.section.append(canvas, trace, details);
  function update() {
    const kind = form.inputs[0].value;
    form.inputs[1].parentElement.firstChild.textContent =
      kind === "parametric" ? "x(t)" : kind === "polar" ? "r(theta)" : "u(n)";
    form.inputs[2].parentElement.hidden = kind !== "parametric";
  }
  form.inputs[0].addEventListener("change", update, { signal });
  update();
  canvas.addEventListener(
    "keydown",
    (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key) || !points.length)
        return;
      event.preventDefault();
      index = Math.max(
        0,
        Math.min(
          points.length - 1,
          index + (event.key === "ArrowLeft" ? -1 : 1),
        ),
      );
      drawTrace();
    },
    { signal },
  );
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (!points.length) return;
      const rect = canvas.getBoundingClientRect(),
        px = ((event.clientX - rect.left) / rect.width) * geometry.w,
        py = ((event.clientY - rect.top) / rect.height) * geometry.h;
      let best = Infinity;
      points.forEach((p, i) => {
        const d = Math.hypot(geometry.x(p.x) - px, geometry.y(p.y) - py);
        if (d < best) {
          best = d;
          index = i;
        }
      });
      canvas.focus();
      drawTrace();
    },
    { signal },
  );
  return form;
}
