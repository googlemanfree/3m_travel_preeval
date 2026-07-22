/**
 * Service d'envoi d'emails pour 3M Travel & Services
 * Stratégie : Resend API (prioritaire, fiable en production) → SMTP Gmail (fallback) → console (dev)
 */
import nodemailer from "nodemailer";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "3M Travel & Services <noreply@3mtravelagency.click>";
const RESEND_FROM = "3M Travel & Services <onboarding@resend.dev>";
const SITE_URL = process.env.SITE_URL ?? "https://3mtravelagency.click";

// URL publique du logo (hébergé sur le storage Manus)
const LOGO_URL = "https://3mtravelagency.click/manus-storage/logo_3m_26a07b08.jpeg";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // 1ère priorité : Resend API (fonctionne en production sans config SMTP)
  if (RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: RESEND_FROM,
        to,
        subject,
        html,
      });
      if (error) {
        console.error("[Email] Resend error:", error);
        // Ne pas throw, essayer le fallback SMTP
      } else {
        console.log(`[Email] Resend OK → ${to} | ${subject}`);
        return;
      }
    } catch (e) {
      console.error("[Email] Resend exception:", e);
    }
  }

  // 2ème priorité : SMTP (Gmail ou autre)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transport.sendMail({ from: SMTP_FROM, to, subject, html });
      console.log(`[Email] SMTP OK → ${to} | ${subject}`);
      return;
    } catch (e: any) {
      console.error("[Email] SMTP error:", e.message);
    }
  }

  // Fallback : mode dev — afficher dans la console
  console.log(`\n📧 [EMAIL DEV MODE] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, "")}\n`);
}

// ─── Template HTML de base professionnel ─────────────────────────────────────

