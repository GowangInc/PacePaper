import { describe, expect, test } from "bun:test";
import { builderDraftStore, captureBuilderDraft } from "./paper-builder-drafts.js";

describe("browser paper drafts", () => {
  test("captures independent question state and all attachment groups", async () => {
    const file = new File(["original attachment"], "diagram.pdf", { type: "application/pdf" });
    const questions = [{ key: 1, prompt: "Original question", mediaFiles: [file] }];
    const form = { querySelector: (id) => ({ value: id, files: [file] }) };
    const snapshot = captureBuilderDraft(form, questions);
    questions[0].prompt = "Changed later";
    expect(snapshot.questions[0].prompt).toBe("Original question");
    expect(await snapshot.questions[0].mediaFiles[0].text()).toBe("original attachment");
    expect(snapshot.files["builder-pdf"][0].name).toBe("diagram.pdf");
    expect(snapshot.files["builder-audio"]).toHaveLength(1);
    expect(snapshot.values["builder-instructions"]).toBe("#builder-instructions");
  });

  test("waits for the database transaction and rejects an aborted write", async () => {
    const previous = globalThis.indexedDB;
    let transaction;
    let closed = false;
    globalThis.indexedDB = { open() {
      const request = { result: {
        transaction() { transaction = { objectStore: () => ({ put: () => ({ result: "draft-id" }) }) }; return transaction; },
        close() { closed = true; },
      } };
      queueMicrotask(() => request.onsuccess());
      return request;
    } };
    try {
      let resolved = false;
      const saving = builderDraftStore("put", { id: "draft-id" }).then(() => { resolved = true; });
      await Promise.resolve(); await Promise.resolve();
      expect(resolved).toBeFalse();
      transaction.error = new Error("Storage quota exceeded");
      transaction.onabort();
      await expect(saving).rejects.toThrow("Storage quota exceeded");
      expect(resolved).toBeFalse(); expect(closed).toBeTrue();
    } finally { globalThis.indexedDB = previous; }
  });
});
