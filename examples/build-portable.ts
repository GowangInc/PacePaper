import { mkdirSync } from "node:fs";
import {
  encodePortablePaper,
  parseManifest,
  parsePaperUpload,
  type PaperResource,
  type PortablePaperAsset,
} from "../src/papers.ts";

const paperFolders = [
  "sl-prose-choose-one",
  "sl-hl-mixed-data",
  "hl-language-b-listening",
  "business-quantitative",
] as const;

const outputDirectory = `${import.meta.dir}/portable`;
mkdirSync(outputDirectory, { recursive: true });

function mimeFor(resource: PaperResource): string {
  const extension = resource.file?.split(".").pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    wav: "audio/wav",
  };
  const mime = extension ? byExtension[extension] : undefined;
  if (!mime) throw new Error(`No portable MIME mapping for ${resource.file}`);
  return mime;
}

for (const folder of paperFolders) {
  const sourceDirectory = `${import.meta.dir}/papers/${folder}`;
  const manifest = parseManifest(JSON.parse(await Bun.file(`${sourceDirectory}/paper.json`).text()) as unknown);
  const assets: PortablePaperAsset[] = [];

  for (const resource of manifest.resources) {
    if (!resource.file) continue;
    const source = Bun.file(`${sourceDirectory}/${resource.file}`);
    if (!(await source.exists())) throw new Error(`${folder}: missing asset ${resource.file}`);
    assets.push({
      filename: resource.file,
      mime: mimeFor(resource),
      data: new Uint8Array(await source.arrayBuffer()),
    });
  }

  const portable = await encodePortablePaper(manifest, assets);
  const outputName = `${folder}.digitaldp-paper`;
  const outputPath = `${outputDirectory}/${outputName}`;
  await Bun.write(outputPath, portable);

  const form = new FormData();
  form.set("format", "portable");
  form.set(
    "portablePaper",
    new File([portable], outputName, { type: "application/vnd.digitaldp.paper+gzip" }),
  );
  const restored = await parsePaperUpload(form);
  if (JSON.stringify(restored.manifest) !== JSON.stringify(manifest)) {
    throw new Error(`${folder}: portable round-trip changed the manifest`);
  }
  if (
    restored.assets.length !== assets.length ||
    restored.assets.some((asset, index) => {
      const source = assets[index];
      return !source ||
        asset.filename !== source.filename ||
        asset.mime !== source.mime ||
        asset.bytes.length !== source.data.length ||
        asset.bytes.some((byte, byteIndex) => byte !== source.data[byteIndex]);
    })
  ) {
    throw new Error(`${folder}: portable round-trip changed an asset`);
  }

  console.log(`BUILT ${outputName}: ${portable.byteLength.toLocaleString("en")} bytes, ${assets.length} assets`);
}
