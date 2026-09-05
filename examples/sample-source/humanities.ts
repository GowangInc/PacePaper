import type { PaperManifest } from "../../src/papers.ts";
import { essayQuestion, inkQuestion, samplePaper, shortQuestion, textResource } from "./helpers.ts";

const psychology: PaperManifest[] = [
  samplePaper({
    subject: "psychology",
    subjectLabel: "Psychology",
    level: "SL",
    paper: "Paper 1 (SL) — original full-format practice",
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
    paper: "Paper 3 (HL) — original full-format practice",
    durationMinutes: 60,
    readingTimeMinutes: 5,
    maximumMarks: 24,
    mode: "reading",
    instructions: "Use the original research stimulus and answer all three questions in their linked response areas. No separate answer sheet is used.",
    selectionMode: "all",
    resources: [textResource(
      "research-stimulus",
      "Original research stimulus",
      "A researcher investigated how recently arrived boarding students experience shared study spaces. The study focused on students aged 16–18 during their first month at one residential school. Notices were placed in two boarding houses and the researcher then selected twelve volunteers who had used both the library and the evening study room at least three times. Nine participants identified English as an additional language.\n\nEach participant took part in a semi-structured interview lasting 25–40 minutes. Interviews opened with the same broad invitation: ‘Describe a time when a shared study space helped or prevented you from working.’ The interviewer used follow-up questions to ask about noise, visibility, seating, friendships and interactions with supervising adults, but changed the order in response to each participant. Interviews were conducted in a private meeting room, audio-recorded with written consent and transcribed verbatim. Students and parents received an information sheet, and students were reminded that participation would not affect school reports or boarding privileges.\n\nThe researcher and a colleague independently coded four transcripts before agreeing on a provisional coding framework. They then coded the remaining transcripts and compared disagreements. Three initial themes were reported: visibility, informal rules and control of noise. The researchers deliberately retained two accounts that contradicted the dominant pattern. One student described visible supervision as reassuring, while most described it as pressure.\n\nParticipants received a one-page summary and could correct factual details or withdraw a quotation. Two participants asked for wording changes because they feared classmates might recognize an incident. The final report used pseudonyms, removed boarding-house names and stated that its findings represented experiences at one school rather than all boarding students. The researcher proposed a later observation study to compare what participants said with how the rooms were used.",
    )],
    questions: [
      shortQuestion("q1", "Question 1 — method and sampling", "Identify the research method and outline two of its characteristics. Describe the sampling method, then suggest one alternative or additional method with one reason for the choice.", 9, ["research-stimulus"]),
      shortQuestion("q2", "Question 2 — ethics", "Discuss two ethical considerations in the study and evaluate how well the procedure addressed them.", 6, ["research-stimulus"]),
      essayQuestion("q3", "Question 3 — credibility", "Discuss how the researchers could ensure that the results are credible. Refer to the procedures used, sampling, reflexivity and at least one additional relevant consideration.", 9, ["research-stimulus"]),
    ],
  }),
];

const businessManagement: PaperManifest[] = [
  samplePaper({
    subject: "business-management",
    subjectLabel: "Business Management",
    level: "SL",
    paper: "Paper 2 (SL) — original full-format practice",
    durationMinutes: 90,
    readingTimeMinutes: 5,
    maximumMarks: 40,
    mode: "reading",
    instructions: "Answer both Section A questions and one of the two alternatives inside Section B. Show all working and units in the linked response areas. No separate answer booklet or answer sheet is used.",
    selectionMode: "all",
    resources: [textResource(
      "loop-loom-case",
      "Original case material — Loop & Loom",
      "CASE A — Loop & Loom\nLoop & Loom (L&L) repairs used clothing and turns damaged textiles into bags. The business sells each bag for $48. Variable material and labour cost is $27 per bag. Monthly fixed costs are $8,400. Current monthly output and sales are 520 bags. The operations manager believes demand could rise by 15%, but the finance manager warns that rent will rise by $900 per month.\n\nCASE B — North Quay Foods\nNorth Quay Foods is considering a laser cutter for its reusable packaging line. The machine costs $36,000 and has an expected residual value of $6,000 after four years. Forecast annual net cash inflows are $8,000, $10,500, $13,000 and $14,500. The firm's cost of capital is 6%. Managers are also considering leasing a slower machine that needs no initial capital but costs $1,150 per month.\n\nCASE C — Supermarket offer to L&L\nA supermarket chain has offered L&L a one-year contract for 300 additional bags per month at $39 each. Fulfilling the order would add monthly fixed quality-control costs of $1,800 and variable cost would fall to $25 per bag because materials could be purchased in bulk. The buyer demands standardized colours and next-day replacement of faulty products. Employees fear that accepting the contract may weaken L&L’s repair service and social mission. The founder sees a chance to make repaired textiles visible to a much wider market.\n\nCASE D — Independent growth\nInstead of accepting the chain contract, L&L could open an online shop. Set-up and photography would cost $9,500. Market research based on 86 existing customers predicts monthly online demand between 120 and 260 bags, but delivery emissions and return rates are uncertain. A local college has offered student interns to help with the launch, while an employee representative argues that permanent staff should control customer service.",
    )],
    questions: [
      inkQuestion("q1", "Section A · Question 1 (Case A)", "Using the original figures, calculate L&L’s monthly break-even output, margin of safety and monthly profit. Recalculate break-even after the rent rise, and comment on one limitation of break-even analysis.", 10, ["loop-loom-case"], 2),
      inkQuestion("q2", "Section A · Question 2 (Case B)", "Calculate the average rate of return and payback period for the laser cutter. Use the supplied cash flows and state one limitation of using either result alone.", 10, ["loop-loom-case"], 2),
      essayQuestion("q3", "Section B · choose Question 3 or 4", "Answer one alternative and state its number at the start.\n3. Using Case C and relevant business-management tools, recommend whether L&L should accept the supermarket contract. [20]\n4. Using Case D and relevant business-management tools, recommend whether L&L should open its own online shop. [20]", 20, ["loop-loom-case"]),
    ],
  }),
  samplePaper({
    subject: "business-management",
    subjectLabel: "Business Management",
    level: "HL",
    paper: "Paper 3 (HL) — original full-format practice",
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
