import { choiceQuestion, inkQuestion, samplePaper, textResource } from "../helpers.ts";
import { BIOLOGY_CHOICES, BIOLOGY_MCQ_RESOURCES } from "./ap-biology-mcq.ts";
import type { FullMock } from "./types.ts";

const reference = textResource("bio-formulas", "Biology reference facts · available throughout", `Mathematical reference facts, independently typeset for this original practice exam. These are not a reproduction of the College Board reference booklet.
Mean x̄ = Σx/n. Sample standard deviation s = √[Σ(x−x̄)²/(n−1)]. Standard error SE = s/√n. An approximate 95% confidence interval is x̄±2 SE when the sampling assumptions are appropriate; overlap alone is not a formal significance test.
Percent change =100(new−original)/original. Rate = change/time.
χ² = Σ[(observed−expected)²/expected]. For an unadjusted goodness-of-fit test, degrees of freedom = number of categories−1. At p=0.05, critical values: df 1: 3.841; df 2: 5.991; df 3: 7.815. If χ² exceeds the relevant critical value, reject the specified null model at that level.
For a two-allele locus: p+q=1. Hardy–Weinberg expected genotype frequencies: p², 2pq, q². Assumptions: large population, random mating, no mutation, no migration and no selection at the locus.
Independent-event probability: P(A and B)=P(A)P(B). Mutually exclusive alternatives: P(A or B)=P(A)+P(B).
Water potential: Ψ=Ψp+Ψs. Solute potential: Ψs=−iCRT, with i the dissociation factor, C in mol L⁻¹, R=0.0831 L bar mol⁻¹ K⁻¹, T in kelvin. Celsius to kelvin: add 273.15.
Exponential growth: dN/dt=rN. Logistic growth: dN/dt=rN(1−N/K), with N population size, r intrinsic per-capita rate, K carrying capacity.
Net primary productivity = gross primary productivity−producer respiration.
Sphere: surface area 4πr², volume 4πr³/3. Rectangular solid: volume lwh, surface area 2(lw+lh+wh).`);

