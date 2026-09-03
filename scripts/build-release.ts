import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  macDistributionConfig,
  notaryAuthenticationArguments,
  type MacDistributionConfig,
} from "./macos-distribution.ts";

interface PackageMetadata {
  version: string;
}

interface ReleaseTarget {
  archiveExtension: ".zip" | ".tar.gz";
  binaryName: string;
  id: string;
  target: Bun.Build.CompileTarget;
}

interface Archive {
  archiveName: string;
  archivePath: string;
}

interface MacUniversalArchitecture {
  id: string;
  lipoArchitecture: string;
  target: Bun.Build.CompileTarget;
}

interface MacAppPaths {
  appDirectory: string;
  binaryPath: string;
}

const root = resolve(import.meta.dir, "..");
const releaseDirectory = join(root, "release");
const packageMetadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as PackageMetadata;
const version = packageMetadata.version;
const userGuideSource = join(root, "USER_GUIDE.md");
const userGuideAssetName = `DigitalDP-${version}-User-Guide.txt`;
const appIconPng = join(root, "assets", "app-icon-master.png");
const appIconIcns = join(root, "assets", "app-icon.icns");
const appIconIco = join(root, "assets", "app-icon.ico");
const macEntitlements = join(root, "assets", "macos-entitlements.plist");

const versionMatch = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-demo\.(\d+))?$/u);
if (!versionMatch) {
  throw new Error("package.json requires a valid release version");
}
const [, releaseMajor, releaseMinor, releasePatch, demoIteration] = versionMatch;
const macShortVersion = `${releaseMajor}.${releaseMinor}.${releasePatch}`;
const macBuildVersion = `${Math.max(1, Number(releaseMajor))}.${releaseMinor}.${releasePatch}${demoIteration ? `d${demoIteration}` : ""}`;

const macUniversalArchitectures: readonly MacUniversalArchitecture[] = [
  { id: "arm64", lipoArchitecture: "arm64", target: "bun-darwin-arm64" },
  { id: "x64", lipoArchitecture: "x86_64", target: "bun-darwin-x64-baseline" },
];

const macUniversalTarget = {
  archiveExtension: ".zip" as const,
  binaryName: "DigitalDP",
  id: "macos-universal",
};

const targets: readonly ReleaseTarget[] = [
  { id: "windows-x64", target: "bun-windows-x64-baseline", binaryName: "DigitalDP.exe", archiveExtension: ".zip" },
  { id: "linux-x64", target: "bun-linux-x64-baseline", binaryName: "DigitalDP", archiveExtension: ".tar.gz" },
];

const retiredArchiveNames = [
  `DigitalDP-${version}-macos-arm64.zip`,
  `DigitalDP-${version}-macos-x64.zip`,
];

