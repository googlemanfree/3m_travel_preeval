/**
 * Catalogue des 5 étapes admin Kanban — libellés, détails et phase client correspondante.
 * Source unique pour le sélecteur de statut et la « prochaine action utile ».
 */

import type { AdminOperationalStage } from "./adminProcedureJourney";
import type { ClientDossierPhase } from "./clientDossierPhases";
import { detectAdminProcedureKind, type AdminProcedureKind } from "./adminDynamicPilotage";
import { buildApprovalPrerequisitesChecklist, type ApprovalChecklist } from "./approvalChecklist";

export type AdminStageDefinition = {
  stage: AdminOperationalStage;
  /** Libellé court dans le sélecteur / Kanban. */
  label: string;
  /** Sous-titre métier (ce que l’admin doit avoir fait). */
  detail: string;
  /** Ce que le client verra après validation de cette étape. */
  clientPhase: ClientDossierPhase;
  clientLabel: string;
  /** Prérequis affichés dans l’UI avant validation. */
  prerequisites: string[];
};

export const ADMIN_STAGE_CATALOG: Record<AdminOperationalStage, AdminStageDefinition> = {
  PENDING_48H: {
    stage: "PENDING_48H",
    label: "Évaluation",
    detail: "Qualifier le profil, préparer ou valider le bilan d’évaluation.",
    clientPhase: "evaluation",
    clientLabel: "Évaluation en cours",
    prerequisites: ["Identité et projet vérifiés", "Bilan en préparation ou déjà remis"],
  },
  PUBLISHED: {
    stage: "PUBLISHED",
    label: "Ouverture (bilan & paiement)",
    detail: "Bilan remis au candidat ; paiement d’ouverture et protocole N°01 à suivre.",
    clientPhase: "opening",
    clientLabel: "Ouverture du dossier",
    prerequisites: ["Bilan d’évaluation remis", "Paiement d’ouverture confirmé avant documents"],
  },
  DOCUMENTS_CHECK: {
    stage: "DOCUMENTS_CHECK",
    label: "Documents",
    detail: "Collecte et contrôle des pièces de la procédure (pays / visa).",
    clientPhase: "documents",
    clientLabel: "Documents à compléter",
    prerequisites: ["Paiement confirmé", "Protocole N°01 signé", "Bilan confirmé par le candidat"],
  },
  SUBMITTED: {
    stage: "SUBMITTED",
    label: "Suivi & dépôt",
    detail: "Dossier transmis / suivi partenaires, employeur, portail ou autorité selon la procédure.",
    clientPhase: "processing",
    clientLabel: "Traitement en cours",
    prerequisites: ["Pièces essentielles reçues ou validées", "Checklist procédure ≥ 80 %"],
  },
  APPROVED: {
    stage: "APPROVED",
    label: "Décision favorable",
    detail: "Clôture positive uniquement quand les prérequis métier (employeur pour le travail, etc.) sont remplis.",
    clientPhase: "approved",
    clientLabel: "Décision favorable",
    prerequisites: ["Parcours soumis / suivi abouti", "Pour visa travail : employeur / partenaire sélectionné", "Protocole N°02 signé s’il a été proposé"],
  },
};

export const ADMIN_STAGE_SEQUENCE: AdminOperationalStage[] = [
  "PENDING_48H",
  "PUBLISHED",
  "DOCUMENTS_CHECK",
  "SUBMITTED",
  "APPROVED",
];

export function adminStageLabel(stage: string | null | undefined): string {
  const key = String(stage ?? "") as AdminOperationalStage;
  return ADMIN_STAGE_CATALOG[key]?.label ?? String(stage ?? "");
}

export function adminStageDetail(stage: string | null | undefined): string {
  const key = String(stage ?? "") as AdminOperationalStage;
  return ADMIN_STAGE_CATALOG[key]?.detail ?? "";
}

export function getNextAdminStage(status?: string | null): AdminOperationalStage | null {
  const currentIndex = ADMIN_STAGE_SEQUENCE.indexOf(status as AdminOperationalStage);
  if (currentIndex < 0) return "PENDING_48H";
  return ADMIN_STAGE_SEQUENCE[currentIndex + 1] ?? null;
}

export function getPreviousAdminStage(status?: string | null): AdminOperationalStage | null {
  const currentIndex = ADMIN_STAGE_SEQUENCE.indexOf(status as AdminOperationalStage);
  if (currentIndex <= 0) return null;
  return ADMIN_STAGE_SEQUENCE[currentIndex - 1] ?? null;
}

