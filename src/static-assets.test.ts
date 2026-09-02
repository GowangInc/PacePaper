import { readdir } from "node:fs/promises";
import { describe, expect, test } from "bun:test";
import { publicAssetPath, staticFilePath } from "./static-files.ts";
import { staticAssetPath, staticAssetSourcePaths } from "./static-assets.ts";

describe("compiled static assets", () => {
  test("includes every served production asset", async () => {
    const publicFiles = await readdir("public");
    const servedFiles = publicFiles
      .filter((file) => !file.includes(".test."))
      .map((file) => publicAssetPath(`/${file}`))
      .filter((file): file is string => file !== null);
    const pageFiles = ["/", "/admin", "/clock", "/student", "/presentation", "/tokens.css", "/paper-authoring/SKILL.md"]
      .map((pathname) => staticFilePath(pathname))
      .filter((file): file is string => file !== null);

    expect(new Set(staticAssetSourcePaths)).toEqual(new Set([...servedFiles, ...pageFiles]));
  });

  test("resolves each compiled asset to a readable file path in development", async () => {
    for (const sourcePath of staticAssetSourcePaths) {
      const resolvedPath = staticAssetPath(sourcePath);
      expect(resolvedPath).not.toBeNull();
      expect(await Bun.file(resolvedPath as string).exists(), sourcePath).toBeTrue();
    }
  });
});
