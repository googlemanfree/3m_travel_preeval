/**
 * Service de Traduction Certifiée
 * Gère les demandes de traduction, tarification et notifications
 */

import { db } from "./db";
import { translationRequests, translationPricing, translationLanguages } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail as sendEmailFn } from "./emailService";
import { sendWhatsAppMessage } from "./whatsappService";

const sendEmail = (params: any) => sendEmailFn(params.to, params.subject, params.html);

/**
 * Calculer le tarif d'une traduction
 */
export async function calculateTranslationPrice(params: {
  documentType: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  numberOfPages: number;
}): Promise<{ pricePerPage: number; totalPrice: number; currency: string; turnaroundDays: number } | null> {
  try {
    const pricing = await db.query.translationPricing.findFirst({
      where: and(
        eq(translationPricing.documentType, params.documentType as any),
        eq(translationPricing.sourceLanguageCode, params.sourceLanguageCode),
        eq(translationPricing.targetLanguageCode, params.targetLanguageCode),
        eq(translationPricing.isActive, true)
      ),
    });

    if (!pricing) return null;

    const pricePerPage = parseFloat(pricing.pricePerPage.toString());
    const totalPrice = pricePerPage * params.numberOfPages;

    return {
      pricePerPage,
      totalPrice,
      currency: pricing.currency,
      turnaroundDays: pricing.turnaroundDays,
    };
  } catch (err) {
    console.error("[Translation Pricing Error]", err);
    return null;
  }
}

/**
 * Créer une demande de traduction (avant paiement)
 */
