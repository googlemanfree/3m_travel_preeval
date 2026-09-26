/**
 * Références d'un candidat, du compte au dossier actif.
 *
 * - À l'inscription, le candidat reçoit une RÉFÉRENCE DE COMPTE : « COMPTE-00012 ». Ce n'est pas un dossier.
 * - Une fois les frais d'ouverture payés (et validés) et le dossier activé par l'administration, le compte reçoit son
 *   NUMÉRO DE DOSSIER ACTIF, qui commence par « 3M- » (ex. « 3M-AGN-0034 »). La référence de compte est alors conservée comme
 *   « ancienne référence » : elle reste retrouvable, mais n'est plus la référence de travail.
 *
 * Une seule fonction fabrique chaque format : l'espace client, l'administration, les e-mails et les recherches ne peuvent plus
 * afficher deux écritures du même numéro (auparavant « COMPTE-12 » côté client et « COMPTE-00012 » côté administration).
 */

export const ACCOUNT_REFERENCE_PREFIX = "COMPTE-";
export const ACTIVE_DOSSIER_PREFIX = "3M-";

export const accountReference = (candidateId: number): string => `${ACCOUNT_REFERENCE_PREFIX}${String(Math.trunc(candidateId)).padStart(5, "0")}`;
export const agencyDossierReference = (dossierId: number): string => `3M-AGN-${String(Math.trunc(dossierId)).padStart(4, "0")}`;

export type ReferenceKind = "account" | "active_dossier" | "unknown";

/** « COMPTE-00012 », ou l'ancienne écriture sans zéros (« COMPTE-12 »). */
export const isAccountReference = (value: string | null | undefined): boolean => /^COMPTE-\d{1,8}$/i.test((value ?? "").trim());

/** Numéro de dossier actif : commence par « 3M- » (dossier agence « 3M-AGN-0034 » ou dossier en ligne « 3M-2026-0042 »). */
export const isActiveDossierReference = (value: string | null | undefined): boolean => /^#?3M-[A-Z0-9]+(-[A-Z0-9]+)*$/i.test((value ?? "").trim());

export function referenceKind(value: string | null | undefined): ReferenceKind {
  if (isAccountReference(value)) return "account";
  if (isActiveDossierReference(value)) return "active_dossier";
  return "unknown";
}

/** Remet une référence de compte saisie ou stockée dans l'écriture canonique (« COMPTE-12 » → « COMPTE-00012 ») ; le reste est inchangé. */
export function normalizeAccountReference(value: string): string {
  const match = /^COMPTE-(\d{1,8})$/i.exec(value.trim());
  return match ? accountReference(Number(match[1])) : value.trim();
}

export type ReferenceStage = {
  /** Référence à montrer et à utiliser dans les échanges. */
  reference: string;
  kind: ReferenceKind;
  /** Ancienne référence de compte, tant que le dossier actif existe (pour les recherches et l'historique). */
  formerAccountReference: string | null;
  activated: boolean;
};

/**
 * Référence à afficher : le numéro de dossier actif dès que le dossier est activé, sinon la référence de compte.
 * `activeDossierReference` ne doit être fourni que pour un dossier réellement activé (jamais un numéro de pré-dossier).
 */
export function currentReference(input: { candidateId: number; activeDossierReference?: string | null }): ReferenceStage {
  const account = accountReference(input.candidateId);
  const active = (input.activeDossierReference ?? "").trim();
  if (active && isActiveDossierReference(active)) return { reference: active, kind: "active_dossier", formerAccountReference: account, activated: true };
  return { reference: account, kind: "account", formerAccountReference: null, activated: false };
}

/** Phrase du changement de référence, reprise dans l'historique, la notification et l'e-mail d'activation. */
export function referenceChangeSentence(accountRef: string, dossierRef: string): string {
  return `Votre référence de compte ${accountRef} est remplacée par votre numéro de dossier ${dossierRef}. Utilisez désormais ${dossierRef} dans tous vos échanges avec l’agence.`;
}

export type ReferenceSources = {
  candidateId: number;
  /** Dossier agence rattaché au compte (par e-mail). Un pré-dossier « nouveau » n'est pas un dossier activé. */
  agencyDossier?: { id: number; status?: string | null } | null;
  /** Dossier en ligne : activé quand le paiement des frais d'ouverture est confirmé ET validé par l'administration. */
  onlineApplication?: { dossierNumber?: string | null; paymentStatus?: string | null; paymentValidatedAt?: Date | string | null } | null;
};

/**
 * Référence que le client (et l'administration) lit pour ce compte : le numéro de dossier actif « 3M-… » dès l'activation,
 * la référence de compte « COMPTE-00012 » avant. Un numéro provisoire de pré-dossier ou d'évaluation n'est jamais présenté
 * comme un dossier actif.
 */
export function resolveClientReference(input: ReferenceSources): ReferenceStage {
  const agency = input.agencyDossier;
  if (agency && agency.status && agency.status !== "nouveau") {
    return currentReference({ candidateId: input.candidateId, activeDossierReference: agencyDossierReference(agency.id) });
  }
  const online = input.onlineApplication;
  if (online && online.paymentStatus === "SUCCESS" && online.paymentValidatedAt && online.dossierNumber) {
    return currentReference({ candidateId: input.candidateId, activeDossierReference: online.dossierNumber });
  }
  return currentReference({ candidateId: input.candidateId });
}
