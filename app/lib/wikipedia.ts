// Pure helpers for turning a Wikipedia article summary into a practice text.
// No fetch here: this file has no network or React, so it is easy to unit test.
// The actual HTTP call lives in wikipedia.server.ts.

// The two Wikipedias the app can draw from.
export const WIKIPEDIA_LANGUAGES = ["en", "he"] as const;
export type WikipediaLanguage = (typeof WIKIPEDIA_LANGUAGES)[number];

// A summary shorter than this is not worth typing (e.g. "X is a village in Y.").
export const MIN_EXTRACT_LENGTH = 120;
// Longer summaries are cut so a practice stays a few minutes long.
export const MAX_EXTRACT_LENGTH = 600;

// U+00A0, written as an escape so it is visible in the source.
const NON_BREAKING_SPACE = new RegExp("\\u00A0", "g");

// The REST endpoint that returns a random article's summary as JSON.
export function randomSummaryUrl(language: WikipediaLanguage): string {
  return `https://${language}.wikipedia.org/api/rest_v1/page/random/summary`;
}

// Cleans the raw `extract` field:
// - collapses newlines and double spaces into single spaces,
// - removes citation marks like [1] or [a] that sometimes survive,
// - turns typographic quotes and dashes into the plain keys a keyboard has,
//   so the text can actually be typed.
export function cleanExtract(extract: string): string {
  return extract
    .replace(/\[[^\]]{1,4}\]/g, "")
    .replace(/[‘’ʼ]/g, "'") // curly single quotes -> '
    .replace(/[“”״]/g, '"') // curly double quotes -> "
    .replace(/[–—−]/g, "-")
    .replace(NON_BREAKING_SPACE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Shortens a text to at most `maxLength` characters, cutting at the end of a
// sentence when one exists so the passage does not stop mid-word.
export function trimToSentence(
  text: string,
  maxLength: number = MAX_EXTRACT_LENGTH,
): string {
  const characters = Array.from(text);
  if (characters.length <= maxLength) return text;

  const cut = characters.slice(0, maxLength).join("");
  const lastSentenceEnd = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
  );
  if (lastSentenceEnd >= MIN_EXTRACT_LENGTH) {
    return cut.slice(0, lastSentenceEnd + 1);
  }
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : cut.length).trimEnd()}...`;
}

// The shape of the JSON Wikipedia returns, limited to the fields we read.
export type WikipediaSummary = {
  title: string;
  extract: string;
  type?: string;
  content_urls?: { desktop?: { page?: string } };
};

export type PracticeTextFromWikipedia = {
  title: string;
  content: string;
  sourceUrl: string;
};

// Converts a raw summary into a practice text, or null when the article is not
// suitable (a disambiguation page, or too little text to practise on).
export function summaryToPracticeText(
  summary: WikipediaSummary,
): PracticeTextFromWikipedia | null {
  if (summary.type && summary.type !== "standard") return null;

  const content = trimToSentence(cleanExtract(summary.extract ?? ""));
  if (Array.from(content).length < MIN_EXTRACT_LENGTH) return null;

  return {
    title: cleanExtract(summary.title),
    content,
    sourceUrl: summary.content_urls?.desktop?.page ?? "",
  };
}
