import { z } from "zod";

// Emails are stored lower-case, so "Dana@Mail.com" and "dana@mail.com" are one account.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  redirectTo: z.string().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  // bcrypt only uses the first 72 bytes of a password.
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use at most 72 characters."),
  redirectTo: z.string().optional(),
});
