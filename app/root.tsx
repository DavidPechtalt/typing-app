import {
  Form,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { getUser } from "./session.server";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

// Runs on every page so the header knows who is logged in.
export async function loader({ request }: Route.LoaderArgs) {
  return { user: await getUser(request) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive
      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
  }`;
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4"
        >
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="rounded-md bg-blue-600 px-1.5 py-0.5 font-mono text-sm text-white"
            >
              Aa
            </span>
            Typing App
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to="/practice" className={navLinkClass}>
              Practice
            </NavLink>
            {user ? (
              <>
                <span className="hidden px-3 text-sm text-slate-500 sm:inline dark:text-slate-400">
                  {user.email}
                </span>
                {/* POST, not a link: logging out changes state. */}
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className={navLinkClass({ isActive: false })}
                  >
                    Log out
                  </button>
                </Form>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