export type GuidedNextAction = {
  /** true = on peut appeler updateCandidateStatus avec nextStage */
  canAdvance: boolean;
  nextStage: AdminOperationalStage | null;
  /** Sous-étape métier affichée sans changer le statut Kanban stocké. */
  subStage: "none" | "employer_placement" | "awaiting_protocol_two";
  /** Libellé du bouton principal */
  buttonLabel: string;
  /** Explication sous le bouton */
  reason: string;
  /** Onglet 360° à ouvrir si l’action n’est pas un simple avancement de statut */
  focusTab?: "overview" | "evaluation" | "documents" | "payments" | "messages";
  code: "advance" | "payment" | "employer_selection" | "protocol_two" | "documents" | "done";
  /** Checklist avant décision favorable (lecture seule). */
  approvalChecklist: ApprovalChecklist | null;
};

/**
 * Prochaine action guidée cohérente : n’affiche jamais « Visa / Décision favorable »
 * tant que la sélection employeur manque sur une procédure travail.
 * Ne réécrit aucun statut de dossier actif.
 */
export function resolveGuidedNextAdminAction(input: {
  currentStatus?: string | null;
  paymentConfirmed?: boolean;
  protocolSigned?: boolean;
  evaluationDelivered?: boolean;
  documentsReady?: boolean;
  checklistPercent?: number | null;
  procedureKind?: AdminProcedureKind | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  employerSelected?: boolean;
  secondProtocolReady?: boolean;
  secondProtocolSigned?: boolean;
}): GuidedNextAction {
  const kind = input.procedureKind ?? detectAdminProcedureKind(input.visaType, input.procedureLabel);
  const nextStage = getNextAdminStage(input.currentStatus);
  const approvalChecklist = nextStage === "APPROVED" || input.currentStatus === "SUBMITTED"
    ? buildApprovalPrerequisitesChecklist({
      paymentConfirmed: input.paymentConfirmed,
      protocolSigned: input.protocolSigned,
      evaluationDelivered: input.evaluationDelivered,
      documentsReady: input.documentsReady,
      checklistPercent: input.checklistPercent,
      procedureKind: kind,
      employerSelected: input.employerSelected,
      secondProtocolReady: input.secondProtocolReady,
      secondProtocolSigned: input.secondProtocolSigned,
    })
    : null;

  if (!input.paymentConfirmed) {
    return {
      canAdvance: false,
      nextStage,
      subStage: "none",
      buttonLabel: "Valider d’abord le paiement",
      reason: "Le paiement d’ouverture doit être confirmé avant d’avancer les étapes.",
      focusTab: "payments",
      code: "payment",
      approvalChecklist,
    };
  }

  if (!nextStage) {
    return {
      canAdvance: false,
      nextStage: null,
      subStage: "none",
      buttonLabel: "Parcours à jour",
      reason: "Aucune étape Kanban suivante pour ce dossier.",
      code: "done",
      approvalChecklist,
    };
  }

  // Sous-étape Placement (affichage seul) tant que le Kanban est SUBMITTED et l’employeur manque.
  if (
    (input.currentStatus === "SUBMITTED" || nextStage === "APPROVED")
    && kind === "work"
    && !input.employerSelected
  ) {
    return {
      canAdvance: false,
      nextStage,
      subStage: "employer_placement",
      buttonLabel: "Sous-étape : enregistrer l’employeur / partenaire",
      reason: "Placement / employeur — étape intermédiaire sans modifier le statut Kanban du dossier actif. Enregistrez la sélection puis reprenez.",
      focusTab: "evaluation",
      code: "employer_selection",
      approvalChecklist,
    };
  }

  if (nextStage === "APPROVED" && input.secondProtocolReady && !input.secondProtocolSigned) {
    return {
      canAdvance: false,
      nextStage,
      subStage: "awaiting_protocol_two",
      buttonLabel: "Attendre la signature du Protocole N°02",
      reason: "Le Protocole N°02 a été proposé : le candidat doit le signer avant la décision favorable.",
      focusTab: "evaluation",
      code: "protocol_two",
      approvalChecklist,
    };
  }

  if (nextStage === "APPROVED" && approvalChecklist && !approvalChecklist.ready) {
    return {
      canAdvance: false,
      nextStage,
      subStage: kind === "work" ? "employer_placement" : "none",
      buttonLabel: "Compléter les prérequis avant décision",
      reason: `Manque : ${approvalChecklist.missingRequired.join(" · ")}.`,
      focusTab: "overview",
      code: "documents",
      approvalChecklist,
    };
  }

  const def = ADMIN_STAGE_CATALOG[nextStage];
  return {
    canAdvance: true,
    nextStage,
    subStage: "none",
    buttonLabel: `Étape suivante : ${def.label}`,
    reason: `${def.detail} Côté client : « ${def.clientLabel} ».`,
    code: "advance",
    approvalChecklist,
  };
}
