// Small canvas renderer shared by statistical and parameter-based plots.
export function chart(canvas, bounds) {
  const [xmin, xmax, ymin, ymax] = bounds;
  if (!bounds.every(Number.isFinite) || xmin >= xmax || ymin >= ymax)
    throw new Error("Use finite graph bounds with minima below maxima.");
  const w = Math.max(240, Math.min(700, canvas.clientWidth || 320)),
    h = Math.round(w * 0.65),
    ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#f7f7f2";
  ctx.fillRect(0, 0, w, h);
  const x = (v) => 30 + ((v - xmin) / (xmax - xmin)) * (w - 40),
    y = (v) => h - 25 - ((v - ymin) / (ymax - ymin)) * (h - 35);
  ctx.font = "10px sans-serif";
  ctx.strokeStyle = "#c9cdd4";
  ctx.fillStyle = "#434a53";
  for (let k = 0; k <= 4; k++) {
    const a = xmin + ((xmax - xmin) * k) / 4,
      b = ymin + ((ymax - ymin) * k) / 4;
    ctx.beginPath();
    ctx.moveTo(x(a), 10);
    ctx.lineTo(x(a), h - 25);
    ctx.moveTo(30, y(b));
    ctx.lineTo(w - 10, y(b));
    ctx.stroke();
    ctx.fillText(Number(a.toPrecision(3)).toString(), x(a) - 8, h - 8);
    ctx.fillText(Number(b.toPrecision(3)).toString(), 0, y(b) + 3);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(30, 10, w - 40, h - 35);
  ctx.clip();
  return { ctx, x, y, w, h, done: () => ctx.restore() };
}
export function autoBounds(xs, ys) {
  function extent(v) {
    const min = Math.min(...v),
      max = Math.max(...v),
      pad = (max - min || Math.max(1, Math.abs(min)) * 0.2) * 0.1;
    return [min - pad, max + pad];
  }
  return [...extent(xs), ...extent(ys)];
}
export function toolCanvas(label) {
  const canvas = document.createElement("canvas");
  canvas.className = "calculator-tool-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  return canvas;
}
