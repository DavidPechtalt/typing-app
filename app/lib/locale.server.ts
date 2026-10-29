// Which language the interface is shown in. Stored in its own small cookie
// (not the session cookie, so guests keep their choice too).
import { createCookie } from "react-router";
import {
  DEFAULT_LOCALE,
  isLocale,
  translator,
  type Locale,
  type Translate,
} from "~/lib/i18n";

// Plain cookie, readable by the server only; a year is long enough.
const localeCookie = createCookie("locale", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
});

// The locale for this request: the cookie if set, otherwise the browser's
// preferred language (Hebrew if it lists it first), otherwise English.
export async function getLocale(request: Request): Promise<Locale> {
  const fromCookie: unknown = await localeCookie.parse(
    request.headers.get("Cookie"),
  );
  if (isLocale(fromCookie)) return fromCookie;

  const acceptLanguage = request.headers.get("Accept-Language") ?? "";
  if (/^\s*he\b/i.test(acceptLanguage)) return "he";
  return DEFAULT_LOCALE;
}

// A translate function for this request, for actions that return messages.
export async function getTranslator(request: Request): Promise<Translate> {
  return translator(await getLocale(request));
}

// The Set-Cookie header value that stores a new choice.
export function serializeLocale(locale: Locale): Promise<string> {
  return localeCookie.serialize(locale);
}
