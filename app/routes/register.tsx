import { data, Form, Link, redirect, useNavigation } from "react-router";
import { z } from "zod";
import { AuthCard, OrDivider } from "~/components/AuthCard";
import { GoogleButton } from "~/components/GoogleButton";
import { TextField } from "~/components/TextField";
import { isGoogleEnabled } from "~/google.server";
import { safeRedirect } from "~/lib/safe-redirect";
import { registerSchema } from "~/lib/validation";
import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => [
  { title: "Sign up | Typing App" },
];

type FormErrors = {
  email?: string;
  password?: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  if ((await getUserId(request)) !== null) {
    throw redirect("/");
  }

  const searchParams = new URL(request.url).searchParams;

  return {
    isGoogleEnabled,
    redirectTo: safeRedirect(searchParams.get("redirectTo")),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    const fieldErrors = z.flattenError(result.error).fieldErrors;
    const errors: FormErrors = {
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    };
    return data({ errors }, { status: 400 });
  }

  const { email, password, redirectTo } = result.data;

  if (await getUserByEmail(email)) {
    const errors: FormErrors = {
      email: "An account with this email already exists. Log in instead.",
    };
    return data({ errors }, { status: 400 });
  }

  const user = await createUser(email, password);
  return createUserSession(request, user.id, safeRedirect(redirectTo));
}

export default function Register({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === "/register";
  const errors = actionData?.errors;

  return (
    <AuthCard title="Create an account">
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
          label="Password (at least 8 characters)"
          name="password"
          type="password"
          autoComplete="new-password"
          error={errors?.password}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Sign up"}
        </button>
      </Form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          to={`/login?redirectTo=${encodeURIComponent(loaderData.redirectTo)}`}
          className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
