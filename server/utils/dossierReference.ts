/**
 * Normalise uniquement la présentation des références de dossier. Les droits
 * restent toujours vérifiés côté serveur avec l’e-mail ou la session active.
 */
export function normalizeDossierReference(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/[_\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const compact = cleaned.replace(/-/g, "");

  const agencyMatch = /^3MAGN?(\d+)$/.exec(compact);
  if (agencyMatch) {
    return `3M-AGN-${Number(agencyMatch[1]).toString().padStart(4, "0")}`;
  }

  const standardMatch = /^3M(\d{4})(\d{1,4})$/.exec(compact);
  if (standardMatch) {
    return `3M-${standardMatch[1]}-${standardMatch[2].padStart(4, "0")}`;
  }

  const evaluationMatch = /^EVALDRAFT(\d{4})(\d{6})$/.exec(compact);
  if (evaluationMatch) {
    return `EVAL-DRAFT-${evaluationMatch[1]}-${evaluationMatch[2]}`;
  }

  return cleaned;
}

export function parseAgencyDossierReference(value: string): number | null {
  const match = /^3M-AGN-(\d+)$/.exec(normalizeDossierReference(value));
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function dossierReferenceCandidates(value: string): string[] {
  const raw = value.trim().toUpperCase();
  const normalized = normalizeDossierReference(value);
  return raw === normalized ? [normalized] : [normalized, raw];
}
