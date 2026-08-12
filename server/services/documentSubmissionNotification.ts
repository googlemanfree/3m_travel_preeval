import { sendEmail } from "../_core/email";

export type DocumentSubmissionAlert = {
  candidateEmail: string;
  documentType: string;
  documentName: string;
  receiptNumber: string;
  dossierNumber?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;",
  })[character] ?? character);
}

export function getDocumentAlertRecipients(env = process.env): string[] {
  const configured = env.DOCUMENT_ALERT_RECIPIENTS || env.COMPLIANCE_AUDITOR_EMAILS || "";
  return Array.from(new Set(configured.split(",").map(email => email.trim().toLowerCase()).filter(Boolean)));
}

/** Notify staff only after a document record has been created successfully. */
export async function notifyDocumentSubmission(alert: DocumentSubmissionAlert): Promise<void> {
  const recipients = getDocumentAlertRecipients();
  if (recipients.length === 0) {
    console.warn("[DocumentAlert] Aucun destinataire configuré pour les dépôts de documents.");
    return;
  }

  const dossier = alert.dossierNumber ? `<p><strong>Dossier :</strong> ${escapeHtml(alert.dossierNumber)}</p>` : "";
  const html = [
    "<h2>Nouveau document candidat</h2>",
    dossier,
    `<p><strong>Référence :</strong> ${escapeHtml(alert.receiptNumber)}</p>`,
    `<p><strong>Catégorie :</strong> ${escapeHtml(alert.documentType)}</p>`,
    `<p><strong>Nom :</strong> ${escapeHtml(alert.documentName)}</p>`,
    `<p><strong>Candidat :</strong> ${escapeHtml(alert.candidateEmail)}</p>`,
    "<p>Connectez-vous au tableau de bord pour effectuer la vérification. Aucun fichier n’est joint à cet e-mail.</p>",
  ].join("");

  await Promise.all(recipients.map(to => sendEmail({
    to,
    subject: `[Documents] Nouveau dépôt ${alert.receiptNumber}`,
    html,
  })));
}
