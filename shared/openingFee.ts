/**
 * Frais d'ouverture de dossier.
 *
 * Le montant dépend du type de profil : il est fixé par dossier (applications.paymentAmount) par un
 * administrateur et confirmé par écrit au candidat avant tout paiement. Les valeurs ci-dessous ne sont que
 * celles proposées à la création d'un dossier ; aucun contrôle de paiement ne doit les imposer.
 *
 * Visa travail (tous pays) : les frais couvrent l'ouverture, la collecte, le traitement et la traduction du dossier,
 * puis sa soumission aux agences de placement et aux employeurs directs. Proposition : 100 000 XAF, modifiable par profil.
 */
export const DEFAULT_OPENING_FEE_XAF = 65000;
export const WORK_VISA_OPENING_FEE_XAF = 100000;
export const MIN_OPENING_FEE_XAF = 1000;
export const MAX_OPENING_FEE_XAF = 5_000_000;

/** Visa travail : mêmes mots que le reste du site (étude, visite et famille ne sont jamais des visas travail). */
export function isWorkVisaType(visaOrProject?: string | null): boolean {
  const value = String(visaOrProject ?? "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (!value) return false;
  if (/(etude|study|scolaire|touris|visitor|visiteur|sejour|famille|family)/.test(value)) return false;
  return /(travail|work|emploi|job|qualified|qualifie|professionnel)/.test(value);
}

/** Montant proposé à la création d'un dossier selon le visa ; l'administrateur l'ajuste ensuite selon le profil. */
export function proposedOpeningFee(visaOrProject?: string | null): number {
  return isWorkVisaType(visaOrProject) ? WORK_VISA_OPENING_FEE_XAF : DEFAULT_OPENING_FEE_XAF;
}

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
