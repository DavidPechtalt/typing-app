import {
  data,
  Form,
  Link,
  redirect,
  useNavigation,
  useSearchParams,
} from "react-router";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "~/db.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/lib/redirect";
import type { Translate } from "~/lib/i18n";
import { getTranslator } from "~/lib/locale.server";
import { useTranslate } from "~/lib/use-translate";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => [
  { title: "Register · Keystroke" },
];

// Built per request so the messages are in the user's language.
function registerSchema(t: Translate) {
  return z.object({
    // Lowercased so one inbox can only have one account (Postgres compares exactly).
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email(t("auth.err.email"))),
    password: z.string().min(8, t("register.err.password")),
  });
}

const BCRYPT_ROUNDS = 10;

function getRedirectTo(request: Request): string {
  return safeRedirect(new URL(request.url).searchParams.get("redirectTo"));
}

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId !== null) throw redirect(getRedirectTo(request));
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const t = await getTranslator(request);
  const formData = await request.formData();
  const result = registerSchema(t).safeParse(Object.fromEntries(formData));

  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    return data(
      {
        errors: {
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
        },
      },
      { status: 400 },
    );
  }

  const { email, password } = result.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return data(
      {
        errors: { email: t("register.err.taken"), password: undefined },
      },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await db.user.create({
    data: { email, passwordHash },
    select: { id: true },
  });

  return createUserSession(user.id, getRedirectTo(request));
}

export default function Register({ actionData }: Route.ComponentProps) {
  const t = useTranslate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const loginHref = searchParams.has("redirectTo")
    ? `/login?${searchParams}`
    : "/login";
  const errors = actionData?.errors;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-16">
      <div>
        <h1 className="font-display text-4xl tracking-tight">
          {t("register.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t("register.lead")}</p>
      </div>

      <Form method="post" className="card flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            {t("auth.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            aria-invalid={errors?.email ? true : undefined}
            aria-describedby={errors?.email ? "email-error" : undefined}
            className="field"
          />
          {errors?.email && (
            <p id="email-error" className="text-sm text-wrong">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            {t("auth.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            dir="ltr"
            aria-invalid={errors?.password ? true : undefined}
            aria-describedby={
              errors?.password ? "password-error" : "password-hint"
            }
            className="field"
          />
          {errors?.password ? (
            <p id="password-error" className="text-sm text-wrong">
              {errors.password}
            </p>
          ) : (
            <p id="password-hint" className="text-sm text-ink-faint">
              {t("register.passwordHint")}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary mt-2"
        >
          {isSubmitting ? t("register.submitting") : t("register.submit")}
        </button>
      </Form>

      <p className="text-center text-sm text-ink-muted">
        {t("register.hasAccount")}{" "}
        <Link to={loginHref} className="link font-medium">
          {t("register.login")}
        </Link>
      </p>
    </main>
  );
}
