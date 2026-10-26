import { Link } from "react-router";
import { getTextsForUser } from "~/models/text.server";
import { getUserId } from "~/session.server";
import type { Route } from "./+types/texts";

export const meta: Route.MetaFunction = () => [{ title: "Texts | Keyprint" }];

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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Texts</h1>
          <p className="mt-2 text-muted">
            Pick something to type, or bring your own.
          </p>
        </div>
        <Link
          to={isLoggedIn ? "/texts/new" : "/login?redirectTo=/texts/new"}
          className="btn btn-primary"
        >
          {isLoggedIn ? "+ Add a text" : "Log in to add your own"}
        </Link>
      </div>

      {isLoggedIn && (
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold tracking-tight">Your texts</h2>
          {ownTexts.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-line p-6 text-muted">
              Nothing here yet.{" "}
              <Link to="/texts/new" className="link">
                Paste your first text
              </Link>{" "}
              and it will show up here.
            </p>
          ) : (
            <TextList texts={ownTexts} />
          )}
        </section>
      )}

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold tracking-tight">Built-in texts</h2>
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
    <ul className="grid gap-5 sm:grid-cols-2">
      {texts.map((text) => (
        <li key={text.id} className="card flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold tracking-tight">{text.title}</h3>
            <span
              className={`tag shrink-0 ${text.language === "he" ? "bg-pink" : "bg-sun"}`}
            >
              {text.language === "he" ? "Hebrew" : "English"}
            </span>
          </div>
          <p
            lang={text.language}
            dir={text.language === "he" ? "rtl" : "ltr"}
            className="line-clamp-2 font-mono text-sm text-muted"
          >
            {text.content}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-sm text-muted">
              {Array.from(text.content).length} characters
            </span>
            <Link
              to={`/practice/${text.id}`}
              aria-label={`Practise ${text.title}`}
              className="btn btn-secondary btn-small"
            >
              Practise →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
