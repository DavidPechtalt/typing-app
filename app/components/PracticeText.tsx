// Renders the practice passage one <span> per character, coloured by its status.
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

          const className = isCurrentCharacter
            ? "mark mark-blink"
            : `${getColorClass(status)} ${isIncorrectSpace ? "rounded-sm bg-wrong-soft" : ""}`;

          return (
            <span key={index} className={className}>
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
    return "text-wrong underline decoration-2 underline-offset-4";
  }

  if (status === "corrected") {
    return "text-fixed underline decoration-dotted underline-offset-4";
  }

  if (status === "correct") {
    return "text-ink";
  }

  return "text-ink-faint";
}
