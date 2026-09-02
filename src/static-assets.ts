import embeddedStaticAssets from "./static-assets.generated.js";

// The generated module stays JavaScript because TypeScript gives an HTML file
// its HTMLBundle type even when Bun's `type: "file"` attribute returns a path.
const STATIC_ASSETS: Readonly<Record<string, string>> = embeddedStaticAssets;

/**
 * Returns a filesystem path in development and Bun's internal `$bunfs/` path
 * after `bun build --compile`. Either can be passed directly to `Bun.file()`.
 */
export function staticAssetPath(sourcePath: string): string | null {
  return STATIC_ASSETS[sourcePath] ?? null;
}

export const staticAssetSourcePaths = Object.freeze(Object.keys(STATIC_ASSETS));
