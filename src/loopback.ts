const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function isExpectedLoopbackAuthority(url: URL, expectedPort: number): boolean {
  const requestPort = Number(url.port || (url.protocol === "http:" ? 80 : url.protocol === "https:" ? 443 : 0));
  return url.protocol === "http:"
    && LOOPBACK_HOSTNAMES.has(url.hostname.toLowerCase())
    && requestPort === expectedPort;
}
