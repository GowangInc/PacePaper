import { describe, expect, test } from "bun:test";
import {
  DEFAULT_RELEASE_PORT,
  LAST_RELEASE_PORT,
  browserOpenCommand,
  chooseStandalonePort,
  configureReleaseDatabase,
  releaseDataDirectory,
  teacherDashboardUrl,
} from "./release-runtime.ts";

describe("desktop release runtime", () => {
  test("uses a conventional writable per-user data directory and permits an override", () => {
    expect(releaseDataDirectory({}, "darwin", "/Users/demo")).toBe("/Users/demo/Library/Application Support/DigitalDP");
    expect(releaseDataDirectory({}, "win32", "C:/Users/demo")).toBe("C:/Users/demo/AppData/Local/DigitalDP");
    expect(releaseDataDirectory({ LOCALAPPDATA: "D:/Profile/AppData/Local" }, "win32", "C:/Users/demo")).toBe("D:/Profile/AppData/Local/DigitalDP");
    expect(releaseDataDirectory({}, "linux", "/home/demo")).toBe("/home/demo/.local/share/DigitalDP");
    expect(releaseDataDirectory({ DIGITALDP_DATA_DIR: "/srv/digitaldp" }, "linux", "/home/demo")).toBe("/srv/digitaldp");
  });

  test("does not replace an explicitly chosen database", () => {
    const custom = { DIGITALDP_DB: "/srv/digitaldp/custom.sqlite" };
    expect(configureReleaseDatabase(custom)).toBe("/srv/digitaldp/custom.sqlite");
    expect(custom.DIGITALDP_DB).toBe("/srv/digitaldp/custom.sqlite");
  });

  test("sets a database below the configured data directory", () => {
    const environment = { DIGITALDP_DATA_DIR: "/srv/digitaldp" };
    expect(configureReleaseDatabase(environment)).toBe("/srv/digitaldp/digitaldp.sqlite");
  });

  test("keeps an explicit PORT without probing for another one", async () => {
    const environment = { PORT: "9200" };
    const probe = async () => {
      throw new Error("an explicit port must not be probed");
    };

    await expect(chooseStandalonePort(environment, probe)).resolves.toBe(9200);
    expect(environment.PORT).toBe("9200");
  });

  test("uses the default release port when it is free", async () => {
    const environment: Record<string, string | undefined> = {};
    const port = await chooseStandalonePort(environment, async () => true);

    expect(port).toBe(DEFAULT_RELEASE_PORT);
    expect(environment.PORT).toBe(String(DEFAULT_RELEASE_PORT));
  });

  test("chooses and records the first free loopback port for the server and browser", async () => {
    const environment: Record<string, string | undefined> = {};
    const probed: number[] = [];
    const port = await chooseStandalonePort(environment, async (candidate) => {
      probed.push(candidate);
      return candidate === DEFAULT_RELEASE_PORT + 2;
    });

    expect(probed).toEqual([DEFAULT_RELEASE_PORT, DEFAULT_RELEASE_PORT + 1, DEFAULT_RELEASE_PORT + 2]);
    expect(port).toBe(DEFAULT_RELEASE_PORT + 2);
    expect(environment.PORT).toBe(String(port));
    expect(teacherDashboardUrl(port)).toBe(`http://127.0.0.1:${port}/admin`);
  });

  test("fails clearly when the deterministic release range is exhausted", async () => {
    const environment: Record<string, string | undefined> = {};

    await expect(chooseStandalonePort(environment, async () => false))
      .rejects.toThrow(`No free loopback port is available from ${DEFAULT_RELEASE_PORT} to ${LAST_RELEASE_PORT}`);
    expect(environment.PORT).toBeUndefined();
  });

  test("opens the local teacher dashboard with platform-native commands", () => {
    expect(teacherDashboardUrl(9148)).toBe("http://127.0.0.1:9148/admin");
    expect(browserOpenCommand("http://127.0.0.1:9148/admin", "darwin")).toEqual(["open", "http://127.0.0.1:9148/admin"]);
    expect(browserOpenCommand("http://127.0.0.1:9148/admin", "win32")).toEqual(["cmd", "/c", "start", "", "http://127.0.0.1:9148/admin"]);
    expect(browserOpenCommand("http://127.0.0.1:9148/admin", "linux")).toEqual(["xdg-open", "http://127.0.0.1:9148/admin"]);
  });
});
