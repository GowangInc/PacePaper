import type { PaperManifest, PaperQuestion, PaperResource } from "../../src/papers.ts";
import { choiceQuestion, essayQuestion, inkQuestion, samplePaper, shortQuestion, textResource } from "./helpers.ts";

function mathematicsSamples(
  subject: string,
  subjectLabel: string,
  paperOneInstructions: string,
  paperOneQuestions: PaperQuestion[],
  paperTwoQuestions: PaperQuestion[],
  paperOneResources: PaperResource[] = [],
  paperTwoResources: PaperResource[] = [],
): PaperManifest[] {
  return [
    samplePaper({
      subject,
      subjectLabel,
      level: "SL",
      paper: "Paper 1 — original integrated-working sample",
      durationMinutes: 45,
      readingTimeMinutes: 5,
      maximumMarks: paperOneQuestions.reduce((sum, question) => sum + (question.marks ?? 0), 0),
      mode: "reading",
      instructions: paperOneInstructions,
      selectionMode: "all",
      resources: paperOneResources,
      questions: paperOneQuestions,
    }),
    samplePaper({
      subject,
      subjectLabel,
      level: "HL",
      paper: "Paper 2 — original calculator-and-working sample",
      durationMinutes: 60,
      readingTimeMinutes: 5,
      maximumMarks: paperTwoQuestions.reduce((sum, question) => sum + (question.marks ?? 0), 0),
      mode: "reading",
      instructions: "An approved graphing calculator is required. Answer every question in its linked digital working area, preserving intermediate steps, units and graphs. No separate answer sheet is used.",
      selectionMode: "all",
      resources: paperTwoResources,
      questions: paperTwoQuestions,
    }),
  ];
}

const mathematicsAA = mathematicsSamples(
  "mathematics-analysis-approaches",
  "Mathematics: Analysis and Approaches",
  "Do not use a calculator. Answer every question in its digital working area, show all reasoning, and give exact values where requested. No separate answer sheet is used.",
  [
    inkQuestion("q1", "Question 1 — algebra", "Factorize 2x² − 7x + 3, and hence solve 2x² − 7x + 3 = 0.", 5),
    inkQuestion("q2", "Question 2 — sequences", "An arithmetic sequence has fifth term 18 and twelfth term 46. Find the first term and common difference, then determine the sum of the first 20 terms.", 6),
    inkQuestion("q3", "Question 3 — calculus", "For f(x) = x³ − 3x² − 9x + 5, find the coordinates of both stationary points and classify each one.", 7),
    inkQuestion("q4", "Question 4 — trigonometry", "Given that sin θ = 3/5 and π/2 < θ < π, find the exact values of cos θ and sin(2θ).", 4),
  ],
  [
    inkQuestion("q1", "Question 1 — functions", "The function f(x) = (2x + 1)/(x − 3). Find f⁻¹(x), state the domain of f⁻¹, and solve f(f(x)) = x.", 7),
    inkQuestion("q2", "Question 2 — integration", "The curve y = x e^(−x) meets the x-axis at the origin. Find the exact area under the curve from x = 0 to x = 3, then give a decimal answer to three significant figures.", 7),
    inkQuestion("q3", "Question 3 — vectors", "Points A(1, −2, 3), B(5, 0, −1) and C(3, 4, 2) define a triangle. Find its area and the angle ABC.", 8, [], 2),
    inkQuestion("q4", "Question 4 — probability", "A biased coin has P(heads) = p. In 12 independent tosses, the probability of exactly 7 heads is 0.158 to three decimal places. Determine all possible values of p and explain which is more plausible if 80 heads were observed in 120 earlier tosses.", 8, [], 2),
  ],
);

const aiDataOne = textResource(
  "commute-data",
  "Original data set — commute and study time",
  "Six students recorded daily commute time x (minutes) and evening study time y (minutes):\nA: 12, 94\nB: 18, 86\nC: 25, 82\nD: 33, 69\nE: 41, 63\nF: 55, 48",
);
const aiDataTwo = textResource(
  "energy-data",
  "Original data set — energy demand",
  "A campus recorded mean outdoor temperature T (°C) and daily electricity demand E (MWh):\nT: 4, 7, 10, 13, 16, 19, 22, 25\nE: 31.2, 28.1, 25.4, 23.0, 21.9, 22.5, 25.1, 29.8",
);

