import { describe, expect, test } from "bun:test";
import {
  demoNetworkConfig,
  isExpectedRequestAuthority,
  isLanStudentApiRequest,
  isLoopbackAddress,
  isPrivateIpv4Address,
  parseLanOrigin,
  studentOriginFor,
} from "./network.ts";

describe("DigitalDP network policy", () => {
  test("keeps loopback as the default and enables LAN only with an exact private origin", () => {
    expect(demoNetworkConfig({ port: 9148 })).toEqual({ bindHostname: "127.0.0.1", lanOrigin: null });
    expect(demoNetworkConfig({ port: 9148, lanOrigin: "http://10.80.20.178:9148" })).toEqual({
      bindHostname: "0.0.0.0",
      lanOrigin: "http://10.80.20.178:9148",
    });
    expect(() => demoNetworkConfig({ port: 9148, bindHostname: "0.0.0.0" })).toThrow("requires DIGITALDP_LAN_ORIGIN");
    expect(() => demoNetworkConfig({ port: 9148, bindHostname: "192.168.1.30", lanOrigin: "http://192.168.1.20:9148" }))
      .toThrow("must be 0.0.0.0 or match");
  });

  test("permits the packaged app to bind before classroom sharing is enabled without authorizing LAN traffic", () => {
    expect(demoNetworkConfig({ port: 9148, allowInactiveLanBinding: true })).toEqual({
      bindHostname: "0.0.0.0",
      lanOrigin: null,
    });
    expect(() => demoNetworkConfig({ port: 9148, bindHostname: "10.0.0.5", allowInactiveLanBinding: true }))
      .toThrow("Managed network mode requires HOST");
    expect(isExpectedRequestAuthority(new URL("http://10.0.0.5:9148/student"), 9148, "10.0.0.6", null)).toBeFalse();
  });

  test("recognizes only RFC 1918 IPv4 addresses as classroom sharing candidates", () => {
    expect(isPrivateIpv4Address("10.0.0.5")).toBeTrue();
    expect(isPrivateIpv4Address("172.16.0.5")).toBeTrue();
    expect(isPrivateIpv4Address("172.31.255.255")).toBeTrue();
    expect(isPrivateIpv4Address("192.168.1.5")).toBeTrue();
    expect(isPrivateIpv4Address("172.32.0.5")).toBeFalse();
    expect(isPrivateIpv4Address("127.0.0.1")).toBeFalse();
    expect(isPrivateIpv4Address("100.64.0.1")).toBeFalse();
  });

  test("rejects public, malformed, HTTPS and wrong-port advertised origins", () => {
    expect(parseLanOrigin("http://192.168.1.20:9148", 9148)).toBe("http://192.168.1.20:9148");
    for (const origin of [
      "http://8.8.8.8:9148",
      "https://192.168.1.20:9148",
      "http://192.168.1.20:9000",
      "http://192.168.1.20:9148/student",
      "http://teacher:secret@192.168.1.20:9148",
    ]) {
      expect(() => parseLanOrigin(origin, 9148)).toThrow("private IPv4 HTTP origin");
    }
  });

  test("accepts only loopback authority locally and the configured authority remotely", () => {
    const lanOrigin = "http://10.80.20.178:9148";
    expect(isExpectedRequestAuthority(new URL("http://localhost:9148/student"), 9148, "127.0.0.1", lanOrigin)).toBeTrue();
    expect(isExpectedRequestAuthority(new URL("http://127.0.0.1:9148/admin"), 9148, "::ffff:127.0.0.1", lanOrigin)).toBeTrue();
    expect(isExpectedRequestAuthority(new URL(`${lanOrigin}/student`), 9148, "10.80.20.81", lanOrigin)).toBeTrue();
    expect(isExpectedRequestAuthority(new URL("http://localhost:9148/student"), 9148, "10.80.20.81", lanOrigin)).toBeFalse();
    expect(isExpectedRequestAuthority(new URL("http://10.80.20.179:9148/student"), 9148, "10.80.20.81", lanOrigin)).toBeFalse();
    expect(isExpectedRequestAuthority(new URL("http://evil.example:9148/student"), 9148, "10.80.20.81", lanOrigin)).toBeFalse();
  });

  test("recognizes loopback clients without trusting LAN or virtual-adapter addresses", () => {
    expect(isLoopbackAddress("127.0.0.1")).toBeTrue();
    expect(isLoopbackAddress("127.9.8.7")).toBeTrue();
    expect(isLoopbackAddress("::1")).toBeTrue();
    expect(isLoopbackAddress("::ffff:127.0.0.1")).toBeTrue();
    expect(isLoopbackAddress("10.80.20.178")).toBeFalse();
    expect(isLoopbackAddress("100.91.50.2")).toBeFalse();
  });

  test("allows only the student API surface over LAN", () => {
    expect(isLanStudentApiRequest("/api/bootstrap", "GET")).toBeTrue();
    expect(isLanStudentApiRequest("/api/login/student", "POST")).toBeTrue();
    expect(isLanStudentApiRequest("/api/student/response", "PUT")).toBeTrue();
    expect(isLanStudentApiRequest("/api/assets/abc-123/audio_1", "GET")).toBeTrue();
    expect(isLanStudentApiRequest("/api/login/admin", "POST")).toBeFalse();
    expect(isLanStudentApiRequest("/api/admin/state", "GET")).toBeFalse();
    expect(isLanStudentApiRequest("/api/setup", "POST")).toBeFalse();
    expect(isLanStudentApiRequest("/api/assets/abc-123/audio_1", "POST")).toBeFalse();
  });

  test("advertises the configured student origin to a loopback teacher", () => {
    expect(studentOriginFor(new URL("http://localhost:9148/admin"), "http://10.80.20.178:9148"))
      .toBe("http://10.80.20.178:9148");
    expect(studentOriginFor(new URL("http://127.0.0.1:9148/admin"), null)).toBe("http://127.0.0.1:9148");
  });
});
