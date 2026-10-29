import { describe, expect, it } from "vitest";
import { directionOf, isLocale, plural, translate, translator } from "./i18n";

describe("translate", () => {
  it("returns the English and Hebrew text for a key", () => {
    expect(translate("en", "nav.practice")).toBe("Practice");
    expect(translate("he", "nav.practice")).toBe("תרגול");
  });

  it("fills in placeholders", () => {
    expect(translate("en", "practice.chars", { n: 42 })).toBe("42 characters");
    expect(translate("he", "practice.chars", { n: 42 })).toBe("42 תווים");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(translate("en", "practice.chars")).toBe("{n} characters");
  });
});

describe("plural", () => {
  it("picks the singular form for exactly one", () => {
    const t = translator("en");
    expect(plural(t, "history.count", 1)).toBe("1 practice");
    expect(plural(t, "history.count", 3)).toBe("3 practices");
  });
});

describe("locale helpers", () => {
  it("recognises the supported locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("he")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("gives Hebrew a right-to-left direction", () => {
    expect(directionOf("he")).toBe("rtl");
    expect(directionOf("en")).toBe("ltr");
  });
});
