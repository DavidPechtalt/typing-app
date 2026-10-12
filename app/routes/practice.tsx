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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Practice
      </h1>
      <label
        htmlFor="typing-input"
        className="block max-w-4xl cursor-text whitespace-pre-wrap text-center text-2xl leading-relaxed"
      >
        <PracticeText
          text={practiceText}
          statuses={characterStatuses}
          cursorIndex={isFinished ? null : typedCharacterCount}
        />
      </label>
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
        className="sr-only"
      />
      <section
        role="status"
        aria-label="Typing results"
        className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-300"
      >
        {isFinished && (
          <>
            <p>WPM: {Math.round(wordsPerMinute)}</p>
            <p>Accuracy: {accuracy.toFixed(1)}%</p>
            <p>Mistakes: {mistakeCount}</p>
            <p>Corrected: {correctedCharacterCount}</p>
            <p>Characters per second: {charactersPerSecond.toFixed(2)}</p>
            <button
              type="button"
              autoFocus
              onClick={onRestart}
              className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
            >
              Restart
            </button>
          </>
        )}
      </section>
    </main>
  );
}
