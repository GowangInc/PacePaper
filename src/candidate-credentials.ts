export const PIN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const PIN_LENGTH = 8;

const PIN_PATTERN = /^[2-9A-HJ-NP-Z]{8}$/u;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const PASSWORD_OPTIONS = { algorithm: "argon2id" } as const;

export interface CandidateCredentialSecrets {
  pin: string;
  token: string;
}

export interface ActiveCandidateCredentials {
  state: "active";
  pinHash: string;
  tokenHash: string;
}

export interface RevokedCandidateCredentials {
  state: "revoked";
  pinHash: string;
  tokenHash: string;
  revokedAt: number;
}

export type StoredCandidateCredentials = ActiveCandidateCredentials | RevokedCandidateCredentials;

export interface CandidateCredentialIssuance {
  oneTime: CandidateCredentialSecrets;
  stored: ActiveCandidateCredentials;
}

export function normalizeCandidatePin(pin: string): string {
  return pin.replace(/[\s-]+/gu, "").toUpperCase();
}

export function normalizeCandidateToken(token: string): string {
  return token.trim();
}

function randomPin(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(PIN_LENGTH));
  const compact = Array.from(bytes, (byte) => PIN_ALPHABET.charAt(byte & 31)).join("");
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

function randomToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

export async function issueCandidateCredentials(): Promise<CandidateCredentialIssuance> {
  const pin = randomPin();
  const token = randomToken();
  const [pinHash, tokenHash] = await Promise.all([
    Bun.password.hash(normalizeCandidatePin(pin), PASSWORD_OPTIONS),
    Bun.password.hash(token, PASSWORD_OPTIONS),
  ]);
  return {
    oneTime: { pin, token },
    stored: { state: "active", pinHash, tokenHash },
  };
}

export async function verifyCandidatePin(
  credentials: StoredCandidateCredentials,
  pin: string,
): Promise<boolean> {
  if (credentials.state !== "active") return false;
  const normalized = normalizeCandidatePin(pin);
  return PIN_PATTERN.test(normalized) && Bun.password.verify(normalized, credentials.pinHash);
}

export async function verifyCandidateToken(
  credentials: StoredCandidateCredentials,
  token: string,
): Promise<boolean> {
  if (credentials.state !== "active") return false;
  const normalized = normalizeCandidateToken(token);
  return TOKEN_PATTERN.test(normalized) && Bun.password.verify(normalized, credentials.tokenHash);
}

export function revokeCandidateCredentials(
  credentials: StoredCandidateCredentials,
  revokedAt = Date.now(),
): RevokedCandidateCredentials {
  return credentials.state === "revoked"
    ? credentials
    : { ...credentials, state: "revoked", revokedAt };
}

export function isCandidateCredentialRevoked(
  credentials: StoredCandidateCredentials,
): credentials is RevokedCandidateCredentials {
  return credentials.state === "revoked";
}
