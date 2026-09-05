export const RELEASE_PLATFORMS = ["macos-universal", "windows-x64", "linux-x64"] as const;
export type ReleasePlatform = typeof RELEASE_PLATFORMS[number];

/** A partial release must be explicit; omitting the flag keeps macOS signing mandatory. */
export function releasePlatforms(arguments_: readonly string[]): readonly ReleasePlatform[] {
  if (arguments_.length === 0) return RELEASE_PLATFORMS;
  if (arguments_.length !== 1 || !arguments_[0]?.startsWith("--platforms=")) {
    throw new Error("Usage: bun run release:build [--platforms=macos-universal,windows-x64,linux-x64]");
  }
  const requested = arguments_[0].slice("--platforms=".length).split(",");
  if (new Set(requested).size !== requested.length
    || requested.some((platform) => !RELEASE_PLATFORMS.some((known) => known === platform))) {
    throw new Error(`Choose distinct release platforms from: ${RELEASE_PLATFORMS.join(", ")}`);
  }
  return RELEASE_PLATFORMS.filter((platform) => requested.includes(platform));
}

export function releaseArchiveName(version: string, platform: ReleasePlatform): string {
  return `DigitalDP-${version}-${platform}${platform === "linux-x64" ? ".tar.gz" : ".zip"}`;
}