const freeResponses = [
  {
    id: "bio-frq-1", marks: 9, topic: "Units 6 and 4 · interpreting and evaluating experimental results",
    resource: textResource("bio-frq-gene", "FRQ 1 · bacterial gene regulation", `Original investigation. A bacterium can use sugar S when it produces transporter X. A regulatory protein Q binds a DNA site near the promoter of gene X. Binding inhibits transcription. A small molecule derived from S binds Q and prevents Q from binding DNA. Researchers investigate whether Q and the DNA site regulate gene X as proposed.
All cultures begin with the same cell density and an equal, nonlimiting alternative carbon source. Relative X mRNA is measured after 20 minutes. Growth is measured over the next 6 hours. Means are from 8 independent cultures; values are mean ±2 SE.
Strain | Sugar S | Relative X mRNA | Growth / generations per hour
Wild type | absent | 2±0.4 | 0.30±0.02
Wild type | present | 18±1.2 | 0.62±0.04
Q gene deleted | absent | 19±1.0 | 0.27±0.02
Q gene deleted | present | 20±1.1 | 0.60±0.03
DNA binding site altered | absent | 17±1.0 | 0.28±0.02
DNA binding site altered | present | 18±1.3 | 0.61±0.03
The DNA-site alteration does not change the promoter sequence or the X coding sequence. These are designed teaching data, not results from a published study.`),
    prompt: `(a) Describe the role of a promoter in transcription. [1]
(b)(i) Identify the dependent variable that directly measures gene X transcriptional output. [1]
(ii) Explain why the wild-type strain grown without S is an appropriate comparison for wild type grown with S. [1]
(c)(i) Calculate the fold-change in mean X mRNA when S is added to wild type. Show your calculation. [1]
(ii) Use one comparison involving the Q-deletion strain and one involving the altered DNA site to explain how the data support the proposed regulatory model. [2]
(d)(i) A new Q allele produces a protein that binds the DNA site normally but cannot bind the S-derived molecule. Predict X mRNA in this strain when S is present relative to wild type with S, and justify your prediction. [2]
(ii) Explain one possible resource-allocation reason why constitutive X production could reduce growth when S is absent. [1]`,
    answer: `(a) [1] A promoter is the DNA region at which transcription machinery/RNA polymerase binds to initiate transcription.
(b)(i) [1] Relative amount of X mRNA at 20 min. (ii)[1] Same strain/background and carbon supply without the inducing treatment supplies the baseline, so adding S is the manipulated difference.
(c)(i) [1] 18/2=9-fold (not 16-fold). (ii)[1] Without S, Q deletion gives 19 versus wild-type 2: removing Q removes repression. [1] Altering the binding site likewise gives 17 without S and little further response to S, consistent with Q requiring that site to repress. These support, but do not alone prove, direct binding.
(d)(i) [1] Lower X mRNA than wild type with S, near a repressed/basal level. [1] The mutant Q is not released by inducer and remains bound to the site, blocking efficient transcription. (ii)[1] Unneeded X transcription/translation uses ATP, amino acids or ribosomes that could otherwise support growth. Credit equivalent resource-cost explanations; do not assert statistical significance from small growth differences alone.`,
  },
  {
    id: "bio-frq-2", marks: 9, topic: "Units 3 and 8 · experimental results with graphing",
    resource: textResource("bio-frq-respiration", "FRQ 2 · temperature and respiration", `Original investigation. Researchers acclimate equal-mass groups of a small freshwater crustacean to different temperatures for 24 hours. Eight independent chambers per temperature contain equal numbers of organisms in the same volume of oxygenated water. Sensors measure the initial oxygen-consumption rate; no chamber becomes oxygen limited. Matched chambers without organisms measure background oxygen change, which is subtracted. Salinity, food history and light are held constant.
Temperature / °C | Mean oxygen consumption / µmol O₂ g⁻¹ h⁻¹ | 2 SE
10 | 3.2 | 0.4
15 | 4.6 | 0.4
20 | 6.8 | 0.6
25 | 9.2 | 0.8
30 | 6.0 | 0.6
All organisms survive the initial measurement. This study does not directly measure protein shape or enzyme activity.`),
    prompt: `(a) Explain why oxygen consumption can provide evidence about the rate of aerobic respiration. [1]
(b) Construct a graph of the data, including appropriately scaled and labeled axes, all means, and ±2 SE error bars. [3]
(c)(i) Describe the pattern across 10–30°C, including the temperature with the highest measured mean. [1]
(ii) Calculate the percentage increase in mean rate from 10°C to 25°C. Show your work. [1]
(d)(i) Predict how the rate at 20°C would change if an inhibitor blocked transfer of electrons to oxygen, and explain the cellular basis of the prediction. [2]
(ii) A student claims that the fall at 30°C proves respiratory enzymes denatured. Explain why the measurements do not establish that mechanism. [1]`,
    answer: `(a) [1] Oxygen accepts electrons at the end of the respiratory electron-transport chain, so its consumption reflects aerobic electron transport under these conditions.
(b) [1] Temperature on horizontal axis with °C and oxygen-consumption rate on vertical axis with µmol O₂ g⁻¹ h⁻¹, sensible linear scales. [1] All five means plotted accurately: 3.2, 4.6, 6.8, 9.2, 6.0 at 10, 15, 20, 25, 30°C. [1] Error bars span 2.8–3.6, 4.2–5.0, 6.2–7.4, 8.4–10.0, 5.4–6.6. Credit a clearly keyed point/line graph; no invented intermediate measurements.
(c)(i) [1] Mean rate rises from 10 to 25°C (highest 9.2), then falls at 30°C. (ii)[1] (9.2−3.2)/3.2×100=187.5%.
(d)(i) [1] Oxygen consumption would decrease markedly. [1] The inhibitor prevents oxygen reduction/terminal electron acceptance, suppressing electron transport. (ii)[1] Only whole-organism oxygen use was measured; altered activity, stress regulation or other processes could explain the fall. Direct enzyme/structural evidence or a suitable follow-up test is needed.`,
  },
  {
    id: "bio-frq-3", marks: 4, topic: "Unit 8 · scientific investigation",
    resource: textResource("bio-frq-seeds", "FRQ 3 · seed germination proposal", `Original scenario. A plant establishes mainly in recently opened canopy gaps. A researcher hypothesizes that light reaching the soil stimulates its seed germination. Seeds can be obtained from many parent plants. The available growth cabinets allow light exposure and temperature to be controlled independently. Germination is defined as emergence of the root from the seed coat.`),
    prompt: `(a) Describe why germination in a canopy gap could improve a seedling's access to a resource needed for photosynthesis. [1]
(b) Propose a test of the light hypothesis, identifying the light treatments and an appropriate controlled variable. [1]
(c) Describe how you would use replication and random allocation to avoid confounding light treatment with parent plant. [1]
(d) State a result that would support the hypothesis, expressed using a measurable dependent variable. [1]`,
    answer: `(a) [1] A gap provides more light for the photosynthetic reactions, potentially increasing carbon fixation/growth. (b) [1] Compare illuminated and dark treatments (or specified light levels) while keeping temperature, water and substrate equivalent; light must be the tested difference. (c) [1] Randomly split seeds from multiple parents among replicated independent containers in each treatment, rather than putting one parent's seeds in each treatment. (d) [1] A greater proportion germinates within a fixed period under light than darkness, supported by replicated results/appropriate uncertainty; faster germination measured consistently also acceptable.`,
  },
  {
    id: "bio-frq-4", marks: 4, topic: "Unit 5 · conceptual analysis",
    resource: textResource("bio-frq-meiosis", "FRQ 4 · chromosome separation", `Original scenario. An organism has 2n=6. During meiosis I in one precursor cell, the homologous chromosomes of one pair fail to separate and both move to the same pole. The other two pairs separate normally. Meiosis II proceeds normally, and all four products survive. Count each chromosome by its centromere.`),
    prompt: `(a) Describe what normally separates during meiosis I. [1]
(b) State the chromosome numbers in each of the four meiotic products in this scenario. [1]
(c) Explain how fertilization of one of these products by a normal gamete could produce a zygote with an extra chromosome. [1]
(d) Explain one way an extra chromosome can affect phenotype without changing the base sequence of a gene. [1]`,
    answer: `(a) [1] Homologous chromosomes separate; sister chromatids generally remain together. (b) [1] 4, 4, 2, 2 chromosomes (normal n=3). (c) [1] A 4-chromosome gamete plus normal 3 produces a 7-chromosome zygote (2n+1), with three homologs of the affected chromosome. (d) [1] Increased gene dosage can alter amounts of gene products or disrupt relative amounts in cellular pathways/protein complexes.`,
  },
  {
    id: "bio-frq-5", marks: 4, topic: "Unit 8 · analysis of a visual model",
    resource: textResource("bio-frq-web", "FRQ 5 · food-web model", `Original simplified food web. Each arrow points from a food resource to the consumer receiving matter and energy. These are the only feeding links included in the model.
Grass ──→ rabbit ──→ fox
  │                   ↑
  └──→ grasshopper → frog

Both rabbit and frog are eaten by fox. Grass is a producer. Decomposers are omitted. The model shows feeding relationships, not population sizes, transfer efficiencies or strengths of interactions.`),
    prompt: `(a) Identify a primary consumer in the model. [1]
(b) Explain why the chemical energy available to foxes from the grass–grasshopper–frog–fox path is less than the energy initially captured by the grass. [1]
(c) Predict an indirect effect on grasshoppers if foxes are removed, assuming the shown links dominate and other conditions remain unchanged. Justify the direction using the model. [1]
(d) Describe one feature that should be added to represent recycling of matter more completely. [1]`,
    answer: `(a) [1] Rabbit or grasshopper. (b) [1] Organisms use energy in metabolism/respiration and transfer energy as heat at each level; not all biomass is consumed/assimilated. (c) [1] Fox removal can increase frogs, increasing predation on grasshoppers and reducing grasshopper numbers; accept this complete two-link mechanism. (d) [1] Add decomposers receiving dead material/waste and releasing inorganic nutrients used by grass. Do not describe energy as recycled.`,
  },
  {
    id: "bio-frq-6", marks: 4, topic: "Unit 7 · data analysis",
    resource: textResource("bio-frq-selection", "FRQ 6 · color composition of survivors", `Original investigation. A very large, isolated beetle population has known initial proportions of 50% light and 50% dark individuals. It occupies dark substrate with visually hunting predators. After a fixed interval, a researcher takes a simple random sample of 100 survivors: 32 are light and 68 are dark. The sample is a negligible fraction of the remaining population. There is no reproduction or migration during the interval, and individual beetles do not change color. The null hypothesis is that the survivor population still has the initial 50:50 color composition, giving expected sample counts of 50 light and 50 dark. Use a chi-square goodness-of-fit test with 1 degree of freedom and critical value 3.841 at p=0.05. Color has a heritable component, but no offspring are measured here. The numbers initially present and the total numbers surviving are not given.`),
    prompt: `(a) Describe the color composition of the sampled survivors relative to the initial population. [1]
(b) Calculate χ² for the stated null hypothesis. Show both contributions. [1]
(c) Use the test to state whether the null hypothesis should be rejected at p=0.05. [1]
(d) If this difference reflects consistent differential survival, predict the direction of color-frequency change over repeated generations under these conditions, and explain what assumption connects survival to evolution. [1]`,
    answer: `(a) [1] Dark beetles constitute 68% of sampled survivors versus 50% initially, while light beetles constitute 32% versus 50%. These are sample proportions, not the percentages of each initial color group that survived; color-specific survival rates cannot be calculated from the supplied data. (b) [1] (32−50)²/50+(68−50)²/50=6.48+6.48=12.96. (c) [1] 12.96>3.841, so reject the unchanged 50:50 survivor-composition null at p=0.05; this does not prove a particular mortality mechanism or universal result. (d) [1] The dark phenotype/dark-associated alleles should increase if the survival advantage is consistent, color differences are inherited and surviving dark beetles leave proportionately more reproducing descendants; survival alone does not establish reproductive success.`,
  },
];

