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
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [{ title: "Log in · Keystroke" }];

// Built per request so the messages are in the user's language.
function loginSchema(t: Translate) {
  return z.object({
    // Lowercased so one inbox can only have one account (Postgres compares exactly).
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email(t("auth.err.email"))),
    password: z.string().min(1, t("login.err.password")),
  });
}

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
  const result = loginSchema(t).safeParse(Object.fromEntries(formData));

  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    return data(
      {
        errors: {
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
          form: undefined,
        },
      },
      { status: 400 },
    );
  }

  const { email, password } = result.data;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  const passwordMatches =
    user !== null && (await bcrypt.compare(password, user.passwordHash));

  // Same message for unknown email and wrong password, so the form never confirms which emails exist.
  if (!user || !passwordMatches) {
    return data(
      {
        errors: {
          email: undefined,
          password: undefined,
          form: t("login.err.wrong"),
        },
      },
      { status: 400 },
    );
  }

  return createUserSession(user.id, getRedirectTo(request));
}

export default function Login({ actionData }: Route.ComponentProps) {
  const t = useTranslate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const registerHref = searchParams.has("redirectTo")
    ? `/register?${searchParams}`
    : "/register";
  const errors = actionData?.errors;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-16">
      <div>
        <h1 className="font-display text-4xl tracking-tight">
          {t("login.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t("login.lead")}</p>
      </div>

      <Form method="post" className="card flex flex-col gap-4 p-6">
        {errors?.form && (
          <p
            role="alert"
            className="rounded-md border border-wrong/30 bg-wrong-soft px-3 py-2 text-sm text-wrong"
          >
            {errors.form}
          </p>
        )}

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
            autoComplete="current-password"
            required
            dir="ltr"
            aria-invalid={errors?.password ? true : undefined}
            aria-describedby={errors?.password ? "password-error" : undefined}
            className="field"
          />
          {errors?.password && (
            <p id="password-error" className="text-sm text-wrong">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary mt-2"
        >
          {isSubmitting ? t("login.submitting") : t("login.submit")}
        </button>
      </Form>

      <p className="text-center text-sm text-ink-muted">
        {t("login.noAccount")}{" "}
        <Link to={registerHref} className="link font-medium">
          {t("login.register")}
        </Link>
      </p>
    </main>
  );
}
