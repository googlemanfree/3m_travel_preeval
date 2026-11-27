/**
 * Relance automatique après l’envoi d’un bilan d’évaluation.
 * Calculs purs (sans base de données) : le service charge les dossiers, ce module décide
 * qui doit être relancé, à quelle étape, et avec quel message.
 *
 * Cadence : J+2, J+5 puis J+10 après l’envoi du bilan, 3 relances au maximum. On s’arrête dès que le
 * candidat a répondu (ouverture demandée, paiement, refus) ou n’a pas de compte. Au-delà de
 * MAX_AGE_DAYS, plus aucune relance automatique : un conseiller reprend la main.
 */

import type { DecisionLite, ReminderLite } from "./bilanFollowUp";
import { toE164WhatsApp } from "./whatsappPhone";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Jours après l’envoi du bilan pour les relances 1, 2 et 3. */
export const AUTO_RELANCE_DAYS = [2, 5, 10] as const;
export const AUTO_RELANCE_MAX = AUTO_RELANCE_DAYS.length;
/** Écart minimal entre deux relances, automatiques ou manuelles. */
export const AUTO_RELANCE_MIN_GAP_HOURS = 48;
/** Âge maximal du bilan pour une relance automatique. */
export const AUTO_RELANCE_MAX_AGE_DAYS = 30;
/** Heures d’envoi autorisées (UTC) : 07 h–18 h à Yaoundé (UTC+1). */
export const AUTO_RELANCE_SEND_HOURS_UTC = { from: 7, to: 18 } as const;

export type AutoRelanceRow = {
  candidateId: number | null;
  sentAt: string | null;
  viewedAt: string | null;
  paymentStatus: string | null;
  activationRequestedAt: string | null;
};

export type AutoRelancePlan =
  | { due: true; step: 1 | 2 | 3; viewed: boolean }
  | { due: false; reason: "no_account" | "not_sent" | "answered" | "too_old" | "max_reached" | "too_early" | "cooldown" };

export function planAutoRelance(
  row: AutoRelanceRow,
  decision: DecisionLite | undefined,
  reminder: ReminderLite | undefined,
  now: Date = new Date(),
): AutoRelancePlan {
  if (!row.candidateId) return { due: false, reason: "no_account" };
  if (!row.sentAt) return { due: false, reason: "not_sent" };
  if (row.paymentStatus === "SUCCESS" || row.activationRequestedAt || decision) return { due: false, reason: "answered" };
  const age = now.getTime() - new Date(row.sentAt).getTime();
  if (age > AUTO_RELANCE_MAX_AGE_DAYS * DAY) return { due: false, reason: "too_old" };
  const done = reminder?.count ?? 0;
  if (done >= AUTO_RELANCE_MAX) return { due: false, reason: "max_reached" };
  if (age < AUTO_RELANCE_DAYS[done] * DAY) return { due: false, reason: "too_early" };
  if (reminder?.at && now.getTime() - new Date(reminder.at).getTime() < AUTO_RELANCE_MIN_GAP_HOURS * HOUR) {
    return { due: false, reason: "cooldown" };
  }
  return { due: true, step: (done + 1) as 1 | 2 | 3, viewed: Boolean(row.viewedAt) };
}

/** Les envois automatiques ne partent que pendant les heures de bureau (UTC+1). */
export function isWithinSendWindow(now: Date = new Date()): boolean {
  const hour = now.getUTCHours();
  return hour >= AUTO_RELANCE_SEND_HOURS_UTC.from && hour < AUTO_RELANCE_SEND_HOURS_UTC.to;
}

export type RelanceMessage = { title: string; body: string; whatsapp: string };

const DISCLAIMER = "Ce bilan évalue la préparation de votre dossier et ne garantit aucune décision des autorités.";

