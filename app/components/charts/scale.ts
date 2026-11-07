// Small math helpers shared by the SVG charts. Pure functions, no React.
import type { Locale } from "~/lib/i18n";

// Picks a "nice" upper bound and tick values for a y-axis, so the axis reads
// 0 / 5 / 10 instead of 0 / 3.7 / 7.4.
export function niceTicks(maxValue: number, tickCount = 4): number[] {
  if (maxValue <= 0) return [0, 1];
  const roughStep = maxValue / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  const niceResidual =
    residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
  const step = niceResidual * magnitude;
  const top = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }
  return ticks;
}

// "2026-11-08" -> "8 Nov" / "8 בנוב׳", for compact x-axis labels.
const shortDay: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }),
  he: new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }),
};

export function formatDayLabel(dayKey: string, locale: Locale = "en"): string {
  return shortDay[locale].format(new Date(`${dayKey}T00:00:00Z`));
}
