/**
 * Accompagnement à distance : rendez-vous en ligne, réponses types, relances de messages sans réponse, charge de travail,
 * passation de dossier, accusés de réception. Module pur, partagé par le serveur, l'administration et l'espace candidat.
 */

export const SLOT_CHANNELS = ["video", "whatsapp", "phone"] as const;
export type SlotChannel = (typeof SLOT_CHANNELS)[number];
export const SLOT_CHANNEL_LABELS: Record<SlotChannel, string> = { video: "Visioconférence", whatsapp: "Appel WhatsApp", phone: "Appel téléphonique" };

export const SLOT_STATUSES = ["open", "booked", "done", "cancelled", "no_show"] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];
export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = { open: "Libre", booked: "Réservé", done: "Terminé", cancelled: "Annulé", no_show: "Absent" };

/** Un créneau ne se réserve ni ne s'annule à moins de ce délai de son début. */
export const BOOKING_NOTICE_HOURS = 2;
export const MAX_ACTIVE_BOOKINGS = 2;
export const MAX_SLOTS_PER_BATCH = 40;
/** Rappel envoyé quand le rendez-vous commence dans moins de ce délai. */
export const REMINDER_WINDOW_HOURS = 26;

/** Messages sans réponse : à relancer à partir de WAITING_LATE_DAYS, urgents à partir de WAITING_URGENT_DAYS. */
export const WAITING_LATE_DAYS = 2;
export const WAITING_URGENT_DAYS = 5;
/** Un dossier sans activité depuis ce délai est « bloqué ». */
export const BLOCKED_AFTER_DAYS = 7;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function canBookSlot(slot: { status: string; startsAt: Date | string }, now: Date = new Date()): boolean {
  return slot.status === "open" && new Date(slot.startsAt).getTime() - now.getTime() >= BOOKING_NOTICE_HOURS * HOUR;
}

export function canCancelBooking(slot: { status: string; startsAt: Date | string }, now: Date = new Date()): boolean {
  return slot.status === "booked" && new Date(slot.startsAt).getTime() - now.getTime() >= BOOKING_NOTICE_HOURS * HOUR;
}

export function needsReminder(slot: { status: string; startsAt: Date | string; reminderSentAt?: Date | string | null }, now: Date = new Date()): boolean {
  const delta = new Date(slot.startsAt).getTime() - now.getTime();
  return slot.status === "booked" && !slot.reminderSentAt && delta > 0 && delta <= REMINDER_WINDOW_HOURS * HOUR;
}

/** Hôtes de visioconférence acceptés : un lien d'un autre site n'est jamais envoyé à un candidat. */
const JOIN_HOSTS = ["meet.google.com", "zoom.us", "teams.microsoft.com", "teams.live.com", "whereby.com", "meet.jit.si", "webex.com", "wa.me", "chat.whatsapp.com", "whatsapp.com"];

export function normalizeJoinUrl(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const value = String(raw ?? "").trim();
  if (!value) return { ok: false, error: "Indiquez le lien de la réunion." };
  if (value.length > 500) return { ok: false, error: "Lien trop long." };
  let parsed: URL;
  try { parsed = new URL(value); } catch { return { ok: false, error: "Lien invalide : collez l'adresse complète (https://…)." }; }
  if (parsed.protocol !== "https:") return { ok: false, error: "Le lien doit commencer par https://." };
  if (parsed.username || parsed.password) return { ok: false, error: "Le lien ne doit contenir ni identifiant ni mot de passe." };
  const host = parsed.hostname.toLowerCase();
  if (!JOIN_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    return { ok: false, error: "Lien non accepté : utilisez Google Meet, Zoom, Teams, WhatsApp, Whereby, Jitsi ou Webex." };
  }
  return { ok: true, url: parsed.toString() };
}

export const firstName = (fullName: string): string => {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const word = parts.find((part) => part !== part.toUpperCase() || part.length <= 2) ?? parts[parts.length - 1] ?? "";
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "";
};

export type ReplyTemplate = { id: string; label: string; body: string };

