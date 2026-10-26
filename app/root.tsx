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
} from "react-router";

import { getUserById } from "~/models/user.server";
import { getUserId } from "~/session.server";
import type { Route } from "./+types/root";
import "./app.css";

// Runs for every page, so the header knows who is logged in.
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  const user = userId === null ? null : await getUserById(userId);

  return { user };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=IBM+Plex+Mono:wght@400;500;600&family=Rubik:wght@400..700&display=swap",
  },
];

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

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return `rounded-md border-2 px-3 py-1 text-sm font-semibold transition-colors ${
    isActive
      ? "border-line bg-sun text-on-accent"
      : "border-transparent text-muted hover:text-ink"
  }`;
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-line bg-paper">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-5xl items-center gap-1 px-4 sm:gap-2"
        >
          <Link to="/" className="mr-2 flex items-center gap-2 sm:mr-4">
            <Logo />
            <span className="hidden text-xl font-extrabold tracking-tight sm:inline">
              Keyprint
            </span>
          </Link>
          <NavLink to="/practice" className={navLinkClassName}>
            Practice
          </NavLink>
          <NavLink to="/texts" className={navLinkClassName}>
            Texts
          </NavLink>
          {user && (
            <NavLink to="/history" className={navLinkClassName}>
              History
            </NavLink>
          )}
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden max-w-48 truncate text-sm text-muted md:inline">
                  {user.email}
                </span>
                <Form method="post" action="/logout">
                  <button type="submit" className="btn btn-secondary btn-small">
                    Log out
                  </button>
                </Form>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-semibold text-muted hover:text-ink sm:inline"
                >
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-small">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

// A single keycap with the letter K.
function Logo() {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 place-items-center rounded-lg border-2 border-line bg-sun font-mono text-lg font-semibold text-on-accent shadow-[2px_2px_0_var(--shadow)]"
    >
      K
    </span>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "There is nothing to type here. Check the address or go back home."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-6 px-4 py-20">
      <p className="tag bg-pink">Oops</p>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
        {message}
      </h1>
      <p className="text-lg text-muted">{details}</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
      {stack && (
        <pre className="card w-full overflow-x-auto p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
