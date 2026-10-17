import { describe, expect, test } from "bun:test";
import {
  copyStudentConnection,
  mountStudentConnection,
  studentConnectionUrl,
} from "./student-connection.js";

describe("student connection details", () => {
  test("builds the student address from the active HTTP origin", () => {
    expect(studentConnectionUrl("http://127.0.0.1:9148")).toBe("http://127.0.0.1:9148");
    expect(studentConnectionUrl("https://exam.school.test:9443/admin")).toBe("https://exam.school.test:9443");
    expect(() => studentConnectionUrl("file:///tmp/index.html")).toThrow(TypeError);
  });

  test("uses the Clipboard API when it is available", async () => {
    const writes = [];
    const copied = await copyStudentConnection("http://school.test/student", {
      clipboard: { writeText: async (value) => writes.push(value) },
      documentRef: null,
    });
    expect(copied).toBe(true);
    expect(writes).toEqual(["http://school.test/student"]);
  });

  test("falls back to a temporary selection when clipboard permission is unavailable", async () => {
    let selected = false;
    let removed = false;
    let focusRestored = false;
    const previouslyFocused = { focus() { focusRestored = true; } };
    const textarea = {
      style: {},
      setAttribute() {},
      focus() {},
      select() { selected = true; },
      setSelectionRange() {},
      remove() { removed = true; },
    };
    const documentRef = {
      activeElement: previouslyFocused,
      body: { append() {} },
      createElement: () => textarea,
      execCommand: (command) => command === "copy",
    };
    const copied = await copyStudentConnection("http://school.test/student", {
      clipboard: { writeText: async () => { throw new Error("blocked"); } },
      documentRef,
    });
    expect(copied).toBe(true);
    expect(textarea.value).toBe("http://school.test/student");
    expect(selected).toBe(true);
    expect(removed).toBe(true);
    expect(focusRestored).toBe(true);
  });

  test("mounts one link and announces copy results", async () => {
    const listeners = {};
    const link = {};
    const button = {
      disabled: false,
      addEventListener(type, listener) { listeners[type] = listener; },
    };
    const status = { dataset: {}, hidden: true, textContent: "" };
    const elements = new Map([
      ["[data-student-connection-link]", link],
      ["[data-copy-student-connection]", button],
      ["[data-copy-student-connection-status]", status],
    ]);
    const url = mountStudentConnection({ querySelector: (selector) => elements.get(selector) }, {
      origin: "http://192.168.1.10:9148",
      clipboard: { writeText: async () => {} },
      documentRef: null,
    });
    expect(url).toBe("http://192.168.1.10:9148");
    expect(link).toMatchObject({ href: url, textContent: url });
    await listeners.click();
    expect(status).toMatchObject({
      hidden: false,
      textContent: "Student sign-in URL copied.",
      dataset: { tone: "success" },
    });
    expect(button.disabled).toBe(false);
  });

  test("offers the QR only for shared LAN addresses and refreshes it when the address changes", () => {
    const summary = { textContent: "Show QR code" };
    const imageHost = {
      children: [],
      replaceChildren(...nodes) { this.children = nodes; },
      append(node) { this.children.push(node); },
    };
    const downloadButton = { addEventListener() {} };
    const qrElements = new Map([
      ["summary", summary],
      ["[data-student-qr-image]", imageHost],
      ["[data-download-student-qr]", downloadButton],
    ]);
    const details = {
      hidden: true,
      open: false,
      listeners: {},
      addEventListener(type, listener) { this.listeners[type] = listener; },
      querySelector: (selector) => qrElements.get(selector),
    };
    const documentRef = {
      createElement: () => ({
        width: 0,
        height: 0,
        rectangles: [],
        getContext() {
          return { fillStyle: "", fillRect: (...args) => this.rectangles.push(args) };
        },
      }),
    };
    const elements = new Map([
      ["[data-student-connection-link]", {}],
      ["[data-copy-student-connection]", { addEventListener() {} }],
      ["[data-copy-student-connection-status]", { dataset: {}, hidden: true, textContent: "" }],
      ["[data-student-qr]", details],
    ]);
    const root = { querySelector: (selector) => elements.get(selector) };

    // LAN address: the panel is offered, but rendering stays lazy until opened.
    const url = mountStudentConnection(root, { origin: "http://192.168.1.10:9148", documentRef });
    expect(url).toBe("http://192.168.1.10:9148");
    expect(details.hidden).toBe(false);
    expect(imageHost.children).toHaveLength(0);

    details.open = true;
    details.listeners.toggle();
    expect(summary.textContent).toBe("Hide QR code");
    expect(imageHost.children).toHaveLength(1);
    const firstCanvas = imageHost.children[0];

    // A same-address re-mount (network refresh) keeps the open panel and render.
    mountStudentConnection(root, { origin: "http://192.168.1.10:9148", documentRef });
    expect(details.open).toBe(true);
    expect(imageHost.children).toEqual([firstCanvas]);

    // A new address drops the stale image and re-renders from the new payload.
    mountStudentConnection(root, { origin: "http://192.168.1.11:9148", documentRef });
    expect(details.open).toBe(true);
    expect(imageHost.children).toHaveLength(1);
    expect(imageHost.children[0]).not.toBe(firstCanvas);
    expect(imageHost.children[0].rectangles).not.toEqual(firstCanvas.rectangles);

    mountStudentConnection(root, { origin: "http://192.168.1.11:9148", available: false, documentRef });
    expect(details.hidden).toBe(true);
    expect(details.open).toBe(false);
    expect(imageHost.children).toHaveLength(0);

    mountStudentConnection(root, { origin: "http://192.168.1.11:9148", documentRef });
    expect(details.hidden).toBe(false);
    expect(details.open).toBe(false);

    // Loopback must never be offered as a student QR.
    mountStudentConnection(root, { origin: "http://127.0.0.1:9148", documentRef });
    expect(details.hidden).toBe(true);
    expect(details.open).toBe(false);
    expect(imageHost.children).toHaveLength(0);
    expect(summary.textContent).toBe("Show QR code");
  });
});
