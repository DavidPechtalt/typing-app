import { Link } from "react-router";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "Typing App" },
  { name: "description", content: "Practise typing and track your speed." },
];

const features = [
  {
    title: "Live feedback",
    description: "Every character turns dark, red or amber as you type.",
  },
  {
    title: "Speed and accuracy",
    description: "See your words per minute and accuracy when you finish.",
  },
  {
    title: "Mistakes count",
    description:
      "Fixed mistakes are still counted, so you learn to type cleanly.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-12 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Practise typing,
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            one character at a time.
          </span>
        </h1>
        <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400">
          Type a short passage and get instant feedback on every key, then see
          how fast and how accurately you typed.
        </p>
        <Link
          to="/practice"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Start practising
        </Link>
      </div>

      <ul className="grid w-full gap-4 text-left sm:grid-cols-3">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {feature.description}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
