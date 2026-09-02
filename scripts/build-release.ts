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

const root = resolve(import.meta.dir, "..");
const releaseDirectory = join(root, "release");
const packageMetadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as PackageMetadata;
const version = packageMetadata.version;

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
  throw new Error("package.json requires a valid release version");
}

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
  <key>CFBundleName</key><string>DigitalDP</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${version}</string>
  <key>CFBundleVersion</key><string>${version}</string>
</dict></plist>
`;
}

function copyReleaseGuide(destination: string): void {
  copyFileSync(join(releaseDirectory, "README.md"), join(destination, "README.txt"));
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

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function compileExecutable(target: Bun.Build.CompileTarget, outputPath: string, label: string): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(root, "release-app.ts")],
    compile: { target, outfile: outputPath },
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

function macAppBinaryPath(packageDirectory: string): string {
  const appDirectory = join(packageDirectory, "DigitalDP.app");
  const contentsDirectory = join(appDirectory, "Contents");
  const macOsDirectory = join(contentsDirectory, "MacOS");
  mkdirSync(macOsDirectory, { recursive: true });
  writeFileSync(join(contentsDirectory, "Info.plist"), macInfoPlist());
  return join(macOsDirectory, macUniversalTarget.binaryName);
}

async function buildMacUniversal(stagingRoot: string): Promise<Archive> {
  if (process.platform !== "darwin") throw new Error("A macOS host with lipo is required to build the macos-universal archive");

  const packageName = `DigitalDP-${version}-${macUniversalTarget.id}`;
  const packageDirectory = join(stagingRoot, packageName);
  mkdirSync(packageDirectory, { recursive: true });

  const binaryPath = macAppBinaryPath(packageDirectory);
  const architecturePaths: string[] = [];
  for (const architecture of macUniversalArchitectures) {
    const architecturePath = join(stagingRoot, `${packageName}-${architecture.id}`);
    await compileExecutable(architecture.target, architecturePath, `macos-${architecture.id}`);
    architecturePaths.push(architecturePath);
  }
  run(["xcrun", "lipo", "-create", ...architecturePaths, "-output", binaryPath], root);
  run(["xcrun", "lipo", binaryPath, "-verify_arch", ...macUniversalArchitectures.map(({ lipoArchitecture }) => lipoArchitecture)], root);
  chmodSync(binaryPath, 0o755);

  copyReleaseGuide(packageDirectory);
  return archivePackage(packageDirectory, macUniversalTarget.archiveExtension, stagingRoot);
}

async function buildTarget(target: ReleaseTarget, stagingRoot: string): Promise<Archive> {
  const packageName = `DigitalDP-${version}-${target.id}`;
  const packageDirectory = join(stagingRoot, packageName);
  mkdirSync(packageDirectory, { recursive: true });

  const binaryPath = join(packageDirectory, target.binaryName);
  await compileExecutable(target.target, binaryPath, target.id);

  copyReleaseGuide(packageDirectory);
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
  const checksums = archives
    .map((archive) => `${sha256(join(releaseDirectory, archive.archiveName))}  ${archive.archiveName}`)
    .join("\n");
  writeFileSync(join(releaseDirectory, "SHA256SUMS.txt"), `${checksums}\n`);
  console.log(`Created ${archives.length} standalone bundles in ${releaseDirectory}`);
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}
