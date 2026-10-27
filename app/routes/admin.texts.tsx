// Admin: list every practice text and delete inappropriate ones. Admins only.
import { data } from "react-router";
import { z } from "zod";
import { AdminNav } from "~/components/AdminNav";
import { DeleteButton, type DeleteActionData } from "~/components/DeleteButton";
import { db } from "~/db.server";
import { formatDate } from "~/lib/format";
import { requireAdmin } from "~/session.server";
import type { Route } from "./+types/admin.texts";

export const meta: Route.MetaFunction = () => [
  { title: "Texts | Admin | Typing App" },
];

export async function loader({ request }: Route.LoaderArgs) {
  // Guard first, before any query.
  await requireAdmin(request);
  const texts = await db.text.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      language: true,
      createdAt: true,
      // null for built-in texts (ownerId is null).
      owner: { select: { email: true } },
      _count: { select: { results: true } },
    },
  });
  return { texts };
}

const deleteSchema = z.object({ id: z.coerce.number().int().positive() });

export async function action({ request }: Route.ActionArgs) {
  // The guard again: the page being admin-only doesn't protect a direct POST.
  await requireAdmin(request);

  const parsed = deleteSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data<DeleteActionData>(
      { error: "Invalid text id." },
      { status: 400 },
    );
  }

  // deleteMany doesn't throw when nothing matches; count tells us if the row was there.
  const { count } = await db.text.deleteMany({
    where: { id: parsed.data.id },
  });
  if (count === 0) {
    return data<DeleteActionData>(
      { error: "This text no longer exists." },
      { status: 404 },
    );
  }
  // onDelete: Cascade removes the practices done on this text.
  return data<DeleteActionData>({ error: null });
}

export default function AdminTexts({ loaderData }: Route.ComponentProps) {
  const { texts } = loaderData;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Texts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {texts.length} {texts.length === 1 ? "text" : "texts"}
          </p>
        </div>
        <AdminNav />
      </div>

      {texts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No texts yet. Run <code className="font-mono">npm run db:seed</code>{" "}
          to add the built-in ones.
        </p>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Text
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Owner
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Added
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
              {texts.map((text) => (
                <tr key={text.id} className="align-top">
                  {/* max-w + line-clamp keep a long text to two lines; the admin sees enough to judge it. */}
                  <td className="max-w-xs min-w-56 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span dir="auto" className="font-medium">
                        {text.title}
                      </span>
                      <span className="rounded-sm bg-slate-100 px-1.5 font-mono text-xs text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                        {text.language}
                      </span>
                    </div>
                    {/* dir="auto": the browser picks right-to-left for Hebrew texts. */}
                    <p
                      dir="auto"
                      className="mt-1 line-clamp-2 text-slate-600 dark:text-slate-400"
                    >
                      {text.content}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {text.owner ? text.owner.email : "Built-in"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {formatDate(text.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {text._count.results}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton
                      id={text.id}
                      label={`Delete text ${text.title}`}
                      confirmMessage={`Delete "${text.title}"? Its ${text._count.results} practices will be deleted too.`}
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
