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
import { getCharacterClass, PracticeText } from "~/components/PracticeText";
import { Stat } from "~/components/Stat";
import { createResult } from "~/models/result.server";
import { getFirstBuiltInText, getTextForUser } from "~/models/text.server";
import { getUserId } from "~/session.server";
import type { Route } from "./+types/practice";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.text.title ?? "Practice"} | Keyprint` },
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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <Link to="/texts" className="link text-sm">
            ← Choose another text
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>
        <p className="tag bg-card font-mono text-sm text-ink tabular-nums">
          {typedCharacterCount} / {targetCharacterCount}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="h-3 overflow-hidden rounded-full border-2 border-line bg-card"
      >
        <div
          className="h-full bg-pink transition-[width] duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div
        lang={language}
        dir={language === "he" ? "rtl" : "ltr"}
        className="card relative p-6 sm:p-10"
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
          className={`block cursor-text ${language === "he" ? "font-sans" : "font-mono"} text-xl leading-[2.1] whitespace-pre-wrap blur-sm transition peer-focus:blur-none peer-disabled:blur-none sm:text-2xl`}
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
          <span className="rounded-full border-2 border-line bg-sun px-5 py-2 font-semibold text-on-accent shadow-[3px_3px_0_var(--shadow)]">
            Click here and start typing
          </span>
        </p>
      </div>

      <ul
        aria-hidden="true"
        className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
      >
        <LegendItem className={getCharacterClass("incorrect", false)}>
          Wrong key
        </LegendItem>
        <LegendItem className={getCharacterClass("corrected", false)}>
          Fixed mistake
        </LegendItem>
        <LegendItem className={getCharacterClass("pending", true)}>
          Next key
        </LegendItem>
      </ul>

      <section role="status" aria-label="Typing results">
        {isFinished && (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
              <div className="card flex flex-col justify-between gap-2 bg-pink p-5 text-on-accent">
                <p className="font-semibold">Words per minute</p>
                <p className="font-mono text-7xl font-semibold tracking-tight tabular-nums [text-shadow:4px_4px_0_var(--sun)]">
                  {Math.round(wordsPerMinute)}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                  label="Accuracy"
                  value={`${accuracy.toFixed(1)}%`}
                  highlight
                />
                <Stat label="Mistakes" value={mistakeCount.toString()} />
                <Stat
                  label="Fixed"
                  value={correctedCharacterCount.toString()}
                />
                <Stat
                  label="Keys per second"
                  value={charactersPerSecond.toFixed(2)}
                />
              </dl>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                autoFocus
                onClick={onRestart}
                className="btn btn-primary"
              >
                Try again
              </button>
              <SaveStatus
                isLoggedIn={isLoggedIn}
                loginPath={`/login?redirectTo=${encodeURIComponent(`/practice/${textId}`)}`}
                state={saveFetcher.state}
                response={saveFetcher.data}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

type LegendItemProps = {
  className: string;
  children: string;
};

function LegendItem({ className, children }: LegendItemProps) {
  return (
    <li className="flex items-center gap-2">
      <span className={`px-1 font-mono ${className}`}>a</span>
      {children}
    </li>
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
  let message;

  if (!isLoggedIn) {
    message = (
      <>
        <Link to={loginPath} className="link">
          Log in
        </Link>{" "}
        to keep your results and track your progress.
      </>
    );
  } else if (state !== "idle") {
    message = "Saving your result…";
  } else if (response?.saved) {
    message = (
      <>
        Saved to your{" "}
        <Link to="/history" className="link">
          history
        </Link>
        .
      </>
    );
  } else if (response?.error) {
    message = (
      <>
        <span className="tag mr-2 bg-pink">Not saved</span>
        {response.error}
      </>
    );
  }

  return <p className="text-center text-sm text-muted">{message}</p>;
}
