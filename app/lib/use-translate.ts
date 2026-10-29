// React hook that gives components the current locale and a translate function.
// The locale comes from the root loader (see root.tsx), which reads the cookie.
import { useRouteLoaderData } from "react-router";
import {
  DEFAULT_LOCALE,
  isLocale,
  translator,
  type Locale,
  type Translate,
} from "~/lib/i18n";

export function useLocale(): Locale {
  const data = useRouteLoaderData("root") as { locale?: unknown } | undefined;
  return isLocale(data?.locale) ? data.locale : DEFAULT_LOCALE;
}

export function useTranslate(): Translate {
  return translator(useLocale());
}
