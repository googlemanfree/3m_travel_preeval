/** Le bilan de ce candidat a-t-il déjà été envoyé ? Mêmes indices que le reste de la fiche (statut d'envoi, étape interne « bilan envoyé »). */
export function isBilanSent(candidate: unknown, data: unknown): boolean {
  const pick = (source: unknown, key: string) => String((source as Record<string, unknown> | null | undefined)?.[key] ?? "").toLowerCase();
  const nested = (data as { candidate?: unknown } | null | undefined)?.candidate;
  return pick(nested, "evaluationDeliveryStatus") === "sent"
    || pick(candidate, "evaluationDeliveryStatus") === "sent"
    || pick(candidate, "internalStatus") === "bilan_envoye";
}
