/**
 * Affichage unifié des références côté administration :
 * référence de travail + ancienne référence de compte.
 */
import {
  accountReference,
  isAccountReference,
  isActiveDossierReference,
  resolveClientReference,
  type ReferenceStage,
  type ReferenceSources,
} from "./caseReference";

export type AdminReferenceView = ReferenceStage & {
  /** Libellé court pour les tableaux admin. */
  label: string;
  /** Sous-libellé (ancienne référence) si le dossier est actif. */
  secondaryLabel: string | null;
};

export function buildAdminReferenceView(input: ReferenceSources): AdminReferenceView {
  const stage = resolveClientReference(input);
  if (stage.activated) {
    return {
      ...stage,
      label: stage.reference,
      secondaryLabel: stage.formerAccountReference
        ? `Ancien compte : ${stage.formerAccountReference}`
        : null,
    };
  }
  return {
    ...stage,
    label: stage.reference,
    secondaryLabel: "Compte — dossier non activé",
  };
}

/** Normalise un folderCode admin historique vers l’écriture canonique. */
export function canonicalizeAdminFolderCode(folderCode: string | null | undefined, candidateId?: number | null): string {
  const value = (folderCode ?? "").trim();
  if (isActiveDossierReference(value)) return value.replace(/^#/, "").toUpperCase().replace(/^3M-AGN-(\d+)$/i, (_, n) => `3M-AGN-${String(Number(n)).padStart(4, "0")}`);
  if (isAccountReference(value) || (candidateId && /^account_/i.test(value) === false && !value)) {
    if (isAccountReference(value)) {
      const match = /^COMPTE-(\d{1,8})$/i.exec(value);
      return match ? accountReference(Number(match[1])) : value;
    }
  }
  if (candidateId && (!value || /^COMPTE-/i.test(value))) {
    return accountReference(candidateId);
  }
  return value;
}
