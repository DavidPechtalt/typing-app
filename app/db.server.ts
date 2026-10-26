import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "~/env.server";
import { PrismaClient } from "~/generated/prisma/client";

// In development the server reloads modules on every change. Keeping the client
// on globalThis stops each reload from opening a new pool of database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
