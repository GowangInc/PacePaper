import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  statfsSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Database } from "bun:sqlite";

export type DatabaseCheckMode = "quick" | "integrity";

export interface DatabaseCheckResult {
  mode: DatabaseCheckMode;
  ok: boolean;
  messages: string[];
}

export interface DatabaseSpacePreflight {
  requiredBytes: bigint;
  availableBytes: bigint;
}

export type AvailableBytesProvider = (directory: string) => bigint;

export interface SnapshotVerificationResult {
  ok: boolean;
  sizeBytes: bigint;
  check: DatabaseCheckResult;
}

export interface CreateSnapshotOptions {
  getAvailableBytes?: AvailableBytesProvider;
  overwrite?: boolean;
}

export interface VerifiedSnapshot {
  snapshotPath: string;
  sizeBytes: bigint;
  check: DatabaseCheckResult;
}

export class InsufficientDatabaseSpaceError extends Error {
  readonly code = "DATABASE_RECOVERY_INSUFFICIENT_SPACE";

  constructor(
    readonly requiredBytes: bigint,
    readonly availableBytes: bigint,
  ) {
    super("Insufficient free space for database recovery");
    this.name = "InsufficientDatabaseSpaceError";
  }
}

export class SnapshotDestinationExistsError extends Error {
  readonly code = "DATABASE_RECOVERY_DESTINATION_EXISTS";

  constructor() {
    super("Snapshot destination already exists");
    this.name = "SnapshotDestinationExistsError";
  }
}

export class SnapshotVerificationError extends Error {
  readonly code = "DATABASE_RECOVERY_VERIFICATION_FAILED";

  constructor(readonly check: DatabaseCheckResult) {
    super("Snapshot failed SQLite integrity verification");
    this.name = "SnapshotVerificationError";
  }
}

function checkMessages(database: Database, mode: DatabaseCheckMode): string[] {
  if (mode === "quick") {
    return database
      .query<{ quick_check: string }, []>("PRAGMA quick_check")
      .all()
      .map(({ quick_check }) => quick_check);
  }

  return database
    .query<{ integrity_check: string }, []>("PRAGMA integrity_check")
    .all()
    .map(({ integrity_check }) => integrity_check);
}

export function runDatabaseCheck(
  database: Database,
  mode: DatabaseCheckMode = "quick",
): DatabaseCheckResult {
  const messages = checkMessages(database, mode);
  return {
    mode,
    ok: messages.length === 1 && messages[0] === "ok",
    messages,
  };
}

export function filesystemAvailableBytes(directory: string): bigint {
  const stats = statfsSync(directory, { bigint: true });
  return stats.bavail * stats.bsize;
}

export function preflightDatabaseSpace(
  databasePath: string,
  requiredBytes: bigint,
  getAvailableBytes: AvailableBytesProvider = filesystemAvailableBytes,
): DatabaseSpacePreflight {
  if (requiredBytes < 0n) throw new RangeError("Required database space cannot be negative");

  const availableBytes = getAvailableBytes(dirname(resolve(databasePath)));
  if (availableBytes < requiredBytes) {
    throw new InsufficientDatabaseSpaceError(requiredBytes, availableBytes);
  }
  return { requiredBytes, availableBytes };
}

export function verifySnapshot(snapshotPath: string): SnapshotVerificationResult {
  const sizeBytes = statSync(snapshotPath, { bigint: true }).size;
  const snapshot = new Database(snapshotPath, { readonly: true, strict: true });
  try {
    const check = runDatabaseCheck(snapshot, "integrity");
    return { ok: check.ok, sizeBytes, check };
  } finally {
    snapshot.close(true);
  }
}

function snapshotUpperBoundBytes(database: Database): bigint {
  const pageCount = database.query<{ page_count: number }, []>("PRAGMA page_count").get()?.page_count ?? 0;
  const pageSize = database.query<{ page_size: number }, []>("PRAGMA page_size").get()?.page_size ?? 4096;
  return BigInt(Math.max(pageCount, 1)) * BigInt(pageSize);
}

