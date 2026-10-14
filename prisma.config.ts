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
    url: process.env["DATABASE_URL"],
  },
});
