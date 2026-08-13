import { describe, expect, it } from "vitest";
import { UI_MESSAGES } from "../client/src/lib/uiMessages";

describe("UI Messages bilingual dictionary", () => {
  it("contains both French and English translations for all keys", () => {
    const keys = Object.keys(UI_MESSAGES) as Array<keyof typeof UI_MESSAGES>;
    expect(keys.length).toBeGreaterThan(5);
    for (const key of keys) {
      expect(UI_MESSAGES[key].fr).toBeTypeOf("string");
      expect(UI_MESSAGES[key].en).toBeTypeOf("string");
      expect(UI_MESSAGES[key].fr.length).toBeGreaterThan(0);
      expect(UI_MESSAGES[key].en.length).toBeGreaterThan(0);
    }
  });

  it("has correct network error translations", () => {
    expect(UI_MESSAGES.networkError.fr).toContain("réseau");
    expect(UI_MESSAGES.networkError.en).toContain("Network");
  });
});
