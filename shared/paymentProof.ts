/**
 * Preuve de paiement (capture d'un virement, reçu d'un dépôt Mobile Money) envoyée par le client depuis son espace.
 * La référence du dossier ou de la réservation est gardée dans le nom enregistré du fichier (sans migration) ; l'administration
 * retrouve ainsi la preuve à côté du paiement à vérifier. Une preuve n'est jamais un paiement : seul l'administrateur le valide.
 */

/** Intitulé envoyé au serveur avec le fichier. */
export const proofLabel = (reference: string): string => `Preuve de paiement ${reference.trim()}`;

/** Même transformation que le serveur applique à l'intitulé (lettres et chiffres, le reste devient « _ »). */
export function proofKey(reference: string): string {
  return proofLabel(reference).normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+/, "").slice(0, 80).replace(/_+$/, "");
}

/** Vrai quand un nom de fichier enregistré est la preuve de cette référence. */
export const isProofFor = (fileName: string | null | undefined, reference: string): boolean => Boolean(fileName) && String(fileName).startsWith(`${proofKey(reference)}--`);

export const PROOF_NAME_PREFIX = "Preuve_de_paiement_";
