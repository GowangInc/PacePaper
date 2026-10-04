import { describe, expect, test } from "bun:test";
import { compileExpression, phaseAllowsCalculator } from "./calculator.js";

describe("exam calculator", () => {
  test("evaluates scientific expressions without dynamic code execution", () => {
    expect(compileExpression("2 + 3 × 4")()).toBe(14);
    expect(compileExpression("-2^2")()).toBe(-4);
    expect(compileExpression("2^-2")()).toBe(0.25);
    expect(compileExpression("2π + 3(4)")()).toBeCloseTo(2 * Math.PI + 12);
    expect(compileExpression("sin(90)", "degree")()).toBe(1);
    expect(compileExpression("asin(1)", "degree")()).toBe(90);
    expect(compileExpression("min(5, -2, 8)")()).toBe(-2);
    expect(compileExpression("x^2 - 1")({ x: 3 })).toBe(8);
  });

  test("rejects unsupported input and undefined results", () => {
    expect(() => compileExpression("globalThis.alert(1)")()).toThrow();
    expect(() => compileExpression("constructor(1)")()).toThrow("Unknown function");
    expect(() => compileExpression("1 / 0")()).toThrow("undefined or outside");
    expect(() => compileExpression("x + 1")()).toThrow("Unknown value");
    expect(() => compileExpression("sin()")()).toThrow("wrong number");
    expect(() => compileExpression(`${"(".repeat(33)}1${")".repeat(33)}`)()).toThrow("nesting is too deep");
    expect(() => compileExpression("1+".repeat(500) + "1")()).toThrow("limited to 1000 characters");
  });

  test("only permits the tool during calculator-compatible work phases", () => {
    expect(phaseAllowsCalculator({ kind: "work", responseAllowed: true, tools: [] })).toBeTrue();
    expect(phaseAllowsCalculator({ kind: "work", responseAllowed: true, tools: ["Calculator not permitted"] })).toBeFalse();
    expect(phaseAllowsCalculator({ kind: "work", responseAllowed: true, tools: ["Work without a calculator"] })).toBeFalse();
    expect(phaseAllowsCalculator({ kind: "work", responseAllowed: true, tools: ["Calculators are not permitted"] })).toBeFalse();
    expect(phaseAllowsCalculator({ kind: "work", responseAllowed: true, tools: ["Calculator use is prohibited"] })).toBeFalse();
    expect(phaseAllowsCalculator({ kind: "break", responseAllowed: false, tools: [] })).toBeFalse();
  });
});
