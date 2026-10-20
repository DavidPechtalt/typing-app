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
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [
  { title: "Log in | Typing App" },
];

const loginSchema = z.object({
  // Lowercased so one inbox can only have one account (Postgres compares exactly).
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

// Same message for unknown email and wrong password, so the form never confirms which emails exist.
const WRONG_CREDENTIALS = "Wrong email or password";

function getRedirectTo(request: Request): string {
  return safeRedirect(new URL(request.url).searchParams.get("redirectTo"));
}

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId !== null) throw redirect(getRedirectTo(request));
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = loginSchema.safeParse(Object.fromEntries(formData));

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

  if (!user || !passwordMatches) {
    return data(
      {
        errors: {
          email: undefined,
          password: undefined,
          form: WRONG_CREDENTIALS,
        },
      },
      { status: 400 },
    );
  }

  return createUserSession(user.id, getRedirectTo(request));
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const registerHref = searchParams.has("redirectTo")
    ? `/register?${searchParams}`
    : "/register";
  const errors = actionData?.errors;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Welcome back. Pick up where you left off.
        </p>
      </div>

      <Form
        method="post"
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {errors?.form && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {errors.form}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errors?.email ? true : undefined}
            aria-describedby={errors?.email ? "email-error" : undefined}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {errors?.email && (
            <p
              id="email-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={errors?.password ? true : undefined}
            aria-describedby={errors?.password ? "password-error" : undefined}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {errors?.password && (
            <p
              id="password-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </Form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        No account yet?{" "}
        <Link
          to={registerHref}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Register
        </Link>
      </p>
    </main>
  );
}
