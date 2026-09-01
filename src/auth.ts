import {
  createAuthSession,
  deleteAuthSession,
  findAuthSession,
  type AuthRow,
  type Role,
} from "./db.ts";

const COOKIE_NAME = "digitaldp_session";
const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
const STUDENT_SESSION_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 8;

interface AttemptWindow {
  count: number;
  resetAt: number;
}

export interface AuthActor extends AuthRow {
  tokenHash: string;
}

const attempts = new Map<string, AttemptWindow>();

function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (name) cookies[name] = value;
  }
  return cookies;
}

export function assertSameOrigin(request: Request): void {
  const target = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || (origin && origin !== target.origin)) {
    throw new Error("Cross-origin request rejected");
  }
}

export function authFromRequest(request: Request): AuthActor | null {
  const token = parseCookies(request.headers.get("cookie"))[COOKIE_NAME];
  if (!token || token.length > 200) return null;
  const tokenHash = hashToken(token);
  const auth = findAuthSession(tokenHash);
  return auth ? { ...auth, tokenHash } : null;
}

export function requireRole(request: Request, role: Role): AuthActor {
  const actor = authFromRequest(request);
  if (!actor || actor.role !== role) throw new Error("Authentication required");
  return actor;
}

export function issueSession(role: Role, actorId: string, secure: boolean): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(bytes).toString("base64url");
  const maxAge = role === "admin" ? ADMIN_SESSION_SECONDS : STUDENT_SESSION_SECONDS;
  createAuthSession(hashToken(token), role, actorId, Date.now() + maxAge * 1000);
  const secureAttribute = secure ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureAttribute}`;
}

export function revokeSession(request: Request, secure: boolean): string {
  const actor = authFromRequest(request);
  if (actor) deleteAuthSession(actor.tokenHash);
  const secureAttribute = secure ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureAttribute}`;
}

export function allowLoginAttempt(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= LOGIN_ATTEMPT_LIMIT;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
