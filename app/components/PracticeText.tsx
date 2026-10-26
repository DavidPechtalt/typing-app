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
              {character}
            </span>
          );
        })}
      </span>
    </>
  );
}

function getColorClass(status: CharacterStatus): string {
  if (status === "incorrect") {
    return "text-red-600 underline decoration-2 underline-offset-4 dark:text-red-400";
  }

  if (status === "correct" || status === "corrected") {
    return "text-slate-900 dark:text-slate-100";
  }

  return "text-slate-500 dark:text-slate-400";
}

function getHighlightClass(
  status: CharacterStatus,
  isIncorrectSpace: boolean,
  isCurrentCharacter: boolean,
): string {
  if (status === "corrected") {
    return "rounded-sm bg-amber-100 dark:bg-amber-500/20";
  }

  if (isIncorrectSpace) {
    return "rounded-sm bg-red-100 dark:bg-red-500/20";
  }

  if (isCurrentCharacter) {
    return "rounded-sm bg-blue-100 shadow-[inset_2px_0_0_var(--color-blue-600)] dark:bg-blue-500/20 rtl:shadow-[inset_-2px_0_0_var(--color-blue-600)]";
  }

  return "";
}
