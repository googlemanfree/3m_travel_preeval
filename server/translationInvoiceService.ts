/**
 * Service de Génération de Factures PDF pour les Traductions
 * Génère des factures professionnelles avec numéros uniques pour les commandes de traduction
 */

import { getDb } from "./db";
import { translationRequests } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendTranslationPaymentConfirmationEmail, sendAdminTranslationPaymentAlert } from "./emailService";
import { sendTranslationPaymentConfirmationWhatsApp } from "./whatsappService";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@3mtravelagency.com";

/**
 * Génère le contenu HTML d'une facture de traduction
 */
export function generateTranslationInvoiceHTML(translation: {
  id: number;
  invoiceNumber: string;
  invoiceGeneratedAt: Date;
  candidateName: string;
  candidateEmail: string;
  documentType: string;
  sourceLanguage: string;
  targetLanguage: string;
  numberOfPages: number;
  pricePerPage: string;
  totalPrice: string;
  currency: string;
  paymentMethod: string;
  paymentTransactionId?: string;
}): string {
  const formattedDate = new Date(translation.invoiceGeneratedAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dueDate = new Date(new Date(translation.invoiceGeneratedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const documentTypeLabel = {
    birth_certificate: "Certificat de Naissance",
    diploma: "Diplôme",
    transcript: "Relevé de Notes",
    criminal_record: "Casier Judiciaire",
    marriage_certificate: "Certificat de Mariage",
    divorce_decree: "Jugement de Divorce",
    employment_letter: "Lettre d'Emploi",
    bank_statement: "Relevé Bancaire",
    passport: "Passeport",
    driver_license: "Permis de Conduire",
    medical_report: "Rapport Médical",
    other: "Autre Document",
  }[translation.documentType] || translation.documentType;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px; background: white; }
        
        /* En-tête */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1E3A8A; padding-bottom: 20px; }
        .company-info h1 { font-size: 28px; color: #1E3A8A; margin-bottom: 5px; font-weight: 900; }
        .company-info p { color: #666; font-size: 13px; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 24px; color: #1E3A8A; margin-bottom: 10px; }
        .invoice-number { font-size: 14px; color: #666; margin-bottom: 5px; }
        .invoice-date { font-size: 14px; color: #666; }
        
        /* Section client */
        .section { margin-bottom: 30px; }
        .section-title { font-size: 12px; font-weight: bold; color: #1E3A8A; text-transform: uppercase; margin-bottom: 10px; }
        .section-content { font-size: 14px; color: #333; }
        
        /* Détails */
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        
        /* Tableau des services */
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table thead { background: #f0f4ff; }
        table th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #1E3A8A; border-bottom: 2px solid #1E3A8A; }
        table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        table tr:last-child td { border-bottom: 2px solid #1E3A8A; }
        
        /* Totaux */
        .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-box { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .total-row.subtotal { border-bottom: 1px solid #e5e7eb; }
        .total-row.total { font-weight: bold; font-size: 16px; color: #1E3A8A; padding: 12px 0; }
        
        /* Notes */
        .notes { background: #f9fafb; padding: 15px; border-left: 4px solid #ff9800; margin-bottom: 30px; font-size: 13px; color: #666; }
        
        /* Conditions */
        .conditions { font-size: 12px; color: #999; margin-bottom: 30px; }
        .conditions p { margin-bottom: 5px; }
        
        /* Pied de page */
        .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #999; }
        .footer p { margin-bottom: 5px; }
        
        /* Impression */
        @media print {
          body { margin: 0; padding: 0; }
          .container { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <div class="company-info">
            <h1>3M TRAVEL & SERVICES</h1>
            <p>Pré-évaluation Visa & Immigration</p>
            <p>Email: hello@3mtravelagency.com</p>
            <p>Téléphone: +237 XXX XXX XXX</p>
          </div>
          <div class="invoice-title">
            <h2>FACTURE</h2>
            <div class="invoice-number">Numéro: ${translation.invoiceNumber}</div>
            <div class="invoice-date">Date: ${formattedDate}</div>
          </div>
        </div>

        <!-- Détails client -->
        <div class="details-grid">
          <div class="section">
            <div class="section-title">Facturé à</div>
            <div class="section-content">
              <p><strong>${translation.candidateName}</strong></p>
              <p>${translation.candidateEmail}</p>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Détails du Paiement</div>
            <div class="section-content">
              <p><strong>Méthode:</strong> ${translation.paymentMethod}</p>
              <p><strong>Date d'échéance:</strong> ${dueDate}</p>
              ${translation.paymentTransactionId ? `<p><strong>ID Transaction:</strong> ${translation.paymentTransactionId}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Tableau des services -->
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Traduction: ${documentTypeLabel}</strong><br>
                <small>De ${translation.sourceLanguage} vers ${translation.targetLanguage}</small>
              </td>
              <td style="text-align: right;">${translation.numberOfPages} page(s)</td>
              <td style="text-align: right;">${translation.pricePerPage} ${translation.currency}</td>
              <td style="text-align: right;"><strong>${translation.totalPrice} ${translation.currency}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Totaux -->
        <div class="totals">
          <div class="totals-box">
            <div class="total-row subtotal">
              <span>Sous-total:</span>
              <span>${translation.totalPrice} ${translation.currency}</span>
            </div>
            <div class="total-row total">
              <span>TOTAL:</span>
              <span>${translation.totalPrice} ${translation.currency}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="notes">
          <strong>Merci pour votre commande!</strong><br>
          Votre document sera traduit et vous sera envoyé dans les délais convenus. Vous recevrez une notification par email dès que la traduction sera prête pour téléchargement.
        </div>

        <!-- Conditions -->
        <div class="conditions">
          <p><strong>Conditions de paiement:</strong> Paiement à la commande</p>
          <p><strong>Délai de livraison:</strong> 3-5 jours ouvrables selon la complexité du document</p>
          <p><strong>Confidentialité:</strong> Tous les documents sont traités de manière confidentielle et sécurisée.</p>
        </div>

        <!-- Pied de page -->
        <div class="footer">
          <p>3M Travel & Services SARL | Pré-évaluation Visa & Immigration</p>
          <p>Cette facture a été générée automatiquement. Merci de votre confiance.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Génère une facture PDF pour une commande de traduction
 */
export async function generateTranslationInvoicePDF(translationId: number): Promise<{ success: boolean; message: string; invoiceUrl?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "DB non disponible" };

  try {
    // Récupérer la commande de traduction
    const translations = await db
      .select()
      .from(translationRequests)
      .where(eq(translationRequests.id, translationId))
      .limit(1);

    if (translations.length === 0) {
      return { success: false, message: "Commande de traduction non trouvée" };
    }

    const translation = translations[0];

    if (translation.paymentStatus !== "completed") {
      return { success: false, message: "Le paiement n'a pas été complété pour cette traduction" };
    }

    // Générer le HTML
    const html = generateTranslationInvoiceHTML({
      id: translation.id,
      invoiceNumber: translation.invoiceNumber || `TRN-${translationId}-${Date.now()}`,
      invoiceGeneratedAt: translation.paymentDate ?? new Date(),
      candidateName: translation.candidateName,
      candidateEmail: translation.candidateEmail,
      documentType: translation.documentType,
      sourceLanguage: translation.sourceLanguageCode,
      targetLanguage: translation.targetLanguageCode,
      numberOfPages: translation.numberOfPages,
      pricePerPage: translation.pricePerPage.toString(),
      totalPrice: translation.totalPrice.toString(),
      currency: translation.currency,
      paymentMethod: translation.paymentMethod || "Mobile Money",
      paymentTransactionId: translation.paymentTransactionId || undefined,
    });

    // Générer un numéro de facture
    const invoiceNumber = translation.invoiceNumber || `TRN-${translationId}-${Date.now()}`;

    // Mettre à jour la DB avec le numéro de facture
    await db.update(translationRequests).set({
      invoiceNumber,
      invoiceUrl: `/translation/invoice/${invoiceNumber}`,
      paymentNotificationSent: true,
    }).where(eq(translationRequests.id, translationId));

    // Envoyer les notifications
    try {
      // Email au client
      await sendTranslationPaymentConfirmationEmail(
        translation.candidateEmail,
        translation.candidateName,
        translation.documentType,
        invoiceNumber,
        translation.totalPrice.toString(),
        translation.currency,
        `/translation/invoice/${invoiceNumber}`
      );

      // WhatsApp au client
      if (translation.candidatePhone) {
        await sendTranslationPaymentConfirmationWhatsApp({
          phoneNumber: translation.candidatePhone,
          candidateName: translation.candidateName,
          documentType: translation.documentType,
          totalPrice: translation.totalPrice.toString(),
          currency: translation.currency,
          invoiceNumber,
          paymentMethod: translation.paymentMethod || "Mobile Money",
        });
      }

      // Email à l'admin
      await sendAdminTranslationPaymentAlert(
        ADMIN_EMAIL,
        translation.candidateName,
        translation.candidateEmail,
        translation.documentType,
        translation.numberOfPages,
        translation.totalPrice.toString(),
        translation.currency,
        invoiceNumber
      );
    } catch (error) {
      console.error("Error sending notifications:", error);
      // Ne pas échouer si les notifications échouent
    }

    console.log(`[Translation Invoice Generated] Translation #${translationId}: ${invoiceNumber}`);

    return {
      success: true,
      message: `Facture générée avec succès`,
      invoiceUrl: `/translation/invoice/${invoiceNumber}`,
    };
  } catch (err) {
    console.error("[Generate Translation Invoice PDF] Error:", err);
    return { success: false, message: "Erreur lors de la génération de la facture" };
  }
}
