export const INK_BACKGROUNDS = ["blank", "lined", "square-grid"] as const;

export type InkBackground = (typeof INK_BACKGROUNDS)[number];

export interface InkSettings {
  pages: number;
  background: InkBackground;
  allowTypedAlternative: boolean;
}

export interface InkStroke {
  width: number;
  points: Array<[number, number, number]>;
}

export interface InkPage {
  strokes: InkStroke[];
}

export interface InkAnswer {
  version: 1;
  pages: InkPage[];
  typed: string;
}

const MAX_ANSWER_BYTES = 900_000;
const MAX_STROKES_PER_PAGE = 500;
const MAX_POINTS_PER_STROKE = 2_500;
const MAX_TOTAL_POINTS = 50_000;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function integer(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new Error(`${label} must be an integer from ${min} to ${max}`);
  }
  return Number(value);
}

export function parseInkSettings(value: unknown, label = "ink"): InkSettings {
  const source = record(value, label);
  const background = source.background;
  if (typeof background !== "string" || !INK_BACKGROUNDS.includes(background as InkBackground)) {
    throw new Error(`${label}.background must be one of ${INK_BACKGROUNDS.join(", ")}`);
  }
  if (source.allowTypedAlternative !== undefined && typeof source.allowTypedAlternative !== "boolean") {
    throw new Error(`${label}.allowTypedAlternative must be true or false`);
  }
  return {
    pages: integer(source.pages, `${label}.pages`, 1, 4),
    background: background as InkBackground,
    allowTypedAlternative: source.allowTypedAlternative ?? true,
  };
}

function point(value: unknown, label: string): [number, number, number] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) throw new Error(`${label} is invalid`);
  return [
    integer(value[0], `${label}[0]`, 0, 10_000),
    integer(value[1], `${label}[1]`, 0, 7_500),
    value[2] === undefined ? 500 : integer(value[2], `${label}[2]`, 0, 1_000),
  ];
}

export function normalizeInkAnswer(raw: string, settings: InkSettings): string {
  if (raw === "") return raw;
  if (new TextEncoder().encode(raw).byteLength > MAX_ANSWER_BYTES) throw new Error("Handwritten response is too large");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Handwritten response is not valid");
  }
  const source = record(parsed, "Handwritten response");
  if (source.version !== 1) throw new Error("Handwritten response version is not supported");
  if (!Array.isArray(source.pages) || source.pages.length !== settings.pages) {
    throw new Error(`Handwritten response must contain ${settings.pages} page${settings.pages === 1 ? "" : "s"}`);
  }
  if (typeof source.typed !== "string" || source.typed.length > 20_000) {
    throw new Error("Typed working is too long");
  }
  if (!settings.allowTypedAlternative && source.typed.trim()) {
    throw new Error("Typed working is not enabled for this question");
  }

  let totalPoints = 0;
  const pages = source.pages.map((pageValue, pageIndex): InkPage => {
    const page = record(pageValue, `pages[${pageIndex}]`);
    if (!Array.isArray(page.strokes) || page.strokes.length > MAX_STROKES_PER_PAGE) {
      throw new Error(`pages[${pageIndex}].strokes contains too many strokes`);
    }
    const strokes = page.strokes.map((strokeValue, strokeIndex): InkStroke => {
      const stroke = record(strokeValue, `pages[${pageIndex}].strokes[${strokeIndex}]`);
      const width = integer(stroke.width, `pages[${pageIndex}].strokes[${strokeIndex}].width`, 1, 12);
      if (!Array.isArray(stroke.points) || stroke.points.length === 0 || stroke.points.length > MAX_POINTS_PER_STROKE) {
        throw new Error(`pages[${pageIndex}].strokes[${strokeIndex}].points is invalid`);
      }
      totalPoints += stroke.points.length;
      if (totalPoints > MAX_TOTAL_POINTS) throw new Error("Handwritten response contains too many points");
      return {
        width,
        points: stroke.points.map((value, pointIndex) => point(value, `pages[${pageIndex}].strokes[${strokeIndex}].points[${pointIndex}]`)),
      };
    });
    return { strokes };
  });

  const answer: InkAnswer = { version: 1, pages, typed: source.typed };
  return JSON.stringify(answer);
}
