/**
 * Service de Génération de Factures PDF
 * Génère des factures professionnelles avec numéros uniques et en-tête 3M Travel & Services
 */

import { getDb } from "./db";
import { clientPayments, evaluations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Génère le contenu HTML d'une facture
 */
export function generateInvoiceHTML(invoice: {
  invoiceNumber: string;
  date: Date;
  candidateName: string;
  candidateEmail: string;
  amount: string;
  currency: string;
  paymentDescription: string;
  paymentMethod: string;
  destinationCountry?: string;
  visaType?: string;
}): string {
  const formattedDate = new Date(invoice.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dueDate = new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #0a2540; padding-bottom: 20px; }
        .company-info h1 { font-size: 28px; color: #0a2540; margin-bottom: 5px; }
        .company-info p { color: #666; font-size: 13px; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 24px; color: #0a2540; margin-bottom: 10px; }
        .invoice-number { font-size: 14px; color: #666; margin-bottom: 5px; }
        .invoice-date { font-size: 14px; color: #666; }
        
        /* Section client */
        .section { margin-bottom: 30px; }
        .section-title { font-size: 12px; font-weight: bold; color: #0a2540; text-transform: uppercase; margin-bottom: 10px; }
        .section-content { font-size: 14px; color: #333; }
        
        /* Détails */
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        
        /* Tableau des services */
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table thead { background: #f0f4ff; }
        table th { padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #0a2540; border-bottom: 2px solid #0a2540; }
        table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        table tr:last-child td { border-bottom: 2px solid #0a2540; }
        
        /* Totaux */
        .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-box { width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .total-row.subtotal { border-bottom: 1px solid #e5e7eb; }
        .total-row.total { font-weight: bold; font-size: 16px; color: #0a2540; padding: 12px 0; }
        
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
            <h1>3M Travel & Services</h1>
            <p>Votre mobilité, notre expertise</p>
            <p style="margin-top: 10px; font-size: 12px;">
              📧 contact@3mtravelagency.com<br>
              📞 +237 XXX XXX XXX<br>
              🏢 Douala, Yaoundé, Kinshasa
            </p>
          </div>
          <div class="invoice-title">
            <h2>FACTURE</h2>
            <div class="invoice-number">N° <strong>${invoice.invoiceNumber}</strong></div>
            <div class="invoice-date">Émise le <strong>${formattedDate}</strong></div>
          </div>
        </div>

        <!-- Détails client -->
        <div class="details-grid">
          <div>
            <div class="section">
              <div class="section-title">Facturé à :</div>
              <div class="section-content">
                <strong>${invoice.candidateName}</strong><br>
                ${invoice.candidateEmail}
              </div>
            </div>
          </div>
          <div>
            <div class="section">
              <div class="section-title">Destination :</div>
              <div class="section-content">
                ${invoice.destinationCountry || "Non spécifiée"}<br>
                ${invoice.visaType || "Type de visa non spécifié"}
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau des services -->
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.paymentDescription}</td>
              <td style="text-align: right;"><strong>${invoice.amount} ${invoice.currency}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Totaux -->
        <div class="totals">
          <div class="totals-box">
            <div class="total-row subtotal">
              <span>Sous-total :</span>
              <span>${invoice.amount} ${invoice.currency}</span>
            </div>
            <div class="total-row total">
              <span>MONTANT TOTAL :</span>
              <span>${invoice.amount} ${invoice.currency}</span>
            </div>
          </div>
        </div>

        <!-- Méthode de paiement -->
        <div class="notes">
          <strong>Méthode de paiement :</strong> ${invoice.paymentMethod === "cash" ? "Espèces" : invoice.paymentMethod === "bank_transfer" ? "Virement bancaire" : invoice.paymentMethod === "card" ? "Carte bancaire" : invoice.paymentMethod === "mobile_money" ? "Mobile Money" : invoice.paymentMethod === "check" ? "Chèque" : "Autre"}
        </div>

        <!-- Conditions -->
        <div class="conditions">
          <p><strong>Conditions de paiement :</strong> Paiement reçu</p>
          <p><strong>Date d'échéance :</strong> ${dueDate}</p>
          <p><strong>Statut :</strong> PAYÉE</p>
        </div>

        <!-- Pied de page -->
        <div class="footer">
          <p>Merci de votre confiance ! Pour toute question, contactez-nous.</p>
          <p>© 2026 3M Travel & Services. Tous droits réservés.</p>
          <p>Cette facture a été générée automatiquement et est valide sans signature.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Génère une facture PDF pour un paiement
 */
export async function generateInvoicePDF(paymentId: number): Promise<{ success: boolean; message: string; invoiceNumber?: string; pdfUrl?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "DB non disponible" };

  try {
    // Récupérer le paiement
    const payments = await db
      .select()
      .from(clientPayments)
      .where(eq(clientPayments.id, paymentId))
      .limit(1);

    if (payments.length === 0) {
      return { success: false, message: "Paiement non trouvé" };
    }

    const payment = payments[0];

    // Récupérer l'évaluation pour les détails
    const evals = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, payment.evaluationId))
      .limit(1);

    const evaluation = evals.length > 0 ? evals[0] : null;

    // Générer le HTML
    const html = generateInvoiceHTML({
      invoiceNumber: payment.invoiceNumber || `INV-${paymentId}`,
      date: payment.invoiceGeneratedAt ?? new Date(),
      candidateName: payment.candidateEmail.split("@")[0], // Utiliser l'email comme fallback
      candidateEmail: payment.candidateEmail,
      amount: payment.amount,
      currency: payment.currency,
      paymentDescription: payment.paymentDescription,
      paymentMethod: payment.paymentMethod,
      destinationCountry: evaluation?.destinationCountry || undefined,
      visaType: evaluation?.visaType || undefined,
    });

    // TODO: Convertir HTML en PDF et stocker dans S3
    // Pour maintenant, retourner le HTML
    console.log(`[Invoice Generated] Payment #${paymentId}: ${payment.invoiceNumber}`);

    return {
      success: true,
      message: `Facture générée avec succès`,
      invoiceNumber: payment.invoiceNumber || `INV-${paymentId}`,
    };
  } catch (err) {
    console.error("[Generate Invoice PDF] Error:", err);
    return { success: false, message: "Erreur lors de la génération de la facture" };
  }
}

/**
 * Génère une décharge pour un document remis
 */
export function generateReceiptHTML(receipt: {
  receiptNumber: string;
  date: Date;
  candidateName: string;
  candidateEmail: string;
  documentName: string;
  documentType: string;
}): string {
  const formattedDate = new Date(receipt.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; background: white; }
        
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0a2540; padding-bottom: 20px; }
        .header h1 { font-size: 28px; color: #0a2540; margin-bottom: 5px; }
        .header p { color: #666; font-size: 13px; }
        
        .title { text-align: center; font-size: 22px; font-weight: bold; color: #0a2540; margin: 30px 0; }
        
        .content { font-size: 14px; line-height: 1.8; margin-bottom: 30px; }
        .content p { margin-bottom: 15px; }
        
        .details { background: #f9fafb; padding: 20px; border-left: 4px solid #ff9800; margin-bottom: 30px; }
        .detail-row { display: flex; margin-bottom: 10px; }
        .detail-label { font-weight: bold; width: 150px; }
        .detail-value { flex: 1; }
        
        .signature { margin-top: 50px; display: flex; justify-content: space-around; }
        .signature-box { text-align: center; }
        .signature-line { border-top: 1px solid #333; width: 150px; margin: 30px auto 10px; }
        
        .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <h1>3M Travel & Services</h1>
          <p>Votre mobilité, notre expertise</p>
        </div>

        <!-- Titre -->
        <div class="title">DÉCHARGE DE DOCUMENT</div>

        <!-- Contenu -->
        <div class="content">
          <p>Je soussigné(e), <strong>${receipt.candidateName}</strong>, reconnaît avoir remis à 3M Travel & Services le document suivant :</p>
        </div>

        <!-- Détails -->
        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Numéro de reçu :</span>
            <span class="detail-value"><strong>${receipt.receiptNumber}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date :</span>
            <span class="detail-value"><strong>${formattedDate}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Document :</span>
            <span class="detail-value"><strong>${receipt.documentName}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type :</span>
            <span class="detail-value"><strong>${receipt.documentType}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email :</span>
            <span class="detail-value"><strong>${receipt.candidateEmail}</strong></span>
          </div>
        </div>

        <!-- Contenu supplémentaire -->
        <div class="content">
          <p>Je certifie que ce document est authentique et conforme à l'original. Je comprends que ce document sera utilisé dans le cadre de ma demande de visa/immigration.</p>
          <p>3M Travel & Services s'engage à conserver ce document en toute confidentialité et conformément à la réglementation en vigueur.</p>
        </div>

        <!-- Signatures -->
        <div class="signature">
          <div class="signature-box">
            <p style="font-size: 12px;">Signature du candidat</p>
            <div class="signature-line"></div>
          </div>
          <div class="signature-box">
            <p style="font-size: 12px;">Signature de 3M Travel & Services</p>
            <div class="signature-line"></div>
          </div>
        </div>

        <!-- Pied de page -->
        <div class="footer">
          <p>© 2026 3M Travel & Services. Tous droits réservés.</p>
          <p>Cette décharge a été générée automatiquement et est valide sans signature supplémentaire.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
