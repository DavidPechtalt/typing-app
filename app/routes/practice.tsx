import { useEffect, useRef, useState } from "react";
import {
  compareText,
  recordIncorrectPositions,
  summarizeResult,
} from "../lib/typing";

const practiceText =
  "A quiet morning is a good time to practice a new skill. Sit comfortably, relax your hands.";

export default function Practice() {
  const [typedText, setTypedText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const focusAfterRestartRef = useRef(false);
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focusAfterRestartRef.current) {
      inputRef.current?.focus();
      focusAfterRestartRef.current = false;
    }
  }, [typedText]);

  function handleRestart() {
    focusAfterRestartRef.current = true;
    setTypedText("");
    setElapsedSeconds(0);
    setPreviouslyIncorrectPositions(new Set());
    startTimeRef.current = null;
  }

  function handleTextChange(value: string) {
    if (isFinished) {
      return;
    }

    if (value.length > 0 && startTimeRef.current === null) {
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
      Array.from(value).length >= targetCharacterCount &&
      startTimeRef.current !== null
    ) {
      setElapsedSeconds((performance.now() - startTimeRef.current) / 1000);
    }

    setPreviouslyIncorrectPositions(nextIncorrectPositions);
    setTypedText(value);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <h1
        className="max-w-4xl cursor-text whitespace-pre-wrap text-center text-2xl leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from(practiceText).map((character, index) => {
          const status = characterStatuses[index];
          const isCurrentCharacter =
            index === typedCharacterCount && !isFinished;
          const isIncorrectSpace = character === " " && status === "incorrect";
          const colorClass =
            status === "incorrect"
              ? "text-red-600"
              : status === "correct" || status === "corrected"
                ? "text-green-600"
                : "text-gray-900 dark:text-gray-100";
          const highlightClass =
            status === "corrected"
              ? "rounded-sm bg-yellow-200 dark:bg-yellow-800/60"
              : isIncorrectSpace
                ? "rounded-sm bg-red-200 dark:bg-red-900/70"
                : isCurrentCharacter
                  ? "rounded-sm bg-sky-200 dark:bg-sky-800/70"
                  : "";

          return (
            <span key={index} className={`${colorClass} ${highlightClass}`}>
              {character === " " ? "\u00A0" : character}
            </span>
          );
        })}
      </h1>
      <textarea
        ref={inputRef}
        id="typing-input"
        aria-label="Type the practice passage"
        value={typedText}
        onChange={(event) => handleTextChange(event.target.value)}
        disabled={isFinished}
        className="sr-only"
      />
      {isFinished && (
        <section
          className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-300"
          aria-label="Typing results"
        >
          <p>WPM: {wordsPerMinute}</p>
          <p>Accuracy: {accuracy.toFixed(1)}%</p>
          <p>Mistakes: {mistakeCount}</p>
          <p>Corrected: {correctedCharacterCount}</p>
          <p>Characters per second: {charactersPerSecond.toFixed(2)}</p>
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
          >
            Restart
          </button>
        </section>
      )}
    </main>
  );
}
