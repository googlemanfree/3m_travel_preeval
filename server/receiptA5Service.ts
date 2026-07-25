/**
 * Service de Génération de Reçus A5 (Format Caisse)
 * Pour l'impression des paiements cash effectués en agence
 */

/**
 * Génère le contenu HTML d'un reçu A5 (format caisse)
 * Dimensions : 210mm x 148mm (A5)
 */
export function generateReceiptA5HTML(receipt: {
  receiptNumber: string;
  date: Date;
  time: string;
  candidateName: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  agentName?: string;
  agencyLocation?: string;
  description?: string;
}): string {
  const formattedDate = new Date(receipt.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Courier New', monospace;
          color: #000;
          line-height: 1.4;
          background: white;
        }
        
        /* Format A5 : 210mm x 148mm */
        .receipt {
          width: 210mm;
          height: 148mm;
          padding: 10mm;
          margin: 0 auto;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 8mm;
          margin-bottom: 8mm;
        }
        
        .header h1 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        
        .header p {
          font-size: 11px;
          margin: 1mm 0;
        }
        
        .content {
          flex: 1;
          font-size: 12px;
        }
        
        .line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4mm;
          font-size: 12px;
        }
        
        .label {
          font-weight: bold;
          width: 40%;
        }
        
        .value {
          text-align: right;
          width: 60%;
        }
        
        .amount-section {
          border-top: 2px dashed #000;
          border-bottom: 2px dashed #000;
          padding: 6mm 0;
          margin: 8mm 0;
          text-align: center;
        }
        
        .amount {
          font-size: 18px;
          font-weight: bold;
          margin: 4mm 0;
        }
        
        .currency {
          font-size: 12px;
        }
        
        .footer {
          border-top: 2px dashed #000;
          padding-top: 6mm;
          text-align: center;
          font-size: 10px;
        }
        
        .footer p {
          margin: 2mm 0;
        }
        
        .barcode {
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          margin: 4mm 0;
          font-weight: bold;
        }
        
        /* Impression */
        @media print {
          body { margin: 0; padding: 0; }
          .receipt { margin: 0; }
          @page { size: A5; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- En-tête -->
        <div class="header">
          <h1>3M TRAVEL & SERVICES</h1>
          <p>Reçu de Paiement</p>
          <p>Votre mobilité, notre expertise</p>
        </div>

        <!-- Contenu -->
        <div class="content">
          <div class="line">
            <span class="label">N° Reçu :</span>
            <span class="value"><strong>${receipt.receiptNumber}</strong></span>
          </div>
          
          <div class="line">
            <span class="label">Date :</span>
            <span class="value">${formattedDate}</span>
          </div>
          
          <div class="line">
            <span class="label">Heure :</span>
            <span class="value">${receipt.time}</span>
          </div>
          
          <div class="line">
            <span class="label">Client :</span>
            <span class="value">${receipt.candidateName}</span>
          </div>
          
          ${receipt.agencyLocation ? `
          <div class="line">
            <span class="label">Agence :</span>
            <span class="value">${receipt.agencyLocation}</span>
          </div>
          ` : ""}
          
          ${receipt.agentName ? `
          <div class="line">
            <span class="label">Agent :</span>
            <span class="value">${receipt.agentName}</span>
          </div>
          ` : ""}
          
          ${receipt.description ? `
          <div class="line">
            <span class="label">Description :</span>
            <span class="value">${receipt.description}</span>
          </div>
          ` : ""}
          
          <div class="line">
            <span class="label">Méthode :</span>
            <span class="value">${receipt.paymentMethod === "cash" ? "Espèces" : receipt.paymentMethod}</span>
          </div>
        </div>

        <!-- Montant -->
        <div class="amount-section">
          <div class="currency">Montant Total</div>
          <div class="amount">${receipt.amount}</div>
          <div class="currency">${receipt.currency}</div>
        </div>

        <!-- Pied de page -->
        <div class="footer">
          <div class="barcode">${receipt.receiptNumber}</div>
          <p>Merci de votre confiance !</p>
          <p>Conservez ce reçu à titre de preuve de paiement</p>
          <p style="font-size: 9px; margin-top: 3mm;">© 2026 3M Travel & Services</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Génère un reçu A5 pour impression directe
 */
export function generateReceiptA5ForPrint(receipt: {
  receiptNumber: string;
  date: Date;
  time: string;
  candidateName: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  agentName?: string;
  agencyLocation?: string;
  description?: string;
}): string {
  return generateReceiptA5HTML(receipt);
}

/**
 * Génère plusieurs reçus A5 sur une même page (2 par page A4)
 */
export function generateMultipleReceiptsA5HTML(receipts: Array<{
  receiptNumber: string;
  date: Date;
  time: string;
  candidateName: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  agentName?: string;
  agencyLocation?: string;
  description?: string;
}>): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: white; }
        
        .page { page-break-after: always; }
        .receipts-row { display: flex; gap: 5mm; page-break-inside: avoid; }
        
        .receipt {
          width: 210mm;
          height: 148mm;
          padding: 10mm;
          background: white;
          border: 1px solid #ccc;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 8mm;
          margin-bottom: 8mm;
        }
        
        .header h1 { font-size: 14px; font-weight: bold; margin-bottom: 2mm; }
        .header p { font-size: 10px; margin: 1mm 0; }
        
        .line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3mm;
          font-size: 11px;
        }
        
        .label { font-weight: bold; width: 40%; }
        .value { text-align: right; width: 60%; }
        
        .amount-section {
          border-top: 2px dashed #000;
          border-bottom: 2px dashed #000;
          padding: 5mm 0;
          margin: 6mm 0;
          text-align: center;
        }
        
        .amount { font-size: 16px; font-weight: bold; margin: 3mm 0; }
        .currency { font-size: 11px; }
        
        .footer {
          border-top: 2px dashed #000;
          padding-top: 4mm;
          text-align: center;
          font-size: 9px;
        }
        
        .barcode {
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          margin: 2mm 0;
          font-weight: bold;
        }
        
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: A4; margin: 0; }
        }
      </style>
    </head>
    <body>
      ${receipts
        .map(
          (receipt, idx) => `
        ${idx % 2 === 0 ? '<div class="page">' : ""}
        <div class="receipt">
          <div class="header">
            <h1>3M TRAVEL & SERVICES</h1>
            <p>Reçu de Paiement</p>
          </div>
          <div class="content">
            <div class="line">
              <span class="label">N° Reçu :</span>
              <span class="value"><strong>${receipt.receiptNumber}</strong></span>
            </div>
            <div class="line">
              <span class="label">Date :</span>
              <span class="value">${new Date(receipt.date).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}</span>
            </div>
            <div class="line">
              <span class="label">Client :</span>
              <span class="value">${receipt.candidateName}</span>
            </div>
          </div>
          <div class="amount-section">
            <div class="currency">Montant</div>
            <div class="amount">${receipt.amount}</div>
            <div class="currency">${receipt.currency}</div>
          </div>
          <div class="footer">
            <div class="barcode">${receipt.receiptNumber}</div>
            <p>Merci de votre confiance !</p>
          </div>
        </div>
        ${idx % 2 === 1 ? "</div>" : ""}
      `
        )
        .join("")}
    </body>
    </html>
  `;
}
