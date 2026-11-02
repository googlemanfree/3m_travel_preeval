/**
 * Validation d'un paiement d'ouverture SANS photo de la facture : l'administrateur saisit la référence de transaction
 * (Mobile Money, virement) et explique pourquoi la photo n'est pas disponible.
 *
 * Ce n'est pas un paiement « à l'aveugle » : la référence doit être plausible, ne jamais avoir servi pour un autre compte, le motif est
 * obligatoire, et la validation est journalisée (qui, quand, pourquoi) puis marquée « sur référence » pour être rapprochée du relevé.
 */

export const MIN_PAYMENT_REFERENCE_LENGTH = 6;
export const MIN_NO_PROOF_REASON_LENGTH = 5;

/** Valeurs de remplissage qui ne sont pas une vraie référence de transaction. */
const PLACEHOLDERS = new Set(["test", "tests", "xxxxxx", "aaaaaa", "123456", "1234567", "12345678", "000000", "0000000", "azerty", "azerty1", "reference", "referenc", "transaction", "paiement", "payement", "paye", "payer", "ok", "oui", "non", "aucune", "inconnue", "inconnu", "none", "null", "n/a", "na", "neant", "rien"]);

export type PaymentReferenceCheck = { ok: true; reference: string } | { ok: false; message: string };

/** Normalise (espaces superflus, casse conservée pour l'affichage) et refuse une référence manifestement inventée. */
export function checkPaymentReference(raw: string | null | undefined): PaymentReferenceCheck {
  const reference = String(raw ?? "").replace(/\s+/g, " ").trim();
  const compact = reference.replace(/[^A-Za-z0-9]/g, "");
  if (reference.length < MIN_PAYMENT_REFERENCE_LENGTH || compact.length < 5) {
    return { ok: false, message: `Référence trop courte : saisissez l'ID de transaction complet (${MIN_PAYMENT_REFERENCE_LENGTH} caractères au moins).` };
  }
  if (PLACEHOLDERS.has(reference.toLowerCase()) || PLACEHOLDERS.has(compact.toLowerCase()) || /^(.)\1+$/.test(compact) || /^(0123456789|1234567890|9876543210)/.test(compact)) {
    return { ok: false, message: "Cette référence ne ressemble pas à un vrai ID de transaction : recopiez celui du SMS ou du reçu." };
  }
  return { ok: true, reference };
}

export function checkNoProofReason(raw: string | null | undefined): { ok: true; reason: string } | { ok: false; message: string } {
  const reason = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (reason.length < MIN_NO_PROOF_REASON_LENGTH) {
    return { ok: false, message: "Indiquez pourquoi la photo n'est pas disponible (ex. facture perdue, paiement fait par un proche, photo illisible)." };
  }
  return { ok: true, reason: reason.slice(0, 300) };
}

/** Comparaison de références : sans espaces, sans tirets, sans casse. */
export const referenceKey = (reference: string): string => reference.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
