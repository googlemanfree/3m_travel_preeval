/** Statuts d'une réservation de vol tels que le client les lit (mêmes libellés que l'e-mail de changement de statut). */
export type FlightRequestStatus = "pending_review" | "assigned" | "needs_info" | "revalidated" | "awaiting_payment" | "issued" | "cancelled";

export const FLIGHT_STATUS_LABELS: Record<FlightRequestStatus, string> = {
  pending_review: "En cours de vérification",
  assigned: "Prise en charge par un conseiller",
  needs_info: "Informations complémentaires requises",
  revalidated: "Réservation revalidée",
  awaiting_payment: "En attente de paiement",
  issued: "Document de voyage disponible",
  cancelled: "Réservation annulée",
};

export const flightStatusLabel = (status: string | null | undefined): string => FLIGHT_STATUS_LABELS[status as FlightRequestStatus] ?? "Suivi en cours";

/** Un paiement est attendu du client quand le conseiller a revalidé le tarif ou attend le règlement. */
export const flightPaymentExpected = (status: string | null | undefined): boolean => status === "revalidated" || status === "awaiting_payment";

/** Tons d'affichage (classes Tailwind) : action attendue, terminé, annulé, en cours. */
export function flightStatusTone(status: string | null | undefined): string {
  if (flightPaymentExpected(status) || status === "needs_info") return "bg-amber-100 text-amber-900";
  if (status === "issued") return "bg-emerald-100 text-emerald-800";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  return "bg-blue-100 text-blue-800";
}
