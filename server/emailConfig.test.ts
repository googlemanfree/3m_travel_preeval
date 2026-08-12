import { describe, expect, it } from "vitest";
import { normalizeResendSender } from "./_core/email";

describe("configuration Resend", () => {
  it("utilise l’adresse officielle même si l’environnement contient encore l’ancien format", () => {
    expect(normalizeResendSender(process.env.RESEND_FROM_EMAIL)).toBe("hello@3mtravelagency.com");
    expect(normalizeResendSender("mailto:hello@3mtravelagency.click")).toBe("hello@3mtravelagency.com");
  });
});
