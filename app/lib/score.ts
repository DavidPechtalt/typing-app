import { compareText, summarizeResult, type PracticeSummary } from "./typing";

// The fastest typists in the world sustain about 200-250 WPM.
export const MAX_PLAUSIBLE_WPM = 300;

type ScoreResult =
  { ok: true; summary: PracticeSummary } | { ok: false; reason: string };

// Recalculates a finished practice on the server from what was typed, so the
// saved numbers can't simply be made up by whoever sends the request.
export function scorePractice(
  targetText: string,
  typedText: string,
  incorrectPositions: readonly number[],
  durationMs: number,
): ScoreResult {
  const targetLength = Array.from(targetText).length;

  if (Array.from(typedText).length !== targetLength) {
    return { ok: false, reason: "The practice is not finished." };
  }

  if (incorrectPositions.some((position) => position >= targetLength)) {
    return { ok: false, reason: "A mistake position is outside the text." };
  }

  if (durationMs <= 0) {
    return { ok: false, reason: "The duration must be positive." };
  }

  const statuses = compareText(
    targetText,
    typedText,
    new Set(incorrectPositions),
  );
  const summary = summarizeResult(statuses, durationMs / 1000);

  if (summary.wordsPerMinute > MAX_PLAUSIBLE_WPM) {
    return { ok: false, reason: "That speed is not realistic." };
  }

  return { ok: true, summary };
}
