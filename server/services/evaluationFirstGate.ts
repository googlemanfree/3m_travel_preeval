import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { evaluations } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Règle « évaluation d'abord » : tant qu'un candidat n'a ni évaluation envoyée ni évaluation déclarée et
 * validée, l'espace candidat ferme les onglets Dossier et Documents (EvaluationSpace.tsx, `evaluationRequired`).
 * Ce contrôle applique la même règle côté serveur aux actions d'écriture du candidat : la fermeture des onglets
 * seule se contourne par un appel direct à l'API.
 *
 * Même condition que l'écran : aucune évaluation ET déclaration ni validée ni en attente de validation.
 */
export const EVALUATION_FIRST_MESSAGE =
  "Complétez d’abord votre évaluation : elle est nécessaire avant de déposer des documents ou d’activer votre dossier. Rendez-vous dans l’onglet « Évaluation » de votre espace.";

export type EvaluationDeclarationStatus = "not_declared" | "pending_validation" | "validated" | "refused";

export function evaluationFirstGateActive(input: { declarationStatus: EvaluationDeclarationStatus | string | null | undefined; hasEvaluation: boolean }): boolean {
  if (input.hasEvaluation) return false;
  return input.declarationStatus === "not_declared" || input.declarationStatus === "refused";
}

/** Lève FORBIDDEN si le candidat n'a pas encore fait son évaluation. */
export async function assertEvaluationCompleted(candidate: { email: string; evaluationDeclarationStatus?: string | null }): Promise<void> {
  // Déclaration validée ou en attente : pas de lecture en base nécessaire.
  if (candidate.evaluationDeclarationStatus === "validated" || candidate.evaluationDeclarationStatus === "pending_validation") return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const [existing] = await db.select({ id: evaluations.id }).from(evaluations).where(eq(evaluations.email, candidate.email)).limit(1);
  if (evaluationFirstGateActive({ declarationStatus: candidate.evaluationDeclarationStatus, hasEvaluation: Boolean(existing) })) {
    throw new TRPCError({ code: "FORBIDDEN", message: EVALUATION_FIRST_MESSAGE });
  }
}
