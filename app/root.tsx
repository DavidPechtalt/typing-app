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
  useLocation,
  useRouteLoaderData,
} from "react-router";
import { getUser } from "./session.server";
import { getLocale } from "./lib/locale.server";
import { directionOf, isLocale, LOCALES, DEFAULT_LOCALE } from "./lib/i18n";
import { useLocale, useTranslate } from "./lib/use-translate";

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
    href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Frank+Ruhl+Libre:wght@400;500;600&family=Inter:wght@400;500;600&family=Heebo:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

// Runs on every page: who is logged in, and which language to show.
export async function loader({ request }: Route.LoaderArgs) {
  const [user, locale] = await Promise.all([
    getUser(request),
    getLocale(request),
  ]);
  return { user, locale };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Loader data can be missing while an error page renders.
  const data = useRouteLoaderData("root") as { locale?: unknown } | undefined;
  const locale = isLocale(data?.locale) ? data.locale : DEFAULT_LOCALE;
  return (
    <html lang={locale} dir={directionOf(locale)}>
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

// Header links: underlined when current.
function navLinkClass({ isActive }: { isActive: boolean }) {
  return `whitespace-nowrap border-b-2 py-1 text-sm font-medium transition-colors ${
    isActive
      ? "border-accent text-ink"
      : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink"
  }`;
}

// Two small buttons, "EN | עב"; posts the choice to /locale and comes back here.
function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslate();
  const location = useLocation();
  return (
    <Form
      method="post"
      action="/locale"
      aria-label={t("nav.language")}
      className="flex items-center rounded-md border border-line-strong text-xs font-medium"
    >
      <input
        type="hidden"
        name="redirectTo"
        value={location.pathname + location.search}
      />
      {LOCALES.map((option) => (
        <button
          key={option}
          type="submit"
          name="locale"
          value={option}
          aria-pressed={option === locale}
          className={`px-2.5 py-1 transition-colors first:rounded-s-[5px] last:rounded-e-[5px] ${
            option === locale
              ? "bg-ink text-surface"
              : "text-ink-muted hover:bg-surface-3 hover:text-ink"
          }`}
        >
          {option === "en" ? "EN" : "עב"}
        </button>
      ))}
    </Form>
  );
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const t = useTranslate();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5"
        >
          <Link to="/" className="font-display text-2xl tracking-tight">
            Keystroke
          </Link>

          <div className="flex items-center gap-5 overflow-x-auto">
            <NavLink to="/practice" className={navLinkClass}>
              {t("nav.practice")}
            </NavLink>
            <NavLink to="/texts" className={navLinkClass}>
              {t("nav.texts")}
            </NavLink>
            {user ? (
              <>
                <NavLink to="/history" className={navLinkClass}>
                  {t("nav.history")}
                </NavLink>
                {/* Convenience only; the admin pages check the role on the server. */}
                {user.role === "ADMIN" && (
                  <NavLink to="/admin" className={navLinkClass}>
                    {t("nav.admin")}
                  </NavLink>
                )}
                <span
                  className="hidden max-w-44 truncate text-sm text-ink-faint md:inline"
                  title={user.email}
                >
                  {user.email}
                </span>
                {/* POST, not a link: logging out changes state. */}
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className={navLinkClass({ isActive: false })}
                  >
                    {t("nav.logout")}
                  </button>
                </Form>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  {t("nav.login")}
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn-primary px-3.5 py-1.5 text-xs"
                >
                  {t("nav.register")}
                </NavLink>
              </>
            )}
            <LanguageSwitch />
          </div>
        </nav>
      </header>

      <Outlet />

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-ink-faint">
          <span>{t("footer.tagline")}</span>
          <span>
            {t("footer.credit").split("{wikipedia}")[0]}
            <a
              href="https://www.wikipedia.org/"
              className="link"
              rel="noreferrer"
            >
              Wikipedia
            </a>
            {t("footer.credit").split("{wikipedia}")[1]}
          </span>
        </div>
      </footer>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = useTranslate();
  let message = "Oops!";
  let details = t("error.generic");
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message =
      error.status === 404 || error.status === 403
        ? String(error.status)
        : t("error.title");
    // requireAdmin throws a 403 with no statusText, so give it its own message.
    if (error.status === 404) {
      details = error.statusText || t("error.404");
    } else if (error.status === 403) {
      details = t("error.403");
    } else {
      details = error.statusText || details;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-5 py-24">
      <p className="eyebrow">{t("error.title")}</p>
      <h1 className="font-display text-7xl leading-none">{message}</h1>
      <p className="text-lg text-ink-muted">{details}</p>
      <Link to="/" className="btn-secondary mt-2">
        {t("error.back")}
      </Link>
      {stack && (
        <pre className="card mt-6 w-full overflow-x-auto p-4 text-start text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