/** Réponses types : aucune ne promet un résultat ni ne cite un montant (le montant est confirmé par écrit, dossier par dossier). */
export const REPLY_TEMPLATES: ReadonlyArray<ReplyTemplate> = [
  { id: "received", label: "Message bien reçu", body: "Bonjour {prenom}, nous avons bien reçu votre message. Votre conseiller l'examine et vous répond dans les meilleurs délais." },
  { id: "documents", label: "Pièces à compléter", body: "Bonjour {prenom}, pour avancer sur votre dossier, il nous manque encore quelques pièces. Vous pouvez les envoyer directement depuis votre espace client, rubrique Documents, avec une photo nette prise à plat." },
  { id: "unclear_photo", label: "Photo à reprendre", body: "Bonjour {prenom}, la pièce envoyée n'est pas assez lisible. Pouvez-vous la reprendre à plat, avec une bonne lumière, sans reflet et sans bords coupés, puis la renvoyer depuis votre espace client ?" },
  { id: "payment_proof", label: "Preuve de paiement à envoyer", body: "Bonjour {prenom}, pour ouvrir votre dossier, nous avons besoin de la preuve de votre paiement (photo ou vidéo de la facture ou de la confirmation). Vous pouvez l'envoyer depuis votre espace client." },
  { id: "appointment", label: "Proposer un rendez-vous en ligne", body: "Bonjour {prenom}, pour faire le point ensemble, vous pouvez réserver un rendez-vous en ligne depuis votre espace client, rubrique Accompagnement à distance. Choisissez le créneau qui vous convient." },
  { id: "clarify", label: "Demande de précision", body: "Bonjour {prenom}, pour traiter votre demande, pouvez-vous préciser votre situation (pays visé, type de projet, date souhaitée) ? Votre réponse nous permettra de vous orienter correctement." },
  { id: "follow_up", label: "Relance courtoise", body: "Bonjour {prenom}, nous revenons vers vous au sujet de votre dossier. Pouvez-vous nous dire où vous en êtes et si vous rencontrez une difficulté ? Nous sommes là pour vous aider." },
  { id: "thanks", label: "Remerciement et suite", body: "Bonjour {prenom}, merci pour votre retour. Nous le prenons en compte et revenons vers vous dès la prochaine étape." },
];

export type ReplyLanguage = "fr" | "en";

/** Mêmes réponses types en anglais, mêmes identifiants : la langue se choisit selon la préférence du candidat. */
export const REPLY_TEMPLATES_EN: ReadonlyArray<ReplyTemplate> = [
  { id: "received", label: "Message received", body: "Hello {prenom}, we have received your message. Your advisor is reviewing it and will reply as soon as possible." },
  { id: "documents", label: "Documents to complete", body: "Hello {prenom}, to move your file forward we still need a few documents. You can upload them directly from your client area, under Documents, with a clear photo taken flat." },
  { id: "unclear_photo", label: "Photo to retake", body: "Hello {prenom}, the document you sent is not readable enough. Could you retake it flat, in good light, without glare or cropped edges, and upload it again from your client area?" },
  { id: "payment_proof", label: "Payment proof needed", body: "Hello {prenom}, to open your file we need the proof of your payment (a photo or video of the receipt or confirmation). You can upload it from your client area." },
  { id: "appointment", label: "Offer an online appointment", body: "Hello {prenom}, to review your file together you can book an online appointment from your client area, under Remote support. Pick the slot that suits you." },
  { id: "clarify", label: "Request for details", body: "Hello {prenom}, to handle your request could you tell us more about your situation (target country, type of project, preferred date)? Your answer will help us guide you properly." },
  { id: "follow_up", label: "Polite follow-up", body: "Hello {prenom}, we are following up on your file. Could you tell us where you stand and whether you are facing any difficulty? We are here to help." },
  { id: "thanks", label: "Thanks and next step", body: "Hello {prenom}, thank you for your reply. We have noted it and will get back to you with the next step." },
];

export const replyTemplatesFor = (language: ReplyLanguage | null | undefined): ReadonlyArray<ReplyTemplate> => (language === "en" ? REPLY_TEMPLATES_EN : REPLY_TEMPLATES);

