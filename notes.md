# Notes

## 2026-10-18: Session setup

What I built:

- `app/session.server.ts`: the login state. After login the user's id goes into a signed cookie; every request that needs the user reads it back. Public functions: `getUserId`, `getUser`, `requireUserId`, `createUserSession`, `logout`.
- `SESSION_SECRET` in `.env`, generated with `openssl rand -hex 32`. The server refuses to start without it, same as with `DATABASE_URL`.
- `.env.example` and a README section listing the three env variables, so someone else can run the app.

Things I learned:

- **A signed cookie is not an encrypted cookie.** The user id is readable in the browser, but changing it breaks the signature and the server returns an empty session. That is why the secret must stay in `.env`.
- **`httpOnly` + `sameSite: "lax"`.** `httpOnly` hides the cookie from page JavaScript (XSS can't steal it). `sameSite` stops other sites from posting forms with my cookie attached (CSRF).
- **`secure` only in production.** The dev server runs on plain http, so if `secure` were always on the browser would silently drop the cookie and nothing would stay logged in.
- **Throwing a redirect.** `requireUserId` does `throw redirect("/login?redirectTo=...")`. React Router catches a thrown Response and sends it, so the loader stops right there. `redirectTo` lets login send the user back to the page they wanted.
- **`select` in Prisma.** `getUser` asks only for `id` and `email`, so the password hash never leaves the database layer.
- **No sessions table.** The whole session lives in the cookie. For a single user id that is enough; a table would only be needed for things like "log out everywhere".

## 2026-10-14: Database

What I built:

- A Neon Postgres database, connected through Prisma 7 with the `pg` driver adapter. The connection URL lives in `.env` (ignored by git) and is read in `prisma.config.ts` and `app/db.server.ts`.
- The schema with three tables: `User`, `Text`, `Result`. Deleting a user cascades to their texts and results; built-in texts have `ownerId` null so they survive.
- The first migration (`20261014153806_init`) and a seed script (`npm run db:seed`) that inserts the built-in texts and skips ones that already exist.
- The practice page now loads its text from the database in a `loader` instead of a hard-coded string.

Things I learned:

- **`.server.ts` keeps code out of the browser.** React Router never bundles a file with that suffix for the client, so the database URL cannot leak.
- **One Prisma client per process.** In development Vite reloads server files on every save. Caching the client on `globalThis` stops each reload from opening a new connection pool and exhausting Neon's connection limit.
- **Pooled vs direct URL.** The app uses the pooled URL; migrations use the direct (unpooled) one, as Neon recommends.

## 2026-10-12: Design

What I built:

- Shared header in `root.tsx` with the app name and a "Practice" link.
- A new home page with a short intro and a "Start practising" button.
- Practice page: the passage on a card in a monospace font, a progress bar, a colour legend, and the results as stat tiles.

Things I learned:

- **Focus hint without React state.** The textarea has Tailwind's `peer` class. The passage and the hint come after it, so `peer-focus:blur-none` and `peer-focus:hidden` let them react to whether the textarea has focus. CSS only works on elements that come _after_ the peer, which is why the textarea is first.
- **Normal spaces, not ` `.** No-break spaces stopped the text wrapping between words, so on a phone words split in the middle. With `whitespace-pre-wrap`, normal spaces stay visible and lines wrap between words.
- **Wrong characters are underlined, not just red,** so someone who can't tell red from green still sees the mistake.
