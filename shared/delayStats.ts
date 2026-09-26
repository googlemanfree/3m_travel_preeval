/**
 * Délais réels de traitement, calculés uniquement à partir des dates enregistrées (jamais estimés ni arrondis à la hausse) :
 * tenue de l'échéance des bilans, et durée médiane entre deux changements de statut d'un même dossier.
 * Usage interne : de quoi piloter l'équipe et ne promettre au public que des délais qu'on tient.
 */

export type EvaluationDelayRow = { createdAt: Date; reviewDeadline: Date | null; finalResponseSentAt: Date | null };
export type StatusTransition = { id: string; oldStatus: string | null; newStatus: string | null; at: Date };

export type BilanDelayStats = {
  /** Bilans dont la réponse finale a été envoyée. */
  answered: number;
  medianHours: number | null;
  onTime: number;
  late: number;
  /** Réponses envoyées sans échéance enregistrée : ni à l'heure ni en retard. */
  noDeadline: number;
  /** Bilans sans réponse finale dont l'échéance est dépassée. */
  overduePending: number;
};

export type StageDelay = { from: string; to: string; count: number; medianDays: number };

const HOUR = 3_600_000;
const DAY = 86_400_000;

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function computeBilanDelays(rows: EvaluationDelayRow[], now: Date): BilanDelayStats {
  const answeredRows = rows.filter((row) => row.finalResponseSentAt);
  const durations = answeredRows.map((row) => (row.finalResponseSentAt!.getTime() - row.createdAt.getTime()) / HOUR).filter((hours) => hours >= 0);
  const withDeadline = answeredRows.filter((row) => row.reviewDeadline);
  const onTime = withDeadline.filter((row) => row.finalResponseSentAt!.getTime() <= row.reviewDeadline!.getTime()).length;
  const medianHours = median(durations);
  return {
    answered: answeredRows.length,
    medianHours: medianHours === null ? null : round1(medianHours),
    onTime,
    late: withDeadline.length - onTime,
    noDeadline: answeredRows.length - withDeadline.length,
    overduePending: rows.filter((row) => !row.finalResponseSentAt && row.reviewDeadline && row.reviewDeadline.getTime() < now.getTime()).length,
  };
}

/** Durée médiane (en jours) entre deux changements de statut consécutifs d'un même dossier, par passage « de → vers ». */
export function computeStageDelays(transitions: StatusTransition[]): StageDelay[] {
  const byDossier = new Map<string, StatusTransition[]>();
  for (const transition of transitions) {
    if (!transition.newStatus) continue;
    byDossier.set(transition.id, [...(byDossier.get(transition.id) ?? []), transition]);
  }
  const perStage = new Map<string, { from: string; to: string; days: number[] }>();
  for (const list of Array.from(byDossier.values())) {
    const ordered = [...list].sort((a, b) => a.at.getTime() - b.at.getTime());
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      const days = (current.at.getTime() - previous.at.getTime()) / DAY;
      if (days < 0) continue;
      const from = previous.newStatus ?? "";
      const to = current.newStatus ?? "";
      if (!from || !to || from === to) continue;
      const key = `${from}→${to}`;
      const entry = perStage.get(key) ?? { from, to, days: [] };
      entry.days.push(days);
      perStage.set(key, entry);
    }
  }
  return Array.from(perStage.values())
    .map((entry) => ({ from: entry.from, to: entry.to, count: entry.days.length, medianDays: round1(median(entry.days) ?? 0) }))
    .sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));
}

/** Sous ce nombre de cas, une médiane n'est qu'un ordre de grandeur : l'affichage le dit. */
export const MIN_RELIABLE_SAMPLE = 5;

/** Libellés des cinq étapes de pilotage (les codes enregistrés dans le journal des changements de statut). */
export const STAGE_LABELS: Record<string, string> = { PENDING_48H: "Évaluation", PUBLISHED: "Bilan disponible", DOCUMENTS_CHECK: "Collecte des documents", SUBMITTED: "Soumission", APPROVED: "Visa accordé" };
export const stageLabel = (code: string): string => STAGE_LABELS[code] ?? code;

/** Durée lisible : « 6,5 h » sous 48 h, sinon en jours. */
export const formatHours = (hours: number): string => (hours < 48 ? `${String(hours).replace(".", ",")} h` : `${String(Math.round((hours / 24) * 10) / 10).replace(".", ",")} j`);
