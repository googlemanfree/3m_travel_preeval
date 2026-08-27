import { sendEmail as sendGenericEmail } from "./_core/email";

import { getDb } from "./db";
import { candidates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@3mtravelagency.com";
const SITE_URL = process.env.SITE_URL || "https://www.3mtravelagency.com";

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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">Demande e-Visa Confirmée</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>✅ Votre demande e-Visa a été <strong>soumise avec succès</strong> !</p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">NUMÉRO DE DOSSIER</div>
              <div style="font-size: 32px; font-weight: bold; color: #15803d; letter-spacing: 4px;">${dossierNumber}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 6px;">Conservez ce numéro précieusement</div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px; background: #f3f4f6; font-weight: 600;">Destination</td>
                <td style="padding: 12px; background: #f3f4f6;">${countryName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: 600;">Montant</td>
                <td style="padding: 12px;">${totalCost.toLocaleString("fr-FR")} ${currency}</td>
              </tr>
            </table>
            
            <h3 style="color: #1E3A8A; margin-top: 30px;">Prochaines étapes :</h3>
            <ol style="color: #374151; line-height: 2;">
              <li>Un conseiller vous contactera sur WhatsApp sous 24h</li>
              <li>Préparez vos documents : passeport, CV, diplômes</li>
              <li>Uploadez vos documents dans votre espace candidat</li>
            </ol>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${SITE_URL}/dashboard" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                📁 Accéder à mon espace
              </a>
            </p>
            
            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
              Si vous avez des questions, contactez-nous sur <a href="https://wa.me/237620996045" style="color: #2563EB;">WhatsApp</a> ou par email à <a href="mailto:contact@3mtravelagency.com" style="color: #2563EB;">contact@3mtravelagency.com</a>
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2024 3M Travel & Services. Tous droits réservés.</p>
          </div>
        </div>
      `,
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
            <p><strong>Dossier :</strong> #${dossierNumber}</p>
            <p><strong>Candidat :</strong> ${fullName}</p>
            <p><strong>Destination :</strong> ${countryName}</p>
            <p><strong>Montant :</strong> ${totalCost.toLocaleString("fr-FR")} ${currency}</p>
            
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">Mise à jour de votre demande</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Votre demande e-Visa pour <strong>${countryName}</strong> a été mise à jour.</p>
            
            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0;"><strong>Dossier :</strong> #${dossierNumber}</p>
              <p style="margin: 10px 0 0;"><strong>Statut :</strong> ${statusLabel}</p>
            </div>
            
            ${adminNotes ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0;"><strong>Message de notre équipe :</strong></p>
              <p style="margin: 10px 0 0;">${adminNotes}</p>
            </div>` : ""}
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${SITE_URL}/dashboard" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Voir mon dossier
              </a>
            </p>
          </div>
        </div>
      `,
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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">✅ Paiement Reçu</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Votre paiement a été <strong>reçu et confirmé</strong>.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px; background: #f3f4f6; font-weight: 600;">Dossier</td>
                <td style="padding: 12px; background: #f3f4f6;">#${dossierNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: 600;">Montant</td>
                <td style="padding: 12px;">${amount.toLocaleString("fr-FR")} ${currency}</td>
              </tr>
            </table>
            
            <p>Votre dossier est maintenant <strong>activé</strong>. Un conseiller vous contactera sous 24h pour les prochaines étapes.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
  }
}

export async function sendVerificationLink(to: string, fullName: string, verificationToken: string): Promise<void> {
  const baseUrl = (SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
  const verifyUrl = `${baseUrl}/verify-email-link?token=${encodeURIComponent(verificationToken)}`;
  try {
    await sendGenericEmail({
      to,
      subject: "✓ Confirmez votre email - 3M Travel & Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">Confirmez votre email</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Bienvenue dans votre <strong>Espace Candidat 3M Travel</strong> ! 🎉</p>
            <p>Pour finaliser votre inscription et activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                ✓ Confirmer mon email
              </a>
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #92400e;">
              🔒 <strong>Sécurité :</strong> Ce lien est personnel et valable 24 heures. Ne le partagez avec personne.
            </div>
          </div>
        </div>
      `,
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
      subject: "🔐 Votre code de vérification 3M Travel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">Vérification de votre email</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Voici votre code de vérification :</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #1E3A8A; letter-spacing: 4px;">${otp}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">Ce code expire dans 15 minutes</div>
            </div>
            <p style="font-size: 13px; color: #6b7280;">Pour votre sécurité, ne partagez jamais ce code avec qui que ce soit.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification OTP email:", error);
  }
}

