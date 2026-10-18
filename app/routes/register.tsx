import { data, Form, Link, redirect, useNavigation } from "react-router";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "~/db.server";
import { createUserSession, getUserId } from "~/session.server";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => [
  { title: "Register | Typing App" },
];

const registerSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const BCRYPT_ROUNDS = 10;

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId !== null) throw redirect("/practice");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = registerSchema.safeParse(Object.fromEntries(formData));

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
        errors: {
          email: "This email is already registered",
          password: undefined,
        },
      },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await db.user.create({
    data: { email, passwordHash },
    select: { id: true },
  });

  return createUserSession(user.id, "/practice");
}

export default function Register({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Save your results and track your progress.
        </p>
      </div>

      <Form
        method="post"
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
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
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={errors?.password ? true : undefined}
            aria-describedby={
              errors?.password ? "password-error" : "password-hint"
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {errors?.password ? (
            <p
              id="password-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {errors.password}
            </p>
          ) : (
            <p
              id="password-hint"
              className="text-sm text-slate-500 dark:text-slate-400"
            >
              At least 8 characters.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </Form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Log in
        </Link>
      </p>
    </main>
  );
}
