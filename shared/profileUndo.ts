/**
 * Annuler une étape et réinitialiser un profil : ce qui est possible selon l'état réel du compte.
 * Jamais effacés : bilan déjà envoyé, pièces déposées, messages, preuves et paiements confirmés. On défait des décisions, pas des faits.
 */
export const UNDO_ACTIONS_FOR_ROUTER = ["undo_client_decision", "undo_advisor_validation", "undo_activation", "reset_profile"] as const;
export type UndoAction = (typeof UNDO_ACTIONS_FOR_ROUTER)[number];

export type ProfileFacts = {
  bilanSent: boolean;
  advisorValidated: boolean;
  hasClientDecision: boolean;
  openingRequested: boolean;
  activated: boolean;
  paid: boolean;
  evaluationDeclared: boolean;
};

export type UndoOption = { action: UndoAction; label: string; description: string; danger: boolean; superAdminOnly: boolean };

export const RESET_CONFIRMATION = "REINITIALISER";
export const MIN_REASON_LENGTH = 8;

export function availableUndos(facts: ProfileFacts): UndoOption[] {
  const options: UndoOption[] = [];
  if ((facts.hasClientDecision || facts.openingRequested) && !facts.paid) {
    options.push({ action: "undo_client_decision", label: "Annuler la réponse du candidat au bilan", description: "Efface « Je valide / Je ne valide pas » et la demande d'ouverture : le candidat pourra répondre de nouveau.", danger: false, superAdminOnly: false });
  }
  if (facts.advisorValidated && !facts.bilanSent) {
    options.push({ action: "undo_advisor_validation", label: "Annuler la validation du bilan", description: "Le bilan redevient un brouillon à valider avant envoi.", danger: false, superAdminOnly: false });
  }
  if (facts.activated) {
    options.push({ action: "undo_activation", label: "Annuler l'activation du dossier", description: "Le compte repasse en pré-compte (réactivable depuis « Activations à contrôler »). Pièces et paiements sont conservés.", danger: true, superAdminOnly: facts.paid });
  }
  options.push({ action: "reset_profile", label: "Réinitialiser le profil à l'état initial", description: "Annule l'activation, la réponse du candidat, la validation non envoyée et la déclaration d'évaluation. Conserve le bilan déjà envoyé, les pièces, les messages et les paiements.", danger: true, superAdminOnly: true });
  return options;
}

export function validateUndoRequest(input: { reason: string; action: UndoAction; confirmation?: string | null }): string | null {
  if (input.reason.trim().length < MIN_REASON_LENGTH) return `Indiquez un motif d'au moins ${MIN_REASON_LENGTH} caractères.`;
  if (input.action === "reset_profile" && (input.confirmation ?? "").trim() !== RESET_CONFIRMATION) return `Tapez ${RESET_CONFIRMATION} pour confirmer la réinitialisation.`;
  return null;
}
