import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderUserGuideHtml, userGuideHtmlPath } from "./build-user-guide.ts";

const root = resolve(import.meta.dir, "..");

describe("illustrated user guide", () => {
  test("is generated from the current Markdown source", () => {
    expect(readFileSync(userGuideHtmlPath, "utf8")).toBe(renderUserGuideHtml());
  });

  test("is self-contained, structured, and screenshot-rich", () => {
    const html = readFileSync(userGuideHtmlPath, "utf8");
    expect(html.match(/<h1\b/gu)?.length).toBe(1);
    expect(html.match(/<figure\b/gu)?.length).toBe(9);
    expect(html.match(/src="data:image\/png;base64,/gu)?.length).toBe(10);
    expect(html).toContain('<nav aria-label="Guide sections">');
    expect(html).toContain('<main id="main-content">');
    expect(html).toContain("@media print");
  });

  test("public-facing guides contain no local owner or machine identifiers", () => {
    const paths = ["USER_GUIDE.md", "USER_GUIDE.html", "release/README.md"];
    const forbidden = [/arboghast/iu, /\/Users\//u, /nicholasjgowan/iu, /Insync/iu];
    for (const path of paths) {
      const contents = readFileSync(join(root, path), "utf8");
      for (const pattern of forbidden) expect(contents).not.toMatch(pattern);
    }
  });
});
