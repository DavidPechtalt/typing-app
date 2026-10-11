import { useEffect, useRef, useState } from "react";
import {
  calculateAccuracy,
  calculateCharactersPerSecond,
  calculateWordsPerMinute,
  compareText,
} from "../logic/typing";

const practiceText =
  "A quiet morning is a good time to practice a new skill. Sit comfortably, relax your hands.";

export default function Practice() {
  const [typedText, setTypedText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previouslyIncorrectPositions, setPreviouslyIncorrectPositions] =
    useState<Set<number>>(() => new Set());
  const targetCharacterCount = Array.from(practiceText).length;
  const isFinished = Array.from(typedText).length >= targetCharacterCount;
  const characterStatuses = compareText(
    practiceText,
    typedText,
    previouslyIncorrectPositions,
  );
  const typedCharacterCount = Array.from(typedText).length;
  const correctCharacterCount = characterStatuses.filter(
    (status) => status === "correct" || status === "corrected",
  ).length;
  const firstTryCorrectCharacterCount = characterStatuses.filter(
    (status) => status === "correct",
  ).length;
  const correctedCharacterCount = characterStatuses.filter(
    (status) => status === "corrected",
  ).length;
  const mistakeCount = characterStatuses.filter(
    (status) => status === "incorrect",
  ).length;
  const wordsPerMinute = calculateWordsPerMinute(
    correctCharacterCount,
    elapsedSeconds,
  );
  const charactersPerSecond = calculateCharactersPerSecond(
    correctCharacterCount,
    elapsedSeconds,
  );
  const accuracy = calculateAccuracy(
    firstTryCorrectCharacterCount,
    targetCharacterCount,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    const nextIncorrectPositions = new Set(previouslyIncorrectPositions);

    nextStatuses.forEach((status, index) => {
      if (status === "incorrect") {
        nextIncorrectPositions.add(index);
      }
    });

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
        </section>
      )}
    </main>
  );
}
