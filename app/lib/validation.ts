import { z } from "zod";
import { normalizePracticeText } from "./practice-text";

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

export const newTextSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the text a title.")
    .max(100, "Use at most 100 characters."),
  language: z.enum(["en", "he"], "Choose a language."),
  content: z
    .string()
    .transform(normalizePracticeText)
    .pipe(
      z
        .string()
        .min(20, "Use at least 20 characters.")
        .max(2000, "Use at most 2000 characters."),
    ),
});

export const savePracticeSchema = z.object({
  textId: z.coerce.number().int().positive(),
  typedText: z.string().max(10_000),
  // Positions that were ever wrong, sent as "3,17,42".
  incorrectPositions: z
    .string()
    .transform((value) => (value === "" ? [] : value.split(",").map(Number)))
    .pipe(z.array(z.number().int().nonnegative()).max(10_000)),
  // At most 2 hours.
  durationMs: z.coerce
    .number()
    .int()
    .positive()
    .max(2 * 60 * 60 * 1000),
});