export async function createTranslationRequest(params: {
  candidateEmail: string;
  candidateName: string;
  candidatePhone?: string;
  documentType: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  numberOfPages: number;
  sourceDocumentUrl: string;
  sourceDocumentName: string;
  sourceDocumentSize?: number;
  evaluationId?: number;
}): Promise<{ id: number; totalPrice: number; currency: string } | null> {
  try {
    // Calculer le tarif
    const pricing = await calculateTranslationPrice({
      documentType: params.documentType,
      sourceLanguageCode: params.sourceLanguageCode,
      targetLanguageCode: params.targetLanguageCode,
      numberOfPages: params.numberOfPages,
    });

    if (!pricing) {
      throw new Error("Tarification non disponible pour cette combinaison");
    }

    // Créer la demande
    const result = await db.insert(translationRequests).values({
      evaluationId: params.evaluationId,
      candidateEmail: params.candidateEmail,
      candidateName: params.candidateName,
      candidatePhone: params.candidatePhone,
      documentType: params.documentType as any,
      sourceLanguageCode: params.sourceLanguageCode,
      targetLanguageCode: params.targetLanguageCode,
      numberOfPages: params.numberOfPages,
      sourceDocumentUrl: params.sourceDocumentUrl,
      sourceDocumentName: params.sourceDocumentName,
      sourceDocumentSize: params.sourceDocumentSize,
      pricePerPage: pricing.pricePerPage.toString() as any,
      totalPrice: pricing.totalPrice.toString() as any,
      currency: pricing.currency,
      status: "pending_payment",
      paymentStatus: "pending",
    });

    console.log(`[Translation] Demande créée: ${result.insertId}`);
    return {
      id: result.insertId,
      totalPrice: pricing.totalPrice,
      currency: pricing.currency,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[Translation Error] ${errorMsg}`);
    return null;
  }
}

/**
 * Valider le paiement et déclencher la notification admin
 * RÈGLE STRICTE : Admin ne reçoit la notification QUE si paiement validé
 */
export async function validateTranslationPayment(params: {
  translationRequestId: number;
  paymentTransactionId: string;
  paymentMethod: string;
  invoiceNumber: string;
  invoiceUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer la demande
    const request = await db.query.translationRequests.findFirst({
      where: eq(translationRequests.id, params.translationRequestId),
    });

    if (!request) {
      return { success: false, error: "Demande de traduction non trouvée" };
    }

    if (request.paymentStatus !== "pending") {
      return { success: false, error: "Paiement déjà traité" };
    }

    // Mettre à jour le statut de paiement
    await db
      .update(translationRequests)
      .set({
        paymentStatus: "completed",
        status: "pending_translation",  // ← Déverrouille la traduction
        paymentTransactionId: params.paymentTransactionId,
        paymentMethod: params.paymentMethod,
        invoiceNumber: params.invoiceNumber,
        invoiceUrl: params.invoiceUrl,
        paymentDate: new Date(),
      })
      .where(eq(translationRequests.id, params.translationRequestId));

    console.log(`[Translation] Paiement validé pour demande ${params.translationRequestId}`);

    // Envoyer notification au client
    await sendEmailFn(
      request.candidateEmail,
      "✅ Paiement confirmé - Traduction certifiée",
      `
        <h2>Paiement Confirmé</h2>
        <p>Bonjour ${request.candidateName},</p>
        <p>Votre paiement a été reçu avec succès !</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Facture : ${params.invoiceNumber}</li>
          <li>Montant : ${request.totalPrice} ${request.currency}</li>
          <li>Type de document : ${request.documentType}</li>
          <li>Langues : ${request.sourceLanguageCode} → ${request.targetLanguageCode}</li>
        </ul>
        <p>Votre demande de traduction est maintenant en attente de traitement.</p>
        <p>Vous recevrez une notification dès que votre document traduit sera prêt.</p>
        <p>Cordialement,<br>3M Travel & Services</p>
      `
    );

    // Envoyer notification WhatsApp
    if (request.candidatePhone) {
      await sendWhatsAppMessage(
        request.candidatePhone,
        `✅ Paiement confirmé ! Votre demande de traduction (${request.documentType}) est en cours de traitement. Facture: ${params.invoiceNumber}`
      );
    }

    // Envoyer notification admin (UNIQUEMENT après paiement validé)
    await sendEmailFn(
      "admin@3mtravelagency.com",
      `🔔 Nouvelle demande de traduction à traiter - ${request.candidateName}`,
      `
        <h2>Nouvelle Demande de Traduction</h2>
        <p><strong>Statut :</strong> À Traduire (Paiement reçu)</p>
        <p><strong>Client :</strong> ${request.candidateName} (${request.candidateEmail})</p>
        <p><strong>Type :</strong> ${request.documentType}</p>
        <p><strong>Langues :</strong> ${request.sourceLanguageCode} → ${request.targetLanguageCode}</p>
        <p><strong>Pages :</strong> ${request.numberOfPages}</p>
        <p><strong>Montant payé :</strong> ${request.totalPrice} ${request.currency}</p>
        <p><a href="https://3mtravelagency.com/translator/dashboard">Accéder au Dashboard Traducteur</a></p>
      `
    );

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[Translation Payment Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Uploader le document traduit (par le traducteur)
 */
export async function uploadTranslatedDocument(params: {
  translationRequestId: number;
  translatedDocumentUrl: string;
  translatedDocumentName: string;
  translatedDocumentSize?: number;
  translatorEmail: string;
  translatorNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer la demande
    const request = await db.query.translationRequests.findFirst({
      where: eq(translationRequests.id, params.translationRequestId),
    });

    if (!request) {
      return { success: false, error: "Demande de traduction non trouvée" };
    }

    if (request.status !== "pending_translation" && request.status !== "in_progress") {
      return { success: false, error: "Demande non en attente de traduction" };
    }

    // Mettre à jour avec le document traduit
    await db
      .update(translationRequests)
      .set({
        status: "completed",
        translatedDocumentUrl: params.translatedDocumentUrl,
        translatedDocumentName: params.translatedDocumentName,
        translatedDocumentSize: params.translatedDocumentSize,
        assignedToTranslator: params.translatorEmail,
        translatorNotes: params.translatorNotes,
        completionDate: new Date(),
      })
      .where(eq(translationRequests.id, params.translationRequestId));

    console.log(`[Translation] Document traduit uploadé pour demande ${params.translationRequestId}`);

    // Envoyer notification au client
    await sendEmailFn(
      request.candidateEmail,
      "✅ Votre traduction certifiée est prête !",
      `
        <h2>Traduction Complétée</h2>
        <p>Bonjour ${request.candidateName},</p>
        <p>Votre document traduit est maintenant disponible pour téléchargement !</p>
        <p><strong>Détails :</strong></p>
        <ul>
          <li>Type : ${request.documentType}</li>
          <li>Langues : ${request.sourceLanguageCode} → ${request.targetLanguageCode}</li>
          <li>Pages : ${request.numberOfPages}</li>
        </ul>
        <p><a href="https://3mtravelagency.com/mon-espace/traductions">Télécharger votre document</a></p>
        <p>Cordialement,<br>3M Travel & Services</p>
      `
    );

    // Envoyer notification WhatsApp
    if (request.candidatePhone) {
      await sendWhatsAppMessage(
        request.candidatePhone,
        `✅ Votre traduction est prête ! Connectez-vous à votre espace pour télécharger le document traduit.`
      );
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error(`[Translation Upload Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Obtenir les langues disponibles
 */
export async function getAvailableLanguages(): Promise<Array<{ code: string; name: string }>> {
  try {
    const languages = await db.query.translationLanguages.findMany({
      where: eq(translationLanguages.isActive, true),
    });
    return languages.map((lang: any) => ({ code: lang.code, name: lang.name }));
  } catch (err) {
    console.error("[Translation Languages Error]", err);
    return [];
  }
}