export function createVerifiedSnapshot(
  database: Database,
  snapshotPath: string,
  options: CreateSnapshotOptions = {},
): VerifiedSnapshot {
  const destination = resolve(snapshotPath);
  const destinationDirectory = dirname(destination);
  mkdirSync(destinationDirectory, { recursive: true });

  if (!options.overwrite && existsSync(destination)) {
    throw new SnapshotDestinationExistsError();
  }

  preflightDatabaseSpace(
    destination,
    snapshotUpperBoundBytes(database),
    options.getAvailableBytes,
  );

  const temporaryPath = join(
    destinationDirectory,
    `.${basename(destination)}.${crypto.randomUUID()}.tmp`,
  );

  try {
    // VACUUM INTO is SQLite's transactional, WAL-aware alternative to its
    // backup API. The output is a rebuilt logical snapshot, not a byte copy.
    database.query("VACUUM INTO ?").run(temporaryPath);
    const verification = verifySnapshot(temporaryPath);
    if (!verification.ok) throw new SnapshotVerificationError(verification.check);

    if (!options.overwrite && existsSync(destination)) {
      throw new SnapshotDestinationExistsError();
    }
    renameSync(temporaryPath, destination);

    return {
      snapshotPath: destination,
      sizeBytes: verification.sizeBytes,
      check: verification.check,
    };
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

export type DatabaseRecoveryOperation =
  | "check"
  | "space-preflight"
  | "snapshot-create"
  | "snapshot-verify";

export interface DatabaseRecoveryDiagnosticsInput {
  operation: DatabaseRecoveryOperation;
  databasePath?: string;
  snapshotPath?: string;
  check?: DatabaseCheckResult;
  space?: DatabaseSpacePreflight;
  error?: unknown;
}

export interface RedactedDatabaseRecoveryDiagnostics {
  operation: DatabaseRecoveryOperation;
  databasePath?: "[redacted]";
  snapshotPath?: "[redacted]";
  recommendation: string;
  check?: {
    mode: DatabaseCheckMode;
    ok: boolean;
    issueCount: number;
  };
  space?: {
    requiredBytes: string;
    availableBytes: string;
    sufficient: boolean;
  };
  error?: {
    code: string;
  };
}

function diagnosticErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "UNKNOWN";
  const code = Reflect.get(error, "code");
  return typeof code === "string" && /^[A-Z][A-Z0-9_]*$/u.test(code) ? code : "UNKNOWN";
}
function recoveryRecommendation(
  operation: DatabaseRecoveryOperation,
  errorCode: string,
): string {
  if (errorCode === "DATABASE_RECOVERY_INSUFFICIENT_SPACE") {
    return "Free space on the database destination filesystem, then retry.";
  }
  if (errorCode === "DATABASE_RECOVERY_DESTINATION_EXISTS") {
    return "Choose a new snapshot destination or explicitly enable overwrite.";
  }
  if (errorCode === "DATABASE_RECOVERY_VERIFICATION_FAILED") {
    return "Keep the source database unchanged and retry after checking storage health.";
  }
  if (operation === "check") return "Run the database recovery check again after reviewing the database file.";
  if (operation === "snapshot-create") return "Keep the source database unchanged and retry snapshot creation.";
  if (operation === "snapshot-verify") return "Discard the unverified snapshot and create a new one.";
  return "Review the recovery state and retry the operation.";
}

export function databaseRecoveryDiagnostics(
  input: DatabaseRecoveryDiagnosticsInput,
): RedactedDatabaseRecoveryDiagnostics {
  const errorCode = input.error === undefined ? "UNKNOWN" : diagnosticErrorCode(input.error);
  return {
    operation: input.operation,
    databasePath: input.databasePath === undefined ? undefined : "[redacted]",
    snapshotPath: input.snapshotPath === undefined ? undefined : "[redacted]",
    recommendation: recoveryRecommendation(input.operation, errorCode),
    check: input.check === undefined
      ? undefined
      : {
          mode: input.check.mode,
          ok: input.check.ok,
          issueCount: input.check.ok ? 0 : input.check.messages.length,
        },
    space: input.space === undefined
      ? undefined
      : {
          requiredBytes: input.space.requiredBytes.toString(),
          availableBytes: input.space.availableBytes.toString(),
          sufficient: input.space.availableBytes >= input.space.requiredBytes,
        },
    error: input.error === undefined ? undefined : { code: errorCode },
  };
}
