/**
 * Cockpit dossier unique — composition pure du statut global,
 * des bloqueurs et de la prochaine action admin.
 */

export type CockpitStage =
  | "email_unverified"
  | "awaiting_evaluation"
  | "awaiting_payment"
  | "ready_to_activate"
  | "awaiting_receipt"
  | "awaiting_protocol"
  | "documents_review"
  | "in_progress"
  | "submitted"
  | "completed"
  | "blocked";

export type CockpitBlockerCode =
  | "email_unverified"
  | "evaluation_missing"
  | "evaluation_pending"
  | "payment_missing"
  | "receipt_missing"
  | "protocol_unsigned"
  | "documents_pending"
  | "clarification_pending"
  | "activation_pending";

export type CockpitBlocker = {
  code: CockpitBlockerCode;
  message: string;
  tab?: "evaluation" | "payments" | "documents" | "overview" | "messages";
};

export type CockpitNextAction = {
  key: string;
  label: string;
  description: string;
  urgency: "high" | "normal" | "low";
  tab?: CockpitBlocker["tab"];
};

export type CockpitChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  /**
   * Étape post-paiement (reçu / protocole) : ne doit jamais apparaître
   * comme validée tant que le paiement d’ouverture n’est pas confirmé.
   */
  lockedUntilPayment?: boolean;
};

export type CandidateCockpitView = {
  stage: CockpitStage;
  stageLabel: string;
  nextAction: CockpitNextAction;
  blockers: CockpitBlocker[];
  checklist: CockpitChecklistItem[];
  progressPercent: number;
  canForceActions: Array<"confirm_email" | "validate_evaluation" | "confirm_payment" | "activate_dossier" | "send_protocol">;
};

export type CandidateCockpitInput = {
  emailVerified?: boolean | null;
  evaluationStatus?: "not_declared" | "pending_validation" | "validated" | "refused" | string | null;
  hasEvaluationRecord?: boolean | null;
  paymentConfirmed?: boolean | null;
  receiptApproved?: boolean | null;
  protocolSigned?: boolean | null;
  dossierActivated?: boolean | null;
  pendingDocuments?: number | null;
  /** Au moins une pièce déjà déposée (évite « Documents à jour » vert sur précompte vide). */
  hasAnyDocuments?: boolean | null;
  /** Clarifications documentaires en attente de réponse admin. */
  pendingClarifications?: number | null;
  clarificationOverdue?: boolean | null;
  workflowStatus?: string | null;
  destination?: string | null;
  visaType?: string | null;
};

const STAGE_LABELS: Record<CockpitStage, string> = {
  email_unverified: "E-mail à confirmer",
  awaiting_evaluation: "Évaluation manquante",
  awaiting_payment: "Paiement à valider",
  ready_to_activate: "Prêt à activer",
  awaiting_receipt: "Reçu à préparer",
  awaiting_protocol: "Protocole à faire signer",
  documents_review: "Documents à contrôler",
  in_progress: "Dossier en traitement",
  submitted: "Dossier soumis",
  completed: "Dossier terminé",
  blocked: "Dossier bloqué",
};

function placeSuffix(destination?: string | null, visaType?: string | null): string {
  const place = [destination?.trim(), visaType?.trim()].filter(Boolean).join(" · ");
  return place ? ` — ${place}` : "";
}

