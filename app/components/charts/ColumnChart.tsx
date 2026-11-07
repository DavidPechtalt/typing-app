// A column chart drawn in plain SVG: one column per point, hover tooltip,
// and a table view for screen readers and anyone who prefers numbers.
import { useId, useState } from "react";
import { useTranslate } from "~/lib/use-translate";
import { niceTicks } from "./scale";

export type ColumnPoint = { label: string; value: number };

type ColumnChartProps = {
  title: string;
  description?: string;
  points: readonly ColumnPoint[];
  color?: string;
  labelEvery?: number;
  formatValue?: (value: number) => string;
};

// Drawing area in SVG units; the SVG scales to its container.
const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 20, right: 12, bottom: 28, left: 36 };

export function ColumnChart({
  title,
  description,
  points,
  color = "var(--series-1)",
  labelEvery = 1,
  formatValue = (value) => value.toLocaleString("en-US"),
}: ColumnChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const t = useTranslate();
  const tableId = useId();

  const maxValue = Math.max(0, ...points.map((point) => point.value));
  const ticks = niceTicks(maxValue);
  const top = ticks[ticks.length - 1];

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotWidth / Math.max(points.length, 1);
  const barWidth = Math.min(24, slot * 0.6);

  const yFor = (value: number) =>
    PAD.top + plotHeight - (value / top) * plotHeight;
  const xFor = (index: number) => PAD.left + slot * index + slot / 2;

  const maxIndex = points.findIndex((point) => point.value === maxValue);
  const hoveredPoint = hovered === null ? null : points[hovered];

  return (
    <figure className="card flex flex-col gap-3 p-5">
      <figcaption>
        <h3 className="font-display text-2xl">{title}</h3>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </figcaption>

      <div className="relative" dir="ltr">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-labelledby={tableId}
          onMouseLeave={() => setHovered(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={yFor(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--ink-faint)"
              >
                {tick.toLocaleString("en-US")}
              </text>
            </g>
          ))}

          {points.map((point, index) => {
            const x = xFor(index);
            const y = yFor(point.value);
            const barHeight = PAD.top + plotHeight - y;
            const isHovered = hovered === index;
            return (
              <g key={point.label}>
                <rect
                  x={PAD.left + slot * index}
                  y={PAD.top}
                  width={slot}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHovered(index)}
                />
                {point.value > 0 && (
                  <path
                    d={roundedTopBar(
                      x - barWidth / 2,
                      y,
                      barWidth,
                      barHeight,
                      4,
                    )}
                    fill={color}
                    opacity={hovered === null || isHovered ? 1 : 0.55}
                    style={{ transition: "opacity 120ms" }}
                  />
                )}
                {index % labelEvery === 0 && (
                  <text
                    x={x}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--ink-faint)"
                  >
                    {point.label}
                  </text>
                )}
                {index === maxIndex && maxValue > 0 && (
                  <text
                    x={x}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--ink)"
                  >
                    {formatValue(point.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredPoint && hovered !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-1 -translate-x-1/2 rounded-sm border border-line-strong bg-surface-2 px-2.5 py-1.5 font-mono text-xs shadow-md"
            style={{ left: `${(xFor(hovered) / WIDTH) * 100}%` }}
          >
            <span className="text-ink-muted">{hoveredPoint.label}</span>{" "}
            <span className="font-mono font-semibold tabular-nums">
              {formatValue(hoveredPoint.value)}
            </span>
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="eyebrow hover:text-ink">{t("chart.table")}</summary>
        <table id={tableId} className="mt-2 w-full text-start">
          <caption className="sr-only">{title}</caption>
          <thead className="eyebrow">
            <tr>
              <th scope="col" className="py-1 font-medium">
                {t("chart.label")}
              </th>
              <th scope="col" className="py-1 text-end font-medium">
                {t("chart.value")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {points.map((point) => (
              <tr key={point.label}>
                <td className="py-1">{point.label}</td>
                <td className="py-1 text-end font-mono tabular-nums">
                  {formatValue(point.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

// SVG path for a bar with rounded top corners only.
export function roundedTopBar(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.min(radius, width / 2, height);
  return [
    `M ${x} ${y + height}`,
    `V ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `H ${x + width - r}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `V ${y + height}`,
    "Z",
  ].join(" ");
}