/** Textes des trois relances ; le ton reste factuel, sans pression ni promesse de résultat. */
function buildAutoRelanceMessageBase(input: {
  step: 1 | 2 | 3;
  viewed: boolean;
  firstName: string;
  dossierNumber: string;
  spaceUrl: string;
  /** Lien de téléchargement du bilan en PDF : ajouté quand le candidat n'a pas encore consulté son bilan (e-mail peut-être dans les indésirables). */
  pdfUrl?: string | null;
}): RelanceMessage {
  const hello = input.firstName.trim() ? `Bonjour ${input.firstName.trim()}` : "Bonjour";
  const ref = input.dossierNumber ? ` (dossier ${input.dossierNumber})` : "";
  if (input.step === 1) {
    const title = input.viewed ? "Avez-vous des questions sur votre bilan ?" : "Votre bilan vous attend dans votre espace client";
    const lead = input.viewed
      ? `${hello}, vous avez consulté votre bilan d’évaluation${ref}. Si un point n’est pas clair, répondez à ce message : un conseiller vous explique chaque recommandation.`
      : `${hello}, votre bilan d’évaluation${ref} est disponible dans votre espace client.`;
    const body = `${lead} Si vous êtes d’accord, cliquez sur « Je valide et j’ouvre mon dossier » pour lancer la suite : réunir et vérifier les pièces demande souvent plusieurs semaines. ${DISCLAIMER}`;
    return { title, body, whatsapp: `${lead}\n\nVotre espace : ${input.spaceUrl}\n\n3M TRAVEL AGENCY` };
  }
  if (input.step === 2) {
    const title = "Votre bilan est toujours disponible";
    const body = `${hello}, nous revenons vers vous au sujet de votre bilan d’évaluation${ref}. Les délais d’un dossier dépendent surtout du temps nécessaire pour réunir les pièces : commencer tôt vous laisse de la marge. Vous pouvez poser vos questions à votre conseiller par WhatsApp ou depuis votre espace client. ${DISCLAIMER}`;
    return {
      title,
      body,
      whatsapp: `${hello}, nous revenons vers vous au sujet de votre bilan d’évaluation${ref}. Une question, une hésitation, un point à clarifier ? Répondez ici, un conseiller vous répond.\n\nVotre espace : ${input.spaceUrl}\n\n3M TRAVEL AGENCY`,
    };
  }
  const title = "Souhaitez-vous poursuivre votre projet ?";
  const body = `${hello}, c’est notre dernier message automatique au sujet de votre bilan d’évaluation${ref}. Si votre projet a changé ou si le tarif ou le calendrier vous pose question, dites-le-nous : un conseiller peut en discuter avec vous, y compris des options de paiement. Sans réponse de votre part, nous ne vous relancerons plus. ${DISCLAIMER}`;
  return {
    title,
    body,
    whatsapp: `${hello}, c’est notre dernier message automatique concernant votre bilan${ref}. Votre projet a changé, ou un point vous bloque (tarif, calendrier) ? Répondez ici : un conseiller en discute avec vous. Sans réponse, nous ne vous relancerons plus.\n\n3M TRAVEL AGENCY`,
  };
}

export function buildAutoRelanceMessage(input: Parameters<typeof buildAutoRelanceMessageBase>[0]): RelanceMessage {
  const message = buildAutoRelanceMessageBase(input);
  if (!input.pdfUrl) return message;
  return {
    title: message.title,
    body: message.body.replace(` ${DISCLAIMER}`, ` Téléchargez votre bilan en PDF : ${input.pdfUrl} ${DISCLAIMER}`),
    whatsapp: `${message.whatsapp}\n\nVotre bilan en PDF : ${input.pdfUrl}`,
  };
}

/** Message d’accompagnement du PDF du bilan envoyé par WhatsApp. */
export function buildBilanPdfWhatsAppMessage(input: {
  firstName: string;
  dossierNumber: string;
  pdfUrl: string;
  spaceUrl: string;
}): string {
  const hello = input.firstName.trim() ? `Bonjour ${input.firstName.trim()}` : "Bonjour";
  const ref = input.dossierNumber ? ` (dossier ${input.dossierNumber})` : "";
  return [
    `${hello}, voici votre bilan d’évaluation 3M TRAVEL AGENCY${ref} en PDF.`,
    "",
    `Si le document ne s’ouvre pas, téléchargez-le ici : ${input.pdfUrl}`,
    `Il est aussi dans votre espace client : ${input.spaceUrl}`,
    "",
    "Une question ? Répondez à ce message, un conseiller vous répond.",
    DISCLAIMER,
  ].join("\n");
}

/** Lien WhatsApp prérempli (repli quand l’envoi automatique n’est pas configuré) : le texte seul, sans pièce jointe. */
export function buildWhatsAppManualLink(phone: string | null | undefined, message: string): string | null {
  const e164 = toE164WhatsApp(phone);
  if (!e164) return null;
  return `https://wa.me/${e164.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
