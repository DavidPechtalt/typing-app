// Admin: list every user and delete accounts. Admins only.
import { data } from "react-router";
import { z } from "zod";
import { AdminNav } from "~/components/AdminNav";
import { DeleteButton, type DeleteActionData } from "~/components/DeleteButton";
import { PageHeader } from "~/components/PageHeader";
import { db } from "~/db.server";
import { formatDate } from "~/lib/format";
import { plural } from "~/lib/i18n";
import { getTranslator } from "~/lib/locale.server";
import { useLocale, useTranslate } from "~/lib/use-translate";
import { requireAdmin } from "~/session.server";
import type { Route } from "./+types/admin.users";

export const meta: Route.MetaFunction = () => [
  { title: "Users · Admin · Keystroke" },
];

export async function loader({ request }: Route.LoaderArgs) {
  // Guard first, before any query.
  await requireAdmin(request);
  const users = await db.user.findMany({
    // Newest accounts first.
    orderBy: { createdAt: "desc" },
    // Never select passwordHash: loader data is sent to the browser.
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      // _count asks Postgres to count the related rows instead of loading them.
      _count: { select: { texts: true, results: true } },
    },
  });
  return { users };
}

// FormData values are strings, so coerce turns "12" into 12 before checking it.
const deleteSchema = z.object({ id: z.coerce.number().int().positive() });

export async function action({ request }: Route.ActionArgs) {
  // Every action needs the guard too: anyone can POST here with curl, page or not.
  await requireAdmin(request);
  const t = await getTranslator(request);

  const parsed = deleteSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data<DeleteActionData>(
      { error: t("admin.users.err.id") },
      { status: 400 },
    );
  }

  const target = await db.user.findUnique({
    where: { id: parsed.data.id },
    select: { role: true },
  });
  if (!target) {
    // Probably deleted already, e.g. in another tab.
    return data<DeleteActionData>(
      { error: t("admin.users.err.gone") },
      { status: 404 },
    );
  }
  // Checked on the server, not only hidden in the UI: admin accounts
  // (including your own) can't be deleted here, so the app always keeps an admin.
  if (target.role === "ADMIN") {
    return data<DeleteActionData>(
      { error: t("admin.users.err.admin") },
      { status: 403 },
    );
  }

  // onDelete: Cascade in the schema removes this user's texts and results too.
  await db.user.delete({ where: { id: parsed.data.id } });
  return data<DeleteActionData>({ error: null });
}

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;
  const t = useTranslate();
  const locale = useLocale();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-10">
      <PageHeader
        title={t("admin.tab.users")}
        aside={plural(t, "admin.users.count", users.length)}
      >
        <AdminNav />
      </PageHeader>

      {/* overflow-x-auto scrolls the table sideways on a phone; relative keeps the absolutely positioned sr-only header inside that scroll box. */}
      <div className="card relative overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="eyebrow border-b border-line">
            <tr>
              {/* scope="col" tells screen readers each header labels a column. */}
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("col.email")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("col.role")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("col.joined")}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                {t("col.texts")}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                {t("col.practices")}
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">{t("col.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td
                  dir="ltr"
                  className="px-4 py-3 text-start font-medium whitespace-nowrap"
                >
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`pill ${user.role === "ADMIN" ? "bg-accent text-accent-ink" : ""}`}
                  >
                    {user.role === "ADMIN"
                      ? t("admin.role.admin")
                      : t("admin.role.user")}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                  {formatDate(user.createdAt, locale)}
                </td>
                <td className="px-4 py-3 text-end font-mono tabular-nums">
                  {user._count.texts}
                </td>
                <td className="px-4 py-3 text-end font-mono tabular-nums">
                  {user._count.results}
                </td>
                <td className="px-4 py-3 text-end">
                  {/* No button for admins: the action refuses anyway, so don't offer it. */}
                  {user.role === "ADMIN" ? (
                    <span className="text-xs text-ink-faint">
                      {t("admin.protected")}
                    </span>
                  ) : (
                    <DeleteButton
                      id={user.id}
                      label={t("admin.users.delete", { email: user.email })}
                      confirmMessage={t("admin.users.deleteConfirm", {
                        email: user.email,
                        texts: user._count.texts,
                        practices: user._count.results,
                      })}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
