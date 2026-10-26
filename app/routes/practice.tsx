import { useRef, useState } from "react";
import { data, Link, useFetcher } from "react-router";
import { z } from "zod";
import { scorePractice } from "~/lib/score";
import {
  compareText,
  recordIncorrectPositions,
  summarizeResult,
} from "~/lib/typing";
import { savePracticeSchema } from "~/lib/validation";
import { PracticeText } from "~/components/PracticeText";
import { createResult } from "~/models/result.server";
import { getFirstBuiltInText, getTextForUser } from "~/models/text.server";
import { getUserId } from "~/session.server";
import type { Route } from "./+types/practice";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.text.title ?? "Practice"} | Typing App` },
];

const textIdSchema = z.coerce.number().int().positive();

// /practice opens the first built-in text; /practice/5 opens text 5.
export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  let text;

  if (params.textId === undefined) {
    text = await getFirstBuiltInText();
  } else {
    const textId = textIdSchema.safeParse(params.textId);
    text = textId.success ? await getTextForUser(textId.data, userId) : null;
  }

  if (!text) {
    throw data("Text not found.", { status: 404 });
  }

  return { text, isLoggedIn: userId !== null };
}

type SaveResponse = { saved: boolean; error: string | null };

// Saves a finished practice. The browser sends what was typed, and the server
// calculates the result itself with the same functions the page uses.
export async function action({ request }: Route.ActionArgs) {
  const userId = await getUserId(request);

  if (userId === null) {
    return data<SaveResponse>(
      { saved: false, error: "Log in to save your results." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const parsed = savePracticeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data<SaveResponse>(
      { saved: false, error: "The result could not be read." },
      { status: 400 },
    );
  }

  const { textId, typedText, incorrectPositions, durationMs } = parsed.data;
  const text = await getTextForUser(textId, userId);

  if (!text) {
    return data<SaveResponse>(
      { saved: false, error: "Text not found." },
      { status: 404 },
    );
  }

  const score = scorePractice(
    text.content,
    typedText,
    incorrectPositions,
    durationMs,
  );

  if (!score.ok) {
    return data<SaveResponse>(
      { saved: false, error: score.reason },
      { status: 400 },
    );
  }

  await createResult({
    userId,
    textId,
    wpm: score.summary.wordsPerMinute,
    accuracy: score.summary.accuracy,
    mistakes: score.summary.mistakeCount,
    corrections: score.summary.correctedCharacterCount,
    durationMs,
  });

  return data<SaveResponse>({ saved: true, error: null });
}

export default function Practice({ loaderData }: Route.ComponentProps) {
  const { text, isLoggedIn } = loaderData;
  const [attempt, setAttempt] = useState(0);

  return (
    <PracticeSession
      // A new text or a restart starts a fresh session.
      key={`${text.id}-${attempt}`}
      textId={text.id}
      isLoggedIn={isLoggedIn}
      title={text.title}
      practiceText={text.content}
      language={text.language}
      onRestart={() => setAttempt(attempt + 1)}
    />
  );
}

type PracticeSessionProps = {
  textId: number;
  isLoggedIn: boolean;
  title: string;
  practiceText: string;
  language: "en" | "he";
  onRestart: () => void;
};

function PracticeSession({
  textId,
  isLoggedIn,
  title,
  practiceText,
  language,
  onRestart,
}: PracticeSessionProps) {
  const [typedText, setTypedText] = useState("");
  const saveFetcher = useFetcher<SaveResponse>();
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
      const durationMs = Math.round(performance.now() - startTimeRef.current);
      setElapsedSeconds(durationMs / 1000);

      if (isLoggedIn) {
        // useFetcher posts to this route's action without leaving the page.
        saveFetcher.submit(
          {
            textId,
            typedText: value,
            incorrectPositions: [...nextIncorrectPositions].join(","),
            durationMs,
          },
          { method: "post" },
        );
      }
    }

    setPreviouslyIncorrectPositions(nextIncorrectPositions);
    setTypedText(value);
  }

  const progressPercent = (typedCharacterCount / targetCharacterCount) * 100;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <Link
            to="/texts"
            className="text-sm font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
          >
            ← Choose another text
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
        </div>
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

      <div
        lang={language}
        dir={language === "he" ? "rtl" : "ltr"}
        className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900"
      >
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
          className={`block cursor-text ${language === "he" ? "font-sans" : "font-mono"} text-xl leading-loose whitespace-pre-wrap blur-sm transition peer-focus:blur-none peer-disabled:blur-none sm:text-2xl`}
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
            <button
              type="button"
              autoFocus
              onClick={onRestart}
              className="self-center rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Restart
            </button>
            <SaveStatus
              isLoggedIn={isLoggedIn}
              loginPath={`/login?redirectTo=${encodeURIComponent(`/practice/${textId}`)}`}
              state={saveFetcher.state}
              response={saveFetcher.data}
            />
          </div>
        )}
      </section>
    </main>
  );
}

type SaveStatusProps = {
  isLoggedIn: boolean;
  loginPath: string;
  state: "idle" | "loading" | "submitting";
  response: SaveResponse | undefined;
};

function SaveStatus({
  isLoggedIn,
  loginPath,
  state,
  response,
}: SaveStatusProps) {
  const linkClassName =
    "font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400";
  let message;

  if (!isLoggedIn) {
    message = (
      <>
        <Link to={loginPath} className={linkClassName}>
          Log in
        </Link>{" "}
        to save your results and see your progress.
      </>
    );
  } else if (state !== "idle") {
    message = "Saving your result…";
  } else if (response?.saved) {
    message = (
      <>
        Result saved.{" "}
        <Link to="/history" className={linkClassName}>
          See your history
        </Link>
      </>
    );
  } else if (response?.error) {
    message = (
      <span className="text-red-600 dark:text-red-400">
        Not saved: {response.error}
      </span>
    );
  }

  return (
    <p className="text-center text-sm text-slate-600 dark:text-slate-400">
      {message}
    </p>
  );
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
