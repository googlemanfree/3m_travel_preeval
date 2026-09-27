/**
 * Demandes de suppression de compte, stockées dans `agency_settings` (même patron que `review_invited:` ou
 * `doc_reminder_optout:` : une clé par candidat, une valeur JSON, aucune migration). Une demande de suppression n'efface
 * rien elle-même : elle est traitée par un administrateur, qui applique manuellement les règles de conservation légale
 * (comptabilité, dossiers en cours) avant toute suppression réelle — jamais un effacement automatique et irréversible.
 */

export const PRIVACY_DELETION_REQUEST_PREFIX = "privacy_deletion_request:";
export const privacyDeletionRequestKey = (candidateId: number): string => `${PRIVACY_DELETION_REQUEST_PREFIX}${candidateId}`;

export type PrivacyDeletionRequest = {
  candidateId: number;
  email: string;
  fullName: string;
  requestedAt: string;
  status: "pending" | "done";
  handledBy?: string;
  handledAt?: string;
  note?: string;
};

export function parsePrivacyDeletionRequest(raw: string): PrivacyDeletionRequest | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || typeof parsed.candidateId !== "number" || typeof parsed.email !== "string") return null;
    return parsed as PrivacyDeletionRequest;
  } catch {
    return null;
  }
}
