# Notes

## 2026-11-10: README and a last check

- Rewrote the README: every feature, the two languages, the data model, how admins are made.
- Went through every page once more in both languages and in dark mode. Checked that every clickable thing shows a pointer (Tailwind's reset gives buttons `cursor: default`, so there is one rule in `app.css` for buttons, summaries, selects and file inputs).

## 2026-11-09: Admin statistics and the full text of every text

What I built:

- `/admin/stats`: six charts. All the aggregation happens in the loader with the pure helpers in `app/lib/stats.ts` (`countPerDay`, `averagePerDay`, `histogram`, `countBy`), so the browser receives small arrays, not every row. Labels for sources and languages travel as translation keys and are translated in the component.
- `/admin/texts` now shows each text as a card with a `<details>` that reveals the whole content. No JavaScript needed and it works with the keyboard.

Things I learned:

- **Two texts can share a title.** The "most practised texts" list used the title as the React key and two uploads were both called "Market at dawn". React warned about duplicate keys in the console. Lists are keyed by id now.
- **Too many x labels pile up.** The speed histogram can have dozens of buckets; `labelEvery` keeps it to about twelve labels.

## 2026-11-07: Chart components and the history page

What I built:

- Four small SVG chart components in `app/components/charts/`: `ColumnChart`, `LineChart`, `BarList`, `SegmentedBar`. No chart library: a `viewBox` that scales to its container, hairline gridlines, a hover tooltip and a "show as table" view under every chart. `scale.ts` has `niceTicks`, which rounds the y-axis to 0 / 5 / 10 instead of 0 / 3.7 / 7.4.
- `/history`: personal bests (best WPM, average WPM, average accuracy, time typing), a line chart of the last 30 practices, and the full table with an "Again" link that opens the same text.
- The series colours were checked for colour-blind separation on both the light and the dark background.

Things I learned:

- **A chart always reads left to right**, so the SVG sits in a `dir="ltr"` wrapper even on the Hebrew pages.
- **`null` leaves a gap.** A day with no practices has no average; the line chart lifts the pen instead of drawing a misleading zero.

## 2026-11-05: Choosing a text on the practice page

What I built:

- `/practice?text=<id>` loads one text by id. Without an id the loader picks a random built-in text and _redirects_ to the URL with its id.
- "Next text" loads a different random built-in text (`?next=<id>` excludes the current one); for a Wikipedia text it fetches a new article instead. "Library" goes to `/texts`.
- Hebrew texts get `dir="rtl"` on the typing area, whatever language the interface is in, and the highlight sits on the right side of the next character.
- The results screen shows the WPM as the heading, four tiles below, and the three buttons.

Things I learned:

- **Loaders re-run after an action.** Saving a result makes the practice loader run again. With the random pick inside the loader the finished text was swapped for another one under the results. The redirect to a URL that contains the id fixed it.
- **`meta` receives `loaderData`, not `data`,** in React Router 8's typed `Route.MetaFunction`.

## 2026-11-04: Wikipedia

What I built:

- `/texts/wikipedia` (the external API). The form posts a language, the server calls `https://{lang}.wikipedia.org/api/rest_v1/page/random/summary`, cleans the `extract`, saves a Text with `source: WIKIPEDIA` and the article URL, and redirects to `/practice?text=<id>`.
- Pure helpers in `app/lib/wikipedia.ts` (tested): `cleanExtract` turns curly quotes and dashes into keyboard characters and drops citation marks; `trimToSentence` cuts long summaries at a sentence end; `summaryToPracticeText` rejects disambiguation pages and summaries that are too short.
- The HTTP call lives in `wikipedia.server.ts`: a User-Agent (Wikipedia asks for one), a 6 s timeout with `AbortSignal.timeout`, and up to four draws when an article is unsuitable.

Things I learned:

- **The random endpoint answers with a 303 redirect** to the chosen article; `fetch` follows it by default.
- **A loader that redirects hides action errors.** My first version redirected GET to `/texts`. After a failed action React Router re-runs the loader, so the error page never showed. The route renders a small page instead.
- **Prettier unescapes `\u` escapes** in regexes, which then trips ESLint's `no-irregular-whitespace` for U+00A0. Building the RegExp from a string keeps the escape visible.

## 2026-11-02: The text library and uploads

What I built:

- `Text.source` (enum `TextSource`: BUILTIN, UPLOAD, WIKIPEDIA) and `Text.sourceUrl`. Migration `20261029103000_add_text_source`. Existing rows got BUILTIN by default, so one `updateMany` marked every text with an owner as UPLOAD. Three more built-in texts in the seed.
- `/texts`: built-in texts for everyone, my uploads (with delete), and the Wikipedia buttons. The delete action uses `where: { id, ownerId: userId }`, so the ownership check is part of the query.
- `/texts/new`: paste a text or choose a `.txt` file. `encType="multipart/form-data"` is required for the file to be sent; `request.formData()` parses it and `file.text()` reads it. Zod normalises whitespace with `.transform()` before `.pipe()` checks the length (20 to 3000 characters).

Things I learned:

- **Uploaded texts collapse whitespace** to single spaces, because the comparison is character by character and nobody can type a line break on purpose.
- **Wikipedia texts are one-offs.** They have to be rows (a Result points at a Text), but they never appear in the library.

## 2026-10-30: Two languages and a new look

What I built:

- **Two interface languages.** `app/lib/i18n.ts` holds every string of the interface twice, English and Hebrew, as one flat dictionary per language (`"nav.practice": "Practice"`). `translate(locale, key, vars)` looks a key up and fills `{placeholders}`. No library: the whole mechanism is one file, and TypeScript checks that both dictionaries have the same keys.
- **Where the choice lives.** A small `locale` cookie (`app/lib/locale.server.ts`), separate from the session so guests keep their choice. `getLocale(request)` reads it, falls back to the browser's `Accept-Language`, then English. The root loader returns the locale; the `useTranslate()` hook reads it with `useRouteLoaderData("root")`, so any component can call `t("key")`.
- **The switch.** Two buttons, EN / עב, in the header: one form that POSTs to `/locale` with the locale and the current path; the action sets the cookie and redirects back.
- **Right-to-left.** `<html lang dir>` comes from the locale, so Hebrew flips the whole layout. All spacing uses logical utilities (`text-start`, `ms-2`, `pe-4`) instead of physical ones, so one class works in both directions.
- **Server messages too.** Actions get a translator with `getTranslator(request)` so validation and error messages come back in the user's language. Zod schemas that carry messages are built per request (`loginSchema(t)`).
- **Design tokens.** Every colour is a role (`--surface`, `--ink`, `--accent`) defined once for light and once for dark in `app.css` and exposed to Tailwind with `@theme inline`, so components write `bg-surface` instead of `bg-white dark:bg-slate-900` pairs. Serif headings (Lora, with Frank Ruhl Libre for Hebrew), Inter and Heebo for body, JetBrains Mono for the typed text. One yellow highlight for the next character and the main button, red only for mistakes.

Things I learned:

- **A font stack can mix scripts.** `font-family: "Lora", "Frank Ruhl Libre", serif`: the browser takes each glyph from the first font that has it.
- **Logical CSS properties.** `margin-inline-start` (Tailwind `ms-*`) means "the side where text starts": left in English, right in Hebrew. Writing every page with logical classes once is what makes `dir="rtl"` on `<html>` enough.
- **React Router cookies are encoded.** `createCookie` stores values as base64 JSON, so a hand-written `Cookie: locale=he` is not parsed; the real browser cookie is.
- **Tailwind v4 `@theme inline`** lets a utility like `bg-surface` point at a CSS variable that changes under `prefers-color-scheme: dark`.

## 2026-10-27: Admin pages and two bug fixes

What I built:

- `/admin/users`, `/admin/texts`, `/admin/results`: tables of everything in the database, each row with a Delete button. `AdminNav` (tab bar) and `DeleteButton` are shared components. Every loader and action calls `requireAdmin` first. Admin accounts show "Protected" and the action refuses to delete them.
- `/admin` cards link to those pages; the header shows "Admin" only to admins.
- 403 now has its own message in the root `ErrorBoundary`.
- `app/lib/format.ts`: `formatDate` and `formatDuration`, with tests.

Bugs fixed:

- **Practices were never saved.** A second `useEffect` in `practice.tsx` with no dependency array called `fetcher.submit({ textId: practiceText })` on every render after finishing. A fetcher only keeps its latest submission, so this GET cancelled the real POST before the server finished, and then kept firing. The action itself was fine (a direct POST saved a row). Deleting the stray effect fixed it: now one POST, one reload of the loader.
- **Login sent me back to `/admin.data`.** When React Router navigates inside the app it fetches `<page>.data`. If a guard redirects that request, `redirectTo` was the data URL, so after login I saw raw data. `pagePathFromRequestPath` in `app/lib/redirect.ts` strips `.data` (and maps `/_root.data` to `/`).

Things I learned:

- **`sr-only` is `position: absolute`.** Inside a table that scrolls (`overflow-x-auto`), it escaped the scroll box and made the whole page wider on a phone. `relative` on the scroll box keeps it inside.
- **`dir="auto"`** lets the browser show Hebrew right-to-left without me deciding per text.
- **A link can't wrap `<dt>`/`<dd>`.** To make a whole stat card clickable, the link sits in the `<dt>` and its `::after` covers the card (`after:absolute after:inset-0` on the link, `relative` on the card).

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
