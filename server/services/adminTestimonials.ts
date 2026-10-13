/**
 * Témoignages clients saisis par l'administration : la preuve du consentement du client est obligatoire et conservée
 * dans les notes de l'avis (aucune migration : colonne adminNotes). Aucun témoignage ne se fabrique : seul un retour
 * réellement donné par un client, avec son accord de publication, peut être enregistré.
 */

import { CONSENT_CHANNELS, CONSENT_CHANNEL_LABELS, type ConsentChannel } from "../../shared/testimonialConsent";

export { CONSENT_CHANNELS, CONSENT_CHANNEL_LABELS };
export type { ConsentChannel };

/** Première ligne des notes : repère les avis saisis par l'administration (aussi épinglée par un test existant). */
export const ADMIN_ENTRY_NOTE_PREFIX = "Avis fourni par l’administration — consentement client confirmé.";

const PLACEHOLDER_DOMAIN = "temoignage.invalid";

/** Adresse factice (domaine réservé .invalid) quand le client n'a pas communiqué d'e-mail : aucun envoi n'est possible. */
export function placeholderEmail(randomHex: string): string {
  return `temoignage-${randomHex}@${PLACEHOLDER_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`));
}

/** Date d'accord au format AAAA-MM-JJ : valide et jamais dans le futur. */
export function consentDateError(value: string, now: Date = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "La date de l’accord doit être au format AAAA-MM-JJ.";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "La date de l’accord n’existe pas.";
  if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) return "La date de l’accord ne peut pas être dans le futur.";
  return null;
}

export function buildAdminEntryNotes(input: {
  channel: ConsentChannel;
  consentDate: string;
  proof: string;
  dossierReference?: string | null;
  adminEmail: string;
  publishNow: boolean;
}): string {
  return [
    ADMIN_ENTRY_NOTE_PREFIX,
    `Canal de l’accord : ${CONSENT_CHANNEL_LABELS[input.channel]} · Date : ${input.consentDate}`,
    `Preuve conservée : ${input.proof.trim()}`,
    `Dossier : ${input.dossierReference?.trim() || "non renseigné"}`,
    `Saisi par : ${input.adminEmail} · ${input.publishNow ? "publié à la saisie" : "enregistré pour validation"}`,
  ].join("\n");
}

/** Ajoute une ligne d'historique aux notes sans jamais perdre les anciennes. */
export function appendAdminNote(existing: string | null | undefined, line: string): string {
  const base = (existing ?? "").trim();
  return base ? `${base}\n${line}` : line;
}

export function isAdminEntered(adminNotes: string | null | undefined): boolean {
  return Boolean(adminNotes && adminNotes.startsWith(ADMIN_ENTRY_NOTE_PREFIX));
}
