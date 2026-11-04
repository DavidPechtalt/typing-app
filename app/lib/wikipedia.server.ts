// Fetches a random article summary from Wikipedia's REST API.
// `.server.ts`: this only ever runs on the server (the browser never calls
// Wikipedia directly, so there are no CORS or rate-limit surprises per user).
import {
  randomSummaryUrl,
  summaryToPracticeText,
  type PracticeTextFromWikipedia,
  type WikipediaLanguage,
  type WikipediaSummary,
} from "~/lib/wikipedia";

// Wikipedia asks API clients to identify themselves with a User-Agent.
const USER_AGENT = "TypingPracticeApp/1.0 (student project; React Router)";

// Random articles are sometimes unusable (too short, disambiguation pages),
// so we try a few times before giving up.
const MAX_ATTEMPTS = 4;

// Give up on a slow network after this many milliseconds, so the user is not
// left staring at a spinner forever.
const TIMEOUT_MS = 6000;

// Thrown when Wikipedia answered but not usefully. `status` is set when the
// HTTP response itself was an error; undefined means "no suitable article".
// The route turns it into a translated message.
export class WikipediaError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function fetchRandomPracticeText(
  language: WikipediaLanguage,
): Promise<PracticeTextFromWikipedia> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(randomSummaryUrl(language), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new WikipediaError(
        `Wikipedia answered ${response.status}`,
        response.status,
      );
    }

    const summary = (await response.json()) as WikipediaSummary;
    const text = summaryToPracticeText(summary);
    if (text) return text;
  }

  throw new WikipediaError(
    "Could not find a suitable article after several tries.",
  );
}
