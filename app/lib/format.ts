// Display formatting for dates and durations, shared by the tables.
import type { Locale } from "~/lib/i18n";

// Locale and time zone are fixed per language so the server render and the
// browser render produce the same text; otherwise React reports a hydration
// mismatch. Hebrew gets Hebrew month names.
const dateFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-GB", {
    day: "numeric", // "8"
    month: "short", // "Nov"
    year: "numeric", // "2026"
    timeZone: "UTC",
  }),
  he: new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
};

// 2026-11-08T12:00:00Z -> "8 Nov 2026" (en) / "8 בנוב׳ 2026" (he)
export function formatDate(date: Date, locale: Locale = "en"): string {
  return dateFormatters[locale].format(date);
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
