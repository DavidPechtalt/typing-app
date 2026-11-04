import { describe, expect, it } from "vitest";
import {
  cleanExtract,
  MAX_EXTRACT_LENGTH,
  randomSummaryUrl,
  summaryToPracticeText,
  trimToSentence,
} from "./wikipedia";

describe("randomSummaryUrl", () => {
  it("points at the chosen language's Wikipedia", () => {
    expect(randomSummaryUrl("en")).toBe(
      "https://en.wikipedia.org/api/rest_v1/page/random/summary",
    );
    expect(randomSummaryUrl("he")).toContain("https://he.wikipedia.org/");
  });
});

describe("cleanExtract", () => {
  it("collapses whitespace and removes citation markers", () => {
    expect(cleanExtract("Hello[1]  world.\nNew   line[a].")).toBe(
      "Hello world. New line.",
    );
  });

  it("replaces typographic punctuation with keyboard characters", () => {
    expect(cleanExtract("“Quoted” — it’s")).toBe('"Quoted" - it\'s');
  });
});

describe("trimToSentence", () => {
  const sentence = "This is a sentence that has some words in it. ";

  it("returns short text unchanged", () => {
    expect(trimToSentence("Short.", 50)).toBe("Short.");
  });

  it("cuts at the last full sentence inside the limit", () => {
    const text = sentence.repeat(20).trim();
    const result = trimToSentence(text, 200);
    expect(result.endsWith(".")).toBe(true);
    expect(Array.from(result).length).toBeLessThanOrEqual(200);
    expect(result.endsWith("in it.")).toBe(true);
  });

  it("falls back to a word boundary with an ellipsis when there is no sentence end", () => {
    const text = "word ".repeat(100).trim();
    const result = trimToSentence(text, 150);
    expect(result.endsWith("word...")).toBe(true);
    expect(Array.from(result).length).toBeLessThanOrEqual(153);
  });

  it("uses the default maximum length", () => {
    const text = sentence.repeat(30);
    expect(Array.from(trimToSentence(text)).length).toBeLessThanOrEqual(
      MAX_EXTRACT_LENGTH,
    );
  });
});

describe("summaryToPracticeText", () => {
  const longExtract =
    "The lighthouse keeper climbed the spiral stairs every evening just before dusk. He checked the lamp, polished the glass, and wound the clockwork that turned the great lens.";

  it("builds a practice text from a standard article", () => {
    const result = summaryToPracticeText({
      title: "Lighthouse",
      extract: longExtract,
      type: "standard",
      content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/L" } },
    });
    expect(result).toEqual({
      title: "Lighthouse",
      content: longExtract,
      sourceUrl: "https://en.wikipedia.org/wiki/L",
    });
  });

  it("rejects disambiguation pages", () => {
    expect(
      summaryToPracticeText({
        title: "X",
        extract: longExtract,
        type: "disambiguation",
      }),
    ).toBeNull();
  });

  it("rejects summaries that are too short to practise on", () => {
    expect(
      summaryToPracticeText({
        title: "X",
        extract: "X is a village in Y.",
        type: "standard",
      }),
    ).toBeNull();
  });
});
