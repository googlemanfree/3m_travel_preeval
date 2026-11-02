import { sendEmail as sendGenericEmail } from "./_core/email";
import { getCandidateDestinationOption } from "../shared/candidateDestinationOptions";
import { BRAND, renderBrandedEmailHtml, serviceFocusLabel } from "../shared/brandLetterhead";

import { getDb } from "./db";
import { candidates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@3mtravelagency.com";
const SITE_URL = process.env.SITE_URL || "https://www.3mtravelagency.com";

/** Blocs communs des e-mails clients : la mise en page vient de shared/brandLetterhead (même identité que les documents PDF). */
function referenceCard(label: string, value: string, hint: string): string {
  return `<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:18px 20px;margin:20px 0;border-radius:8px"><div style="font-size:12px;color:#6b7280;margin-bottom:6px;text-transform:uppercase">${escapeEmailHtml(label)}</div><div style="font-size:28px;font-weight:bold;color:#15803d;letter-spacing:3px">${escapeEmailHtml(value)}</div><div style="font-size:12px;color:#6b7280;margin-top:6px">${escapeEmailHtml(hint)}</div></div>`;
}

function detailsTable(rows: Array<[string, string]>): string {
  return `<table style="width:100%;border-collapse:collapse;margin:18px 0">${rows.map(([label, value], index) => `<tr><td style="padding:10px 12px;font-weight:600;background:${index % 2 === 0 ? "#f3f4f6" : "#ffffff"}">${escapeEmailHtml(label)}</td><td style="padding:10px 12px;background:${index % 2 === 0 ? "#f3f4f6" : "#ffffff"}">${escapeEmailHtml(value)}</td></tr>`).join("")}</table>`;
}

function contactNote(): string {
  return `Une question ? Écrivez-nous sur <a href="https://wa.me/237698104832" style="color:#2b6cb8">WhatsApp</a> ou à <a href="mailto:${BRAND.email}" style="color:#2b6cb8">${BRAND.email}</a>.`;
}

export async function sendClientDossierConfirmationEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  countryName: string,
  totalCost: number,
  currency: string
) {
  try {
    await sendGenericEmail({
      to,
      subject: `Confirmation de votre demande e-Visa - Dossier #${dossierNumber}`,
      html: renderBrandedEmailHtml({
        title: "Demande e-Visa confirmée",
        preheader: `Votre demande e-Visa pour ${countryName} a été soumise`,
        reference: dossierNumber,
        serviceFocus: serviceFocusLabel("e-visa", countryName),
        bodyHtml: `
          <p>Bonjour <strong>${escapeEmailHtml(fullName)}</strong>,</p>
          <p>Votre demande e-Visa a été <strong>soumise avec succès</strong>.</p>
          ${referenceCard("Numéro de dossier", dossierNumber, "Conservez ce numéro précieusement")}
          ${detailsTable([["Destination", countryName], ["Montant", `${totalCost.toLocaleString("fr-FR")} ${currency}`]])}
          <h3 style="color:#17375e;margin:22px 0 6px;font-size:16px">Prochaines étapes</h3>
          <ol style="margin:0;padding-left:20px;line-height:1.9">
            <li>Un conseiller vous contactera sur WhatsApp</li>
            <li>Préparez vos documents : passeport, CV, diplômes</li>
            <li>Déposez vos documents dans votre espace candidat</li>
          </ol>`,
        cta: { label: "Accéder à mon espace", url: `${SITE_URL}/dashboard` },
        noteHtml: contactNote(),
      }),
    });
  } catch (error) {
    console.error("Failed to send client confirmation email:", error);
  }
}

