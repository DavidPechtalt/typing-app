// The practice screen: shows a text, compares what the user types character by
// character, and saves the finished result for logged-in users.
import { useEffect, useRef, useState } from "react";
import {
  compareText,
  recordIncorrectPositions,
  summarizeResult,
} from "~/lib/typing";
import { PracticeText } from "~/components/PracticeText";
import { StatTile } from "~/components/StatTile";
import { db } from "~/db.server";
import type { Route } from "./+types/practice";
import { data, Form, Link, redirect, useFetcher } from "react-router";
import { z } from "zod";
import { getUserId } from "~/session.server";
import { getTranslator } from "~/lib/locale.server";
import { useTranslate } from "~/lib/use-translate";

// The tab title names the text being practised.
export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData
      ? `${loaderData.text.title} · Keystroke`
      : "Practice · Keystroke",
  },
];

// Picks a random built-in text, avoiding `excludeId` when there is a choice,
// so "Next text" never hands back the text that was just typed.
async function randomBuiltInTextId(
  excludeId: number | null,
  noTextsMessage: string,
): Promise<number> {
  const where = {
    source: "BUILTIN" as const,
    ...(excludeId === null ? {} : { id: { not: excludeId } }),
  };
  let count = await db.text.count({ where });
  if (count === 0) {
    count = await db.text.count({ where: { source: "BUILTIN" } });
    if (count === 0) {
      throw new Response(noTextsMessage, { status: 404 });
    }
    const only = await db.text.findFirst({
      where: { source: "BUILTIN" },
      select: { id: true },
    });
    return only!.id;
  }
  const text = await db.text.findFirst({
    where,
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * count),
    select: { id: true },
  });
  return text!.id;
}

export async function loader({ request }: Route.LoaderArgs) {
  const t = await getTranslator(request);
  const url = new URL(request.url);
  const requestedId = Number(url.searchParams.get("text"));
  const nextFrom = Number(url.searchParams.get("next"));

  // Redirect to a URL with the id: this loader re-runs after a result is saved,
  // and a random pick without a fixed id would swap the finished text.
  if (!Number.isInteger(requestedId) || requestedId <= 0) {
    const id = await randomBuiltInTextId(
      Number.isInteger(nextFrom) && nextFrom > 0 ? nextFrom : null,
      t("practice.noTexts"),
    );
    throw redirect(`/practice?text=${id}`);
  }

  const text = await db.text.findUnique({
    where: { id: requestedId },
    select: {
      id: true,
      title: true,
      content: true,
      language: true,
      source: true,
      sourceUrl: true,
    },
  });
  if (!text) {
    throw new Response(t("practice.notFound"), { status: 404 });
  }

  return { text };
}

// FormData only carries strings, so `coerce` turns "42.5" into 42.5 before checking.
const saveResultSchema = z.object({
  textId: z.coerce.number().int().positive(),
  wpm: z.coerce.number().min(0),
  accuracy: z.coerce.number().min(0).max(100),
  mistakes: z.coerce.number().int().min(0),
  corrections: z.coerce.number().int().min(0),
  durationMs: z.coerce.number().int().positive(),
});

