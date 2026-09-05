import { textResource } from "../helpers.ts";

export interface CalculusChoice {
  topic: string;
  prompt: string;
  options: [string, string, string, string];
  correctOption: number;
  answer: string;
  resource?: string;
}

export const CALCULUS_MCQ_RESOURCES = [
  textResource("calc-function-table", "Differentiable functions · supplied values", `The functions f and g are differentiable near x=1 and x=2. The following are exact values, not points to be joined by line segments.
x | f(x) | f′(x) | g(x) | g′(x)
1 | 2 | 3 | 4 | −1
2 | 3 | 5 | 1 | 2
For the inverse-function question only, assume f is one-to-one and its inverse is differentiable near 3.`),
  textResource("calc-trapezoids", "Question 23 · numerical integration data", `Selected values of a continuous function h:
x | 0 | 1 | 3
h(x) | 2 | 4 | 8
Use the two subintervals determined by the three listed x-values. Do not assume h is linear between measurements.`),
  textResource("calc-rate-table", "Question 38 · flow-rate data", `A differentiable inflow rate r(t), in liters per minute, is sampled at these times:
t / minutes | 0 | 2 | 5 | 9
r(t) / liters per minute | 1.2 | 2.5 | 3.1 | 2.0
Use the three subintervals determined by the four measurements.`),
];

