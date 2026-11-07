// One whole split into parts, as a single thin bar with a legend underneath.
// Used for "texts by language" and "texts by source".

export type Segment = { label: string; value: number };

import { useTranslate } from "~/lib/use-translate";

type SegmentedBarProps = {
  title: string;
  description?: string;
  segments: readonly Segment[];
};

// Fixed order: the first segment is always series-1, and so on. Colours follow
// the position in the list, which the caller keeps stable.
const COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
];

export function SegmentedBar({
  title,
  description,
  segments,
}: SegmentedBarProps) {
  const t = useTranslate();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <figure className="card flex flex-col gap-4 p-5">
      <figcaption>
        <h3 className="font-display text-2xl">{title}</h3>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </figcaption>

      {total === 0 ? (
        <p className="text-sm text-ink-faint">{t("chart.empty")}</p>
      ) : (
        <>
          <div
            className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            {segments.map((segment, index) =>
              segment.value > 0 ? (
                <div
                  key={segment.label}
                  style={{
                    width: `${(segment.value / total) * 100}%`,
                    background: COLORS[index % COLORS.length],
                  }}
                  title={`${segment.label}: ${segment.value}`}
                />
              ) : null,
            )}
          </div>

          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {segments.map((segment, index) => (
              <li key={segment.label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-sm"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 truncate">{segment.label}</span>
                <span className="font-mono tabular-nums">
                  {segment.value}
                  <span className="ms-2 text-ink-faint">
                    {Math.round((segment.value / total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </figure>
  );
}
