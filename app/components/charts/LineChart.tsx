// A single-series line chart in SVG with a crosshair tooltip and table view.
// `null` values leave a gap in the line (e.g. a day with no practices).
import { useId, useState } from "react";
import { useTranslate } from "~/lib/use-translate";
import { niceTicks } from "./scale";

export type LinePoint = { label: string; value: number | null };

type LineChartProps = {
  title: string;
  description?: string;
  points: readonly LinePoint[];
  color?: string;
  labelEvery?: number;
  formatValue?: (value: number) => string;
};

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 20, right: 16, bottom: 28, left: 36 };

export function LineChart({
  title,
  description,
  points,
  color = "var(--series-2)",
  labelEvery = 1,
  formatValue = (value) => value.toFixed(0),
}: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const t = useTranslate();
  const tableId = useId();

  const values = points
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
  const ticks = niceTicks(Math.max(0, ...values));
  const top = ticks[ticks.length - 1];

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const xFor = (index: number) => PAD.left + step * index;
  const yFor = (value: number) =>
    PAD.top + plotHeight - (value / top) * plotHeight;

  let path = "";
  let penDown = false;
  points.forEach((point, index) => {
    if (point.value === null) {
      penDown = false;
      return;
    }
    path += `${penDown ? "L" : "M"} ${xFor(index)} ${yFor(point.value)} `;
    penDown = true;
  });

  const lastIndex = points
    .map((p) => p.value)
    .lastIndexOf(values[values.length - 1]);
  const hoveredPoint = hovered === null ? null : points[hovered];

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * WIDTH;
    const index = Math.round((x - PAD.left) / (step || 1));
    setHovered(Math.min(points.length - 1, Math.max(0, index)));
  }

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
          onMouseMove={handleMove}
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
                {tick}
              </text>
            </g>
          ))}

          {values.length > 1 && (
            <path
              d={`${path.replace(/M/g, "L").replace(/^L/, "M")} L ${xFor(points.length - 1)} ${yFor(0)} L ${xFor(0)} ${yFor(0)} Z`}
              fill={color}
              opacity={0.08}
            />
          )}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {hovered !== null && (
            <line
              x1={xFor(hovered)}
              x2={xFor(hovered)}
              y1={PAD.top}
              y2={PAD.top + plotHeight}
              stroke="var(--line-strong)"
              strokeWidth={1}
            />
          )}

          {points.map((point, index) => {
            if (point.value === null) return null;
            const isMarked = index === hovered || index === lastIndex;
            return (
              <circle
                key={point.label}
                cx={xFor(index)}
                cy={yFor(point.value)}
                r={isMarked ? 5 : 3}
                fill={color}
                stroke="var(--surface-2)"
                strokeWidth={2}
              />
            );
          })}

          {lastIndex >= 0 && points[lastIndex].value !== null && (
            <text
              x={xFor(lastIndex)}
              y={yFor(points[lastIndex].value as number) - 10}
              textAnchor="end"
              fontSize={11}
              fontWeight={600}
              fill="var(--ink)"
            >
              {formatValue(points[lastIndex].value as number)}
            </text>
          )}

          {points.map((point, index) =>
            index % labelEvery === 0 ? (
              <text
                key={point.label}
                x={xFor(index)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--ink-faint)"
              >
                {point.label}
              </text>
            ) : null,
          )}
        </svg>

        {hoveredPoint && hovered !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-1 -translate-x-1/2 rounded-sm border border-line-strong bg-surface-2 px-2.5 py-1.5 font-mono text-xs shadow-md"
            style={{ left: `${(xFor(hovered) / WIDTH) * 100}%` }}
          >
            <span className="text-ink-muted">{hoveredPoint.label}</span>{" "}
            <span className="font-mono font-semibold tabular-nums">
              {hoveredPoint.value === null
                ? t("chart.noData")
                : formatValue(hoveredPoint.value)}
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
                  {point.value === null ? "–" : formatValue(point.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
