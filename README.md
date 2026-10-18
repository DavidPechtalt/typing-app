# Typing App

A web app for practising typing. You type a passage and get live feedback for each character (correct, wrong, not typed yet). When you finish, you see your words per minute, accuracy, mistakes and corrections.

Built with React Router (framework mode, the successor to Remix), TypeScript and Tailwind CSS.

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

## Project structure

```
app/
  routes/       one file per page (loader, action, meta and the page component)
  components/   reusable UI pieces
  lib/          pure logic with no React (character comparison, statistics) and its tests
  root.tsx      the HTML layout and the top-level error page
  routes.ts     maps URLs to route files
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
