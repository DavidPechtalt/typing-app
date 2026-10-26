import { redirect } from "react-router";
import { getGoogleUser } from "~/google.server";
import { findOrCreateGoogleUser } from "~/models/user.server";
import { commitSession, getSession } from "~/session.server";
import type { Route } from "./+types/auth.google.callback";

// Step 2 of Google sign-in: Google sends the user back here with ?code=…&state=…
export async function loader({ request }: Route.LoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const session = await getSession(request.headers.get("Cookie"));
  // A flash value is removed from the session after it is read once.
  const saved = session.get("googleOAuth");

  async function fail() {
    return redirect("/login?error=google", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  // The state must match the one we saved, or this callback wasn't started by us.
  if (!code || !state || !saved || state !== saved.state) {
    return fail();
  }

  try {
    const { googleId, email } = await getGoogleUser(code, saved.codeVerifier);
    const userId = await findOrCreateGoogleUser(googleId, email);

    session.set("userId", userId);
    return redirect(saved.redirectTo, {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  } catch (error) {
    console.error(error);
    return fail();
  }
}
