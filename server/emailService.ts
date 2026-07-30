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
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3M Travel & Services</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background: linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%); margin: 0; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(30,58,138,0.2); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%); padding: 40px 32px; text-align: center; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; }
    .header::after { content: ''; position: absolute; bottom: -30%; left: -5%; width: 250px; height: 250px; background: rgba(255,255,255,0.03); border-radius: 50%; }
    .header-content { position: relative; z-index: 1; }
    .logo-badge { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 50%; padding: 12px; margin-bottom: 16px; }
    .logo-badge img { width: 48px; height: 48px; border-radius: 8px; display: block; }
    .header h1 { color: #fff; font-size: 28px; margin: 12px 0 0; font-weight: 900; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0; font-weight: 500; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 16px; color: #1f2937; margin-bottom: 24px; line-height: 1.6; }
    .greeting strong { color: #1E3A8A; font-weight: 700; }
    .section-title { font-size: 14px; font-weight: 700; color: #1E3A8A; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px; }
    .cta-section { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #2563EB; padding: 20px; border-radius: 8px; margin: 28px 0; }
    .cta-text { color: #1f2937; font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 0; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(30,58,138,0.3); }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(30,58,138,0.4); }
    .btn-center { text-align: center; }
    .security-badge { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
    .security-badge strong { color: #b45309; }
    .info-box { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #4b5563; line-height: 1.6; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
    .footer { background: linear-gradient(to bottom, #f9fafb, #f3f4f6); padding: 32px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer-title { font-size: 12px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .footer-content { font-size: 12px; color: #6b7280; line-height: 1.8; }
    .footer-content strong { color: #1f2937; font-weight: 600; }
    .social-links { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
    .social-links a { color: #2563EB; text-decoration: none; font-size: 12px; margin: 0 8px; }
    .social-links a:hover { text-decoration: underline; }
    .legal { font-size: 11px; color: #9ca3af; margin-top: 12px; }
    ul { margin: 16px 0; padding-left: 20px; }
    ul li { margin: 8px 0; color: #374151; font-size: 14px; line-height: 1.6; }
    a { color: #2563EB; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <div class="header-content">
        <div class="logo-badge">
          <img src="https://manus-storage.s3.amazonaws.com/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg" alt="3M Travel Logo" />
        </div>
        <h1>3M Travel & Services</h1>
        <p>Votre partenaire mobilité internationale</p>
      </div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <div class="footer-title">À propos de 3M Travel & Services</div>
      <div class="footer-content">
        <p><strong>Agence de Voyage Agréée</strong></p>
        <p>RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
        <p>📍 Yaoundé, Cameroun</p>
        <p>📞 +237 620-996-045</p>
        <p>✉️ contact@3mtravelagency.click</p>
        <div class="social-links">
          <a href="https://wa.me/237620996045">WhatsApp</a> |
          <a href="https://3mtravelagency.click">Site Web</a>
        </div>
      </div>
      <div class="legal">
        <p>Cet email a été envoyé automatiquement. Ne pas répondre à cet email.</p>
        <p>© 2024 3M Travel & Services. Tous droits réservés.</p>
      </div>
    </div>
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
    <p class="greeting">Bonjour <strong>${fullName}</strong>,</p>
    
    <p class="cta-text">Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! 🎉</p>
    
    <p class="cta-text">Nous sommes ravis de vous accueillir. Pour finaliser votre inscription et activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
    
    <div class="cta-section">
      <div class="btn-center">
        <a href="${verifyUrl}" class="btn">✓ Confirmer mon email</a>
      </div>
    </div>
    
    <div class="security-badge">
      🔒 <strong>Sécurité :</strong> Ce lien est personnel et valable 24 heures. Ne le partagez avec personne.
    </div>
    
    <div class="info-box">
      <strong>⏱️ Délai d'expiration :</strong> Ce lien expire dans 24 heures. Après ce délai, vous devrez créer un nouveau compte.
    </div>
    
    <p class="cta-text"><strong>Prochaines étapes :</strong></p>
    <ul>
      <li>Confirmez votre email en cliquant sur le lien ci-dessus</li>
      <li>Complétez votre profil candidat</li>
      <li>Uploadez vos documents (CV, passeport, diplômes)</li>
      <li>Un conseiller vous contactera sous 24h</li>
    </ul>
    
    <div class="divider"></div>
    
    <p class="cta-text">Si vous n'avez pas créé de compte sur 3M Travel, vous pouvez ignorer cet email en toute sécurité. Votre adresse email ne sera pas utilisée.</p>
    
    <p class="cta-text"><strong>Besoin d'aide ?</strong><br>Contactez notre équipe sur <a href="https://wa.me/237620996045">WhatsApp</a> ou par email à <a href="mailto:contact@3mtravelagency.click">contact@3mtravelagency.click</a></p>
    
    <p class="cta-text">Cordialement,<br><strong>L'équipe 3M Travel & Services</strong></p>
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
