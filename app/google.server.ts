import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "~/env.server";

// Google sign-in with the OAuth 2.0 "authorization code" flow:
// 1. We send the user to Google with our client id and a random `state`.
// 2. The user signs in at Google, and Google sends them back to our callback
//    with a one-time `code` and the same `state`.
// 3. Our server swaps the code (plus our client secret) for an access token,
//    and uses it to ask Google who the user is.

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const isGoogleEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

const redirectUri = `${env.APP_URL}/auth/google/callback`;

function randomString() {
  return randomBytes(32).toString("base64url");
}

// `state` protects against forged callbacks; `codeVerifier` (PKCE) makes sure
// only the server that started the sign-in can use the returned code.
export function createGoogleSignIn() {
  const state = randomString();
  const codeVerifier = randomString();
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return { url: url.toString(), state, codeVerifier };
}

const tokenSchema = z.object({ access_token: z.string() });

const userInfoSchema = z.object({
  sub: z.string(),
  email: z.email(),
  email_verified: z.boolean(),
});

export async function getGoogleUser(code: string, codeVerifier: string) {
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      code,
      code_verifier: codeVerifier,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token request failed: ${tokenResponse.status}`);
  }

  const { access_token } = tokenSchema.parse(await tokenResponse.json());

  const userInfoResponse = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userInfoResponse.ok) {
    throw new Error(`Google user info failed: ${userInfoResponse.status}`);
  }

  const userInfo = userInfoSchema.parse(await userInfoResponse.json());

  if (!userInfo.email_verified) {
    throw new Error("Google account email is not verified");
  }

  return { googleId: userInfo.sub, email: userInfo.email.toLowerCase() };
}
