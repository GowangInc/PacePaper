import { describe, expect, test } from "bun:test";
import { mountAdminNetwork } from "./admin-network.js";

function fakeDocument() {
  const nodes = [];

  function node(tag) {
    const listeners = {};
    const childNodes = [];
    const value = {
      tagName: tag.toUpperCase(),
      childNodes,
      children: childNodes,
      dataset: {},
      hidden: false,
      disabled: false,
      textContent: "",
      className: "",
      append(...children) {
        childNodes.push(...children);
        return children.at(-1);
      },
      replaceChildren(...children) {
        childNodes.splice(0, childNodes.length, ...children);
      },
      setAttribute(name, value) {
        this.attributes ??= {};
        this.attributes[name] = String(value);
      },
      addEventListener(type, listener) {
        listeners[type] = listener;
      },
      async dispatch(type) {
        const event = { preventDefault() {} };
        return listeners[type]?.(event);
      },
    };
    nodes.push(value);
    return value;
  }

  return {
    createElement: node,
    createTextNode(value) {
      return { nodeType: 3, textContent: value };
    },
    nodes,
  };
}

function textFrom(node) {
  if (!node) return "";
  return [node.textContent, ...(node.childNodes ?? []).map(textFrom)].join("");
}

function find(documentRef, predicate) {
  return documentRef.nodes.find(predicate);
}

const baseState = {
  managed: true,
  addresses: [
    { name: "School Wi-Fi", address: "192.168.1.20" },
    { name: "Staff Ethernet", address: "10.2.3.4" },
  ],
  address: "192.168.1.20",
  studentUrl: "http://192.168.1.20:9148/student",
  liveExam: false,
};

describe("teacher classroom-sharing control", () => {
  test("does not render when this installation does not manage classroom sharing", async () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const component = mountAdminNetwork(root, {
      documentRef,
      request: async () => ({ managed: false }),
    });

    await component.ready;
    expect(root.childNodes).toEqual([]);
  });

  test("gets the minimal network state and renders detected addresses, status, and student URL", async () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const calls = [];
    const component = mountAdminNetwork(root, {
      documentRef,
      request: async (path, options) => {
        calls.push({ path, options });
        return baseState;
      },
    });

    await component.ready;
    expect(calls).toEqual([{ path: "/api/admin/network", options: { method: "GET" } }]);
    expect(textFrom(root)).toContain("Classroom sharing is on at 192.168.1.20.");
    expect(textFrom(root)).toContain("School Wi-Fi · 192.168.1.20");
    expect(textFrom(root)).toContain("Staff Ethernet · 10.2.3.4");
    const link = find(documentRef, (node) => node.tagName === "A");
    expect(link).toMatchObject({ href: "http://192.168.1.20:9148/student", textContent: "http://192.168.1.20:9148/student" });
  });

  test("posts exactly the chosen address and re-renders the returned state", async () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const calls = [];
    const component = mountAdminNetwork(root, {
      documentRef,
      request: async (path, options) => {
        calls.push({ path, options });
        if (options.method === "GET") return baseState;
        return { ...baseState, address: "10.2.3.4", studentUrl: "http://10.2.3.4:9148/student" };
      },
    });

    await component.ready;
    const radio = find(documentRef, (node) => node.tagName === "INPUT" && node.value === "10.2.3.4");
    await radio.dispatch("change");
    const form = find(documentRef, (node) => node.tagName === "FORM");
    await form.dispatch("submit");

    expect(calls.at(-1)).toEqual({
      path: "/api/admin/network",
      options: { method: "POST", body: { address: "10.2.3.4" } },
    });
    expect(textFrom(root)).toContain("Classroom sharing is on at 10.2.3.4.");
    expect(textFrom(root)).toContain("Classroom sharing updated.");
  });

  test("uses an optional selected address for the choice without misreporting disabled sharing", async () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const component = mountAdminNetwork(root, {
      documentRef,
      request: async () => ({ ...baseState, address: null, selectedAddress: "10.2.3.4" }),
    });

    await component.ready;
    const selected = find(documentRef, (node) => node.tagName === "INPUT" && node.value === "10.2.3.4");
    expect(selected.checked).toBe(true);
    expect(textFrom(root)).toContain("This computer only. Students on other devices cannot connect.");
  });

  test("posts null when the teacher returns sharing to this computer only", async () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const calls = [];
    const component = mountAdminNetwork(root, {
      documentRef,
      request: async (path, options) => {
        calls.push({ path, options });
        return options.method === "GET" ? baseState : { ...baseState, address: null };
      },
    });

    await component.ready;
    const local = find(documentRef, (node) => node.tagName === "INPUT" && node.value === "");
    await local.dispatch("change");
    const form = find(documentRef, (node) => node.tagName === "FORM");
    await form.dispatch("submit");

    expect(calls.at(-1)).toEqual({
      path: "/api/admin/network",
      options: { method: "POST", body: { address: null } },
    });
    expect(textFrom(root)).toContain("This computer only. Students on other devices cannot connect.");
  });

  test("visibly locks sharing and rejects a programmatic submit while an exam is live", async () => {
    const documentRef = fakeDocument();
    const root = documentRef.createElement("div");
    const calls = [];
    const component = mountAdminNetwork(root, {
      documentRef,
      request: async (path, options) => {
        calls.push({ path, options });
        return { ...baseState, liveExam: true };
      },
    });

    await component.ready;
    const fieldset = find(documentRef, (node) => node.tagName === "FIELDSET");
    const save = find(documentRef, (node) => node.tagName === "BUTTON" && node.type === "submit");
    expect(fieldset.disabled).toBe(true);
    expect(save.disabled).toBe(true);
    expect(textFrom(root)).toContain("End it before changing classroom sharing.");
    const form = find(documentRef, (node) => node.tagName === "FORM");
    await form.dispatch("submit");
    expect(calls).toHaveLength(1);
    expect(textFrom(root)).toContain("cannot change while an examination is live");
  });
});