export async function sendAdminNewDossierAlertEmail(
  dossierNumber: string,
  fullName: string,
  countryName: string,
  totalCost: number,
  currency: string
) {
  try {
    await sendGenericEmail({
      to: ADMIN_EMAIL,
      subject: `🚨 Nouveau dossier e-Visa soumis - #${dossierNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">🚨 Nouvelle Demande e-Visa</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p><strong>Dossier :</strong> #${escapeEmailHtml(dossierNumber)}</p>
            <p><strong>Candidat :</strong> ${escapeEmailHtml(fullName)}</p>
            <p><strong>Destination :</strong> ${escapeEmailHtml(countryName)}</p>
            <p><strong>Montant :</strong> ${totalCost.toLocaleString("fr-FR")} ${escapeEmailHtml(currency)}</p>

            <p style="text-align: center; margin-top: 30px;">
              <a href="${SITE_URL}/admin/evisa/${dossierNumber}" style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Voir le dossier
              </a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send admin alert email:", error);
  }
}

export async function sendEvisaStatusUpdateEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  countryName: string,
  newStatus: string,
  adminNotes?: string
) {
  const statusLabels: Record<string, string> = {
    pending: "⏳ En attente",
    processing: "🔄 En cours de traitement",
    approved: "✅ Approuvée",
    rejected: "❌ Rejetée",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  try {
    await sendGenericEmail({
      to,
      subject: `Mise à jour de votre demande e-Visa - Dossier #${dossierNumber}`,
      html: renderBrandedEmailHtml({
        title: "Mise à jour de votre demande",
        preheader: `Statut de votre dossier ${dossierNumber} : ${statusLabel}`,
        reference: dossierNumber,
        serviceFocus: serviceFocusLabel("e-visa", countryName),
        bodyHtml: `
          <p>Bonjour <strong>${escapeEmailHtml(fullName)}</strong>,</p>
          <p>Votre demande e-Visa pour <strong>${escapeEmailHtml(countryName)}</strong> a été mise à jour.</p>
          ${detailsTable([["Dossier", `#${dossierNumber}`], ["Statut", statusLabel]])}
          ${adminNotes ? `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin:18px 0;border-radius:8px"><strong>Message de notre équipe :</strong><br>${escapeEmailHtml(adminNotes)}</div>` : ""}`,
        cta: { label: "Voir mon dossier", url: `${SITE_URL}/dashboard` },
      }),
    });
  } catch (error) {
    console.error("Failed to send status update email:", error);
  }
}

export async function sendPaymentConfirmationEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  amount: number,
  currency: string
) {
  try {
    await sendGenericEmail({
      to,
      subject: `Confirmation de paiement - Dossier #${dossierNumber}`,
      html: renderBrandedEmailHtml({
        title: "Paiement reçu",
        preheader: `Votre paiement pour le dossier ${dossierNumber} est confirmé`,
        reference: dossierNumber,
        bodyHtml: `
          <p>Bonjour <strong>${escapeEmailHtml(fullName)}</strong>,</p>
          <p>Votre paiement a été <strong>reçu et confirmé</strong>.</p>
          ${detailsTable([["Dossier", `#${dossierNumber}`], ["Montant", `${amount.toLocaleString("fr-FR")} ${currency}`]])}
          <p>Votre dossier est maintenant <strong>activé</strong>. Un conseiller vous contactera pour les prochaines étapes.</p>`,
        cta: { label: "Accéder à mon espace", url: `${SITE_URL}/mon-espace` },
      }),
    });
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
  }
}

export async function sendVerificationLink(
  to: string,
  fullName: string,
  verificationToken: string,
  options: { priorEvaluationRecognized?: boolean; redirect?: string } = {},
): Promise<void> {
  const baseUrl = (SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
  const allowedRedirect = options.redirect && options.redirect.startsWith("/") && !options.redirect.startsWith("//")
    ? options.redirect
    : undefined;
  const verifyUrl = `${baseUrl}/verify-email-link?token=${encodeURIComponent(verificationToken)}${allowedRedirect ? `&redirect=${encodeURIComponent(allowedRedirect)}` : ""}`;
  const safeName = escapeEmailHtml(fullName);
  const safeVerifyUrl = escapeEmailHtml(verifyUrl);
  const priorEvaluationNotice = options.priorEvaluationRecognized
    ? `<p>Votre évaluation déjà transmise par notre équipe a été reconnue. Après confirmation de cette adresse, vous accéderez directement à votre espace pour la suite de votre dossier.</p>`
    : "";
  try {
    await sendGenericEmail({
      to,
      subject: "Confirmez votre email — 3M TRAVEL AGENCY",
      html: renderBrandedEmailHtml({
        title: "Confirmez votre email",
        preheader: "Confirmez votre adresse pour activer votre espace candidat",
        bodyHtml: `
          <p>Bonjour <strong>${safeName}</strong>,</p>
          <p>Bienvenue dans votre <strong>Espace Candidat 3M TRAVEL AGENCY</strong>.</p>
          <p>Pour finaliser votre inscription et activer votre compte, confirmez votre adresse email en cliquant sur le bouton ci-dessous :</p>
          ${priorEvaluationNotice}`,
        cta: { label: "Confirmer mon email", url: verifyUrl },
        noteHtml: `Si le bouton n’apparaît pas, copiez-collez ce lien dans votre navigateur :<br><a href="${safeVerifyUrl}" style="color:#2b6cb8;word-break:break-all">${safeVerifyUrl}</a><br><br>Ce lien est personnel et valable <strong>24 heures</strong>. Ne le partagez avec personne.`,
      }),
    });
  } catch (error) {
    console.error("Failed to send verification link email:", error);
    throw error;
  }
}

export async function sendVerificationOtp(to: string, fullName: string, otp: string): Promise<void> {
  try {
    await sendGenericEmail({
      to,
      subject: "Votre code de vérification 3M TRAVEL AGENCY",
      html: renderBrandedEmailHtml({
        title: "Vérification de votre email",
        preheader: "Votre code de vérification (valable 15 minutes)",
        bodyHtml: `
          <p>Bonjour <strong>${escapeEmailHtml(fullName)}</strong>,</p>
          <p>Voici votre code de vérification :</p>
          <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:8px;margin:0 0 20px;border:1px solid #e5e7eb">
            <div style="font-size:32px;font-weight:bold;color:#17375e;letter-spacing:4px">${escapeEmailHtml(otp)}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:10px">Ce code expire dans 15 minutes</div>
          </div>`,
        noteHtml: "Pour votre sécurité, ne partagez jamais ce code avec qui que ce soit.",
      }),
    });
  } catch (error) {
    console.error("Failed to send verification OTP email:", error);
  }
}

export async function sendPasswordResetEmail(to: string, fullName: string, resetToken: string): Promise<void> {
  const baseUrl = (SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeName = escapeEmailHtml(fullName);
  const safeResetUrl = escapeEmailHtml(resetUrl);
  try {
    await sendGenericEmail({
      to,
      subject: "Réinitialisation de votre mot de passe — 3M TRAVEL AGENCY",
      html: renderBrandedEmailHtml({
        title: "Réinitialisation de votre mot de passe",
        preheader: "Lien valable 1 heure",
        bodyHtml: `
          <p>Bonjour <strong>${safeName}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour le réinitialiser :</p>`,
        cta: { label: "Réinitialiser mon mot de passe", url: resetUrl },
        noteHtml: `Si le bouton n’apparaît pas, copiez-collez ce lien dans votre navigateur :<br><a href="${safeResetUrl}" style="color:#2b6cb8;word-break:break-all">${safeResetUrl}</a><br><br>Ce lien est valable <strong>1 heure</strong>. Après ce délai, vous devrez faire une nouvelle demande.<br>Si vous n’avez pas demandé cette réinitialisation, ignorez cet e-mail — votre mot de passe reste inchangé.`,
      }),
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

type EmailChangeConfirmationInput = {
  to: string;
  fullName: string;
  confirmationUrl: string;
  recipientRole: "current" | "new";
};

/**
 * Envoie une confirmation de changement d’adresse. Aucun jeton n’est journalisé
 * et les deux boîtes concernées doivent confirmer indépendamment.
 */
export async function sendEmailChangeConfirmation(input: EmailChangeConfirmationInput): Promise<void> {
  const safeName = escapeEmailHtml(input.fullName || "Candidat");
  const safeConfirmUrl = escapeEmailHtml(input.confirmationUrl);
  const isCurrentAddress = input.recipientRole === "current";
  const title = isCurrentAddress ? "Confirmez le changement de votre adresse e-mail" : "Confirmez votre nouvelle adresse e-mail";
  const explanation = isCurrentAddress
    ? "Une demande de remplacement de l’adresse de connexion de votre espace client a été initiée. Confirmez-la uniquement si vous en êtes à l’origine."
    : "Cette adresse a été proposée comme nouvelle adresse de connexion. Confirmez-la uniquement si vous êtes à l’origine de la demande.";

  await sendGenericEmail({
    to: input.to,
    subject: `3M TRAVEL AGENCY — ${title}`,
    html: renderBrandedEmailHtml({
      title,
      preheader: "Lien valable une heure",
      bodyHtml: `<p>Bonjour <strong>${safeName}</strong>,</p><p>${escapeEmailHtml(explanation)}</p>`,
      cta: { label: "Confirmer l’adresse", url: input.confirmationUrl },
      noteHtml: `Si le bouton n’apparaît pas, copiez-collez ce lien dans votre navigateur :<br><a href="${safeConfirmUrl}" style="color:#2b6cb8;word-break:break-all">${safeConfirmUrl}</a><br><br>Le lien expire dans une heure. Pour finaliser le changement, la confirmation de l’autre adresse est également requise.<br>Si vous n’avez pas demandé ce changement, ne cliquez pas sur le lien et contactez l’agence par les coordonnées officielles.`,
    }),
  });
}

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
  // Le pays précis (ex. « France ») prime sur la catégorie large historique (« europe »).
  const country = getCandidateDestinationOption(destination);
  const destLabel = country ? `${country.flag} ${country.name}` : destLabels[destination] ?? "International";
  try {
    await sendGenericEmail({
      to,
      subject: `Bienvenue chez 3M TRAVEL AGENCY - Votre voyage vers ${destLabel} commence !`,
      html: renderBrandedEmailHtml({
        title: `Bienvenue, ${fullName} !`,
        preheader: `Votre projet vers ${destLabel} commence`,
        bodyHtml: `
          <p>Nous sommes ravis de vous accueillir chez <strong>3M TRAVEL AGENCY</strong>. Votre intérêt pour ${destLabel} est le premier pas vers une nouvelle aventure !</p>
          <p>Notre équipe est prête à vous accompagner à chaque étape de votre projet. Vous pouvez dès maintenant accéder à votre tableau de bord pour suivre l'avancement de votre dossier et gérer vos informations.</p>`,
        cta: { label: "Accéder à mon tableau de bord", url: dashboardUrl },
        noteHtml: contactNote(),
      }),
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendDossierConfirmationEmail(
  to: string,
  fullName: string,
  dossierNumber: string,
  destination: string,
  amount: number,
  /** Référence de compte remplacée par ce numéro de dossier actif (« COMPTE-00012 »), pour que le candidat fasse le lien. */
  previousAccountReference?: string | null,
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/mon-espace`;
  const whatsappUrl = `https://wa.me/237698104832?text=${encodeURIComponent(`Bonjour 3M TRAVEL AGENCY, je confirme l'ouverture de mon dossier ${dossierNumber}.`)}`;

  let avatarHtml = "";
  try {
    const db = await getDb();
    if (db) {
      const [cand] = await db.select().from(candidates).where(eq(candidates.email, to)).limit(1);
      if (cand?.avatarUrl) {
        avatarHtml = `<div style="text-align:center;margin-bottom:20px"><img src="${cand.avatarUrl}" alt="${escapeEmailHtml(fullName)}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid #2b6cb8"></div>`;
      }
    }
  } catch {}

  try {
    await sendGenericEmail({
      to,
      subject: `✅ Votre dossier ${dossierNumber} est ouvert !`,
      html: renderBrandedEmailHtml({
        title: "Dossier créé",
        preheader: `Votre dossier ${dossierNumber} est ouvert`,
        reference: dossierNumber,
        serviceFocus: serviceFocusLabel("visa", destination),
        bodyHtml: `
          ${avatarHtml}
          <p>Bonjour <strong>${escapeEmailHtml(fullName)}</strong>,</p>
          <p>Votre dossier d'immigration a été <strong>créé avec succès</strong>.</p>
          ${referenceCard("Numéro de dossier", dossierNumber, "Conservez ce numéro précieusement")}
          ${previousAccountReference ? `<p style="background:#eff6ff;border-left:4px solid #2b6cb8;padding:12px 16px;border-radius:8px;font-size:14px;color:#1e3a8a">Votre référence de compte <strong>${escapeEmailHtml(previousAccountReference)}</strong> est remplacée par votre numéro de dossier <strong>${escapeEmailHtml(dossierNumber)}</strong>. Utilisez désormais ${escapeEmailHtml(dossierNumber)} dans tous vos échanges avec l’agence.</p>` : ""}
          ${detailsTable([["Destination", destination.toUpperCase()], ...(amount > 0 ? [["Montant", `${amount.toLocaleString("fr-FR")} FCFA`] as [string, string]] : [])])}
          <h3 style="color:#17375e;margin:22px 0 6px;font-size:16px">Prochaines étapes</h3>
          <ol style="margin:0;padding-left:20px;line-height:1.9;font-size:14px">
            <li>Un conseiller prend en charge votre dossier et vous contacte sur WhatsApp</li>
            <li>Préparez vos documents : passeport, CV, diplômes</li>
            <li>Déposez vos documents dans votre espace candidat</li>
          </ol>
          <p style="text-align:center;margin:8px 0 0"><a href="${whatsappUrl}" style="color:#15803d;font-weight:bold;text-decoration:none">Contacter mon conseiller sur WhatsApp</a></p>`,
        cta: { label: "Mon espace candidat", url: dashboardUrl },
      }),
    });
    return true;
  } catch (error) {
    console.error("Failed to send dossier confirmation email:", error);
    return false;
  }
}
// sendAdminNewDossierAlert to match existing calls (alias for sendAdminNewDossierAlertEmail)
export async function sendAdminNewDossierAlert(fullName: string, dossierNumber: string, email: string, whatsappNumber: string, destination: string, status: string): Promise<void> {
  const subject = `🚨 Nouvelle alerte dossier - #${dossierNumber}`;
  
  let avatarHtml = "";
  try {
    const db = await getDb();
    if (db) {
      const [cand] = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
      if (cand?.avatarUrl) {
        avatarHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${cand.avatarUrl}" alt="${escapeEmailHtml(fullName)}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid #DC2626; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /></div>`;
      }
    }
  } catch {}

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px; text-align: center; color: white;">
        <h1 style="margin: 0;">🚨 Nouvelle Alerte Dossier</h1>
      </div>
      <div style="padding: 40px; background: #f9fafb;">
        ${avatarHtml}
        <p>Un nouveau dossier a été créé :</p>
        <ul>
          <li><strong>Numéro de Dossier :</strong> #${escapeEmailHtml(dossierNumber)}</li>
          <li><strong>Candidat :</strong> ${escapeEmailHtml(fullName)}</li>
          <li><strong>Email :</strong> ${escapeEmailHtml(email)}</li>
          <li><strong>WhatsApp :</strong> ${escapeEmailHtml(whatsappNumber)}</li>
          <li><strong>Destination :</strong> ${escapeEmailHtml(destination)}</li>
          <li><strong>Statut Initial :</strong> ${escapeEmailHtml(status)}</li>
        </ul>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${SITE_URL}/admin/dossier/${dossierNumber}" style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Voir le dossier dans l'Admin
          </a>
        </p>
      </div>
    </div>
  `;
  return sendGenericEmail({ to: ADMIN_EMAIL, subject, html });
}




type ClientNotificationEmailInput = {
  to: string;
  fullName?: string | null;
  title: string;
  body: string;
  actionUrl?: string | null;
  sourceLabel: string;
};

function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>\"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[character] ?? character));
}

export async function sendClientNotificationEmail(input: ClientNotificationEmailInput): Promise<boolean> {
  const recipient = input.to.trim();
  if (!recipient) return false;
  const baseUrl = SITE_URL.replace(/\/+$/, "");
  const safeName = escapeEmailHtml(input.fullName?.trim() || "Candidat");
  const safeBody = escapeEmailHtml(input.body).replace(/\n/g, "<br />");
  const safeSource = escapeEmailHtml(input.sourceLabel);
  const safeActionUrl = input.actionUrl && input.actionUrl.startsWith("/") && !input.actionUrl.startsWith("//")
    ? `${baseUrl}${input.actionUrl}`
    : `${baseUrl}/mon-espace`;

  try {
    await sendGenericEmail({
      to: recipient,
      subject: `${input.sourceLabel} — ${input.title}`,
      html: renderBrandedEmailHtml({
        title: input.title,
        preheader: input.title,
        bodyHtml: `
          <p>Bonjour <strong>${safeName}</strong>,</p>
          <p>Une nouvelle information est disponible dans votre espace client.</p>
          <div style="background:#f8fafc;border-left:4px solid #2b6cb8;padding:16px 20px;margin:20px 0">
            <p style="margin:0 0 8px;color:#475569;font-size:13px"><strong>Source :</strong> ${safeSource}</p>
            <p style="margin:0;line-height:1.65">${safeBody}</p>
          </div>`,
        cta: { label: "Consulter mon espace client", url: safeActionUrl },
        noteHtml: "Vous pouvez gérer vos préférences de notification depuis votre espace client. Ne répondez pas directement à cet e-mail si votre dossier contient des informations sensibles.",
      }),
    });
    return true;
  } catch (error) {
    console.error("Failed to send client notification email:", error);
    return false;
  }
}

export async function sendEvaluationReceptionEmail(input: {
  to: string;
  fullName: string;
  referenceCode: string;
  destinationCountry?: string | null;
}): Promise<boolean> {
  const destination = input.destinationCountry ? ` pour ${input.destinationCountry}` : "";
  return sendClientNotificationEmail({
    to: input.to,
    fullName: input.fullName,
    title: "Votre évaluation a bien été reçue",
    body: `Votre référence est ${input.referenceCode}. Votre demande${destination} est transmise à l’équipe pour une revue humaine. L’objectif de revue est de 24 heures ; ce délai reste indicatif et aucune décision de visa, d’admission ou d’emploi n’est automatique.`,
    actionUrl: "/mon-espace",
    sourceLabel: "3M TRAVEL AGENCY",
  });
}

export async function sendValidatedEvaluationResponseEmail(input: {
  to: string;
  fullName: string;
  referenceCode: string;
  response: string;
}): Promise<boolean> {
  return sendClientNotificationEmail({
    to: input.to,
    fullName: input.fullName,
    title: "Votre évaluation a été examinée",
    body: `Référence ${input.referenceCode}\n\n${input.response}\n\nCette réponse a été révisée par un conseiller. Consultez votre espace pour la suite du dossier.`,
    actionUrl: "/mon-espace",
    sourceLabel: "3M TRAVEL AGENCY",
  });
}
