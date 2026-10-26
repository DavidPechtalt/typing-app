import { describe, expect, it } from "vitest";
import { scorePractice } from "./score";

describe("scorePractice", () => {
  it("scores a finished practice", () => {
    // 10 correct characters in 6 seconds = 2 words in 0.1 minutes = 20 WPM
    const result = scorePractice("abcdefghij", "abcdefghij", [], 6000);

    expect(result.ok && result.summary.wordsPerMinute).toBe(20);
    expect(result.ok && result.summary.accuracy).toBe(100);
  });

  it("counts mistakes from the positions that were ever wrong", () => {
    const result = scorePractice("abcdefghij", "abcdefghiX", [0], 6000);

    // position 0 was corrected, position 9 is still wrong
    expect(result.ok && result.summary.mistakeCount).toBe(2);
    expect(result.ok && result.summary.correctedCharacterCount).toBe(1);
  });

  it("rejects an unfinished practice", () => {
    expect(scorePractice("abcdefghij", "abc", [], 6000).ok).toBe(false);
  });

  it("rejects a mistake position outside the text", () => {
    expect(scorePractice("abc", "abc", [3], 6000).ok).toBe(false);
  });

  it("rejects an unrealistic speed", () => {
    // 1000 characters in 1 second would be 12000 WPM
    const text = "a".repeat(1000);
    expect(scorePractice(text, text, [], 1000).ok).toBe(false);
  });
});
