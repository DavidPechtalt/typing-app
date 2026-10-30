// Admin: the most recent practices from all users, with delete. Admins only.
import { data } from "react-router";
import { z } from "zod";
import { AdminNav } from "~/components/AdminNav";
import { DeleteButton, type DeleteActionData } from "~/components/DeleteButton";
import { PageHeader } from "~/components/PageHeader";
import { db } from "~/db.server";
import { formatDate, formatDuration } from "~/lib/format";
import { plural } from "~/lib/i18n";
import { getTranslator } from "~/lib/locale.server";
import { useLocale, useTranslate } from "~/lib/use-translate";
import { requireAdmin } from "~/session.server";
import type { Route } from "./+types/admin.results";

export const meta: Route.MetaFunction = () => [
  { title: "Practices · Admin · Keystroke" },
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
  const t = await getTranslator(request);

  const parsed = deleteSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data<DeleteActionData>(
      { error: t("admin.results.err.id") },
      { status: 400 },
    );
  }

  const { count } = await db.result.deleteMany({
    where: { id: parsed.data.id },
  });
  if (count === 0) {
    return data<DeleteActionData>(
      { error: t("admin.results.err.gone") },
      { status: 404 },
    );
  }
  return data<DeleteActionData>({ error: null });
}

export default function AdminResults({ loaderData }: Route.ComponentProps) {
  const { results, total } = loaderData;
  const t = useTranslate();
  const locale = useLocale();

  const columns = [
    ["col.date", "start"],
    ["col.user", "start"],
    ["col.text", "start"],
    ["col.wpm", "end"],
    ["col.accuracy", "end"],
    ["col.mistakes", "end"],
    ["col.corrected", "end"],
    ["col.time", "end"],
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-10">
      <PageHeader
        title={t("admin.tab.practices")}
        aside={
          total > results.length
            ? t("admin.results.latest", { n: results.length, total })
            : plural(t, "admin.results.count", total)
        }
      >
        <AdminNav />
      </PageHeader>

      {results.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">
          {t("admin.results.empty")}
        </p>
      ) : (
        <div className="card relative overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="eyebrow border-b border-line">
              <tr>
                {columns.map(([key, align]) => (
                  <th
                    key={key}
                    scope="col"
                    className={`px-4 py-3 font-medium text-${align}`}
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
                <tr key={result.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {formatDate(result.createdAt, locale)}
                  </td>
                  <td
                    dir="ltr"
                    className="px-4 py-3 text-start whitespace-nowrap"
                  >
                    {result.user.email}
                  </td>
                  {/* dir="auto": a Hebrew title reads right-to-left. */}
                  <td
                    dir="auto"
                    className="max-w-56 truncate px-4 py-3 text-ink-muted"
                  >
                    {result.text.title}
                  </td>
                  {/* Same rounding as the results screen on /practice. */}
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
                  <td className="px-4 py-3 text-end">
                    <DeleteButton
                      id={result.id}
                      label={t("admin.results.delete", {
                        email: result.user.email,
                        date: formatDate(result.createdAt, locale),
                      })}
                      confirmMessage={t("admin.results.deleteConfirm", {
                        email: result.user.email,
                      })}
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
