import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const exports = new Bun.Transpiler({ loader: "js" }).scan(
  await Bun.file(new URL("./app.js", import.meta.url)).text(),
).exports.sort();

// Bun's filesystem discovery order differs between platforms and does not follow
// CLI argument order. Each subprocess imports these suites in the exact order.
const orders = [
  ["student-login", "admin"],
  ["admin", "student-login"],
  ["student-login", "student-flow", "admin"],
  ["student-login", "admin", "student-flow"],
  ["student-flow", "student-login", "admin"],
  ["student-flow", "admin", "student-login"],
  ["admin", "student-login", "student-flow"],
  ["admin", "student-flow", "student-login"],
];

describe("browser app mock isolation", () => {
  for (const order of orders) {
    test(order.join(" → "), () => {
      const directory = mkdtempSync(join(tmpdir(), "digitaldp-app-mock-order-"));
      try {
        const harness = join(directory, "ordered.test.js");
        const suites = order.map((name) => new URL(`./${name}.test.js`, import.meta.url).href);
        writeFileSync(harness, `
          import assert from "node:assert/strict";
          for (const suite of ${JSON.stringify(suites)}) {
            await import(suite);
            assert.deepEqual(Object.keys(await import("/app.js")).sort(), ${JSON.stringify(exports)},
              "Every app mock must expose the complete production export contract");
          }
        `);
        const result = Bun.spawnSync([process.execPath, "test", harness], {
          cwd: import.meta.dir, stdout: "pipe", stderr: "pipe", timeout: 10_000,
        });
        const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
        expect(result.exitCode, output).toBe(0);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    }, 15_000);
  }
});
