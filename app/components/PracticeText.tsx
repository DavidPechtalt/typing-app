import type { CharacterStatus } from "~/lib/typing";

type PracticeTextProps = {
  text: string;
  statuses: readonly CharacterStatus[];
  cursorIndex: number | null;
};

export function PracticeText({
  text,
  statuses,
  cursorIndex,
}: PracticeTextProps) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((character, index) => {
          const status = statuses[index];
          const isCurrentCharacter = index === cursorIndex;
          const isIncorrectSpace = character === " " && status === "incorrect";

          return (
            <span
              key={index}
              className={`${getColorClass(status)} ${getHighlightClass(status, isIncorrectSpace, isCurrentCharacter)}`}
            >
              {character === " " ? "\u00A0" : character}
            </span>
          );
        })}
      </span>
    </>
  );
}

function getColorClass(status: CharacterStatus): string {
  if (status === "incorrect") {
    return "text-red-600";
  }

  if (status === "correct" || status === "corrected") {
    return "text-green-600";
  }

  return "text-gray-900 dark:text-gray-100";
}

function getHighlightClass(
  status: CharacterStatus,
  isIncorrectSpace: boolean,
  isCurrentCharacter: boolean,
): string {
  if (status === "corrected") {
    return "rounded-sm bg-yellow-200 dark:bg-yellow-800/60";
  }

  if (isIncorrectSpace) {
    return "rounded-sm bg-red-200 dark:bg-red-900/70";
  }

  if (isCurrentCharacter) {
    return "rounded-sm bg-sky-200 dark:bg-sky-800/70";
  }

  return "";
}
