/**
 * « Votre prochaine étape » : UNE action claire pour le candidat, déduite des données déjà synchronisées avec
 * le back-office. Logique pure : ordre de priorité explicite, aucune promesse, aucun délai inventé.
 * Lecture seule — ne modifie jamais un dossier actif.
 */

export type NextStepAction =
  | { kind: "evaluation" }
  | { kind: "section"; section: "dossier" | "documents" | "signatures" | "notifications" | "messages" | "overview" | "profile" }
  | { kind: "anchor"; elementId: string }
  | { kind: "link"; href: string }
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
  /** Frais d’ouverture demandés et pas encore confirmés par l’agence. */
  paymentDue?: boolean;
  /** Lien de paiement (référence dossier), si paymentDue. */
  paymentHref?: string | null;
  agreementSignatureRequired: boolean;
  /** Pièces des dossiers du candidat (statuts du back-office). */
  requirements?: unknown;
  /**
   * État de la checklist du pays et du type de visa du candidat. Sans lui, un candidat sans demande individuelle de son conseiller
   * lisait « aucune action attendue » alors que sa checklist était vide.
   */
  checklist?: { total: number; missing: number; replace: number; firstMissingLabel?: string | null; firstReplaceLabel?: string | null };
  /**
   * Clarification documentaire : le conseiller a répondu, le candidat peut déposer la pièce.
   * Prioritaire sur la checklist générique (sinon « tout est à jour » alors qu’un dépôt est attendu).
   */
  clarificationUpload?: { documentLabel: string } | null;
  /** Demandes de précision encore en attente de réponse de l’agence (info, non bloquant). */
  pendingClarificationCount?: number;
  /**
   * Photo type passeport demandée (dossier travail / demande admin) — pas encore déposée.
   * Sinon « Tout est à jour » peut coexister avec la bannière ambre du profil.
   */
  passportPhotoRequired?: boolean;
  /** Notifications durables non lues (boîte /mon-espace). */
  unreadNotifications?: number;
  /** Messages conseiller non lus. */
  unreadMessages?: number;
  /** Lien WhatsApp conseiller (affiché quand il n’y a plus d’action bloquante). */
  advisorWhatsAppUrl?: string | null;
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
  if (input.paymentDue) {
    return {
      id: "payment-due",
      tone: "action",
      eyebrow: "À faire maintenant",
      title: "Réglez les frais d’ouverture",
      description: "Le paiement est pris en compte uniquement quand l’agence le confirme. Utilisez la référence de votre dossier pour tout dépôt ou virement.",
      actionLabel: "Comment payer",
      action: input.paymentHref ? { kind: "link", href: input.paymentHref } : { kind: "section", section: "overview" },
    };
  }
  if (input.agreementSignatureRequired) {
    return { id: "agreement", tone: "action", eyebrow: "Paiement confirmé", title: "Signez votre protocole d’accord", description: "C’est l’étape qui précède le traitement humain de votre dossier.", actionLabel: "Ouvrir le protocole", action: { kind: "section", section: "dossier" } };
  }

  if (input.passportPhotoRequired) {
    return {
      id: "passport-photo",
      tone: "action",
      eyebrow: "À faire maintenant",
      title: "Déposez votre photo type passeport",
      description: "Fond uni clair, visage de face. Cette photo remplace votre photo de profil pour les employeurs et agences de placement.",
      actionLabel: "Déposer ma photo",
      action: { kind: "section", section: "profile" },
    };
  }

  const clarificationUpload = input.clarificationUpload;
  if (clarificationUpload?.documentLabel?.trim()) {
    const label = clarificationUpload.documentLabel.trim();
    return {
      id: "clarification-upload",
      tone: "action",
      eyebrow: "Réponse du conseiller reçue",
      title: "Déposez la pièce demandée",
      description: `Une précision a été apportée pour « ${label} ». Déposez maintenant la version attendue depuis vos documents.`,
      actionLabel: "Déposer la pièce",
      action: { kind: "section", section: "documents" },
    };
  }

  const requirements = list(input.requirements).filter((item) => item.isRequired !== false);
  const rejected = requirements.filter((item) => item.status === "rejected").length;
  if (rejected > 0) {
    return { id: "documents-rejected", tone: "action", eyebrow: "Une pièce doit être corrigée", title: `Corrigez ${rejected} ${plural(rejected, "pièce refusée", "pièces refusées")}`, description: "Le commentaire de l’équipe explique ce qui manque. Déposez une nouvelle version depuis votre checklist.", actionLabel: "Ouvrir mes documents", action: { kind: "section", section: "documents" } };
  }
  // Pièces à corriger dans la checklist du pays et du visa (rejetées par l'agence).
  const checklist = input.checklist;
  if (checklist && checklist.replace > 0) {
    return { id: "checklist-replace", tone: "action", eyebrow: "Une pièce doit être corrigée", title: `Corrigez ${checklist.replace} ${plural(checklist.replace, "pièce refusée", "pièces refusées")}`, description: `${checklist.firstReplaceLabel ? `Commencez par : ${checklist.firstReplaceLabel}. ` : ""}Envoyez une nouvelle version en un geste depuis votre checklist.`, actionLabel: "Envoyer la nouvelle version", action: { kind: "section", section: "documents" } };
  }
  const pending = requirements.filter((item) => item.status === "pending").length;
  if (checklist && pending === 0 && checklist.missing > 0) {
    const received = Math.max(0, checklist.total - checklist.missing);
    return { id: "checklist-missing", tone: "action", eyebrow: "Vos documents", title: `Envoyez ${checklist.missing} ${plural(checklist.missing, "pièce", "pièces")} de votre checklist`, description: `${received} sur ${checklist.total} déjà reçues.${checklist.firstMissingLabel ? ` Prochaine pièce : ${checklist.firstMissingLabel}.` : ""} Chaque pièce s’envoie en un geste, photo du téléphone comprise.`, actionLabel: "Envoyer mes documents", action: { kind: "section", section: "documents" } };
  }
  if (pending > 0) {
    return { id: "documents-pending", tone: "action", eyebrow: "Documents demandés", title: `Déposez ${pending} ${plural(pending, "pièce", "pièces")}`, description: "Chaque pièce déposée est vérifiée par un conseiller ; vous êtes averti dès qu’elle est validée ou à corriger.", actionLabel: "Ouvrir mes documents", action: { kind: "section", section: "documents" } };
  }

  const unreadNotifications = Math.max(0, Number(input.unreadNotifications) || 0);
  if (unreadNotifications > 0) {
    return {
      id: "notifications-unread",
      tone: "action",
      eyebrow: "À lire",
      title: `Lisez ${unreadNotifications} ${plural(unreadNotifications, "notification", "notifications")}`,
      description: "Nouveaux documents, étapes ou messages de l’agence. Rien n’est modifié dans votre dossier sans votre action.",
      actionLabel: "Ouvrir mes notifications",
      action: { kind: "section", section: "notifications" },
    };
  }

  const unreadMessages = Math.max(0, Number(input.unreadMessages) || 0);
  if (unreadMessages > 0) {
    return {
      id: "messages-unread",
      tone: "action",
      eyebrow: "Message du conseiller",
      title: `Lisez ${unreadMessages} ${plural(unreadMessages, "message", "messages")}`,
      description: "Votre conseiller a répondu. Consultez la messagerie pour la suite de votre dossier.",
      actionLabel: "Ouvrir la messagerie",
      action: { kind: "section", section: "messages" },
    };
  }

  const pendingClarifications = Math.max(0, Number(input.pendingClarificationCount) || 0);
  if (pendingClarifications > 0) {
    return {
      id: "clarification-pending",
      tone: "info",
      eyebrow: "Demande en cours",
      title: pendingClarifications === 1
        ? "Votre demande de précision est examinée"
        : `${pendingClarifications} demandes de précision sont examinées`,
      description: "L’équipe vous répondra dans votre espace documents. Rien d’autre n’est attendu de votre part pour l’instant.",
      actionLabel: "Voir mes documents",
      action: { kind: "section", section: "documents" },
    };
  }

  if (input.evaluationStage === "published") {
    return { id: "evaluation-published", tone: "info", eyebrow: "Votre évaluation est prête", title: "Consultez votre rapport", description: "Il a été relu et validé par notre équipe. Parlez-en à un conseiller pour préparer la suite.", actionLabel: "Voir mon évaluation", action: { kind: "anchor", elementId: EVALUATION_ANCHOR_ID } };
  }
  if (input.evaluationStage === "pending") {
    return { id: "waiting-review", tone: "info", eyebrow: "En cours d’examen", title: "Votre évaluation est examinée par notre équipe", description: "Rien à faire de votre côté pour l’instant. Vous serez averti ici dès qu’elle sera publiée.", actionLabel: input.advisorWhatsAppUrl ? "Écrire sur WhatsApp" : null, action: input.advisorWhatsAppUrl ? { kind: "link", href: input.advisorWhatsAppUrl } : { kind: "none" } };
  }
  return {
    id: "all-clear",
    tone: "done",
    eyebrow: "Tout est à jour",
    title: "Aucune action n’est attendue de votre part",
    description: "Nous vous avertirons ici dès qu’il y aura du nouveau. Une question ? Écrivez-nous sur WhatsApp.",
    actionLabel: input.advisorWhatsAppUrl ? "Écrire sur WhatsApp" : null,
    action: input.advisorWhatsAppUrl ? { kind: "link", href: input.advisorWhatsAppUrl } : { kind: "none" },
  };
}
