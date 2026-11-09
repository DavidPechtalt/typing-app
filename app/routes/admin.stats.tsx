// Admin statistics: charts of how the app is being used. Admins only.
import { AdminNav } from "~/components/AdminNav";
import { BarList } from "~/components/charts/BarList";
import { ColumnChart } from "~/components/charts/ColumnChart";
import { LineChart } from "~/components/charts/LineChart";
import { formatDayLabel } from "~/components/charts/scale";
import { SegmentedBar } from "~/components/charts/SegmentedBar";
import { PageHeader } from "~/components/PageHeader";
import { StatTile } from "~/components/StatTile";
import { db } from "~/db.server";
import {
  average,
  averagePerDay,
  countBy,
  countPerDay,
  histogram,
} from "~/lib/stats";
import { useLocale, useTranslate } from "~/lib/use-translate";
import { requireAdmin } from "~/session.server";
import type { Route } from "./+types/admin.stats";

export const meta: Route.MetaFunction = () => [
  { title: "Statistics · Admin · Keystroke" },
];

const DAYS = 30;
const WPM_BUCKET = 10;

// Labels for sources and languages travel as translation keys and are
// resolved in the component, so they follow the interface language.
type LabelKey =
  "lang.he" | "lang.en" | `source.${"BUILTIN" | "UPLOAD" | "WIKIPEDIA"}`;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [recentResults, allWpms, recentUsers, texts, topTexts, totals] =
    await Promise.all([
      db.result.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, wpm: true, accuracy: true, userId: true },
      }),
      db.result.findMany({ select: { wpm: true } }),
      db.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      db.text.findMany({ select: { language: true, source: true } }),
      db.text.findMany({
        orderBy: { results: { _count: "desc" } },
        take: 5,
        select: {
          id: true,
          title: true,
          _count: { select: { results: true } },
        },
      }),
      Promise.all([db.user.count(), db.result.count(), db.text.count()]),
    ]);

  const [usersCount, resultsCount, textsCount] = totals;
  const wpms = allWpms.map((result) => result.wpm);

  return {
    tiles: {
      usersCount,
      resultsCount,
      textsCount,
      activeUsers: new Set(recentResults.map((result) => result.userId)).size,
      averageWpm: average(wpms),
      averageAccuracy: average(recentResults.map((result) => result.accuracy)),
    },
    practicesPerDay: countPerDay(
      recentResults.map((result) => result.createdAt),
      DAYS,
    ),
    wpmPerDay: averagePerDay(
      recentResults.map((result) => ({
        createdAt: result.createdAt,
        value: result.wpm,
      })),
      DAYS,
    ),
    signupsPerDay: countPerDay(
      recentUsers.map((user) => user.createdAt),
      DAYS,
    ),
    wpmHistogram: histogram(wpms, WPM_BUCKET),
    textsByLanguage: countBy(texts, (text): LabelKey =>
      text.language === "he" ? "lang.he" : "lang.en",
    ),
    textsBySource: countBy(texts, (text): LabelKey => `source.${text.source}`),
    topTexts: topTexts.map((text) => ({
      key: text.id,
      label: text.title,
      value: text._count.results,
    })),
  };
}

export default function AdminStats({ loaderData }: Route.ComponentProps) {
  const { tiles } = loaderData;
  const t = useTranslate();
  const locale = useLocale();
  const withDayLabels = <T extends { day: string }>(points: T[]) =>
    points.map(({ day, ...rest }) => ({
      ...rest,
      label: formatDayLabel(day, locale),
    }));
  const wpm = (value: number) =>
    t("admin.stats.wpmUnit", { n: Math.round(value) });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10">
      <PageHeader
        title={t("admin.stats.title")}
        aside={t("admin.stats.lastDays", { n: DAYS })}
      >
        <AdminNav />
      </PageHeader>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label={t("admin.stats.users")}
          value={tiles.usersCount.toString()}
        />
        <StatTile
          label={t("admin.stats.active")}
          value={tiles.activeUsers.toString()}
          hint={t("admin.stats.activeHint", { n: DAYS })}
        />
        <StatTile
          label={t("admin.stats.practices")}
          value={tiles.resultsCount.toString()}
        />
        <StatTile
          label={t("admin.stats.texts")}
          value={tiles.textsCount.toString()}
        />
        <StatTile
          label={t("admin.stats.avgWpm")}
          value={Math.round(tiles.averageWpm).toString()}
          hint={t("admin.stats.allTime")}
        />
        <StatTile
          label={t("admin.stats.avgAccuracy")}
          value={`${tiles.averageAccuracy.toFixed(1)}%`}
          hint={t("admin.stats.lastDaysHint", { n: DAYS })}
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <ColumnChart
          title={t("admin.stats.perDay.title")}
          description={t("admin.stats.perDay.desc")}
          points={withDayLabels(loaderData.practicesPerDay)}
          labelEvery={7}
          color="var(--series-1)"
        />
        <LineChart
          title={t("admin.stats.speed.title")}
          description={t("admin.stats.speed.desc")}
          points={withDayLabels(loaderData.wpmPerDay)}
          labelEvery={7}
          color="var(--series-2)"
          formatValue={wpm}
        />
        <ColumnChart
          title={t("admin.stats.signups.title")}
          description={t("admin.stats.signups.desc")}
          points={withDayLabels(loaderData.signupsPerDay)}
          labelEvery={7}
          color="var(--series-3)"
        />
        <ColumnChart
          title={t("admin.stats.dist.title")}
          description={t("admin.stats.dist.desc", { n: WPM_BUCKET })}
          points={loaderData.wpmHistogram.map((bucket) => ({
            label: `${bucket.from}–${bucket.to}`,
            value: bucket.count,
          }))}
          labelEvery={Math.max(
            1,
            Math.ceil(loaderData.wpmHistogram.length / 12),
          )}
          color="var(--series-4)"
        />
        <BarList
          title={t("admin.stats.top.title")}
          description={t("admin.stats.top.desc")}
          items={loaderData.topTexts}
        />
        <div className="flex flex-col gap-6">
          <SegmentedBar
            title={t("admin.stats.bySource.title")}
            description={t("admin.stats.bySource.desc")}
            segments={loaderData.textsBySource.map((entry) => ({
              label: t(entry.label as LabelKey),
              value: entry.count,
            }))}
          />
          <SegmentedBar
            title={t("admin.stats.byLang.title")}
            segments={loaderData.textsByLanguage.map((entry) => ({
              label: t(entry.label as LabelKey),
              value: entry.count,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
