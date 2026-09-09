const LOOPBACK_AUTHORITIES = new Set(["127.0.0.1", "localhost", "[::1]"]);
const LOOPBACK_BINDS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export interface DemoNetworkConfig {
  bindHostname: string;
  lanOrigin: string | null;
}

function requestPort(url: URL): number {
  return Number(url.port || (url.protocol === "http:" ? 80 : url.protocol === "https:" ? 443 : 0));
}

export function isPrivateIpv4Address(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  return octets[0] === 10
    || (octets[0] === 172 && octets[1]! >= 16 && octets[1]! <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

export function parseLanOrigin(value: string | undefined, expectedPort: number): string | null {
  if (value === undefined || !value.trim()) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DIGITALDP_LAN_ORIGIN must be an HTTP origin such as http://192.168.1.20:9148");
  }
  if (
    url.protocol !== "http:"
    || !isPrivateIpv4Address(url.hostname)
    || requestPort(url) !== expectedPort
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) {
    throw new Error(`DIGITALDP_LAN_ORIGIN must be a private IPv4 HTTP origin on port ${expectedPort}`);
  }
  return url.origin;
}

export function demoNetworkConfig({
  port,
  bindHostname,
  lanOrigin,
  allowInactiveLanBinding = false,
}: {
  port: number;
  bindHostname?: string;
  lanOrigin?: string;
  /**
   * The packaged desktop app stays bound to all interfaces so a teacher can
   * enable a verified LAN address from its dashboard without a restart. Until
   * an address is selected, request-authority checks still reject every
   * non-loopback client.
   */
  allowInactiveLanBinding?: boolean;
}): DemoNetworkConfig {
  const parsedLanOrigin = parseLanOrigin(lanOrigin, port);
  const requestedBind = (bindHostname ?? (parsedLanOrigin || allowInactiveLanBinding ? "0.0.0.0" : "127.0.0.1")).trim().toLowerCase();
  const lanHostname = parsedLanOrigin ? new URL(parsedLanOrigin).hostname : null;
  const validBind = parsedLanOrigin
    ? requestedBind === "0.0.0.0" || requestedBind === lanHostname
    : (allowInactiveLanBinding && requestedBind === "0.0.0.0") || LOOPBACK_BINDS.has(requestedBind);
  if (!validBind) {
    throw new Error(parsedLanOrigin
      ? "HOST must be 0.0.0.0 or match DIGITALDP_LAN_ORIGIN"
      : allowInactiveLanBinding
        ? "Managed network mode requires HOST to be 0.0.0.0 or loopback"
        : "A non-loopback HOST requires DIGITALDP_LAN_ORIGIN");
  }
  return { bindHostname: requestedBind, lanOrigin: parsedLanOrigin };
}

export function isLoopbackAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const normalized = address.toLowerCase().split("%")[0] as string;
  if (normalized === "::1") return true;
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  return /^127(?:\.\d{1,3}){3}$/u.test(ipv4);
}

export function isExpectedRequestAuthority(
  url: URL,
  expectedPort: number,
  clientAddress: string | null | undefined,
  lanOrigin: string | null,
): boolean {
  if (url.protocol !== "http:" || requestPort(url) !== expectedPort) return false;
  if (isLoopbackAddress(clientAddress)) return LOOPBACK_AUTHORITIES.has(url.hostname.toLowerCase());
  return lanOrigin !== null && url.origin === lanOrigin;
}

const LAN_STUDENT_API_METHODS: Readonly<Record<string, ReadonlySet<string>>> = {
  "/api/bootstrap": new Set(["GET"]),
  "/api/student/roster": new Set(["POST"]),
  "/api/login/student": new Set(["POST"]),
  "/api/logout": new Set(["POST"]),
  "/api/student/state": new Set(["GET"]),
  "/api/student/response": new Set(["PUT"]),
  "/api/student/submit": new Set(["POST"]),
  "/api/student/audio-play": new Set(["POST"]),
  "/api/student/audio-play/start": new Set(["POST"]),
  "/api/student/audio-play/complete": new Set(["POST"]),
  "/api/student/focus-event": new Set(["POST"]),
};

export function isLanStudentApiRequest(pathname: string, method: string): boolean {
  const normalizedMethod = method.toUpperCase();
  if (/^\/api\/assets\/[a-f0-9-]+\/[a-z0-9_-]+$/u.test(pathname)) {
    return normalizedMethod === "GET" || normalizedMethod === "HEAD";
  }
  return LAN_STUDENT_API_METHODS[pathname]?.has(normalizedMethod) ?? false;
}

export function studentOriginFor(requestUrl: URL, lanOrigin: string | null): string {
  return lanOrigin ?? requestUrl.origin;
}
