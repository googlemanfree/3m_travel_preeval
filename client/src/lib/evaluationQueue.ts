/**
 * File des bilans à traiter (page « Évaluations » de l'administration) : le dossier soumis en premier est en tête.
 * Même règle que le tri « Ordre de soumission » de la liste des candidats : date de génération du bilan, puis numéro, du plus ancien au plus récent.
 */
export type QueueBilan = { id: number; generatedAt?: string | Date | null; createdAt?: string | Date | null };

const submittedAt = (bilan: QueueBilan): number => {
  const value = bilan.generatedAt ?? bilan.createdAt;
  const time = value ? new Date(value).getTime() : Number.NaN;
  // une date absente ou illisible passe en fin de file plutôt que de fausser l'ordre des autres
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
};

export function sortBySubmission<T extends QueueBilan>(bilans: readonly T[]): T[] {
  return [...bilans].sort((left, right) => {
    const a = submittedAt(left), b = submittedAt(right);
    if (a !== b) return a < b ? -1 : 1;
    return left.id - right.id;
  });
}

export type WaitingLevel = "ok" | "late" | "overdue";

/** Temps écoulé depuis la soumission : au-delà de 24 h le bilan est « en retard », au-delà de 48 h « très en retard ». */
export function waitingTime(bilan: QueueBilan, now: Date = new Date()): { hours: number; label: string; level: WaitingLevel } | null {
  const submitted = submittedAt(bilan);
  if (!Number.isFinite(submitted)) return null;
  const hours = Math.max(0, Math.floor((now.getTime() - submitted) / 3_600_000));
  const label = hours < 1 ? "il y a moins d’1 h" : hours < 48 ? `${hours} h d’attente` : `${Math.floor(hours / 24)} j d’attente`;
  return { hours, label, level: hours >= 48 ? "overdue" : hours >= 24 ? "late" : "ok" };
}
