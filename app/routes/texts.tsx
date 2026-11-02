// The text library: built-in texts, the logged-in user's own uploads, and the
// Wikipedia launcher. The action deletes one of the user's own texts.
import { data, Form, Link, useNavigation } from "react-router";
import { z } from "zod";
import { DeleteButton, type DeleteActionData } from "~/components/DeleteButton";
import { PageHeader } from "~/components/PageHeader";
import { db } from "~/db.server";
import { formatDate } from "~/lib/format";
import { getTranslator } from "~/lib/locale.server";
import { useLocale, useTranslate } from "~/lib/use-translate";
import { getUserId, requireUserId } from "~/session.server";
import type { Route } from "./+types/texts";

export const meta: Route.MetaFunction = () => [{ title: "Texts · Keystroke" }];

// The fields a text card needs. Content is loaded only to count characters
// and show a short preview.
const textSelect = {
  id: true,
  title: true,
  content: true,
  language: true,
  createdAt: true,
  _count: { select: { results: true } },
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const [builtIn, mine] = await Promise.all([
    db.text.findMany({
      where: { source: "BUILTIN" },
      orderBy: { id: "asc" },
      select: textSelect,
    }),
    userId === null
      ? Promise.resolve([])
      : db.text.findMany({
          where: { ownerId: userId, source: "UPLOAD" },
          orderBy: { createdAt: "desc" },
          select: textSelect,
        }),
  ]);
  return { builtIn, mine, isLoggedIn: userId !== null };
}

const deleteSchema = z.object({ id: z.coerce.number().int().positive() });

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
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
  // ownerId in the where clause is the ownership check.
  const { count } = await db.text.deleteMany({
    where: { id: parsed.data.id, ownerId: userId },
  });
  if (count === 0) {
    return data<DeleteActionData>(
      { error: t("texts.err.gone") },
      { status: 404 },
    );
  }
  return data<DeleteActionData>({ error: null });
}

export default function Texts({ loaderData }: Route.ComponentProps) {
  const { builtIn, mine, isLoggedIn } = loaderData;
  const t = useTranslate();
  const navigation = useNavigation();
  const isFetchingWikipedia =
    navigation.state !== "idle" && navigation.formAction === "/texts/wikipedia";
  const fetchingLanguage = navigation.formData?.get("language");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-10">
      <PageHeader title={t("texts.title")} aside={t("texts.aside")}>
        <p className="max-w-2xl text-ink-muted">{t("texts.lead")}</p>
      </PageHeader>

      <section aria-labelledby="wiki" className="card">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="eyebrow">{t("texts.wiki.eyebrow")}</p>
            <h2 id="wiki" className="font-display text-3xl">
              {t("texts.wiki.title")}
            </h2>
            <p className="text-sm text-ink-muted">{t("texts.wiki.body")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(["en", "he"] as const).map((language) => (
              <Form key={language} method="post" action="/texts/wikipedia">
                <input type="hidden" name="language" value={language} />
                <button
                  type="submit"
                  disabled={isFetchingWikipedia}
                  className={
                    language === "en" ? "btn-primary" : "btn-secondary"
                  }
                >
                  {isFetchingWikipedia && fetchingLanguage === language
                    ? t("texts.wiki.fetching")
                    : t(`texts.wiki.${language}`)}
                </button>
              </Form>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="mine" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line-strong pt-4">
          <h2 id="mine" className="font-display text-2xl">
            {t("texts.mine")}
          </h2>
          {isLoggedIn ? (
            <Link to="/texts/new" className="btn-primary px-4 py-2 text-sm">
              + {t("texts.upload")}
            </Link>
          ) : (
            <Link
              to="/login?redirectTo=/texts/new"
              className="btn-secondary px-4 py-2 text-sm"
            >
              {t("texts.loginToUpload")}
            </Link>
          )}
        </div>
        {mine.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            {isLoggedIn ? t("texts.mine.empty") : t("texts.mine.guest")}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {mine.map((text) => (
              <TextCard key={text.id} text={text} deletable />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="builtin" className="flex flex-col gap-4">
        <h2 id="builtin" className="section-title">
          {t("texts.builtin")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {builtIn.map((text) => (
            <TextCard key={text.id} text={text} />
          ))}
        </ul>
      </section>
    </main>
  );
}

type TextCardProps = {
  text: Route.ComponentProps["loaderData"]["builtIn"][number];
  deletable?: boolean;
};

function TextCard({ text, deletable = false }: TextCardProps) {
  const t = useTranslate();
  const locale = useLocale();
  const characterCount = Array.from(text.content).length;
  return (
    <li className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 dir="auto" className="font-display text-xl">
          {text.title}
        </h3>
        <span className="pill">{text.language}</span>
      </div>
      <p dir="auto" className="line-clamp-3 text-sm text-ink-muted">
        {text.content}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-ink-faint">
        <span>
          {t("texts.meta", {
            chars: characterCount,
            practices: text._count.results,
            date: formatDate(text.createdAt, locale),
          })}
        </span>
        <div className="flex items-center gap-2">
          {deletable && (
            <DeleteButton
              id={text.id}
              label={t("texts.delete", { title: text.title })}
              confirmMessage={t("texts.deleteConfirm", {
                title: text.title,
                n: text._count.results,
              })}
            />
          )}
          <Link
            to={`/practice?text=${text.id}`}
            className="btn-primary px-4 py-1.5 text-sm"
          >
            {t("texts.practise")}
          </Link>
        </div>
      </div>
    </li>
  );
}
