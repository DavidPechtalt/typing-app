import { data, redirect } from "react-router";
import { createGoogleSignIn, isGoogleEnabled } from "~/google.server";
import { safeRedirect } from "~/lib/safe-redirect";
import { commitSession, getSession } from "~/session.server";
import type { Route } from "./+types/auth.google";

// Step 1 of Google sign-in: remember a random state, then send the user to Google.
export async function action({ request }: Route.ActionArgs) {
  if (!isGoogleEnabled) {
    throw data("Google sign-in is not configured.", { status: 404 });
  }

  const formData = await request.formData();
  const redirectTo = formData.get("redirectTo");
  const { url, state, codeVerifier } = createGoogleSignIn();

  const session = await getSession(request.headers.get("Cookie"));
  session.flash("googleOAuth", {
    state,
    codeVerifier,
    redirectTo: safeRedirect(
      typeof redirectTo === "string" ? redirectTo : null,
    ),
  });

  return redirect(url, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
