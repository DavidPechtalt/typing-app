// Fetches a random Wikipedia article and starts a practice on it.
// POST here from any page; on success the user is redirected to /practice.
// The page itself is seen on a direct visit, or when Wikipedia could not be
// reached (the loader must not redirect: after a failed action React Router
// re-runs the loader, and a redirect there would hide the error).
import { data, Form, Link, redirect } from "react-router";
import { z } from "zod";
import { db } from "~/db.server";
import { WIKIPEDIA_LANGUAGES } from "~/lib/wikipedia";
import {
  fetchRandomPracticeText,
  WikipediaError,
} from "~/lib/wikipedia.server";
import { getTranslator } from "~/lib/locale.server";
import { useTranslate } from "~/lib/use-translate";
import { getUserId } from "~/session.server";
import type { Route } from "./+types/texts.wikipedia";

export const meta: Route.MetaFunction = () => [
  { title: "Wikipedia · Keystroke" },
];

const languageSchema = z.object({ language: z.enum(WIKIPEDIA_LANGUAGES) });

export async function action({ request }: Route.ActionArgs) {
  const t = await getTranslator(request);
  const parsed = languageSchema.safeParse(
    Object.fromEntries(await request.formData()),
  );
  if (!parsed.success) {
    return data(
      { error: t("wiki.err.language"), language: "en" as const },
      { status: 400 },
    );
  }
  const { language } = parsed.data;

  try {
    // Saved as a Text so a Result can reference it; never listed in the library.
    const article = await fetchRandomPracticeText(language);
    const text = await db.text.create({
      data: {
        title: article.title,
        content: article.content,
        language,
        sourceUrl: article.sourceUrl,
        source: "WIKIPEDIA",
        ownerId: await getUserId(request),
      },
      select: { id: true },
    });
    return redirect(`/practice?text=${text.id}`);
  } catch (error) {
    let message = t("wiki.err.unreachable");
    if (error instanceof WikipediaError) {
      message =
        error.status === undefined
          ? t("wiki.err.noArticle")
          : t("wiki.err.status", { status: error.status });
    }
    return data({ error: message, language }, { status: 502 });
  }
}

export default function Wikipedia({ actionData }: Route.ComponentProps) {
  const t = useTranslate();
  const failed = actionData !== undefined;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <p className="eyebrow">{t("wiki.title")}</p>
      <h1 className="font-display text-4xl">
        {failed ? t("wiki.failed") : t("wiki.idle")}
      </h1>
      {failed ? (
        <p role="alert" className="text-ink-muted">
          {actionData.error}
        </p>
      ) : (
        <p className="text-ink-muted">{t("wiki.idleBody")}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {failed ? (
          <Form method="post">
            <input type="hidden" name="language" value={actionData.language} />
            <button type="submit" className="btn-primary">
              {t("wiki.retry")}
            </button>
          </Form>
        ) : (
          (["en", "he"] as const).map((language) => (
            <Form key={language} method="post">
              <input type="hidden" name="language" value={language} />
              <button
                type="submit"
                className={language === "en" ? "btn-primary" : "btn-secondary"}
              >
                {t(`texts.wiki.${language}`)}
              </button>
            </Form>
          ))
        )}
        <Link to="/texts" className="btn-secondary">
          {t("wiki.back")}
        </Link>
      </div>
    </main>
  );
}
