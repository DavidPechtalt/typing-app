export type CharacterStatus = "pending" | "correct" | "corrected" | "incorrect";

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