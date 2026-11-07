import { describe, expect, it } from "vitest";
import {
  average,
  averagePerDay,
  countBy,
  countPerDay,
  dayKey,
  histogram,
  lastDays,
} from "./stats";

const today = new Date("2026-11-10T15:00:00Z");

describe("dayKey", () => {
  it("formats a date as YYYY-MM-DD in UTC", () => {
    expect(dayKey(new Date("2026-11-08T23:59:00Z"))).toBe("2026-11-08");
  });
});

describe("lastDays", () => {
  it("returns consecutive days ending today, oldest first", () => {
    expect(lastDays(3, today)).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
    ]);
  });

  it("crosses a month boundary", () => {
    expect(lastDays(2, new Date("2026-11-01T12:00:00Z"))).toEqual([
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("countPerDay", () => {
  it("counts rows per day and fills empty days with zero", () => {
    const dates = [
      new Date("2026-11-10T01:00:00Z"),
      new Date("2026-11-10T02:00:00Z"),
      new Date("2026-11-08T02:00:00Z"),
      new Date("2026-10-01T02:00:00Z"),
    ];
    expect(countPerDay(dates, 3, today)).toEqual([
      { day: "2026-11-08", value: 1 },
      { day: "2026-11-09", value: 0 },
      { day: "2026-11-10", value: 2 },
    ]);
  });
});

describe("averagePerDay", () => {
  it("averages values per day and leaves null gaps", () => {
    const rows = [
      { createdAt: new Date("2026-11-10T01:00:00Z"), value: 40 },
      { createdAt: new Date("2026-11-10T02:00:00Z"), value: 60 },
      { createdAt: new Date("2026-11-08T02:00:00Z"), value: 30 },
    ];
    expect(averagePerDay(rows, 3, today)).toEqual([
      { day: "2026-11-08", value: 30 },
      { day: "2026-11-09", value: null },
      { day: "2026-11-10", value: 50 },
    ]);
  });
});

describe("histogram", () => {
  it("groups values into fixed-width buckets", () => {
    expect(histogram([3, 12, 15, 29], 10)).toEqual([
      { from: 0, to: 9, count: 1 },
      { from: 10, to: 19, count: 2 },
      { from: 20, to: 29, count: 1 },
    ]);
  });

  it("returns nothing for an empty list", () => {
    expect(histogram([], 10)).toEqual([]);
  });
});

describe("average", () => {
  it("averages a list and returns 0 when empty", () => {
    expect(average([10, 20, 30])).toBe(20);
    expect(average([])).toBe(0);
  });
});

describe("countBy", () => {
  it("counts rows per label, biggest first", () => {
    const rows = [{ l: "en" }, { l: "he" }, { l: "en" }];
    expect(countBy(rows, (row) => row.l)).toEqual([
      { label: "en", count: 2 },
      { label: "he", count: 1 },
    ]);
  });
});
