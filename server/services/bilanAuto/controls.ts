import { findForbiddenTerms, findSensitiveValues } from "../../../shared/evaluationValidation";
import type { ScoreResult } from "../../../shared/bilanAuto/types";

/**
 * Contrôles automatiques avant qu'un bilan soit déclaré PRÊT, puis trois issues :
 * A — données suffisantes : bilan prêt (publié après validation de l'administrateur) ;
 * B — information essentielle manquante : demande de complément ciblée, aucune note définitive ;
 * C — erreur technique ou contradiction bloquante : rien n'est publié, le candidat est informé, l'administrateur alerté.
 * Un échec de lecture ou un manque d'information n'est JAMAIS transformé en refus.
 */

export type OutcomeCode = "A" | "B" | "C";

export type Preconditions = {
  /** Évaluation soumise ET CV stocké ET rattaché au bon compte. */
  evaluationSubmitted: boolean;
  cvStored: boolean;
  cvAttachedToAccount: boolean;
  /** Consentement distinct à la lecture du CV (existant sur le site). */
  cvConsent: boolean;
  /** Le CV a pu être lu (texte ou lecture visuelle d'un scan). */
  cvReadable: boolean;
  /** Erreur technique d'extraction ou de génération restée après les tentatives. */
  technicalError: string | null;
  /** Grille approuvée par le propriétaire. */
  gridApproved: boolean;
};

export type ComplementItem = { id: string; label: string };

export type OutcomeDecision = {
  code: OutcomeCode;
  reasons: string[];
  complementItems: ComplementItem[];
  /** Message à destination de l'administrateur (issue C). */
  adminAlert: string | null;
};

const PROMISE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "promesse de résultat", pattern: /\b(?:vous\s+(?:obtiendrez|serez\s+(?:admis|accepte|embauche|recrute))|(?:succes|reussite)\s+(?:certain|assure)|100\s*%\s*(?:de\s*)?(?:reussite|succes))/ },
  { label: "probabilité de visa", pattern: /\b(?:chances?|probabilite|taux)\s+(?:d'|de\s+)?(?:obtenir|obtention|succes|reussite)[^.]{0,30}\bvisa|\bprobabilite\s+(?:de\s+)?visa/ },
  { label: "décision officielle", pattern: /\b(?:decision|avis)\s+officiel(?:le)?\s+(?:d'|de\s+)?immigration/ },
];

const fold = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’‘`´]/g, "'");

/** Charte éditoriale : termes interdits, promesses, valeurs sensibles (numéros, etc.). Renvoie la liste des problèmes. */
export function checkEditorialCharter(texts: Array<{ field: string; text: string }>): string[] {
  const problems: string[] = [];
  for (const { field, text } of texts) {
    const terms = findForbiddenTerms(text);
    if (terms.length > 0) problems.push(`« ${field} » contient une formulation interdite : ${terms.join(", ")}`);
    const sensitive = findSensitiveValues(text);
    if (sensitive.length > 0) problems.push(`« ${field} » contient une donnée sensible (${sensitive.join(", ")})`);
    // Une négation explicite (« n'est pas une décision… », « ni une probabilité… ») ne constitue pas une promesse.
    const folded = fold(text).replace(/(?:ne constitue pas|n'est pas|ne vaut pas|\bni)\s[^.;]*/g, " ");
    for (const promise of PROMISE_PATTERNS) if (promise.pattern.test(folded)) problems.push(`« ${field} » contient une ${promise.label}`);
  }
  return problems;
}

export function decideOutcome(input: { preconditions: Preconditions; score: ScoreResult | null; charterProblems?: string[] }): OutcomeDecision {
  const { preconditions, score } = input;
  const charterProblems = input.charterProblems ?? [];

  // C — incident : rien n'est publié, aucune conclusion négative sur le candidat.
  if (preconditions.technicalError) {
    return { code: "C", reasons: ["Erreur technique de traitement"], complementItems: [], adminAlert: `Erreur technique : ${preconditions.technicalError}` };
  }
  if (score && score.blockingContradictions.length > 0) {
    return { code: "C", reasons: score.blockingContradictions, complementItems: [], adminAlert: `Contradiction bloquante : ${score.blockingContradictions.join(" ; ")}` };
  }
  if (charterProblems.length > 0) {
    return { code: "C", reasons: ["Le texte généré ne respecte pas la charte éditoriale"], complementItems: [], adminAlert: `Charte éditoriale : ${charterProblems.join(" ; ")}` };
  }
  if (!preconditions.gridApproved) {
    return { code: "C", reasons: ["Grille de notation non approuvée"], complementItems: [], adminAlert: "La grille de notation n'est pas encore approuvée : aucun bilan ne peut être produit." };
  }

  // B — information manquante : demande ciblée.
  const complementItems: ComplementItem[] = [];
  if (!preconditions.cvStored || !preconditions.cvAttachedToAccount) complementItems.push({ id: "cv", label: "Déposer votre CV dans votre espace client." });
  else if (!preconditions.cvConsent) complementItems.push({ id: "cv_consent", label: "Confirmer votre accord pour la lecture de votre CV." });
  else if (!preconditions.cvReadable) complementItems.push({ id: "cv_lisible", label: "Déposer une version lisible de votre CV (PDF ou image nette)." });
  for (const item of score?.missing ?? []) complementItems.push({ id: `${item.rubric}.${item.subCriterion}`, label: `Précisez : ${item.label.charAt(0).toLowerCase()}${item.label.slice(1)}.` });
  if (complementItems.length > 0) {
    return { code: "B", reasons: ["Informations essentielles manquantes"], complementItems, adminAlert: null };
  }

  return { code: "A", reasons: [], complementItems: [], adminAlert: null };
}
