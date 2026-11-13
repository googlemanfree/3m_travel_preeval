import { GRID_V1, type GridDef, type RubricKey } from "../../../shared/bilanAuto/grid";
import {
  CEFR_LEVELS,
  EDUCATION_RANK,
  type CandidateFacts,
  type CefrLevel,
  type Fact,
  type Provenance,
  type RubricResult,
  type ScoreResult,
  type SubCriterionResult,
} from "../../../shared/bilanAuto/types";

/**
 * Moteur de règles déterministe. Entrée : des FAITS avec provenance. Sortie : des points expliqués, un total calculé ici.
 * Aucun appel réseau, aucune IA : mêmes faits + même grille = même score (reproductible et auditable).
 */

type Draft = Omit<SubCriterionResult, "key" | "label" | "max" | "kind">;
const MISSING = (explanation: string, provenance: Provenance = "non_renseigne"): Draft => ({ points: null, provenance, explanation, flags: [] });

const isReal = (fact: Fact<unknown>) => fact.provenance !== "non_renseigne" && fact.value !== null && fact.value !== undefined;
const isContradiction = (fact: Fact<unknown>) => fact.provenance === "contradictoire";

/** Points d'un sous-critère de PREUVE : pièce examinée ou vérifiée = plein ; déclaré seulement = partiel ; absent/contradictoire = 0. */
function proofPoints(fact: Fact<boolean>, max: number, label: string): Draft {
  if (isContradiction(fact)) return { points: 0, provenance: "contradictoire", explanation: `${label} : contradiction entre les sources, aucun point attribué en attendant clarification.`, flags: [`${label} : informations contradictoires`] };
  if (fact.value === true && (fact.provenance === "piece" || fact.provenance === "verifie")) {
    return { points: max, provenance: fact.provenance, explanation: `${label} retrouvé dans une pièce déposée (pièce lue, authenticité non vérifiée par le système).`, flags: [] };
  }
  if (fact.value === true) return { points: Math.min(max, 1), provenance: "declare", explanation: `${label} déclaré, non justifié par une pièce : 1 point. Une pièce à l'appui permettrait de les examiner.`, flags: [] };
  return { points: 0, provenance: fact.provenance, explanation: `${label} : aucune pièce reçue à ce jour. Cela ne signifie pas que l'élément n'existe pas : il n'est simplement pas justifié.`, flags: [] };
}

function cefrRank(level: CefrLevel): number {
  return CEFR_LEVELS.indexOf(level);
}

function workLanguagePoints(level: CefrLevel): number {
  const rank = cefrRank(level);
  if (rank >= cefrRank("C1")) return 8;
  if (rank === cefrRank("B2")) return 6;
  if (rank === cefrRank("B1")) return 4;
  if (rank === cefrRank("A2")) return 2;
  return 0;
}

function otherLanguagePoints(level: CefrLevel): number {
  const rank = cefrRank(level);
  if (rank >= cefrRank("B2")) return 4;
  if (rank === cefrRank("B1")) return 3;
  if (rank === cefrRank("A2")) return 2;
  return 0;
}

function yearsPoints(years: number): number {
  if (years >= 10) return 8;
  if (years >= 6) return 7;
  if (years >= 3) return 5;
  if (years >= 1) return 3;
  return 1;
}

function countPoints(count: number, table: Array<[number, number]>): number {
  for (const [threshold, points] of table) if (count >= threshold) return points;
  return 0;
}

type Evaluator = (facts: CandidateFacts) => Draft;

