import { config } from "dotenv";
import { z } from "zod";

// Load .env in development. In production the hosting platform sets the variables.
config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;
