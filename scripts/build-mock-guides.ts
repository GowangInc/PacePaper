import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { FULL_MOCKS } from "../examples/sample-source/full-mocks/index.ts";
import type { FullMock } from "../examples/sample-source/full-mocks/types.ts";

export const mockGuidePath = resolve(import.meta.dir, "../docs/mock-marking/index.html");
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const lines = (value: string) => escape(value).replaceAll("\n", "<br>");
const anchor = (index: number) => `mock-${index + 1}`;
const title = ({ manifest }: FullMock) => `${manifest.subjectLabel} · ${manifest.level} · ${manifest.paper}`;

export function renderMockGuides(mocks: readonly FullMock[] = FULL_MOCKS): string {
  const contents = mocks.map((mock, i) => `<li><a href="#${anchor(i)}">${escape(title(mock))}</a></li>`).join("\n");
  const papers = mocks.map((mock, i) => {
    const { manifest } = mock;
    const answers = new Map(mock.marking.map(entry => [entry.questionId, entry]));
    const questions = manifest.questions.map(question => {
      const entry = answers.get(question.id);
      if (!entry) throw new Error(`Missing marking for ${title(mock)} ${question.id}`);
      const options = question.type === "single-choice" ? `<ol type="A">${(question.options ?? []).map(option => `<li>${escape(option)}</li>`).join("")}</ol>` : "";
      const resources = question.resourceKeys.map(key => manifest.resources.find(resource => resource.key === key)?.label ?? key);
      return `<article><h3>${escape(question.label)} <span>(${entry.marks} marks)</span></h3><p class="topic">${escape(entry.topic)}</p><p>${lines(question.prompt)}</p>${options}${resources.length ? `<p class="topic">Candidate resources: ${escape(resources.join("; "))}</p>` : ""}<div class="answer"><h4>Marking guidance</h4><p>${lines(entry.answer)}</p></div></article>`;
    }).join("\n");
    const timing = manifest.phases?.length
      ? manifest.phases.map(phase => `${phase.label}: ${phase.durationMinutes} min`).join(" · ")
      : `${manifest.durationMinutes} minutes working time · ${manifest.readingTimeMinutes} minutes locked reading`;
    return `<section id="${anchor(i)}"><h2>${escape(title(mock))}</h2><p>${manifest.questions.length} question cards · ${manifest.maximumMarks} raw marks</p><p>${escape(timing)}</p><h3>Before marking</h3><ul>${mock.teacherNotes.map(note => `<li>${escape(note)}</li>`).join("")}</ul><h3>Format references</h3><ul>${mock.sources.map(source => `<li><a href="${escape(source.url)}" rel="noreferrer">${escape(source.title)}</a></li>`).join("")}</ul>${questions}<p><a href="#contents">Back to contents</a></p></section>`;
  }).join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PacePaper — teacher mock marking guides</title>
<style>
:root { color-scheme: light; font: 17px/1.6 system-ui, sans-serif; color: #202b31; background: #f5f6f3; }
body { max-width: 960px; margin: auto; padding: 28px clamp(16px, 4vw, 48px); }
h1, h2, h3, h4 { line-height: 1.25; } h1 { font-size: 2rem; } h2 { font-size: 1.55rem; } h3 { font-size: 1.15rem; }
a { color: #155a76; text-underline-offset: .15em; } a:focus-visible { outline: 3px solid #155a76; outline-offset: 3px; }
li { margin-bottom: .65em; } section { margin-top: 3rem; padding-top: 1rem; border-top: 2px solid #9caeaf; scroll-margin-top: 1rem; }
article { background: white; border: 1px solid #cfd6d7; border-radius: 4px; padding: 20px; margin: 20px 0; overflow-wrap: anywhere; }
.notice, .answer { border-left: 4px solid #28716d; padding: 4px 18px; background: #edf4f1; } .topic, h3 span { font-size: .9rem; color: #485b65; font-weight: normal; }
@media print { :root { font: 10pt/1.45 system-ui, sans-serif; background: white; color: black; } body { max-width: none; padding: 0; } nav { display: none; } section { break-before: page; } article { border: 0; padding: 0; } h2, h3, h4 { break-after: avoid; } .answer { background: none; } a { color: black; } }
</style></head><body><header><p>PacePaper · teacher reference · September 2026</p><h1>Full-length mock marking guides</h1><div class="notice"><p><strong>Teacher-only answers. Do not share this file with candidates.</strong></p><p>These ${mocks.length} original papers cover the currently supported non-IB components. They are practice material, not official exams or calibrated grade predictions. Review the questions and guidance before classroom assessment. AP raw totals are not weighted percentages or AP 1–5 scores.</p></div><p>Choose the exact component and tier below. Match each question label to the candidate paper, then use its worked answer or rubric. Use your browser's Find command to locate a question.</p></header><nav id="contents" aria-label="Marking guide contents"><h2>Choose a paper</h2><ol>${contents}</ol></nav><main>${papers}</main></body></html>\n`;
}

export function buildMockGuides(): void {
  mkdirSync(join(mockGuidePath, ".."), { recursive: true });
  writeFileSync(mockGuidePath, renderMockGuides());
}

if (import.meta.main) {
  buildMockGuides();
  console.log(`WROTE ${FULL_MOCKS.length} teacher-only marking guides.`);
}
