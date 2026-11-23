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
