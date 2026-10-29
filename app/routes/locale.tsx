// Switches the interface language. POST { locale, redirectTo } from the
// header; the choice goes into a cookie and the user returns to the same page.
import { redirect } from "react-router";
import { z } from "zod";
import { LOCALES } from "~/lib/i18n";
import { serializeLocale } from "~/lib/locale.server";
import { safeRedirect } from "~/lib/redirect";
import type { Route } from "./+types/locale";

const schema = z.object({
  locale: z.enum(LOCALES),
  redirectTo: z.string().optional(),
});

export async function loader() {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return redirect("/");

  return redirect(safeRedirect(parsed.data.redirectTo, "/"), {
    headers: { "Set-Cookie": await serializeLocale(parsed.data.locale) },
  });
}
