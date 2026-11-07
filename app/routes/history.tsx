// The logged-in user's past practices: personal bests, a progress chart and
// the full list. Guests are sent to login and back.
import { Link } from "react-router";
import { LineChart } from "~/components/charts/LineChart";
import { PageHeader } from "~/components/PageHeader";
import { StatTile } from "~/components/StatTile";
import { db } from "~/db.server";
import { formatDate, formatDuration } from "~/lib/format";
import { plural } from "~/lib/i18n";
import { average } from "~/lib/stats";
import { useLocale, useTranslate } from "~/lib/use-translate";
import { requireUserId } from "~/session.server";
import type { Route } from "./+types/history";

export const meta: Route.MetaFunction = () => [
  { title: "History · Keystroke" },
];

// How many of the latest practices the progress chart plots.
const CHART_POINTS = 30;

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const results = await db.result.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      wpm: true,
      accuracy: true,
      mistakes: true,
      corrections: true,
      durationMs: true,
      createdAt: true,
      text: { select: { id: true, title: true, language: true } },
    },
  });

  const wpms = results.map((result) => result.wpm);
  const summary = {
    count: results.length,
    bestWpm: wpms.length ? Math.max(...wpms) : 0,
    averageWpm: average(wpms),
    averageAccuracy: average(results.map((result) => result.accuracy)),
    totalMinutes:
      results.reduce((sum, result) => sum + result.durationMs, 0) / 60000,
  };

  return { results, summary };
}

export default function History({ loaderData }: Route.ComponentProps) {
  const { results, summary } = loaderData;
  const t = useTranslate();
  const locale = useLocale();

  const chartPoints = results
    .slice(0, CHART_POINTS)
    .reverse()
    .map((result, index) => ({
      label: `#${results.length - Math.min(results.length, CHART_POINTS) + index + 1}`,
      value: Math.round(result.wpm),
    }));

  const columns = [
    "col.date",
    "col.text",
    "col.wpm",
    "col.accuracy",
    "col.mistakes",
    "col.corrected",
    "col.time",
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10">
      <PageHeader
        title={t("history.title")}
        aside={plural(t, "history.count", summary.count)}
      />

      {results.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-display text-2xl">{t("history.empty.title")}</p>
          <p className="max-w-sm text-ink-muted">{t("history.empty.body")}</p>
          <Link to="/practice" className="btn-primary">
            {t("history.start")}
          </Link>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            <StatTile
              label={t("history.best")}
              value={Math.round(summary.bestWpm).toString()}
              emphasis
            />
            <StatTile
              label={t("history.avgWpm")}
              value={Math.round(summary.averageWpm).toString()}
            />
            <StatTile
              label={t("history.avgAccuracy")}
              value={`${summary.averageAccuracy.toFixed(1)}%`}
            />
            <StatTile
              label={t("history.time")}
              value={t("history.minutes", {
                n: Math.round(summary.totalMinutes),
              })}
            />
          </dl>

          <LineChart
            title={t("history.chart.title")}
            description={t("history.chart.desc", { n: chartPoints.length })}
            points={chartPoints}
            labelEvery={Math.max(1, Math.ceil(chartPoints.length / 10))}
            formatValue={(value) => t("admin.stats.wpmUnit", { n: value })}
          />

          <section aria-labelledby="all" className="flex flex-col gap-4">
            <h2 id="all" className="section-title">
              {t("history.all")}
            </h2>
            <div className="card relative overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="eyebrow border-b border-line">
                  <tr>
                    {columns.map((key, index) => (
                      <th
                        key={key}
                        scope="col"
                        className={`px-4 py-3 font-medium ${index >= 2 ? "text-end" : "text-start"}`}
                      >
                        {t(key)}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">{t("col.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-surface-3/60">
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                        {formatDate(result.createdAt, locale)}
                      </td>
                      <td dir="auto" className="max-w-56 truncate px-4 py-3">
                        {result.text.title}
                      </td>
                      <td className="px-4 py-3 text-end font-mono font-semibold tabular-nums">
                        {Math.round(result.wpm)}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums">
                        {result.accuracy.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums">
                        {result.mistakes}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums">
                        {result.corrections}
                      </td>
                      <td className="px-4 py-3 text-end font-mono tabular-nums">
                        {formatDuration(result.durationMs)}
                      </td>
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        <Link
                          to={`/practice?text=${result.text.id}`}
                          className="link text-sm font-medium"
                        >
                          {t("history.again")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