const mathematicsAI = mathematicsSamples(
  "mathematics-applications-interpretation",
  "Mathematics: Applications and Interpretation",
  "An approved graphing calculator is required. Answer every question in its digital working area, preserving intermediate steps, units and graphs. No separate answer sheet is used.",
  [
    inkQuestion("q1", "Question 1 — finance", "A student deposits 6000 yuan in an account paying 3.2% annual interest compounded monthly. Find the balance after 4 years and the first month in which the balance exceeds 7000 yuan.", 6),
    inkQuestion("q2", "Question 2 — statistics", "Use the commute data to find Pearson’s correlation coefficient and the least-squares regression line of y on x. Interpret the slope in context.", 7, ["commute-data"], 2),
    inkQuestion("q3", "Question 3 — modelling", "A water tank initially contains 1200 L and drains at a rate modelled by V(t) = 1200(0.93)^t, where t is measured in minutes. Find the volume after 15 minutes and the time at which 75% of the original water has drained.", 6),
    inkQuestion("q4", "Question 4 — geometry", "A wheelchair ramp rises 0.84 m over a horizontal distance of 10.5 m. Calculate its angle of elevation and its length. A guideline limits the angle to 5°. Decide whether the ramp satisfies the guideline.", 5),
  ],
  [
    inkQuestion("q1", "Question 1 — nonlinear regression", "Use the energy-demand data to compare a linear model with a quadratic model. State suitable equations, compare their fit, and use the better model to estimate demand at 28°C. Comment on the reliability of the estimate.", 9, ["energy-data"], 2),
    inkQuestion("q2", "Question 2 — transition matrices", "A bike-share survey classifies users as occasional (O) or regular (R). Each month, 35% of O users become R and 15% of R users become O. Starting with 800 O users and 200 R users, construct a transition matrix, find the distribution after six months, and determine the long-term distribution.", 9, [], 2),
    inkQuestion("q3", "Question 3 — hypothesis testing", "A school claims that the median queue time in its cafeteria is 6 minutes. A random sample of 14 queue times is 4.1, 5.0, 5.2, 5.6, 5.8, 6.1, 6.3, 6.7, 7.0, 7.2, 7.8, 8.1, 9.0, 10.4. Perform a suitable test at the 5% level and state your conclusion in context.", 8, [], 2),
    inkQuestion("q4", "Question 4 — differential modelling", "The rate of change of an algae population P is modelled by dP/dt = 0.18P(1 − P/5000). Given P(0) = 400, use technology to estimate P(20), find when P first exceeds 4000, and explain the meaning of 5000 in the model.", 8, [], 2),
  ],
  [aiDataOne],
  [aiDataTwo],
);

interface ScienceConfig {
  subject: string;
  label: string;
  materialsInstructions: string;
  paperOneResources: PaperResource[];
  paperOneQuestions: PaperQuestion[];
  paperTwoResources: PaperResource[];
  paperTwoQuestions: PaperQuestion[];
}

function scienceSamples(config: ScienceConfig): PaperManifest[] {
  return [
    samplePaper({
      subject: config.subject,
      subjectLabel: config.label,
      level: "SL",
      paper: "Paper 1 — original combined 1A and 1B sample",
      durationMinutes: 35,
      readingTimeMinutes: 5,
      maximumMarks: config.paperOneQuestions.reduce((sum, question) => sum + (question.marks ?? 0), 0),
      mode: "reading",
      instructions: `Complete the selected-response and data/working questions under one timer. ${config.materialsInstructions} Enter each answer beside its question; no separate answer sheet is used.`,
      selectionMode: "all",
      resources: config.paperOneResources,
      questions: config.paperOneQuestions,
    }),
    samplePaper({
      subject: config.subject,
      subjectLabel: config.label,
      level: "HL",
      paper: "Paper 2 — original short and extended-response sample",
      durationMinutes: 60,
      readingTimeMinutes: 5,
      maximumMarks: config.paperTwoQuestions.reduce((sum, question) => sum + (question.marks ?? 0), 0),
      mode: "reading",
      instructions: `Answer every question using the response area attached to it. ${config.materialsInstructions} Show calculations, units, diagrams and reasoning where required. No separate answer sheet is used.`,
      selectionMode: "all",
      resources: config.paperTwoResources,
      questions: config.paperTwoQuestions,
    }),
  ];
}

