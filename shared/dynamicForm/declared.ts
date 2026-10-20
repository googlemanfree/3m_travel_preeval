import { describeProjectDetails } from "./resolve";
import { PROJECT_KINDS, type ProjectKind } from "./types";

/**
 * Réponses déclarées d'une évaluation, sous une forme unique pour tous les chemins (première génération du brouillon, relance
 * depuis le back-office, brouillon structuré). Avant, chaque chemin gardait un nombre différent de réponses (12, 5 ou 10) :
 * les dernières saisies disparaissaient sans avertissement.
 */
export const MAX_DECLARED_RESPONSES = 24;

export type DeclaredResponse = { question: string; answer: string };

const isProjectKind = (value: unknown): value is ProjectKind => typeof value === "string" && (PROJECT_KINDS as readonly string[]).includes(value);

/** Clés de détails déjà restituées sous forme de question/réponse lisible : inutile de les répéter en brut. */
export function describedDetailKeys(details: Record<string, unknown> | null | undefined, context: { country?: string | null; projectType?: string | null } = {}): Set<string> {
  if (!details || typeof details.programId !== "string" || !isProjectKind(context.projectType)) return new Set();
  return new Set(describeProjectDetails({ country: context.country, projectType: context.projectType }, details).map((item) => item.key));
}

export function collectDeclaredResponses(
  details: Record<string, unknown> | null | undefined,
  context: { country?: string | null; projectType?: string | null } = {},
  limit: number = MAX_DECLARED_RESPONSES,
): DeclaredResponse[] {
  if (!details) return [];
  const responses: DeclaredResponse[] = [];
  const seen = new Set<string>();
  const push = (question: unknown, answer: unknown) => {
    const q = typeof question === "string" ? question.trim() : "";
    const a = typeof answer === "string" ? answer.trim() : "";
    if (!q || !a || seen.has(q)) return;
    seen.add(q);
    responses.push({ question: q.slice(0, 260), answer: a.slice(0, 1000) });
  };
  // Formulaire dynamique : questions et réponses reconstruites depuis les clés enregistrées.
  if (typeof details.programId === "string" && isProjectKind(context.projectType)) {
    for (const item of describeProjectDetails({ country: context.country, projectType: context.projectType }, details)) push(item.question, item.answer);
  }
  // Questions complémentaires proposées par l'IA (parcours public) : conservées à leur tour.
  if (Array.isArray(details.dynamicResponses)) {
    for (const entry of details.dynamicResponses) {
      if (entry && typeof entry === "object") push((entry as Record<string, unknown>).question, (entry as Record<string, unknown>).answer);
    }
  }
  return responses.slice(0, limit);
}
