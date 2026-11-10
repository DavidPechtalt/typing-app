# Keystroke – Typing App

A web app for practising typing. You type a passage and get live feedback for each character (correct, wrong, corrected, not typed yet). When you finish, you see your words per minute, accuracy, mistakes and corrections.

Built with React Router (framework mode, the successor to Remix), TypeScript, Tailwind CSS, Prisma and PostgreSQL (Neon).

## Features

- **Practice** (`/practice`): live character-by-character feedback, blinking cursor on the next character, progress bar, results screen. Hebrew texts are shown right-to-left.
- **Texts** (`/texts`): built-in passages, your own uploads, and random Wikipedia articles.
  - **Upload** (`/texts/new`): paste a text or choose a `.txt` file (English or Hebrew, 20–3000 characters). Logged-in users only; you can delete your own texts.
  - **Wikipedia** (`/texts/wikipedia`): the server fetches a random article summary from the Wikipedia REST API (`https://{en|he}.wikipedia.org/api/rest_v1/page/random/summary`), cleans it (typographic quotes, dashes, citation marks), trims it to a sentence boundary, saves it as a text and starts a practice. Unsuitable articles (too short, disambiguation pages) are skipped and another one is drawn.
- **Two languages**: the whole interface in English or Hebrew (EN / עב switch in the header, remembered in a cookie, Hebrew laid out right-to-left). Translations live in `app/lib/i18n.ts`.
- **Accounts**: register, log in, log out (bcrypt password hashes, signed httpOnly session cookie).
- **History** (`/history`): every saved practice of the logged-in user, personal bests and a speed-over-time chart.
- **Admin** (`/admin`, admins only): overview counts; **Statistics** with charts (practices per day, average speed per day, new users per day, speed distribution, most practised texts, texts by source and language); **Users**, **Texts** (with the full content of every text) and **Practices** pages with delete.

Admins are created by hand, never through the app:

```bash
npx prisma db execute --stdin <<< "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'you@example.com';"
```

## Requirements

- Node.js 22 or newer
- npm

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values, see below
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Environment variables

`.env` is ignored by git and must never be committed. `.env.example` lists the variables:

| Variable                | What it is                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Pooled Postgres connection string (from the Neon dashboard), used by the app        |
| `DATABASE_URL_UNPOOLED` | Direct connection string, used by Prisma migrations                                 |
| `SESSION_SECRET`        | Random string that signs the login cookie. Generate one with `openssl rand -hex 32` |

The app refuses to start if `DATABASE_URL` or `SESSION_SECRET` is missing.

Open http://localhost:5173 and choose **Start practising**.

No API key is needed for Wikipedia; the server only needs outbound HTTPS access.

## Scripts

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the development server              |
| `npm run build`        | Create a production build in `build/`     |
| `npm start`            | Run the production build                  |
| `npm test`             | Run the unit tests (Vitest)               |
| `npm run typecheck`    | Generate route types and check TypeScript |
| `npm run lint`         | Check the code with ESLint                |
| `npm run format`       | Format all files with Prettier            |
| `npm run format:check` | Check formatting without changing files   |
| `npm run db:seed`      | Insert the built-in practice texts        |
| `npx prisma studio`    | Browse the database in the browser        |

## Project structure

```
app/
  routes/       one file per page (loader, action, meta and the page component)
  components/   reusable UI pieces (charts/ holds the SVG chart components)
  lib/          pure logic with no React (character comparison, statistics,
                Wikipedia text cleaning) and its tests
  lib/i18n.ts   every interface string in English and Hebrew, and translate()
  lib/*.server.ts  server-only code (the Wikipedia HTTP call, the locale cookie)
  session.server.ts  login cookie, requireUserId / requireAdmin guards
  db.server.ts  the single Prisma client
  app.css       design tokens (light and dark) and shared component classes
  root.tsx      the HTML layout, header, footer and the top-level error page
  routes.ts     maps URLs to route files
prisma/
  schema.prisma the data model (User, Text, Result)
  migrations/   SQL history of the schema
  seed.ts       built-in texts
```

## Data model

- **User**: id, email (unique, lowercased), passwordHash, role (`USER` | `ADMIN`), createdAt
- **Text**: id, title, content, language (`en` | `he`), source (`BUILTIN` | `UPLOAD` | `WIKIPEDIA`), sourceUrl, ownerId (null for built-in), createdAt
- **Result**: id, userId, textId, wpm, accuracy, mistakes, corrections, durationMs, createdAt

Deleting a user removes their texts and results; deleting a text removes its results (cascade).

## How the results are calculated

- **WPM:** correct characters ÷ 5 ÷ minutes.
- **Mistakes:** positions that were typed wrong at any point, including ones that were corrected later.
- **Accuracy:** characters typed right the first time ÷ total characters.

## Running with Docker

```bash
docker build -t typing-app .
docker run -p 3000:3000 typing-app
```
