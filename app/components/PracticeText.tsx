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
        {Array.from(text).map((character, index) => (
          <span
            key={index}
            className={getCharacterClass(
              statuses[index],
              index === cursorIndex,
            )}
          >
            {character}
          </span>
        ))}
      </span>
    </>
  );
}

// Ink colours: typed text is printed ink, untyped text is faint, a wrong key
// is struck through on pink, a fixed mistake keeps a yellow highlight.
export function getCharacterClass(
  status: CharacterStatus,
  isCurrentCharacter: boolean,
): string {
  if (status === "incorrect") {
    return "rounded-[3px] bg-pink text-on-accent line-through decoration-2";
  }

  if (status === "corrected") {
    return "rounded-[3px] bg-sun text-on-accent";
  }

  if (status === "correct") {
    return "text-ink";
  }

  if (isCurrentCharacter) {
    return "rounded-[3px] bg-blue/15 text-ink shadow-[inset_0_-3px_0_var(--blue)]";
  }

  return "text-faint";
}