/** Compose le cockpit à partir des signaux métier déjà connus côté admin. */
export function buildCandidateCockpit(input: CandidateCockpitInput): CandidateCockpitView {
  const blockers: CockpitBlocker[] = [];
  const emailVerified = input.emailVerified !== false;
  const evaluationValidated = input.evaluationStatus === "validated";
  const evaluationPending = input.evaluationStatus === "pending_validation";
  const hasEvaluation = evaluationValidated || Boolean(input.hasEvaluationRecord) || evaluationPending;
  const paymentConfirmed = Boolean(input.paymentConfirmed);
  const receiptApproved = Boolean(input.receiptApproved);
  const protocolSigned = Boolean(input.protocolSigned);
  const dossierActivated = Boolean(input.dossierActivated);
  const pendingDocuments = Math.max(0, Number(input.pendingDocuments ?? 0));
  const pendingClarifications = Math.max(0, Number(input.pendingClarifications ?? 0));
  const clarificationOverdue = Boolean(input.clarificationOverdue);
  const workflow = (input.workflowStatus ?? "").toLowerCase();
  const place = placeSuffix(input.destination, input.visaType);

  if (!emailVerified) {
    blockers.push({
      code: "email_unverified",
      message: "L’adresse e-mail du compte n’est pas confirmée.",
      tab: "overview",
    });
  }
  if (!hasEvaluation && !evaluationValidated) {
    blockers.push({
      code: "evaluation_missing",
      message: "Aucune évaluation n’est enregistrée pour ce compte.",
      tab: "evaluation",
    });
  } else if (evaluationPending) {
    blockers.push({
      code: "evaluation_pending",
      message: "Une évaluation déclarée attend la validation d’un conseiller.",
      tab: "evaluation",
    });
  }
  if (!paymentConfirmed) {
    blockers.push({
      code: "payment_missing",
      message: "Les frais d’ouverture ne sont pas encore validés.",
      tab: "payments",
    });
  }
  if (paymentConfirmed && !receiptApproved) {
    blockers.push({
      code: "receipt_missing",
      message: "Le reçu de paiement n’est pas encore approuvé / envoyé.",
      tab: "payments",
    });
  }
  if (paymentConfirmed && !protocolSigned) {
    blockers.push({
      code: "protocol_unsigned",
      message: "Le protocole d’accord n’est pas encore signé.",
      // Le panneau d’envoi / préparation du protocole vit dans l’onglet Évaluation (360°).
      tab: "evaluation",
    });
  }
  if (dossierActivated && pendingDocuments > 0) {
    blockers.push({
      code: "documents_pending",
      message: `${pendingDocuments} document(s) restent à contrôler.`,
      tab: "documents",
    });
  }
  if (pendingClarifications > 0) {
    blockers.push({
      code: "clarification_pending",
      message: clarificationOverdue
        ? `${pendingClarifications} clarification(s) documentaire(s) en retard de réponse.`
        : `${pendingClarifications} clarification(s) documentaire(s) en attente de réponse.`,
      tab: "documents",
    });
  }
  if (evaluationValidated && paymentConfirmed && !dossierActivated) {
    blockers.push({
      code: "activation_pending",
      message: "Le dossier officiel 3M n’est pas encore activé.",
      tab: "overview",
    });
  }

  let stage: CockpitStage = "in_progress";
  if (!emailVerified) stage = "email_unverified";
  else if (!hasEvaluation && !evaluationValidated) stage = "awaiting_evaluation";
  else if (evaluationPending) stage = "awaiting_evaluation";
  else if (!paymentConfirmed) stage = "awaiting_payment";
  else if (!dossierActivated) stage = "ready_to_activate";
  else if (!receiptApproved) stage = "awaiting_receipt";
  else if (!protocolSigned) stage = "awaiting_protocol";
  else if (pendingDocuments > 0) stage = "documents_review";
  else if (/(submitted|soumis)/.test(workflow)) stage = "submitted";
  else if (/(completed|closed|approuve|approved)/.test(workflow)) stage = "completed";
  else if (/(rejected|refuse|refused)/.test(workflow)) stage = "blocked";
  else stage = "in_progress";

  const hasAnyDocuments = Boolean(input.hasAnyDocuments) || pendingDocuments > 0;
  // Reçu / protocole N°01 : uniquement après paiement d’ouverture réel.
  // Jamais de faux vert sur précompte (même si un signal parasite arrive trop tôt).
  const checklist: CockpitChecklistItem[] = [
    { key: "email", label: "E-mail confirmé", done: emailVerified },
    { key: "evaluation", label: "Évaluation validée", done: evaluationValidated },
    { key: "payment", label: "Paiement validé", done: paymentConfirmed },
    { key: "activation", label: "Dossier activé (3M-)", done: dossierActivated },
    {
      key: "receipt",
      label: "Reçu approuvé",
      done: paymentConfirmed && receiptApproved,
      lockedUntilPayment: !paymentConfirmed,
    },
    {
      key: "protocol",
      label: "Protocole signé",
      done: paymentConfirmed && protocolSigned,
      lockedUntilPayment: !paymentConfirmed,
    },
    {
      key: "documents",
      label: "Documents à jour",
      // Précompte sans pièce : pas « à jour ». Après activation, 0 pièce en attente = OK.
      done: pendingDocuments === 0 && (dossierActivated || hasAnyDocuments),
    },
  ];
  const applicableChecklist = checklist.filter((item) => !item.lockedUntilPayment);
  const doneCount = applicableChecklist.filter((item) => item.done).length;
  const progressPercent = applicableChecklist.length
    ? Math.round((doneCount / applicableChecklist.length) * 100)
    : 0;

  let nextAction = resolveNextAction(stage, blockers, place);
  // Une fois le dossier en traitement / documents, une clarification en attente prime sur « poursuivre ».
  if (
    pendingClarifications > 0
    && (stage === "documents_review" || stage === "in_progress")
  ) {
    nextAction = {
      key: "answer_clarification",
      label: clarificationOverdue
        ? `Répondre aux clarifications en retard${place}`
        : `Répondre aux clarifications${place}`,
      description: clarificationOverdue
        ? `${pendingClarifications} demande(s) dépassent l’échéance interne — le candidat attend une réponse.`
        : `${pendingClarifications} demande(s) de précision du candidat attendent une réponse.`,
      urgency: clarificationOverdue ? "high" : "normal",
      tab: "documents",
    };
  }
  const canForceActions: CandidateCockpitView["canForceActions"] = [];
  if (!emailVerified) canForceActions.push("confirm_email");
  if (!evaluationValidated) canForceActions.push("validate_evaluation");
  if (!paymentConfirmed) canForceActions.push("confirm_payment");
  if (evaluationValidated && paymentConfirmed && !dossierActivated) canForceActions.push("activate_dossier");
  if (paymentConfirmed && !protocolSigned) canForceActions.push("send_protocol");

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    nextAction,
    blockers,
    checklist,
    progressPercent,
    canForceActions,
  };
}

