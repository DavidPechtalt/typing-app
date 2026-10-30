// Admin overview: how many users, texts and practices the app has. Admins only.
import { Link } from "react-router";
import { AdminNav } from "~/components/AdminNav";
import { PageHeader } from "~/components/PageHeader";
import { useTranslate } from "~/lib/use-translate";
import { requireAdmin } from "~/session.server";
import { db } from "~/db.server";
import type { Route } from "./+types/admin";

export const meta: Route.MetaFunction = () => [{ title: "Admin · Keystroke" }];

export async function loader({ request }: Route.LoaderArgs) {
  // Guard first: a non-admin is stopped here, before any database query runs.
  const admin = await requireAdmin(request);
  const [usersCount, textsCount, resultsCount] = await Promise.all([
    db.user.count(),
    db.text.count(),
    db.result.count(),
  ]);
  return { usersCount, textsCount, resultsCount, admin };
}

// One tile per count; label and description are translation keys.
const statTiles = [
  {
    key: "usersCount",
    label: "admin.tab.users",
    href: "/admin/users",
    description: "admin.users.desc",
  },
  {
    key: "textsCount",
    label: "admin.tab.texts",
    href: "/admin/texts",
    description: "admin.texts.desc",
  },
  {
    key: "resultsCount",
    label: "admin.tab.practices",
    href: "/admin/results",
    description: "admin.practices.desc",
  },
] as const;

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { admin } = loaderData;
  const t = useTranslate();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-10">
      <PageHeader
        title={t("admin.title")}
        aside={t("admin.signedInAs", { email: admin.email })}
      >
        <AdminNav />
      </PageHeader>

      <dl className="grid gap-3 sm:grid-cols-3">
        {statTiles.map((tile) => (
          <div
            key={tile.key}
            // relative + the link's after:inset-0 make the whole card clickable,
            // while the HTML stays a valid <dl> (a link can't wrap <dt>/<dd>).
            className="card relative p-5 transition-colors focus-within:border-accent hover:border-accent"
          >
            <dt className="eyebrow">
              <Link
                to={tile.href}
                className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
              >
                {t(tile.label)}
              </Link>
            </dt>
            {/* Fixed locale so server and browser format the same (no hydration mismatch). */}
            <dd className="mt-1 font-display text-4xl tabular-nums">
              {loaderData[tile.key].toLocaleString("en-US")}
            </dd>
            <dd className="mt-1 text-sm text-ink-muted">
              {t(tile.description)}
            </dd>
          </div>
        ))}
      </dl>

      <Link
        to="/admin/stats"
        className="card flex items-center justify-between gap-4 p-5 transition-colors hover:border-accent"
      >
        <div>
          <p className="font-display text-xl">{t("admin.tab.stats")}</p>
          <p className="text-sm text-ink-muted">{t("admin.statsLink")}</p>
        </div>
        <span
          aria-hidden="true"
          className="text-2xl text-ink-muted rtl:rotate-180"
        >
          →
        </span>
      </Link>
    </main>
  );
}
