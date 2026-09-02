import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname } from "node:path";

/** A private IPv4 address which is currently assigned to a local interface. */
export interface LocalPrivateIpv4Interface {
  interfaceName: string;
  address: string;
}

interface NetworkInterfaceAddress {
  address: string;
  family: string | number;
  internal: boolean;
}

type NetworkInterfaceMap = Record<string, readonly NetworkInterfaceAddress[] | undefined>;

export interface ClassroomNetworkSnapshot {
  /** False for source/development runs, where LAN control remains environment-managed. */
  managed: boolean;
  /** The teacher's saved interface choice, even while LAN sharing is disabled. */
  selectedAddress: string | null;
  /** The currently active student-facing origin, or null when LAN sharing is off. */
  lanOrigin: string | null;
}

export interface ClassroomNetworkStateOptions {
  /** Explicitly opt in only from a release-managed runtime. */
  managed: boolean;
  port: number;
  selectedAddress?: string | null;
}

const SETTINGS_VERSION = 1;

function ipv4Octets(address: string): number[] | null {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return null;
  const octets = address.split(".").map(Number);
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
  // Do not accept alternative spellings such as 192.168.001.20 in persisted state.
  return octets.join(".") === address ? octets : null;
}

export function isPrivateIpv4Address(address: string): boolean {
  const octets = ipv4Octets(address);
  if (!octets) return false;
  const [first, second] = octets;
  return first === 10
    || (first === 172 && second !== undefined && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}

function validPort(port: number): number {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("Classroom sharing requires a TCP port from 1 to 65535");
  }
  return port;
}

function assertSelectedLocalAddress(address: string, available: readonly LocalPrivateIpv4Interface[]): string {
  if (!isPrivateIpv4Address(address)) {
    throw new Error("Classroom sharing requires a private IPv4 address");
  }
  if (!available.some((candidate) => candidate.address === address)) {
    throw new Error("The selected classroom address is not currently assigned to this computer");
  }
  return address;
}

/**
 * Returns a deterministic, UI-ready list. Loopback, link-local, public, and
 * virtual addresses outside RFC1918 ranges are deliberately excluded.
 */
export function listLocalPrivateIpv4Interfaces(
  interfaces: NetworkInterfaceMap = networkInterfaces(),
): LocalPrivateIpv4Interface[] {
  const candidates: LocalPrivateIpv4Interface[] = [];
  for (const [interfaceName, entries] of Object.entries(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.internal || (entry.family !== "IPv4" && entry.family !== 4) || !isPrivateIpv4Address(entry.address)) continue;
      candidates.push({ interfaceName, address: entry.address });
    }
  }
  return candidates.sort((left, right) => (
    left.interfaceName.localeCompare(right.interfaceName) || left.address.localeCompare(right.address)
  ));
}

/**
 * The sidecar deliberately contains only the chosen address. The port and
 * whether sharing is currently active are runtime concerns and are never
 * persisted.
 */
export function classroomNetworkSettingsPath(databasePath: string): string {
  if (!databasePath.trim()) throw new Error("DIGITALDP_DB must name a database file");
  return `${databasePath}.classroom-network.json`;
}

export function loadSelectedClassroomAddress(
  databasePath: string,
  available: readonly LocalPrivateIpv4Interface[] = listLocalPrivateIpv4Interfaces(),
): string | null {
  const settingsPath = classroomNetworkSettingsPath(databasePath);
  let contents: string;
  try {
    contents = readFileSync(settingsPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }

  try {
    const parsed: unknown = JSON.parse(contents);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (record.version !== SETTINGS_VERSION || typeof record.address !== "string" || Object.keys(record).length !== 2) return null;
    return assertSelectedLocalAddress(record.address, available);
  } catch {
    // A stale DHCP lease or hand-edited/corrupt sidecar must never expose LAN sharing.
    return null;
  }
}

export function persistSelectedClassroomAddress(
  databasePath: string,
  address: string,
  available: readonly LocalPrivateIpv4Interface[] = listLocalPrivateIpv4Interfaces(),
): string {
  const selectedAddress = assertSelectedLocalAddress(address, available);
  const settingsPath = classroomNetworkSettingsPath(databasePath);
  const temporaryPath = `${settingsPath}.${crypto.randomUUID()}.tmp`;
  const contents = `${JSON.stringify({ version: SETTINGS_VERSION, address: selectedAddress })}\n`;

  mkdirSync(dirname(settingsPath), { recursive: true });
  try {
    writeFileSync(temporaryPath, contents, { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, settingsPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
  return selectedAddress;
}

export function classroomLanOrigin(address: string, port: number): string {
  if (!isPrivateIpv4Address(address)) throw new Error("Classroom sharing requires a private IPv4 address");
  return new URL(`http://${address}:${validPort(port)}`).origin;
}

/**
 * Runtime-only LAN state for a packaged release. It starts disabled, so an
 * address loaded from disk remains a preference until a teacher explicitly
 * enables sharing for the current class session.
 */
export class ClassroomNetworkState {
  readonly #managed: boolean;
  readonly #port: number;
  #selectedAddress: string | null;
  #lanOrigin: string | null = null;

  constructor({ managed, port, selectedAddress = null }: ClassroomNetworkStateOptions) {
    this.#managed = managed;
    this.#port = validPort(port);
    if (selectedAddress !== null && !isPrivateIpv4Address(selectedAddress)) {
      throw new Error("Classroom sharing requires a private IPv4 address");
    }
    this.#selectedAddress = selectedAddress;
  }

  snapshot(): ClassroomNetworkSnapshot {
    return {
      managed: this.#managed,
      selectedAddress: this.#selectedAddress,
      lanOrigin: this.#lanOrigin,
    };
  }

  enable(address: string, available: readonly LocalPrivateIpv4Interface[]): ClassroomNetworkSnapshot {
    if (!this.#managed) {
      throw new Error("Classroom sharing is available only in a managed release");
    }
    this.#selectedAddress = assertSelectedLocalAddress(address, available);
    this.#lanOrigin = classroomLanOrigin(this.#selectedAddress, this.#port);
    return this.snapshot();
  }

  disable(): ClassroomNetworkSnapshot {
    this.#lanOrigin = null;
    return this.snapshot();
  }
}
