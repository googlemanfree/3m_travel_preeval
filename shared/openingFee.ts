/**
 * Frais d'ouverture de dossier.
 *
 * Le montant dépend du type de profil : il est fixé par dossier (applications.paymentAmount) par un
 * administrateur et confirmé par écrit au candidat avant tout paiement. 65 000 XAF n'est que la valeur
 * proposée par défaut à la création d'un dossier ; aucun contrôle de paiement ne doit l'imposer.
 */
export const DEFAULT_OPENING_FEE_XAF = 65000;
export const MIN_OPENING_FEE_XAF = 1000;
export const MAX_OPENING_FEE_XAF = 5_000_000;

/** Pour les écrans qui ne connaissent pas encore le dossier. */
export const OPENING_FEE_UNKNOWN_LABEL = "Montant confirmé par votre conseiller";

export function isValidOpeningFee(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_OPENING_FEE_XAF && value <= MAX_OPENING_FEE_XAF;
}

/** « 65 000 XAF » avec des espaces ordinaires (lisible partout, y compris dans les PDF). */
export function formatXaf(amount: number, currency = "XAF"): string {
  const digits = String(Math.trunc(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${amount < 0 ? "-" : ""}${digits} ${currency}`;
}

/** Lit ?montant=… dans l'adresse (convention déjà utilisée par /paiement) ; null si absent ou invalide. */
export function openingFeeFromSearch(search: string): number | null {
  const raw = new URLSearchParams(search).get("montant");
  if (!raw || !/^\d{1,9}$/.test(raw)) return null;
  const value = Number(raw);
  return isValidOpeningFee(value) ? value : null;
}

/** Texte à afficher pour le montant d'un écran de paiement : montant de l'adresse, sinon formule neutre. */
export function openingFeeLabelFromSearch(search: string): string {
  const fee = openingFeeFromSearch(search);
  return fee === null ? OPENING_FEE_UNKNOWN_LABEL : formatXaf(fee);
}
