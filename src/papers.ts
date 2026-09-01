import { parseInkSettings, type InkSettings } from "./ink.ts";

export const LEVELS = ["SL", "HL", "SL/HL"] as const;
export const PAPER_MODES = ["essay", "reading", "listening"] as const;
export const QUESTION_TYPES = ["essay", "short", "single-choice", "ink"] as const;
export const RESOURCE_KINDS = ["text", "document", "image", "audio"] as const;
export const SOURCE_CLASSIFICATIONS = [
  "teacher-authored",
  "school-authorized",
  "official-public-reference",
  "unknown-local-only",
] as const;

export type Level = (typeof LEVELS)[number];
export type PaperMode = (typeof PAPER_MODES)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export type SourceClassification = (typeof SOURCE_CLASSIFICATIONS)[number];

export interface PaperResource {
  key: string;
  label: string;
  kind: ResourceKind;
  file?: string;
  text?: string;
  maxPlays?: number;
}

export interface PaperQuestion {
  id: string;
  label: string;
  prompt: string;
  type: QuestionType;
  resourceKeys: string[];
  marks?: number;
  options?: string[];
  wordCountMin?: number;
  wordCountMax?: number;
  ink?: InkSettings;
}

export interface PaperManifest {
  version: 1;
  assessmentSession?: string;
  examProfileId?: string;
  sourceClassification: SourceClassification;
  title: string;
  subject: string;
  subjectLabel: string;
  level: Level;
  paper: string;
  durationMinutes: number;
  readingTimeMinutes: number;
  maximumMarks?: number;
  subjectWeightPercent?: number;
  mode: PaperMode;
  instructions: string;
  selectionMode: "one" | "all";
  resources: PaperResource[];
  questions: PaperQuestion[];
}

export interface ImportedAsset {
  assetKey: string;
  filename: string;
  mime: string;
  bytes: Uint8Array;
}

export interface ImportedPaper {
  manifest: PaperManifest;
  assets: ImportedAsset[];
}

const KEY = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const FILE_NAME = /^[^/\\\u0000]{1,128}$/;
const MAX_MANIFEST_BYTES = 1_000_000;
const MAX_ASSET_BYTES = 50_000_000;
const MAX_TOTAL_ASSET_BYTES = 200_000_000;
const ALLOWED_MIME: Record<string, true> = {
  "application/pdf": true,
  "image/png": true,
  "image/jpeg": true,
  "image/webp": true,
  "audio/mpeg": true,
  "audio/mp4": true,
  "audio/ogg": true,
  "audio/wav": true,
  "audio/x-wav": true,
};
const QUICK_SUBJECT_LABELS: Record<string, string> = {
  "english-a-language-literature": "English A: Language and Literature",
  "english-a-literature": "English A: Literature",
  "english-b": "English B",
};

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") throw new Error(`${label} must be text`);
  const clean = value.trim();
  if (!allowEmpty && !clean) throw new Error(`${label} is required`);
  if (clean.length > max) throw new Error(`${label} is too long`);
  return clean;
}

function integer(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new Error(`${label} must be an integer from ${min} to ${max}`);
  }
  return Number(value);
}

function oneOf<const T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    throw new Error(`${label} must be one of ${values.join(", ")}`);
  }
  return value as T[number];
}

