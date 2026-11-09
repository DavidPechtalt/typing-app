// Admin: every practice text with its full content, and delete. Admins only.
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
import type { Route } from "./+types/admin.texts";

export const meta: Route.MetaFunction = () => [
  { title: "Texts · Admin · Keystroke" },
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
      source: true,
      sourceUrl: true,
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
  const t = await getTranslator(request);

  const parsed = deleteSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data<DeleteActionData>(
      { error: t("texts.err.id") },
      { status: 400 },
    );
  }

  // deleteMany doesn't throw when nothing matches; count tells us if the row was there.
  const { count } = await db.text.deleteMany({
    where: { id: parsed.data.id },
  });
  if (count === 0) {
    return data<DeleteActionData>(
      { error: t("texts.err.gone") },
      { status: 404 },
    );
  }
  // onDelete: Cascade removes the practices done on this text.
  return data<DeleteActionData>({ error: null });
}

export default function AdminTexts({ loaderData }: Route.ComponentProps) {
  const { texts } = loaderData;
  const t = useTranslate();
  const locale = useLocale();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-10">
      <PageHeader
        title={t("admin.tab.texts")}
        aside={plural(t, "admin.texts.count", texts.length)}
      >
        <AdminNav />
      </PageHeader>

      {texts.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">
          {t("admin.texts.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {texts.map((text) => (
            <li key={text.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 dir="auto" className="font-display text-xl">
                      {text.title}
                    </h2>
                    <span className="pill">{text.language}</span>
                    <span className="pill">{t(`source.${text.source}`)}</span>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {t("admin.texts.meta", {
                      owner: text.owner
                        ? text.owner.email
                        : t("admin.texts.noOwner"),
                      date: formatDate(text.createdAt, locale),
                      chars: Array.from(text.content).length,
                      practices: text._count.results,
                    })}
                    {text.sourceUrl && (
                      <>
                        {" · "}
                        <a
                          href={text.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          {t("admin.texts.source")}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <DeleteButton
                  id={text.id}
                  label={t("texts.delete", { title: text.title })}
                  confirmMessage={t("texts.deleteConfirm", {
                    title: text.title,
                    n: text._count.results,
                  })}
                />
              </div>

              <details className="group mt-3">
                <summary className="link text-sm font-medium">
                  <span className="group-open:hidden">
                    {t("admin.texts.show")}
                  </span>
                  <span className="hidden group-open:inline">
                    {t("admin.texts.hide")}
                  </span>
                </summary>
                <p
                  dir="auto"
                  className="mt-3 rounded-md bg-surface-3/60 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap"
                >
                  {text.content}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
