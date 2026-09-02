import { describe, expect, test } from "bun:test";
import { parseByteRange } from "./http-range.ts";

describe("parseByteRange", () => {
  test("uses the full representation when Range is absent", () => {
    expect(parseByteRange(null, 1_000)).toEqual({ kind: "full" });
  });

  test("parses bounded, open-ended and suffix byte ranges", () => {
    expect(parseByteRange("bytes=100-199", 1_000)).toEqual({ kind: "partial", start: 100, end: 199, length: 100 });
    expect(parseByteRange("bytes=900-", 1_000)).toEqual({ kind: "partial", start: 900, end: 999, length: 100 });
    expect(parseByteRange("bytes=-125", 1_000)).toEqual({ kind: "partial", start: 875, end: 999, length: 125 });
  });

  test("clamps an end beyond the representation", () => {
    expect(parseByteRange("bytes=950-5000", 1_000)).toEqual({ kind: "partial", start: 950, end: 999, length: 50 });
  });

  test("rejects malformed, multiple and out-of-bounds ranges", () => {
    for (const header of ["items=0-1", "bytes=", "bytes=0-1,4-5", "bytes=1000-", "bytes=4-3", "bytes=-0"]) {
      expect(parseByteRange(header, 1_000)).toEqual({ kind: "unsatisfiable" });
    }
    expect(parseByteRange("bytes=0-0", 0)).toEqual({ kind: "unsatisfiable" });
  });
});
