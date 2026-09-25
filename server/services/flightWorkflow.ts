import { paymentMethodLabel } from "../../shared/paymentMethods";

/**
 * Règles du parcours d'une réservation de vol côté agence : quels changements de statut sont permis, et les e-mails
 * qui accompagnent une décision sur le paiement. Fonctions pures, testées séparément du routeur.
 */

export type FlightRequestStatus = "pending_review" | "assigned" | "needs_info" | "revalidated" | "awaiting_payment" | "issued" | "cancelled";

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max = 200): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

/**
 * Renvoie le motif du refus, ou null si le changement est permis.
 * « Émis » ne s'obtient QUE par l'émission (PNR + checklist + paiement vérifié) : sinon un simple changement de statut
 * annoncerait au client un billet inexistant. Une réservation émise est verrouillée : on ne la « désémet » pas par un statut.
 */
export function refuseStatusChange(from: FlightRequestStatus, to: FlightRequestStatus): string | null {
  if (from === to) return null;
  if (from === "issued") return "Le billet est déjà émis : le statut est verrouillé. Pour corriger le PNR, utilisez l'action d'émission.";
  if (to === "issued") return "Le statut « émis » ne se choisit pas : il est posé par l'action d'émission, une fois la checklist validée et le PNR saisi.";
  return null;
}

/** Une décision sur le paiement n'a de sens que tant que le billet n'est ni émis ni annulé. */
export function refusePaymentDecision(status: FlightRequestStatus): string | null {
  if (status === "issued") return "Le billet est déjà émis : le paiement ne peut plus être remis en question ici.";
  if (status === "cancelled") return "Cette réservation est annulée : aucune décision de paiement n'est possible.";
  return null;
}

export const payLink = (siteUrl: string, requestRef: string): string => `${siteUrl.replace(/\/+$/, "")}/paiement?ref=${encodeURIComponent(requestRef)}&type=vol`;

/** Bloc ajouté à l'e-mail de changement de statut : comment payer, et rappel que rien n'est acquis avant confirmation. */
export function paymentHintHtml(status: FlightRequestStatus, siteUrl: string, requestRef: string): string {
  if (status !== "awaiting_payment" && status !== "revalidated") return "";
  return `<div style="margin-top:18px;padding:14px;border:1px solid #fde68a;background:#fffbeb;border-radius:10px"><p style="margin:0 0 8px"><strong>Régler votre réservation</strong></p><p style="margin:0 0 10px;font-size:14px">Virement, dépôt Mobile Money ou paiement en agence : les coordonnées officielles sont sur la page ci-dessous. Indiquez la référence <strong>${escapeHtml(oneLine(requestRef, 60))}</strong> et envoyez la preuve à l’agence. Le paiement n’est pris en compte qu’après confirmation de réception par l’agence.</p><a href="${escapeHtml(payLink(siteUrl, requestRef))}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Comment payer</a></div>`;
}

export function buildPaymentDecisionEmail(input: { requestRef: string; approved: boolean; siteUrl: string; whatsappDisplay: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const body = input.approved
    ? `<p>L’agence a <strong>confirmé la réception de votre paiement</strong> pour la réservation <strong>${escapeHtml(ref)}</strong>. Nous préparons maintenant l’émission de votre billet : vous recevrez un message dès que la référence de réservation (PNR) sera disponible. Ceci n’est pas encore un billet.</p>`
    : `<p>L’agence n’a <strong>pas pu confirmer votre paiement</strong> pour la réservation <strong>${escapeHtml(ref)}</strong> (montant, référence ou preuve à vérifier). Aucun billet n’est émis à ce stade. Contactez l’agence au ${escapeHtml(input.whatsappDisplay)} avec votre preuve de paiement, ou consultez les moyens de paiement : <a href="${escapeHtml(payLink(input.siteUrl, ref))}">Comment payer</a>.</p>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554"><h2 style="margin:0 0 10px;color:${input.approved ? "#047857" : "#b45309"}">${input.approved ? "Paiement confirmé" : "Paiement non confirmé"}</h2><p>Bonjour,</p>${body}<p style="margin-top:18px">Cordialement,<br/><strong>3M Travel &amp; Services</strong></p></div>`;
  return { subject: `[3M Travel] ${input.approved ? "Paiement confirmé" : "Paiement non confirmé"} — ${ref}`, html };
}

/** Alerte au comptoir quand le client déclare un paiement à vérifier (mode + référence de transaction saisis par lui). */
export function buildPaymentDeclaredAlert(input: { requestRef: string; clientEmail: string; method: string | null; transactionId: string; adminUrl: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const row = (label: string, value: string) => `<tr><td style="padding:5px 10px;color:#64748b;font-size:12px">${escapeHtml(label)}</td><td style="padding:5px 10px;font-weight:bold;font-size:14px">${escapeHtml(value)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554"><h2 style="margin:0 0 10px;color:#b45309">Paiement déclaré à vérifier</h2><p style="font-size:13px">Le client indique avoir payé. <strong>Rien n’est validé</strong> : vérifiez la réception (Mobile Money, relevé, comptoir), puis validez ou rejetez le paiement dans l’administration.</p><table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:0 0 14px">${row("Réservation", ref)}${row("Client", oneLine(input.clientEmail))}${row("Mode déclaré", paymentMethodLabel(input.method))}${row("Référence de transaction déclarée", oneLine(input.transactionId, 120))}</table><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ouvrir l’administration</a></div>`;
  return { subject: `[3M Travel] Paiement déclaré à vérifier — ${ref}`, html };
}
