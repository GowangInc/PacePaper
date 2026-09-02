export type ByteRangeResult =
  | { kind: "full" }
  | { kind: "partial"; start: number; end: number; length: number }
  | { kind: "unsatisfiable" };

export function parseByteRange(header: string | null, size: number): ByteRangeResult {
  if (header === null) return { kind: "full" };
  if (!Number.isSafeInteger(size) || size < 0) throw new RangeError("Asset size must be a non-negative integer");
  if (size === 0) return { kind: "unsatisfiable" };

  const match = /^bytes=(\d*)-(\d*)$/u.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return { kind: "unsatisfiable" };

  if (match[1] === "") {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { kind: "unsatisfiable" };
    const length = Math.min(suffixLength, size);
    return { kind: "partial", start: size - length, end: size - 1, length };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] === "" ? size - 1 : Number(match[2]);
  if (
    !Number.isSafeInteger(start)
    || !Number.isSafeInteger(requestedEnd)
    || start < 0
    || start >= size
    || requestedEnd < start
  ) {
    return { kind: "unsatisfiable" };
  }
  const end = Math.min(requestedEnd, size - 1);
  return { kind: "partial", start, end, length: end - start + 1 };
}
