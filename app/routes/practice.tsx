import { useEffect, useRef, useState } from "react";
import {
  compareText,
  recordIncorrectPositions,
  summarizeResult,
} from "~/lib/typing";
import { PracticeText } from "~/components/PracticeText";
import { db } from "~/db.server";
import type { Route } from "./+types/practice";
import { data, Link, useFetcher } from "react-router";
import { z } from "zod";
import { getUserId } from "~/session.server";

export const meta: Route.MetaFunction = () => [
  { title: "Practice | Typing App" },
];

export async function loader() {
  // Built-in texts have no owner. Take the first one by id until text selection exists.
  const text = await db.text.findFirst({
    where: { ownerId: null },
    orderBy: { id: "asc" },
  });

  if (!text) {
    throw new Response("No practice texts yet. Run `npm run db:seed`.", {
      status: 404,
    });
  }

  return { practiceText: text.content, textId: text.id };
}

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
      key={attempt}
      practiceText={loaderData.practiceText}
      textId={loaderData.textId}
      onRestart={() => setAttempt(attempt + 1)}
    />
  );
}

type PracticeSessionProps = {
  practiceText: string;
  textId: number;
  onRestart: () => void;
};

function PracticeSession({
  practiceText,
  textId,
  onRestart,
}: PracticeSessionProps) {
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

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (!isFinished || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    fetcher.submit(
      {
        textId: String(textId),
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

  useEffect(() => {
    if (!isFinished) return;

    fetcher.submit({ textId: String(practiceText) });
  });
  const progressPercent = (typedCharacterCount / targetCharacterCount) * 100;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="font-mono text-sm text-slate-500 tabular-nums dark:text-slate-400">
          {typedCharacterCount} / {targetCharacterCount}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className="h-full bg-blue-600 transition-[width] duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <textarea
          autoFocus
          id="typing-input"
          aria-label="Type the practice passage"
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
          className="block cursor-text font-mono text-xl leading-loose whitespace-pre-wrap blur-sm transition peer-focus:blur-none peer-disabled:blur-none sm:text-2xl"
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
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Click here to start typing
          </span>
        </p>
      </div>

      <ul
        aria-hidden="true"
        className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400"
      >
        <li className="flex items-center gap-2">
          <span className="font-mono text-red-600 underline decoration-2 underline-offset-4 dark:text-red-400">
            a
          </span>
          Wrong
        </li>
        <li className="flex items-center gap-2">
          <span className="rounded-sm bg-amber-100 px-1 font-mono dark:bg-amber-500/20">
            a
          </span>
          Corrected
        </li>
        <li className="flex items-center gap-2">
          <span className="rounded-sm bg-blue-100 px-1 font-mono shadow-[inset_2px_0_0_var(--color-blue-600)] dark:bg-blue-500/20">
            a
          </span>
          Next character
        </li>
      </ul>

      <section role="status" aria-label="Typing results">
        {isFinished && (
          <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="WPM" value={Math.round(wordsPerMinute).toString()} />
              <Stat label="Accuracy" value={`${accuracy.toFixed(1)}%`} />
              <Stat label="Mistakes" value={mistakeCount.toString()} />
              <Stat
                label="Corrected"
                value={correctedCharacterCount.toString()}
              />
              <Stat
                label="Chars / sec"
                value={charactersPerSecond.toFixed(2)}
              />
            </dl>
            <SaveStatus state={fetcher.state} data={fetcher.data} />
            <button
              type="button"
              autoFocus
              onClick={onRestart}
              className="self-center rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Restart
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

type SaveStatusProps = {
  state: ReturnType<typeof useFetcher>["state"];
  data: Route.ComponentProps["actionData"];
};

function SaveStatus({ state, data }: SaveStatusProps) {
  const className = "text-center text-sm text-slate-600 dark:text-slate-400";

  if (state !== "idle" || data === undefined) {
    return <p className={className}>Saving your result…</p>;
  }

  if (data.saved) {
    return <p className={className}>Result saved to your history.</p>;
  }

  if (data.reason === "not-logged-in") {
    return (
      <p className={className}>
        <Link to="/login?redirectTo=/practice" className="underline">
          Log in
        </Link>{" "}
        to save your results.
      </p>
    );
  }

  return <p className={className}>Could not save this result.</p>;
}

type StatProps = {
  label: string;
  value: string;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}
