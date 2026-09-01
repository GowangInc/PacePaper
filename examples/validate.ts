import { normalizeInkAnswer } from "../src/ink.ts";
import { parseManifest, parsePaperUpload, type PaperManifest } from "../src/papers.ts";

const paperFolders = [
  "sl-prose-choose-one",
  "sl-hl-mixed-data",
  "hl-language-b-listening",
  "business-quantitative",
] as const;

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function words(html: string): number {
  return html.replace(/<[^>]+>/gu, " ").trim().split(/\s+/u).filter(Boolean).length;
}

function expectedMime(filename: string): string {
  if (filename.endsWith(".wav")) return "audio/wav";
  if (filename.endsWith(".pdf")) return "application/pdf";
  if (/\.(?:png|jpe?g|webp)$/u.test(filename)) return `image/${filename.split(".").pop() === "jpg" ? "jpeg" : filename.split(".").pop()}`;
  return "application/octet-stream";
}

function validateSimulatedAnswers(manifest: PaperManifest, submission: Record<string, unknown>, folder: string): void {
  const answers = submission.answers;
  check(answers && typeof answers === "object" && !Array.isArray(answers), `${folder}: answers must be an object`);
  const answerMap = answers as Record<string, unknown>;
  const questionIds = new Set(manifest.questions.map((question) => question.id));
  for (const id of Object.keys(answerMap)) check(questionIds.has(id), `${folder}: response refers to unknown question ${id}`);

  if (manifest.selectionMode === "one") {
    check(typeof submission.selectedQuestionId === "string", `${folder}: choose-one response needs selectedQuestionId`);
    check(Object.keys(answerMap).length === 1, `${folder}: choose-one response must answer exactly one question`);
    check(answerMap[submission.selectedQuestionId] !== undefined, `${folder}: selected response is missing`);
  }

  for (const question of manifest.questions) {
    const answer = answerMap[question.id];
    if (answer === undefined && manifest.selectionMode === "one") continue;
    check(typeof answer === "string" && answer.trim().length > 0, `${folder}: missing simulated answer for ${question.id}`);
    if (question.type === "single-choice") {
      check(question.options?.includes(answer), `${folder}: invalid choice for ${question.id}`);
    }
    if (question.type === "ink" && question.ink) normalizeInkAnswer(answer, question.ink);
    if (question.type === "essay") {
      const count = words(answer);
      if (question.wordCountMin) check(count >= question.wordCountMin, `${folder}: ${question.id} is below its word minimum`);
      if (question.wordCountMax) check(count <= question.wordCountMax, `${folder}: ${question.id} exceeds its word maximum`);
    }
  }
}

for (const folder of paperFolders) {
  const base = `${import.meta.dir}/papers/${folder}`;
  const manifestPath = `${base}/paper.json`;
  const raw = JSON.parse(await Bun.file(manifestPath).text()) as Record<string, unknown>;
  check(raw.assessmentSession === "custom", `${folder}: assessmentSession must be custom`);
  check(!Object.hasOwn(raw, "examProfileId"), `${folder}: custom example must not claim an exam profile`);
  check(raw.sourceClassification === "teacher-authored", `${folder}: source classification must be teacher-authored`);
  check(raw.exportAuthorized === true, `${folder}: original demo must explicitly authorize portable export`);

  const manifest = parseManifest(raw);
  const allocatedMarks = manifest.selectionMode === "one"
    ? Math.max(...manifest.questions.map((question) => question.marks ?? 0))
    : manifest.questions.reduce((sum, question) => sum + (question.marks ?? 0), 0);
  check(allocatedMarks === manifest.maximumMarks, `${folder}: question marks do not match maximum marks`);

  const packageForm = new FormData();
  packageForm.set("format", "package");
  packageForm.append(
    "packageFiles",
    new File([await Bun.file(manifestPath).arrayBuffer()], "paper.json", { type: "application/json" }),
  );
  for (const resource of manifest.resources) {
    if (!resource.file) continue;
    const asset = Bun.file(`${base}/${resource.file}`);
    check(await asset.exists(), `${folder}: missing asset ${resource.file}`);
    packageForm.append(
      "packageFiles",
      new File([await asset.arrayBuffer()], resource.file, { type: expectedMime(resource.file) }),
    );
  }
  const imported = await parsePaperUpload(packageForm);
  check(imported.assets.length === manifest.resources.filter((resource) => resource.file).length, `${folder}: asset import mismatch`);

  const submission = JSON.parse(await Bun.file(`${base}/teacher-materials/simulated-submission.json`).text()) as Record<string, unknown>;
  validateSimulatedAnswers(manifest, submission, folder);
  console.log(`PASS ${folder}: ${manifest.level}, ${manifest.questions.length} questions, ${imported.assets.length} assets`);
}
