// Proves the database connection works.
// Run with: npm run db:check
// It builds the same adapter + client pair as app/db.server.ts, runs a trivial query,
// and prints the Postgres version. If DATABASE_URL is missing or wrong, it fails loudly.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const rows = await db.$queryRaw<
  { ok: number; version: string }[]
>`SELECT 1 AS ok, version()`;
console.log(rows[0]);
await db.$disconnect();