const EVALUATORS: Record<string, Evaluator> = {
  "formation.niveau": ({ formation }) => {
    const { niveau } = formation;
    if (!isReal(niveau)) return MISSING("Niveau de diplôme non renseigné : un complément est nécessaire pour calculer cette rubrique.");
    if (isContradiction(niveau)) return { points: null, provenance: "contradictoire", explanation: "Le niveau de diplôme diffère entre le formulaire et les pièces : clarification nécessaire.", flags: ["Niveau de diplôme contradictoire"] };
    const rank = EDUCATION_RANK[niveau.value!];
    const points = rank >= 5 ? 6 : rank === 4 ? 5 : rank === 3 ? 4 : rank === 2 ? 2 : 1;
    return { points, provenance: niveau.provenance, explanation: `Niveau « ${niveau.value} » (${niveau.provenance === "declare" ? "déclaré" : "retrouvé dans une pièce"}) : ${points} points.`, flags: [] };
  },
  "formation.pertinence": ({ formation }) => {
    const { pertinence } = formation;
    if (!isReal(pertinence)) return MISSING("Pertinence de la formation pour le métier visé non déterminée : métier visé ou formation à préciser.");
    const points = pertinence.value === "alignee" ? 5 : pertinence.value === "proche" ? 3 : 1;
    return { points, provenance: pertinence.provenance, explanation: `Formation « ${pertinence.value} » par rapport au métier visé : ${points} points.`, flags: [] };
  },
  "formation.preuve": ({ formation }) => proofPoints(formation.diplomeEnPiece, 4, "Le diplôme"),

  "experience.duree": ({ experience }) => {
    const { dureeAnnees } = experience;
    if (!isReal(dureeAnnees)) return MISSING("Durée d'expérience pertinente non renseignée : un complément est nécessaire.");
    const points = yearsPoints(dureeAnnees.value!);
    return { points, provenance: dureeAnnees.provenance, explanation: `${dureeAnnees.value} an(s) d'expérience pertinente : ${points} points.`, flags: [] };
  },
  "experience.responsabilite": ({ experience }) => {
    const { responsabilite } = experience;
    if (!isReal(responsabilite)) return MISSING("Niveau de responsabilité non renseigné : un complément est nécessaire.");
    const points = responsabilite.value === "encadrement" ? 6 : responsabilite.value === "autonomie" ? 4 : 2;
    return { points, provenance: responsabilite.provenance, explanation: `Niveau de responsabilité « ${responsabilite.value} » : ${points} points.`, flags: [] };
  },
  "experience.chronologie": ({ experience }) => {
    const { chronologie } = experience;
    if (!isReal(chronologie)) return { points: 0, provenance: "non_renseigne", explanation: "Chronologie non renseignée : 0 point, sans effet négatif sur les autres critères.", flags: [] };
    if (chronologie.value === "incoherente") return { points: 0, provenance: chronologie.provenance, explanation: "Chronologie incohérente détectée : 0 point et vérification recommandée.", flags: ["Chronologie d'expérience incohérente"] };
    const points = chronologie.value === "coherente" ? 3 : 2;
    return { points, provenance: chronologie.provenance, explanation: `Chronologie ${chronologie.value === "coherente" ? "cohérente" : "avec lacunes expliquées"} : ${points} points.`, flags: [] };
  },
  "experience.preuve": ({ experience }) => proofPoints(experience.enPiece, 3, "L'expérience"),

  "competences.techniques": ({ competences }) => {
    const { techniques } = competences;
    if (!isReal(techniques)) return MISSING("Adéquation des compétences techniques au métier visé non déterminée : CV ou métier visé à compléter.");
    const points = techniques.value === "fort" ? 10 : techniques.value === "partiel" ? 6 : 2;
    return { points, provenance: techniques.provenance, explanation: `Compétences techniques « ${techniques.value} » par rapport au métier visé : ${points} points.`, flags: [] };
  },
  "competences.certifications": ({ competences }) => {
    const { certifications } = competences;
    if (!isReal(certifications)) return { points: 0, provenance: "non_renseigne", explanation: "Aucune certification renseignée : 0 point (information non renseignée, pas une absence constatée).", flags: [] };
    const points = countPoints(certifications.value!, [[3, 5], [2, 4], [1, 3]]);
    return { points, provenance: certifications.provenance, explanation: `${certifications.value} certification(s) ou outil(s) : ${points} points.`, flags: [] };
  },
  "competences.transferables": ({ competences }) => {
    const { transferables } = competences;
    if (!isReal(transferables)) return { points: 0, provenance: "non_renseigne", explanation: "Aucune compétence transférable renseignée : 0 point (non renseigné).", flags: [] };
    const points = countPoints(transferables.value!, [[4, 5], [3, 4], [2, 3], [1, 2]]);
    return { points, provenance: transferables.provenance, explanation: `${transferables.value} compétence(s) transférable(s) : ${points} points.`, flags: [] };
  },

  "langues.langue_travail": ({ langues }) => {
    const { langueTravail } = langues;
    if (!isReal(langueTravail)) return MISSING("Niveau dans la langue de travail du pays visé non renseigné : un complément est nécessaire.");
    const points = workLanguagePoints(langueTravail.value!);
    return { points, provenance: langueTravail.provenance, explanation: `Niveau ${langueTravail.value} dans la langue de travail : ${points} points.`, flags: [] };
  },
  "langues.autre_langue": ({ langues }) => {
    const { autreLangue } = langues;
    if (!isReal(autreLangue)) return { points: 0, provenance: "non_renseigne", explanation: "Autre langue non renseignée : 0 point (non renseigné).", flags: [] };
    const points = otherLanguagePoints(autreLangue.value!);
    return { points, provenance: autreLangue.provenance, explanation: `Autre langue au niveau ${autreLangue.value} : ${points} points.`, flags: [] };
  },
  "langues.preuve": ({ langues }) => proofPoints(langues.preuve, 3, "Le niveau de langue"),

  "projet.cible": ({ projet }) => {
    const { metierPrecise, paysPrecise } = projet;
    if (!isReal(metierPrecise) && !isReal(paysPrecise)) return MISSING("Ni métier ni pays visés ne sont précisés : un complément est nécessaire.");
    const both = metierPrecise.value === true && paysPrecise.value === true;
    const one = metierPrecise.value === true || paysPrecise.value === true;
    const points = both ? 4 : one ? 2 : 0;
    return { points, provenance: both ? metierPrecise.provenance : "declare", explanation: both ? "Métier et pays précisés : 4 points." : one ? "Un seul des deux (métier ou pays) est précisé : 2 points." : "Ni métier ni pays précisés : 0 point.", flags: [] };
  },
  "projet.plan": ({ projet }) => {
    const { plan } = projet;
    if (!isReal(plan)) return { points: 0, provenance: "non_renseigne", explanation: "Plan de préparation non renseigné : 0 point (non renseigné).", flags: [] };
    const points = plan.value === "plan_calendrier" ? 3 : plan.value === "plan_seul" ? 2 : 1;
    return { points, provenance: plan.provenance, explanation: `Préparation « ${plan.value} » : ${points} points.`, flags: [] };
  },
  "projet.coherence": ({ projet }) => {
    const { coherence } = projet;
    if (!isReal(coherence)) return { points: 0, provenance: "non_renseigne", explanation: "Cohérence du projet avec le parcours non évaluable : 0 point (non renseigné).", flags: [] };
    if (coherence.value === "incoherent") return { points: 0, provenance: coherence.provenance, explanation: "Projet peu cohérent avec le parcours : 0 point.", flags: ["Projet peu cohérent avec le parcours"] };
    const points = coherence.value === "coherent" ? 3 : 2;
    return { points, provenance: coherence.provenance, explanation: `Projet ${coherence.value === "coherent" ? "cohérent" : "partiellement cohérent"} avec le parcours : ${points} points.`, flags: [] };
  },

  "administratif.identite": ({ administratif }) => {
    const { identite } = administratif;
    if (identite.value === "contradictoire" || identite.provenance === "contradictoire") {
      return { points: 0, provenance: "contradictoire", explanation: "L'identité diffère entre les sources (formulaire, CV, pièces) : traitement suspendu pour clarification.", flags: ["Identité contradictoire entre les sources"] };
    }
    if (identite.value === "coherente") return { points: 3, provenance: "systeme", explanation: "Identité cohérente entre le formulaire, le CV et les pièces examinées : 3 points.", flags: [] };
    return { points: 2, provenance: "systeme", explanation: "Identité non vérifiable à ce stade (pas de pièce d'identité examinée) : 2 points.", flags: [] };
  },
  "administratif.coordonnees": ({ administratif }) => {
    const contact = administratif.coordonneesDeclarees.value === true;
    const passport = administratif.passeportDeclare.value === true;
    const points = contact && passport ? 3 : contact ? 2 : passport ? 1 : 0;
    return { points, provenance: "systeme", explanation: `Coordonnées ${contact ? "déclarées" : "incomplètes"}, passeport ${passport ? "déclaré" : "non déclaré"} : ${points} points.`, flags: [] };
  },
  "administratif.formulaire": ({ administratif }) => {
    const ratio = administratif.completudeFormulaire;
    const points = ratio >= 0.9 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.5 ? 2 : 1;
    return { points, provenance: "systeme", explanation: `Formulaire renseigné à ${Math.round(ratio * 100)} % : ${points} points.`, flags: [] };
  },

  "justificatifs.pieces": ({ documents }) => {
    const readable = documents.filter((doc) => doc.readable && doc.kind !== "cv").length;
    const unreadable = documents.filter((doc) => !doc.readable).length;
    const points = countPoints(readable, [[4, 5], [3, 4], [2, 3], [1, 2]]);
    const flags = unreadable > 0 ? [`${unreadable} pièce(s) illisible(s) : nouvelle version à demander`] : [];
    return { points, provenance: "systeme", explanation: `${readable} pièce(s) lisible(s) reçue(s) : ${points} points${unreadable ? ` (${unreadable} pièce(s) illisible(s) non comptée(s), à redéposer)` : ""}.`, flags };
  },
  "justificatifs.coherence": ({ documents }) => {
    const examined = documents.filter((doc) => doc.readable && doc.kind !== "cv" && doc.consistency !== "non_evaluee");
    if (examined.length === 0) return { points: 0, provenance: "systeme", explanation: "Aucune pièce examinée à ce jour : 0 point (non examiné).", flags: [] };
    if (examined.some((doc) => doc.consistency === "contradictoire")) {
      return { points: 0, provenance: "contradictoire", explanation: "Au moins une pièce est en contradiction avec les informations déclarées : 0 point en attendant clarification.", flags: ["Pièce en contradiction avec le déclaré"] };
    }
    const allConsistent = examined.every((doc) => doc.consistency === "coherente");
    const points = allConsistent ? 5 : 3;
    return { points, provenance: "systeme", explanation: `${examined.length} pièce(s) examinée(s), ${allConsistent ? "cohérentes avec le déclaré" : "partiellement cohérentes"} : ${points} points.`, flags: [] };
  },
};

