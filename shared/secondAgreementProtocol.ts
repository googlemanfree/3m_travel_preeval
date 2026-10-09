/**
 * Protocole N°02 — sélection candidat / post-sélection.
 * Prérequis : Protocole N°01 signé + paiement confirmé + employeur/partenaire renseigné.
 */

import { getCountryProtocolProfile, type CountryProtocolFormula } from "./agreementProtocolCountryTemplates";

export const SECOND_AGREEMENT_PROTOCOL_VERSION = "2026-10-09-v1";

export type SecondProtocolFormulaKey = "integral" | "echelonne" | "garanti";

export const SECOND_PROTOCOL_FORMULA_INDEX: Record<SecondProtocolFormulaKey, 0 | 1 | 2> = {
  integral: 0,
  echelonne: 1,
  garanti: 2,
};

export const SECOND_PROTOCOL_FORMULA_FROM_INDEX: SecondProtocolFormulaKey[] = ["integral", "echelonne", "garanti"];

export type SecondProtocolState = {
  ready: boolean;
  signed: boolean;
  employerName: string | null;
  positionTitle: string | null;
  formulaChosen: SecondProtocolFormulaKey | null;
  formulas: CountryProtocolFormula[] | null;
  destinationLabel: string;
  canSign: boolean;
  blockers: string[];
};

export function resolveSecondProtocolFormulas(destination?: string | null): CountryProtocolFormula[] | null {
  const profile = getCountryProtocolProfile(destination);
  return profile.secondProtocolFormulas ? [...profile.secondProtocolFormulas] : null;
}

export function describeSecondProtocolState(input: {
  destination?: string | null;
  paymentConfirmed?: boolean;
  protocolOneSigned?: boolean;
  secondProtocolReady?: boolean;
  secondProtocolSigned?: boolean;
  employerName?: string | null;
  positionTitle?: string | null;
  formulaChosen?: SecondProtocolFormulaKey | null;
}): SecondProtocolState {
  const formulas = resolveSecondProtocolFormulas(input.destination);
  const profile = getCountryProtocolProfile(input.destination);
  const blockers: string[] = [];
  if (!input.paymentConfirmed) blockers.push("Paiement d’ouverture non confirmé");
  if (!input.protocolOneSigned) blockers.push("Protocole N°01 non signé");
  if (!input.secondProtocolReady) blockers.push("Sélection candidat non validée par l’administration");
  if (!input.employerName?.trim()) blockers.push("Employeur / partenaire d’accueil manquant");
  if (!input.positionTitle?.trim()) blockers.push("Poste ou projet retenu manquant");
  if (formulas && input.formulaChosen == null && input.secondProtocolReady) {
    blockers.push("Formule tarifaire à choisir avant signature");
  }

  const ready = Boolean(input.secondProtocolReady);
  const signed = Boolean(input.secondProtocolSigned);
  const canSign =
    ready
    && !signed
    && Boolean(input.paymentConfirmed)
    && Boolean(input.protocolOneSigned)
    && Boolean(input.employerName?.trim())
    && Boolean(input.positionTitle?.trim())
    && (!formulas || input.formulaChosen != null);

  return {
    ready,
    signed,
    employerName: input.employerName?.trim() || null,
    positionTitle: input.positionTitle?.trim() || null,
    formulaChosen: input.formulaChosen ?? null,
    formulas,
    destinationLabel: profile.destinationLabel,
    canSign,
    blockers: signed ? [] : blockers,
  };
}

/** Handoff double opportunité : texte court pour l’admin quand un sibling existe. */
export function dualOpportunityHandoffMessage(input: {
  currentProcedure?: string | null;
  siblingProcedures?: Array<{ projectType?: string | null; folderCode?: string | null; destinationCountry?: string | null }>;
}): string | null {
  const siblings = input.siblingProcedures ?? [];
  if (!siblings.length) return null;
  const list = siblings
    .slice(0, 3)
    .map((sibling) => `${sibling.projectType || "procédure"} · ${sibling.folderCode || "dossier"}${sibling.destinationCountry ? ` (${sibling.destinationCountry})` : ""}`)
    .join(" ; ");
  return `Double opportunité active : ce client a aussi ${siblings.length} autre(s) procédure(s) — ${list}. Après validation de sélection / Protocole N°02 sur l’un des dossiers, conservez le suivi parallèle sans fusionner les pièces.`;
}