const biology = scienceSamples({
  subject: "biology",
  label: "Biology",
  materialsInstructions: "An approved calculator is required; all data needed for this original sample is supplied within DigitalDP.",
  paperOneResources: [textResource("enzyme-data", "Original enzyme data", "Temperature (°C): 10, 20, 30, 40, 50\nMean product formed in 5 min (mg): 1.2, 2.7, 5.4, 7.1, 2.3")],
  paperOneQuestions: [
    choiceQuestion("q1", "Paper 1A · Question 1", "Which structure is present in both prokaryotic and eukaryotic cells?", ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"], 1),
    choiceQuestion("q2", "Paper 1A · Question 2", "Which process directly increases genetic variation during meiosis?", ["Binary fission", "Crossing over", "DNA translation", "Cytokinesis"], 1),
    choiceQuestion("q3", "Paper 1A · Question 3", "Which relationship describes energy transfer between trophic levels?", ["Energy is recycled completely", "Energy increases at each level", "Some energy is lost as heat", "Only producers respire"], 1),
    choiceQuestion("q4", "Paper 1A · Question 4", "A competitive inhibitor most directly affects which feature of an enzyme?", ["Its amino-acid sequence", "Its active-site availability", "Its gene location", "Its product mass"], 1),
    inkQuestion("q5", "Paper 1B · Question 5", "Plot the enzyme data on suitable axes, describe the pattern, and identify the optimum temperature in this investigation.", 4, ["enzyme-data"], 2, "square-grid"),
    shortQuestion("q6", "Paper 1B · Question 6", "Explain why product formation falls between 40°C and 50°C, referring to molecular structure.", 4, ["enzyme-data"]),
  ],
  paperTwoResources: [textResource("pond-study", "Original pond study", "Researchers added equal masses of leaf litter to eight pond tanks. Four tanks received extra nitrate. After 21 days, mean algal dry mass was 3.8 g without nitrate and 9.6 g with nitrate. Mean dissolved oxygen at dawn was 7.2 mg L⁻¹ without nitrate and 3.9 mg L⁻¹ with nitrate.")],
  paperTwoQuestions: [
    shortQuestion("q1", "Question 1 — data interpretation", "Calculate the percentage increase in mean algal dry mass caused by nitrate. Show the calculation and state the answer to three significant figures.", 5, ["pond-study"]),
    inkQuestion("q2", "Question 2 — causal model", "Construct an annotated causal diagram linking added nitrate to the change in dissolved oxygen at dawn.", 6, ["pond-study"], 1, "blank"),
    essayQuestion("q3", "Question 3 — experimental design", "Design a follow-up investigation to test whether light intensity changes the effect of nitrate on algal growth. Include variables, controls, replication and the data to be collected.", 8, ["pond-study"]),
    essayQuestion("q4", "Question 4 — extended response", "Explain how membrane transport and cell respiration together maintain cellular conditions, using named examples.", 11),
  ],
});

const chemistry = scienceSamples({
  subject: "chemistry",
  label: "Chemistry",
  materialsInstructions: "An approved calculator is required. Use the original reference data supplied within this sample; no external data booklet is needed.",
  paperOneResources: [textResource("chem-reference", "Reference data for this sample", "Relative atomic masses: H 1.01, C 12.01, O 16.00, Na 22.99, Mg 24.31, Cl 35.45\nSpecific heat capacity of water: 4.18 J g⁻¹ K⁻¹")],
  paperOneQuestions: [
    choiceQuestion("q1", "Paper 1A · Question 1", "What is the amount of substance in 4.00 g of sodium hydroxide, NaOH?", ["0.0500 mol", "0.100 mol", "0.200 mol", "1.00 mol"], 1, ["chem-reference"]),
    choiceQuestion("q2", "Paper 1A · Question 2", "Which species has a trigonal planar electron-domain geometry?", ["CH₄", "NH₃", "BF₃", "H₂O"], 1),
    choiceQuestion("q3", "Paper 1A · Question 3", "Which change always increases the rate constant for an elementary reaction?", ["Higher concentration", "Higher temperature", "Larger volume", "Lower pressure"], 1),
    choiceQuestion("q4", "Paper 1A · Question 4", "Which statement describes oxidation?", ["Gain of electrons", "Decrease in oxidation state", "Loss of electrons", "Gain of neutrons"], 1),
    inkQuestion("q5", "Paper 1B · Question 5", "Magnesium reacts with excess hydrochloric acid. Calculate the maximum volume of hydrogen at 100 kPa and 298 K produced from 0.486 g Mg. Use R = 8.31 J mol⁻¹ K⁻¹.", 5, ["chem-reference"], 2),
    shortQuestion("q6", "Paper 1B · Question 6", "Explain, using collision theory, why powdered magnesium reacts faster than a ribbon of the same mass under identical conditions.", 3),
  ],
  paperTwoResources: [textResource("kinetics-data", "Original kinetics data", "For reaction X + Y → products at constant temperature:\nExperiment 1: [X] 0.10, [Y] 0.10, rate 2.0 × 10⁻⁴\nExperiment 2: [X] 0.20, [Y] 0.10, rate 8.0 × 10⁻⁴\nExperiment 3: [X] 0.20, [Y] 0.30, rate 2.4 × 10⁻³\nConcentrations are mol dm⁻³; rates are mol dm⁻³ s⁻¹.")],
  paperTwoQuestions: [
    inkQuestion("q1", "Question 1 — rate expression", "Determine the order with respect to X and Y, write the rate expression, and calculate the rate constant with units.", 8, ["kinetics-data"], 2),
    shortQuestion("q2", "Question 2 — equilibrium", "For an exothermic reversible reaction at equilibrium, explain the separate effects of increasing temperature and adding a catalyst on the equilibrium yield and the time to reach equilibrium.", 6),
    inkQuestion("q3", "Question 3 — organic chemistry", "Propose a two-step synthetic route from ethene to ethanoic acid. Give reagents, conditions and displayed or structural formulas for the organic intermediates.", 7, [], 2, "blank"),
    essayQuestion("q4", "Question 4 — spectroscopy", "A compound has molecular formula C₃H₆O₂. Explain how infrared and proton NMR evidence could distinguish methyl ethanoate from propanoic acid.", 9),
  ],
});

const physics = scienceSamples({
  subject: "physics",
  label: "Physics",
  materialsInstructions: "An approved calculator is required. Use the original reference data supplied within this sample; no external data booklet is needed.",
  paperOneResources: [textResource("physics-reference", "Reference data for this sample", "g = 9.81 m s⁻²\nSpeed of light c = 3.00 × 10⁸ m s⁻¹\nElementary charge e = 1.60 × 10⁻¹⁹ C")],
  paperOneQuestions: [
    choiceQuestion("q1", "Paper 1A · Question 1", "A car travels 60 m east and then 20 m west. What is its displacement?", ["80 m east", "40 m east", "40 m west", "80 m west"], 1),
    choiceQuestion("q2", "Paper 1A · Question 2", "Two identical resistors are connected in parallel. Their combined resistance is", ["twice one resistor", "equal to one resistor", "half one resistor", "zero"], 1),
    choiceQuestion("q3", "Paper 1A · Question 3", "Which property remains constant when a wave crosses a boundary into a new medium?", ["Speed", "Wavelength", "Frequency", "Amplitude"], 1),
    choiceQuestion("q4", "Paper 1A · Question 4", "Which quantity is measured in joules per coulomb?", ["Current", "Potential difference", "Resistance", "Power"], 1),
    inkQuestion("q5", "Paper 1B · Question 5", "A 0.40 kg ball is projected vertically upward at 12.0 m s⁻¹. Neglect air resistance. Calculate its maximum height above the launch point and the time taken to return.", 5, ["physics-reference"], 2),
    inkQuestion("q6", "Paper 1B · Question 6", "A 6.0 Ω resistor and a 3.0 Ω resistor are connected in parallel to a 12 V supply. Draw the circuit and calculate the total current.", 4, [], 1, "blank"),
  ],
  paperTwoResources: [textResource("induction-data", "Original induction investigation", "A coil of 250 turns and area 3.2 × 10⁻³ m² is perpendicular to a uniform magnetic field. The field falls linearly from 0.80 T to 0.20 T in 0.15 s. The coil resistance is 4.0 Ω.")],
  paperTwoQuestions: [
    inkQuestion("q1", "Question 1 — electromagnetic induction", "Calculate the magnitude of the average induced emf and current. State the direction principle used to determine the induced current.", 7, ["induction-data"], 2),
    inkQuestion("q2", "Question 2 — fields", "A satellite moves in a circular orbit of radius 7.2 × 10⁶ m around a planet of mass 6.0 × 10²⁴ kg. Calculate its orbital speed and period. Use G = 6.67 × 10⁻¹¹ N m² kg⁻².", 8, [], 2),
    shortQuestion("q3", "Question 3 — quantum physics", "Explain why the photoelectric effect supports a particulate model of electromagnetic radiation. Refer to threshold frequency and intensity.", 6),
    essayQuestion("q4", "Question 4 — thermal physics", "A student claims that temperature measures the total energy stored in an object. Evaluate the claim using microscopic models and two contrasting examples.", 9),
  ],
});

export const STEM_SAMPLE_PAPERS = [
  ...mathematicsAA,
  ...mathematicsAI,
  ...biology,
  ...chemistry,
  ...physics,
];
