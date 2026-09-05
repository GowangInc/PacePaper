import { choiceQuestion, essayQuestion, samplePaper, textResource } from "../helpers.ts";
import type { ExamPhase, PaperQuestion } from "../../../src/papers.ts";
import type { FullMock, MockMarkingEntry } from "./types.ts";
import { AP_ENGLISH_MCQ } from "./ap-english-mcq.ts";
import { AP_ENGLISH_DRAFT_C, AP_ENGLISH_DRAFT_D, AP_ENGLISH_DRAFT_E, AP_ENGLISH_READING_A, AP_ENGLISH_READING_B, AP_ENGLISH_RHETORIC } from "./ap-english-passages.ts";
import { AP_ENGLISH_SYNTHESIS_SOURCES } from "./ap-english-synthesis.ts";

const inSection = (question: PaperQuestion, sectionId: string): PaperQuestion => ({ ...question, sectionId });
const phases: ExamPhase[] = [
  { id: "section-1", label: "Section I — multiple choice", kind: "work", durationMinutes: 60, sectionId: "section-1", tools: ["Text highlighting", "Digital multiple-choice", "Mark for review"], instructions: "Answer all 45 questions in the five passage sets. Select one answer per question. You cannot return to this section after it ends." },
  { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [], instructions: "Take the supervised break. Examination content and response entry are unavailable during the break." },
  { id: "section-2", label: "Section II — free response", kind: "work", durationMinutes: 135, sectionId: "section-2", tools: ["Typed essays", "Text highlighting", "Optional 15-minute planning/reading period"], instructions: "Write all three essays. You may spend the first 15 minutes reading and planning, or begin writing immediately. This optional period is part of your 135 minutes, not extra time. You may move among these three questions while this section remains open; Section I stays closed." },
];

const sharedEssayNotes = "Score the three rows separately: thesis 0–1, evidence/commentary 0–4, sophistication 0–1. The thesis point requires a defensible answer to this particular prompt, not a topic announcement. Sophistication requires sustained insight into a consequential tension, the argument's implications or its rhetorical situation, or consistently effective persuasive style; a decorative concession or ornate vocabulary alone is insufficient. Credit cogent alternative interpretations and viewpoints. Severe writing errors that obstruct communication prevent the top evidence/commentary score. These are paraphrased practice criteria, not an official score determination.";

const essayMarking: MockMarkingEntry[] = [
  {
    questionId: "frq1", marks: 6, topic: "Synthesis: evidence-based policy argument",
    answer: `${sharedEssayNotes}
Evidence/commentary progression: 0 for irrelevant restatement or fewer than two sources; 1 for at least two sources used mostly as summary; 2 for at least three sources with some explanation but an absent or faulty reasoning chain; 3 for specific support from at least three sources across the argument with uneven explanation; 4 for specific support from at least three sources and consistently developed connections throughout.
Possible thesis: Bellford should favour a connected, usable route only after establishing maintenance funding and testing access and ecological constraints, even if those conditions require redesigning an attractive full-trail plan. A well-supported case to defer conversion or retain a corridor option is equally valid.
Evidence and commentary to look for: A distinguishes opening-day funding from recurring obligations; C quantifies $140000 versus $110000 yearly maintenance, not just a $1.1m capital difference. C's full trail offers 14 km publicly but only 10 km step-free, and E explains why the location of a gap can defeat a useful journey. D qualifies the hectares metric: disturbance location and season matter. B can be linked to E as a case for design-changing participation rather than treated as a veto by existing neighbours. F challenges the false choice between immediate recreation and guaranteed future trains: no operator has proposed a service, but preserving continuity can retain options.
Sophisticated possibilities include prioritising continuous useful journeys over raw length, distinguishing uncertain capital estimates from unknown benefits, or developing a reversible staged plan while recognising that a phase connecting only one district could defer benefits to others. Students must not treat C as a measured health study, turn ±25% into certainty, or infer that all fourteen kilometres are fully accessible. Sources may be paraphrased with clear A–F attribution. A source-by-source list without reasoning is not synthesis; using all six sources is not required.`,
  },
  {
    questionId: "frq2", marks: 6, topic: "Rhetorical analysis: community-orchestra welcome",
    answer: `${sharedEssayNotes}
Evidence/commentary progression: 0 for irrelevant assertion or repetition; 1 for general description; 2 for some specific detail with incomplete or faulty reasoning; 3 for specific support across the argument, some developed explanation and a demonstrated link between at least one choice and the message; 4 for consistent commentary connecting several choices to the speaker's purpose and audience.
Possible thesis: Faris combines candid self-inclusion, concrete access commitments and a redefinition of disciplined listening to persuade a mixed-experience orchestra that generosity enables serious performance rather than excuses weak work.
Specific evidence routes: Paragraph 1 confesses uneven preparation before answering the anxious player's question directly, lowering the distance between conductor and vulnerable newcomer without denying expertise. Paragraph 2 re-reads the concert programme to expose transport, childcare and repair work, broadening shared responsibility beyond named performers. The contrasting beginner/experienced-player statements and imperatives in paragraph 3 give each group an active role. Paragraph 4 distinguishes welcoming from humiliating laughter, linking abstract inclusion to a recognisable rehearsal choice. Paragraph 5's anonymous instrument fund and promise to revise policies substantiate welcome with operational commitments; the staircase metaphor exposes how an apparently generous policy can obstruct participation. Paragraph 6 first affirms responsibility to an audience, then repeats invitations to listen for quieter achievements; the shared rest makes interdependence audible. The short closing imperatives turn the welcome into an immediate cooperative act.
Alternative analysis may emphasise the ethics of authority, the distinction between equality of belonging and sameness of skill, or the tension between public performance and private learning. Naming anaphora, ethos or metaphor without explaining the audience-specific effect is insufficient. Students need not catalogue every device or agree that the promises would succeed in practice.`,
  },
  {
    questionId: "frq3", marks: 6, topic: "Argument: options and meaningful freedom",
    answer: `${sharedEssayNotes}
Evidence/commentary progression: 0 for irrelevant repetition or unsupported opinion; 1 for broadly general examples; 2 for some specific relevant evidence with incomplete or faulty connections; 3 for specific evidence supporting the argument's claims with uneven explanation; 4 for a sustained reasoning chain in which specific evidence is consistently interpreted.
The prompt permits agreement, disagreement and qualification. Possible thesis: Additional options expand freedom when people can understand and realistically use them, but a larger menu can obscure constraints or impose decision costs without increasing genuine agency. An alternative thesis could argue that restricting choices because some are difficult risks paternalism and that support, rather than fewer options, is the proper response.
Evidence may come from accurately developed historical, literary, scientific, civic or personal examples. Strong reasoning might compare a genuine new educational route with nominal choices sharing an unaffordable cost; explain how a limited set of well-understood emergency actions differs from long-term creative exploration; or distinguish a platform's numerous settings from a user's actual ability to control a consequential outcome. These are routes for the teacher to recognise, not required examples or factual claims supplied by this examination.
Reward explanation of why an example tests the relationship between number of options and capacity to act. Do not reward merely asserting that choice is overwhelming or that more is always better. Sophistication may examine who sets the menu, whose resources make an option usable, or when narrowing choices supports rather than limits agency. No outside research, invented statistics or particular ideological position is required.`,
  },
];