function resolveNextAction(stage: CockpitStage, blockers: CockpitBlocker[], place: string): CockpitNextAction {
  const primary = blockers[0];
  switch (stage) {
    case "email_unverified":
      return {
        key: "confirm_email",
        label: `Confirmer l’e-mail${place}`,
        description: "Renvoyer le lien ou confirmer manuellement après vérification d’identité.",
        urgency: "high",
        tab: "overview",
      };
    case "awaiting_evaluation":
      return {
        key: primary?.code === "evaluation_pending" ? "review_evaluation" : "request_evaluation",
        label: primary?.code === "evaluation_pending" ? `Valider l’évaluation déclarée${place}` : `Obtenir l’évaluation${place}`,
        description: primary?.message ?? "Relancer le candidat ou valider une évaluation hors ligne.",
        urgency: "high",
        tab: "evaluation",
      };
    case "awaiting_payment":
      return {
        key: "confirm_payment",
        label: `Valider le paiement${place}`,
        description: "Contrôler la preuve ou la référence avant d’activer le dossier.",
        urgency: "high",
        tab: "payments",
      };
    case "ready_to_activate":
      return {
        key: "activate_dossier",
        label: `Activer le dossier officiel${place}`,
        description: "Basculer COMPTE-… vers le numéro 3M- et ouvrir le suivi.",
        urgency: "high",
        tab: "overview",
      };
    case "awaiting_receipt":
      return {
        key: "approve_receipt",
        label: `Approuver / envoyer le reçu${place}`,
        description: "Valider et signer le reçu, imprimer l’A5 caisse, ou renvoyer le PDF au client.",
        urgency: "normal",
        tab: "payments",
      };
    case "awaiting_protocol":
      return {
        key: "send_protocol",
        label: `Faire signer le protocole${place}`,
        description: "Relancer la signature (e-mail + WhatsApp) ou renvoyer l’accès espace client.",
        urgency: "high",
        tab: "evaluation",
      };
    case "documents_review":
      return {
        key: "review_documents",
        label: `Contrôler les documents${place}`,
        description: primary?.message ?? "Vérifier les pièces déposées par le candidat.",
        urgency: "high",
        tab: "documents",
      };
    case "submitted":
      return {
        key: "follow_submission",
        label: `Suivre la soumission${place}`,
        description: "Contrôler le retour partenaire / autorité compétente.",
        urgency: "normal",
        tab: "overview",
      };
    case "completed":
      return {
        key: "archive_followup",
        label: `Clôturer / préparer la suite${place}`,
        description: "Aucune action bloquante. Vérifier les éventuelles suites (départ, P02).",
        urgency: "low",
        tab: "overview",
      };
    case "blocked":
      return {
        key: "unblock",
        label: `Débloquer le dossier${place}`,
        description: primary?.message ?? "Analyser le motif de blocage et reprendre le traitement.",
        urgency: "high",
        tab: "overview",
      };
    default:
      return {
        key: "continue",
        label: `Poursuivre le traitement${place}`,
        description: primary?.message ?? "Ouvrir la fiche 360° et traiter la prochaine étape du parcours.",
        urgency: "normal",
        tab: primary?.tab ?? "overview",
      };
  }
}