export async function sendPasswordResetEmail(to: string, fullName: string, resetToken: string): Promise<void> {
  const baseUrl = (SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  try {
    await sendGenericEmail({
      to,
      subject: "🔑 Réinitialisation de votre mot de passe 3M Travel",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">Réinitialisation de votre mot de passe</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour le réinitialiser :</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                🔑 Réinitialiser mon mot de passe
              </a>
            </p>
            
            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">Ce lien est valable <strong>1 heure</strong>. Après ce délai, vous devrez faire une nouvelle demande.</p>
            <p style="font-size: 13px; color: #6b7280;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe reste inchangé.</p>
          </div>
        </div>
      `,
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
  const isCurrentAddress = input.recipientRole === "current";
  const title = isCurrentAddress ? "Confirmez le changement de votre adresse e-mail" : "Confirmez votre nouvelle adresse e-mail";
  const explanation = isCurrentAddress
    ? "Une demande de remplacement de l’adresse de connexion de votre espace client a été initiée. Confirmez-la uniquement si vous en êtes à l’origine."
    : "Cette adresse a été proposée comme nouvelle adresse de connexion. Confirmez-la uniquement si vous êtes à l’origine de la demande.";

  await sendGenericEmail({
    to: input.to,
    subject: `3M Travel & Services — ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#172033;">
        <div style="background:#0B2A52;padding:28px 32px;color:#fff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.85;">3M Travel &amp; Services</p>
          <h1 style="margin:0;font-size:24px;">${title}</h1>
        </div>
        <div style="padding:28px 32px;background:#f8fafc;">
          <p>Bonjour <strong>${safeName}</strong>,</p>
          <p>${explanation}</p>
          <p style="text-align:center;margin:28px 0 18px;">
            <a href="${input.confirmationUrl}" style="display:inline-block;background:#B98932;color:#172033;padding:13px 22px;border-radius:7px;text-decoration:none;font-weight:700;">Confirmer l’adresse</a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#475569;">Le lien expire dans une heure. Pour finaliser le changement, la confirmation de l’autre adresse est également requise.</p>
          <p style="font-size:13px;line-height:1.6;color:#475569;">Si vous n’avez pas demandé ce changement, ne cliquez pas sur le lien et contactez l’agence par les coordonnées officielles.</p>
        </div>
      </div>
    `,
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
  const destLabel = destLabels[destination] ?? "International";
  try {
    await sendGenericEmail({
      to,
      subject: `Bienvenue chez 3M Travel & Services - Votre voyage vers ${destLabel} commence !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">Bienvenue, ${fullName} !</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <p>Nous sommes ravis de vous accueillir chez <strong>3M Travel & Services</strong>. Votre intérêt pour ${destLabel} est le premier pas vers une nouvelle aventure !</p>
            <p>Notre équipe est prête à vous accompagner à chaque étape de votre projet. Vous pouvez dès maintenant accéder à votre tableau de bord pour suivre l'avancement de votre dossier et gérer vos informations.</p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                🚀 Accéder à mon tableau de bord
              </a>
            </p>
            
            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
              Si vous avez des questions, n'hésitez pas à nous contacter sur <a href="https://wa.me/237620996045" style="color: #2563EB;">WhatsApp</a> ou par email à <a href="mailto:contact@3mtravelagency.com" style="color: #2563EB;">contact@3mtravelagency.com</a>
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>© 2024 3M Travel & Services. Tous droits réservés.</p>
          </div>
        </div>
      `,
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
  amount: number
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const whatsappUrl = `https://wa.me/237620996045?text=${encodeURIComponent(`Bonjour 3M Travel, je confirme l'ouverture de mon dossier ${dossierNumber}.`)}`;
  
  let avatarHtml = "";
  try {
    const db = await getDb();
    if (db) {
      const [cand] = await db.select().from(candidates).where(eq(candidates.email, to)).limit(1);
      if (cand?.avatarUrl) {
        avatarHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${cand.avatarUrl}" alt="${fullName}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid #16a34a; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /></div>`;
      }
    }
  } catch {}

  try {
    await sendGenericEmail({
      to,
      subject: `✅ Votre dossier ${dossierNumber} est ouvert !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0;">✅ Dossier Créé</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            ${avatarHtml}
            <p>Bonjour <strong>${fullName}</strong>,</p>
            <p>✅ Votre dossier d'immigration a été <strong>créé avec succès</strong> !</p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">NUMÉRO DE DOSSIER</div>
              <div style="font-size: 32px; font-weight: bold; color: #15803d; letter-spacing: 4px;">${dossierNumber}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 6px;">Conservez ce numéro précieusement</div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px; background: #f3f4f6; font-weight: 600;">Destination</td>
                <td style="padding: 12px; background: #f3f4f6;">${destination.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: 600;">Montant</td>
                <td style="padding: 12px;">${amount.toLocaleString("fr-FR")} FCFA</td>
              </tr>
            </table>
            
            <h3 style="color: #1E3A8A; margin-top: 30px;">Prochaines étapes :</h3>
            <ol style="color: #374151; line-height: 2; font-size: 14px;">
              <li>Un conseiller vous contactera sur WhatsApp sous 24h</li>
              <li>Préparez vos documents : passeport, CV, diplômes</li>
              <li>Uploadez vos documents dans votre espace candidat</li>
            </ol>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block; margin-right: 8px;">
                📁 Mon espace candidat
              </a>
              <a href="${whatsappUrl}" style="background: #25D366; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
                💬 Contacter par WhatsApp
              </a>
            </p>
          </div>
        </div>
            `,
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
        avatarHtml = `<div style="text-align: center; margin-bottom: 20px;"><img src="${cand.avatarUrl}" alt="${fullName}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid #DC2626; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /></div>`;
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
          <li><strong>Numéro de Dossier :</strong> #${dossierNumber}</li>
          <li><strong>Candidat :</strong> ${fullName}</li>
          <li><strong>Email :</strong> ${email}</li>
          <li><strong>WhatsApp :</strong> ${whatsappNumber}</li>
          <li><strong>Destination :</strong> ${destination}</li>
          <li><strong>Statut Initial :</strong> ${status}</li>
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
  const safeTitle = escapeEmailHtml(input.title);
  const safeBody = escapeEmailHtml(input.body).replace(/\n/g, "<br />");
  const safeSource = escapeEmailHtml(input.sourceLabel);
  const safeActionUrl = input.actionUrl && input.actionUrl.startsWith("/")
    ? `${baseUrl}${input.actionUrl}`
    : `${baseUrl}/mon-espace`;

  try {
    await sendGenericEmail({
      to: recipient,
      subject: `${input.sourceLabel} — ${input.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #172033;">
          <div style="background: linear-gradient(135deg, #123b70 0%, #2563eb 100%); padding: 28px 32px; color: white;">
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; opacity: .85;">Prime Travel Service</p>
            <h1 style="margin: 0; font-size: 24px;">${safeTitle}</h1>
          </div>
          <div style="padding: 28px 32px; background: #f8fafc;">
            <p>Bonjour <strong>${safeName}</strong>,</p>
            <p>Une nouvelle information est disponible dans votre espace client.</p>
            <div style="background: white; border-left: 4px solid #2563eb; padding: 18px 20px; margin: 22px 0;">
              <p style="margin: 0 0 8px; color: #475569; font-size: 13px;"><strong>Source :</strong> ${safeSource}</p>
              <p style="margin: 0; line-height: 1.65;">${safeBody}</p>
            </div>
            <p style="text-align: center; margin: 28px 0 12px;">
              <a href="${safeActionUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 7px; display: inline-block;">Consulter mon espace client</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">Vous pouvez gérer vos préférences de notification depuis votre espace client. Ne répondez pas directement à cet e-mail si votre dossier contient des informations sensibles.</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send client notification email:", error);
    return false;
  }
}
