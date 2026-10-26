import { Link } from "react-router";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "Typing App" },
  { name: "description", content: "Practise typing and track your speed." },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
        Typing App
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        Type a passage and see your speed and accuracy.
      </p>
      <Link
        to="/practice"
        className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        Start practising
      </Link>
    </main>
  );
}
