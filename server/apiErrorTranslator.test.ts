import { describe, expect, it } from "vitest";
import { translateApiErrorMessage } from "../client/src/lib/apiErrorTranslator";
import { UNAUTHED_ERR_MSG } from "@shared/const";

describe("API Error Translator", () => {
  it("translates known unauthorized message into English and French", () => {
    expect(translateApiErrorMessage(UNAUTHED_ERR_MSG, "fr")).toContain("connecter");
    expect(translateApiErrorMessage(UNAUTHED_ERR_MSG, "en")).toContain("log in");
  });

  it("translates network errors appropriately", () => {
    expect(translateApiErrorMessage("Failed to fetch", "fr")).toContain("serveur");
    expect(translateApiErrorMessage("Failed to fetch", "en")).toContain("reach the server");
  });

  it("falls back gracefully for unknown messages", () => {
    const customMsg = "Custom backend validation failed";
    expect(translateApiErrorMessage(customMsg, "fr")).toBe(customMsg);
    expect(translateApiErrorMessage(customMsg, "en")).toBe(customMsg);
  });
});
