import { describe, expect, test } from "bun:test";
import { macDistributionConfig, notaryAuthenticationArguments } from "./macos-distribution.ts";

describe("macOS distribution configuration", () => {
  test("requires a real signing identity", () => {
    expect(() => macDistributionConfig({})).toThrow("DIGITALDP_MAC_SIGN_IDENTITY");
    expect(() => macDistributionConfig({
      DIGITALDP_MAC_SIGN_IDENTITY: "-",
      DIGITALDP_MAC_NOTARY_PROFILE: "digitaldp",
    })).toThrow("not an ad-hoc identity");
  });

  test("requires notarization credentials", () => {
    expect(() => macDistributionConfig({
      DIGITALDP_MAC_SIGN_IDENTITY: "Developer ID Application: PacePaper (TEAMID)",
    })).toThrow("DIGITALDP_MAC_NOTARY_PROFILE");
  });

  test("adds a custom keychain only when configured", () => {
    const local = macDistributionConfig({
      DIGITALDP_MAC_SIGN_IDENTITY: "Developer ID Application: PacePaper (TEAMID)",
      DIGITALDP_MAC_NOTARY_PROFILE: "digitaldp",
    });
    expect(notaryAuthenticationArguments(local)).toEqual(["--keychain-profile", "digitaldp"]);

    const continuousIntegration = { ...local, notaryKeychain: "/tmp/signing.keychain-db" };
    expect(notaryAuthenticationArguments(continuousIntegration)).toEqual([
      "--keychain-profile",
      "digitaldp",
      "--keychain",
      "/tmp/signing.keychain-db",
    ]);
  });
});
