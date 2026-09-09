import type { PaperManifest } from "../src/papers.ts";
import { RELEASE_SAMPLE_PAPER } from "./sample-source/english-b.ts";

// The one IB example exam bundled into a release: English B Paper 2 reading (HL).
// Sourced from the shared English-B module so the release and the development
// sample set stay in sync, while the compiled release embeds only English B — not
// the full 52-paper development set.
export { RELEASE_SAMPLE_PAPER };
export type { PaperManifest };
