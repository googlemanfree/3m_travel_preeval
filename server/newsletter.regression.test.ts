import { describe, expect, it } from "vitest";
import { newsletterSubscribeInput } from "./routers/newsletter";

describe("newsletter public subscription contract", () => {
  it("normalizes a valid address and defaults the language", () => {
    expect(newsletterSubscribeInput.parse({ email: "  VISITEUR@EXAMPLE.COM  ", consentGiven: true })).toEqual({
      email: "visiteur@example.com",
      language: "fr",
      consentGiven: true,
    });
  });

  it("requires explicit consent and rejects malformed addresses", () => {
    expect(() => newsletterSubscribeInput.parse({ email: "visitor@example.com", consentGiven: false })).toThrow();
    expect(() => newsletterSubscribeInput.parse({ email: "not-an-email", consentGiven: true })).toThrow();
  });
});