function emailBase(content: string, accentColor = "#1E3A8A"): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>3M Travel & Services</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #EEF2FF;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .email-wrapper {
      background-color: #EEF2FF;
      padding: 32px 16px;
    }
    .email-container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(30, 58, 138, 0.12);
    }

    /* ── HEADER ── */
    .email-header {
      background: linear-gradient(135deg, #0f2460 0%, #1E3A8A 50%, #2563EB 100%);
      padding: 36px 32px 28px;
      text-align: center;
      position: relative;
    }
    .email-header::after {
      content: '';
      display: block;
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 20px;
      background: #ffffff;
      border-radius: 20px 20px 0 0;
    }
    .logo-wrapper {
      display: inline-block;
      background: rgba(255,255,255,0.12);
      border-radius: 18px;
      padding: 6px;
      margin-bottom: 14px;
      border: 2px solid rgba(255,255,255,0.25);
    }
    .logo-wrapper img {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: block;
      object-fit: cover;
    }
    .header-brand {
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }
    .header-tagline {
      color: #93C5FD;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    /* ── BODY ── */
    .email-body {
      padding: 36px 36px 28px;
    }
    .email-body p {
      color: #374151;
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 14px;
    }
    .email-body ul, .email-body ol {
      color: #374151;
      font-size: 14px;
      line-height: 2;
      padding-left: 20px;
      margin-bottom: 14px;
    }
    .greeting {
      font-size: 17px;
      color: #111827;
      font-weight: 600;
      margin-bottom: 10px;
    }

    /* ── OTP / CODE BOX ── */
    .code-box {
      background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
      border: 2px solid #BFDBFE;
      border-radius: 16px;
      padding: 24px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    .code-value {
      font-size: 44px;
      font-weight: 900;
      color: #1E3A8A;
      letter-spacing: 14px;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .code-expiry {
      font-size: 12px;
      color: #6B7280;
      margin-top: 10px;
    }
    .code-expiry strong {
      color: #DC2626;
    }

    /* ── SUCCESS / INFO BOX ── */
    .info-box {
      border-radius: 14px;
      padding: 20px 24px;
      margin: 20px 0;
      text-align: center;
    }
    .info-box .info-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
    }
    .info-box .info-value {
      font-size: 30px;
      font-weight: 900;
      letter-spacing: 4px;
      line-height: 1.2;
    }
    .info-box .info-sub {
      font-size: 12px;
      margin-top: 6px;
    }

    /* ── BUTTON ── */
    .btn-wrapper {
      text-align: center;
      margin: 24px 0 16px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #1E3A8A, #2563EB);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
    }
    .btn-green {
      background: linear-gradient(135deg, #15803D, #16A34A);
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35);
    }

    /* ── DATA TABLE ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border-radius: 12px;
      overflow: hidden;
    }
    .data-table td {
      padding: 11px 14px;
      font-size: 14px;
      border-bottom: 1px solid #F3F4F6;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .data-table .td-label {
      color: #6B7280;
      font-weight: 500;
      background: #F9FAFB;
      width: 38%;
    }
    .data-table .td-value {
      color: #111827;
      font-weight: 600;
    }

    /* ── DIVIDER ── */
    .divider {
      border: none;
      border-top: 1px solid #F3F4F6;
      margin: 24px 0;
    }

    /* ── SECURITY NOTE ── */
    .security-note {
      background: #FFFBEB;
      border-left: 4px solid #F59E0B;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 16px 0;
      font-size: 13px;
      color: #92400E;
    }

    /* ── FOOTER ── */
    .email-footer {
      background: #F8FAFF;
      border-top: 1px solid #E5E7EB;
      padding: 24px 36px;
      text-align: center;
    }
    .footer-logo {
      margin-bottom: 12px;
    }
    .footer-logo img {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: cover;
      opacity: 0.7;
    }
    .footer-company {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 4px;
    }
    .footer-info {
      font-size: 11px;
      color: #9CA3AF;
      line-height: 1.7;
    }
    .footer-links {
      margin-top: 12px;
      font-size: 11px;
    }
    .footer-links a {
      color: #6B7280;
      text-decoration: none;
      margin: 0 8px;
    }
    .footer-auto {
      margin-top: 14px;
      font-size: 10px;
      color: #D1D5DB;
    }

    /* ── RESPONSIVE ── */
    @media only screen and (max-width: 600px) {
      .email-body { padding: 24px 20px 20px; }
      .email-header { padding: 28px 20px 22px; }
      .email-footer { padding: 20px; }
      .code-value { font-size: 34px; letter-spacing: 10px; }
      .btn { padding: 13px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">

      <!-- HEADER -->
      <div class="email-header">
        <div class="logo-wrapper">
          <img src="${LOGO_URL}" alt="3M Travel & Services" />
        </div>
        <div class="header-brand">3M Travel &amp; Services</div>
        <div class="header-tagline">Votre partenaire mobilité internationale</div>
      </div>

      <!-- BODY -->
      <div class="email-body">
        ${content}
      </div>

      <!-- FOOTER -->
      <div class="email-footer">
        <div class="footer-logo">
          <img src="${LOGO_URL}" alt="3M Travel" />
        </div>
        <div class="footer-company">3M Travel &amp; Services</div>
        <div class="footer-info">
          RC/YAO/2019/A/2567 &nbsp;|&nbsp; NIU : M112417203369H<br />
          Yaoundé, Cameroun &nbsp;|&nbsp; +237 620-996-045<br />
          <a href="mailto:contact@3mtravelagency.click" style="color:#6B7280;text-decoration:none;">contact@3mtravelagency.click</a>
        </div>
        <div class="footer-links">
          <a href="${SITE_URL}">Site web</a>
          <a href="${SITE_URL}/dashboard">Mon espace</a>
          <a href="https://wa.me/237620996045">WhatsApp</a>
        </div>
        <div class="footer-auto">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ─── Email de vérification OTP ────────────────────────────────────────────────

export async function sendVerificationOtp(to: string, fullName: string, otp: string): Promise<void> {
  const content = `
    <p class="greeting">Bonjour ${fullName},</p>
    <p>Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! Pour activer votre compte, entrez le code de vérification ci-dessous dans l'application :</p>

    <div class="code-box">
      <div class="code-label">Code de vérification</div>
      <div class="code-value">${otp}</div>
      <div class="code-expiry">Ce code expire dans <strong>15 minutes</strong></div>
    </div>

    <div class="security-note">
      🔒 <strong>Sécurité :</strong> Ne partagez jamais ce code avec qui que ce soit, même avec notre équipe. 3M Travel ne vous demandera jamais votre code par téléphone ou email.
    </div>

    <p style="font-size:13px;color:#6B7280;">Si vous n'avez pas créé de compte sur 3M Travel, ignorez cet email — aucune action n'est requise.</p>
  `;
  await sendEmail(to, "🔐 Votre code de vérification — 3M Travel", emailBase(content));
}

// ─── Email de réinitialisation de mot de passe ────────────────────────────────

export async function sendPasswordResetEmail(to: string, fullName: string, resetToken: string): Promise<void> {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
  const content = `
    <p class="greeting">Bonjour ${fullName},</p>
    <p>Vous avez demandé la <strong>réinitialisation de votre mot de passe</strong> pour votre compte 3M Travel. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>

    <div class="btn-wrapper">
      <a href="${resetUrl}" class="btn">🔑 Réinitialiser mon mot de passe</a>
    </div>

    <div class="security-note">
      ⏱️ Ce lien est valable <strong>1 heure</strong> uniquement. Après ce délai, vous devrez faire une nouvelle demande.
    </div>

    <hr class="divider" />

    <p style="font-size:13px;color:#6B7280;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé et votre compte est sécurisé.</p>
    <p style="font-size:11px;color:#9CA3AF;word-break:break-all;margin-top:8px;">Lien direct : <a href="${resetUrl}" style="color:#2563EB;">${resetUrl}</a></p>
  `;
  await sendEmail(to, "🔑 Réinitialisation de votre mot de passe — 3M Travel", emailBase(content));
}

// ─── Email de bienvenue (après vérification) ─────────────────────────────────

export async function sendWelcomeEmail(to: string, fullName: string, destination: string): Promise<void> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const whatsappUrl = `https://wa.me/237620996045?text=${encodeURIComponent(`Bonjour 3M Travel, je viens d'activer mon compte. Mon nom est ${fullName}.`)}`;
  const destLabels: Record<string, string> = {
    canada: "🇨🇦 Canada",
    luxembourg: "🇱🇺 Luxembourg",
    pologne: "🇵🇱 Pologne",
    europe: "🇪🇺 Europe Schengen",
    golfe: "🇦🇪 Golfe & Moyen-Orient",
    autre: "🌍 International",
  };
  const destLabel = destLabels[destination] ?? "🌍 International";
  const content = `
    <p class="greeting">Bienvenue, ${fullName} ! 🎉</p>
    <p>Votre compte 3M Travel est maintenant <strong>activé</strong>. Votre dossier d'immigration vers <strong>${destLabel}</strong> est officiellement ouvert.</p>

    <div class="info-box" style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:2px solid #BBF7D0;">
      <div class="info-label" style="color:#15803D;">Dossier activé</div>
      <div class="info-value" style="color:#15803D;">✅ Compte vérifié</div>
      <div class="info-sub" style="color:#166534;">Notre équipe vous contactera sous 24h</div>
    </div>

    <p><strong>Voici ce que vous pouvez faire dès maintenant :</strong></p>
    <ul>
      <li>📁 Uploader vos documents (CV, passeport, diplômes)</li>
      <li>💬 Contacter directement votre conseiller</li>
      <li>📊 Suivre l'avancement de votre dossier en temps réel</li>
      <li>✈️ Rechercher des vols vers votre destination</li>
    </ul>

    <div class="btn-wrapper">
      <a href="${dashboardUrl}" class="btn" style="margin-right:10px;">🚀 Accéder à mon espace</a>
      <a href="${whatsappUrl}" class="btn btn-green">💬 WhatsApp</a>
    </div>

    <hr class="divider" />
    <p style="font-size:13px;color:#6B7280;">Cordialement,<br /><strong>L'équipe 3M Travel &amp; Services</strong></p>
  `;
  await sendEmail(to, "🎉 Bienvenue dans votre Espace Candidat — 3M Travel", emailBase(content));
}

// ─── Email de confirmation d'ouverture de dossier ─────────────────────────────

export async function sendDossierConfirmationEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  destination: string,
  formula: string,
  amount: number
): Promise<void> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const whatsappUrl = `https://wa.me/237620996045?text=${encodeURIComponent(`Bonjour 3M Travel, je confirme l'ouverture de mon dossier ${dossierNumber}.`)}`;
  const content = `
    <p class="greeting">Bonjour ${fullName},</p>
    <p>Votre dossier d'immigration a été <strong>créé avec succès</strong> ! Voici le récapitulatif de votre dossier :</p>

    <div class="info-box" style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:2px solid #BFDBFE;">
      <div class="info-label" style="color:#1D4ED8;">Numéro de dossier</div>
      <div class="info-value" style="color:#1E3A8A;">${dossierNumber}</div>
      <div class="info-sub" style="color:#1D4ED8;">Conservez ce numéro précieusement</div>
    </div>

    <table class="data-table">
      <tr>
        <td class="td-label">Destination</td>
        <td class="td-value">${destination.toUpperCase()}</td>
      </tr>
      <tr>
        <td class="td-label">Formule</td>
        <td class="td-value">${formula}</td>
      </tr>
      <tr>
        <td class="td-label">Montant</td>
        <td class="td-value">${amount.toLocaleString("fr-FR")} FCFA</td>
      </tr>
    </table>

    <p><strong>Prochaines étapes :</strong></p>
    <ol>
      <li>Un conseiller vous contactera sur WhatsApp sous <strong>24h</strong></li>
      <li>Préparez vos documents : passeport, CV, diplômes</li>
      <li>Uploadez vos documents dans votre espace candidat</li>
    </ol>

    <div class="btn-wrapper">
      <a href="${dashboardUrl}" class="btn" style="margin-right:10px;">📁 Mon espace candidat</a>
      <a href="${whatsappUrl}" class="btn btn-green">💬 WhatsApp</a>
    </div>

    <hr class="divider" />
    <p style="font-size:13px;color:#6B7280;">Cordialement,<br /><strong>L'équipe 3M Travel &amp; Services</strong></p>
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
  formula: string,
  paymentStatus: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "contact@3mtravelagency.click";
  const adminUrl = `${SITE_URL}/admin`;
  const payLabel = paymentStatus === "SUCCESS"
    ? '<span style="color:#15803D;font-weight:700;">✅ PAYÉ</span>'
    : paymentStatus === "PENDING"
    ? '<span style="color:#D97706;font-weight:700;">⏳ EN ATTENTE</span>'
    : '<span style="color:#DC2626;font-weight:700;">❌ ÉCHOUÉ</span>';

  const content = `
    <p class="greeting">🔔 Nouveau dossier reçu</p>
    <p>Un nouveau dossier vient d'être soumis sur <strong>3M Travel Agency</strong>. Voici les détails :</p>

    <div class="info-box" style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:2px solid #BFDBFE;">
      <div class="info-label" style="color:#1D4ED8;">Dossier</div>
      <div class="info-value" style="color:#1E3A8A;">${dossierNumber}</div>
    </div>

    <table class="data-table">
      <tr>
        <td class="td-label">Candidat</td>
        <td class="td-value">${fullName}</td>
      </tr>
      <tr>
        <td class="td-label">Email</td>
        <td class="td-value">${email}</td>
      </tr>
      <tr>
        <td class="td-label">Téléphone</td>
        <td class="td-value">${phone}</td>
      </tr>
      <tr>
        <td class="td-label">Destination</td>
        <td class="td-value">${destination.toUpperCase()}</td>
      </tr>
      <tr>
        <td class="td-label">Formule</td>
        <td class="td-value">${formula}</td>
      </tr>
      <tr>
        <td class="td-label">Paiement</td>
        <td class="td-value">${payLabel}</td>
      </tr>
    </table>

    <div class="btn-wrapper">
      <a href="${adminUrl}" class="btn">🛠️ Voir dans le panneau admin</a>
    </div>
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
    <p class="greeting">Bonjour ${fullName},</p>
    <p>Votre paiement a été <strong>confirmé avec succès</strong> ! Votre dossier est maintenant actif.</p>

    <div class="info-box" style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:2px solid #BBF7D0;">
      <div class="info-label" style="color:#15803D;">Reçu de paiement</div>
      <div class="info-value" style="color:#15803D;">${amount.toLocaleString("fr-FR")} FCFA</div>
      <div class="info-sub" style="color:#166534;">Dossier : ${dossierNumber}</div>
    </div>

    <table class="data-table">
      <tr>
        <td class="td-label">Référence</td>
        <td class="td-value" style="font-family:monospace;font-size:13px;">${transactionId}</td>
      </tr>
      <tr>
        <td class="td-label">Statut</td>
        <td class="td-value" style="color:#15803D;">✅ Confirmé</td>
      </tr>
    </table>

    <p>Notre équipe va commencer le traitement de votre dossier d'immigration. Vous serez contacté sous <strong>24h</strong>.</p>

    <div class="btn-wrapper">
      <a href="${dashboardUrl}" class="btn">📁 Suivre mon dossier</a>
    </div>

    <hr class="divider" />
    <p style="font-size:13px;color:#6B7280;">Cordialement,<br /><strong>L'équipe 3M Travel &amp; Services</strong></p>
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
  await sendEmail(
    to,
    `📋 Rapport d'évaluation professionnelle — ${dossierNumber} — 3M Travel`,
    reportHtml
  );
}

// ─── Email Magic Link (connexion sans mot de passe) ───────────────────────────

export async function sendMagicLinkEmail(
  to: string,
  fullName: string,
  token: string,
  type: "verify" | "login" = "verify"
): Promise<void> {
  const magicUrl = `${SITE_URL}/magic-login?token=${token}`;
  const isVerify = type === "verify";

  const content = `
    <p class="greeting">Bonjour ${fullName},</p>
    ${isVerify
      ? `<p>Votre compte <strong>3M Travel</strong> a été créé avec succès ! Cliquez sur le bouton ci-dessous pour <strong>activer votre compte</strong> et accéder à votre espace candidat :</p>`
      : `<p>Vous avez demandé un <strong>lien de connexion</strong> à votre espace candidat 3M Travel. Cliquez sur le bouton ci-dessous pour vous connecter :</p>`
    }

    <div class="btn-wrapper">
      <a href="${magicUrl}" class="btn">${isVerify ? "✅ Activer mon compte" : "🔑 Me connecter"}</a>
    </div>

    <div class="security-note">
      ⏱️ Ce lien est valable <strong>24 heures</strong> et ne peut être utilisé qu'une seule fois.
    </div>

    ${isVerify ? `
    <p><strong>Après activation, vous pourrez :</strong></p>
    <ul>
      <li>📁 Uploader vos documents (CV, passeport, diplômes)</li>
      <li>💬 Contacter directement votre conseiller</li>
      <li>📊 Suivre l'avancement de votre dossier en temps réel</li>
      <li>✈️ Rechercher des vols vers votre destination</li>
    </ul>
    ` : ""}

    <hr class="divider" />
    <p style="font-size:13px;color:#6B7280;">Si vous n'avez pas demandé ce lien, ignorez cet email — votre compte reste sécurisé.</p>
    <p style="font-size:11px;color:#9CA3AF;word-break:break-all;margin-top:8px;">Lien direct : <a href="${magicUrl}" style="color:#2563EB;">${magicUrl}</a></p>
    <p style="font-size:13px;color:#6B7280;margin-top:16px;">Cordialement,<br /><strong>L'équipe 3M Travel &amp; Services</strong></p>
  `;

  const subject = isVerify
    ? "✅ Activez votre compte 3M Travel"
    : "🔑 Votre lien de connexion — 3M Travel";

  await sendEmail(to, subject, emailBase(content));
}
