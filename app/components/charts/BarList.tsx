// Horizontal bars with a label per row: for ranking a few named things
// (e.g. the most practised texts). Plain HTML, no SVG needed.

// `key` must be unique (two texts can share a title); it is never shown.
export type BarListItem = {
  key: string | number;
  label: string;
  value: number;
  hint?: string;
};

import { useTranslate } from "~/lib/use-translate";

type BarListProps = {
  title: string;
  description?: string;
  items: readonly BarListItem[];
  color?: string;
  emptyMessage?: string;
};

export function BarList({
  title,
  description,
  items,
  color = "var(--series-3)",
  emptyMessage,
}: BarListProps) {
  const t = useTranslate();
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <figure className="card flex flex-col gap-3 p-5">
      <figcaption>
        <h3 className="font-display text-2xl">{title}</h3>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </figcaption>

      {items.length === 0 ? (
        <p className="text-sm text-ink-faint">
          {emptyMessage ?? t("chart.empty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-1 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span dir="auto" className="truncate font-medium">
                  {item.label}
                </span>
                <span className="font-mono tabular-nums">
                  {item.value.toLocaleString("en-US")}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              {item.hint && (
                <span className="text-xs text-ink-faint">{item.hint}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
