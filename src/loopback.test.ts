import { describe, expect, test } from "bun:test";
import { isExpectedLoopbackAuthority } from "./loopback.ts";

describe("local demo request authority", () => {
  test("accepts only supported loopback names on the listening port", () => {
    expect(isExpectedLoopbackAuthority(new URL("http://127.0.0.1:9148/admin"), 9148)).toBe(true);
    expect(isExpectedLoopbackAuthority(new URL("http://localhost:9148/admin"), 9148)).toBe(true);
    expect(isExpectedLoopbackAuthority(new URL("http://[::1]:9148/admin"), 9148)).toBe(true);
  });

  test("rejects forged hosts, other ports and other protocols", () => {
    expect(isExpectedLoopbackAuthority(new URL("http://evil.example:9148/admin"), 9148)).toBe(false);
    expect(isExpectedLoopbackAuthority(new URL("http://127.0.0.1:9000/admin"), 9148)).toBe(false);
    expect(isExpectedLoopbackAuthority(new URL("https://127.0.0.1:9148/admin"), 9148)).toBe(false);
  });
});
