/**
 * « Votre prochaine étape » : UNE action claire pour le candidat, déduite des données déjà synchronisées avec
 * le back-office. Logique pure : ordre de priorité explicite, aucune promesse, aucun délai inventé.
 */

export type NextStepAction =
  | { kind: "evaluation" }
  | { kind: "section"; section: "dossier" | "documents" | "signatures" }
  | { kind: "anchor"; elementId: string }
  | { kind: "none" };

export type NextStep = {
  id: string;
  tone: "action" | "info" | "done";
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string | null;
  action: NextStepAction;
};

export type NextStepInput = {
  evaluationRequired: boolean;
  /** Étape de l'évaluation à validation administrateur, quand elle existe. */
  evaluationStage?: "not_started" | "pending" | "info_requested" | "published";
  /** Faux quand le CV manque : l'évaluation ne peut pas être finalisée sans lui. */
  cvOnFile?: boolean;
  agreementSignatureRequired: boolean;
  /** Pièces des dossiers du candidat (statuts du back-office). */
  requirements?: unknown;
};

export const EVALUATION_ANCHOR_ID = "evaluation-status";

const list = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];

const plural = (count: number, one: string, many: string) => (count > 1 ? many : one);

export function computeNextStep(input: NextStepInput): NextStep {
  if (input.evaluationRequired) {
    return { id: "evaluation-required", tone: "action", eyebrow: "À faire maintenant", title: "Terminez votre évaluation", description: "Elle précise votre destination et votre projet : sans elle, il n’y a ni pièces à demander ni dossier à suivre.", actionLabel: "Faire mon évaluation", action: { kind: "evaluation" } };
  }
  if (input.evaluationStage === "info_requested") {
    return { id: "evaluation-info", tone: "action", eyebrow: "L’équipe attend votre réponse", title: "Répondez à la demande de complément", description: "Votre analyse est en pause tant que ces informations manquent. Cela prend quelques minutes.", actionLabel: "Voir la demande", action: { kind: "anchor", elementId: EVALUATION_ANCHOR_ID } };
  }
  // (« info_requested » est déjà traité plus haut : la demande de complément prime sur le CV manquant)
  if (input.evaluationStage === "pending" && input.cvOnFile === false) {
    return { id: "cv-missing", tone: "action", eyebrow: "À faire maintenant", title: "Ajoutez votre CV", description: "Votre évaluation ne peut pas être finalisée sans votre CV (PDF, JPG ou PNG, 5 Mo maximum).", actionLabel: "Ajouter mon CV", action: { kind: "anchor", elementId: EVALUATION_ANCHOR_ID } };
  }
  if (input.agreementSignatureRequired) {
    return { id: "agreement", tone: "action", eyebrow: "Paiement confirmé", title: "Signez votre protocole d’accord", description: "C’est l’étape qui précède le traitement humain de votre dossier.", actionLabel: "Ouvrir le protocole", action: { kind: "section", section: "dossier" } };
  }

  const requirements = list(input.requirements).filter((item) => item.isRequired !== false);
  const rejected = requirements.filter((item) => item.status === "rejected").length;
  if (rejected > 0) {
    return { id: "documents-rejected", tone: "action", eyebrow: "Une pièce doit être corrigée", title: `Corrigez ${rejected} ${plural(rejected, "pièce refusée", "pièces refusées")}`, description: "Le commentaire de l’équipe explique ce qui manque. Déposez une nouvelle version depuis votre checklist.", actionLabel: "Ouvrir mes documents", action: { kind: "section", section: "documents" } };
  }
  const pending = requirements.filter((item) => item.status === "pending").length;
  if (pending > 0) {
    return { id: "documents-pending", tone: "action", eyebrow: "Documents demandés", title: `Déposez ${pending} ${plural(pending, "pièce", "pièces")}`, description: "Chaque pièce déposée est vérifiée par un conseiller ; vous êtes averti dès qu’elle est validée ou à corriger.", actionLabel: "Ouvrir mes documents", action: { kind: "section", section: "documents" } };
  }
  if (input.evaluationStage === "published") {
    return { id: "evaluation-published", tone: "info", eyebrow: "Votre évaluation est prête", title: "Consultez votre rapport", description: "Il a été relu et validé par notre équipe. Parlez-en à un conseiller pour préparer la suite.", actionLabel: "Voir mon évaluation", action: { kind: "anchor", elementId: EVALUATION_ANCHOR_ID } };
  }
  if (input.evaluationStage === "pending") {
    return { id: "waiting-review", tone: "info", eyebrow: "En cours d’examen", title: "Votre évaluation est examinée par notre équipe", description: "Rien à faire de votre côté pour l’instant. Vous serez averti ici dès qu’elle sera publiée.", actionLabel: null, action: { kind: "none" } };
  }
  return { id: "all-clear", tone: "done", eyebrow: "Tout est à jour", title: "Aucune action n’est attendue de votre part", description: "Nous vous avertirons ici dès qu’il y aura du nouveau. Une question ? Écrivez-nous sur WhatsApp.", actionLabel: null, action: { kind: "none" } };
}
