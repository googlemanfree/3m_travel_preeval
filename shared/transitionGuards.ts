/**
 * Gardes de transition admin : empêchent de sauter une étape métier
 * (paiement, protocole, documents, employeur) même si la séquence Kanban est respectée.
 */

import type { AdminOperationalStage } from "./adminProcedureJourney";
import type { AdminProcedureKind } from "./adminDynamicPilotage";

export type TransitionGuardInput = {
  targetStage: AdminOperationalStage;
  paymentConfirmed?: boolean;
  protocolSigned?: boolean;
  evaluationDelivered?: boolean;
  evaluationClientConfirmed?: boolean;
  pendingRequiredDocuments?: number;
  checklistPercent?: number | null;
  secondProtocolReady?: boolean;
  secondProtocolSigned?: boolean;
  /** Employeur / partenaire d’accueil déjà enregistré (sélection validée). */
  employerSelected?: boolean;
  /** Type de procédure — le travail exige une sélection employeur avant décision favorable. */
  procedureKind?: AdminProcedureKind | null;
};

export type TransitionGuardResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

const PAID_OR_LATER: AdminOperationalStage[] = ["DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"];
const PROTOCOL_OR_LATER: AdminOperationalStage[] = ["DOCUMENTS_CHECK", "SUBMITTED", "APPROVED"];
const DOCS_OR_LATER: AdminOperationalStage[] = ["SUBMITTED", "APPROVED"];

/**
 * Évalue si le passage vers `targetStage` est cohérent avec l’état réel du dossier.
 * Ne remplace pas la séquence stricte (n+1) : il complète les prérequis métier.
 */
export function evaluateAdminStageTransition(input: TransitionGuardInput): TransitionGuardResult {
  const stage = input.targetStage;

  if (stage === "PUBLISHED" && input.evaluationDelivered === false) {
    return {
      ok: false,
      code: "evaluation_not_delivered",
      message: "Remettez d’abord le bilan d’évaluation au candidat avant de publier cette étape.",
    };
  }

  if (PAID_OR_LATER.includes(stage) && !input.paymentConfirmed) {
    return {
      ok: false,
      code: "payment_required",
      message: "Le paiement d’ouverture doit être confirmé avant cette étape.",
    };
  }

  if (PROTOCOL_OR_LATER.includes(stage) && input.protocolSigned === false) {
    return {
      ok: false,
      code: "protocol_required",
      message: "Le Protocole N°01 doit être signé dans l’espace client avant de poursuivre.",
    };
  }

  if (stage === "DOCUMENTS_CHECK" && input.evaluationClientConfirmed === false) {
    return {
      ok: false,
      code: "client_confirmation_required",
      message: "Le candidat doit confirmer la réception du bilan avant la collecte des documents.",
    };
  }

  if (DOCS_OR_LATER.includes(stage)) {
    const pending = input.pendingRequiredDocuments ?? 0;
    const percent = input.checklistPercent;
    if (pending > 0) {
      return {
        ok: false,
        code: "documents_incomplete",
        message: `${pending} pièce(s) requise(s) restent à recevoir ou valider avant la soumission.`,
      };
    }
    if (typeof percent === "number" && percent < 80) {
      return {
        ok: false,
        code: "checklist_incomplete",
        message: `La checklist pays/procédure n’est complète qu’à ${percent} %. Atteignez au moins 80 % avant la soumission.`,
      };
    }
  }

  // Visa / décision favorable : jamais sans sélection employeur sur une procédure travail.
  if (stage === "APPROVED" && input.procedureKind === "work" && !input.employerSelected) {
    return {
      ok: false,
      code: "employer_required",
      message: "Sélectionnez d’abord un employeur / partenaire (Protocole N°02) avant la décision favorable.",
    };
  }

  if (stage === "APPROVED" && input.secondProtocolReady && input.secondProtocolSigned === false) {
    return {
      ok: false,
      code: "protocol_two_required",
      message: "Le Protocole N°02 a été proposé : il doit être signé avant de clôturer en décision favorable.",
    };
  }

  return { ok: true };
}

export function assertAdminStageTransition(input: TransitionGuardInput): void {
  const result = evaluateAdminStageTransition(input);
  if (result.ok === false) {
    const error = new Error(result.message) as Error & { code?: string };
    error.code = result.code;
    throw error;
  }
}
