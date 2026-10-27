// Admin: list every user and delete accounts. Admins only.
import { data } from "react-router";
import { z } from "zod";
import { AdminNav } from "~/components/AdminNav";
import { DeleteButton, type DeleteActionData } from "~/components/DeleteButton";
import { db } from "~/db.server";
import { formatDate } from "~/lib/format";
import { requireAdmin } from "~/session.server";
import type { Route } from "./+types/admin.users";

export const meta: Route.MetaFunction = () => [
  { title: "Users | Admin | Typing App" },
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

  const parsed = deleteSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data<DeleteActionData>(
      { error: "Invalid user id." },
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
      { error: "This user no longer exists." },
      { status: 404 },
    );
  }
  // Checked on the server, not only hidden in the UI: admin accounts
  // (including your own) can't be deleted here, so the app always keeps an admin.
  if (target.role === "ADMIN") {
    return data<DeleteActionData>(
      { error: "Admin accounts can't be deleted." },
      { status: 403 },
    );
  }

  // onDelete: Cascade in the schema removes this user's texts and results too.
  await db.user.delete({ where: { id: parsed.data.id } });
  return data<DeleteActionData>({ error: null });
}

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {users.length} {users.length === 1 ? "account" : "accounts"}
          </p>
        </div>
        <AdminNav />
      </div>

      {/* overflow-x-auto scrolls the table sideways on a phone; relative keeps the absolutely positioned sr-only header inside that scroll box. */}
      <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
            <tr>
              {/* scope="col" tells screen readers each header labels a column. */}
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Role
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Joined
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Texts
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Practices
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  {/* Admins get a blue badge so they stand out in the list. */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {user.role === "ADMIN" ? "Admin" : "User"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {user._count.texts}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {user._count.results}
                </td>
                <td className="px-4 py-3 text-right">
                  {/* No button for admins: the action refuses anyway, so don't offer it. */}
                  {user.role === "ADMIN" ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Protected
                    </span>
                  ) : (
                    <DeleteButton
                      id={user.id}
                      label={`Delete user ${user.email}`}
                      confirmMessage={`Delete ${user.email}? Their ${user._count.texts} texts and ${user._count.results} practices will be deleted too.`}
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
