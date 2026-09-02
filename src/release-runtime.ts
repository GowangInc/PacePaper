import { homedir } from "node:os";
import { createServer } from "node:net";
import { join } from "node:path";

export const RELEASE_PRODUCT_NAME = "DigitalDP";
export const DEFAULT_RELEASE_PORT = 9148;
export const LAST_RELEASE_PORT = 9158;

type Environment = Record<string, string | undefined>;
export type LoopbackPortProbe = (port: number) => Promise<boolean>;

function dataHome(platform: NodeJS.Platform, environment: Environment, home: string): string {
  if (platform === "darwin") return join(home, "Library", "Application Support");
  if (platform === "win32") return environment.LOCALAPPDATA ?? environment.APPDATA ?? join(home, "AppData", "Local");
  return environment.XDG_DATA_HOME ?? join(home, ".local", "share");
}

/**
 * The desktop build stores mutable work outside the binary, so an application
 * update cannot overwrite exams, responses, or uploaded attachments.
 */
export function releaseDataDirectory(
  environment: Environment = process.env,
  platform: NodeJS.Platform = process.platform,
  home = homedir(),
): string {
  return environment.DIGITALDP_DATA_DIR ?? join(dataHome(platform, environment, home), RELEASE_PRODUCT_NAME);
}

export function configureReleaseDatabase(environment: Environment = process.env): string {
  const databasePath = environment.DIGITALDP_DB ?? join(releaseDataDirectory(environment), "digitaldp.sqlite");
  environment.DIGITALDP_DB = databasePath;
  return databasePath;
}

/**
 * A standalone release should coexist with a local development server. Probe
 * every IPv4 interface because the packaged app keeps an inactive classroom
 * sharing listener ready for a teacher to enable without restarting.
 */
export function isLoopbackPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const listener = createServer();
    let resolved = false;
    const finish = (available: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(available);
    };

    listener.once("error", () => finish(false));
    try {
      listener.listen({ host: "0.0.0.0", port, exclusive: true }, () => {
        listener.close((error) => finish(!error));
      });
    } catch {
      finish(false);
    }
  });
}

/**
 * Keeps an explicit PORT authoritative. Otherwise, stores the first free
 * loopback port in a short deterministic range before the server is imported.
 */
export async function chooseStandalonePort(
  environment: Environment = process.env,
  probe: LoopbackPortProbe = isLoopbackPortAvailable,
): Promise<number> {
  if (environment.PORT !== undefined) return Number(environment.PORT);

  for (let port = DEFAULT_RELEASE_PORT; port <= LAST_RELEASE_PORT; port += 1) {
    if (!(await probe(port))) continue;
    environment.PORT = String(port);
    return port;
  }

  throw new Error(`No free loopback port is available from ${DEFAULT_RELEASE_PORT} to ${LAST_RELEASE_PORT}. Set PORT explicitly or stop the other server.`);
}

export function teacherDashboardUrl(port: number): string {
  return `http://127.0.0.1:${port}/admin`;
}

export function browserOpenCommand(url: string, platform: NodeJS.Platform = process.platform): string[] | null {
  if (platform === "darwin") return ["open", url];
  if (platform === "win32") return ["cmd", "/c", "start", "", url];
  if (platform === "linux") return ["xdg-open", url];
  return null;
}

export function openTeacherDashboard(url: string): void {
  const command = browserOpenCommand(url);
  if (!command) return;
  try {
    Bun.spawn({ cmd: command, stdout: "ignore", stderr: "ignore" });
  } catch {
    // The server remains usable if a desktop cannot launch a browser itself.
  }
}
