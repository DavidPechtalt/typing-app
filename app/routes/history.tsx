import type { ReactNode } from "react";
import { Link } from "react-router";
import { Stat } from "~/components/Stat";
import { formatDateTime, formatDuration } from "~/lib/format";
import { getRecentResults, getResultStats } from "~/models/result.server";
import { requireUserId } from "~/session.server";
import type { Route } from "./+types/history";

export const meta: Route.MetaFunction = () => [{ title: "History | Keyprint" }];

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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">History</h1>
        <p className="mt-2 text-muted">
          Every practice you finished, newest first.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border-2 border-dashed border-line p-8">
          <p className="text-lg text-muted">
            Nothing printed yet. Finish a practice and it lands here.
          </p>
          <Link to="/practice" className="btn btn-primary">
            Start typing
          </Link>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Practices" value={stats.practiceCount.toString()} />
            <Stat
              label="Best WPM"
              value={formatNumber(stats.bestWpm, 0)}
              highlight
            />
            <Stat
              label="Average WPM"
              value={formatNumber(stats.averageWpm, 0)}
            />
            <Stat
              label="Average accuracy"
              value={`${formatNumber(stats.averageAccuracy, 1)}%`}
            />
          </dl>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Your most recent practices, newest first
              </caption>
              <thead className="border-b-2 border-line">
                <tr>
                  <HeaderCell>Date</HeaderCell>
                  <HeaderCell>Text</HeaderCell>
                  <HeaderCell numeric>WPM</HeaderCell>
                  <HeaderCell numeric>Accuracy</HeaderCell>
                  <HeaderCell numeric>Mistakes</HeaderCell>
                  <HeaderCell numeric>Fixed</HeaderCell>
                  <HeaderCell numeric>Time</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/15">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-sun/15">
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      <time dateTime={result.createdAt}>
                        {result.createdAtText}
                      </time>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/practice/${result.text.id}`} className="link">
                        {result.text.title}
                      </Link>
                    </td>
                    <NumberCell>{Math.round(result.wpm)}</NumberCell>
                    <NumberCell>{result.accuracy.toFixed(1)}%</NumberCell>
                    <NumberCell>{result.mistakes}</NumberCell>
                    <NumberCell>{result.corrections}</NumberCell>
                    <NumberCell>{result.durationText}</NumberCell>
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

type CellProps = {
  children: ReactNode;
  numeric?: boolean;
};

function HeaderCell({ children, numeric = false }: CellProps) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-semibold ${numeric ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function NumberCell({ children }: Omit<CellProps, "numeric">) {
  return (
    <td className="px-4 py-3 text-right font-mono tabular-nums">{children}</td>
  );
}