export async function action({ request }: Route.ActionArgs) {
  const userId = await getUserId(request);
  if (userId === null) {
    return data(
      { saved: false, reason: "not-logged-in" as const },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const parsed = saveResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return data({ saved: false, reason: "invalid" as const }, { status: 400 });
  }

  const textExists = await db.text.findUnique({
    where: { id: parsed.data.textId },
    select: { id: true },
  });
  if (!textExists) {
    return data({ saved: false, reason: "invalid" as const }, { status: 400 });
  }

  // userId comes from the session, never from the form.
  await db.result.create({
    data: { userId, ...parsed.data },
  });

  return { saved: true as const, reason: null };
}

export default function Practice({ loaderData }: Route.ComponentProps) {
  const [attempt, setAttempt] = useState(0);

  return (
    <PracticeSession
      key={`${loaderData.text.id}-${attempt}`}
      text={loaderData.text}
      onRestart={() => setAttempt(attempt + 1)}
    />
  );
}

type PracticeSessionProps = {
  text: Route.ComponentProps["loaderData"]["text"];
  onRestart: () => void;
};

function PracticeSession({ text, onRestart }: PracticeSessionProps) {
  const t = useTranslate();
  const practiceText = text.content;
  const fetcher = useFetcher<typeof action>();
  const [typedText, setTypedText] = useState("");
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previouslyIncorrectPositions, setPreviouslyIncorrectPositions] =
    useState<Set<number>>(() => new Set());
  const characterStatuses = compareText(
    practiceText,
    typedText,
    previouslyIncorrectPositions,
  );
  const {
    correctedCharacterCount,
    mistakeCount,
    wordsPerMinute,
    charactersPerSecond,
    accuracy,
  } = summarizeResult(characterStatuses, elapsedSeconds);
  const targetCharacterCount = Array.from(practiceText).length;
  const typedCharacterCount = Array.from(typedText).length;
  const isFinished = typedCharacterCount >= targetCharacterCount;
  const textDirection = text.language === "he" ? "rtl" : "ltr";

  const hasSubmittedRef = useRef(false);

  // Saves once, when the text is completed.
  useEffect(() => {
    if (!isFinished || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    fetcher.submit(
      {
        textId: String(text.id),
        wpm: String(wordsPerMinute),
        accuracy: String(accuracy),
        mistakes: String(mistakeCount),
        corrections: String(correctedCharacterCount),
        durationMs: String(Math.round(elapsedSeconds * 1000)),
      },
      { method: "post" },
    );
    // Runs once when the text is completed; the stats are final at that point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  function handleTextChange(inputValue: string) {
    if (isFinished) {
      return;
    }

    const typedCharacters = Array.from(inputValue).slice(
      0,
      targetCharacterCount,
    );
    const value = typedCharacters.join("");

    if (typedCharacters.length > 0 && startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const nextStatuses = compareText(
      practiceText,
      value,
      previouslyIncorrectPositions,
    );
    const nextIncorrectPositions = recordIncorrectPositions(
      nextStatuses,
      previouslyIncorrectPositions,
    );

    if (
      typedCharacters.length >= targetCharacterCount &&
      startTimeRef.current !== null
    ) {
      setElapsedSeconds((performance.now() - startTimeRef.current) / 1000);
    }

    setPreviouslyIncorrectPositions(nextIncorrectPositions);
    setTypedText(value);
  }

  const progressPercent = (typedCharacterCount / targetCharacterCount) * 100;

  const nextText =
    text.source === "WIKIPEDIA" ? (
      <Form method="post" action="/texts/wikipedia">
        <input type="hidden" name="language" value={text.language} />
        <button type="submit" className="btn-secondary">
          {t("practice.nextArticle")}
        </button>
      </Form>
    ) : (
      <Link to={`/practice?next=${text.id}`} className="btn-secondary">
        {t("practice.next")}
      </Link>
    );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">{t("practice.eyebrow")}</span>
            <span className="pill">{text.language}</span>
            <SourceLabel source={text.source} sourceUrl={text.sourceUrl} />
            <span className="text-xs text-ink-faint">
              {t("practice.chars", { n: targetCharacterCount })}
            </span>
          </div>
          <h1 dir="auto" className="font-display text-4xl tracking-tight">
            {text.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextText}
          <Link to="/texts" className="btn-secondary">
            {t("practice.library")}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="font-mono text-xs text-ink-muted tabular-nums" dir="ltr">
          {typedCharacterCount} / {targetCharacterCount}
        </p>
      </div>

      <div className="card relative px-7 py-8 sm:px-12 sm:py-10">
        <textarea
          autoFocus
          id="typing-input"
          aria-label={t("practice.inputLabel")}
          value={typedText}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={isFinished}
          className="peer sr-only"
        />
        <label
          htmlFor="typing-input"
          dir={textDirection}
          className="block cursor-text text-start font-mono text-xl leading-loose whitespace-pre-wrap blur-[3px] transition peer-focus:blur-none peer-disabled:blur-none sm:text-2xl"
        >
          <PracticeText
            text={practiceText}
            statuses={characterStatuses}
            cursorIndex={isFinished ? null : typedCharacterCount}
          />
        </label>
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center peer-focus:hidden peer-disabled:hidden"
        >
          <span className="btn-primary">{t("practice.clickToStart")}</span>
        </p>
      </div>

      <ul
        aria-hidden="true"
        className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-muted"
      >
        <li className="flex items-center gap-2">
          <span className="font-mono text-wrong underline decoration-2 underline-offset-4">
            a
          </span>
          {t("practice.legend.wrong")}
        </li>
        <li className="flex items-center gap-2">
          <span className="font-mono text-fixed underline decoration-dotted underline-offset-4">
            a
          </span>
          {t("practice.legend.corrected")}
        </li>
        <li className="flex items-center gap-2">
          <span className="mark px-0.5 font-mono">a</span>
          {t("practice.legend.next")}
        </li>
      </ul>

      <section role="status" aria-label={t("practice.results")}>
        {isFinished && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
                {t("practice.finished", { n: Math.round(wordsPerMinute) })}
              </h2>
              <SaveStatus
                state={fetcher.state}
                data={fetcher.data}
                textId={text.id}
              />
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              <StatTile
                label={t("practice.accuracy")}
                value={`${accuracy.toFixed(1)}%`}
              />
              <StatTile
                label={t("practice.mistakes")}
                value={mistakeCount.toString()}
              />
              <StatTile
                label={t("practice.corrected")}
                value={correctedCharacterCount.toString()}
              />
              <StatTile
                label={t("practice.charsPerSec")}
                value={charactersPerSecond.toFixed(2)}
              />
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                autoFocus
                onClick={onRestart}
                className="btn-accent"
              >
                {t("practice.again")}
              </button>
              {nextText}
              <Link to="/texts" className="btn-secondary">
                {t("practice.choose")}
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

type SourceLabelProps = {
  source: "BUILTIN" | "UPLOAD" | "WIKIPEDIA";
  sourceUrl: string | null;
};

// Where the text came from; Wikipedia texts link back to the article (attribution).
function SourceLabel({ source, sourceUrl }: SourceLabelProps) {
  const t = useTranslate();
  if (source === "WIKIPEDIA" && sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="eyebrow link"
      >
        {t("source.link")}
      </a>
    );
  }
  return <span className="eyebrow">{t(`source.${source}`)}</span>;
}

type SaveStatusProps = {
  state: ReturnType<typeof useFetcher>["state"];
  data: Route.ComponentProps["actionData"];
  textId: number;
};

function SaveStatus({ state, data, textId }: SaveStatusProps) {
  const t = useTranslate();
  const className = "text-sm text-ink-muted";

  if (state !== "idle" || data === undefined) {
    return <p className={className}>{t("practice.saving")}</p>;
  }

  if (data.saved) {
    return (
      <p className={className}>
        <Link to="/history" className="link">
          {t("practice.saved")}
        </Link>
      </p>
    );
  }

  if (data.reason === "not-logged-in") {
    const [before, after] = t("practice.loginToSave").split("{login}");
    return (
      <p className={className}>
        {before}
        <Link
          to={`/login?redirectTo=/practice?text=${textId}`}
          className="link"
        >
          {t("practice.loginLink")}
        </Link>
        {after}
      </p>
    );
  }

  return <p className={className}>{t("practice.saveFailed")}</p>;
}
