import { describe, expect, it } from "vitest";
import { formatDate, formatDuration } from "./format";

describe("formatDate", () => {
  it("formats as day, short month, year", () => {
    expect(formatDate(new Date("2026-11-08T12:00:00Z"))).toBe("8 Nov 2026");
  });

  it("uses UTC, so a late-evening date does not shift a day", () => {
    expect(formatDate(new Date("2026-11-08T23:30:00Z"))).toBe("8 Nov 2026");
  });
});

describe("formatDuration", () => {
  it("shows minutes and two-digit seconds", () => {
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(30_000)).toBe("0:30");
  });

  it("rounds to whole seconds before splitting", () => {
    expect(formatDuration(59_600)).toBe("1:00");
    expect(formatDuration(1_400)).toBe("0:01");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0:00");
  });
});
