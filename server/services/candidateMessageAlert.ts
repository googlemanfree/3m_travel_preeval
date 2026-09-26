import { accountReference } from "../../shared/caseReference";

/**
 * Alerte de l'administration quand un candidat écrit depuis son espace : sans elle, le message restait invisible tant
 * qu'un conseiller n'ouvrait pas la messagerie de ce dossier. La cloche affiche l'auteur, sa référence et un extrait.
 */
export const EXCERPT_LENGTH = 140;

const oneLine = (value: string): string => value.replace(/\s+/g, " ").trim();

export function candidateMessageExcerpt(content: string, hasAttachment: boolean): string {
  const text = oneLine(content);
  if (!text || text === "Pièce jointe envoyée.") return hasAttachment ? "Pièce jointe envoyée." : "(message vide)";
  const cut = text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…` : text;
  return hasAttachment ? `${cut} (+ pièce jointe)` : cut;
}

export function buildCandidateMessageAlert(input: { candidateId: number; fullName: string; content: string; hasAttachment: boolean }) {
  const reference = accountReference(input.candidateId);
  return {
    type: "new_contact_message" as const,
    title: `Nouveau message de ${oneLine(input.fullName).slice(0, 80) || reference}`,
    message: `${reference} — ${candidateMessageExcerpt(input.content, input.hasAttachment)}`,
    relatedId: `msg-${input.candidateId}`,
    targetAdminType: "accompagnement" as const,
  };
}
