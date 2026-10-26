import { describe, expect, it } from "vitest";
import { formatDateTime, formatDuration } from "./format";

describe("formatDuration", () => {
  it("shows minutes and two-digit seconds", () => {
    expect(formatDuration(65000)).toBe("1:05");
    expect(formatDuration(9000)).toBe("0:09");
  });

  it("rounds to the nearest second", () => {
    expect(formatDuration(59600)).toBe("1:00");
  });
});

describe("formatDateTime", () => {
  it("uses Israel time", () => {
    // 22:30 UTC on 1 Jan is 00:30 on 2 Jan in Israel (UTC+2 in winter)
    expect(formatDateTime(new Date("2026-01-01T22:30:00Z"))).toBe(
      "2 Jan 2026, 00:30",
    );
  });
});
