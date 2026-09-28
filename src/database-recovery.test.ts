import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import {
  createVerifiedSnapshot,
  databaseRecoveryDiagnostics,
  InsufficientDatabaseSpaceError,
  preflightDatabaseSpace,
  runDatabaseCheck,
  verifySnapshot,
} from "./database-recovery.ts";

function withTemporaryDirectory(run: (directory: string) => void): void {
  const directory = mkdtempSync(join(tmpdir(), "digitaldp-recovery-test-"));
  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("database recovery", () => {
  test("reports healthy databases from quick and full integrity checks", () => {
    const database = new Database(":memory:", { strict: true });
    try {
      database.exec("CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
      database.query("INSERT INTO records (value) VALUES (?)").run("healthy");

      expect(runDatabaseCheck(database, "quick")).toEqual({
        mode: "quick",
        ok: true,
        messages: ["ok"],
      });
      expect(runDatabaseCheck(database, "integrity")).toEqual({
        mode: "integrity",
        ok: true,
        messages: ["ok"],
      });
    } finally {
      database.close(true);
    }
  });

  test("signals insufficient space through an injectable measurement", () => {
    withTemporaryDirectory((directory) => {
      const databasePath = join(directory, "database.sqlite");
      const getAvailableBytes = (measuredDirectory: string): bigint => {
        expect(measuredDirectory).toBe(directory);
        return 511n;
      };

      try {
        preflightDatabaseSpace(databasePath, 512n, getAvailableBytes);
        throw new Error("Expected insufficient-space preflight to fail");
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientDatabaseSpaceError);
        expect(error).toMatchObject({
          code: "DATABASE_RECOVERY_INSUFFICIENT_SPACE",
          requiredBytes: 512n,
          availableBytes: 511n,
        });
      }
    });
  });

  test("creates and verifies a snapshot containing committed WAL data", () => {
    withTemporaryDirectory((directory) => {
      const sourcePath = join(directory, "source.sqlite");
      const snapshotPath = join(directory, "snapshots", "source.sqlite");
      const source = new Database(sourcePath, { create: true, strict: true });

      try {
        source.exec("PRAGMA journal_mode = WAL; PRAGMA wal_autocheckpoint = 0");
        source.exec("CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
        source.query("INSERT INTO records (value) VALUES (?)").run("from-wal");

        const created = createVerifiedSnapshot(source, snapshotPath);
        expect(created.snapshotPath).toBe(snapshotPath);
        expect(created.check).toEqual({ mode: "integrity", ok: true, messages: ["ok"] });
        expect(created.sizeBytes).toBeGreaterThan(0n);

        const verification = verifySnapshot(snapshotPath);
        expect(verification.ok).toBeTrue();
        expect(verification.check.messages).toEqual(["ok"]);

        const snapshot = new Database(snapshotPath, { readonly: true, strict: true });
        try {
          expect(snapshot.query<{ value: string }, []>("SELECT value FROM records").get()).toEqual({
            value: "from-wal",
          });
        } finally {
          snapshot.close(true);
        }
      } finally {
        source.close(true);
      }
    });
  });

  test("overwrites only after verifying the replacement snapshot", () => {
    withTemporaryDirectory((directory) => {
      const sourcePath = join(directory, "source.sqlite");
      const snapshotPath = join(directory, "snapshot.sqlite");
      const source = new Database(sourcePath, { create: true, strict: true });
      try {
        source.exec("CREATE TABLE records (value TEXT NOT NULL)");
        source.query("INSERT INTO records (value) VALUES (?)").run("first");
        createVerifiedSnapshot(source, snapshotPath);
        source.query("INSERT INTO records (value) VALUES (?)").run("second");
        const replaced = createVerifiedSnapshot(source, snapshotPath, { overwrite: true });
        expect(replaced.snapshotPath).toBe(snapshotPath);
        const snapshot = new Database(snapshotPath, { readonly: true, strict: true });
        try {
          expect(snapshot.query<{ count: number }, []>("SELECT count(*) AS count FROM records").get()).toEqual({ count: 2 });
        } finally {
          snapshot.close(true);
        }
      } finally {
        source.close(true);
      }
    });
  });

  test("redacts paths and gives a recovery action", () => {
    const diagnostic = databaseRecoveryDiagnostics({
      operation: "snapshot-create",
      databasePath: "/private/secret/database.sqlite",
      snapshotPath: "/private/secret/snapshot.sqlite",
      error: new Error("contains secret path"),
    });
    expect(diagnostic).toMatchObject({
      databasePath: "[redacted]",
      snapshotPath: "[redacted]",
      recommendation: "Keep the source database unchanged and retry snapshot creation.",
      error: { code: "UNKNOWN" },
    });
    expect(JSON.stringify(diagnostic)).not.toContain("secret");
  });
});
