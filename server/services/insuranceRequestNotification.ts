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
