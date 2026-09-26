/**
 * Demande d'accompagnement pour un vol (devis ou suivi de tarif). Aucun tarif n'est inventé : la note reprend uniquement le
 * relevé du fournisseur affiché sur la carte, en précisant qu'il reste à confirmer par un conseiller.
 */

export type QuoteIntent = "quote" | "watch";

export type QuoteOffer = {
  tripType: "ROUND_TRIP" | "ONE_WAY";
  from: { iata: string; city: string };
  to: { iata: string; city: string };
  departureDate: string;
  returnDate: string | null;
  priceXaf: number;
  airline: string;
  stops: number;
};

export type QuotePrefill = {
  intent: QuoteIntent;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  note: string;
  /** Change à chaque demande : le formulaire est réinitialisé avec les nouvelles valeurs. */
  nonce: number;
};

export type QuoteFields = {
  name: string;
  phone: string;
  origin: string;
  destination: string;
  departure: string;
  returnDate: string;
  travelers: string;
  cabin: string;
  budget: string;
};

const formatXaf = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
const stopsText = (stops: number) => (stops === 0 ? "direct" : stops === 1 ? "1 escale" : `${stops} escales`);

export const quoteSubject = (intent: QuoteIntent) => (intent === "watch" ? "Suivi de tarif vol" : "Demande de devis vol");

export function prefillFromOffer(offer: QuoteOffer, intent: QuoteIntent, nonce: number): QuotePrefill {
  return {
    intent,
    origin: `${offer.from.city} (${offer.from.iata})`,
    destination: `${offer.to.city} (${offer.to.iata})`,
    departureDate: offer.departureDate,
    returnDate: offer.tripType === "ROUND_TRIP" && offer.returnDate ? offer.returnDate : "",
    note: `Tarif relevé sur Google Flights : ${formatXaf(offer.priceXaf)} pour 1 adulte en classe économique (${offer.airline}, ${stopsText(offer.stops)}). Relevé indicatif, à confirmer par un conseiller.`,
    nonce,
  };
}

export function buildQuoteMessage(intent: QuoteIntent, fields: QuoteFields, note: string): string {
  const lines = [
    intent === "watch" ? "Nouvelle demande de suivi de tarif vol" : "Nouvelle demande de devis vol",
    `Client : ${fields.name}`,
    `WhatsApp : ${fields.phone}`,
    `Itinéraire : ${fields.origin} → ${fields.destination}`,
    `Dates : aller ${fields.departure} ; retour ${fields.returnDate || "aller simple"}`,
    `Passagers : ${fields.travelers}`,
    `Classe : ${fields.cabin}`,
    `${intent === "watch" ? "Tarif cible" : "Budget approximatif"} : ${fields.budget || "non précisé"}`,
  ];
  if (intent === "watch") lines.push("Souhait : être prévenu par un conseiller si le tarif baisse pour ce parcours.");
  if (note) lines.push(note);
  return lines.join("\n");
}
