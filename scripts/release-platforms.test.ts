import { describe, expect, test } from "bun:test";
import { RELEASE_PLATFORMS, releaseArchiveName, releasePlatforms } from "./release-platforms.ts";

describe("explicit release platforms", () => {
  test("defaults to every platform, including the signed macOS build", () => {
    expect(releasePlatforms([])).toEqual(RELEASE_PLATFORMS);
  });

  test("allows an intentional Windows/Linux-only build in canonical order", () => {
    expect(releasePlatforms(["--platforms=linux-x64,windows-x64"])).toEqual(["windows-x64", "linux-x64"]);
    expect(releasePlatforms(["--platforms=macos-universal"])).toEqual(["macos-universal"]);
  });

  test("rejects empty, misspelled, duplicate, and unrelated arguments", () => {
    for (const args of [
      ["--platforms="], ["--platforms=macos"], ["--platforms=windows-x64,windows-x64"],
      ["--platforms=linux-x64,"], ["--platforms= linux-x64"], ["--skip-signing"],
      ["--platforms=linux-x64", "--platforms=windows-x64"],
    ]) expect(() => releasePlatforms(args)).toThrow();
  });

  test("names only the supported archive formats", () => {
    expect(RELEASE_PLATFORMS.map((platform) => releaseArchiveName("0.1.0-demo.5", platform))).toEqual([
      "DigitalDP-0.1.0-demo.5-macos-universal.zip",
      "DigitalDP-0.1.0-demo.5-windows-x64.zip",
      "DigitalDP-0.1.0-demo.5-linux-x64.tar.gz",
    ]);
  });
});
