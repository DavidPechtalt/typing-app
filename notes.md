# Notes

## 2026-10-25: User roles (start of the admin section)

What I built:

- A `Role` enum (`USER`, `ADMIN`) in the schema and a `role` field on `User` with `@default(USER)`. Migration `20261025115737_add_user_role` creates the Postgres type and adds the column; the default fills `USER` into every existing row, which is why adding a `NOT NULL` column to a table that already has rows works.
- Made my own account admin with SQL instead of through the app, so there is no way to register as admin: `npx prisma db execute --stdin <<< "UPDATE \"User\" SET role = 'ADMIN' WHERE email = '...';"`

Things I learned:

- **Prisma 7: `migrate dev` no longer runs `generate`.** The database got the `role` column but the TypeScript client in `generated/prisma` did not know it, and a query selecting `role` failed with "Unknown field `role`". After every schema change: `npx prisma migrate dev`, then `npx prisma generate`, then restart the dev server.
- **Quoted table names.** Prisma creates the table as `"User"` with a capital U. Postgres lowercases names that are not in double quotes, so `UPDATE User` would look for a table called `user`.
- **The enum protects the data.** `'admin'` (lowercase) is rejected by Postgres; only the exact enum values are allowed.

## 2026-10-22: Saving results

What I built:

- The practice page saves every finished attempt. A `useEffect` watches `isFinished`; when it flips to true it calls `fetcher.submit` with the stats, which POSTs to the route's own `action`. A `useRef` flag makes sure it submits once per attempt.
- The action reads the user id from the session cookie (never from the form), validates the stats with Zod (`z.coerce.number()` because FormData only carries strings), checks the text still exists, then `db.result.create`. A guest gets 401 and the page shows a "Log in to save your results" link; bad input gets 400.
- The loader now returns `textId` next to the text so the Result row can reference it.
- Tested with curl: guest 401, bad number 400, missing text 400, logged in 200 and the row appeared in Neon.

Things I learned:

- **`fetcher.submit` vs `<Form>`.** A fetcher posts without navigating, so the results stay on screen and `fetcher.state` / `fetcher.data` drive the "Saving… / Saved" message.
- **Dependency array = "re-run when one of these changes".** ESLint's `exhaustive-deps` lists every value the effect reads because it only sees what the code reads, not what it means. This effect is a one-time event, so the array is `[isFinished]` with a disable comment explaining why.
- **`data()` wraps the action's return type.** `fetcher.data` typed through `useFetcher<typeof action>()` and `Route.ComponentProps["actionData"]` unwraps it; `Awaited<ReturnType<typeof action>>` does not.
- **Check the foreign key yourself.** Posting a `textId` that does not exist crashed with `Result_textId_fkey`. A `findUnique` first turns that into a clean 400.

## 2026-10-20: Logout and the email bug

What I built:

- `/logout`: a route with no page. The action calls `logout()` from `session.server.ts`, which answers with a redirect to `/` and a `Set-Cookie` header that deletes `__session`. The loader (GET) only redirects home.
- The header in `root.tsx` now knows the user. A root loader calls `getUser(request)` on every page and the nav shows "Log in / Register" or the email plus a "Log out" button.
- Fixed a bug I found by accident: I registered twice with the same Gmail address, once with a capital letter. Both register and login now `.toLowerCase()` the email in the Zod schema. Deleted the duplicate account.

Things I learned:

- **The root loader runs for every page.** Every URL matches the root route, so it is the one place that can answer "who is logged in" without each page asking again. Pages that _require_ a user still call `requireUserId` themselves.
- **Log out is a form, not a link.** Logging out changes server state. A GET link could be fired by an `<img src="/logout">` on any site; a POST form can only be submitted on purpose, and the cookie's `sameSite: "lax"` blocks cross-site POSTs. That is also why GET `/logout` only redirects.
- **`@unique` is exact in Postgres.** `Davidpechtalt@` and `davidpechtalt@` are different strings, so the unique constraint and `findUnique` both saw two users. Normalising at the input boundary (Zod) is the usual fix; the alternative is Postgres's `citext` type, which needs an extension.
- **`.trim().toLowerCase().pipe(z.email())`.** Zod transforms run in order, so the email is cleaned before validation, and the cleaned value is what the action receives.

## 2026-10-18: Session, register and login

What I built:

- `app/session.server.ts`: the login state. After login the user's id goes into a signed cookie; every request that needs the user reads it back. Public functions: `getUserId`, `getUser`, `requireUserId`, `createUserSession`, `logout`.
- `SESSION_SECRET` in `.env`, generated with `openssl rand -hex 32`. The server refuses to start without it, same as with `DATABASE_URL`.
- `.env.example` and a README section listing the three env variables, so someone else can run the app.
- `/register`: Zod schema (trimmed email, password of at least 8), check that the email is free, hash with bcrypt (10 rounds), create the user, then `createUserSession`. Errors come back per field with status 400 through `data()`.
- `/login`: same form, but `bcrypt.compare` against the stored hash. Unknown email and wrong password give the same "Wrong email or password".
- `app/lib/redirect.ts`: `safeRedirect` and `DEFAULT_REDIRECT`. Both pages read `?redirectTo=` from the URL and send the user back there after success, with unit tests.

Things I learned:

- **A signed cookie is not an encrypted cookie.** The user id is readable in the browser, but changing it breaks the signature and the server returns an empty session. That is why the secret must stay in `.env`.
- **`httpOnly` + `sameSite: "lax"`.** `httpOnly` hides the cookie from page JavaScript (XSS can't steal it). `sameSite` stops other sites from posting forms with my cookie attached (CSRF).
- **`secure` only in production.** The dev server runs on plain http, so if `secure` were always on the browser would silently drop the cookie and nothing would stay logged in.
- **Throwing a redirect.** `requireUserId` does `throw redirect("/login?redirectTo=...")`. React Router catches a thrown Response and sends it, so the loader stops right there. `redirectTo` lets login send the user back to the page they wanted.
- **`select` in Prisma.** `getUser` asks only for `id` and `email`, so the password hash never leaves the database layer.
- **No sessions table.** The whole session lives in the cookie. For a single user id that is enough; a table would only be needed for things like "log out everywhere".
- **Hashing is a fingerprint, not a key.** Login hashes the typed password with the salt that is stored inside the hash string itself (`$2b$10$` + 22 chars of salt + 31 chars of hash) and compares. A stolen hash can't be typed into the form, because it would just get hashed again. The salt is not secret; it only makes every hash unique so one precomputed table can't attack the whole table.
- **Why bcrypt is slow on purpose.** 10 rounds = about 100 ms per attempt. Nothing for one login, years for someone guessing millions of passwords against a stolen database.
- **Open redirect.** `redirectTo` is put in the URL by `requireUserId`, but anyone can write a URL. `safeRedirect` accepts only paths that start with exactly one `/` (not `//host` or `/\host`), otherwise it falls back to `/practice`.
- **No hidden input needed for `redirectTo`.** `<Form>` posts to the page's own URL including the query string, so the action sees the same parameter as the loader.
- **Same error for both login failures.** If "no such email" and "wrong password" had different messages, the form would tell anyone which emails are registered.
- **Login has no minimum password length.** The length rule is a registration rule. If I ever change it, old accounts must still log in, and every wrong guess should produce the same one message. (Not a security argument: the minimum is printed on the register page anyway.)
- **TypeScript narrowing.** After `if (typeof to !== "string") return`, `to` is just `string`, so `startsWith` is available. Before that line it is still the whole union.

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
