import { describe, expect, test } from "bun:test";
import { parseResourceText, renderResourceText } from "./resource-text.js";
import { AP_ENGLISH_SYNTHESIS_SOURCES } from "../examples/sample-source/full-mocks/ap-english-synthesis.ts";

const sample = "Introduction.\n\nMeasure | First | Second\n--- | :---: | ---:\nCost | $10 | $20\nLength | 2 km | 3 km\n\nNotes remain below.\n";

// Match the lightweight DOM fixture pattern used by the other public-module tests.
function fakeDocument() {
  const documentRef = { nodes: [], createElement };
  function createElement(tagName) {
    const attributes = {};
    const node = {
      tagName, ownerDocument: documentRef, children: [], dataset: {}, className: "", textContent: "",
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; this.textContent = ""; },
      setAttribute(name, value) { attributes[name] = value; },
      getAttribute(name) { return attributes[name]; },
      removeAttribute(name) { delete attributes[name]; },
      set innerHTML(_) { throw new Error("Resource text must never be parsed as HTML"); },
    };
    node.classList = {
      add(name) { node.className = [...new Set([...node.className.split(/\s+/).filter(Boolean), name])].join(" "); },
      remove(name) { node.className = node.className.split(/\s+/).filter(value => value !== name).join(" "); },
    };
    documentRef.nodes.push(node);
    return node;
  }
  return documentRef;
}

describe("safe text-resource tables", () => {
  test("parses rectangular tables while retaining exact surrounding prose", () => {
    expect(parseResourceText(sample)).toEqual([
      { kind: "text", text: "Introduction.\n\n", line: 0 },
      { kind: "table", headers: ["Measure", "First", "Second"], rows: [["Cost", "$10", "$20"], ["Length", "2 km", "3 km"]], line: 2 },
      { kind: "text", text: "\nNotes remain below.\n", line: 6 },
    ]);
    const windows = sample.replaceAll("\n", "\r\n");
    expect(parseResourceText(windows)[0].text).toBe("Introduction.\r\n\r\n");
    expect(parseResourceText(windows)[1].rows[0]).toEqual(["Cost", "$10", "$20"]);
  });

  test("accepts optional edge pipes and multiple explicit tables", () => {
    const text = "| A | B |\n| --- | --- |\n| 1 | 2 |\n\nBetween\n\nC | D\n--- | ---\n3 | 4";
    const tables = parseResourceText(text).filter(block => block.kind === "table");
    expect(tables).toHaveLength(2);
    expect(tables.map(table => table.line)).toEqual([0, 6]);
    expect(tables.map(table => table.rows)).toEqual([[["1", "2"]], [["3", "4"]]]);
  });

  test("falls back without losing data for absent separators, escaped pipes and nonrectangular tables", () => {
    for (const text of [
      "A | B\n1 | 2", "x = |a| + |b|\nA simple formula.",
      "A | B\n--- | ---\n1 | 2 | 3", "A | B\n--- | ---\n1 | 2\n3 | 4 | 5",
      "A | B\n--- | --- | ---\n1 | 2", "A | B\n-- | ---\n1 | 2",
      "A | B\n--- | ---\n1 \\| 2 | 3", "A | B\n--- | ---", "<b>Plain</b>\n\ntext",
    ]) {
      const blocks = parseResourceText(text);
      expect(blocks.every(block => block.kind === "text")).toBe(true);
      expect(blocks.map(block => block.text).join("")).toBe(text);
    }
    expect(parseResourceText("")).toEqual([]);
  });

  test("renders the actual six-row AP source as semantic, keyboard-scrollable table cells", () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("article");
    const source = AP_ENGLISH_SYNTHESIS_SOURCES[2];
    renderResourceText(root, source.text, { label: source.label });
    expect(documentRef.nodes.filter(node => node.tagName === "table")).toHaveLength(1);
    const headers = documentRef.nodes.filter(node => node.tagName === "th");
    expect(headers.map(node => node.textContent)).toEqual(["Measure", "Full trail", "Phased trail", "Retain closed"]);
    expect(headers.every(node => node.getAttribute("scope") === "col")).toBe(true);
    const data = documentRef.nodes.filter(node => node.tagName === "td");
    expect(data).toHaveLength(24);
    expect(data.map(node => node.textContent)).toContain("$140000");
    expect(documentRef.nodes.find(node => node.tagName === "caption").textContent).toContain(source.label);
    const scroll = documentRef.nodes.find(node => node.className === "resource-text-table-scroll");
    expect(scroll.tabIndex).toBe(0);
    expect(scroll.getAttribute("role")).toBe("region");
    expect(scroll.getAttribute("aria-label")).toContain(source.label);
    expect(root.children[0].textContent).toContain("invented planning estimates");
    expect(root.children.at(-1).textContent).toContain("not contractor bids");
  });

  test("renders HTML-like values literally without a markup interpretation path", () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const malicious = '<img src=x onerror=alert(1)> | <script>alert(2)</script>\n--- | ---\n<svg onload=alert(3)> | &copy;';
    renderResourceText(root, malicious);
    expect(documentRef.nodes.filter(node => ["img", "script", "svg"].includes(node.tagName))).toHaveLength(0);
    expect(documentRef.nodes.find(node => node.tagName === "th").textContent).toBe("<img src=x onerror=alert(1)>");
    expect(documentRef.nodes.filter(node => node.tagName === "td")[1].textContent).toBe("&copy;");
  });

  test("preserves the old plain-text highlight scope and provides deterministic per-cell scopes", () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("article");
    const seen = [];
    const decorate = (element, scope, text) => { seen.push({ element, scope, text }); element.textContent = text; };
    renderResourceText(root, "Ordinary\ntext", { decorate, scope: "resource:passage" });
    expect(seen).toEqual([{ element: root, scope: "resource:passage", text: "Ordinary\ntext" }]);
    seen.length = 0;
    renderResourceText(root, sample, { decorate, scope: "resource:table" });
    const scopes = seen.map(item => item.scope);
    expect(scopes[0]).toBe("resource:table:text:0");
    expect(scopes).toContain("resource:table:table:2:header:0");
    expect(scopes).toContain("resource:table:table:2:row:1:cell:2");
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(seen.filter(item => ["th", "td"].includes(item.element.tagName))).toHaveLength(9);
    seen.length = 0;
    renderResourceText(root, sample, { decorate, scope: "resource:table" });
    expect(seen.map(item => item.scope)).toEqual(scopes);
  });

  test("student view, authoring preview and candidate print share the renderer and bundled asset", async () => {
    for (const path of ["exam.js", "paper-preview.js", "admin.js"]) {
      const source = await Bun.file(new URL(path, import.meta.url)).text();
      expect(source).toContain('import { renderResourceText } from "./resource-text.js"');
      expect(source).toContain("renderResourceText(");
    }
    const assets = await Bun.file(new URL("../src/static-assets.generated.js", import.meta.url)).text();
    expect(assets).toContain('"public/resource-text.js": resourceText');
    const styles = await Bun.file(new URL("./styles.css", import.meta.url)).text();
    expect(styles.slice(styles.indexOf("@media print"))).toContain("table-layout: fixed");
    expect(styles.slice(styles.indexOf("@media print"))).toContain(".resource-text-table thead { display: table-header-group; }");
  });
});
