import { createCookieSessionStorage, redirect } from "react-router";
import { env } from "~/env.server";
import { safeRedirect } from "~/lib/safe-redirect";

type SessionData = {
  userId: number;
};

type SessionFlashData = {
  // Remembered between "start Google sign-in" and Google's callback.
  googleOAuth: { state: string; codeVerifier: string; redirectTo: string };
};

const sessionStorage = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__session",
    httpOnly: true, // JavaScript in the browser can't read it
    secure: env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // not sent on cross-site POSTs (CSRF protection)
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secrets: [env.SESSION_SECRET], // signed, so users can't change it
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

export async function getUserId(request: Request): Promise<number | null> {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("userId") ?? null;
}

// Use in loaders and actions of pages that need a logged-in user.
export async function requireUserId(request: Request): Promise<number> {
  const userId = await getUserId(request);

  if (userId === null) {
    const { pathname, search } = new URL(request.url);
    const searchParams = new URLSearchParams({
      redirectTo: pathname + search,
    });
    throw redirect(`/login?${searchParams}`);
  }

  return userId;
}

export async function createUserSession(
  request: Request,
  userId: number,
  redirectTo: string,
) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", userId);

  return redirect(safeRedirect(redirectTo), {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
