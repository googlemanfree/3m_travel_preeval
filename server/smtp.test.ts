/**
 * Test de configuration email — vérifie SMTP Gmail (App Password) et Resend API
 */
import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("Email Configuration", () => {
  it("RESEND_API_KEY should be defined", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key, "RESEND_API_KEY doit être défini").toBeTruthy();
    expect(key?.startsWith("re_"), "La clé Resend doit commencer par re_").toBe(true);
  });

  it("SMTP environment variables should be defined", () => {
    expect(process.env.SMTP_HOST, "SMTP_HOST doit être défini").toBeTruthy();
    expect(process.env.SMTP_USER, "SMTP_USER doit être défini").toBeTruthy();
    expect(process.env.SMTP_PASS, "SMTP_PASS doit être défini").toBeTruthy();
  });

  it("should connect to Gmail SMTP with App Password", async () => {
    const smtpPass = process.env.SMTP_PASS;
    const smtpUser = process.env.SMTP_USER;
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpPass || !smtpUser || !smtpHost) {
      console.warn("[SMTP Test] Variables SMTP manquantes — test ignoré");
      return;
    }

    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await new Promise<void>((resolve, reject) => {
      transport.verify((err, success) => {
        if (err) reject(new Error(`SMTP connexion échouée: ${err.message}`));
        else {
          console.log("[SMTP Test] Connexion Gmail réussie:", success);
          resolve();
        }
      });
    });
  }, 15000);

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
    console.log(`[Email Test] Resend email envoyé — ID: ${data.id}`);
  }, 15000);
});
