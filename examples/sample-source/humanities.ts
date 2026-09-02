import type { PaperManifest } from "../../src/papers.ts";
import { essayQuestion, inkQuestion, samplePaper, shortQuestion, textResource } from "./helpers.ts";

const psychology: PaperManifest[] = [
  samplePaper({
    subject: "psychology",
    subjectLabel: "Psychology",
    level: "SL",
    paper: "Paper 1 — original core sample",
    durationMinutes: 120,
    readingTimeMinutes: 5,
    maximumMarks: 49,
    mode: "reading",
    instructions: "Answer all three short-response questions and then answer one of the three alternatives within Question 4. Type every response beside its question; no separate answer sheet is used.",
    selectionMode: "all",
    resources: [],
    questions: [
      shortQuestion("q1", "Question 1 — biological approach", "Explain one study of how one neurotransmitter may influence human behaviour.", 9),
      shortQuestion("q2", "Question 2 — cognitive approach", "Explain one study related to schema theory and memory.", 9),
      shortQuestion("q3", "Question 3 — sociocultural approach", "Explain one study of how belonging to a group may influence an individual’s behaviour.", 9),
      essayQuestion("q4", "Question 4 — choose one extended response", "Choose one alternative and state its letter at the start of your response.\nA. Evaluate one or more research methods used to study the relationship between the brain and behaviour.\nB. Discuss one or more explanations of reconstructive memory.\nC. Discuss the influence of one cultural dimension on behaviour.", 22),
    ],
  }),
  samplePaper({
    subject: "psychology",
    subjectLabel: "Psychology",
    level: "HL",
    paper: "Paper 3 — original research-methods sample",
    durationMinutes: 60,
    readingTimeMinutes: 5,
    maximumMarks: 24,
    mode: "reading",
    instructions: "Use the original research stimulus and answer all three questions in their linked response areas. No separate answer sheet is used.",
    selectionMode: "all",
    resources: [textResource(
      "research-stimulus",
      "Original research stimulus",
      "A researcher investigated how recently arrived boarding students experience shared study spaces. Twelve volunteers aged 16–18 took part in semi-structured interviews during their first month at school. Interviews lasted 25–40 minutes and were audio-recorded with consent. The researcher used open questions, including ‘Describe a time when the study room helped or prevented you from working.’ Transcripts were coded independently by the researcher and a colleague. They agreed on three initial themes: visibility, informal rules, and control of noise. Participants then received a one-page summary and could correct factual details or withdraw a quotation. Two participants asked for wording changes because they feared classmates might recognize an incident.",
    )],
    questions: [
      shortQuestion("q1", "Question 1 — method", "Explain why a semi-structured interview was an appropriate method for this investigation.", 6, ["research-stimulus"]),
      shortQuestion("q2", "Question 2 — ethics", "Discuss two ethical considerations in the study and evaluate how well the procedure addressed them.", 6, ["research-stimulus"]),
      essayQuestion("q3", "Question 3 — trustworthiness", "Evaluate the trustworthiness of the findings. Refer to researcher triangulation, participant checking, sampling and one additional relevant consideration.", 12, ["research-stimulus"]),
    ],
  }),
];

const businessManagement: PaperManifest[] = [
  samplePaper({
    subject: "business-management",
    subjectLabel: "Business Management",
    level: "SL",
    paper: "Paper 2 — original quantitative case sample",
    durationMinutes: 90,
    readingTimeMinutes: 5,
    maximumMarks: 40,
    mode: "reading",
    instructions: "Answer both Section A questions and one of the two alternatives inside Section B. Show all working and units in the linked response areas. No separate answer booklet or answer sheet is used.",
    selectionMode: "all",
    resources: [textResource(
      "loop-loom-case",
      "Original case material — Loop & Loom",
      "Loop & Loom (L&L) repairs used clothing and turns damaged textiles into bags. The business sells each bag for $48. Variable material and labour cost is $27 per bag. Monthly fixed costs are $8,400. Current monthly output and sales are 520 bags. L&L is considering a laser cutter costing $36,000 with an expected residual value of $6,000 after four years. The cutter is forecast to increase annual net cash inflow by $11,500.\n\nA supermarket chain has offered a one-year contract for 300 additional bags per month at $39 each. Fulfilling the order would add monthly fixed quality-control costs of $1,800 and variable cost would fall to $25 per bag because materials could be purchased in bulk. Employees are concerned that accepting the contract may weaken L&L’s repair service and social mission.",
    )],
    questions: [
      inkQuestion("q1", "Section A · Question 1", "Using the current figures, calculate L&L’s monthly break-even output, margin of safety and monthly profit. Show every step and include units.", 10, ["loop-loom-case"], 2),
      inkQuestion("q2", "Section A · Question 2", "Calculate the average rate of return for the proposed laser cutter. State one limitation of using this result alone to make the investment decision.", 10, ["loop-loom-case"], 2),
      essayQuestion("q3", "Section B · choose A or B", "Choose one alternative and state its letter at the start.\nA. Using quantitative and qualitative evidence, recommend whether L&L should accept the supermarket contract.\nB. Recommend whether L&L should purchase the laser cutter, considering finance, operations and its social mission.", 20, ["loop-loom-case"]),
    ],
  }),
  samplePaper({
    subject: "business-management",
    subjectLabel: "Business Management",
    level: "HL",
    paper: "Paper 3 — original social-enterprise sample",
    durationMinutes: 75,
    readingTimeMinutes: 5,
    maximumMarks: 25,
    mode: "reading",
    instructions: "Use all relevant numbered resources and answer all three questions in their linked DigitalDP response areas. No separate answer booklet or answer sheet is used.",
    selectionMode: "all",
    resources: [textResource(
      "harbour-light-resources",
      "Original resource pack — Harbour Light Cooperative",
      "Resource 1 — Overview\nHarbour Light Cooperative (HLC) trains unemployed coastal residents to repair discarded fishing nets and manufacture durable outdoor furniture. Its stated human need is secure local employment in communities affected by declining fish stocks.\n\nResource 2 — Operations message\nThe production manager reports that orders have doubled, but repaired-net supply varies by season. Reject rates rose from 4% to 11% after eight trainees joined. Experienced workers want production slowed for mentoring; the sales manager fears late deliveries.\n\nResource 3 — Customer post\n‘The bench is excellent, but HLC’s website does not explain how much ocean waste is actually diverted. I want evidence, not just a green label.’\n\nResource 4 — Finance extract\nHLC has $42,000 available. Option X is an automated cutting table costing $38,000. Option Y is a two-year training partnership costing $24,000, plus $6,000 for an impact-measurement system.\n\nResource 5 — Community email\nA local college offers workshop space and trainers if HLC guarantees 20 placements each year. Some members worry the partnership will shift decision-making away from the cooperative.",
    )],
    questions: [
      shortQuestion("q1", "Question 1", "Describe the human need that Harbour Light Cooperative addresses.", 2, ["harbour-light-resources"]),
      shortQuestion("q2", "Question 2", "Explain two challenges HLC faces as it attempts to scale its operations.", 6, ["harbour-light-resources"]),
      essayQuestion("q3", "Question 3", "Using the resource pack and relevant business-management tools and theories, recommend a sequenced plan for HLC’s next two years. Evaluate the trade-offs and explain how the plan would protect both financial sustainability and social impact.", 17, ["harbour-light-resources"]),
    ],
  }),
];

export const HUMANITIES_SAMPLE_PAPERS = [...psychology, ...businessManagement];
