import { config } from "dotenv";
import { z } from "zod";

// Load .env in development. In production the hosting platform sets the variables.
config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.url(),
  // Signs the session cookie so users can't edit it. At least 32 random characters.
  SESSION_SECRET: z.string().min(32),
  // The address the app runs at; Google sends users back here after sign-in.
  APP_URL: z.url().default("http://localhost:5173"),
  // Optional: Google sign-in is turned off until both are set.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;
