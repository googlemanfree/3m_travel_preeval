/** Tri des paiements dans l'écran administrateur (le serveur renvoie du plus récent au plus ancien). */
export type PaymentSortMode = "recent" | "oldest" | "pending_first" | "name" | "amount_desc";

export const PAYMENT_SORT_LABELS: Record<PaymentSortMode, string> = {
  recent: "Plus récents d'abord",
  oldest: "Plus anciens d'abord",
  pending_first: "À traiter d'abord",
  name: "Nom (A → Z)",
  amount_desc: "Montant décroissant",
};

type SortablePayment = { id: number; fullName: string; paymentStatus: string; amount: number; confirmedAmount?: number | null };

const PENDING_RANK: Record<string, number> = { PENDING: 0, FAILED: 1, SUCCESS: 2 };

/** Retourne une copie triée ; à égalité, l'identifiant décroissant (le plus récent) passe devant, donc le tri est stable. */
export function sortPayments<T extends SortablePayment>(payments: T[], mode: PaymentSortMode): T[] {
  const newestFirst = (a: T, b: T) => b.id - a.id;
  const copy = [...payments];
  switch (mode) {
    case "oldest":
      return copy.sort((a, b) => a.id - b.id);
    case "pending_first":
      // Les plus anciens en attente d'abord : ce sont ceux que le client attend depuis le plus longtemps.
      return copy.sort((a, b) => (PENDING_RANK[a.paymentStatus] ?? 3) - (PENDING_RANK[b.paymentStatus] ?? 3) || (a.paymentStatus === "PENDING" ? a.id - b.id : newestFirst(a, b)));
    case "name":
      return copy.sort((a, b) => a.fullName.localeCompare(b.fullName, "fr", { sensitivity: "base" }) || newestFirst(a, b));
    case "amount_desc":
      return copy.sort((a, b) => (b.confirmedAmount ?? b.amount) - (a.confirmedAmount ?? a.amount) || newestFirst(a, b));
    default:
      return copy.sort(newestFirst);
  }
}
