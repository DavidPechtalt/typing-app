import { describe, expect, it } from "vitest";
import {
  calculateAccuracy,
  calculateCharactersPerSecond,
  calculateWordsPerMinute,
  compareText,
  recordIncorrectPositions,
  summarizeResult,
} from "./typing";

describe("compareText", () => {
  it("marks untyped characters as pending", () => {
    expect(compareText("cat", "")).toEqual(["pending", "pending", "pending"]);
  });

  it("marks matching and wrong characters", () => {
    expect(compareText("cat", "cot")).toEqual([
      "correct",
      "incorrect",
      "correct",
    ]);
  });

  it("marks a fixed position as corrected", () => {
    expect(compareText("cat", "c", new Set([0]))).toEqual([
      "corrected",
      "pending",
      "pending",
    ]);
  });

  it("counts an emoji as one character", () => {
    expect(compareText("a😀b", "a😀")).toEqual([
      "correct",
      "correct",
      "pending",
    ]);
  });
});

describe("calculateWordsPerMinute", () => {
  it("treats 5 characters as one word", () => {
    expect(calculateWordsPerMinute(50, 60)).toBe(10);
  });

  it("returns 0 when no time has passed", () => {
    expect(calculateWordsPerMinute(50, 0)).toBe(0);
  });
});

describe("calculateCharactersPerSecond", () => {
  it("divides characters by seconds", () => {
    expect(calculateCharactersPerSecond(30, 10)).toBe(3);
  });

  it("returns 0 when no time has passed", () => {
    expect(calculateCharactersPerSecond(30, 0)).toBe(0);
  });
});

describe("calculateAccuracy", () => {
  it("returns a percentage", () => {
    expect(calculateAccuracy(9, 10)).toBe(90);
  });

  it("returns 0 for an empty text", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });
});

describe("summarizeResult", () => {
  it("gives a perfect run no mistakes and full accuracy", () => {
    const summary = summarizeResult(["correct", "correct", "correct"], 60);

    expect(summary.mistakeCount).toBe(0);
    expect(summary.correctedCharacterCount).toBe(0);
    expect(summary.accuracy).toBe(100);
  });

  it("counts a corrected character as a mistake and against accuracy", () => {
    const summary = summarizeResult(
      ["corrected", "correct", "correct", "correct"],
      60,
    );

    expect(summary.mistakeCount).toBe(1);
    expect(summary.correctedCharacterCount).toBe(1);
    expect(summary.accuracy).toBe(75);
  });

  it("counts an uncorrected character as a mistake", () => {
    const summary = summarizeResult(["correct", "incorrect"], 60);

    expect(summary.mistakeCount).toBe(1);
    expect(summary.correctedCharacterCount).toBe(0);
  });

  it("returns 0 speed when no time has passed", () => {
    const summary = summarizeResult(["correct"], 0);

    expect(summary.wordsPerMinute).toBe(0);
    expect(summary.charactersPerSecond).toBe(0);
  });
});

describe("recordIncorrectPositions", () => {
  it("adds incorrect positions to a new set", () => {
    const previous = new Set<number>();
    const next = recordIncorrectPositions(
      ["correct", "incorrect", "pending"],
      previous,
    );

    expect([...next]).toEqual([1]);
    expect(previous.size).toBe(0);
  });

  it("keeps positions that were wrong before", () => {
    const next = recordIncorrectPositions(
      ["corrected", "correct"],
      new Set([0]),
    );

    expect([...next]).toEqual([0]);
  });
});
