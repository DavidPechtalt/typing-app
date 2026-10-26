import { describe, expect, it } from "vitest";
import {
  loginSchema,
  newTextSchema,
  registerSchema,
  savePracticeSchema,
} from "./validation";

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

describe("newTextSchema", () => {
  it("cleans up the pasted content", () => {
    const result = newTextSchema.safeParse({
      title: " My text ",
      language: "en",
      content: "First line\nsecond line — with a dash.",
    });

    expect(result.success && result.data).toEqual({
      title: "My text",
      language: "en",
      content: "First line second line - with a dash.",
    });
  });

  it("rejects content that is too short after clean-up", () => {
    const result = newTextSchema.safeParse({
      title: "Short",
      language: "en",
      content: "  too   short \n ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown language", () => {
    const result = newTextSchema.safeParse({
      title: "Text",
      language: "fr",
      content: "This text is long enough to practise.",
    });

    expect(result.success).toBe(false);
  });
});

describe("savePracticeSchema", () => {
  it("parses the positions list", () => {
    const result = savePracticeSchema.safeParse({
      textId: "4",
      typedText: "abc",
      incorrectPositions: "0,2",
      durationMs: "5000",
    });

    expect(result.success && result.data).toEqual({
      textId: 4,
      typedText: "abc",
      incorrectPositions: [0, 2],
      durationMs: 5000,
    });
  });

  it("accepts an empty positions list", () => {
    const result = savePracticeSchema.safeParse({
      textId: "4",
      typedText: "abc",
      incorrectPositions: "",
      durationMs: "5000",
    });

    expect(result.success && result.data.incorrectPositions).toEqual([]);
  });

  it("rejects positions that are not whole numbers", () => {
    const result = savePracticeSchema.safeParse({
      textId: "4",
      typedText: "abc",
      incorrectPositions: "1,x",
      durationMs: "5000",
    });

    expect(result.success).toBe(false);
  });
});
