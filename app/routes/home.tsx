import { Link } from "react-router";
import { PracticeText } from "~/components/PracticeText";
import { compareText } from "~/lib/typing";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "Keyprint" },
  {
    name: "description",
    content: "Typing practice where every key leaves a mark.",
  },
];

// A frozen moment of a real practice, drawn with the same code as the
// practice page: "c" was fixed earlier, the last "p" is a wrong key.
const sampleText = "Practice makes progress.";
const sampleTyped = "Practice makes prp";
const sampleStatuses = compareText(sampleText, sampleTyped, new Set([3]));

const features = [
  {
    key: "1",
    title: "Ink that tells the truth",
    description:
      "Every letter prints as you type it. Wrong keys stay struck through until you fix them.",
    badgeClassName: "bg-pink text-on-accent",
  },
  {
    key: "2",
    title: "Mistakes leave a mark",
    description:
      "A fixed mistake still counts, so your accuracy shows how cleanly you really type.",
    badgeClassName: "bg-sun text-on-accent",
  },
  {
    key: "3",
    title: "Bring your own words",
    description:
      "Paste a song, a speech or your notes and practise on text you actually care about.",
    badgeClassName: "bg-card text-ink",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-4 py-14 sm:py-20">
      <section className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="tag bg-card text-ink">Typing practice</p>
          <h1 className="text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl">
            Every key leaves <span className="mark">a mark.</span>
          </h1>
          <p className="max-w-md text-lg text-muted">
            Type real passages, watch each letter land in ink, and find out how
            fast and how cleanly you type.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/practice" className="btn btn-primary">
              Start typing
            </Link>
            <Link to="/texts" className="btn btn-secondary">
              Browse texts
            </Link>
          </div>
        </div>

        <div className="relative" aria-hidden="true">
          <div className="card rotate-[-1.5deg] p-6 sm:p-8">
            <p className="mb-4 text-sm font-semibold text-muted">
              Practice makes progress
            </p>
            <p className="font-mono text-2xl leading-[2.1]">
              <PracticeText
                text={sampleText}
                statuses={sampleStatuses}
                cursorIndex={Array.from(sampleTyped).length}
              />
            </p>
          </div>
          <div className="absolute -top-5 -right-3 rotate-6 rounded-lg border-2 border-line bg-sun px-3 py-1.5 font-mono text-lg font-semibold text-on-accent shadow-[3px_3px_0_var(--shadow)]">
            74 WPM
          </div>
          <div className="absolute -bottom-5 left-6 -rotate-3 rounded-lg border-2 border-line bg-pink px-3 py-1.5 font-mono text-sm font-semibold text-on-accent shadow-[3px_3px_0_var(--shadow)]">
            96.4% accuracy
          </div>
        </div>
      </section>

      <ul className="grid gap-5 sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.key} className="card flex flex-col gap-3 p-6">
            <span
              aria-hidden="true"
              className={`grid size-10 place-items-center rounded-lg border-2 border-line font-mono font-semibold shadow-[2px_2px_0_var(--shadow)] ${feature.badgeClassName}`}
            >
              {feature.key}
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              {feature.title}
            </h2>
            <p className="text-muted">{feature.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
