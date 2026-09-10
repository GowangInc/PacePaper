import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { listLocalPrivateIpv4Interfaces } from "./src/classroom-network.ts";

// Classroom devices are the expected case, so a packaged launch must serve the
// LAN student address before any teacher action. This is the wiring the app
// previously got wrong: the state held a saved address but the request guard
// only accepted loopback until a dashboard click.
const lanAddress = listLocalPrivateIpv4Interfaces()[0]?.address ?? null;
// ponytail: fixed high port; a collision fails the test loudly rather than silently.
const port = 19914;
const origin = `http://127.0.0.1:${port}`;

/** Waits for the launch to report its student sign-in address, then returns it. */
async function startServer(dataDirectory: string): Promise<{ server: Bun.Subprocess; signInUrl: string }> {
  const server = Bun.spawn(["bun", "release-app.ts"], {
    cwd: import.meta.dir,
    env: {
      ...process.env,
      PORT: String(port),
      DIGITALDP_DB: join(dataDirectory, "digitaldp.sqlite"),
      DIGITALDP_DATA_DIR: dataDirectory,
      DIGITALDP_OPEN_BROWSER: "0",
    },
    stdout: "pipe",
    stderr: "ignore",
  });
  try {
    const decoder = new TextDecoder();
    let output = "";
    for await (const chunk of server.stdout as ReadableStream<Uint8Array>) {
      output += decoder.decode(chunk, { stream: true });
      const line = output.split("\n").find((entry) => entry.startsWith("Student sign-in: "));
      if (line) return { server, signInUrl: line.slice("Student sign-in: ".length).trim() };
    }
    throw new Error(`PacePaper exited before reporting a student sign-in address:\n${output}`);
  } catch (error) {
    // Never leave a live child behind when startup fails or the test times out.
    server.kill();
    await server.exited;
    throw error;
  }
}

async function stopServer(server: Bun.Subprocess): Promise<void> {
  server.kill();
  await server.exited;
}

describe.skipIf(lanAddress === null)("packaged launch classroom sharing", () => {
  test("serves the LAN student address from launch, and again after a restart", async () => {
    const dataDirectory = mkdtempSync(join(tmpdir(), "pacepaper-lan-startup-test-"));
    const lanStudentUrl = `http://${lanAddress}:${port}/student`;
    try {
      const first = await startServer(dataDirectory);
      try {
        expect(first.signInUrl).toBe(lanStudentUrl);
        expect((await fetch(lanStudentUrl)).status).toBe(200);

        const login = await fetch(`${origin}/api/login/admin`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "admin" }),
        });
        expect(login.status).toBe(200);
        const cookie = login.headers.getSetCookie?.()[0]?.split(";")[0] ?? "";
        const network = await (await fetch(`${origin}/api/admin/network`, { headers: { cookie } })).json();
        // The address the dashboard shows is the address the server accepts.
        expect(network.address).toBe(lanAddress);
        expect(network.studentUrl).toBe(lanStudentUrl);
      } finally {
        await stopServer(first.server);
      }

      const restarted = await startServer(dataDirectory);
      try {
        expect(restarted.signInUrl).toBe(lanStudentUrl);
        expect((await fetch(lanStudentUrl)).status).toBe(200);
      } finally {
        await stopServer(restarted.server);
      }
    } finally {
      rmSync(dataDirectory, { recursive: true, force: true });
    }
  }, 60_000);
});

// A teacher rehearsing a paper opens the candidate interface from the dashboard.
// The preview must tell that teacher nothing is recorded, and the server must not
// create any sitting for it.
describe("candidate preview", () => {
  test("gives a signed-in teacher the candidate state without recording anything", async () => {
    const dataDirectory = mkdtempSync(join(tmpdir(), "pacepaper-preview-test-"));
    const unknownPaper = "00000000-0000-0000-0000-000000000000";
    const { server } = await startServer(dataDirectory);
    try {
      expect((await fetch(`${origin}/api/admin/papers/${unknownPaper}/preview`)).status).toBe(401);

      const login = await fetch(`${origin}/api/login/admin`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin" }),
      });
      expect(login.status).toBe(200);
      const cookie = login.headers.getSetCookie?.()[0]?.split(";")[0] ?? "";
      const headers = { cookie };

      expect((await fetch(`${origin}/api/admin/papers/${unknownPaper}/preview`, { headers })).status).toBe(404);

      const state = await (await fetch(`${origin}/api/admin/state`, { headers })).json();
      const paper = state.papers[0];
      expect(paper).toBeDefined();

      const preview = await (await fetch(`${origin}/api/admin/papers/${paper.id}/preview`, { headers })).json();
      expect(preview.preview).toBe(true);
      expect(preview.status).toBe("live");
      expect(preview.paper.title).toBe(paper.title);
      expect(preview.paper.questions.length).toBeGreaterThan(0);
      expect(preview.session.timeline.length).toBeGreaterThan(0);
      expect(preview.response.id).toBeNull();
      expect(preview.response.answers).toEqual({});
      expect(preview.response.submittedAt).toBeNull();
    } finally {
      await stopServer(server);
    }

    const database = new Database(join(dataDirectory, "digitaldp.sqlite"));
    try {
      expect(database.query("SELECT COUNT(*) AS count FROM exam_sessions").get()).toEqual({ count: 0 });
      expect(database.query("SELECT COUNT(*) AS count FROM responses").get()).toEqual({ count: 0 });
    } finally {
      database.close();
      rmSync(dataDirectory, { recursive: true, force: true });
    }
  }, 60_000);
});
