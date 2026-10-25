// Admin overview: how many users, texts and practices the app has. Admins only.
import { requireAdmin } from "~/session.server";
import { db } from "~/db.server";
import type { Route } from "./+types/admin";

export const meta: Route.MetaFunction = () => [{ title: "Admin | Typing App" }];

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

type LoaderData = Awaited<ReturnType<typeof loader>>;

type CountKey = keyof Omit<LoaderData, "admin">;

type StatTile = {
  key: CountKey;
  label: string;
  description: string;
};

const statTiles: StatTile[] = [
  { key: "usersCount", label: "Users", description: "Registered accounts" },
  {
    key: "textsCount",
    label: "Texts",
    description: "Built-in and uploaded texts",
  },
  {
    key: "resultsCount",
    label: "Practices",
    description: "Finished practices saved",
  },
];

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { admin } = loaderData;
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Signed in as {admin.email}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {statTiles.map((tile) => (
          <div
            key={tile.key}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {tile.label}
            </dt>
            {/* Fixed locale so server and browser format the same (no hydration mismatch). */}
            <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums">
              {loaderData[tile.key].toLocaleString("en-US")}
            </dd>
            <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {tile.description}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
