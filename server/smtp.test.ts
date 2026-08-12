/**
 * Test de configuration SMTP — Validation de l'envoi d'emails
 */

import { describe, it, expect, beforeAll } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP Configuration", () => {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM;

  it("should have SMTP environment variables configured", () => {
    expect(SMTP_HOST).toBeDefined();
    expect(SMTP_USER).toBeDefined();
    expect(SMTP_PASS).toBeDefined();
    expect(SMTP_FROM).toBeDefined();
  });

  it("should have valid SMTP_HOST", () => {
    expect(SMTP_HOST).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/i);
  });

  it("should have valid SMTP_PORT", () => {
    expect(SMTP_PORT).toBeGreaterThan(0);
    expect(SMTP_PORT).toBeLessThan(65536);
    expect([25, 465, 587, 2525]).toContain(SMTP_PORT);
  });

  it("should have valid SMTP_USER email format", () => {
    expect(SMTP_USER).toMatch(/\S+@\S+\.\S+/);
  });

  it("should have SMTP_FROM in correct format", () => {
    expect(SMTP_FROM).toBeTruthy();
  });

  it("should create valid SMTP transporter", async () => {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      // Vérifier la connexion SMTP
      const verified = await transporter.verify();
      expect(verified).toBe(true);
      console.log("[SMTP Test] ✓ Connexion SMTP réussie");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[SMTP Test] Erreur de connexion:", errorMsg);
      throw new Error(`Impossible de se connecter au serveur SMTP: ${errorMsg}`);
    }
  });

  it("should send test email successfully", async () => {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: SMTP_USER, // Envoyer à soi-même pour le test
        subject: "[Test] Configuration SMTP 3M Travel & Services",
        html: `
          <h2>Test de configuration SMTP</h2>
          <p>Cet email confirme que votre configuration SMTP fonctionne correctement.</p>
          <p><strong>Détails :</strong></p>
          <ul>
            <li>Host: ${SMTP_HOST}</li>
            <li>Port: ${SMTP_PORT}</li>
            <li>User: ${SMTP_USER}</li>
            <li>From: ${SMTP_FROM}</li>
          </ul>
          <p>Les emails de confirmation des candidats seront maintenant envoyés automatiquement.</p>
        `,
      });

      expect(info.messageId).toBeDefined();
      console.log("[SMTP Test] ✓ Email de test envoyé avec succès");
      console.log("[SMTP Test] Message ID:", info.messageId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[SMTP Test] Erreur lors de l'envoi:", errorMsg);
      throw new Error(`Impossible d'envoyer l'email de test: ${errorMsg}`);
    }
  });
});
