import { gunzip, gzip } from "node:zlib";
import { parseInkSettings, type InkSettings } from "./ink.ts";

export const LEVELS = ["SL", "HL", "SL/HL"] as const;
export const PAPER_MODES = ["essay", "reading", "listening"] as const;
export const QUESTION_TYPES = ["essay", "short", "single-choice", "ink"] as const;
export const RESOURCE_KINDS = ["text", "document", "image", "audio"] as const;
export const AUDIO_PLAY_LIMIT = 2;
export const SOURCE_CLASSIFICATIONS = [
  "teacher-authored",
  "school-authorized",
  "official-public-reference",
  "unknown-local-only",
] as const;
export const PRACTICE_FIDELITIES = ["official-format", "adapted", "school-custom"] as const;
export const EXAM_PHASE_KINDS = ["reading", "work", "break"] as const;

export type Level = string;
export type PaperMode = (typeof PAPER_MODES)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export type SourceClassification = (typeof SOURCE_CLASSIFICATIONS)[number];
export type PracticeFidelity = (typeof PRACTICE_FIDELITIES)[number];
export type ExamPhaseKind = (typeof EXAM_PHASE_KINDS)[number];

export interface ExamFormatMetadata {
  systemId: string;
  systemLabel: string;
  qualificationLabel: string;
  deliveryMode: string;
  fidelity: PracticeFidelity;
  profileVersion: string;
  rulesSummary: string;
}

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
  sectionId?: string;
}

export interface ExamPhase {
  id: string;
  label: string;
  kind: ExamPhaseKind;
  durationMinutes: number;
  sectionId?: string;
  tools: string[];
  instructions?: string;
}

