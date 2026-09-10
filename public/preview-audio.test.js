import { describe, expect, test } from "bun:test";
import { createPreviewAudioApi } from "./preview-audio.js";

const resources = [
  { key: "clip", kind: "audio", maxPlays: 2 },
  { key: "interview", kind: "audio", maxPlays: 2, url: "https://example.test/interview.mp3" },
  { key: "notes", kind: "document" },
];

function build(paperId = "paper-1") {
  const delegated = [];
  const api = createPreviewAudioApi({
    resources,
    paperId,
    fallbackApi: (path, options) => {
      delegated.push([path, options]);
      return Promise.resolve({ delegated: true });
    },
  });
  return { api, delegated };
}

describe("candidate preview audio", () => {
  test("serves the paper's own asset instead of a server ticket", async () => {
    const { api } = build();
    expect(await api("/api/student/audio-play", { body: { resourceKey: "clip" } }))
      .toEqual({ plays: 0, playToken: "preview", url: "/api/assets/paper-1/clip" });
    expect(await api("/api/student/audio-play", { body: { resourceKey: "interview" } }))
      .toEqual({ plays: 0, playToken: "preview", url: "https://example.test/interview.mp3" });
  });

  test("counts listens up to the paper's limit and then stops", async () => {
    const { api } = build();
    const start = () => api("/api/student/audio-play/start", { body: { resourceKey: "clip" } });
    const complete = () => api("/api/student/audio-play/complete", { body: { resourceKey: "clip" } });

    expect(await start()).toEqual({ plays: 1 });
    expect(await complete()).toEqual({ plays: 1 });
    expect(await start()).toEqual({ plays: 2 });
    expect(await complete()).toEqual({ plays: 2 });
    // A third attempt cannot buy a listen the sitting would not allow.
    expect(await start()).toEqual({ plays: 2 });
    expect(await complete()).toEqual({ plays: 2 });
  });

  test("counts each recording separately", async () => {
    const { api } = build();
    await api("/api/student/audio-play/start", { body: { resourceKey: "clip" } });
    expect(await api("/api/student/audio-play/start", { body: { resourceKey: "interview" } })).toEqual({ plays: 1 });
    expect(await api("/api/student/audio-play", { body: { resourceKey: "clip" } })).toMatchObject({ plays: 1 });
    expect(await api("/api/student/audio-play", { body: { resourceKey: "interview" } })).toMatchObject({ plays: 1 });
  });

  test("leaves every other endpoint to the real API", async () => {
    const { api, delegated } = build();
    await api("/api/student/response", { method: "PUT", body: { resourceKey: "clip" } });
    expect(delegated).toEqual([["/api/student/response", { method: "PUT", body: { resourceKey: "clip" } }]]);
  });
});
