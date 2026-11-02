/**
 * Séjours pour visiteurs et touristes : programmes accompagnés par l'agence et demandes de devis.
 *
 * Règles de contenu : un prix n'est affiché que s'il a une devise, une base (par personne…), une provenance relue côté administration
 * et une date de relecture de moins de 180 jours. Sans cela, le candidat lit « tarif communiqué par votre conseiller ».
 * Une demande n'est ni une réservation ni un paiement : l'agence prépare un devis, puis le candidat décide.
 */
import { scanOfferText } from "./jobOffers";

export const STAY_STATUSES = ["draft", "needs_review", "published", "retired"] as const;

export const STAY_CATEGORIES = ["discovery", "family_visit", "events", "language_stay", "wellness", "business_visit", "other"] as const;
export type StayCategory = (typeof STAY_CATEGORIES)[number];
export const STAY_CATEGORY_LABELS: Record<StayCategory, string> = {
  discovery: "Découverte et tourisme",
  family_visit: "Visite familiale",
  events: "Événement ou salon",
  language_stay: "Séjour linguistique",
  wellness: "Santé et bien-être",
  business_visit: "Visite d'affaires",
  other: "Autre séjour",
};

export const STAY_REQUEST_STATUSES = ["requested", "quote_prepared", "confirmed", "declined", "cancelled"] as const;
export type StayRequestStatus = (typeof STAY_REQUEST_STATUSES)[number];
export const STAY_REQUEST_LABELS: Record<StayRequestStatus, string> = {
  requested: "Demande reçue",
  quote_prepared: "Devis préparé",
  confirmed: "Séjour confirmé",
  declined: "Non réalisable",
  cancelled: "Annulée",
};
export const STAY_REQUEST_CLIENT_NEXT: Record<StayRequestStatus, string> = {
  requested: "Votre conseiller étudie votre demande et prépare un devis.",
  quote_prepared: "Votre conseiller vous présente le devis : vous décidez ensuite.",
  confirmed: "Votre conseiller vous accompagne pour le visa et l'organisation.",
  declined: "Ce séjour n'est pas réalisable pour ces dates : votre conseiller vous propose une alternative.",
  cancelled: "Demande annulée.",
};
export const TERMINAL_STAY_STATUSES: readonly StayRequestStatus[] = ["declined", "cancelled"];
/** Trois demandes actives au plus : un devis sérieux demande du temps de préparation. */
export const MAX_ACTIVE_STAY_REQUESTS = 3;
export const MAX_TRAVELERS = 9;

export const STAY_CONSENT_VERSION = "2026-10";
export const STAY_CONSENT_TEXT =
  "J'autorise 3M TRAVEL AGENCY à utiliser les informations de mon dossier pour préparer un devis pour ce séjour. Cette demande n'est ni une réservation ni un paiement, et ne garantit pas l'obtention d'un visa.";

export function isStayStatusChangeAllowed(from: StayRequestStatus, to: StayRequestStatus): boolean {
  if (from === to) return false;
  return !TERMINAL_STAY_STATUSES.includes(from);
}

export const STAY_PRICE_STALE_DAYS = 180;
export const STAY_REVIEW_STALE_DAYS = 365;

function freshWithin(checkedAt: Date | string | null | undefined, days: number, now: Date): boolean {
  if (!checkedAt) return false;
  const time = new Date(checkedAt).getTime();
  return Number.isFinite(time) && now.getTime() - time <= days * 86_400_000;
}
export const stayPriceFresh = (checkedAt: Date | string | null | undefined, now: Date = new Date()) => freshWithin(checkedAt, STAY_PRICE_STALE_DAYS, now);
export const stayReviewFresh = (checkedAt: Date | string | null | undefined, now: Date = new Date()) => freshWithin(checkedAt, STAY_REVIEW_STALE_DAYS, now);

export const isCurrencyCode = (value: string | null | undefined) => /^[A-Z]{3}$/.test(String(value ?? "").trim());

export type StayPriceLike = { priceFrom: string | number | null; priceCurrency: string | null; priceBasis: string | null; priceSourceNote: string | null; priceCheckedAt: Date | string | null };

/** Un prix n'est montré que complet et relu récemment ; sinon `null` et le candidat lit la mention du conseiller. */
export function stayPriceLabel(price: StayPriceLike, now: Date = new Date()): string | null {
  const amount = Number(price.priceFrom);
  if (!Number.isFinite(amount) || amount <= 0 || !isCurrencyCode(price.priceCurrency) || !String(price.priceBasis ?? "").trim()) return null;
  if (!String(price.priceSourceNote ?? "").trim() || !stayPriceFresh(price.priceCheckedAt, now)) return null;
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount);
  return `À partir de ${formatted} ${price.priceCurrency} ${String(price.priceBasis).trim()} · indicatif, confirmé par devis`;
}

export function stayPublishBlockers(input: {
  title: string;
  summary: string;
  description: string;
  visaNote: string | null | undefined;
  includedNote?: string | null;
  seasonNote?: string | null;
  durationDaysMin?: number | null;
  durationDaysMax?: number | null;
  checkedAt: Date | string | null | undefined;
  price: StayPriceLike;
  now?: Date;
}): string[] {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  if (input.title.trim().length < 3) reasons.push("Le titre est obligatoire.");
  if (input.summary.trim().length < 20) reasons.push("Le résumé doit faire 20 caractères au moins.");
  if (input.description.trim().length < 80) reasons.push("La description doit détailler le séjour (80 caractères au moins).");
  if (!String(input.visaNote ?? "").trim()) reasons.push("Indiquez ce qu'il faut savoir sur le visa ou l'autorisation de voyage pour ce séjour.");
  if (input.durationDaysMin && input.durationDaysMax && input.durationDaysMin > input.durationDaysMax) reasons.push("La durée minimale dépasse la durée maximale.");
  const flags = scanOfferText([input.title, input.summary, input.description, input.visaNote, input.includedNote, input.seasonNote].filter(Boolean).join("\n"));
  if (flags.contact.length > 0) reasons.push(`Le texte contient des coordonnées ou des liens (${flags.contact.slice(0, 2).join(", ")}) : retirez-les, tout passe par l'agence.`);
  if (flags.money.length > 0) reasons.push("Le texte semble demander de l'argent avant devis : retirez-le.");
  if (!stayReviewFresh(input.checkedAt, now)) reasons.push("Relisez le séjour aujourd'hui (case « relu aujourd'hui »).");
  const hasAnyPrice = input.price.priceFrom != null && String(input.price.priceFrom) !== "";
  if (hasAnyPrice) {
    const amount = Number(input.price.priceFrom);
    if (!Number.isFinite(amount) || amount <= 0) reasons.push("Le prix doit être supérieur à zéro, ou laissé vide.");
    if (!isCurrencyCode(input.price.priceCurrency)) reasons.push("La devise du prix doit être un code à trois lettres (EUR, CAD, GBP…).");
    if (!String(input.price.priceBasis ?? "").trim()) reasons.push("Précisez la base du prix (par personne, par séjour…).");
    if (!String(input.price.priceSourceNote ?? "").trim()) reasons.push("Indiquez la provenance du prix (visible de l'administration seulement).");
    if (!stayPriceFresh(input.price.priceCheckedAt, now)) reasons.push("Relisez le prix aujourd'hui (case « prix relu aujourd'hui »).");
  }
  return reasons;
}
