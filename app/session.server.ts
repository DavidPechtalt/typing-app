import { createCookieSessionStorage, redirect } from "react-router";
import { db } from "~/db.server";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set. Add it to .env.");
}

const USER_ID_KEY = "userId";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    maxAge: 60 * 60 * 24 * 30,
  },
});

async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request): Promise<number | null> {
  const session = await getSession(request);
  const userId: unknown = session.get(USER_ID_KEY);
  return typeof userId === "number" ? userId : null;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === null) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
}

export async function requireUserId(request: Request): Promise<number> {
  const userId = await getUserId(request);
  if (userId !== null) return userId;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams({ redirectTo: url.pathname });
  throw redirect(`/login?${searchParams}`);
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set(USER_ID_KEY, userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
