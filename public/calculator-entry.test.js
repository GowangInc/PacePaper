import { describe, expect, test } from "bun:test";
import { compileExpression } from "./calculator.js";
import { evaluateHandheldEntry, entryAfterResult, fractionResult } from "./calculator-entry.js";

describe("handheld calculation entries", () => {
  test("stores variables in TI arrow and assignment syntax and keeps Ans available", () => {
    const stored = evaluateHandheldEntry("3+2→a", compileExpression, "radian");
    expect(stored.variables).toEqual({ a: 5 });
    expect(evaluateHandheldEntry("a^2+ans", compileExpression, "radian", stored.variables, 2).value).toBe(27);
    expect(evaluateHandheldEntry("b:=a*2", compileExpression, "radian", stored.variables).variables).toEqual({ a: 5, b: 10 });
    expect(() => evaluateHandheldEntry("1→pi", compileExpression, "radian")).toThrow("reserved");
    expect(entryAfterResult(25, "+")).toBe("ans+");
    expect(entryAfterResult(25, "-")).toBe("ans-");
    expect(entryAfterResult(25, "2")).toBe("2");
  });
  test("supports postfix factorial, scientific notation and degree override", () => {
    expect(compileExpression("5!+2")()).toBe(122);
    expect(compileExpression("2^3!")()).toBe(64);
    expect(compileExpression("1.5E3")()).toBe(1500);
    expect(compileExpression("sin(90°)")()).toBe(1);
    expect(() => compileExpression("(-1)!")()).toThrow("Factorial");
    expect(() => compileExpression("171!")()).toThrow("Factorial");
  });
  test("accepts calculator probability command names with correct parameter counts", () => {
    expect(compileExpression("nCr(10,3)")()).toBe(120);
    expect(compileExpression("nPr(10,3)")()).toBe(720);
    expect(compileExpression("binomPdf(10,0.5,5)")()).toBeCloseTo(0.24609375, 8);
    expect(compileExpression("binomCdf(10,0.5,4,6)")()).toBeCloseTo(0.65625, 8);
    expect(compileExpression("normalCdf(-1,1)")()).toBeCloseTo(0.68268949, 6);
    expect(compileExpression("invNorm(0.975)")()).toBeCloseTo(1.95996398, 6);
    expect(() => compileExpression("nCr(2,3)")()).toThrow();
    expect(() => compileExpression("normalCdf(1)")()).toThrow("number of arguments");
  });
  test("displays integer division as a fraction and preserves decimal intent", () => {
    expect(fractionResult("1/3", 1/3)).toEqual({ numerator: 1, denominator: 3 });
    expect(fractionResult("1/2+1/3", 5/6)).toEqual({ numerator: 5, denominator: 6 });
    expect(fractionResult("-5/4", -1.25)).toEqual({ numerator: -5, denominator: 4 });
    expect(fractionResult("1.0/3", 1/3)).toBeNull();
    expect(fractionResult("sqrt(2)/3", Math.sqrt(2)/3)).toBeNull();
  });
});