export function fillTemplate(body: string, fullName: string): string {
  const name = firstName(fullName);
  return body.replace(/\{prenom\}/g, name || "").replace(/(Bonjour|Hello) ,/, "$1,").replace(/\s{2,}/g, " ").trim();
}

export type WaitingLevel = "normal" | "late" | "urgent";

export function waitingDays(lastCandidateMessageAt: Date | string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(lastCandidateMessageAt).getTime()) / DAY));
}

export function waitingLevel(days: number): WaitingLevel {
  return days >= WAITING_URGENT_DAYS ? "urgent" : days >= WAITING_LATE_DAYS ? "late" : "normal";
}

export const WAITING_LEVEL_LABELS: Record<WaitingLevel, string> = { normal: "Récent", late: "À relancer", urgent: "Urgent" };

/** Lien WhatsApp prêt à envoyer ; null si le numéro n'est pas exploitable. */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const digits = String(phone ?? "").replace(/[^\d]/g, "").replace(/^00/, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const PROBLEM_TOPICS = [
  { id: "document", label: "Je n'arrive pas à envoyer un document" },
  { id: "step", label: "Je ne comprends pas une étape" },
  { id: "payment", label: "J'ai une question sur le paiement" },
  { id: "appointment", label: "Je veux un rendez-vous" },
  { id: "other", label: "Autre difficulté" },
] as const;
export type ProblemTopic = (typeof PROBLEM_TOPICS)[number]["id"];
export const PROBLEM_PREFIX = "Besoin d'aide";
export const MAX_PROBLEMS_PER_HOUR = 3;

export const NEXT_ACTION_PRESETS = [
  "Relancer le candidat pour les pièces manquantes",
  "Vérifier la preuve de paiement",
  "Relire les documents déposés",
  "Planifier un rendez-vous en ligne",
  "Préparer la soumission du dossier",
  "Répondre au dernier message du candidat",
] as const;

export type AckTemplate = { id: string; title: string; body: string };

/** Textes d'accusé de réception : aucun montant (confirmé par écrit, dossier par dossier) ni promesse de résultat. */
export const ACK_TEMPLATES: ReadonlyArray<AckTemplate> = [
  { id: "documents", title: "Accusé de réception de mes documents", body: "Je confirme avoir remis à 3M Travel Agency les documents nécessaires à l'ouverture et au traitement de mon dossier, et que les informations transmises sont exactes." },
  { id: "terms", title: "Acceptation des conditions de la prestation", body: "Je confirme avoir lu et accepté les conditions de la prestation d'accompagnement communiquées par 3M Travel Agency. Je comprends que cet accompagnement ne garantit ni entretien, ni recrutement, ni autorisation de travail, ni visa." },
  { id: "bilan", title: "Accusé de réception de mon bilan d'évaluation", body: "Je confirme avoir reçu et lu mon bilan d'évaluation. Je comprends qu'il repose sur les informations que j'ai déclarées et qu'il ne constitue ni une décision d'éligibilité ni une garantie de résultat." },
  { id: "fees", title: "Confirmation du montant des frais d'ouverture", body: "Je confirme avoir pris connaissance, par écrit, du montant des frais d'ouverture, de collecte, de traitement, de traduction et de soumission de mon dossier, et de leur caractère non remboursable, avant tout règlement." },
];

const fold = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Le nom saisi doit être celui du compte (accents, casse et ordre des mots ignorés) : c'est la signature simple du candidat. */
export function typedNameMatches(typed: string, fullName: string): boolean {
  const left = fold(typed).split(" ").filter(Boolean).sort().join(" ");
  const right = fold(fullName).split(" ").filter(Boolean).sort().join(" ");
  return left.length >= 3 && left === right;
}

export type HandoverInput = {
  generatedOn: Date;
  candidate: { fullName: string; email: string; phone?: string | null; nationality?: string | null; destination?: string | null; visaType?: string | null; dossierStatus?: string | null; activeDossierNumber?: string | null };
  payment: { ok: boolean; source: string | null };
  requests: Array<{ label: string; destination?: string | null; status: string; lastActivityAt: Date | string; assignedTo?: string | null }>;
  lastMessages: Array<{ from: "candidat" | "conseiller"; at: Date | string; text: string }>;
  pendingClarifications: number;
  nextActions: Array<{ action: string; owner?: string | null; dueOn?: string | null }>;
  upcomingSlots: Array<{ startsAt: Date | string; channel: SlotChannel; topic?: string | null }>;
  pendingAcknowledgements: string[];
};

const PAYMENT_SOURCE_LABELS: Record<string, string> = { proof_file: "preuve jointe enregistrée", online_validated: "paiement en ligne validé", agency_confirmed: "paiement agence confirmé au journal" };
const frDate = (value: Date | string) => new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const frDateTime = (value: Date | string) => new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const shorten = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value);

