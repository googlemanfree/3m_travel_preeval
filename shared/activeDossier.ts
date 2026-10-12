/**
 * Un compte peut ouvrir plusieurs dossiers, mais un seul est le dossier de traitement actif.
 * Quand le client ouvre / sélectionne un dossier, cette référence devient le dossier traité
 * côté espace client et côté administration (même numéro, même paiement).
 * Ouvrir un second dossier crée une nouvelle référence + un nouveau paiement, et active ce second dossier.
 */

export type DossierRefLike = {
  dossierNumber: string | null | undefined;
  paymentStatus?: string | null;
  createdAt?: Date | string | null;
  source?: "online" | "agency" | string | null;
};

/** Choisit le dossier actif parmi les dossiers du compte (persistance prioritaire). */
export function resolveActiveDossierNumber(input: {
  persistedActiveDossierNumber?: string | null;
  selectedDossierNumber?: string | null;
  dossiers: DossierRefLike[];
}): string | null {
  const available = new Set(
    input.dossiers
      .map((row) => (row.dossierNumber || "").trim())
      .filter(Boolean),
  );
  const selected = (input.selectedDossierNumber || "").trim();
  if (selected && available.has(selected)) return selected;

  const persisted = (input.persistedActiveDossierNumber || "").trim();
  if (persisted && available.has(persisted)) return persisted;

  const paid = input.dossiers.find((row) => {
    const status = String(row.paymentStatus || "").toUpperCase();
    return status === "SUCCESS" || status === "PAID";
  });
  if (paid?.dossierNumber) return paid.dossierNumber.trim();

  const sorted = [...input.dossiers].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  return sorted[0]?.dossierNumber?.trim() || null;
}

export function isSameDossierReference(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
}
