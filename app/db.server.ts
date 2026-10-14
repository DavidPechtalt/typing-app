// The single Prisma client for the whole app.
// The `.server.ts` suffix tells React Router to keep this file out of the browser bundle,
// so the database URL never reaches the client.
//
// Prisma 7 talks to Postgres through a driver adapter. `pg` (node-postgres) keeps a
// connection pool open, which suits a long-running Node server like `react-router-serve`.
//
// In development, Vite reloads server modules on every change. Without the globalThis cache
// each reload would create a new PrismaClient and a new pool, and Neon would run out of
// connections. The cache keeps one client alive across reloads.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

declare global {
  var __prisma: PrismaClient | undefined;
}

export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
