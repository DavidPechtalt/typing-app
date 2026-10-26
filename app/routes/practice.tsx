import { useRef, useState } from "react";
import {
  compareText,
  recordIncorrectPositions,
  summarizeResult,
} from "~/lib/typing";
import { PracticeText } from "~/components/PracticeText";
import type { Route } from "./+types/practice";

export const meta: Route.MetaFunction = () => [
  { title: "Practice | Typing App" },
];

export function loader() {
  return {
    practiceText:
      "A quiet morning is a good time to practice a new skill. Sit comfortably, relax your hands.",
  };
}

export default function Practice({ loaderData }: Route.ComponentProps) {
  const [attempt, setAttempt] = useState(0);

  return (
    <PracticeSession
      key={attempt}
      practiceText={loaderData.practiceText}
      onRestart={() => setAttempt(attempt + 1)}
    />
  );
}

type PracticeSessionProps = {
  practiceText: string;
  onRestart: () => void;
};

function PracticeSession({ practiceText, onRestart }: PracticeSessionProps) {
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
