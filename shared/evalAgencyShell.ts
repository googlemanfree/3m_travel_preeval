/**
 * Les dossiers agence créent parfois une application miroir pour préparer le bilan. Ce n’est PAS un second dossier
 * actif : le numéro de travail reste « 3M-AGN-{id} ». Le miroir porte la clé « COMPTE-AG-{id} » (avant paiement, il n'y a
 * qu'un compte, jamais un numéro « EVAL » ni « 3M ») ; l'ancienne clé « EVAL-AG-{id} » est encore reconnue le temps de
 * la normalisation des données existantes.
 */

import { agencyDossierReference } from "./caseReference";

/** Clé technique d'un miroir de préparation d'un dossier agence (colonne `applications.dossierNumber`, 20 caractères maximum). */
export const agencyMirrorKey = (agencyDossierId: number): string => `COMPTE-AG-${Math.trunc(agencyDossierId)}`;

export function parseEvalAgencyShellId(folderCode: string | null | undefined): number | null {
  const match = /^(?:EVAL|COMPTE)-AG-(\d{1,10})(?:-\d+)?$/i.exec(String(folderCode ?? "").trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isEvalAgencyShell(folderCode: string | null | undefined): boolean {
  return parseEvalAgencyShellId(folderCode) != null;
}

export function parseAgencyDossierIdFromFolderCode(folderCode: string | null | undefined): number | null {
  const shellId = parseEvalAgencyShellId(folderCode);
  if (shellId != null) return shellId;
  const match = /^3M-AGN-(\d{1,10})$/i.exec(String(folderCode ?? "").trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function canonicalAgencyCandidateId(agencyDossierId: number): string {
  return `agency_${Math.trunc(agencyDossierId)}`;
}

export function canonicalAgencyFolderCode(agencyDossierId: number): string {
  return agencyDossierReference(agencyDossierId);
}

/**
 * Retire les lignes EVAL-AG-{id} lorsqu’un dossier agence 3M-AGN du même id
 * est déjà présent — un seul dossier actif.
 */
export function collapseEvalAgencyShellRows<T extends {
  id: string;
  folderCode: string;
  source?: string | null;
}>(rows: T[]): T[] {
  const agencyIds = new Set<number>();
  for (const row of rows) {
    const fromId = /^agency_(\d+)$/i.exec(row.id);
    if (fromId) {
      agencyIds.add(Number(fromId[1]));
      continue;
    }
    if (String(row.source ?? "").toUpperCase().includes("AGENCY")) {
      const agencyId = parseAgencyDossierIdFromFolderCode(row.folderCode);
      if (agencyId != null) agencyIds.add(agencyId);
    }
  }
  return rows.filter((row) => {
    const shellId = parseEvalAgencyShellId(row.folderCode);
    if (shellId == null) return true;
    return !agencyIds.has(shellId);
  });
}

/** Si la fiche ouverte est un miroir EVAL-AG, renvoie l’id admin canonique agency_N. */
export function resolveCanonicalAgencyOpenId(input: {
  candidateId: string;
  folderCode?: string | null;
}): string | null {
  const shellId = parseEvalAgencyShellId(input.folderCode);
  if (shellId == null) {
    const fromOnline = /^online_/i.test(input.candidateId) ? parseEvalAgencyShellId(input.folderCode) : null;
    if (fromOnline == null) return null;
    return canonicalAgencyCandidateId(fromOnline);
  }
  return canonicalAgencyCandidateId(shellId);
}
