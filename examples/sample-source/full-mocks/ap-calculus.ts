import { choiceQuestion, inkQuestion, samplePaper, textResource } from "../helpers.ts";
import { CALCULUS_CHOICES, CALCULUS_MCQ_RESOURCES } from "./ap-calculus-mcq.ts";
import type { FullMock } from "./types.ts";

const freeResponses = [
  {
    id: "calc-frq-1", sectionId: "section-2a", topic: "Units 4, 5, 6 and 8 · rates, accumulation and extrema",
    resource: textResource("calc-frq-reservoir", "FRQ 1 · reservoir model", `Original model. A reservoir contains 80 cubic meters of water at time t=0 hours. Water enters at rate R(t)=12+4 sin(t/3) cubic meters per hour and leaves at rate D(t)=8+0.4t cubic meters per hour, for 0≤t≤12. No other water enters or leaves. The reservoir has sufficient capacity. Use radians and report decimal answers to three places unless an exact expression is given.`),
    prompt: `(a) Find R′(6). Interpret its sign and units in the context of the inflow rate. [2]
(b) Find the total volume of water that enters during 0≤t≤12. Show the integral setup. [2]
(c) Find the amount of water in the reservoir at t=12. Show how you use both rates and the initial amount. [2]
(d) At what time in [0, 12] is the amount of water greatest? Find that greatest amount and justify that it is an absolute maximum. [3]`,
    answer: `(a) [1] R′(6)=(4/3)cos 2≈−0.555. [1] At t=6, the inflow rate is decreasing by approximately 0.555 cubic meters per hour per hour (m³/h²).
(b) [1] ∫₀¹²[12+4 sin(t/3)] dt. [1] 163.844 m³ (exact 144+12(1−cos 4)).
(c) [1] 80+∫₀¹²[R(t)−D(t)] dt. [1] 119.044 m³ (outflow 124.8 m³).
(d) [1] Solve R(t)−D(t)=0 to obtain t≈9.558. [1] The net rate is positive before this root and negative afterwards on [0, 12], or correctly compare endpoints and all critical values. [1] The greatest amount is 80+∫₀^9.55755485(R−D)dt≈123.949 m³. Endpoints 80 and 119.044 are smaller. Give time to three decimal places and retain unrounded root in the integral.`,
  },
  {
    id: "calc-frq-2", sectionId: "section-2a", topic: "Unit 8 · area and volume with numerical intersection",
    resource: textResource("calc-frq-region", "FRQ 2 · region between two curves", `Let f(x)=1+e^(−x/2) and g(x)=0.4x+0.2 for x≥0. Their unique positive intersection has x-coordinate a. Region R is bounded by x=0 and the two curves from x=0 to x=a. On that interval, f is the upper boundary and g is the lower boundary. This description fully specifies the region; no scale drawing is needed. Use a graphing calculator where appropriate.`),
    prompt: `(a) Write the equation used to find a and determine a to three decimal places. [2]
(b) Find the area of R. Show an integral and its value. [2]
(c) Find the volume when R is revolved about the horizontal line y=−1. Identify the outer and inner radii in your setup. [3]
(d) Region R is also the base of a different solid. Cross sections perpendicular to the x-axis are squares with one side in R. Write, but do not evaluate, an integral for that solid's volume. [2]`,
    answer: `(a) [1] 1+e^(−a/2)=0.4a+0.2. [1] a≈2.661 (unrounded 2.6608967554).
(b) [1] ∫₀ᵃ[f(x)−g(x)] dx. [1] 2.184 square units (unrounded 2.1839256914).
(c) [1] Outer radius f(x)+1, inner radius g(x)+1. [1] π∫₀ᵃ{[f(x)+1]²−[g(x)+1]²}dx. [1] 28.977 cubic units (unrounded 28.9772805389). Squaring the difference of radii is not a washer-area formula.
(d) [1] Cross-sectional area [f(x)−g(x)]². [1] ∫₀ᵃ[f(x)−g(x)]²dx with the same intersection limit. No π appears.`,
  },
  {
    id: "calc-frq-3", sectionId: "section-2b", topic: "Units 5 and 6 · derivative representation and accumulation",
    resource: textResource("calc-frq-derivative", "FRQ 3 · graph of a derivative, specified by vertices", `The continuous graph of f′ on [−2, 5] consists of straight line segments joining these successive points:
(−2, 0) → (0, 2) → (2, 0) → (3, −2) → (5, 0).
The horizontal coordinate is x and the vertical coordinate is f′(x). The listed vertices are exact. The function f is differentiable and f(0)=1. You may sketch the supplied derivative graph to assist your work. It is f′, not f, that is piecewise linear.`),
    prompt: `(a) Find f(3), using signed areas or an integral. Show the work. [2]
(b) State every open interval on which f is increasing. Identify the x-coordinate of every local maximum of f in (−2, 5), and justify using f′. [3]
(c) State every open interval on which the graph of f is concave up, and justify your answer from the supplied derivative graph. [2]
(d) Let G(x)=∫ from 0 to x of f(t)dt. Find G″(3) and determine whether G is concave up or concave down near x=3. Justify your conclusion. [2]`,
    answer: `(a) [1] f(3)=1+∫₀³f′(x)dx=1+2−1. [1] f(3)=2.
(b) [1] Increasing on (−2, 2), since f′>0 there. [1] Local maximum at x=2. [1] f′ changes from positive to negative at 2; no other interior positive-to-negative crossing occurs.
(c) [1] Concave up on (−2, 0) and (3, 5). [1] f′ is increasing on each interval (and decreasing on (0, 3)).
(d) [1] G′=f and G″=f′, so G″(3)=−2. [1] G is concave down near 3 because f′ is negative in a neighborhood of 3; do not confuse the corner in f′ with nonexistence of G″.`,
  },
  {
    id: "calc-frq-4", sectionId: "section-2b", topic: "Units 3, 4 and 7 · differential equation and solution behavior",
    resource: textResource("calc-frq-equation", "FRQ 4 · differential equation", `A differentiable function y=f(x) satisfies dy/dx=x(2−y) and f(0)=1. Consider the particular solution containing (0, 1).`),
    prompt: `(a) Write the equation of the tangent line to the solution curve at (0, 1). [1]
(b) Find d²y/dx² at (0, 1). Use it to determine whether the tangent-line approximation underestimates or overestimates f(x) for positive x sufficiently close to 0. [2]
(c) Solve the differential equation for this particular solution. Show separation, integration and the use of the initial condition. [4]
(d) Determine lim as x→∞ of f(x), and justify the result using your solution. [2]`,
    answer: `(a) [1] Slope 0(2−1)=0; tangent line y=1.
(b) [1] y″=(2−y)−xy′, giving y″(0)=1. [1] Positive second derivative near 0 makes the curve concave up, so the tangent line underestimates locally.
(c) [1] dy/(2−y)=x dx. [1] −ln|2−y|=x²/2+C. [1] At (0, 1), C=0 (or equivalent exponential constant 1). [1] y=2−e^(−x²/2); choose the branch containing (0, 1). The equilibrium solution y=2 does not satisfy the given initial condition.
(d) [1] Limit 2. [1] Since e^(−x²/2)→0 as x→∞, the particular solution approaches 2 from below.`,
  },
  {
    id: "calc-frq-5", sectionId: "section-2b", topic: "Units 5 and 8 · geometric optimization and integration",
    resource: textResource("calc-frq-parabola", "FRQ 5 · inscribed rectangle and region", `The region under y=12−3x² and above the x-axis extends from x=−2 to x=2. A rectangle is inscribed in this region with its lower side on the x-axis and its upper corners on the parabola at x=−a and x=a, where 0<a<2. All lengths are in centimeters.`),
    prompt: `(a) Express the rectangle's area A as a function of a. [1]
(b) Find the value of a that gives the greatest area, find that area, and justify the maximum. Give exact values. [3]
(c) The entire region under the parabola and above the x-axis is revolved about the x-axis. Find its volume, showing the definite integral and an exact result. [3]
(d) Find the area of that entire region, showing your integral calculation. [2]`,
    answer: `(a) [1] A(a)=2a(12−3a²)=24a−6a³.
(b) [1] A′=24−18a²=0 gives a=2/√3. [1] Maximum area 32/√3 cm². [1] A′ changes from positive to negative there, or A″=−36a<0 on (0, 2) with the limiting endpoint areas 0.
(c) [1] V=π∫₋₂²(12−3x²)²dx. [1] Antiderivative 144x−24x³+(9/5)x⁵ with evaluation at ±2. [1] 1536π/5 cm³.
(d) [1] ∫₋₂²(12−3x²)dx=[12x−x³]₋₂². [1] 32 cm². Distinguish this region's area from the optimized rectangle's area.`,
  },
  {
    id: "calc-frq-6", sectionId: "section-2b", topic: "Units 4 and 6 · motion, numerical approximation and justification",
    resource: textResource("calc-frq-motion", "FRQ 6 · tabulated velocity", `A particle moves on a straight track. Its velocity v is continuously differentiable for 0≤t≤5 seconds. Selected exact values are shown below. The particle starts at position s(0)=4 meters. The table does not imply constant acceleration between measurements.
t / seconds | 0 | 1 | 3 | 5
v(t) / meters per second | 2 | −1 | 3 | 5
Acceleration is denoted a(t)=v′(t).`),
    prompt: `(a) Approximate a(2) using the average rate of change of velocity on [1, 3]. Show your calculation and units. [2]
(b) Use a trapezoidal sum on the three subintervals in the table to approximate the particle's position at t=5. [2]
(c) Must there be a c in (3, 5) for which a(c)=1 m/s²? Justify by naming an appropriate theorem and checking its conditions. [2]
(d) Evaluate ∫ from 0 to 5 of a(t)dt and explain the physical meaning of its value, including units. Explain why this integral is not the total distance traveled. [3]`,
    answer: `(a) [1] a(2)≈[v(3)−v(1)]/(3−1)=[3−(−1)]/2=2. [1] m/s².
(b) [1] Approximate displacement 1(2−1)/2+2(−1+3)/2+2(3+5)/2=0.5+2+8=10.5 m. [1] Position≈4+10.5=14.5 m; omitting the initial position does not earn the final point.
(c) [1] Yes, because v is continuous on [3, 5] and differentiable on (3, 5), so the Mean Value Theorem applies. [1] There is c with v′(c)=[v(5)−v(3)]/2=(5−3)/2=1 m/s².
(d) [1] ∫₀⁵a(t)dt=v(5)−v(0)=5−2=3. [1] The velocity increases by 3 m/s overall. [1] Total distance is ∫₀⁵|v(t)|dt in meters; integrating acceleration gives velocity change, not distance.`,
  },
];

