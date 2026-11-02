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
  reasons: Array<{ reason: string; count: number }>;
  byDestination: DestinationStat[];
};

export function buildFollowUp(rows: FollowUpRow[], decisions: Record<number, DecisionLite | undefined>, reminders: Record<number, ReminderLite | undefined>, now: Date = new Date()): { stats: FollowUpStats; items: FollowUpItem[] } {
  const stats: FollowUpStats = { sent: rows.length, viewed: 0, opening: 0, paid: 0, declined: 0, waiting: 0, reasons: [], byDestination: [] };
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
  items.sort((a, b) => Number(b.reason === "question") - Number(a.reason === "question") || (b.daysSinceSent ?? 0) - (a.daysSinceSent ?? 0));
  return { stats, items: items.slice(0, 100) };
}

/** Texte de la relance : factuel, sans urgence inventée ni promesse de résultat. */
export function reminderMessage(firstName: string): { title: string; body: string } {
  const name = firstName.trim() || "Bonjour";
  return {
    title: "Votre bilan vous attend dans votre espace client",
    body: `${name === "Bonjour" ? "Bonjour" : `Bonjour ${name}`}, votre bilan d'évaluation est disponible dans votre espace client. Si vous êtes d'accord, cliquez sur « Je valide et j'ouvre mon dossier » pour lancer la suite : réunir et vérifier les pièces demande souvent plusieurs semaines. Une question ? Répondez à ce message ou prenez rendez-vous avec votre conseiller. Ce bilan évalue la préparation de votre dossier et ne garantit aucune décision des autorités.`,
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
