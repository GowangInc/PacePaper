import { describe, expect, test } from "bun:test";
import {
  copyStudentConnection,
  mountStudentConnection,
  studentConnectionUrl,
} from "./student-connection.js";

describe("student connection details", () => {
  test("keeps the clock address in its projected display, outside the hideable controls", async () => {
    const source = await Bun.file(new URL("./countdown.js", import.meta.url)).text();
    const controlsEnd = source.indexOf("</aside>");
    const displayStart = source.indexOf('<section id="clock-display"');
    const connectionLink = source.lastIndexOf("data-student-connection-link");
    expect(controlsEnd).toBeGreaterThan(-1);
    expect(connectionLink).toBeGreaterThan(displayStart);
    expect(displayStart).toBeGreaterThan(controlsEnd);
    expect(source).toContain("mountStudentConnection(document, { origin: bootstrap.studentOrigin ?? location.origin })");
  });

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
});
