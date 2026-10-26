// Dates are formatted for one fixed time zone. If server and browser used their
// own time zones, the server HTML and the browser's render could differ.
const APP_TIME_ZONE = "Asia/Jerusalem";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

// 65000 ms -> "1:05"
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
