import { describe, expect, it } from "vitest";
import { isSupportedLanguage, normalizeLanguage } from "@shared/languagePreference";

describe("language preference", () => {
  it("accepts only the supported languages", () => {
    expect(isSupportedLanguage("fr")).toBe(true);
    expect(isSupportedLanguage("en")).toBe(true);
    expect(isSupportedLanguage("de")).toBe(false);
    expect(isSupportedLanguage(undefined)).toBe(false);
  });

  it("normalizes invalid values to French by default", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("de")).toBe("fr");
    expect(normalizeLanguage(null, "en")).toBe("en");
  });
});
