/**
 * Test de configuration email — vérifie que Resend API est disponible
 * Note : SMTP Gmail nécessite un App Password (pas le mot de passe normal).
 * Ce projet utilise Resend en priorité pour l'envoi d'emails.
 */
import { describe, it, expect } from "vitest";

describe("Email Configuration", () => {
  it("RESEND_API_KEY should be defined", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key, "RESEND_API_KEY doit être défini").toBeTruthy();
    expect(key?.startsWith("re_"), "La clé Resend doit commencer par re_").toBe(true);
  });

  it("SMTP environment variables should be defined", () => {
    expect(process.env.SMTP_HOST, "SMTP_HOST doit être défini").toBeTruthy();
    expect(process.env.SMTP_USER, "SMTP_USER doit être défini").toBeTruthy();
    // SMTP_PASS peut être vide si on utilise Resend en priorité
  });

  it("should send email via Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[Email Test] RESEND_API_KEY non défini — test ignoré");
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "3M Travel <onboarding@resend.dev>",
        to: ["3mtravelandservices@gmail.com"],
        subject: "Test Email — 3M Travel Agency",
        html: "<p>✅ Test d'envoi email Resend réussi pour 3M Travel Agency.</p>",
      }),
    });

    const data = await res.json() as { id?: string; name?: string; message?: string };
    expect(res.ok, `Resend API erreur: ${JSON.stringify(data)}`).toBe(true);
    expect(data.id).toBeTruthy();
    console.log(`[Email Test] Email envoyé avec succès — ID: ${data.id}`);
  }, 15000);
});
