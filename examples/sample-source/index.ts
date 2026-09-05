import { HUMANITIES_SAMPLE_PAPERS } from "./humanities.ts";
import { LANGUAGE_SAMPLE_PAPERS } from "./languages.ts";
import { STEM_SAMPLE_PAPERS } from "./stem.ts";
import { INTERNATIONAL_SAMPLE_COURSE_IDS, INTERNATIONAL_SAMPLE_PAPERS } from "./international.ts";

export { SAMPLE_SERIES, allocatedMarks } from "./helpers.ts";

export const CURRENT_SAMPLE_COURSE_IDS = [
  "english-a-language-literature",
  "english-a-literature",
  "english-b",
  "mathematics-analysis-approaches",
  "mathematics-applications-interpretation",
  "biology",
  "chemistry",
  "physics",
  "psychology",
  "business-management",
  "korean-a-language-literature",
  "korean-a-literature",
  "japanese-a-language-literature",
  "japanese-a-literature",
  "spanish-a-language-literature",
  "spanish-a-literature",
  "spanish-b",
  ...INTERNATIONAL_SAMPLE_COURSE_IDS,
] as const;

export const COURSE_SAMPLE_PAPERS = [
  ...LANGUAGE_SAMPLE_PAPERS,
  ...STEM_SAMPLE_PAPERS,
  ...HUMANITIES_SAMPLE_PAPERS,
  ...INTERNATIONAL_SAMPLE_PAPERS,
];
