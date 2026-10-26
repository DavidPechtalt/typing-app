import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./validation";

describe("loginSchema", () => {
  it("trims and lower-cases the email", () => {
    const result = loginSchema.safeParse({
      email: "  Dana@Mail.COM ",
      password: "secret",
    });

    expect(result.success && result.data.email).toBe("dana@mail.com");
  });

  it("rejects an invalid email and an empty password", () => {
    const result = loginSchema.safeParse({ email: "dana", password: "" });

    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a valid email and an 8-character password", () => {
    const result = registerSchema.safeParse({
      email: "dana@mail.com",
      password: "12345678",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "dana@mail.com",
      password: "1234567",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password longer than 72 characters", () => {
    const result = registerSchema.safeParse({
      email: "dana@mail.com",
      password: "a".repeat(73),
    });

    expect(result.success).toBe(false);
  });
});