export type CockpitQueueCategory =
  | "email_unverified"
  | "no_evaluation"
  | "payment_pending"
  | "ready_to_activate"
  | "protocol_pending"
  | "documents_pending";

export function cockpitQueueCategory(stage: CockpitStage): CockpitQueueCategory | null {
  switch (stage) {
    case "email_unverified":
      return "email_unverified";
    case "awaiting_evaluation":
      return "no_evaluation";
    case "awaiting_payment":
      return "payment_pending";
    case "ready_to_activate":
      return "ready_to_activate";
    case "awaiting_protocol":
    case "awaiting_receipt":
      return "protocol_pending";
    case "documents_review":
      return "documents_pending";
    default:
      return null;
  }
}

export const COCKPIT_QUEUE_LABELS: Record<CockpitQueueCategory, string> = {
  email_unverified: "E-mails à confirmer",
  no_evaluation: "Sans évaluation",
  payment_pending: "Paiements à valider",
  ready_to_activate: "Prêts à activer",
  protocol_pending: "Protocoles / reçus",
  documents_pending: "Documents à contrôler",
};

/** Ancres DOM ciblées par « Traiter maintenant » dans la fiche 360°. */
export function cockpitTreatFocusId(key: string): string {
  switch (key) {
    case "protocol_unsigned":
    case "send_protocol":
      // Barre Relancer / Accès en tête du panneau protocole (360°).
      return "candidate360-protocol-relance";
    case "documents_pending":
    case "review_documents":
      return "candidate360-documents-panel";
    case "clarification_pending":
    case "answer_clarification":
      return "candidate360-clarifications-panel";
    case "payment_missing":
    case "confirm_payment":
      return "candidate360-payments-panel";
    case "receipt_missing":
    case "approve_receipt":
      // Barre Valider / A5 / PDF en tête du panneau paiements (360°).
      return "candidate360-receipt-actions";
    case "evaluation_missing":
    case "evaluation_pending":
    case "review_evaluation":
    case "request_evaluation":
    case "validate_evaluation":
      return "candidate360-evaluation-panel";
    case "activation_pending":
    case "activate_dossier":
    case "confirm_email":
    case "email_unverified":
      return "candidate360-overview-summary";
    default:
      return "candidate-360-tabs";
  }
}

/** Libellé d’onglet pour le feedback utilisateur. */
export function cockpitTabLabel(tab: CockpitBlocker["tab"] | undefined): string {
  switch (tab) {
    case "evaluation":
      return "Évaluation / protocole";
    case "payments":
      return "Paiements";
    case "documents":
      return "Documents";
    case "messages":
      return "Échanges";
    case "overview":
    default:
      return "Vue d’ensemble";
  }
}
