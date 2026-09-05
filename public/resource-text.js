// Deliberately not a Markdown/HTML renderer: only explicit, rectangular pipe tables.
function cells(line) {
  const value = line.trim();
  if (!value.includes("|") || value.includes("\\|")) return null;
  const parts = value.split("|");
  if (!parts[0].trim()) parts.shift();
  if (!parts.at(-1).trim()) parts.pop();
  return parts.length >= 2 ? parts.map(part => part.trim()) : null;
}

export function parseResourceText(text) {
  const lines = text.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) ?? [];
  const blocks = [];
  let plainStart = 0;
  for (let line = 0; line < lines.length - 1; line += 1) {
    const headers = cells(lines[line]);
    const separator = cells(lines[line + 1]);
    if (!headers || !separator || headers.length !== separator.length
      || !headers.some(Boolean) || !separator.every(value => /^:?-{3,}:?$/.test(value))) continue;
    const rows = [];
    let end = line + 2;
    let valid = true;
    while (end < lines.length && lines[end].trim() && lines[end].includes("|")) {
      const row = cells(lines[end]);
      if (!row || row.length !== headers.length) valid = false;
      rows.push(row);
      end += 1;
    }
    if (valid && rows.length) {
      if (line > plainStart) blocks.push({ kind: "text", text: lines.slice(plainStart, line).join(""), line: plainStart });
      blocks.push({ kind: "table", headers, rows, line });
      plainStart = end;
    }
    line = end - 1;
  }
  if (plainStart < lines.length) blocks.push({ kind: "text", text: lines.slice(plainStart).join(""), line: plainStart });
  return blocks;
}

/** Decorators receive a stable scope and plain text; the normal resource scope stays unchanged. */
export function renderResourceText(container, text, { decorate, scope = "resource", label = "Resource" } = {}) {
  const value = typeof text === "string" ? text : "";
  const blocks = parseResourceText(value);
  const putText = (element, key, content) => {
    if (decorate) decorate(element, key, content);
    else element.textContent = content;
  };
  if (!blocks.some(block => block.kind === "table")) {
    container.classList.remove("formatted-resource-text");
    putText(container, scope, value);
    return container;
  }
  const documentRef = container.ownerDocument;
  container.replaceChildren();
  container.removeAttribute("data-highlight-scope");
  container.classList.add("formatted-resource-text");
  let tableNumber = 0;
  for (const block of blocks) {
    if (block.kind === "text") {
      const prose = documentRef.createElement("div");
      prose.className = "resource-text-prose";
      putText(prose, `${scope}:text:${block.line}`, block.text);
      container.append(prose);
      continue;
    }
    const name = `${label} — table ${++tableNumber}`;
    const scroll = documentRef.createElement("div");
    scroll.className = "resource-text-table-scroll";
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", name);
    const table = documentRef.createElement("table");
    table.className = "resource-text-table";
    const caption = documentRef.createElement("caption");
    caption.textContent = name;
    table.append(caption);
    const head = documentRef.createElement("thead");
    const headerRow = documentRef.createElement("tr");
    block.headers.forEach((content, column) => {
      const cell = documentRef.createElement("th");
      cell.setAttribute("scope", "col");
      putText(cell, `${scope}:table:${block.line}:header:${column}`, content);
      headerRow.append(cell);
    });
    head.append(headerRow);
    const body = documentRef.createElement("tbody");
    block.rows.forEach((values, row) => {
      const tr = documentRef.createElement("tr");
      values.forEach((content, column) => {
        const cell = documentRef.createElement("td");
        putText(cell, `${scope}:table:${block.line}:row:${row}:cell:${column}`, content);
        tr.append(cell);
      });
      body.append(tr);
    });
    table.append(head, body);
    scroll.append(table);
    container.append(scroll);
  }
  return container;
}