export function scoreFacts(facts: CandidateFacts, grid: GridDef = GRID_V1): ScoreResult {
  const missing: ScoreResult["missing"] = [];
  const blockingContradictions: string[] = [];

  const rubrics: RubricResult[] = grid.rubrics.map((rubric) => {
    const subCriteria: SubCriterionResult[] = rubric.subCriteria.map((sub) => {
      const evaluator = EVALUATORS[`${rubric.key}.${sub.key}`];
      if (!evaluator) throw new Error(`Aucune règle pour ${rubric.key}.${sub.key}`);
      const draft = evaluator(facts);
      if (draft.points !== null && draft.points > sub.max) throw new Error(`Points > max pour ${rubric.key}.${sub.key}`);
      if (draft.points === null && sub.kind === "essential") missing.push({ rubric: rubric.key, subCriterion: sub.key, label: sub.label });
      if (draft.provenance === "contradictoire" && (sub.key === "identite" || sub.key === "coherence" && rubric.key === "justificatifs")) {
        blockingContradictions.push(...draft.flags);
      }
      return { key: sub.key, label: sub.label, max: sub.max, kind: sub.kind, ...draft };
    });
    const calculable = subCriteria.every((sub) => sub.points !== null);
    const points = calculable ? subCriteria.reduce((sum, sub) => sum + (sub.points ?? 0), 0) : null;
    return { key: rubric.key as RubricKey, label: rubric.label, max: rubric.max, points, calculable, subCriteria };
  });

  const calculable = rubrics.every((rubric) => rubric.calculable);
  const total = rubrics.reduce((sum, rubric) => sum + (rubric.points ?? 0), 0);
  return {
    gridId: grid.id,
    gridVersion: grid.version,
    rubrics,
    total,
    max: grid.rubrics.reduce((sum, rubric) => sum + rubric.max, 0),
    threshold: grid.threshold,
    thresholdReached: calculable && total >= grid.threshold,
    missing,
    blockingContradictions: Array.from(new Set(blockingContradictions)),
    calculable,
  };
}

