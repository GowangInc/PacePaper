import { CAMBRIDGE_FULL_MOCKS } from "./cambridge.ts";
import { PEARSON_FULL_MOCKS } from "./pearson.ts";
import { AP_ENGLISH_FULL_MOCK } from "./ap-english.ts";
import { AP_BIOLOGY_FULL_MOCK } from "./ap-biology.ts";
import { AP_CALCULUS_FULL_MOCK } from "./ap-calculus.ts";
import type { FullMock } from "./types.ts";

export const FULL_MOCKS: FullMock[] = [
  ...CAMBRIDGE_FULL_MOCKS,
  ...PEARSON_FULL_MOCKS,
  AP_ENGLISH_FULL_MOCK,
  AP_BIOLOGY_FULL_MOCK,
  AP_CALCULUS_FULL_MOCK,
];
