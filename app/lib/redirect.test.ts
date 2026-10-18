import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT, safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("keeps a local path", () => {
    expect(safeRedirect("/history")).toBe("/history");
    expect(safeRedirect("/practice?text=3")).toBe("/practice?text=3");
  });

  it("falls back when the value is missing or empty", () => {
    expect(safeRedirect(null)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirect(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirect("")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirect("https://evil.example")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirect("//evil.example")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirect("/\\evil.example")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirect("history")).toBe(DEFAULT_REDIRECT);
  });

  it("uses a custom fallback", () => {
    expect(safeRedirect("//evil.example", "/")).toBe("/");
  });
});
