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

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
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

// ─── Email de lien de confirmation ──────────────────────────────────────────────

export async function sendVerificationLink(to: string, fullName: string, verificationToken: string): Promise<void> {
  const baseUrl = (SITE_URL || "https://3mtravelagency.click").replace(/\/+$/, "");
  const verifyUrl = `${baseUrl}/verify-email-link?token=${encodeURIComponent(verificationToken)}`;
  console.log(`[sendVerificationLink] Sending verification link to ${to}: ${verifyUrl}`);
  const content = `
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
    <p style="text-align:center;">
      <a href="${verifyUrl}" class="btn">✓ Confirmer mon email</a>
    </p>
    <p style="font-size:13px;color:#6b7280;">Ce lien est valable <strong>24 heures</strong>. Après ce délai, vous devrez créer un nouveau compte.</p>
    <p>Si vous n'avez pas créé de compte sur 3M Travel, ignorez cet email.</p>
    <p style="font-size:12px;color:#9ca3af;word-break:break-all;">Lien direct : ${verifyUrl}</p>
  `;
  await sendEmail(to, "✓ Confirmez votre email - 3M Travel & Services", emailBase(content));
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
  // Utiliser le domaine configuré ou un domaine par défaut
  const baseUrl = SITE_URL || "https://3mtravelagency.click";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
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

// ─── Email de confirmation d'ouverture de dossier ─────────────────────────────

export async function sendDossierConfirmationEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  destination: string,
  amount: number
): Promise<void> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const whatsappUrl = `https://wa.me/237620996045?text=${encodeURIComponent(`Bonjour 3M Travel, je confirme l'ouverture de mon dossier ${dossierNumber}.`)}`;
  const content = `
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>✅ Votre dossier d'immigration a été <strong>créé avec succès</strong> !</p>
    <div class="otp-box" style="background:#f0fdf4;border-color:#16a34a;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">NUMÉRO DE DOSSIER</div>
      <div class="otp-code" style="font-size:32px;letter-spacing:6px;color:#15803d;">${dossierNumber}</div>
      <div class="otp-label">Conservez ce numéro précieusement</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;background:#f8faff;border-radius:6px;font-size:13px;color:#6b7280;">Destination</td><td style="padding:8px;font-weight:700;">${destination.toUpperCase()}</td></tr>

      <tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280;">Montant</td><td style="padding:8px;font-weight:700;">${amount.toLocaleString("fr-FR")} FCFA</td></tr>
    </table>
    <p><strong>Prochaines étapes :</strong></p>
    <ol style="color:#374151;line-height:2;font-size:14px;">
      <li>Un conseiller vous contactera sur WhatsApp sous 24h</li>
      <li>Préparez vos documents : passeport, CV, diplômes</li>
      <li>Uploadez vos documents dans votre espace candidat</li>
    </ol>
    <p style="text-align:center;margin-top:20px;">
      <a href="${dashboardUrl}" class="btn" style="margin-right:8px;">📁 Mon espace candidat</a>
      <a href="${whatsappUrl}" class="btn" style="background:#16a34a;">💬 WhatsApp</a>
    </p>
    <p>Cordialement,<br><strong>L'équipe 3M Travel & Services</strong></p>
  `;
  await sendEmail(to, `📋 Dossier ${dossierNumber} — Confirmation d'ouverture`, emailBase(content));
}

// ─── Email d'alerte admin (nouveau dossier) ───────────────────────────────────

export async function sendAdminNewDossierAlert(
  fullName: string,
  dossierNumber: string,
  email: string,
  phone: string,
  destination: string,
  paymentStatus: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "contact@3mtravelagency.click";
  const adminUrl = `${SITE_URL}/admin`;
  const payLabel = paymentStatus === "SUCCESS" ? "✅ PAYÉ" : paymentStatus === "PENDING" ? "⏳ EN ATTENTE" : "❌ ÉCHOUÉ";
  const content = `
    <p>🔔 <strong>Nouveau dossier reçu</strong> sur 3M Travel Agency !</p>
    <div class="otp-box" style="background:#eff6ff;border-color:#2563EB;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px;">DOSSIER</div>
      <div class="otp-code" style="font-size:28px;letter-spacing:4px;">${dossierNumber}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280;">Candidat</td><td style="padding:8px;font-weight:700;">${fullName}</td></tr>
      <tr><td style="padding:8px;font-size:13px;color:#6b7280;">Email</td><td style="padding:8px;">${email}</td></tr>
      <tr><td style="padding:8px;background:#f8faff;font-size:13px;color:#6b7280;">Téléphone</td><td style="padding:8px;">${phone}</td></tr>
      <tr><td style="padding:8px;font-size:13px;color:#6b7280;">Destination</td><td style="padding:8px;font-weight:700;">${destination.toUpperCase()}</td></tr>

      <tr><td style="padding:8px;font-size:13px;color:#6b7280;">Paiement</td><td style="padding:8px;font-weight:700;">${payLabel}</td></tr>
    </table>
    <p style="text-align:center;">
      <a href="${adminUrl}" class="btn">🛠️ Voir dans le panneau admin</a>
    </p>
  `;
  await sendEmail(adminEmail, `🔔 Nouveau dossier ${dossierNumber} — ${fullName}`, emailBase(content));
}

// ─── Email de confirmation de paiement réussi ─────────────────────────────────

export async function sendPaymentSuccessEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  amount: number,
  transactionId: string
): Promise<void> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const content = `
    <p>Bonjour <strong>${fullName}</strong>,</p>
    <p>💳 Votre paiement a été <strong>confirmé avec succès</strong> !</p>
    <div class="otp-box" style="background:#f0fdf4;border-color:#16a34a;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px;">REÇU DE PAIEMENT</div>
      <div style="font-size:28px;font-weight:900;color:#15803d;">${amount.toLocaleString("fr-FR")} FCFA</div>
      <div class="otp-label">Dossier : ${dossierNumber}</div>
    </div>
    <p style="font-size:13px;color:#6b7280;">Référence transaction : <code>${transactionId}</code></p>
    <p>Votre dossier est maintenant <strong>actif</strong>. Notre équipe va commencer le traitement de votre dossier d'immigration.</p>
    <p style="text-align:center;">
      <a href="${dashboardUrl}" class="btn">📁 Suivre mon dossier</a>
    </p>
    <p>Cordialement,<br><strong>L'équipe 3M Travel & Services</strong></p>
  `;
  await sendEmail(to, `✅ Paiement confirmé — Dossier ${dossierNumber}`, emailBase(content));
}

// ─── Email de rapport d'évaluation automatique ────────────────────────────────

export async function sendEvaluationReportEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  reportHtml: string
): Promise<void> {
  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject: `📋 Rapport d'évaluation professionnelle — ${dossierNumber} — 3M Travel`,
    html: reportHtml,
  };

  const transport = createTransport();
  if (!transport) {
    // Mode dev : afficher dans la console
    console.log(`\n📧 [EMAIL DEV MODE] To: ${to}\nSubject: ${mailOptions.subject}\n[HTML Report sent]\n`);
    return;
  }
  await transport.sendMail(mailOptions);
}
