import { Link } from "react-router";
import { getTextsForUser } from "~/models/text.server";
import { getUserId } from "~/session.server";
import type { Route } from "./+types/texts";

export const meta: Route.MetaFunction = () => [{ title: "Texts | Typing App" }];

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const texts = await getTextsForUser(userId);

  return {
    isLoggedIn: userId !== null,
    builtInTexts: texts.filter((text) => text.ownerId === null),
    ownTexts: texts.filter((text) => text.ownerId !== null),
  };
}

export default function Texts({ loaderData }: Route.ComponentProps) {
  const { isLoggedIn, builtInTexts, ownTexts } = loaderData;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Texts</h1>
        <Link
          to={isLoggedIn ? "/texts/new" : "/login?redirectTo=/texts/new"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {isLoggedIn ? "Add a text" : "Log in to add your own text"}
        </Link>
      </div>

      {isLoggedIn && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Your texts</h2>
          {ownTexts.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              You haven&apos;t added any texts yet. Paste one in with{" "}
              <Link
                to="/texts/new"
                className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
              >
                Add a text
              </Link>
              .
            </p>
          ) : (
            <TextList texts={ownTexts} />
          )}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Built-in texts</h2>
        <TextList texts={builtInTexts} />
      </section>
    </main>
  );
}

type TextListProps = {
  texts: {
    id: number;
    title: string;
    content: string;
    language: "en" | "he";
  }[];
};

function TextList({ texts }: TextListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {texts.map((text) => (
        <li
          key={text.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{text.title}</h3>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
              {text.language === "he" ? "Hebrew" : "English"}
            </span>
          </div>
          <p
            lang={text.language}
            dir={text.language === "he" ? "rtl" : "ltr"}
            className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400"
          >
            {text.content}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {Array.from(text.content).length} characters
            </span>
            <Link
              to={`/practice/${text.id}`}
              aria-label={`Practise ${text.title}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              Practise →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
