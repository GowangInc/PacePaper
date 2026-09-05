import { describe, expect, test } from "bun:test";
import { createResponseSaveState } from "./response-save-state.js";

describe("truthful response persistence", () => {
  test("network plus quota failure never claims a device save", () => {
    const state = createResponseSaveState();
    state.edit(); state.backedUp(false); state.fail("Could not reach server");
    expect(state.unsafe).toBeTrue();
    expect(state.status().message).toStartWith("Not saved");
    expect(state.status().message).not.toContain("saved on this device");
  });
  test("an older successful backup does not protect a newer edit", () => {
    const state = createResponseSaveState();
    state.edit(); state.backedUp(true); state.edit(); state.backedUp(false);
    expect(state.unsafe).toBeTrue();
  });
  test("late server acknowledgement preserves the newer edit and warning", () => {
    const state = createResponseSaveState();
    const sent = state.edit(); state.edit(); state.backedUp(false); state.acknowledge(sent);
    expect(state.pending).toBeTrue(); expect(state.unsafe).toBeTrue();
    expect(state.status().tone).toBe("error");
    state.acknowledge(state.revision);
    expect(state.pending).toBeFalse(); expect(state.unsafe).toBeFalse();
    expect(state.status().message).toBe("Saved to server");
  });
  test("device-only recovery and server recovery have different statuses", () => {
    const state = createResponseSaveState();
    state.edit(); state.backedUp(true); state.fail("Server save failed");
    expect(state.pending).toBeTrue(); expect(state.unsafe).toBeFalse();
    expect(state.status().message).toContain("device only");
    state.acknowledge(state.revision);
    expect(state.status().tone).toBe("saved");
  });
});
