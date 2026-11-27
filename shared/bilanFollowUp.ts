/**
 * Suivi des bilans envoyés : qui n'a pas encore répondu, qui a refusé et pourquoi, où l'on perd les candidats (entonnoir), et qui peut être relancé.
 * Calculs purs, sans base de données : le routeur charge les lignes, ce module décide. Aucune relance automatique : l'administrateur relance à la main.
 */

export type FollowUpRow = {
  id: number;
  candidateId: number | null;
  fullName: string;
  email: string;
  dossierNumber: string;
  destination: string | null;
  visaType: string | null;
  paymentAmount: number;
  paymentStatus: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  activationRequestedAt: string | null;
  /** Lien du bilan en PDF (absolu) quand il existe. */
  pdfUrl?: string | null;
  /** Dernier e-mail du bilan : « sent », « failed » ou « bounced » ; absent si inconnu. */
  emailStatus?: "sent" | "failed" | "bounced" | "pending" | null;
  /** Le bilan a déjà été envoyé par WhatsApp (PDF). */
  whatsappSentAt?: string | null;
};
export type DecisionLite = { decision: "accepted" | "declined"; reason: string | null; comment?: string | null; at: string };
export type ReminderLite = { at: string; count: number };
export type FollowUpState = "paid" | "opening" | "declined" | "waiting";

export const REMINDER_COOLDOWN_HOURS = 24;
export const MIN_DESTINATION_SAMPLE = 5;
const DAY = 24 * 60 * 60 * 1000;

export function followUpState(row: FollowUpRow, decision: DecisionLite | undefined): FollowUpState {
  if (row.paymentStatus === "SUCCESS") return "paid";
  if (decision?.decision === "accepted" || row.activationRequestedAt) return "opening";
  if (decision?.decision === "declined") return "declined";
  return "waiting";
}

/** Réception du bilan vue par l'administrateur : consulté / pas encore consulté (peut-être dans les courriers indésirables) / échec d'envoi / trop récent pour conclure. */
export type DeliveryState = "viewed" | "unseen" | "failed" | "recent";
/** Au-delà de ce délai sans consultation, le bilan est signalé « non consulté » (probable e-mail dans les indésirables). */
export const UNSEEN_AFTER_HOURS = 24;

export function deliveryState(row: FollowUpRow, now: Date = new Date()): DeliveryState {
  if (row.emailStatus === "failed" || row.emailStatus === "bounced") return "failed";
  if (row.viewedAt) return "viewed";
  if (!row.sentAt) return "recent";
  return now.getTime() - new Date(row.sentAt).getTime() >= UNSEEN_AFTER_HOURS * 60 * 60 * 1000 ? "unseen" : "recent";
}

export type FollowUpItem = {
  id: number;
  candidateId: number | null;
  fullName: string;
  dossierNumber: string;
  destination: string | null;
  visaType: string | null;
  paymentAmount: number;
  state: "waiting" | "declined";
  reason: string | null;
  comment: string | null;
  daysSinceSent: number | null;
  opened: boolean;
  delivery: DeliveryState;
  sentAt: string | null;
  viewedAt: string | null;
  pdfUrl: string | null;
  whatsappSentAt: string | null;
  lastReminderAt: string | null;
  reminderCount: number;
  canRemind: boolean;
};
export type DestinationStat = { destination: string; sent: number; opening: number; paid: number; ratePercent: number | null; lowSample: boolean };
export type FollowUpStats = {
  sent: number;
  viewed: number;
  opening: number;
  paid: number;
  declined: number;
  waiting: number;
  /** Bilans en attente de réponse, envoyés depuis plus de 24 h et jamais consultés. */
  unseen: number;
  /** Bilans dont le dernier e-mail a échoué ou rebondi. */
  failed: number;
  reasons: Array<{ reason: string; count: number }>;
  byDestination: DestinationStat[];
};