export const AP_BIOLOGY_FULL_MOCK: FullMock = {
  manifest: samplePaper({
    subject: "ap-biology", subjectLabel: "AP Biology", level: "AP",
    paper: "End-of-course exam — original full-length mock (May 2027)",
    examFormat: {
      systemId: "ap", systemLabel: "Advanced Placement (AP)", qualificationLabel: "Advanced Placement",
      deliveryMode: "Hybrid-exam digital-ink practice", fidelity: "adapted", profileVersion: "2026-09-05",
      rulesSummary: "60 multiple choice +6 free response · 90+90 working minutes · 10-minute break · scientific nongraphing calculator · reference facts included",
    },
    durationMinutes: 190, readingTimeMinutes: 0, maximumMarks: 94, mode: "reading", selectionMode: "all",
    instructions: "Original full-length practice for the May 2027 format, not an official or endorsed AP exam. Section I: 60 multiple-choice questions in 90 minutes. After a 10-minute monitored break, Section II: two 9-point and four 4-point free-response questions in 90 minutes. Answer every question; choose the best answer for each MCQ. There is no separate reading period. A supplied four-function calculator with square root or scientific nongraphing calculator is permitted in both sections; handheld graphing calculators and handheld calculators with storage capabilities are not permitted under the 2027 policy. Reference facts are attached to every question. Real Bluebook offers Desmos scientific; this practice uses your supplied device. Work free responses in the integrated canvas, adding pages as needed. Explain biological mechanisms and show calculations; label graph axes and units. Real AP uses handwritten response booklets. DigitalDP starts the next section automatically after its fixed break and does not allow a return to an expired section. Raw marks are not an AP scaled score.",
    phases: [
      { id: "section-1", sectionId: "section-1", label: "Section I — 60 multiple-choice questions", kind: "work", durationMinutes: 90, tools: ["Scientific nongraphing calculator permitted", "Reference facts", "Digital multiple choice"], instructions: "Complete all 60 questions. You cannot return after this section ends." },
      { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [], instructions: "Examination content and responses are locked. Section II opens automatically when this fixed break ends." },
      { id: "section-2", sectionId: "section-2", label: "Section II — 6 free-response questions", kind: "work", durationMinutes: 90, tools: ["Scientific nongraphing calculator permitted", "Reference facts", "Digital working canvas"], instructions: "Answer all six questions. Questions 1–2 carry 9 points each; questions 3–6 carry 4 points each. Show reasoning and calculations." },
    ],
    resources: [reference, ...BIOLOGY_MCQ_RESOURCES, ...freeResponses.map(item => item.resource)],
    questions: [
      ...BIOLOGY_CHOICES.map((item, index) => ({ ...choiceQuestion(`bio-mcq-${index + 1}`, `Section I — Question ${index + 1}`, item.prompt, item.options, 1, ["bio-formulas", ...(item.resource ? [item.resource] : [])]), sectionId: "section-1" })),
      ...freeResponses.map((item, index) => ({ ...inkQuestion(item.id, `Section II — Question ${index + 1}`, item.prompt, item.marks, ["bio-formulas", item.resource.key], item.marks === 9 ? 3 : 2, index === 1 ? "square-grid" : "lined"), sectionId: "section-2" })),
    ],
  }),
  marking: [
    ...BIOLOGY_CHOICES.map((item, index) => ({ questionId: `bio-mcq-${index + 1}`, marks: 1, topic: item.topic, answer: item.answer, correctOption: item.correctOption })),
    ...freeResponses.map(item => ({ questionId: item.id, marks: item.marks, topic: item.topic, answer: item.answer })),
  ],
  teacherNotes: [
    "Full-length workload: 60 four-option MCQ and 6 multipart FRQ; 94 raw points. Use 50×(MCQ/60)+50×(FRQ/34) for a normalized practice percentage. Do not simply use raw 94-point percentage as the official 50/50 weighting and do not invent AP 1–5 conversion boundaries.",
    "MCQ blueprint by primary unit: U1=6, U2=7, U3=8, U4=8, U5=6, U6=8, U7=10, U8=7. Each unit allocation is within the current CED percentage range. Seven original four-question stimulus sets plus 32 individual items address concepts, models, methods, numerical analysis and argument evaluation. Cross-unit reasoning is present in the FRQ.",
    "FRQ functions follow the published pattern: experimental evaluation; experimental results with graphing; scientific investigation; conceptual analysis; model analysis; data analysis. Teacher key provides each whole-point allowance. Credit equivalent valid biological mechanisms and clearly reasoned alternatives where appropriate; do not require verbatim wording.",
    "The attached independently typeset reference facts cover this mock's required calculations. They are not an official reference booklet. Teachers should also familiarize students with the current College Board sheet before their real examination.",
    "Visual adaptation: tables, text pathways and an ASCII food web are self-contained; candidates construct their own labeled graphs on the integrated grid. Ink/typed alternatives and the fixed automatically ending break are DigitalDP adaptations, not exact Bluebook behavior.",
    "All scenarios, numbers, questions and explanations are original teaching content. This is a complete mock workload, not externally moderated or psychometrically calibrated. A qualified Biology teacher should review appropriateness before consequential grading. Never distribute this marking companion to candidates.",
  ],
  sources: [
    { title: "College Board AP Biology exam overview (May 2027)", url: "https://apcentral.collegeboard.org/courses/ap-biology/exam" },
    { title: "AP Biology CED: unit weights, science practices, exam pattern and reference appendix", url: "https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf" },
    { title: "2026 AP Biology released FRQ: structural comparator only", url: "https://apcentral.collegeboard.org/media/pdf/ap26-frq-biology.pdf" },
    { title: "AP calculator policy, including 2027 Biology restriction", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/exam-policies/calculator-policy" },
  ],
};
