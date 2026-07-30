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
 * Envoyer la confirmation de paiement de traduction par WhatsApp
 */
export async function sendTranslationPaymentConfirmationWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  documentType: string;
  totalPrice: string;
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
📝 *Traduction - Paiement Confirmé*

Bonjour ${params.candidateName},

Votre paiement pour la traduction a été enregistré :

📄 *Document :* ${params.documentType}
💰 *Montant :* ${params.totalPrice} ${params.currency}
📋 *Facture :* ${params.invoiceNumber}
💳 *Méthode :* ${methodLabel}

Votre document sera traduit et vous sera envoyé dans les délais convenus.

Merci !
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}

/**
 * Envoyer la notification de traduction prête par WhatsApp
 */
export async function sendTranslationReadyWhatsApp(params: {
  phoneNumber: string;
  candidateName: string;
  documentType: string;
  invoiceNumber: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `
🎉 *Votre traduction est prête !*

Bonjour ${params.candidateName},

Nous sommes heureux de vous annoncer que votre traduction est maintenant disponible pour téléchargement.

📄 *Document :* ${params.documentType}
📋 *Facture :* ${params.invoiceNumber}

Connectez-vous à votre espace client pour télécharger votre document.

Merci !
3M Travel & Services
`.trim();

  return sendWhatsAppMessage(params.phoneNumber, message);
}
