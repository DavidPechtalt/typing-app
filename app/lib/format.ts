// Display formatting for dates and durations, shared by the admin tables.

// Locale and time zone are fixed so the server render and the browser render
// produce the same text; otherwise React reports a hydration mismatch.
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", // "8"
  month: "short", // "Nov"
  year: "numeric", // "2026"
  timeZone: "UTC",
});

// 2026-11-08T12:00:00Z -> "8 Nov 2026"
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

// Practice length as minutes:seconds, e.g. 65_000 ms -> "1:05".
export function formatDuration(durationMs: number): string {
  // Round to whole seconds first so 59.6 s shows as "1:00", not "0:60".
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // padStart keeps two digits: 5 -> "05".
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
