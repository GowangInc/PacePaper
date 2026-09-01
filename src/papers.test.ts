import { describe, expect, test } from "bun:test";
import { parseManifest, parsePaperUpload, sanitizeRichText } from "./papers";

const manifest = {
  version: 1,
  title: "History source analysis",
  subject: "history",
  subjectLabel: "History",
  level: "SL/HL",
  paper: "Paper 1",
  durationMinutes: 60,
  mode: "reading",
  instructions: "Read the source and answer every question.",
  selectionMode: "all",
  resources: [{ key: "source-a", label: "Source A", kind: "text", text: "A primary source." }],
  questions: [{ id: "q1", label: "Question 1", prompt: "What is the source's purpose?", type: "short", resourceKeys: ["source-a"] }],
};

describe("paper manifests", () => {
  test("accepts subject-extensible manifests", () => {
    expect(parseManifest(manifest)).toMatchObject({ subject: "history", subjectLabel: "History" });
  });

  test("rejects questions that reference missing resources", () => {
    expect(() => parseManifest({
      ...manifest,
      questions: [{ ...manifest.questions[0], resourceKeys: ["missing"] }],
    })).toThrow("references unknown resource missing");
  });
});

describe("paper uploads", () => {
  test("builds a one-response writing paper from a PDF", async () => {
    const form = new FormData();
    form.set("format", "quick");
    form.set("title", "English A practice paper");
    form.set("subject", "english-a-language-literature");
    form.set("level", "SL");
    form.set("paper", "Paper 1");
    form.set("durationMinutes", "75");
    form.set("instructions", "Read the paper and write your response.");
    form.set("prompt", "Write your response.");
    form.set("pdf", new File(["%PDF-1.7"], "paper.pdf", { type: "application/pdf" }));

    const imported = await parsePaperUpload(form);

    expect(imported.manifest).toMatchObject({ mode: "essay", title: "English A practice paper" });
    expect(imported.manifest.questions).toHaveLength(1);
    expect(imported.assets[0]).toMatchObject({ filename: "paper.pdf", mime: "application/pdf" });
  });

  test("accepts paper.json and referenced assets selected together", async () => {
    const packaged = {
      ...manifest,
      resources: [{ key: "source-a", label: "Source A", kind: "document", file: "source.pdf" }],
    };
    const form = new FormData();
    form.set("format", "package");
    form.append("packageFiles", new File([JSON.stringify(packaged)], "paper.json", { type: "application/json" }));
    form.append("packageFiles", new File(["%PDF-1.7"], "source.pdf", { type: "application/pdf" }));

    const imported = await parsePaperUpload(form);

    expect(imported.manifest).toMatchObject({ mode: "reading", subject: "history" });
    expect(imported.assets[0]).toMatchObject({ filename: "source.pdf", mime: "application/pdf" });
  });
});

describe("rich-text responses", () => {
  test("preserves exam formatting while removing executable markup", async () => {
    const sanitized = await sanitizeRichText('<p align="center" onclick="alert(1)"><b>Answer</b><script>alert(2)</script></p>');
    expect(sanitized).toBe('<p align="center"><b>Answer</b></p>');
  });
});
