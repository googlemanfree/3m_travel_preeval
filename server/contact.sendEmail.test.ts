import { describe, it, expect, beforeAll } from "vitest";
import { sendEmail } from "./_core/email";

describe("Email Service", () => {
  beforeAll(() => {
    // Vérifier que RESEND_API_KEY est défini
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
  });

  it.runIf(process.env.RUN_EXTERNAL_EMAIL_TESTS === "true")("should send an email successfully", async () => {
    try {
      await sendEmail({
        to: "test@resend.dev",
        subject: "[Test] Validation de la clé API Resend",
        html: "<h2>Test d'envoi d'email</h2><p>Cet email valide que la clé API Resend fonctionne correctement.</p>",
      });
      expect(true).toBe(true);
    } catch (error) {
      console.error("Email send failed:", error);
      throw error;
    }
  });

  it("should have RESEND_API_KEY configured", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).not.toBe("");
  });
});
