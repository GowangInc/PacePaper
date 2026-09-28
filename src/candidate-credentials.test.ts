import { beforeAll, describe, expect, test } from "bun:test";
import {
  PIN_ALPHABET,
  type CandidateCredentialIssuance,
  isCandidateCredentialRevoked,
  issueCandidateCredentials,
  normalizeCandidatePin,
  normalizeCandidateToken,
  revokeCandidateCredentials,
  verifyCandidatePin,
  verifyCandidateToken,
} from "./candidate-credentials.ts";

let issuance: CandidateCredentialIssuance;

beforeAll(async () => {
  issuance = await issueCandidateCredentials();
});

describe("candidate credentials", () => {
  test("issues a human-enterable PIN and opaque token separately from stored hashes", () => {
    expect(issuance.oneTime.pin).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    expect(issuance.oneTime.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(issuance.stored).toEqual({
      state: "active",
      pinHash: expect.any(String),
      tokenHash: expect.any(String),
    });
    expect(issuance.stored.pinHash).not.toContain(normalizeCandidatePin(issuance.oneTime.pin));
    expect(issuance.stored.tokenHash).not.toContain(issuance.oneTime.token);
  });

  test("normalizes only the human-entered presentation differences each credential allows", () => {
    expect(PIN_ALPHABET).toHaveLength(32);
    expect(normalizeCandidatePin(" abcd - 2345\n")).toBe("ABCD2345");
    expect(normalizeCandidateToken("  Ab_C-de  ")).toBe("Ab_C-de");
  });

  test("accepts correct credentials and rejects incorrect credentials", async () => {
    const compactPin = normalizeCandidatePin(issuance.oneTime.pin);
    const replacement = compactPin[0] === "2" ? "3" : "2";
    const wrongPin = `${replacement}${compactPin.slice(1)}`;

    await expect(verifyCandidatePin(issuance.stored, compactPin.toLowerCase())).resolves.toBeTrue();
    await expect(verifyCandidatePin(issuance.stored, wrongPin)).resolves.toBeFalse();
    await expect(verifyCandidateToken(issuance.stored, ` ${issuance.oneTime.token} `)).resolves.toBeTrue();
    await expect(verifyCandidateToken(issuance.stored, `${issuance.oneTime.token}x`)).resolves.toBeFalse();
  });

  test("revokes immutably and preserves the first revocation", async () => {
    const active = issuance.stored;
    const revoked = revokeCandidateCredentials(active, 1_234);

    expect(active.state).toBe("active");
    expect(isCandidateCredentialRevoked(active)).toBeFalse();
    expect(isCandidateCredentialRevoked(revoked)).toBeTrue();
    expect(revokeCandidateCredentials(revoked, 9_999)).toBe(revoked);
    expect(revoked.revokedAt).toBe(1_234);
    await expect(verifyCandidatePin(revoked, issuance.oneTime.pin)).resolves.toBeFalse();
    await expect(verifyCandidateToken(revoked, issuance.oneTime.token)).resolves.toBeFalse();
  });
});
