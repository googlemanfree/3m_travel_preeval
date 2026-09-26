/**
 * Revérification du tarif d'une réservation de vol avant l'encaissement. Le tarif du fournisseur (Google Flights via SearchAPI.io)
 * évolue : on compare le tarif affiché au client avec un relevé récent, et on ne demande jamais un paiement sur un tarif ancien
 * sans contrôle (ou sans dérogation motivée). Seuil interne à l'agence, pas une durée de validité garantie par le fournisseur.
 */

export const FARE_CHECK_MAX_AGE_HOURS = 12;

export type FareComparison =
  | { kind: "same"; oldTotal: number; newTotal: number; delta: 0 }
  | { kind: "lower" | "higher"; oldTotal: number; newTotal: number; delta: number; percent: number }
  | { kind: "not_found"; oldTotal: number }
  | { kind: "unavailable"; oldTotal: number };

export function compareFares(oldTotal: number, newTotal: number | null | undefined, providerAnswered = true): FareComparison {
  if (!providerAnswered) return { kind: "unavailable", oldTotal };
  if (typeof newTotal !== "number" || !Number.isFinite(newTotal) || newTotal <= 0) return { kind: "not_found", oldTotal };
  const delta = newTotal - oldTotal;
  if (Math.abs(delta) < 1) return { kind: "same", oldTotal, newTotal, delta: 0 };
  return { kind: delta > 0 ? "higher" : "lower", oldTotal, newTotal, delta, percent: oldTotal > 0 ? Math.round((Math.abs(delta) / oldTotal) * 1000) / 10 : 0 };
}

const formatXaf = (amount: number): string => `${new Intl.NumberFormat("fr-FR").format(Math.round(amount)).replace(/[  ]/g, " ")} FCFA`;

/** Phrase pour le conseiller (et, une fois relue, pour le client). Jamais de tarif présenté comme garanti. */
export function describeFareComparison(comparison: FareComparison): string {
  switch (comparison.kind) {
    case "same": return `Tarif inchangé : ${formatXaf(comparison.newTotal)} au relevé de contrôle.`;
    case "lower": return `Tarif en baisse : ${formatXaf(comparison.newTotal)} au lieu de ${formatXaf(comparison.oldTotal)} (−${comparison.percent} %).`;
    case "higher": return `Tarif en hausse : ${formatXaf(comparison.newTotal)} au lieu de ${formatXaf(comparison.oldTotal)} (+${comparison.percent} %). À annoncer au client avant tout paiement.`;
    case "not_found": return "Ce vol n’apparaît plus dans les résultats du fournisseur : plus de place ou horaire modifié. Ne demandez pas de paiement avant vérification.";
    case "unavailable": return "Le fournisseur n’a pas répondu : contrôle impossible pour le moment. Réessayez, ou vérifiez auprès de la compagnie.";
  }
}

/** Ancienneté (en heures) d'un relevé ; null si la date est absente ou invalide. */
export function fareAgeHours(referenceAt: Date | string | null | undefined, now: Date): number | null {
  if (!referenceAt) return null;
  const at = referenceAt instanceof Date ? referenceAt : new Date(referenceAt);
  return Number.isNaN(at.getTime()) ? null : Math.max(0, (now.getTime() - at.getTime()) / 3_600_000);
}

/**
 * Peut-on passer la demande en « tarif revalidé / en attente de paiement » ? Il faut un relevé récent (création de la demande ou
 * dernier contrôle), sauf dérogation motivée. Renvoie le motif du refus, ou null.
 */
export function refuseWithoutFreshFare(input: { referenceAt: Date | string | null | undefined; now: Date; waiverReason?: string | null; lastCheck?: FareComparison["kind"] | null }): string | null {
  const bad = input.lastCheck === "not_found" || input.lastCheck === "higher";
  const age = fareAgeHours(input.referenceAt, input.now);
  const stale = age === null || age > FARE_CHECK_MAX_AGE_HOURS;
  if (!stale && !bad) return null;
  if ((input.waiverReason ?? "").trim().length >= 8) return null;
  if (bad && !stale) return input.lastCheck === "not_found" ? "Le dernier contrôle indique que le vol n’apparaît plus chez le fournisseur : revérifiez le tarif, ou indiquez une dérogation motivée." : "Le dernier contrôle indique une hausse de tarif : prévenez le client (champ « information de l’agence ») en motivant la dérogation avant de demander le paiement.";
  return `Le dernier relevé du tarif date de plus de ${FARE_CHECK_MAX_AGE_HOURS} h${age === null ? " (date inconnue)" : ""} : lancez « Revérifier le tarif », ou indiquez une dérogation motivée.`;
}