export const AP_ENGLISH_FULL_MOCK: FullMock = {
  manifest: samplePaper({
    subject: "ap-english-language-composition",
    subjectLabel: "AP English Language and Composition",
    level: "AP",
    paper: "End-of-course exam — original full-length mock",
    examFormat: {
      systemId: "ap", systemLabel: "Advanced Placement (AP)", qualificationLabel: "Advanced Placement",
      deliveryMode: "Fully digital practice", fidelity: "adapted", profileVersion: "2026-09-05",
      rulesSummary: "May 2027 format · 45 four-choice questions in five sets · 3 essays · 60 min / 10-min break / 135 min · optional reading inside Section II",
    },
    durationMinutes: 205,
    readingTimeMinutes: 0,
    phases,
    maximumMarks: 63,
    mode: "essay",
    selectionMode: "all",
    instructions: "Original full-length practice, not an official or endorsed College Board exam. Section I has 45 four-choice questions in five sets: 24 reading-analysis questions and 21 writing-revision questions. Section II has three essays. Answer every question. The 205-minute session contains 195 minutes of working time and a 10-minute supervised break. Section II's optional 15-minute reading/planning period is included in its 135 minutes; writing is permitted immediately. DigitalDP advances after its fixed break, unlike Bluebook's candidate-controlled resume. All passages, people, institutions and source data in this mock are fictional creations presented in nonfiction genres for rhetorical practice; they are not quotations from real research. All necessary sources are attached. No external research is required. The 63 raw marks are a classroom tally, not an AP 1–5 score; the teacher companion explains the 45%/55% section weighting.",
    resources: [
      textResource("reading-a", "Reading set A — public archives", AP_ENGLISH_READING_A),
      textResource("reading-b", "Reading set B — field notebooks", AP_ENGLISH_READING_B),
      textResource("draft-c", "Writing set C — tool lending", AP_ENGLISH_DRAFT_C),
      textResource("draft-d", "Writing set D — street lighting", AP_ENGLISH_DRAFT_D),
      textResource("draft-e", "Writing set E — oral history", AP_ENGLISH_DRAFT_E),
      ...AP_ENGLISH_SYNTHESIS_SOURCES.map(source => textResource(source.key, source.label, source.text)),
      textResource("rhetoric-speech", "Free response 2 — orchestra welcome", AP_ENGLISH_RHETORIC),
    ],
    questions: [
      ...AP_ENGLISH_MCQ.map((item, index) => inSection(choiceQuestion(
        `mcq${index + 1}`, `Section I — Question ${index + 1}`, item.prompt, item.options, 1, [item.resourceKey],
      ), "section-1")),
      inSection(essayQuestion("frq1", "Section II — Question 1: Synthesis", "Bellford is considering converting a disused railway into a public walking and cycling route. Read all six attached sources and their headnotes. Develop an argument about the most important considerations Bellford should use in deciding whether and how to carry out the conversion. Establish a defensible position, use evidence from at least three sources, and explain the connections between the evidence and your reasoning. Identify sources clearly as Source A, Source B, and so on; quotation, paraphrase and summary are all acceptable when attributed. Do more than describe the sources separately. The scenario and evidence are fictional but should be treated as the supplied policy record for this task. Write a coherent essay; no fixed word count is required.", 6, AP_ENGLISH_SYNTHESIS_SOURCES.map(source => source.key)), "section-2"),
      inSection(essayQuestion("frq2", "Section II — Question 2: Rhetorical analysis", "Read Leona Faris's attached welcome speech to the returning community orchestra. Write an essay analysing how her rhetorical choices convey her message about rebuilding the ensemble. Develop an interpretive thesis, use specific evidence from the speech, and explain how the choices work in relation to the speaker's purpose, occasion and mixed-experience audience. Analyse the rhetoric rather than merely summarising the speech or stating whether you agree with it. No fixed word count is required.", 6, ["rhetoric-speech"]), "section-2"),
      inSection(essayQuestion("frq3", "Section II — Question 3: Argument", "Consider this original claim: Having more options does not necessarily give a person more freedom. Write an essay developing your position on the relationship between the number of options available and a person's meaningful freedom to act. You may agree, disagree or qualify the claim. Support a defensible thesis with specific evidence from your knowledge, reading, observations or experience, and explain how that evidence advances your reasoning. Acknowledge relevant limits or complexities where they matter to your position. No external research or fixed word count is required.", 6), "section-2"),
    ],
  }),
  marking: [
    ...AP_ENGLISH_MCQ.map((item, index): MockMarkingEntry => ({
      questionId: `mcq${index + 1}`, marks: 1, topic: item.skill, correctOption: item.correctOption,
      answer: `${String.fromCharCode(65 + item.correctOption)} — ${item.options[item.correctOption]}. ${item.rationale} Award 1 for this option; 0 for any other or an unanswered item.`,
    })),
    ...essayMarking,
  ],
  teacherNotes: [
    "Complete original workload: five Section I sets (12+12 reading; 7+7+7 writing), 45 four-option questions, six substantive synthesis sources including a quantitative comparison table, a separate rhetorical-analysis speech, and an independent argument prompt. Passage length is this mock's editorial choice, not an asserted fixed College Board word-count rule.",
    "All attributed speakers, institutions, events and research-like data are expressly fictional. Candidates analyse simulated nonfiction genres. This differs from the actual exam's use of authentic published nonfiction; no licensed passage is reproduced and no invented source is presented as real research.",
    "Keep this marking companion teacher-only. MCQ answer positions are balanced 12 A / 11 B / 11 C / 11 D; answer indices and rationale text remain outside the candidate paper.",
    "Report the two raw sections separately: MCQ /45 and essays /18. An optional weighted practice percentage is 45×(MCQ/45) + 55×(essay total/18). The application's unweighted raw total /63 is not that percentage. Neither number yields an official AP 1–5 score; no official grade boundaries are claimed.",
    "Timing is 60 minutes Section I, 10-minute monitored break, 135 minutes Section II. The optional 15-minute reading/planning period belongs within Section II and must not become a locked reading phase or an extra 15 minutes. Candidates can work on any of the three essays during Section II. DigitalDP's automatic post-break advance differs from Bluebook resume behavior.",
    "Review all passages and answer rationales before a consequential classroom assessment. Internal authoring and structural checks are not independent AP-reader moderation or evidence that the paper has been statistically equated to a live exam. Subject-teacher review of distractor difficulty and essay standards remains required.",
  ],
  sources: [
    { title: "AP English Language and Composition exam overview (current May 2027 page)", url: "https://apcentral.collegeboard.org/courses/ap-english-language-and-composition/exam" },
    { title: "AP English Language course overview and four-choice update", url: "https://apcentral.collegeboard.org/courses/ap-english-language-and-composition?course=556" },
    { title: "AP English Language course and exam description, effective Fall 2024", url: "https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-course-and-exam-description.pdf" },
    { title: "AP English Language free-response scoring rubrics", url: "https://apcentral.collegeboard.org/media/pdf/ap-english-language-and-composition-frqs-1-2-3-scoring-rubrics.pdf" },
    { title: "2026 released English Language directions: optional pacing inside Section II", url: "https://apcentral.collegeboard.org/media/pdf/ap26-frq-english-language.pdf" },
    { title: "College Board AP break and accommodation information", url: "https://accommodations.collegeboard.org/how-accommodations-work/for-each-test/ap-exams" },
    { title: "Digital AP scheduled-break resume behavior", url: "https://apcentral.collegeboard.org/help-center/how-does-scheduled-break-work-digital-ap-exams-two-sections" },
    { title: "Bluebook timing and breaks", url: "https://bluebook.collegeboard.org/help-center/how-do-breaks-and-timing-work-bluebook" },
  ],
};
