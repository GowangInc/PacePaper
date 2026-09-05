import { expect, test } from "bun:test";
import { mockGuidePath, renderMockGuides } from "./build-mock-guides.ts";
import { FULL_MOCKS } from "../examples/sample-source/full-mocks/index.ts";
import { guideStylesheetSource } from "../src/static-files.ts";

test("generated teacher guides are current, complete and script-free", async () => {
  const html = renderMockGuides();
  expect(await Bun.file(mockGuidePath).text()).toBe(html);
  expect(html.match(/<article>/gu)).toHaveLength(FULL_MOCKS.reduce((sum, mock) => sum + mock.marking.length, 0));
  expect(html.match(/<section id="mock-/gu)).toHaveLength(15);
  expect(guideStylesheetSource(html)).toMatch(/^'sha256-/);
  expect(html).not.toMatch(/<script|\sonclick=/iu);
  expect(html).toContain("Teacher-only answers");
  expect(html).toContain("not weighted percentages");
});

test("marking renderer escapes content and refuses missing answers", () => {
  const mock = structuredClone(FULL_MOCKS[0]!);
  mock.marking[0]!.answer = '<script>alert("answer")</script>';
  expect(renderMockGuides([mock])).toContain("&lt;script&gt;");
  expect(renderMockGuides([mock])).not.toContain("<script>");
  mock.marking = [];
  expect(() => renderMockGuides([mock])).toThrow("Missing marking");
});
