import { data, Form, Link, redirect, useNavigation } from "react-router";
import { z } from "zod";
import { AuthCard, OrDivider } from "~/components/AuthCard";
import { GoogleButton } from "~/components/GoogleButton";
import { TextField } from "~/components/TextField";
import { isGoogleEnabled } from "~/google.server";
import { safeRedirect } from "~/lib/safe-redirect";
import { loginSchema } from "~/lib/validation";
import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [{ title: "Log in | Keyprint" }];

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  if ((await getUserId(request)) !== null) {
    throw redirect("/");
  }

  const searchParams = new URL(request.url).searchParams;

  return {
    isGoogleEnabled,
    redirectTo: safeRedirect(searchParams.get("redirectTo")),
    googleFailed: searchParams.get("error") === "google",
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    const errors: FormErrors = {
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    };
    return data({ errors }, { status: 400 });
  }

  const { email, password, redirectTo } = result.data;
  const userId = await verifyLogin(email, password);

  if (userId === null) {
    // Same message for "no such user" and "wrong password", so the form
    // doesn't reveal which emails have an account.
    const errors: FormErrors = { form: "Wrong email or password." };
    return data({ errors }, { status: 400 });
  }

  return createUserSession(request, userId, safeRedirect(redirectTo));
}

export default function Login({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/login";
  const errors = actionData?.errors;
  const formError =
    errors?.form ??
    (loaderData.googleFailed
      ? "Google sign-in failed. Please try again."
      : null);

  return (
    <AuthCard title="Log in" subtitle="Welcome back. Your keys missed you.">
      {loaderData.isGoogleEnabled && (
        <>
          <GoogleButton redirectTo={loaderData.redirectTo} />
          <OrDivider />
        </>
      )}

      <Form method="post" className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={loaderData.redirectTo} />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={errors?.email}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={errors?.password}
        />
        {formError && (
          <p
            role="alert"
            className="rounded-lg border-2 border-line bg-pink px-3 py-2 text-sm font-semibold text-on-accent"
          >
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </Form>

      <p className="text-center text-sm text-muted">
        No account yet?{" "}
        <Link
          to={`/register?redirectTo=${encodeURIComponent(loaderData.redirectTo)}`}
          className="link"
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