/**
 * Recalcule rubriques, total et seuil à partir des sous-critères (après un ajustement administrateur tracé).
 * Le total n'est jamais saisi à la main : il découle toujours des points des sous-critères.
 */
export function recomputeScore(result: ScoreResult): ScoreResult {
  const rubrics = result.rubrics.map((rubric) => {
    const calculable = rubric.subCriteria.every((sub) => sub.points !== null);
    return { ...rubric, calculable, points: calculable ? rubric.subCriteria.reduce((sum, sub) => sum + (sub.points ?? 0), 0) : null };
  });
  const calculable = rubrics.every((rubric) => rubric.calculable);
  const total = rubrics.reduce((sum, rubric) => sum + (rubric.points ?? 0), 0);
  return { ...result, rubrics, total, calculable, thresholdReached: calculable && total >= result.threshold };
}

/** Faits entièrement vides (tout « non renseigné ») : point de départ des constructions de faits. */
export function emptyFacts(): CandidateFacts {
  const none = <T,>(): Fact<T> => ({ value: null, provenance: "non_renseigne", sources: [] });
  return {
    formation: { niveau: none(), pertinence: none(), diplomeEnPiece: none() },
    experience: { dureeAnnees: none(), responsabilite: none(), chronologie: none(), enPiece: none() },
    competences: { techniques: none(), certifications: none(), transferables: none() },
    langues: { langueTravail: none(), autreLangue: none(), preuve: none() },
    projet: { metierPrecise: none(), paysPrecise: none(), plan: none(), coherence: none() },
    administratif: { identite: none(), coordonneesDeclarees: none(), passeportDeclare: none(), completudeFormulaire: 0 },
    documents: [],
    metierVise: null,
    secteurs: [],
    missionsVisees: [],
    ageAns: null,
  };
}