export interface PaperManifest {
  version: 1;
  assessmentSession?: string;
  examProfileId?: string;
  examFormat?: ExamFormatMetadata;
  sourceClassification: SourceClassification;
  exportAuthorized: boolean;
  title: string;
  subject: string;
  subjectLabel: string;
  level: Level;
  paper: string;
  durationMinutes: number;
  readingTimeMinutes: number;
  phases?: ExamPhase[];
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

export interface PortablePaperAsset {
  filename: string;
  mime: string;
  data: Uint8Array;
}

const KEY = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const LEVEL_LABEL = /^[\p{L}\p{N}][\p{L}\p{N} /&()+.:-]{0,39}$/u;
const FILE_NAME = /^[^/\\\u0000]{1,128}$/;
const MAX_MANIFEST_BYTES = 1_000_000;
const MAX_ASSET_BYTES = 40_000_000;
const MAX_TOTAL_ASSET_BYTES = 64_000_000;
const MAX_PORTABLE_ASSET_BYTES = 40_000_000;
const MAX_PORTABLE_TOTAL_ASSET_BYTES = 64_000_000;
const MAX_PORTABLE_FILE_BYTES = 70_000_000;
const MAX_PORTABLE_JSON_BYTES = 90_000_000;
const PORTABLE_FORMAT = "digitaldp-paper";
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

function stringList(value: unknown, label: string, maxItems: number, maxLength = 64): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${label} must be a list`);
  return value.map((item, index) => text(item, `${label}[${index}]`, maxLength));
}

function optionalInteger(value: unknown, label: string, min: number, max: number): number | undefined {
  return value === undefined ? undefined : integer(value, label, min, max);
}

function optionalBoolean(value: unknown, label: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") throw new Error(`${label} must be true or false`);
  return value;
}

function parseExamFormat(value: unknown): ExamFormatMetadata | undefined {
  if (value === undefined) return undefined;
  const source = record(value, "manifest.examFormat");
  const systemId = text(source.systemId, "manifest.examFormat.systemId", 64).toLowerCase();
  if (!KEY.test(systemId)) throw new Error("manifest.examFormat.systemId must be a lowercase slug");
  return {
    systemId,
    systemLabel: text(source.systemLabel, "manifest.examFormat.systemLabel", 100),
    qualificationLabel: text(source.qualificationLabel, "manifest.examFormat.qualificationLabel", 100),
    deliveryMode: text(source.deliveryMode, "manifest.examFormat.deliveryMode", 100),
    fidelity: oneOf(source.fidelity, PRACTICE_FIDELITIES, "manifest.examFormat.fidelity"),
    profileVersion: text(source.profileVersion, "manifest.examFormat.profileVersion", 40),
    rulesSummary: text(source.rulesSummary, "manifest.examFormat.rulesSummary", 500),
  };
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
    if (source.maxPlays !== undefined && source.maxPlays !== AUDIO_PLAY_LIMIT) {
      throw new Error(`resources[${index}].maxPlays must be exactly ${AUDIO_PLAY_LIMIT}`);
    }
    resource.maxPlays = AUDIO_PLAY_LIMIT;
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
    sectionId: source.sectionId === undefined ? undefined : text(source.sectionId, `questions[${index}].sectionId`, 64),
  };

  if (question.sectionId && !KEY.test(question.sectionId)) {
    throw new Error(`questions[${index}].sectionId has an invalid format`);
  }

  if (type === "single-choice") {
    const options = stringList(source.options, `questions[${index}].options`, 12, 1_000);
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

function parsePhases(value: unknown, durationMinutes: number, readingTimeMinutes: number, questions: PaperQuestion[]): ExamPhase[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length < 2 || value.length > 12) {
    throw new Error("manifest.phases must contain 2 to 12 timed phases");
  }
  if (readingTimeMinutes !== 0) throw new Error("manifest.readingTimeMinutes must be 0 when manifest.phases is present");

  const phases = value.map((item, index): ExamPhase => {
    const source = record(item, `phases[${index}]`);
    const id = text(source.id, `phases[${index}].id`, 64);
    if (!KEY.test(id)) throw new Error(`phases[${index}].id has an invalid format`);
    const kind = oneOf(source.kind, EXAM_PHASE_KINDS, `phases[${index}].kind`);
    const sectionId = source.sectionId === undefined ? undefined : text(source.sectionId, `phases[${index}].sectionId`, 64);
    if (sectionId && !KEY.test(sectionId)) throw new Error(`phases[${index}].sectionId has an invalid format`);
    if (kind === "break" && sectionId) throw new Error(`phases[${index}] cannot attach a break to a question section`);
    if (kind !== "break" && !sectionId) throw new Error(`phases[${index}] must identify its question section`);
    return {
      id,
      label: text(source.label, `phases[${index}].label`, 100),
      kind,
      durationMinutes: integer(source.durationMinutes, `phases[${index}].durationMinutes`, 1, 240),
      sectionId,
      tools: stringList(source.tools ?? [], `phases[${index}].tools`, 8),
      instructions: source.instructions === undefined
        ? undefined
        : text(source.instructions, `phases[${index}].instructions`, 1_000),
    };
  });

  if (new Set(phases.map(({ id }) => id)).size !== phases.length) throw new Error("Phase ids must be unique");
  if (phases.reduce((sum, phase) => sum + phase.durationMinutes, 0) !== durationMinutes) {
    throw new Error("Timed phase minutes must add up to manifest.durationMinutes");
  }
  if (phases.at(-1)?.kind !== "work") throw new Error("The final timed phase must be a work phase");
  const workSections = new Set(phases.filter(({ kind }) => kind === "work").map(({ sectionId }) => sectionId));
  for (const question of questions) {
    if (!question.sectionId || !workSections.has(question.sectionId)) {
      throw new Error(`Question ${question.id} must belong to a work-phase section`);
    }
  }
  for (const sectionId of workSections) {
    if (!questions.some((question) => question.sectionId === sectionId)) {
      throw new Error(`Work-phase section ${sectionId} has no questions`);
    }
  }
  return phases;
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

  const mode = oneOf(source.mode, PAPER_MODES, "manifest.mode");
  if (mode === "listening" && !resources.some((resource) => resource.kind === "audio")) {
    throw new Error("Listening papers must contain at least one audio resource");
  }

  const subject = text(source.subject, "manifest.subject", 64).toLowerCase();
  if (!KEY.test(subject)) throw new Error("manifest.subject must be a lowercase slug");
  const level = text(source.level, "manifest.level", 40);
  if (!LEVEL_LABEL.test(level)) throw new Error("manifest.level has an invalid format");
  const durationMinutes = integer(source.durationMinutes, "manifest.durationMinutes", 5, 360);
  const readingTimeMinutes = optionalInteger(source.readingTimeMinutes, "manifest.readingTimeMinutes", 0, 60) ?? 0;
  const phases = parsePhases(source.phases, durationMinutes, readingTimeMinutes, questions);
  return {
    version: 1,
    assessmentSession: source.assessmentSession === undefined ? undefined : text(source.assessmentSession, "manifest.assessmentSession", 80),
    examProfileId: source.examProfileId === undefined ? undefined : text(source.examProfileId, "manifest.examProfileId", 240),
    examFormat: parseExamFormat(source.examFormat),
    sourceClassification: oneOf(
      source.sourceClassification ?? "unknown-local-only",
      SOURCE_CLASSIFICATIONS,
      "manifest.sourceClassification",
    ),
    exportAuthorized: optionalBoolean(source.exportAuthorized, "manifest.exportAuthorized"),
    title: text(source.title, "manifest.title", 160),
    subject,
    subjectLabel: text(source.subjectLabel, "manifest.subjectLabel", 100),
    level,
    paper: text(source.paper, "manifest.paper", 80),
    durationMinutes,
    readingTimeMinutes,
    phases,
    maximumMarks: optionalInteger(source.maximumMarks, "manifest.maximumMarks", 1, 1_000),
    subjectWeightPercent: optionalInteger(source.subjectWeightPercent, "manifest.subjectWeightPercent", 1, 100),
    mode,
    instructions: text(source.instructions, "manifest.instructions", 20_000),
    selectionMode: oneOf(source.selectionMode ?? "all", ["one", "all"] as const, "manifest.selectionMode"),
    resources,
    questions,
  };
}

function normalizedMime(value: string): string {
  return value === "audio/x-wav" ? "audio/wav" : value;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function sniffedMime(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (bytes.length >= 4 && ascii(bytes, 0, 4) === "OggS") return "audio/ogg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") return "audio/wav";
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") return "audio/mp4";
  if (
    (bytes.length >= 3 && ascii(bytes, 0, 3) === "ID3") ||
    (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0)
  ) return "audio/mpeg";
  return undefined;
}

function inferredMime(file: File, bytes: Uint8Array): string {
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
  const claimed = normalizedMime(ALLOWED_MIME[file.type] ? file.type : (extension ? byExtension[extension] ?? "" : ""));
  if (!claimed) throw new Error(`Unsupported asset type: ${file.name}`);
  const detected = sniffedMime(bytes);
  if (!detected || normalizedMime(detected) !== claimed) throw new Error(`${file.name} does not match its declared file type`);
  return detected;
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
    if (file.size > MAX_ASSET_BYTES) throw new Error(`${file.name} exceeds 40 MB`);
    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_ASSET_BYTES) throw new Error("Paper assets exceed 64 MB in total");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = inferredMime(file, bytes);
    if (resource.kind === "document" && mime !== "application/pdf") throw new Error(`${file.name} must be a PDF`);
    if (resource.kind === "image" && !mime.startsWith("image/")) throw new Error(`${file.name} must be an image`);
    if (resource.kind === "audio" && !mime.startsWith("audio/")) throw new Error(`${file.name} must be audio`);
    assets.push({ assetKey: resource.key, filename: file.name, mime, bytes });
  }
  return { manifest, assets };
}

function ownedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const owned = new Uint8Array(bytes.byteLength);
  owned.set(bytes);
  return owned.buffer;
}

function gzipBytes(bytes: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    gzip(bytes, { level: 6 }, (error, result) => error ? reject(error) : resolve(new Uint8Array(result)));
  });
}

function gunzipBytes(bytes: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    gunzip(bytes, { maxOutputLength: MAX_PORTABLE_JSON_BYTES }, (error, result) => {
      if (error) reject(error);
      else resolve(new Uint8Array(result));
    });
  });
}

export async function encodePortablePaper(manifest: PaperManifest, assets: PortablePaperAsset[]): Promise<ArrayBuffer> {
  const validatedManifest = parseManifest(manifest);
  const expectedNames = new Set(validatedManifest.resources.flatMap((resource) => resource.file ? [resource.file] : []));
  const suppliedNames = new Set(assets.map((asset) => asset.filename));
  if (assets.length > 30 || suppliedNames.size !== assets.length) throw new Error("Portable paper assets are invalid");
  if (expectedNames.size !== suppliedNames.size || [...expectedNames].some((name) => !suppliedNames.has(name))) {
    throw new Error("Portable paper assets do not match the manifest");
  }
  let totalBytes = 0;
  for (const asset of assets) {
    if (!FILE_NAME.test(asset.filename)) throw new Error("Portable paper asset filename is invalid");
    if (asset.data.byteLength > MAX_PORTABLE_ASSET_BYTES) throw new Error(`${asset.filename} exceeds the 40 MB portable limit`);
    totalBytes += asset.data.byteLength;
    if (totalBytes > MAX_PORTABLE_TOTAL_ASSET_BYTES) throw new Error("Portable paper assets exceed 64 MB in total");
    const detected = sniffedMime(asset.data);
    if (!detected || normalizedMime(detected) !== normalizedMime(asset.mime)) {
      throw new Error(`${asset.filename} does not match its declared file type`);
    }
  }
  const payload = {
    format: PORTABLE_FORMAT,
    version: 1,
    manifest: validatedManifest,
    assets: assets.map((asset) => ({
      filename: asset.filename,
      mime: asset.mime,
      data: Buffer.from(asset.data).toString("base64"),
    })),
  };
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  if (encoded.byteLength > MAX_PORTABLE_JSON_BYTES) throw new Error("Portable paper exceeds the export limit");
  return ownedArrayBuffer(await gzipBytes(encoded));
}

function base64Bytes(value: unknown, label: string): Uint8Array {
  if (typeof value !== "string" || value.length > Math.ceil(MAX_PORTABLE_ASSET_BYTES * 4 / 3) + 4) {
    throw new Error(`${label} is invalid`);
  }
  if (value.length % 4 !== 0) throw new Error(`${label} is not valid base64`);
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const contentLength = value.length - padding;
  for (let index = 0; index < contentLength; index += 1) {
    const code = value.charCodeAt(index);
    const valid =
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 43 || code === 47;
    if (!valid) throw new Error(`${label} is not valid base64`);
  }
  for (let index = contentLength; index < value.length; index += 1) {
    if (value[index] !== "=") throw new Error(`${label} is not valid base64`);
  }
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function parsePortablePaper(file: File): Promise<ImportedPaper> {
  if (file.size === 0) throw new Error("Choose a DigitalDP paper file");
  if (file.size > MAX_PORTABLE_FILE_BYTES) throw new Error("Portable paper exceeds 70 MB");
  let decoded: Uint8Array;
  try {
    decoded = await gunzipBytes(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("DigitalDP paper file is damaged or has an unsupported format");
  }

  let source: Record<string, unknown>;
  try {
    source = record(JSON.parse(new TextDecoder().decode(decoded)) as unknown, "portable paper");
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("DigitalDP paper file is not valid JSON");
    throw error;
  }
  if (source.format !== PORTABLE_FORMAT || source.version !== 1) {
    throw new Error("DigitalDP paper file has an unsupported version");
  }
  if (!Array.isArray(source.assets) || source.assets.length > 30) {
    throw new Error("Portable paper assets must contain at most 30 items");
  }
  let totalBytes = 0;
  const uploads = source.assets.map((value, index) => {
    const asset = record(value, `portable paper assets[${index}]`);
    const filename = text(asset.filename, `portable paper assets[${index}].filename`, 128);
    if (!FILE_NAME.test(filename)) throw new Error(`portable paper assets[${index}].filename has an invalid name`);
    const mime = text(asset.mime, `portable paper assets[${index}].mime`, 100);
    const bytes = base64Bytes(asset.data, `portable paper assets[${index}].data`);
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_PORTABLE_TOTAL_ASSET_BYTES) throw new Error("Portable paper assets exceed 64 MB in total");
    return new File([ownedArrayBuffer(bytes)], filename, { type: mime });
  });
  return importedPaper(parseManifest(source.manifest), uploads);
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
    exportAuthorized: false,
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
  if (format === "portable") {
    const portable = form.get("portablePaper");
    if (!(portable instanceof File)) throw new Error("Choose a DigitalDP paper file");
    return parsePortablePaper(portable);
  }
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
