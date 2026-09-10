/**
 * A candidate preview has no server ticket, so this tab keeps its own listen
 * count: the paper's limit still governs the rehearsal, but no candidate's
 * listens are spent and nothing is recorded. Every other student endpoint falls
 * through to the real API, which the preview never calls for its own state.
 */
export function createPreviewAudioApi({ resources, paperId, fallbackApi }) {
  const completed = new Map();

  return (path, options = {}) => {
    if (!path.startsWith("/api/student/audio-play")) return fallbackApi(path, options);
    const resourceKey = options.body?.resourceKey ?? "";
    const resource = resources.find((item) => item.key === resourceKey);
    const limit = Number.isInteger(resource?.maxPlays) ? resource.maxPlays : 2;
    const played = Math.min(limit, completed.get(resourceKey) ?? 0);
    if (path.endsWith("/start")) {
      const started = Math.min(limit, played + 1);
      completed.set(resourceKey, started);
      return Promise.resolve({ plays: started });
    }
    if (path.endsWith("/complete")) return Promise.resolve({ plays: played });
    return Promise.resolve({
      plays: played,
      playToken: "preview",
      url: resource?.url ?? `/api/assets/${paperId}/${resourceKey}`,
    });
  };
}
