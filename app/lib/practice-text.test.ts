import { describe, expect, it } from "vitest";
import { normalizePracticeText } from "./practice-text";

describe("normalizePracticeText", () => {
  it("joins lines and collapses spaces", () => {
    expect(normalizePracticeText("  One line.\n\nTwo   lines.\t ")).toBe(
      "One line. Two lines.",
    );
  });

  it("replaces curly quotes, dashes and the ellipsis", () => {
    expect(normalizePracticeText("“It’s fine” — he said…")).toBe(
      '"It\'s fine" - he said...',
    );
  });

  it("keeps Hebrew text unchanged", () => {
    expect(normalizePracticeText("שלום עולם")).toBe("שלום עולם");
  });
});
