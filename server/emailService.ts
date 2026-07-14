/**
 * Service d'envoi d'emails pour 3M Travel & Services
 * Utilise Nodemailer avec SMTP configurable via variables d'environnement.
 * En l'absence de credentials SMTP, les emails sont loggués en console (mode dev).
 */
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "3M Travel & Services <noreply@3mtravelagency.click>";
const SITE_URL = process.env.SITE_URL ?? "https://3mtravelagency.click";

function createTransport() {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  // Mode développement : afficher dans la console
  return null;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    // Mode dev : afficher dans la console
    console.log(`\n📧 [EMAIL DEV MODE] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, "")}\n`);
    return;
  }
  await transport.sendMail({ from: SMTP_FROM, to, subject, html });
}

// ─── Templates HTML ───────────────────────────────────────────────────────────

function emailBase(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 20px; }
  .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,138,0.1); }
  .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center; }
  .header img { width: 56px; height: 56px; border-radius: 12px; margin-bottom: 12px; }
  .header h1 { color: #fff; font-size: 22px; margin: 0; font-weight: 800; }
  .header p { color: #bfdbfe; font-size: 13px; margin: 6px 0 0; }
  .body { padding: 32px 28px; }
  .otp-box { background: #eff6ff; border: 2px dashed #2563EB; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
  .otp-code { font-size: 40px; font-weight: 900; color: #1E3A8A; letter-spacing: 12px; }
  .otp-label { font-size: 12px; color: #6b7280; margin-top: 8px; }
  .btn { display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 16px 0; }
  .footer { background: #f8faff; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  p { color: #374151; line-height: 1.6; font-size: 15px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>3M Travel & Services</h1>
    <p>Votre partenaire mobilité internationale</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>3M Travel & Services — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
    <p>Yaoundé, Cameroun | +237 620-996-045 | contact@3mtravelagency.click</p>
    <p style="margin-top:8px;font-size:11px;">Cet email a été envoyé automatiquement. Ne pas répondre à cet email.</p>
  </div>
</div>
</body>
</html>`;
}

// ─── Email de vérification OTP ────────────────────────────────────────────────

export async function sendVerificationOtp(to: string, fullName: string, otp: string): Promise<void> {
  const content = `
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! Pour activer votre compte, entrez le code de vérification ci-dessous :</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-label">Ce code expire dans <strong>15 minutes</strong></div>
    </div>
    <p>Si vous n'avez pas créé de compte sur 3M Travel, ignorez cet email.</p>
    <p style="font-size:13px;color:#6b7280;">Pour votre sécurité, ne partagez jamais ce code avec qui que ce soit, même avec notre équipe.</p>
  `;
  await sendEmail(to, "🔐 Votre code de vérification 3M Travel", emailBase(content));
}

// ─── Email de réinitialisation de mot de passe ────────────────────────────────

export async function sendPasswordResetEmail(to: string, fullName: string, resetToken: string): Promise<void> {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
  const content = `
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte 3M Travel.</p>
    <p style="text-align:center;">
      <a href="${resetUrl}" class="btn">🔑 Réinitialiser mon mot de passe</a>
    </p>
    <p style="font-size:13px;color:#6b7280;">Ce lien est valable <strong>1 heure</strong>. Après ce délai, vous devrez faire une nouvelle demande.</p>
    <p style="font-size:13px;color:#6b7280;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé.</p>
    <p style="font-size:12px;color:#9ca3af;word-break:break-all;">Lien direct : ${resetUrl}</p>
  `;
  await sendEmail(to, "🔑 Réinitialisation de votre mot de passe 3M Travel", emailBase(content));
}

// ─── Email de bienvenue (après vérification) ─────────────────────────────────

export async function sendWelcomeEmail(to: string, fullName: string, destination: string): Promise<void> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const destLabels: Record<string, string> = {
    canada: "🇨🇦 Canada",
    luxembourg: "🇱🇺 Luxembourg",
    pologne: "🇵🇱 Pologne",
    europe: "🇪🇺 Europe Schengen",
    golfe: "🇦🇪 Golfe & Moyen-Orient",
    autre: "International",
  };
  const destLabel = destLabels[destination] ?? "International";
  const content = `
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>🎉 Votre compte 3M Travel est maintenant <strong>activé</strong> ! Votre dossier d'immigration vers <strong>${destLabel}</strong> est ouvert.</p>
    <p>Voici ce que vous pouvez faire dès maintenant :</p>
    <ul style="color:#374151;line-height:2;">
      <li>📁 Uploader vos documents (CV, passeport, diplômes)</li>
      <li>💬 Contacter directement votre conseiller</li>
      <li>📊 Suivre l'avancement de votre dossier en temps réel</li>
      <li>✈️ Rechercher des vols vers votre destination</li>
    </ul>
    <p style="text-align:center;">
      <a href="${dashboardUrl}" class="btn">🚀 Accéder à mon espace</a>
    </p>
    <p>Notre équipe vous contactera sous 24h pour la suite de votre dossier.</p>
    <p>Cordialement,<br><strong>L'équipe 3M Travel & Services</strong></p>
  `;
  await sendEmail(to, "🎉 Bienvenue dans votre Espace Candidat 3M Travel !", emailBase(content));
}
