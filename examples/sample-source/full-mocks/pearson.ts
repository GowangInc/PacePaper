import type { FullMock } from "./types.ts";
import { PEARSON_LINEAR_ONE } from "./pearson-linear-one.ts";
import { PEARSON_LINEAR_TWO } from "./pearson-linear-two.ts";
import { PEARSON_MODULAR_ONE } from "./pearson-modular-one.ts";
import { PEARSON_MODULAR_TWO } from "./pearson-modular-two.ts";

export const PEARSON_FULL_MOCKS: FullMock[] = [
  ...PEARSON_LINEAR_ONE,
  ...PEARSON_LINEAR_TWO,
  ...PEARSON_MODULAR_ONE,
  ...PEARSON_MODULAR_TWO,
];
