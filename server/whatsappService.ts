/**
 * Service WhatsApp - Envoyer les notifications de bilan d'admissibilité
 * Utilise Twilio pour l'envoi de messages WhatsApp
 */

import axios from "axios";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "";

/**
 * Envoyer un message WhatsApp via Twilio
 */
export async function sendWhatsAppMessage(
  toPhoneNumber: string,
  message: string,
  templateName?: string,
  templateParams?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Valider le numéro de téléphone
    if (!toPhoneNumber || !toPhoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      return { success: false, error: "Numéro de téléphone invalide" };
    }

    // Formater le numéro avec le préfixe +
    const formattedPhone = toPhoneNumber.startsWith("+") ? toPhoneNumber : `+${toPhoneNumber}`;

    // Si Twilio n'est pas configuré, retourner un succès simulé
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.log(`[WhatsApp Mock] Message envoyé à ${formattedPhone}: ${message}`);
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // Construire le payload
    const payload = {
      From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      To: `whatsapp:${formattedPhone}`,
      Body: message,
    };

    // Envoyer via Twilio
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      payload,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log(`[WhatsApp] Message envoyé à ${formattedPhone}: ${response.data.sid}`);
    return { success: true, messageId: response.data.sid };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[WhatsApp Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Envoyer le bilan d'admissibilité par WhatsApp
 */
export async function sendAdmissibilityReportWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  destinationCountry: string;
  visaType: string;
  scorePercentage: number;
  recommendation: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
🌟 *3M Travel & Services - Bilan d'Admissibilité*

Bonjour ${params.candidateName},

Votre évaluation pour ${params.destinationCountry} (${params.visaType}) est prête !

📊 *Score d'admissibilité : ${params.scorePercentage}%*

${params.recommendation}

📅 Veuillez consulter votre email pour le rapport détaillé.

Pour toute question, contactez-nous via WhatsApp ou email.

Cordialement,
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer la confirmation de rendez-vous par WhatsApp
 */
export async function sendAppointmentConfirmationWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  appointmentDate: string;
  appointmentTime: string;
  agencyLocation: string;
  agencyPhone: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
✅ *Confirmation de Rendez-vous*

Bonjour ${params.candidateName},

Votre rendez-vous a été confirmé :

📅 *Date :* ${params.appointmentDate}
🕐 *Heure :* ${params.appointmentTime}
📍 *Lieu :* ${params.agencyLocation}
📞 *Téléphone :* ${params.agencyPhone}

Veuillez arriver 10 minutes avant l'heure prévue.

À bientôt !
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer la confirmation de paiement par WhatsApp
 */
export async function sendPaymentConfirmationWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  amount: string;
  currency: string;
  invoiceNumber: string;
  paymentMethod: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const methodLabel = {
    cash: "Espèces",
    bank_transfer: "Virement bancaire",
    card: "Carte bancaire",
    mobile_money: "Mobile Money",
    check: "Chèque",
  }[params.paymentMethod] || params.paymentMethod;

  const message = `
💳 *Confirmation de Paiement*

Bonjour ${params.candidateName},

Votre paiement a été enregistré :

💰 *Montant :* ${params.amount} ${params.currency}
📋 *Facture :* ${params.invoiceNumber}
💳 *Méthode :* ${methodLabel}

Un reçu détaillé vous a été envoyé par email.

Merci !
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}


/**
 * Envoyer la notification de visa approuvé par WhatsApp
 */
export async function sendVisaApprovedWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  destinationCountry: string;
  visaType: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
🎉 *Félicitations ${params.candidateName}* 🎉

Votre visa ${params.visaType} pour ${params.destinationCountry} a été approuvé ! ✅

Consultez votre espace candidat pour les détails et les prochaines étapes.

Merci de votre confiance !
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer un rappel de paiement par WhatsApp
 */
export async function sendPaymentReminderWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  amount: string;
  currency: string;
  paymentLink?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
⏰ *Rappel - Paiement en Attente*

Bonjour ${params.candidateName},

Votre paiement de ${params.amount} ${params.currency} est en attente.

Finalisez votre dossier en procédant au paiement dès maintenant.

${params.paymentLink ? `Lien de paiement : ${params.paymentLink}` : 'Consultez votre email pour le lien de paiement'}

Cordialement,
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer une notification de documents reçus par WhatsApp
 */
export async function sendDocumentsReceivedWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  documentCount: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
✅ *Documents Reçus*

Bonjour ${params.candidateName},

Nous avons reçu et vérifié ${params.documentCount} document(s).

Prochaine étape : Soumission aux agences partenaires.

Nous vous tiendrons informé de l'avancement.

Cordialement,
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer une notification de soumission aux agences par WhatsApp
 */
export async function sendSubmittedToAgenciesWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  destinationCountry: string;
  agencyName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
📤 *Dossier Soumis aux Agences Partenaires*

Bonjour ${params.candidateName},

Votre dossier pour ${params.destinationCountry} a été soumis à ${params.agencyName}.

Nous vous tiendrons informé de la progression du recrutement.

Cordialement,
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer une notification de contrat obtenu par WhatsApp
 */
export async function sendContractObtainedWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  employerName: string;
  position: string;
  destinationCountry: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
🎊 *Contrat Obtenu* 🎊

Bonjour ${params.candidateName},

Excellente nouvelle ! Vous avez obtenu un contrat de travail ! 🎉

📋 *Employeur :* ${params.employerName}
💼 *Poste :* ${params.position}
🌍 *Destination :* ${params.destinationCountry}

Consultez votre espace candidat pour les détails et les prochaines étapes.

Cordialement,
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer une notification de dossier rejeté par WhatsApp
 */
export async function sendApplicationRejectedWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  reason: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
❌ *Mise à Jour de Votre Dossier*

Bonjour ${params.candidateName},

Malheureusement, votre dossier n'a pas pu être approuvé.

*Raison :* ${params.reason}

Nous vous invitons à nous contacter pour discuter des options disponibles.

Cordialement,
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer une notification double (Email + WhatsApp)
 */
export async function sendDualNotification(
  email: string,
  phoneNumber: string,
  subject: string,
  htmlContent: string,
  whatsappMessage: string
): Promise<{ emailSent: boolean; whatsappSent: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const { sendEmail: sendGenericEmail } = await import('./_core/email');
    await sendGenericEmail({ to: email, subject, html: htmlContent });
  } catch (error) {
    errors.push(`Email: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }

  const whatsappResult = await sendWhatsAppMessage(phoneNumber, whatsappMessage);
  if (!whatsappResult.success) {
    errors.push(`WhatsApp: ${whatsappResult.error || 'Erreur inconnue'}`);
  }

  return {
    emailSent: errors.length === 0 || !errors.some(e => e.startsWith('Email:')),
    whatsappSent: whatsappResult.success,
    errors,
  };
}
