import { describe, expect, test } from "bun:test";
import { installContextMenuGuard } from "./context-menu-lock.js";

describe("application context-menu guard", () => {
  test("prevents context menus without consuming other input events", () => {
    const target = new EventTarget();
    const removeGuard = installContextMenuGuard(target);

    const contextMenu = new Event("contextmenu", { cancelable: true });
    const pointerDown = new Event("pointerdown", { cancelable: true });
    const click = new Event("click", { cancelable: true });
    const keyDown = new Event("keydown", { cancelable: true });
    const selectStart = new Event("selectstart", { cancelable: true });

    target.dispatchEvent(contextMenu);
    target.dispatchEvent(pointerDown);
    target.dispatchEvent(click);
    target.dispatchEvent(keyDown);
    target.dispatchEvent(selectStart);

    expect(contextMenu.defaultPrevented).toBe(true);
    expect(pointerDown.defaultPrevented).toBe(false);
    expect(click.defaultPrevented).toBe(false);
    expect(keyDown.defaultPrevented).toBe(false);
    expect(selectStart.defaultPrevented).toBe(false);

    removeGuard();
    const restored = new Event("contextmenu", { cancelable: true });
    target.dispatchEvent(restored);
    expect(restored.defaultPrevented).toBe(false);
  });
});
