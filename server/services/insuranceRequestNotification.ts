import { sendEmail } from "../_core/email";

type InsuranceAlert = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  travelersCount: number;
};

type InsuranceClientDelivery = InsuranceAlert & { documentUrl: string; documentLabel: string; documentKind: "coupon" | "attestation" };

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character] ?? character);

export function getInsuranceAlertRecipients(env = process.env): string[] {
  const raw = env.INSURANCE_ALERT_RECIPIENTS || env.DOCUMENT_ALERT_RECIPIENTS || "hello@3mtravelagency.com";
  return Array.from(new Set(raw.split(",").map(value => value.trim().toLowerCase()).filter(Boolean)));
}

/** Alert staff after a request is persisted; never include passport numbers in e-mail. */
export async function notifyInsuranceRequest(alert: InsuranceAlert): Promise<void> {
  const html = [
    "<h2>Nouvelle demande d’assurance voyage</h2>",
    `<p><strong>Référence :</strong> ${escapeHtml(alert.reference)}</p>`,
    `<p><strong>Client :</strong> ${escapeHtml(alert.fullName)} — ${escapeHtml(alert.email)} — ${escapeHtml(alert.phone)}</p>`,
    `<p><strong>Voyage :</strong> ${escapeHtml(alert.destinationCountry)}, du ${escapeHtml(alert.departureDate)} au ${escapeHtml(alert.returnDate)}</p>`,
    `<p><strong>Voyageurs :</strong> ${alert.travelersCount}</p>`,
    "<p>Connectez-vous à l’administration pour consulter le dossier complet. Aucun numéro de passeport n’est inclus dans cet e-mail.</p>",
  ].join("");
  await Promise.all(getInsuranceAlertRecipients().map(to => sendEmail({
    to,
    subject: `[Assurance] Nouvelle demande ${alert.reference}`,
    html,
  })));
}

export async function sendInsuranceClientDelivery(delivery: InsuranceClientDelivery): Promise<void> {
  const documentTitle = delivery.documentKind === "coupon" ? "Votre coupon de réservation d’assurance" : "Votre attestation d’assurance voyage";
  const statusText = delivery.documentKind === "coupon"
    ? "Votre demande est enregistrée. Notre équipe traite maintenant votre dossier auprès du fournisseur."
    : "Votre attestation est disponible après traitement de votre dossier par l’agence.";
  await sendEmail({
    to: delivery.email,
    subject: `[3M Travel] ${documentTitle} — ${delivery.reference}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172554"><h2>${escapeHtml(documentTitle)}</h2><p>Bonjour <strong>${escapeHtml(delivery.fullName)}</strong>,</p><p>${escapeHtml(statusText)}</p><p><strong>Référence :</strong> ${escapeHtml(delivery.reference)}<br/><strong>Destination :</strong> ${escapeHtml(delivery.destinationCountry)}<br/><strong>Séjour :</strong> ${escapeHtml(delivery.departureDate)} au ${escapeHtml(delivery.returnDate)}</p><p style="margin:28px 0"><a href="${escapeHtml(delivery.documentUrl)}" style="background:#1e3a8a;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Télécharger le document PDF</a></p><p>Vous pouvez aussi le retrouver dans votre espace client après connexion avec cette même adresse e-mail.</p><p>Cordialement,<br/><strong>3M Travel & Services</strong></p></div>`,
  });
}
