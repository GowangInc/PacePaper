import { describe, expect, test } from "bun:test";
import { createClientId } from "./client-id.js";

describe("exam client identifiers", () => {
  test("uses the native UUID API when available", () => {
    expect(createClientId({ randomUUID: () => "native-id" })).toBe("native-id");
  });

  test("generates a UUID v4 when randomUUID is unavailable on HTTP LAN pages", () => {
    const cryptoApi = {
      getRandomValues(bytes) {
        bytes.fill(0);
        return bytes;
      },
    };
    const id = createClientId(cryptoApi);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  });
});
