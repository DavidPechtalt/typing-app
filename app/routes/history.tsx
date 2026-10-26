import { Link } from "react-router";
import { formatDateTime, formatDuration } from "~/lib/format";
import { getRecentResults, getResultStats } from "~/models/result.server";
import { requireUserId } from "~/session.server";
import type { Route } from "./+types/history";

export const meta: Route.MetaFunction = () => [
  { title: "History | Typing App" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const [results, stats] = await Promise.all([
    getRecentResults(userId),
    getResultStats(userId),
  ]);

  return {
    stats,
    // Format on the server so the page shows the same text in every browser.
    results: results.map((result) => ({
      ...result,
      createdAt: result.createdAt.toISOString(),
      createdAtText: formatDateTime(result.createdAt),
      durationText: formatDuration(result.durationMs),
    })),
  };
}

export default function History({ loaderData }: Route.ComponentProps) {
  const { stats, results } = loaderData;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">
            No results yet. Finish a practice and it will appear here.
          </p>
          <Link
            to="/practice"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Start practising
          </Link>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Practices" value={stats.practiceCount.toString()} />
            <Stat label="Best WPM" value={formatNumber(stats.bestWpm, 0)} />
            <Stat
              label="Average WPM"
              value={formatNumber(stats.averageWpm, 0)}
            />
            <Stat
              label="Average accuracy"
              value={`${formatNumber(stats.averageAccuracy, 1)}%`}
            />
          </dl>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Your most recent practices, newest first
              </caption>
              <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Text
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    WPM
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Accuracy
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Mistakes
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Corrected
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      <time dateTime={result.createdAt}>
                        {result.createdAtText}
                      </time>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/practice/${result.text.id}`}
                        className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
                      >
                        {result.text.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {Math.round(result.wpm)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {result.accuracy.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {result.mistakes}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {result.corrections}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {result.durationText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

function formatNumber(value: number | null, decimals: number): string {
  return value === null ? "–" : value.toFixed(decimals);
}

type StatProps = {
  label: string;
  value: string;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}
