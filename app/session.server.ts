import { createCookieSessionStorage, redirect } from "react-router";
import { db } from "~/db.server";
import { pagePathFromRequestPath } from "~/lib/redirect";

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
    select: { id: true, email: true, role: true },
  });
}

function loginPathWithRedirect(request: Request) {
  const url = new URL(request.url);
  // Strip ".data" so a data request redirects back to the page itself.
  const searchParams = new URLSearchParams({
    redirectTo: pagePathFromRequestPath(url.pathname),
  });
  return `/login?${searchParams}`;
}

export async function requireAdmin(request: Request) {
  const user = await getUser(request);
  if (user === null) {
    throw redirect(loginPathWithRedirect(request));
  }
  if (user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }
  return { ...user, role: user.role };
}

export async function requireUserId(request: Request): Promise<number> {
  const userId = await getUserId(request);
  if (userId !== null) return userId;
  throw redirect(loginPathWithRedirect(request));
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
