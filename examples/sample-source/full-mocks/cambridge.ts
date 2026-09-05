import { CAMBRIDGE_CORE_MOCKS } from "./cambridge-core.ts";
import { CAMBRIDGE_EXTENDED_MOCKS } from "./cambridge-extended.ts";
import type { FullMock } from "./types.ts";

export const CAMBRIDGE_FULL_MOCKS: FullMock[] = [
  CAMBRIDGE_CORE_MOCKS[0]!,
  CAMBRIDGE_EXTENDED_MOCKS[0]!,
  CAMBRIDGE_CORE_MOCKS[1]!,
  CAMBRIDGE_EXTENDED_MOCKS[1]!,
];
