const CANONICAL_SITE_ORIGIN = "https://www.3mtravelagency.com";

/**
 * Produit un lien e-mail sûr : l’utilisateur doit se connecter avant d’ouvrir
 * son espace, puis revient vers le dossier demandé. Aucun numéro de dossier
 * ne donne accès aux données sans authentification.
 */
export function buildCandidateSpaceAccessUrl(dossierNumber?: string | null): string {
  const target = dossierNumber
    ? `/mon-espace?dossier=${encodeURIComponent(dossierNumber)}`
    : "/mon-espace";

  return `${CANONICAL_SITE_ORIGIN}/login?redirect=1&from=${encodeURIComponent(target)}`;
}

export function buildEvaluationReportUrl(dossierNumber: string): string {
  return `${CANONICAL_SITE_ORIGIN}/api/dossier/${encodeURIComponent(dossierNumber)}/report`;
}
