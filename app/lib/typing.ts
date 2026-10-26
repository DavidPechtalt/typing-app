export type CharacterStatus = "pending" | "correct" | "corrected" | "incorrect";

export type PracticeSummary = Readonly<
  Record<
    | "wordsPerMinute"
    | "charactersPerSecond"
    | "accuracy"
    | "mistakeCount"
    | "correctedCharacterCount",
    number
  >
>;

export function compareText(
  targetText: string,
  typedText: string,
  previouslyIncorrectPositions: ReadonlySet<number> = new Set(),
): CharacterStatus[] {
  const targetCharacters = Array.from(targetText);
  const typedCharacters = Array.from(typedText);

  return targetCharacters.map((character, index) => {
    const typedCharacter = typedCharacters[index];

    if (typedCharacter === undefined) {
      return "pending";
    }

    if (typedCharacter !== character) {
      return "incorrect";
    }

    return previouslyIncorrectPositions.has(index) ? "corrected" : "correct";
  });
}

export function calculateWordsPerMinute(
  correctCharacterCount: number,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) {
    return 0;
  }

  return Math.round((correctCharacterCount / 5 / elapsedSeconds) * 60);
}

export function calculateCharactersPerSecond(
  correctCharacterCount: number,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) {
    return 0;
  }

  return correctCharacterCount / elapsedSeconds;
}

export function calculateAccuracy(
  correctCharacterCount: number,
  totalCharacterCount: number,
): number {
  if (totalCharacterCount <= 0) {
    return 0;
  }

  return (correctCharacterCount / totalCharacterCount) * 100;
}

export function summarizeResult(
  characterStatuses: readonly CharacterStatus[],
  elapsedSeconds: number,
): PracticeSummary {
  const targetCharacterCount = characterStatuses.length;
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
    (status) => status === "incorrect" || status == "corrected",
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

  return {
    correctedCharacterCount,
    mistakeCount,
    wordsPerMinute,
    charactersPerSecond,
    accuracy,
  };
}

export function recordIncorrectPositions(
  characterStatuses:readonly CharacterStatus[],
  previouslyIncorrectPositions: ReadonlySet<number>,
): Set<number> {
  const nextIncorrectPositions = new Set(previouslyIncorrectPositions);
  characterStatuses.forEach((status, index) => {
    if (status === "incorrect") {
      nextIncorrectPositions.add(index);
    }
  });
  return nextIncorrectPositions;
}
