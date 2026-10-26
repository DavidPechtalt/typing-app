# Typing App

A web app for practising typing. You type a passage and get live feedback for each character (correct, wrong, not typed yet). When you finish, you see your words per minute, accuracy, mistakes and corrections.

Built with React Router (framework mode, the successor to Remix), TypeScript and Tailwind CSS.

## Requirements

- Node.js 22 or newer
- npm
- Docker (for the local PostgreSQL database), or a PostgreSQL URL from Neon

## Getting started

```bash
cp .env.example .env     # then set SESSION_SECRET (openssl rand -hex 32)
docker compose up -d     # start PostgreSQL locally
npm install              # also generates the Prisma client
npm run db:migrate       # create the tables
npm run db:seed          # add the built-in practice texts
npm run dev
```

Open http://localhost:5173 and choose **Start practising**.

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
| `npm run db:migrate`   | Apply schema changes to the database      |
| `npm run db:seed`      | Add the built-in practice texts           |
| `npm run db:studio`    | Browse the database in the browser        |

## Google sign-in (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Add `http://localhost:5173/auth/google/callback` as an **Authorized redirect URI** (for production, `<APP_URL>/auth/google/callback`).
3. Put the client ID and secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and restart the dev server.

The "Continue with Google" button only appears when both values are set.

## Project structure

```
app/
  routes/       one file per page (loader, action, meta and the page component)
  components/   reusable UI pieces
  lib/          pure logic with no React (character comparison, statistics) and its tests
  generated/    Prisma client, generated from the schema (not committed)
  models/       database functions per table (e.g. user.server.ts)
  db.server.ts  the single Prisma client (server only)
  session.server.ts  the login cookie: create, read, destroy
  google.server.ts   Google sign-in (OAuth 2.0)
  env.server.ts checks environment variables when the server starts
  root.tsx      the HTML layout and the top-level error page
  routes.ts     maps URLs to route files
prisma/
  schema.prisma tables and relations
  migrations/   SQL history of every schema change
  seed.ts       built-in practice texts
```

## How the results are calculated

- **WPM:** correct characters ÷ 5 ÷ minutes.
- **Mistakes:** positions that were typed wrong at any point, including ones that were corrected later.
- **Accuracy:** characters typed right the first time ÷ total characters.

## Running with Docker

```bash
docker build -t typing-app .
docker run -p 3000:3000 typing-app
```
