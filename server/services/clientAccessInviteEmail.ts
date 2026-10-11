/**
 * E-mail d’invitation / renvoi d’accès espace client (lien reset-password 48 h).
 */

import { sendEmail as sendGenericEmail } from "../_core/email";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendClientAccessInviteEmail(input: {
  email: string;
  fullName: string;
  dossierNumber: string;
  setPasswordUrl: string;
  isResend?: boolean;
}): Promise<void> {
  const headline = input.isResend
    ? "Rappel : activez votre espace client"
    : "Votre dossier agence est prêt";
  const intro = input.isResend
    ? `Voici un nouveau lien pour accéder à votre espace client et suivre le dossier <strong>${esc(input.dossierNumber)}</strong>.`
    : `Votre dossier <strong>${esc(input.dossierNumber)}</strong> a été ouvert en agence. Activez votre espace client pour voir vos documents et suivre chaque étape.`;
  const cta = input.isResend ? "Ouvrir mon espace client" : "Activer mon espace client";

  await sendGenericEmail({
    to: input.email,
    subject: `${input.isResend ? "Rappel — " : ""}Votre espace client ${input.dossierNumber} — 3M TRAVEL AGENCY`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center; color: #fff;">
          <h1 style="margin: 0; font-size: 22px;">3M TRAVEL AGENCY</h1>
          <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 13px;">${esc(headline)}</p>
        </div>
        <div style="padding: 32px 28px; color: #374151;">
          <p>Bonjour <strong>${esc(input.fullName)}</strong>,</p>
          <p>${intro}</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${esc(input.setPasswordUrl)}" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700;">${esc(cta)}</a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">Ce lien est valable 48 heures. Ensuite, utilisez « Mot de passe oublié » sur la page de connexion.</p>
        </div>
      </div>
    `,
  });
}
