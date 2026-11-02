/**
 * Clés techniques des dossiers qui n'ont PAS encore payé les frais d'ouverture.
 *
 * Règle de l'agence : avant paiement, un candidat n'a qu'un COMPTE (« COMPTE-00012 ») ; le numéro « 3M-… » n'existe qu'après
 * paiement validé. Plus aucun identifiant « EVAL-… » n'est créé ni conservé en base : les anciens (« EVAL-DRAFT-… »,
 * « EVAL-AG-… ») sont reconnus ici uniquement pour être renommés.
 *
 * `applications.dossierNumber` est UNIQUE (20 caractères) : un candidat qui a plusieurs demandes reçoit « COMPTE-00012 »,
 * puis « COMPTE-00012-2 », « COMPTE-00012-3 »… La référence AFFICHÉE reste toujours « COMPTE-00012 » (voir evaluationDisplayReference).
 */

import { accountReference } from "./caseReference";

/** Ancien identifiant « EVAL-… » (brouillon d'évaluation, miroir agence, « 3M-EVAL-… »). */
export const isLegacyEvalReference = (value: string | null | undefined): boolean => /^(?:3M-)?EVAL-/i.test((value ?? "").trim());

/** Clé d'un dossier non payé : « COMPTE-… » (compte, copie d'un compte ou miroir agence « COMPTE-AG-… »). */
export const isAccountKey = (value: string | null | undefined): boolean => /^COMPTE-/i.test((value ?? "").trim());

/** Numéro provisoire : jamais présenté comme un dossier actif, ni utilisé dans un objet d'e-mail comme « Dossier N° ». */
export const isProvisionalReference = (value: string | null | undefined): boolean => isAccountKey(value) || isLegacyEvalReference(value);

/**
 * Prochaine clé libre pour un dossier non payé. `taken` = clés déjà utilisées (insensible à la casse).
 * Sans compte rattaché : « COMPTE-S000123 » (S = sans compte, numéro de la demande), unique par construction.
 */
export function allocateAccountKey(input: { candidateId?: number | null; applicationId: number; taken: Set<string> }): string {
  const candidateId = Number(input.candidateId);
  if (!Number.isInteger(candidateId) || candidateId <= 0) return `COMPTE-S${String(Math.trunc(input.applicationId)).padStart(6, "0")}`;
  const base = accountReference(candidateId);
  if (!input.taken.has(base.toUpperCase())) return base;
  for (let copy = 2; copy < 1000; copy += 1) {
    const candidate = `${base}-${copy}`;
    if (!input.taken.has(candidate.toUpperCase())) return candidate;
  }
  return `${base}-${Math.trunc(input.applicationId)}`;
}

/** Prochain numéro de dossier en ligne « 3M-AAAA-NNNN » (4 chiffres), après les numéros déjà attribués cette année. */
export function nextOnlineDossierNumber(year: number, existing: Iterable<string>): string {
  const pattern = new RegExp(`^3M-${year}-(\\d{4})$`, "i");
  let max = 0;
  for (const value of Array.from(existing)) {
    const match = pattern.exec(String(value).trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `3M-${year}-${String(max + 1).padStart(4, "0")}`;
}

export type ReferenceRowKind = "legacy_eval" | "legacy_eval_agency_mirror";

export type NormalizationInput = {
  applicationId: number;
  dossierNumber: string;
  candidateId: number | null;
  /** Frais d'ouverture payés ET validés (statut SUCCESS avec date de validation). */
  paidAndValidated: boolean;
  /** Pour un miroir « EVAL-AG-{id} » : identifiant du dossier agence. */
  agencyMirrorOf: number | null;
  /** Demande numérotée « 3M- » alors qu'aucun paiement n'est prouvé : elle revient à une clé de compte (jamais d'un compte payé). */
  demoteActive?: boolean;
};

export type NormalizationPlanItem = {
  applicationId: number;
  from: string;
  to: string;
  /** « account » : retour au compte ; « active » : dossier payé, numéro 3M- attribué. */
  outcome: "account" | "active";
};

/**
 * Plan de renommage (sans écriture) : tout ancien « EVAL-… » revient à une clé COMPTE tant que rien n'est payé,
 * et passe à « 3M-AAAA-NNNN » seulement si les frais d'ouverture sont payés et validés.
 */
export function planReferenceNormalization(rows: NormalizationInput[], context: { takenKeys: Iterable<string>; existingActiveNumbers: Iterable<string>; year: number }): NormalizationPlanItem[] {
  const taken = new Set(Array.from(context.takenKeys, (value) => String(value).toUpperCase()));
  const active = Array.from(context.existingActiveNumbers);
  const plan: NormalizationPlanItem[] = [];
  for (const row of [...rows].sort((a, b) => a.applicationId - b.applicationId)) {
    if (!isLegacyEvalReference(row.dossierNumber) && !(row.demoteActive && !row.paidAndValidated)) continue;
    if (row.paidAndValidated && row.agencyMirrorOf == null) {
      // Même format que l'attribution à la validation (« 3M-AAAA-00012 », numéro de la demande) ; une suite libre si déjà pris.
      const byId = `3M-${context.year}-${String(Math.trunc(row.applicationId)).padStart(5, "0")}`;
      const to = taken.has(byId.toUpperCase()) || active.some((value) => value.toUpperCase() === byId.toUpperCase()) ? nextOnlineDossierNumber(context.year, active) : byId;
      active.push(to);
      taken.add(to.toUpperCase());
      plan.push({ applicationId: row.applicationId, from: row.dossierNumber, to, outcome: "active" });
      continue;
    }
    let to: string;
    if (row.agencyMirrorOf != null) {
      to = `COMPTE-AG-${row.agencyMirrorOf}`;
      for (let copy = 2; taken.has(to.toUpperCase()); copy += 1) to = `COMPTE-AG-${row.agencyMirrorOf}-${copy}`;
    } else {
      to = allocateAccountKey({ candidateId: row.candidateId, applicationId: row.applicationId, taken });
    }
    taken.add(to.toUpperCase());
    plan.push({ applicationId: row.applicationId, from: row.dossierNumber, to, outcome: "account" });
  }
  return plan;
}
