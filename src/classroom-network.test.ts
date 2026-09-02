import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ClassroomNetworkState,
  classroomLanOrigin,
  classroomNetworkSettingsPath,
  listLocalPrivateIpv4Interfaces,
  loadSelectedClassroomAddress,
  persistSelectedClassroomAddress,
} from "./classroom-network.ts";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "digitaldp-classroom-network-test-"));
afterAll(() => rmSync(temporaryDirectory, { recursive: true, force: true }));

const localAddresses = [
  { interfaceName: "en0", address: "10.20.30.40" },
  { interfaceName: "en1", address: "192.168.50.20" },
] as const;

describe("managed classroom network sharing", () => {
  test("lists only non-loopback private IPv4 interfaces in a stable order", () => {
    expect(listLocalPrivateIpv4Interfaces({
      lo0: [{ address: "127.0.0.1", family: "IPv4", internal: true }],
      en1: [
        { address: "8.8.8.8", family: "IPv4", internal: false },
        { address: "192.168.50.20", family: 4, internal: false },
      ],
      en0: [
        { address: "10.20.30.40", family: "IPv4", internal: false },
        { address: "fe80::1", family: "IPv6", internal: false },
        { address: "169.254.30.40", family: "IPv4", internal: false },
      ],
    })).toEqual([...localAddresses]);
  });

  test("persists only a current local address beside the configured database", () => {
    const databasePath = join(temporaryDirectory, "exam-data.sqlite");
    expect(persistSelectedClassroomAddress(databasePath, "192.168.50.20", localAddresses)).toBe("192.168.50.20");
    const settingsPath = classroomNetworkSettingsPath(databasePath);
    expect(settingsPath).toBe(`${databasePath}.classroom-network.json`);
    expect(JSON.parse(readFileSync(settingsPath, "utf8"))).toEqual({ version: 1, address: "192.168.50.20" });
    expect(loadSelectedClassroomAddress(databasePath, localAddresses)).toBe("192.168.50.20");
    expect(() => persistSelectedClassroomAddress(databasePath, "10.20.30.40", [localAddresses[1]])).toThrow(
      "not currently assigned",
    );
  });

  test("does not load corrupt, expanded, or stale settings", () => {
    const databasePath = join(temporaryDirectory, "stale.sqlite");
    const settingsPath = classroomNetworkSettingsPath(databasePath);

    writeFileSync(settingsPath, '{"version":1,"address":"192.168.50.20","enabled":true}');
    expect(loadSelectedClassroomAddress(databasePath, localAddresses)).toBeNull();
    writeFileSync(settingsPath, '{"version":1,"address":"192.168.50.20"');
    expect(loadSelectedClassroomAddress(databasePath, localAddresses)).toBeNull();
    writeFileSync(settingsPath, '{"version":1,"address":"192.168.50.20"}');
    expect(loadSelectedClassroomAddress(databasePath, [localAddresses[0]])).toBeNull();
  });

  test("keeps release-managed LAN origin state in memory and lets a teacher turn it off", () => {
    const state = new ClassroomNetworkState({ managed: true, port: 9148, selectedAddress: "10.20.30.40" });
    expect(state.snapshot()).toEqual({ managed: true, selectedAddress: "10.20.30.40", lanOrigin: null });
    expect(state.enable("192.168.50.20", localAddresses)).toEqual({
      managed: true,
      selectedAddress: "192.168.50.20",
      lanOrigin: "http://192.168.50.20:9148",
    });
    expect(state.disable()).toEqual({ managed: true, selectedAddress: "192.168.50.20", lanOrigin: null });
  });

  test("keeps source/development mode explicitly separate from managed sharing", () => {
    const state = new ClassroomNetworkState({ managed: false, port: 9148 });
    expect(() => state.enable("10.20.30.40", localAddresses)).toThrow("only in a managed release");
    expect(state.snapshot()).toEqual({ managed: false, selectedAddress: null, lanOrigin: null });
    expect(classroomLanOrigin("10.20.30.40", 80)).toBe("http://10.20.30.40");
    expect(() => classroomLanOrigin("10.20.30.40", 0)).toThrow("port from 1 to 65535");
  });
});