function stringList(value: unknown, label: string, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${label} must be a list`);
  return value.map((item, index) => text(item, `${label}[${index}]`, 64));
}

function optionalInteger(value: unknown, label: string, min: number, max: number): number | undefined {
  return value === undefined ? undefined : integer(value, label, min, max);
}

function parseResource(value: unknown, index: number): PaperResource {
  const source = record(value, `resources[${index}]`);
  const key = text(source.key, `resources[${index}].key`, 64);
  if (!KEY.test(key)) throw new Error(`resources[${index}].key has an invalid format`);
  const kind = oneOf(source.kind, RESOURCE_KINDS, `resources[${index}].kind`);
  const resource: PaperResource = {
    key,
    label: text(source.label, `resources[${index}].label`, 100),
    kind,
  };

  if (kind === "text") {
    resource.text = text(source.text, `resources[${index}].text`, 100_000);
  } else {
    const filename = text(source.file, `resources[${index}].file`, 128);
    if (!FILE_NAME.test(filename)) throw new Error(`resources[${index}].file has an invalid name`);
    resource.file = filename;
  }

  if (kind === "audio") {
    resource.maxPlays = optionalInteger(source.maxPlays, `resources[${index}].maxPlays`, 1, 4) ?? 2;
  }
  return resource;
}

function parseQuestion(value: unknown, index: number): PaperQuestion {
  const source = record(value, `questions[${index}]`);
  const id = text(source.id, `questions[${index}].id`, 64);
  if (!KEY.test(id)) throw new Error(`questions[${index}].id has an invalid format`);
  const type = oneOf(source.type, QUESTION_TYPES, `questions[${index}].type`);
  const question: PaperQuestion = {
    id,
    label: text(source.label, `questions[${index}].label`, 100),
    prompt: text(source.prompt, `questions[${index}].prompt`, 10_000),
    type,
    resourceKeys: stringList(source.resourceKeys ?? [], `questions[${index}].resourceKeys`, 20),
    marks: optionalInteger(source.marks, `questions[${index}].marks`, 1, 1_000),
  };

  if (type === "single-choice") {
    const options = stringList(source.options, `questions[${index}].options`, 12);
    if (options.length < 2) throw new Error(`questions[${index}].options needs at least two choices`);
    question.options = options;
  }

  if (type === "ink") question.ink = parseInkSettings(source.ink, `questions[${index}].ink`);

  question.wordCountMin = optionalInteger(source.wordCountMin, `questions[${index}].wordCountMin`, 1, 10_000);
  question.wordCountMax = optionalInteger(source.wordCountMax, `questions[${index}].wordCountMax`, 1, 10_000);
  if (
    question.wordCountMin !== undefined &&
    question.wordCountMax !== undefined &&
    question.wordCountMin > question.wordCountMax
  ) {
    throw new Error(`questions[${index}] has an invalid word-count range`);
  }
  return question;
}

export function parseManifest(value: unknown): PaperManifest {
  const source = record(value, "manifest");
  if (source.version !== 1) throw new Error("manifest.version must be 1");
  if (!Array.isArray(source.resources) || source.resources.length > 30) {
    throw new Error("manifest.resources must contain at most 30 items");
  }
  if (!Array.isArray(source.questions) || source.questions.length === 0 || source.questions.length > 100) {
    throw new Error("manifest.questions must contain 1 to 100 items");
  }

  const resources = source.resources.map(parseResource);
  const questions = source.questions.map(parseQuestion);
  const resourceKeys = new Set(resources.map((item) => item.key));
  const questionIds = new Set(questions.map((item) => item.id));
  if (resourceKeys.size !== resources.length) throw new Error("Resource keys must be unique");
  if (questionIds.size !== questions.length) throw new Error("Question ids must be unique");
  for (const question of questions) {
    for (const key of question.resourceKeys) {
      if (!resourceKeys.has(key)) throw new Error(`Question ${question.id} references unknown resource ${key}`);
    }
  }

  const subject = text(source.subject, "manifest.subject", 64).toLowerCase();
  if (!KEY.test(subject)) throw new Error("manifest.subject must be a lowercase slug");
  return {
    version: 1,
    assessmentSession: source.assessmentSession === undefined ? undefined : text(source.assessmentSession, "manifest.assessmentSession", 80),
    examProfileId: source.examProfileId === undefined ? undefined : text(source.examProfileId, "manifest.examProfileId", 240),
    sourceClassification: oneOf(
      source.sourceClassification ?? "unknown-local-only",
      SOURCE_CLASSIFICATIONS,
      "manifest.sourceClassification",
    ),
    title: text(source.title, "manifest.title", 160),
    subject,
    subjectLabel: text(source.subjectLabel, "manifest.subjectLabel", 100),
    level: oneOf(source.level, LEVELS, "manifest.level"),
    paper: text(source.paper, "manifest.paper", 80),
    durationMinutes: integer(source.durationMinutes, "manifest.durationMinutes", 5, 360),
    readingTimeMinutes: optionalInteger(source.readingTimeMinutes, "manifest.readingTimeMinutes", 0, 60) ?? 0,
    maximumMarks: optionalInteger(source.maximumMarks, "manifest.maximumMarks", 1, 1_000),
    subjectWeightPercent: optionalInteger(source.subjectWeightPercent, "manifest.subjectWeightPercent", 1, 100),
    mode: oneOf(source.mode, PAPER_MODES, "manifest.mode"),
    instructions: text(source.instructions, "manifest.instructions", 20_000),
    selectionMode: oneOf(source.selectionMode ?? "all", ["one", "all"] as const, "manifest.selectionMode"),
    resources,
    questions,
  };
}

function inferredMime(file: File): string {
  if (ALLOWED_MIME[file.type]) return file.type;
  const extension = file.name.toLowerCase().split(".").pop();
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    wav: "audio/wav",
  };
  const mime = extension ? byExtension[extension] : undefined;
  if (!mime) throw new Error(`Unsupported asset type: ${file.name}`);
  return mime;
}

async function importedPaper(manifest: PaperManifest, uploads: File[]): Promise<ImportedPaper> {
  const files = new Map(uploads.map((file) => [file.name, file]));
  if (files.size !== uploads.length) throw new Error("Uploaded asset filenames must be unique");

  const needed = manifest.resources.filter((resource) => resource.file);
  const expectedNames = new Set(needed.map((resource) => resource.file as string));
  for (const name of files.keys()) {
    if (!expectedNames.has(name)) throw new Error(`Asset ${name} is not referenced by the paper`);
  }
  if (needed.length !== files.size) throw new Error("Upload every asset referenced by the paper");

  let totalBytes = 0;
  const assets: ImportedAsset[] = [];
  for (const resource of needed) {
    const file = files.get(resource.file as string);
    if (!file) throw new Error(`Missing asset: ${resource.file}`);
    if (file.size > MAX_ASSET_BYTES) throw new Error(`${file.name} exceeds 50 MB`);
    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_ASSET_BYTES) throw new Error("Paper assets exceed 200 MB in total");
    const mime = inferredMime(file);
    if (resource.kind === "document" && mime !== "application/pdf") throw new Error(`${file.name} must be a PDF`);
    if (resource.kind === "image" && !mime.startsWith("image/")) throw new Error(`${file.name} must be an image`);
    if (resource.kind === "audio" && !mime.startsWith("audio/")) throw new Error(`${file.name} must be audio`);
    assets.push({ assetKey: resource.key, filename: file.name, mime, bytes: new Uint8Array(await file.arrayBuffer()) });
  }
  return { manifest, assets };
}

async function manifestFile(file: File): Promise<PaperManifest> {
  if (file.size > MAX_MANIFEST_BYTES) throw new Error("Paper manifest exceeds 1 MB");
  try {
    return parseManifest(JSON.parse(await file.text()) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("Paper manifest is not valid JSON");
    throw error;
  }
}


function formText(form: FormData, name: string, label: string, max: number): string {
  return text(form.get(name), label, max);
}

function optionalFormInteger(form: FormData, name: string, label: string, min: number, max: number): number | undefined {
  const value = form.get(name);
  return typeof value === "string" && value.trim() ? integer(Number(value), label, min, max) : undefined;
}

async function parseQuickPaperUpload(form: FormData): Promise<ImportedPaper> {
  const pdf = form.get("pdf");
  if (!(pdf instanceof File) || pdf.size === 0) throw new Error("Choose the paper PDF");
  const subject = formText(form, "subject", "Subject", 64);
  const subjectLabel = QUICK_SUBJECT_LABELS[subject];
  if (!subjectLabel) throw new Error("Choose a supported subject");
  const wordCountMin = optionalFormInteger(form, "wordCountMin", "Minimum word count", 1, 10_000);
  const wordCountMax = optionalFormInteger(form, "wordCountMax", "Maximum word count", 1, 10_000);
  const manifest = parseManifest({
    version: 1,
    title: formText(form, "title", "Paper title", 160),
    subject,
    subjectLabel,
    level: formText(form, "level", "Level", 8),
    paper: formText(form, "paper", "Paper label", 80),
    durationMinutes: Number(formText(form, "durationMinutes", "Duration", 3)),
    readingTimeMinutes: 0,
    sourceClassification: "unknown-local-only",
    mode: "essay",
    instructions: formText(form, "instructions", "Instructions", 20_000),
    selectionMode: "all",
    resources: [{ key: "paper", label: "Paper", kind: "document", file: pdf.name }],
    questions: [{
      id: "response",
      label: "Response",
      prompt: formText(form, "prompt", "Response prompt", 10_000),
      type: "essay",
      resourceKeys: ["paper"],
      wordCountMin,
      wordCountMax,
    }],
  });
  return importedPaper(manifest, [pdf]);
}

export async function parsePaperUpload(form: FormData): Promise<ImportedPaper> {
  const format = form.get("format");
  if (format === "quick") return parseQuickPaperUpload(form);
  if (format === "package") {
    const files = form.getAll("packageFiles").filter((item): item is File => item instanceof File && item.size > 0);
    const manifests = files.filter((file) => file.name === "paper.json");
    const paperJson = manifests[0];
    if (!paperJson || manifests.length !== 1) throw new Error("Select one paper.json file and every referenced asset");
    return importedPaper(await manifestFile(paperJson), files.filter((file) => file !== paperJson));
  }

  const manifest = form.get("manifest");
  if (!(manifest instanceof File) || manifest.size === 0) throw new Error("Choose a paper manifest JSON file");
  const uploads = form.getAll("assets").filter((item): item is File => item instanceof File && item.size > 0);
  return importedPaper(await manifestFile(manifest), uploads);
}

const ALLOWED_RICH_TAGS: Record<string, true> = {
  div: true,
  p: true,
  br: true,
  b: true,
  strong: true,
  i: true,
  em: true,
  u: true,
  sup: true,
  sub: true,
  ol: true,
  ul: true,
  li: true,
  table: true,
  thead: true,
  tbody: true,
  tr: true,
  td: true,
  th: true,
  span: true,
  font: true,
};
const BLOCKED_RICH_TAGS: Record<string, true> = {
  script: true,
  style: true,
  iframe: true,
  object: true,
  embed: true,
  svg: true,
  math: true,
  link: true,
  meta: true,
};

export async function sanitizeRichText(value: string): Promise<string> {
  if (value.length > 250_000) throw new Error("Essay response is too long");
  const wrapped = `<div>${value}</div>`;
  const rewritten = await new HTMLRewriter()
    .on("*", {
      element(element) {
        const tag = element.tagName.toLowerCase();
        if (BLOCKED_RICH_TAGS[tag]) {
          element.remove();
          return;
        }
        if (!ALLOWED_RICH_TAGS[tag]) {
          element.removeAndKeepContent();
          return;
        }
        for (const [name, value] of element.attributes) {
          const keepFace = tag === "font" && name === "face" && /^(?:Arial|Georgia|Times New Roman|Verdana|Courier New)$/.test(value);
          const keepSize = tag === "font" && name === "size" && /^[1-7]$/.test(value);
          const keepAlign = ["div", "p", "td", "th"].includes(tag) && name === "align" && /^(?:left|center|right|justify)$/.test(value);
          const keepStyle = name === "style" && /^\s*text-align\s*:\s*(?:left|center|right|justify)\s*;?\s*$/i.test(value);
          if (!keepFace && !keepSize && !keepAlign && !keepStyle) element.removeAttribute(name);
        }
      },
    })
    .transform(new Response(wrapped))
    .text();
  return rewritten.startsWith("<div>") && rewritten.endsWith("</div>") ? rewritten.slice(5, -6) : rewritten;
}
