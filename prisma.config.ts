// Prisma CLI configuration (Prisma 7 moved the connection URL here from schema.prisma).
// dotenv loads .env so DATABASE_URL is available when running `npx prisma ...`.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations use the direct (unpooled) connection, as Neon recommends.
    // The app itself uses the pooled DATABASE_URL in app/db.server.ts.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