/** Note de passation : tout ce qu'un collègue doit savoir pour reprendre un dossier. Aucun numéro de document ni donnée bancaire. */
export function buildHandoverSummary(input: HandoverInput): string {
  const { candidate } = input;
  const lines: string[] = [];
  lines.push(`PASSATION DE DOSSIER — ${candidate.fullName}`);
  lines.push(`Établie le ${frDate(input.generatedOn)}`);
  lines.push("");
  lines.push("IDENTITÉ ET PROJET");
  lines.push(`- Contact : ${candidate.email}${candidate.phone ? ` · ${candidate.phone}` : ""}`);
  if (candidate.nationality) lines.push(`- Nationalité : ${candidate.nationality}`);
  const project = [candidate.destination, candidate.visaType].filter(Boolean).join(" · ");
  lines.push(`- Projet : ${project || "non précisé"}`);
  lines.push(`- Dossier : ${candidate.activeDossierNumber ? `actif (${candidate.activeDossierNumber})` : candidate.dossierStatus && candidate.dossierStatus !== "nouveau" ? `actif (${candidate.dossierStatus})` : "pré-compte, pas encore activé"}`);
  lines.push(`- Paiement des frais d'ouverture : ${input.payment.ok ? PAYMENT_SOURCE_LABELS[input.payment.source ?? ""] ?? "preuve enregistrée" : "AUCUNE PREUVE enregistrée"}`);
  if (input.requests.length) {
    lines.push("");
    lines.push("DEMANDES EN COURS");
    for (const request of input.requests.slice(0, 8)) {
      lines.push(`- ${request.label}${request.destination ? ` (${request.destination})` : ""} — ${request.status}, dernière activité le ${frDate(request.lastActivityAt)}${request.assignedTo ? ` — suivi par ${request.assignedTo}` : ""}`);
    }
  }
  lines.push("");
  lines.push("À FAIRE");
  if (input.nextActions.length) for (const action of input.nextActions.slice(0, 6)) lines.push(`- ${action.action}${action.owner ? ` (${action.owner})` : ""}${action.dueOn ? ` — avant le ${frDate(action.dueOn)}` : ""}`);
  else lines.push("- Aucune action planifiée : définir la prochaine action.");
  if (input.pendingClarifications > 0) lines.push(`- ${input.pendingClarifications} demande(s) de précision sur des pièces en attente de réponse.`);
  if (input.pendingAcknowledgements.length) lines.push(`- Accusé(s) de réception en attente du candidat : ${input.pendingAcknowledgements.join(" ; ")}.`);
  if (input.upcomingSlots.length) {
    lines.push("");
    lines.push("RENDEZ-VOUS À VENIR");
    for (const slot of input.upcomingSlots.slice(0, 4)) lines.push(`- ${frDateTime(slot.startsAt)} — ${SLOT_CHANNEL_LABELS[slot.channel]}${slot.topic ? ` — ${slot.topic}` : ""}`);
  }
  if (input.lastMessages.length) {
    lines.push("");
    lines.push("DERNIERS ÉCHANGES");
    for (const message of input.lastMessages.slice(0, 5)) lines.push(`- ${frDate(message.at)} · ${message.from} : ${shorten(message.text.replace(/\s+/g, " ").trim(), 160)}`);
  }
  return lines.join("\n");
}
