import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it("allows a path on this site", () => {
    expect(safeRedirect("/practice?text=2")).toBe("/practice?text=2");
  });

  it("falls back when there is no target", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect("")).toBe("/");
  });

  it("blocks other websites", () => {
    expect(safeRedirect("https://evil.example")).toBe("/");
    expect(safeRedirect("//evil.example")).toBe("/");
    expect(safeRedirect("/\\evil.example")).toBe("/");
  });

  it("uses the given default path", () => {
    expect(safeRedirect("https://evil.example", "/practice")).toBe("/practice");
  });
});