export const AP_CALCULUS_FULL_MOCK: FullMock = {
  manifest: samplePaper({
    subject: "ap-calculus-ab", subjectLabel: "AP Calculus AB", level: "AP",
    paper: "End-of-course exam — original full-length mock (May 2027)",
    examFormat: {
      systemId: "ap", systemLabel: "Advanced Placement (AP)", qualificationLabel: "Advanced Placement",
      deliveryMode: "Hybrid-exam digital-ink practice", fidelity: "adapted", profileVersion: "2026-09-05",
      rulesSummary: "May 2027 · 29+13 MCQ · 2+4 FRQ · 62/38/30/60 working minutes · 10-minute break · part-specific graphing calculator rule",
    },
    durationMinutes: 200, readingTimeMinutes: 0, maximumMarks: 96, mode: "reading", selectionMode: "all",
    instructions: "Original full-length May 2027-format practice, not an official or endorsed AP exam. Section I-A: 29 MCQ in 62 minutes, no calculator. I-B: 13 MCQ in 38 minutes, graphing calculator required. After a 10-minute monitored break, Section II-A: two 9-point FRQ in 30 minutes, graphing calculator required. II-B: four 9-point FRQ in 60 minutes, no calculator. Answer all questions and choose one best answer per MCQ. Use radians unless a question specifies otherwise. Give exact answers or decimal answers accurate to three places; retain unrounded intermediate values. Show mathematical setup and reasoning in the integrated canvas for every FRQ, adding pages as needed. Supply an approved graphing calculator for the permitted parts; real Bluebook also offers Desmos graphing. There is no separate reading period or formula sheet. Real AP free responses are handwritten in booklets. DigitalDP automatically starts the next part and ends the fixed break; expired parts remain locked, including II-A during II-B. This mock does not reproduce accommodated-paper permission to revisit II-A without a calculator, and omits Bluebook's two one-minute between-part transitions. Raw marks are not AP scaled scores.",
    phases: [
      { id: "section-1a", sectionId: "section-1a", label: "Section I, Part A — 29 multiple-choice questions", kind: "work", durationMinutes: 62, tools: ["Calculator not permitted", "Digital multiple choice"], instructions: "Questions 1–29. Complete this part before time expires; you cannot return to it later." },
      { id: "section-1b", sectionId: "section-1b", label: "Section I, Part B — 13 multiple-choice questions", kind: "work", durationMinutes: 38, tools: ["Approved graphing calculator required", "Digital multiple choice"], instructions: "Questions 30–42. Use radian mode. Part A remains locked." },
      { id: "break", label: "Monitored break", kind: "break", durationMinutes: 10, tools: [], instructions: "Content and responses are locked. Section II starts automatically when this fixed break ends." },
      { id: "section-2a", sectionId: "section-2a", label: "Section II, Part A — 2 free-response questions", kind: "work", durationMinutes: 30, tools: ["Approved graphing calculator required", "Digital working canvas"], instructions: "Questions 1–2. Show mathematical setup and reasoning, not just calculator output." },
      { id: "section-2b", sectionId: "section-2b", label: "Section II, Part B — 4 free-response questions", kind: "work", durationMinutes: 60, tools: ["Calculator not permitted", "Digital working canvas"], instructions: "Questions 3–6. Earlier parts remain locked. Show exact work and justify conclusions." },
    ],
    resources: [...CALCULUS_MCQ_RESOURCES, ...freeResponses.map(item => item.resource)],
    questions: [
      ...CALCULUS_CHOICES.map((item, index) => ({ ...choiceQuestion(`calc-mcq-${index + 1}`, `Section I, Part ${index < 29 ? "A" : "B"} — Question ${index + 1}`, item.prompt, item.options, 1, item.resource ? [item.resource] : []), sectionId: index < 29 ? "section-1a" : "section-1b" })),
      ...freeResponses.map((item, index) => ({ ...inkQuestion(item.id, `Section II, Part ${index < 2 ? "A" : "B"} — Question ${index + 1}`, item.prompt, 9, [item.resource.key], 3), sectionId: item.sectionId })),
    ],
  }),
  marking: [
    ...CALCULUS_CHOICES.map((item, index) => ({ questionId: `calc-mcq-${index + 1}`, marks: 1, topic: item.topic, answer: item.answer, correctOption: item.correctOption })),
    ...freeResponses.map(item => ({ questionId: item.id, marks: 9, topic: item.topic, answer: item.answer })),
  ],
  teacherNotes: [
    "Full-length May 2027 workload: 42 four-option MCQ (29/13) and 6 multipart 9-point FRQ (2/4). Total 96 raw points. The current CED assigns 35% to MCQ-A and 15% to MCQ-B, together 50%; FRQ contributes 50%. A practice composite is 35×(MCQ-A/29)+15×(MCQ-B/13)+50×(FRQ/54). Do not use raw 96-point percentage or equal weighting of all 42 MCQ as the exact published section weighting; do not invent AP 1–5 cut scores.",
    "MCQ primary-unit blueprint: U1=5, U2=5, U3=4, U4=5, U5=7, U6=7, U7=3, U8=6. All eight allocations fall inside current AB CED percentage bands. Questions use algebraic, exponential, logarithmic, trigonometric and general functions; analytic, tabular, verbal and graph-coordinate representations. No BC-only sequences/series, parametric/polar calculus, Euler method, integration by parts or logistic-equation topic is required.",
    "FRQ includes water flow, geometric region, derivative graph, separable differential equation, optimization and tabulated motion. All require multipart reasoning; the two real-world contexts are reservoir rates and particle motion. Whole-point allocations are provided for every part; credit equivalent mathematically valid methods and justified follow-through where the original demand remains.",
    "Graphical adaptation: the derivative graph is specified by exact connected vertices, and bounded regions by complete equations and boundaries. Students can sketch these on the integrated grid. The reference is self-contained and never refers to an absent figure. This is not a reproduction of the layout or every visual feature of Bluebook.",
    "Real hybrid exams use handwritten response booklets; this practice uses ink with a typed alternative. A supplied approved graphing calculator is needed for I-B and II-A because DigitalDP does not provide Bluebook's Desmos. The fixed automatically ending break and locked completed parts are disclosed practice behaviors.",
    "Navigation and transition limits: this mock locks II-A when II-B begins. The 2025–26 accommodated-paper script explicitly permits revisiting II-A without a calculator during II-B, but warns that it is not for digital administration. The 2026 hybrid FRQ directions describe navigation within the current part, not that paper-only permission. Do not present the paper rule as verified Bluebook behavior; confirm the May 2027 delivery-specific directions when available. This 200-minute practice schedule also omits the two one-minute A-to-B transitions documented for digital Calculus in the 2025–26 coordinator manual; they are not extra working time.",
    "Numerical roots, integrals and derivatives were checked independently with numerical computation; analytic solutions were worked through separately. Questions remain original, not externally moderated or psychometrically calibrated. A qualified Calculus teacher should review demand and marking before consequential grading. Keep this marking companion separate from candidate papers.",
  ],
  sources: [
    { title: "AP Calculus AB and BC current CED: assessment weights, sample four-choice items, AB units", url: "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf" },
    { title: "Fall 2026 CED changes: May 2027 MCQ counts and times", url: "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications-effective-fall-2026.pdf" },
    { title: "2026 released AP Calculus AB FRQ: structure and directions only", url: "https://apcentral.collegeboard.org/media/pdf/ap26-frq-calculus-ab.pdf" },
    { title: "2025–26 accommodated-paper Calculus script: paper-only revisit permission", url: "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-paper-exam-instructions.pdf" },
    { title: "2025–26 AP coordinator manual: digital between-part transitions", url: "https://apcentral.collegeboard.org/media/pdf/ap-coordinators-manual-part-2.pdf" },
    { title: "AP calculator policy", url: "https://apcentral.collegeboard.org/exam-administration-ordering-scores/administering-exams/exam-policies/calculator-policy" },
  ],
};