function run(command: string[], cwd: string): void {
  const result = Bun.spawnSync({ cmd: command, cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode === 0) return;
  const output = new TextDecoder().decode(result.stderr) || new TextDecoder().decode(result.stdout);
  throw new Error(`${command[0]} failed: ${output.trim()}`);
}

function macInfoPlist(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDisplayName</key><string>DigitalDP</string>
  <key>CFBundleExecutable</key><string>DigitalDP</string>
  <key>CFBundleIdentifier</key><string>org.digitaldp.demo</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundleName</key><string>DigitalDP</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${macShortVersion}</string>
  <key>CFBundleVersion</key><string>${macBuildVersion}</string>
</dict></plist>
`;
}

function copyReleaseDocumentation(destination: string): void {
  copyFileSync(join(releaseDirectory, "README.md"), join(destination, "README.txt"));
  copyFileSync(userGuideSource, join(destination, "USER-GUIDE.txt"));
}

function archiveDirectory(directory: string, archivePath: string, extension: ReleaseTarget["archiveExtension"]): void {
  if (extension === ".zip") {
    if (process.platform === "darwin") {
      run([
        "ditto",
        "-c",
        "-k",
        "--keepParent",
        "--norsrc",
        "--noextattr",
        "--noqtn",
        "--noacl",
        directory,
        archivePath,
      ], root);
      return;
    }
    run(["zip", "-q", "-r", archivePath, basename(directory)], resolve(directory, ".."));
    return;
  }
  run(["tar", "-czf", archivePath, "-C", resolve(directory, ".."), basename(directory)], root);
}

function archiveNotarizedMacDirectory(directory: string, archivePath: string): void {
  // Preserve macOS bundle metadata during notary submission and keep Apple's
  // stapled ticket intact in the final download.
  run(["ditto", "-c", "-k", "--keepParent", directory, archivePath], root);
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function compileExecutable(target: Bun.Build.CompileTarget, outputPath: string, label: string): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(root, "release-app.ts")],
    compile: target.startsWith("bun-windows-")
      ? {
          target,
          outfile: outputPath,
          windows: {
            icon: appIconIco,
            title: "DigitalDP",
            publisher: "DigitalDP",
            description: "Local digital examination familiarisation",
          },
        }
      : { target, outfile: outputPath },
  });
  if (!result.success) throw new Error(`Could not compile ${label}: ${result.logs.map((log) => log.message).join("; ")}`);
}

function archivePackage(
  packageDirectory: string,
  archiveExtension: ReleaseTarget["archiveExtension"],
  stagingRoot: string,
): Archive {
  const archiveName = `${basename(packageDirectory)}${archiveExtension}`;
  const archivePath = join(stagingRoot, archiveName);
  archiveDirectory(packageDirectory, archivePath, archiveExtension);
  return { archiveName, archivePath };
}

function archiveNotarizedMacPackage(packageDirectory: string, stagingRoot: string): Archive {
  const archiveName = `${basename(packageDirectory)}.zip`;
  const archivePath = join(stagingRoot, archiveName);
  archiveNotarizedMacDirectory(packageDirectory, archivePath);
  return { archiveName, archivePath };
}

function prepareMacApp(packageDirectory: string): MacAppPaths {
  const appDirectory = join(packageDirectory, "DigitalDP.app");
  const contentsDirectory = join(appDirectory, "Contents");
  const macOsDirectory = join(contentsDirectory, "MacOS");
  const resourcesDirectory = join(contentsDirectory, "Resources");
  mkdirSync(macOsDirectory, { recursive: true });
  mkdirSync(resourcesDirectory, { recursive: true });
  writeFileSync(join(contentsDirectory, "Info.plist"), macInfoPlist());
  copyFileSync(appIconIcns, join(resourcesDirectory, "AppIcon.icns"));
  return { appDirectory, binaryPath: join(macOsDirectory, macUniversalTarget.binaryName) };
}

async function buildMacUniversal(stagingRoot: string): Promise<Archive> {
  if (process.platform !== "darwin") throw new Error("A macOS host with lipo is required to build the macos-universal archive");
  const distribution = macDistributionConfig();

  const packageName = `DigitalDP-${version}-${macUniversalTarget.id}`;
  const packageDirectory = join(stagingRoot, packageName);
  mkdirSync(packageDirectory, { recursive: true });

  const { appDirectory, binaryPath } = prepareMacApp(packageDirectory);
  const architecturePaths: string[] = [];
  for (const architecture of macUniversalArchitectures) {
    const architecturePath = join(stagingRoot, `${packageName}-${architecture.id}`);
    await compileExecutable(architecture.target, architecturePath, `macos-${architecture.id}`);
    architecturePaths.push(architecturePath);
  }
  run(["xcrun", "lipo", "-create", ...architecturePaths, "-output", binaryPath], root);
  run(["xcrun", "lipo", binaryPath, "-verify_arch", ...macUniversalArchitectures.map(({ lipoArchitecture }) => lipoArchitecture)], root);
  chmodSync(binaryPath, 0o755);
  signAndNotarizeMacApp(appDirectory, stagingRoot, distribution);

  copyReleaseDocumentation(packageDirectory);
  return archiveNotarizedMacPackage(packageDirectory, stagingRoot);
}

function signAndNotarizeMacApp(
  appDirectory: string,
  stagingRoot: string,
  distribution: MacDistributionConfig,
): void {
  // `lipo` invalidates the linker signatures on the two input slices. Sign the
  // finished universal bundle once, with the hardened runtime required by
  // Apple's notary service and the runtime permissions required by Bun.
  run([
    "codesign",
    "--force",
    "--options",
    "runtime",
    "--timestamp",
    "--entitlements",
    macEntitlements,
    "--sign",
    distribution.signingIdentity,
    appDirectory,
  ], root);
  run(["codesign", "--verify", "--deep", "--strict", "--all-architectures", appDirectory], root);

  const submissionArchive = join(stagingRoot, "DigitalDP-notarization.zip");
  archiveNotarizedMacDirectory(appDirectory, submissionArchive);
  run([
    "xcrun",
    "notarytool",
    "submit",
    submissionArchive,
    ...notaryAuthenticationArguments(distribution),
    "--wait",
    "--timeout",
    "30m",
  ], root);
  run(["xcrun", "stapler", "staple", "-v", appDirectory], root);
  run(["xcrun", "stapler", "validate", "-v", appDirectory], root);
  run(["spctl", "--assess", "--type", "execute", "--verbose=4", appDirectory], root);
}

async function buildTarget(target: ReleaseTarget, stagingRoot: string): Promise<Archive> {
  const packageName = `DigitalDP-${version}-${target.id}`;
  const packageDirectory = join(stagingRoot, packageName);
  mkdirSync(packageDirectory, { recursive: true });

  const binaryPath = join(packageDirectory, target.binaryName);
  await compileExecutable(target.target, binaryPath, target.id);
  if (target.id.startsWith("linux-")) copyFileSync(appIconPng, join(packageDirectory, "DigitalDP.png"));

  copyReleaseDocumentation(packageDirectory);
  return archivePackage(packageDirectory, target.archiveExtension, stagingRoot);
}

mkdirSync(releaseDirectory, { recursive: true });
const stagingRoot = mkdtempSync(join(tmpdir(), "digitaldp-release-"));

try {
  console.log(`Building ${macUniversalTarget.id}…`);
  const archives: Archive[] = [await buildMacUniversal(stagingRoot)];
  for (const target of targets) {
    console.log(`Building ${target.id}…`);
    archives.push(await buildTarget(target, stagingRoot));
  }

  for (const archiveName of retiredArchiveNames) rmSync(join(releaseDirectory, archiveName), { force: true });
  for (const archive of archives) copyFileSync(archive.archivePath, join(releaseDirectory, archive.archiveName));
  copyFileSync(userGuideSource, join(releaseDirectory, userGuideAssetName));
  const releaseAssetNames = [...archives.map(({ archiveName }) => archiveName), userGuideAssetName];
  const checksums = releaseAssetNames
    .map((assetName) => `${sha256(join(releaseDirectory, assetName))}  ${assetName}`)
    .join("\n");
  writeFileSync(join(releaseDirectory, "SHA256SUMS.txt"), `${checksums}\n`);
  console.log(`Created ${archives.length} standalone bundles in ${releaseDirectory}`);
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}
