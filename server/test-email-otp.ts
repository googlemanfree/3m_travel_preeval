/**
 * Test d'envoi d'email OTP
 * Exécuter avec: npx tsx server/test-email-otp.ts
 */

import { sendEmail } from "./_core/email";

async function testEmailOTP() {
  console.log("[TEST] Démarrage du test d'envoi d'email OTP...");

  try {
    const testOTP = "123456";
    const testEmail = "test@example.com";

    const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Connexion Admin 3M Travel</h2>
      <p>Bonjour Admin,</p>
      <p>Voici votre code de connexion sécurisé :</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1e40af; letter-spacing: 5px; margin: 0;">${testOTP}</h1>
      </div>
      <p style="color: #666;">Ce code expire dans <strong>10 minutes</strong>.</p>
      <p style="color: #666;">Si vous n'avez pas demandé cette connexion, ignorez cet email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
    </div>`;

    await sendEmail({
      to: testEmail,
      subject: "🔐 Votre code OTP - 3M Travel Admin (TEST)",
      html: htmlContent,
    });

    console.log("[TEST] ✅ Email OTP envoyé avec succès !");
  } catch (error) {
    console.error("[TEST] ❌ Erreur lors de l'envoi de l'email OTP:", error);
    process.exit(1);
  }
}

testEmailOTP();
