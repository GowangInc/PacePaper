import { mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { encodePortablePaper } from "../src/papers.ts";
import { COURSE_SAMPLE_PAPERS } from "./sample-source/index.ts";

const jsonRoot = `${import.meta.dir}/course-samples`;
const portableRoot = `${import.meta.dir}/portable/course-samples`;
mkdirSync(jsonRoot, { recursive: true });
mkdirSync(portableRoot, { recursive: true });

const subjectCounts = new Map<string, number>();
const samples = COURSE_SAMPLE_PAPERS.map((manifest) => {
  const number = (subjectCounts.get(manifest.subject) ?? 0) + 1;
  subjectCounts.set(manifest.subject, number);
  return {
    manifest,
    jsonPath: `${manifest.subject}/example-${number}.paper.json`,
    portablePath: `${manifest.subject}-example-${number}.digitaldp-paper`,
  };
});

async function removeStale(root: string, pattern: string, expected: Set<string>): Promise<void> {
  for await (const relativePath of new Bun.Glob(pattern).scan({ cwd: root, onlyFiles: true })) {
    if (!expected.has(relativePath)) await rm(`${root}/${relativePath}`);
  }
}

await removeStale(jsonRoot, "**/example-*.paper.json", new Set(samples.map((sample) => sample.jsonPath)));
await removeStale(portableRoot, "*.digitaldp-paper", new Set(samples.map((sample) => sample.portablePath)));

for (const { manifest, jsonPath, portablePath } of samples) {
  const subjectDirectory = `${jsonRoot}/${manifest.subject}`;
  mkdirSync(subjectDirectory, { recursive: true });
  await Bun.write(`${jsonRoot}/${jsonPath}`, `${JSON.stringify(manifest, null, 2)}\n`);

  const portable = await encodePortablePaper(manifest, []);
  await Bun.write(`${portableRoot}/${portablePath}`, portable);
}

console.log(`WROTE ${COURSE_SAMPLE_PAPERS.length} editable manifests and portable DigitalDP papers.`);
