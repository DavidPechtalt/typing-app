// Admin: the most recent practices from all users, with delete. Admins only.
import { data } from "react-router";
import { z } from "zod";
import { AdminNav } from "~/components/AdminNav";
import { DeleteButton, type DeleteActionData } from "~/components/DeleteButton";
import { db } from "~/db.server";
import { formatDate, formatDuration } from "~/lib/format";
import { requireAdmin } from "~/session.server";
import type { Route } from "./+types/admin.results";

export const meta: Route.MetaFunction = () => [
  { title: "Practices | Admin | Typing App" },
];

// Results grow with every practice, so the page shows only the newest ones.
const PAGE_SIZE = 100;

export async function loader({ request }: Route.LoaderArgs) {
  // Guard first, before any query.
  await requireAdmin(request);
  // Independent queries, run in parallel.
  const [results, total] = await Promise.all([
    db.result.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        wpm: true,
        accuracy: true,
        mistakes: true,
        corrections: true,
        durationMs: true,
        createdAt: true,
        user: { select: { email: true } },
        text: { select: { title: true } },
      },
    }),
    db.result.count(),
  ]);
  return { results, total };
}

const deleteSchema = z.object({ id: z.coerce.number().int().positive() });

export async function action({ request }: Route.ActionArgs) {
  // Guard on the action as well as the loader.
  await requireAdmin(request);

  const parsed = deleteSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data<DeleteActionData>(
      { error: "Invalid practice id." },
      { status: 400 },
    );
  }

  const { count } = await db.result.deleteMany({
    where: { id: parsed.data.id },
  });
  if (count === 0) {
    return data<DeleteActionData>(
      { error: "This practice no longer exists." },
      { status: 404 },
    );
  }
  return data<DeleteActionData>({ error: null });
}

export default function AdminResults({ loaderData }: Route.ComponentProps) {
  const { results, total } = loaderData;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Practices</h1>
          {/* Says so when the list is cut off at PAGE_SIZE. */}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total > results.length
              ? `Latest ${results.length} of ${total}`
              : `${total} ${total === 1 ? "practice" : "practices"}`}
          </p>
        </div>
        <AdminNav />
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No practices saved yet.
        </p>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  User
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
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {formatDate(result.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {result.user.email}
                  </td>
                  {/* dir="auto": a Hebrew title reads right-to-left. */}
                  <td
                    dir="auto"
                    className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400"
                  >
                    {result.text.title}
                  </td>
                  {/* Same rounding as the results screen on /practice. */}
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
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
                    {formatDuration(result.durationMs)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton
                      id={result.id}
                      label={`Delete practice by ${result.user.email} on ${formatDate(result.createdAt)}`}
                      confirmMessage={`Delete this practice by ${result.user.email}?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
