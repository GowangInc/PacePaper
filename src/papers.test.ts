import { describe, expect, test } from "bun:test";
import { gzipSync } from "node:zlib";
import { AUDIO_PLAY_LIMIT, encodePortablePaper, parseManifest, parsePaperUpload, sanitizeRichText } from "./papers";

const manifest = {
  version: 1,
  title: "History source analysis",
  subject: "history",
  subjectLabel: "History",
  level: "SL/HL",
  paper: "Paper 1",
  durationMinutes: 60,
  readingTimeMinutes: 5,
  mode: "reading",
  instructions: "Read the source and answer every question.",
  selectionMode: "all",
  resources: [{ key: "source-a", label: "Source A", kind: "text", text: "A primary source." }],
  questions: [{ id: "q1", label: "Question 1", prompt: "What is the source's purpose?", type: "short", resourceKeys: ["source-a"] }],
};

describe("paper manifests", () => {
  test("accepts substantial answer choices without relaxing identifier limits", () => {
    const choice = { ...manifest.questions[0], type: "single-choice", options: ["A".repeat(1_000), "A concise alternative"] };
    expect(parseManifest({ ...manifest, questions: [choice] }).questions[0]?.options?.[0]).toHaveLength(1_000);
    expect(() => parseManifest({ ...manifest, questions: [{ ...choice, options: ["A".repeat(1_001), "B"] }] })).toThrow("questions[0].options[0]");
    expect(() => parseManifest({ ...manifest, questions: [{ ...choice, resourceKeys: ["x".repeat(65)] }] })).toThrow("resourceKeys[0]");
  });

  test("accepts subject-extensible manifests", () => {
    expect(parseManifest(manifest)).toMatchObject({
      subject: "history",
      subjectLabel: "History",
      readingTimeMinutes: 5,
      sourceClassification: "unknown-local-only",
      exportAuthorized: false,
    });
  });

  test("accepts and validates source-rights classification", () => {
    expect(parseManifest({ ...manifest, sourceClassification: "school-authorized" }).sourceClassification).toBe("school-authorized");
    expect(() => parseManifest({ ...manifest, sourceClassification: "public-domain" })).toThrow("manifest.sourceClassification");
  });

  test("defaults portable export permission to false and validates an explicit attestation", () => {
    expect(parseManifest(manifest).exportAuthorized).toBe(false);
    expect(parseManifest({ ...manifest, exportAuthorized: true }).exportAuthorized).toBe(true);
    expect(() => parseManifest({ ...manifest, exportAuthorized: "yes" })).toThrow("manifest.exportAuthorized");
  });

  test("accepts provider-specific level labels and rejects malformed ones", () => {
    expect(parseManifest({ ...manifest, level: "Extended" }).level).toBe("Extended");
    expect(parseManifest({ ...manifest, level: "Higher" }).level).toBe("Higher");
    expect(() => parseManifest({ ...manifest, level: "<script>" })).toThrow("manifest.level");
  });

  test("preserves and validates an optional exam-format profile", () => {
    const examFormat = {
      systemId: "cambridge-igcse",
      systemLabel: "Cambridge IGCSE",
      qualificationLabel: "Cambridge IGCSE",
      deliveryMode: "Paper-like digital practice",
      fidelity: "official-format" as const,
      profileVersion: "2026-09-04",
      rulesSummary: "No calculator · digital working canvas",
    };
    expect(parseManifest({ ...manifest, level: "Extended", examFormat }).examFormat).toEqual(examFormat);
    expect(() => parseManifest({ ...manifest, examFormat: { ...examFormat, fidelity: "official" } })).toThrow("examFormat.fidelity");
    expect(() => parseManifest({ ...manifest, examFormat: { ...examFormat, systemId: "Cambridge IGCSE" } })).toThrow("examFormat.systemId");
  });

  test("defaults legacy manifests to no separate reading period", () => {
    const { readingTimeMinutes: _, ...legacy } = manifest;
    expect(parseManifest(legacy).readingTimeMinutes).toBe(0);
  });

  test("rejects implausible reading periods", () => {
    expect(() => parseManifest({ ...manifest, readingTimeMinutes: 61 })).toThrow("manifest.readingTimeMinutes");
  });

  test("validates a sectioned paper and preserves its phase-specific tools", () => {
    const phased = {
      ...manifest,
      readingTimeMinutes: 0,
      durationMinutes: 25,
      phases: [
        { id: "section-1", label: "Section I", kind: "work", durationMinutes: 10, sectionId: "section-1", tools: ["No calculator"] },
        { id: "break", label: "Break", kind: "break", durationMinutes: 5, tools: [] },
        { id: "section-2", label: "Section II", kind: "work", durationMinutes: 10, sectionId: "section-2", tools: ["Calculator permitted"] },
      ],
      questions: [
        { ...manifest.questions[0], id: "q1", sectionId: "section-1" },
        { ...manifest.questions[0], id: "q2", sectionId: "section-2" },
      ],
    };
    expect(parseManifest(phased)).toMatchObject({
      phases: [
        { id: "section-1", kind: "work", tools: ["No calculator"] },
        { id: "break", kind: "break", tools: [] },
        { id: "section-2", kind: "work", tools: ["Calculator permitted"] },
      ],
      questions: [{ sectionId: "section-1" }, { sectionId: "section-2" }],
    });
    expect(() => parseManifest({ ...phased, durationMinutes: 30 })).toThrow("must add up");
    expect(() => parseManifest({ ...phased, readingTimeMinutes: 5 })).toThrow("must be 0");
    expect(() => parseManifest({ ...phased, questions: [{ ...manifest.questions[0], sectionId: "missing" }] })).toThrow("work-phase section");
  });

  test("rejects questions that reference missing resources", () => {
    expect(() => parseManifest({
      ...manifest,
      questions: [{ ...manifest.questions[0], resourceKeys: ["missing"] }],
    })).toThrow("references unknown resource missing");
  });

  test("defaults every audio resource to exactly two complete plays", () => {
    const parsed = parseManifest({
      ...manifest,
      mode: "listening",
      resources: [{ key: "audio", label: "Teacher recording", kind: "audio", file: "listening.mp3" }],
      questions: [{ ...manifest.questions[0], resourceKeys: ["audio"] }],
    });

    expect(AUDIO_PLAY_LIMIT).toBe(2);
    expect(parsed.resources[0]?.maxPlays).toBe(AUDIO_PLAY_LIMIT);
  });

  test("rejects an audio play limit other than two", () => {
    for (const maxPlays of [1, 3, 4, "2"]) {
      expect(() => parseManifest({
        ...manifest,
        resources: [{ key: "audio", label: "Teacher recording", kind: "audio", file: "listening.mp3", maxPlays }],
      })).toThrow("maxPlays must be exactly 2");
    }
  });

  test("requires at least one audio resource in every listening paper", () => {
    expect(() => parseManifest({ ...manifest, mode: "listening" })).toThrow(
      "Listening papers must contain at least one audio resource",
    );
  });

  test("accepts video resources with http(s) urls", () => {
    const video = { key: "clip-a", label: "Clip A", kind: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
    const paper = {
      ...manifest,
      resources: [video],
      questions: [{ ...manifest.questions[0], resourceKeys: ["clip-a"] }],
    };
    expect(parseManifest(paper).resources[0]?.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(parseManifest({
      ...paper,
      resources: [{ ...video, url: "https://youtu.be/dQw4w9WgXcQ" }],
    }).resources[0]?.url).toBe("https://youtu.be/dQw4w9WgXcQ");
    expect(parseManifest({
      ...paper,
      resources: [{ ...video, url: "https://example.com/clip.mp4" }],
    }).resources[0]?.url).toBe("https://example.com/clip.mp4");
  });

  test("rejects video resources without http(s) urls", () => {
    const video = { key: "clip-a", label: "Clip A", kind: "video", url: "https://youtu.be/dQw4w9WgXcQ" };
    expect(() => parseManifest({ ...manifest, resources: [{ ...video, url: "javascript:alert(1)" }] })).toThrow("resources[0].url");
    expect(() => parseManifest({ ...manifest, resources: [{ ...video, url: "data:text/html,blocked" }] })).toThrow("resources[0].url");
    const { url: _, ...missingUrl } = video;
    expect(() => parseManifest({ ...manifest, resources: [missingUrl] })).toThrow("resources[0].url");
  });

  test("requires video resource labels like every other kind", () => {
    const { label: _, ...unlabeled } = { key: "clip-a", label: "Clip A", kind: "video", url: "https://youtu.be/dQw4w9WgXcQ" };
    expect(parseManifest({
      ...manifest,
      resources: [{ key: "clip-a", label: "Clip A", kind: "video", url: "https://youtu.be/dQw4w9WgXcQ" }],
      questions: [{ ...manifest.questions[0], resourceKeys: ["clip-a"] }],
    }).resources[0]).toMatchObject({ kind: "video", label: "Clip A" });
    expect(() => parseManifest({ ...manifest, resources: [unlabeled] })).toThrow("resources[0].label");
  });

  test("parses a minimal paper containing exactly one video resource", () => {
    expect(parseManifest({
      ...manifest,
      resources: [{ key: "clip-a", label: "Clip A", kind: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
      questions: [{ ...manifest.questions[0], resourceKeys: ["clip-a"] }],
    }).resources[0]).toMatchObject({ key: "clip-a", kind: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
  });

  test("accepts a configured handwritten-working response", () => {
    expect(parseManifest({
      ...manifest,
      maximumMarks: 80,
      subjectWeightPercent: 40,
      questions: [{
        ...manifest.questions[0],
        marks: 8,
        type: "ink",
        ink: { pages: 2, background: "square-grid", allowTypedAlternative: true },
      }],
    })).toMatchObject({
      maximumMarks: 80,
      subjectWeightPercent: 40,
      questions: [{ type: "ink", marks: 8, ink: { pages: 2, background: "square-grid", allowTypedAlternative: true } }],
    });
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

  test("exports and re-imports one portable file without changing the paper or assets", async () => {
    const packaged = parseManifest({
      ...manifest,
      sourceClassification: "teacher-authored",
      exportAuthorized: true,
      resources: [{ key: "source-a", label: "Source A", kind: "document", file: "source.pdf" }],
    });
    const sourceBytes = new TextEncoder().encode("%PDF-1.7\nTeacher-authored source");
    const portableBytes = await encodePortablePaper(packaged, [{ filename: "source.pdf", mime: "application/pdf", data: sourceBytes }]);
    const form = new FormData();
    form.set("format", "portable");
    form.set("portablePaper", new File([portableBytes], "history.digitaldp-paper", { type: "application/vnd.digitaldp.paper+gzip" }));

    const imported = await parsePaperUpload(form);

    expect(imported.manifest).toEqual(packaged);
    expect(imported.assets).toHaveLength(1);
    expect(imported.assets[0]).toMatchObject({ assetKey: "source-a", filename: "source.pdf", mime: "application/pdf" });
    expect(imported.assets[0]?.bytes).toEqual(sourceBytes);
  });

  test("rejects a damaged portable paper", async () => {
    const form = new FormData();
    form.set("format", "portable");
    form.set("portablePaper", new File(["not a portable paper"], "broken.digitaldp-paper"));
    await expect(parsePaperUpload(form)).rejects.toThrow("damaged or has an unsupported format");
  });

  test("rejects malformed Base64 inside an otherwise valid portable envelope", async () => {
    const packaged = parseManifest({
      ...manifest,
      resources: [{ key: "source-a", label: "Source A", kind: "document", file: "source.pdf" }],
    });
    const envelope = gzipSync(JSON.stringify({
      format: "digitaldp-paper",
      version: 1,
      manifest: packaged,
      assets: [{ filename: "source.pdf", mime: "application/pdf", data: "not+base64!" }],
    }));
    const form = new FormData();
    form.set("format", "portable");
    form.set("portablePaper", new File([envelope], "broken.digitaldp-paper"));

    await expect(parsePaperUpload(form)).rejects.toThrow("not valid base64");
  });

  test("round-trips a multi-megabyte listening file", async () => {
    const listening = parseManifest({
      ...manifest,
      sourceClassification: "teacher-authored",
      mode: "listening",
      resources: [{ key: "audio", label: "Teacher recording", kind: "audio", file: "listening.wav", maxPlays: 2 }],
      questions: [{ ...manifest.questions[0], resourceKeys: ["audio"] }],
    });
    const wav = new Uint8Array(4_000_000);
    wav.set(new TextEncoder().encode("RIFF"), 0);
    wav.set(new TextEncoder().encode("WAVE"), 8);
    const portableBytes = await encodePortablePaper(listening, [{ filename: "listening.wav", mime: "audio/wav", data: wav }]);
    const form = new FormData();
    form.set("format", "portable");
    form.set("portablePaper", new File([portableBytes], "listening.digitaldp-paper"));

    const imported = await parsePaperUpload(form);

    expect(imported.assets[0]?.bytes).toEqual(wav);
  });

  test("rejects an asset whose bytes do not match its claimed type", async () => {
    const packaged = {
      ...manifest,
      resources: [{ key: "source-a", label: "Source A", kind: "document", file: "source.pdf" }],
    };
    const form = new FormData();
    form.set("format", "package");
    form.append("packageFiles", new File([JSON.stringify(packaged)], "paper.json", { type: "application/json" }));
    form.append("packageFiles", new File(["<script>not a PDF</script>"], "source.pdf", { type: "application/pdf" }));

    await expect(parsePaperUpload(form)).rejects.toThrow("does not match its declared file type");
  });
});

describe("rich-text responses", () => {
  test("preserves exam formatting while removing executable markup", async () => {
    const sanitized = await sanitizeRichText('<p align="center" onclick="alert(1)"><b>Answer</b><script>alert(2)</script></p>');
    expect(sanitized).toBe('<p align="center"><b>Answer</b></p>');
  });
});
