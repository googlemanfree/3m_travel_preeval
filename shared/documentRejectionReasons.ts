/**
 * Motifs standard de renvoi d'une pièce au candidat.
 *
 * Chaque motif donne un intitulé court (repérable dans les statistiques) et une consigne claire pour le candidat.
 * Le commentaire envoyé commence toujours par l'intitulé : `parseRejectionReason` retrouve le motif sans colonne
 * supplémentaire en base. Aucune promesse de résultat : on dit seulement quoi corriger.
 */
export const DOCUMENT_REJECTION_REASONS = [
  { code: "illisible", label: "Document illisible", instruction: "Le texte n'est pas lisible. Rescannez la pièce à plat, avec une bonne lumière, sans reflet ni flou." },
  { code: "incomplet", label: "Document incomplet ou coupé", instruction: "Des bords ou des pages sont coupés. Envoyez la pièce entière, toutes les pages et les deux faces si nécessaire." },
  { code: "expire", label: "Document expiré", instruction: "La date de validité est dépassée. Envoyez une version en cours de validité." },
  { code: "mauvais_document", label: "Mauvais document", instruction: "Ce fichier ne correspond pas à la pièce demandée. Envoyez le document attendu pour cette rubrique." },
  { code: "identite_differente", label: "Identité différente du passeport", instruction: "Le nom ou la date de naissance ne correspond pas à votre passeport. Envoyez un justificatif de correction ou la bonne pièce." },
  { code: "non_traduit", label: "Traduction manquante", instruction: "La pièce doit être accompagnée d'une traduction officielle. Joignez la traduction." },
  { code: "photo_non_conforme", label: "Photo non conforme", instruction: "La photo ne respecte pas les consignes (visage entier, fond uni, sans accessoire, photo récente). Envoyez-en une nouvelle." },
  { code: "doublon", label: "Pièce déjà envoyée", instruction: "Cette pièce est déjà dans votre dossier. Envoyez uniquement ce qui est demandé et manquant." },
] as const;

export type DocumentRejectionCode = (typeof DOCUMENT_REJECTION_REASONS)[number]["code"];

export const DOCUMENT_REJECTION_REASON_MAX_LENGTH = 2000;

/** Commentaire envoyé au candidat : motif standard (si choisi) puis précision libre (si saisie). */
export function composeRejectionComment(code: DocumentRejectionCode | null | undefined, extra?: string | null): string {
  const reason = DOCUMENT_REJECTION_REASONS.find((item) => item.code === code);
  const detail = (extra ?? "").trim();
  if (!reason) return detail.slice(0, DOCUMENT_REJECTION_REASON_MAX_LENGTH);
  const base = `${reason.label} : ${reason.instruction}`;
  return (detail ? `${base} ${detail}` : base).slice(0, DOCUMENT_REJECTION_REASON_MAX_LENGTH);
}

/** Retrouve le motif standard d'un commentaire déjà enregistré (null pour un commentaire libre ou ancien). */
export function parseRejectionReason(comment: string | null | undefined): DocumentRejectionCode | null {
  const text = (comment ?? "").trim();
  if (!text) return null;
  const match = DOCUMENT_REJECTION_REASONS.find((item) => text.startsWith(`${item.label} :`));
  return match ? match.code : null;
}

/** Compte les motifs standard dans une liste de commentaires (les commentaires libres vont dans `libre`). */
export function countRejectionReasons(comments: readonly (string | null | undefined)[]): Record<DocumentRejectionCode | "libre", number> {
  const counts = Object.fromEntries([...DOCUMENT_REJECTION_REASONS.map((item) => [item.code, 0]), ["libre", 0]]) as Record<DocumentRejectionCode | "libre", number>;
  for (const comment of comments) {
    if (!(comment ?? "").trim()) continue;
    counts[parseRejectionReason(comment) ?? "libre"] += 1;
  }
  return counts;
}