export const CALCULUS_CHOICES: CalculusChoice[] = [
  { topic: "Unit 1 · limits", prompt: "What is lim as x→4 of [√(x+5)−3]/(x−4)?", options: ["0","1/3","1/6","The limit does not exist."], correctOption: 2, answer: "C. Rationalize to 1/[√(x+5)+3] for x≠4, then substitute 4 to obtain 1/6." },
  { topic: "Unit 1 · continuity", prompt: "Let f(x)=x²−1 for x<2 and f(x)=kx+1 for x≥2. For what value of k is f continuous at x=2?", options: ["1","−1","2","0"], correctOption: 0, answer: "A. The left-hand limit is 3; continuity requires 2k+1=3, so k=1." },
  { topic: "Unit 1 · trigonometric limit", prompt: "Angles are in radians. What is lim as x→0 of sin(5x)/(2x)?", options: ["2/5","5","0","5/2"], correctOption: 3, answer: "D. Write (5/2)[sin(5x)/(5x)]; the bracket tends to 1." },
  { topic: "Unit 1 · Intermediate Value Theorem", prompt: "The function f is continuous on [1, 4], with f(1)=−2 and f(4)=6. Which statement must be true?", options: ["f has exactly one zero in (1, 4).","f′(c)=8/3 for every c in (1, 4).","There is a c in (1, 4) for which f(c)=0.","f is differentiable at every point in (1, 4)."], correctOption: 2, answer: "C. By the Intermediate Value Theorem, 0 between −2 and 6 is attained. Continuity alone gives neither differentiability nor a unique zero." },
  { topic: "Unit 2 · product rule", prompt: "If f(x)=x²eˣ, what is f′(1)?", options: ["e","2e","3e","e²"], correctOption: 2, answer: "C. f′(x)=2xeˣ+x²eˣ, so f′(1)=3e." },
  { topic: "Unit 2 · derivative from tables", resource: "calc-function-table", prompt: "Let h(x)=f(x)g(x). Using the supplied table, find h′(2).", options: ["5","11","8","6"], correctOption: 1, answer: "B. h′(2)=f′(2)g(2)+f(2)g′(2)=5· 1+3· 2=11." },
  { topic: "Unit 2 · derivative definition", prompt: "The expression lim as h→0 of [ln(2+h)−ln 2]/h has which value?", options: ["ln2","1/2","2","0"], correctOption: 1, answer: "B. This is the derivative of ln x at x=2, equal to 1/2." },
  { topic: "Unit 2 · quotient rule", resource: "calc-function-table", prompt: "Let j(x)=f(x)/g(x). Using the supplied table, find j′(1).", options: ["1/4","7/8","−7/8","5/4"], correctOption: 1, answer: "B. j′(1)=[3· 4−2(−1)]/4²=14/16=7/8." },
  { topic: "Unit 3 · chain rule", prompt: "If f(x)=ln(3x²+1), which expression equals f′(x)?", options: ["6xln(3x²+1)","3/(x²+1)","1/(3x²+1)","6x/(3x²+1)"], correctOption: 3, answer: "D. Apply the chain rule: d(ln u)/dx=u′/u with u=3x²+1." },
  { topic: "Unit 3 · implicit differentiation", prompt: "For the curve x²+xy+y²=7, what is dy/dx at (1, 2)?", options: ["−5/4","4/5","−4/5","−1/2"], correctOption: 2, answer: "C. 2x+y+(x+2y)y′=0, so y′=−(2x+y)/(x+2y)=−4/5." },
  { topic: "Unit 3 · inverse derivative", resource: "calc-function-table", prompt: "Let k be the inverse of f. Using the supplied table and inverse-function assumptions, find k′(3).", options: ["1/5","1/3","5","3"], correctOption: 0, answer: "A. f(2)=3, so k′(3)=1/f′(2)=1/5." },
  { topic: "Unit 4 · related rates", prompt: "A sphere's radius is increasing at 3 cm/s. At the instant its radius is 2 cm, at what rate is its volume increasing? Use V=(4/3)πr³.", options: ["36π cm³/s","48π cm³/s","12π cm³/s","24π cm³/s"], correctOption: 1, answer: "B. dV/dt=4πr²dr/dt=4π· 4· 3=48π cm³/s." },
  { topic: "Unit 4 · linear approximation", prompt: "Use the tangent line to y=√x at x=4 to approximate √4.12.", options: ["2.06","2.24","2.12","2.03"], correctOption: 3, answer: "D. L(x)=2+(x−4)/4, so L(4.12)=2.03." },
  { topic: "Unit 4 · motion", prompt: "A particle's position is s(t)=t³−6t²+9t for 0≤t≤4. On which open intervals is the particle's speed increasing?", options: ["(1, 2) and (3, 4)","(2, 4) only","(0, 1) and (2, 3)","(1, 3) only"], correctOption: 0, answer: "A. v=3(t−1)(t−3), a=6(t−2). Speed increases where v and a have the same sign: both negative on (1, 2), both positive on (3, 4)." },
  { topic: "Unit 5 · first derivative test", prompt: "A differentiable function has f′(x)=(x−1)²(x+2) for all real x. At which x-value does f have a local minimum?", options: ["−2 only","1 only","Neither −2 nor 1","−2 and 1"], correctOption: 0, answer: "A. f′ changes from negative to positive at −2. At 1 the even-power factor makes f′ zero without a sign change." },
  { topic: "Unit 5 · concavity", prompt: "A twice-differentiable function has f″(x)=x(x−3). On which interval is its graph concave down?", options: ["(−∞, 0)","(3, ∞)","(0, 3)","(−∞, 0) and (3, ∞)"], correctOption: 2, answer: "C. The product x(x−3) is negative exactly between 0 and 3." },
  { topic: "Unit 5 · absolute extrema", prompt: "What is the absolute maximum value of f(x)=x³−3x on [−2, 2]?", options: ["3","2","6","−2"], correctOption: 1, answer: "B. Critical numbers are ±1. Values at −2, −1, 1, 2 are −2, 2, −2, 2, giving maximum 2." },
  { topic: "Unit 5 · Mean Value Theorem", prompt: "For f(x)=ln x on [1, e], which c satisfies the conclusion of the Mean Value Theorem?", options: ["e−1","1","e","e/2"], correctOption: 0, answer: "A. The secant slope is 1/(e−1). Since f′(c)=1/c, equality gives c=e−1, which lies in (1, e)." },
  { topic: "Unit 5 · optimization", prompt: "A rectangle has perimeter 24 cm. What is its greatest possible area?", options: ["36 cm²","24 cm²","48 cm²","144 cm²"], correctOption: 0, answer: "A. With sides x and 12−x, area 12x−x² has maximum at x=6 and value 36; endpoints give 0." },
  { topic: "Unit 6 · definite integration", prompt: "Evaluate ∫ from 0 to 2 of (3x²−2x)dx.", options: ["4","2","8","6"], correctOption: 0, answer: "A. An antiderivative is x³−x²; evaluating at 2 and 0 gives 8−4=4." },
  { topic: "Unit 6 · Fundamental Theorem and chain rule", prompt: "Let F(x)=∫ from 1 to x² of √(1+t²)dt. Which expression equals F′(x)?", options: ["2x√(1+x⁴)","√(1+x⁴)","2x√(1+x²)","√(1+x²)"], correctOption: 0, answer: "A. Evaluate the integrand at x² and multiply by the derivative of the upper limit 2x." },
  { topic: "Unit 6 · substitution", prompt: "Which is an antiderivative of 2x/(x²+4)?", options: ["2ln(x²+4)","arctan(x/2)","ln(x²+4)","1/(x²+4)"], correctOption: 2, answer: "C. Substitute u=x²+4, du=2xdx; ∫du/u=ln u+C, with u>0." },
  { topic: "Unit 6 · trapezoidal approximation", resource: "calc-trapezoids", prompt: "Using the two stated subintervals, what is the trapezoidal approximation to ∫ from 0 to 3 of h(x)dx?", options: ["15","21","14","12"], correctOption: 0, answer: "A. 1(2+4)/2+2(4+8)/2=3+12=15. Unequal widths must be retained." },
  { topic: "Unit 6 · Riemann sums", prompt: "Which definite integral is represented by lim as n→∞ of Σ from k=1 to n of (3/n)(1+3k/n)²?", options: ["∫ from 1 to 4 of x²dx","∫ from 1 to 3 of x²dx","∫ from 0 to 3 of x²dx","∫ from 0 to 4 of 3x²dx"], correctOption: 0, answer: "A. Δx=3/n, right endpoints 1+3k/n, interval [1, 4], integrand x²." },
  { topic: "Unit 7 · separation of variables", prompt: "Which function satisfies dy/dx=2xy and y(0)=3?", options: ["y=3e²ˣ","y=eˣ²+2","y=3eˣ²","y=3+x²"], correctOption: 2, answer: "C. Separate: ln|y|=x²+C; the initial condition gives y=3e^(x²)." },
  { topic: "Unit 7 · slope field reasoning", prompt: "A slope field represents dy/dx=x−y. Along which line do all the short segments have slope −1?", options: ["y=−x+1","y=−1","y=x+1","y=x−1"], correctOption: 2, answer: "C. Substituting y=x+1 gives x−(x+1)=−1 everywhere on the line." },
  { topic: "Unit 8 · average value", prompt: "What is the average value of f(x)=x² on [0, 2]?", options: ["2","4/3","4","8/3"], correctOption: 1, answer: "B. Average=(1/2)∫₀²x²dx=(1/2)(8/3)=4/3." },
  { topic: "Unit 8 · area between curves", prompt: "What is the area enclosed by y=x and y=x²?", options: ["1/6","1/2","2/3","1/3"], correctOption: 0, answer: "A. Intersections 0, 1; upper x, lower x²; ∫₀¹(x−x²)dx=1/2−1/3=1/6." },
  { topic: "Unit 8 · cross-section volume", prompt: "A solid's base is the region between y=x and y=x². Cross sections perpendicular to the x-axis are squares whose sides lie in the base. Which integral gives the volume?", options: ["π∫ from 0 to 1 of (x²−x⁴)dx","∫ from 0 to 1 of (x²+x⁴)dx","∫ from 0 to 1 of (x−x²)²dx","∫ from 0 to 1 of (x−x²)dx"], correctOption: 2, answer: "C. The side length is x−x² on [0, 1], so cross-sectional area is its square, without π." },
  { topic: "Unit 1 · numerical limit", prompt: "A graphing calculator is permitted. The value of lim as h→0 of [e^(1.3+h)−e^1.3]/h is closest to", options: ["1.300","4.770","0.273","3.669"], correctOption: 3, answer: "D. The derivative-definition limit is e^1.3=3.6692966676. A numerical table from both sides also approaches this value." },
  { topic: "Unit 2 · derivative evaluation", prompt: "If f(x)=x sin(x²), then f′(1.2) is closest to which value? Use radian mode.", options: ["1.190","2.852","0.995","1.367"], correctOption: 3, answer: "D. f′(x)=sin(x²)+2x²cos(x²); at 1.2 this is 1.3670786294." },
  { topic: "Unit 3 · implicit derivative with numerical point", prompt: "The point (0.8, b), where b>0, lies on x²+xy+y²=7. The slope of the tangent there is closest to", options: ["−1.361","−0.735","0.735","−0.800"], correctOption: 1, answer: "B. Solve b²+0.8b+0.64=7: b=(−0.8+√26.08)/2. Then y′=−(1.6+b)/(0.8+2b)=−0.7349781350." },
  { topic: "Unit 4 · related rates with units", prompt: "Water enters an inverted conical tank at 5 m³/min. The cone's radius is always half its water depth h, and V=πr²h/3. When h=3 m, dh/dt in meters per minute is closest to", options: ["0.707","5.000","0.354","1.768"], correctOption: 0, answer: "A. V=πh³/12, so 5=(πh²/4)h′. At h=3, h′=20/(9π)=0.7073553026 m/min." },
  { topic: "Unit 4 · contextual rate", prompt: "A heated object's temperature is T(t)=20+65e^(−0.12t) degrees Celsius, t minutes after heating stops. Its instantaneous temperature-change rate at t=5, in °C/min, is closest to", options: ["55.673","−0.600","−4.281","−7.800"], correctOption: 2, answer: "C. T′(5)=−7.8e^(−0.6)=−4.2807307615°C/min; the negative sign indicates cooling." },
  { topic: "Unit 5 · calculator extrema", prompt: "What is the absolute maximum value of f(x)=x+2sin x on [0, 5]? Use radian mode.", options: ["3.826","5.000","3.082","2.094"], correctOption: 0, answer: "A. f′=1+2cos x vanishes at 2π/3 and 4π/3. Compare f(0)=0, f(2π/3)=3.826445910, f(4π/3)=2.456739398, f(5)=3.082151451; maximum 3.826." },
  { topic: "Unit 5 · inflection points", prompt: "A function f has derivative f′(x)=2+cos(x²). How many points of inflection does its graph have for 0<x<3?", options: ["One","Four","Two","Three"], correctOption: 2, answer: "C. f″=−2x sin(x²). Interior sign changes occur at √π≈1.772 and √(2π)≈2.507; √(3π)>3." },
  { topic: "Unit 6 · numerical definite integral", prompt: "The value of ∫ from 0 to 2 of e^(−x²)dx is closest to", options: ["0.432","0.882","1.135","1.765"], correctOption: 1, answer: "B. Numerical integration gives 0.8820813908. The integrand has no elementary antiderivative needed for this course." },
  { topic: "Unit 6 · tabular accumulation", resource: "calc-rate-table", prompt: "Use a trapezoidal sum over the stated subintervals to estimate the total inflow over the first 9 minutes.", options: ["14.8 L","24.8 L","22.3 L","18.5 L"], correctOption: 2, answer: "C. 2(1.2+2.5)/2+3(2.5+3.1)/2+4(3.1+2.0)/2=3.7+8.4+10.2=22.3 L." },
  { topic: "Unit 7 · exponential model", prompt: "A population follows dP/dt=0.35P, with P(0)=12. At what time does the model predict P=30?", options: ["7.143","0.916","1.980","2.618"], correctOption: 3, answer: "D. P=12e^(0.35t); t=ln(30/12)/0.35=2.6179735196." },
  { topic: "Unit 8 · area with numerical intersection", prompt: "Let a be the first positive solution of sin x=0.4x. The area enclosed by y=sin x and y=0.4x on 0≤x≤a is closest to", options: ["0.905","2.125","0.623","1.528"], correctOption: 2, answer: "C. a≈2.125345191. Since sin x≥0.4x between 0 and a, area=∫₀ᵃ(sin x−0.4x)dx≈0.6231413899." },
  { topic: "Unit 8 · volume of revolution", prompt: "The region bounded by y=ln x, y=0, x=1 and x=3 is revolved about the x-axis. Its volume is closest to", options: ["1.029","4.071","3.233","1.296"], correctOption: 2, answer: "C. Disk radii are ln x, so V=π∫₁³(ln x)²dx=3.2332428087. Squaring must precede integration." },
  { topic: "Unit 8 · total distance", prompt: "A particle moves on a line with velocity v(t)=sin(t²)m/s for 0≤t≤3. Its total distance traveled, in meters, is closest to", options: ["3.000","1.702","0.774","0.707"], correctOption: 1, answer: "B. Integrate |sin(t²)| over [0, 3], splitting at √π and √(2π): distance≈1.7024100 m. Integrating signed velocity alone gives displacement, not distance." },
];