export function buildFollowUp(rows: FollowUpRow[], decisions: Record<number, DecisionLite | undefined>, reminders: Record<number, ReminderLite | undefined>, now: Date = new Date()): { stats: FollowUpStats; items: FollowUpItem[] } {
  const stats: FollowUpStats = { sent: rows.length, viewed: 0, opening: 0, paid: 0, declined: 0, waiting: 0, unseen: 0, failed: 0, reasons: [], byDestination: [] };
  const reasonCounts = new Map<string, number>();
  const destinations = new Map<string, DestinationStat>();
  const items: FollowUpItem[] = [];

  for (const row of rows) {
    const decision = decisions[row.id];
    const state = followUpState(row, decision);
    if (row.viewedAt) stats.viewed += 1;
    const key = (row.destination ?? "").trim() || "Non précisée";
    const bucket = destinations.get(key) ?? { destination: key, sent: 0, opening: 0, paid: 0, ratePercent: null, lowSample: true };
    bucket.sent += 1;
    if (state === "paid") { stats.paid += 1; stats.opening += 1; bucket.paid += 1; bucket.opening += 1; }
    else if (state === "opening") { stats.opening += 1; bucket.opening += 1; }
    else if (state === "declined") {
      stats.declined += 1;
      const reason = decision?.reason ?? "autre";
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    } else stats.waiting += 1;
    destinations.set(key, bucket);

    const delivery = deliveryState(row, now);
    if (state === "waiting") {
      if (delivery === "unseen") stats.unseen += 1;
      if (delivery === "failed") stats.failed += 1;
    }
    if (state === "waiting" || state === "declined") {
      const reminder = reminders[row.id];
      const sinceReminder = reminder ? now.getTime() - new Date(reminder.at).getTime() : Infinity;
      items.push({
        id: row.id,
        candidateId: row.candidateId,
        fullName: row.fullName,
        dossierNumber: row.dossierNumber,
        destination: row.destination,
        visaType: row.visaType,
        paymentAmount: row.paymentAmount,
        state,
        reason: state === "declined" ? decision?.reason ?? null : null,
        comment: state === "declined" ? decision?.comment ?? null : null,
        daysSinceSent: row.sentAt ? Math.max(0, Math.floor((now.getTime() - new Date(row.sentAt).getTime()) / DAY)) : null,
        opened: Boolean(row.viewedAt),
        delivery,
        sentAt: row.sentAt,
        viewedAt: row.viewedAt,
        pdfUrl: row.pdfUrl ?? null,
        whatsappSentAt: row.whatsappSentAt ?? null,
        lastReminderAt: reminder?.at ?? null,
        reminderCount: reminder?.count ?? 0,
        canRemind: Boolean(row.candidateId) && sinceReminder >= REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000,
      });
    }
  }

  stats.reasons = Array.from(reasonCounts, ([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  stats.byDestination = Array.from(destinations.values()).map((bucket) => {
    const lowSample = bucket.sent < MIN_DESTINATION_SAMPLE;
    return { ...bucket, lowSample, ratePercent: lowSample ? null : Math.round((bucket.opening / bucket.sent) * 100) };
  }).sort((a, b) => b.sent - a.sent || a.destination.localeCompare(b.destination)).slice(0, 8);
  // Les plus anciens d'abord, les « question » avant les autres refus (réponse rapide attendue).
  const urgency = (item: FollowUpItem) => (item.delivery === "failed" ? 2 : item.delivery === "unseen" ? 1 : 0);
  items.sort((a, b) => Number(b.reason === "question") - Number(a.reason === "question") || urgency(b) - urgency(a) || (b.daysSinceSent ?? 0) - (a.daysSinceSent ?? 0));
  return { stats, items: items.slice(0, 100) };
}

/** Texte de la relance : factuel, sans urgence inventée ni promesse de résultat. */
export function reminderMessage(firstName: string, pdfUrl?: string | null): { title: string; body: string } {
  const name = firstName.trim() || "Bonjour";
  const link = pdfUrl ? ` Vous pouvez aussi télécharger directement votre bilan en PDF : ${pdfUrl}` : "";
  return {
    title: "Votre bilan vous attend dans votre espace client",
    body: `${name === "Bonjour" ? "Bonjour" : `Bonjour ${name}`}, votre bilan d'évaluation est disponible dans votre espace client.${link} Si vous êtes d'accord, cliquez sur « Je valide et j'ouvre mon dossier » pour lancer la suite : réunir et vérifier les pièces demande souvent plusieurs semaines. Une question ? Répondez à ce message ou prenez rendez-vous avec votre conseiller. Ce bilan évalue la préparation de votre dossier et ne garantit aucune décision des autorités.`,
  };
}

/** Deux versements pour les frais d'ouverture : le premier arrondi au-dessus, le second pour le solde, trente jours plus tard. */
export function splitInTwo(total: number, today: Date): Array<{ label: string; amount: number; dueOn: string }> {
  const first = Math.ceil(total / 2);
  const due = (offsetDays: number) => new Date(today.getTime() + offsetDays * DAY).toISOString().slice(0, 10);
  return [
    { label: "Frais d'ouverture — 1er versement", amount: first, dueOn: due(0) },
    { label: "Frais d'ouverture — 2e versement", amount: total - first, dueOn: due(30) },
  ];
}
