import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
import { notifyAdmins } from "../routers/adminNotifications";
import { accountReference } from "../../shared/caseReference";
import { buildCandidateMessageAlert, candidateMessageExcerpt } from "./candidateMessageAlert";

/**
 * Quand un client écrit dans son espace, l'équipe est prévenue deux fois : cloche de l'administration ET e-mail à la boîte de l'équipe.
 * L'e-mail ne contient qu'un court extrait (jamais de pièce jointe) et masque les longues suites de chiffres ou de caractères
 * (numéro de passeport, de carte, IBAN) : une boîte e-mail est moins protégée que l'administration.
 * Une rafale de messages d'un même client ne produit qu'un e-mail par fenêtre ; la cloche, elle, signale chaque message.
 */
export const EMAIL_ALERT_WINDOW_MS = 10 * 60 * 1000;
const lastEmailAt = new Map<number, number>();

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);

/** Masque les valeurs qui ressemblent à un numéro de document, de carte ou de compte. */
export function maskSensitiveRuns(text: string): string {
  return text
    .replace(/\b(?:\d[ -]?){9,}\b/g, "[numéro masqué]")
    .replace(/\b[A-Za-z]{2}\d{2}(?:[ ]?[A-Za-z0-9]{4}){3,7}\b/g, "[compte masqué]")
    .replace(/\b[A-Za-z]{1,2}\d{6,9}\b/g, "[numéro masqué]");
}

export function getCandidateMessageAlertRecipients(env: Record<string, string | undefined> = process.env): string[] {
  const raw = env.CANDIDATE_MESSAGE_ALERT_RECIPIENTS || env.DOCUMENT_ALERT_RECIPIENTS || "hello@3mtravelagency.com";
  return Array.from(new Set(raw.split(",").map((value) => value.trim().toLowerCase()).filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))));
}

export type CandidateMessageEmailInput = { candidateId: number; fullName: string; content: string; hasAttachment: boolean; kind?: "message" | "rendez-vous" | "question" };

export function buildCandidateMessageEmail(input: CandidateMessageEmailInput): { subject: string; html: string } {
  const reference = accountReference(input.candidateId);
  const name = input.fullName.replace(/\s+/g, " ").trim().slice(0, 80) || reference;
  const label = input.kind === "rendez-vous" ? "Demande de rendez-vous" : input.kind === "question" ? "Question sur le bilan" : "Nouveau message";
  const excerpt = maskSensitiveRuns(candidateMessageExcerpt(input.content, input.hasAttachment));
  return {
    subject: `[Message client] ${label} — ${name} (${reference})`,
    html: [
      `<h2>${escapeHtml(label)} d’un client</h2>`,
      `<p><strong>Client :</strong> ${escapeHtml(name)} — ${escapeHtml(reference)}</p>`,
      `<p><strong>Extrait :</strong> ${escapeHtml(excerpt)}</p>`,
      "<p>Répondez depuis l’administration : fiche du candidat, onglet « Échanges » (espace client, e-mail ou WhatsApp). Cet e-mail ne contient ni pièce jointe ni numéro de document.</p>",
    ].join(""),
  };
}

/** Faut-il envoyer l'e-mail maintenant ? (une fenêtre par client pour les messages ordinaires ; rendez-vous et questions partent toujours). */
export function shouldEmailNow(candidateId: number, kind: CandidateMessageEmailInput["kind"], now = Date.now()): boolean {
  if (kind === "rendez-vous" || kind === "question") return true;
  const previous = lastEmailAt.get(candidateId);
  if (previous !== undefined && now - previous < EMAIL_ALERT_WINDOW_MS) return false;
  lastEmailAt.set(candidateId, now);
  return true;
}

/** Cloche + e-mail ; ne fait jamais échouer l'envoi du message du client. */
export async function alertStaffOfCandidateMessage(input: CandidateMessageEmailInput): Promise<void> {
  try {
    await notifyAdmins(buildCandidateMessageAlert(input));
  } catch (error) {
    logger.error("candidate_message.bell_failed", { candidateId: input.candidateId }, error);
  }
  try {
    if (!shouldEmailNow(input.candidateId, input.kind)) return;
    const { subject, html } = buildCandidateMessageEmail(input);
    await Promise.all(getCandidateMessageAlertRecipients().map((to) => sendEmail({ to, subject, html })));
  } catch (error) {
    logger.error("candidate_message.email_failed", { candidateId: input.candidateId }, error);
  }
}

/** Pour les tests. */
export function resetCandidateMessageEmailThrottle(): void {
  lastEmailAt.clear();
}
