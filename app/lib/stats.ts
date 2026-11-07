// Pure statistics helpers that turn database rows into chart-ready series.
// No database or React here, so everything is unit tested in stats.test.ts.

// One point of a time series: the day (as "YYYY-MM-DD") and a number.
export type DayPoint = { day: string; value: number };

// 2026-11-08T15:04:00Z -> "2026-11-08" (UTC, so server and browser agree).
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// The last `days` day keys ending today, oldest first.
// Every day is present even when nothing happened, so charts show the gaps.
export function lastDays(days: number, today: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    keys.push(dayKey(date));
  }
  return keys;
}

// Counts how many rows fall on each of the last `days` days.
export function countPerDay(
  dates: readonly Date[],
  days: number,
  today: Date = new Date(),
): DayPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return lastDays(days, today).map((day) => ({
    day,
    value: counts.get(day) ?? 0,
  }));
}

// Averages a numeric field per day. Days with no rows get `null` so a line
// chart can leave a gap instead of drawing a misleading zero.
export function averagePerDay(
  rows: readonly { createdAt: Date; value: number }[],
  days: number,
  today: Date = new Date(),
): { day: string; value: number | null }[] {
  const sums = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const key = dayKey(row.createdAt);
    const entry = sums.get(key) ?? { total: 0, count: 0 };
    entry.total += row.value;
    entry.count += 1;
    sums.set(key, entry);
  }
  return lastDays(days, today).map((day) => {
    const entry = sums.get(day);
    return { day, value: entry ? entry.total / entry.count : null };
  });
}

// Groups numbers into fixed-width buckets, e.g. WPM 0-9, 10-19, 20-29…
// Returns the buckets from 0 up to the one containing the largest value.
export type Bucket = { from: number; to: number; count: number };

export function histogram(
  values: readonly number[],
  bucketSize: number,
): Bucket[] {
  if (values.length === 0 || bucketSize <= 0) return [];
  const max = Math.max(...values);
  const bucketCount = Math.floor(max / bucketSize) + 1;
  const buckets: Bucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    from: i * bucketSize,
    to: (i + 1) * bucketSize - 1,
    count: 0,
  }));
  for (const value of values) {
    const index = Math.max(0, Math.floor(value / bucketSize));
    buckets[index].count += 1;
  }
  return buckets;
}

// Average of a list, 0 when empty (so the UI never shows NaN).
export function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Counts rows per label, sorted by count descending, biggest first.
export function countBy<T>(
  rows: readonly T[],
  getLabel: (row: T) => string,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = getLabel(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
