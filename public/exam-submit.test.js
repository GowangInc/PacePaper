import { describe, expect, test } from "bun:test";

const source = await Bun.file(new URL("./exam.js", import.meta.url)).text();
const styles = await Bun.file(new URL("./styles.css", import.meta.url)).text();

describe("student examination submission controls", () => {
  test("keeps submit visible in the primary tools and examination footer", () => {
    expect(source.match(/<button data-submit-exam/g)?.length).toBe(2);
    expect(source).toContain('class="submit-tool"');
    expect(source).toContain('class="submit-action"');
  });

  test("keeps all visible submit controls in the confirmation flow", () => {
    expect(source).toContain('querySelectorAll("[data-submit-exam]")');
    expect(source).toContain('addEventListener("click", openSubmitDialog');
  });

  test("keeps the footer in its grid row when reading time is hidden", () => {
    expect(styles).toContain('"exam-topbar"\n    "reading-banner"\n    "exam-workspace"\n    "exam-footer"');
    expect(styles).toContain(".exam-workspace {\n  grid-area: exam-workspace;");
    expect(styles).toContain(".exam-footer {\n  grid-area: exam-footer;");
  });
});
