/**
 * Signalement d'une demande de réservation de vol à l'agent de comptoir : ce qu'il lui faut pour effectuer une
 * VRAIE réservation (option auprès de la compagnie ou du GDS) en attendant l'émission réelle du billet.
 * Fonctions pures, partagées par l'e-mail envoyé au comptoir et par les boutons WhatsApp du tableau de bord.
 * Rien n'est supposé : un champ absent de la demande reste « à confirmer ».
 */

export const DEFAULT_DESK_WHATSAPP = "237698104832";

const CABIN_LABELS: Record<string, string> = { ECONOMY: "Économique", PREMIUM_ECONOMY: "Éco Premium", BUSINESS: "Affaires", FIRST: "Première" };
const PRIORITY_LABELS: Record<string, string> = { urgent: "URGENTE", high: "Haute", normal: "Normale", low: "Basse" };

export type DeskLeg = { airline: string; flightNumber: string; route: string; date: string; departureTime: string; arrivalTime: string; stops: number | null };

export type DeskAlertData = {
  requestRef: string;
  priority: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string | null;
  travelers: number | null;
  comment: string | null;
  cabin: string | null;
  outbound: DeskLeg;
  inbound: DeskLeg | null;
  quotedTotalPrice: number | null;
  currency: string;
};

const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const text = (value: unknown, max = 200): string => (typeof value === "string" ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");
const numberOrNull = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

function legOf(value: unknown): DeskLeg {
  const flight = record(value);
  const airline = record(flight.airline);
  const origin = text(flight.originCity) || text(flight.origin) || "Départ à confirmer";
  const destination = text(flight.destinationCity) || text(flight.destination) || "Arrivée à confirmer";
  return {
    airline: text(airline.name) || "Compagnie à confirmer",
    flightNumber: text(flight.flightNumber, 20) || "N° à confirmer",
    route: `${origin} → ${destination}`,
    date: text(flight.departureDate, 20) || "Date à confirmer",
    departureTime: text(flight.departureTime, 10) || "--:--",
    arrivalTime: text(flight.arrivalTime, 10) || "--:--",
    stops: numberOrNull(flight.stops),
  };
}

export function extractDeskAlertData(input: { requestRef: string; priority?: string | null; flightData: unknown; passengerData: unknown; requesterEmail: string }): DeskAlertData {
  const flight = record(input.flightData);
  const passenger = record(Array.isArray(input.passengerData) ? input.passengerData[0] : null);
  const hasReturn = flight.returnFlight && typeof flight.returnFlight === "object";
  const phone = text(passenger.phone, 40) || text(passenger.phoneNumber, 40) || text(passenger.telephone, 40);
  return {
    requestRef: text(input.requestRef, 40),
    priority: PRIORITY_LABELS[text(input.priority ?? "normal", 12)] ?? "Normale",
    passengerName: text(passenger.fullName, 120) || "Nom à confirmer",
    passengerEmail: text(input.requesterEmail, 320),
    passengerPhone: phone || null,
    travelers: numberOrNull(passenger.travelers),
    comment: text(passenger.comment, 600) || null,
    cabin: CABIN_LABELS[text(flight.cabinClass, 20)] ?? null,
    outbound: legOf(flight),
    inbound: hasReturn ? legOf(flight.returnFlight) : null,
    quotedTotalPrice: numberOrNull(flight.quotedTotalPrice) ?? numberOrNull(flight.totalPrice),
    currency: text(flight.currency, 6) || "XAF",
  };
}

const stopsLabel = (stops: number | null) => (stops === null ? "escales à confirmer" : stops === 0 ? "direct" : `${stops} escale${stops > 1 ? "s" : ""}`);
const legLine = (leg: DeskLeg) => `${leg.airline} ${leg.flightNumber} — ${leg.route} — ${leg.date} ${leg.departureTime} → ${leg.arrivalTime} (${stopsLabel(leg.stops)})`;
const priceLine = (data: DeskAlertData) => (data.quotedTotalPrice === null ? "à confirmer" : `${new Intl.NumberFormat("fr-FR").format(data.quotedTotalPrice)} ${data.currency}`);

/** Résumé texte prêt à coller ou à envoyer sur WhatsApp : tout ce qu'il faut pour réserver auprès de la compagnie. */
export function buildDeskAlertText(data: DeskAlertData): string {
  const lines = [
    `NOUVELLE RÉSERVATION VOL — Réf ${data.requestRef}`,
    `Priorité : ${data.priority}`,
    `Client : ${data.passengerName}${data.passengerPhone ? ` · ${data.passengerPhone}` : ""} · ${data.passengerEmail}`,
    `Voyageurs : ${data.travelers ?? "à confirmer"}${data.cabin ? ` · Cabine : ${data.cabin}` : ""}`,
    `ALLER : ${legLine(data.outbound)}`,
    ...(data.inbound ? [`RETOUR : ${legLine(data.inbound)}`] : []),
    `Tarif relevé : ${priceLine(data)} (à revalider avant tout paiement)`,
    ...(data.comment ? [`Commentaire du client : ${data.comment}`] : []),
    "À FAIRE : contacter le client, poser une option de réservation auprès de la compagnie ou du GDS, noter le PNR, revalider le tarif final. Aucune émission avant paiement validé.",
  ];
  return lines.join("\n").slice(0, 1600);
}

/** Numéro WhatsApp au format international sans « + » ; un numéro camerounais à 9 chiffres reçoit l'indicatif 237. */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9 && digits.startsWith("6")) digits = `237${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function whatsAppLink(number: string | null | undefined, message: string): string {
  const target = normalizeWhatsAppNumber(number);
  return `https://wa.me/${target ?? ""}?text=${encodeURIComponent(message)}`;
}

/** Message d'accueil pour écrire au client depuis le comptoir. */
export function clientContactMessage(data: DeskAlertData): string {
  return `Bonjour ${data.passengerName}, c'est 3M Travel & Services au sujet de votre demande de réservation ${data.requestRef} (${data.outbound.route}, ${data.outbound.date}). Nous vérifions la disponibilité et le tarif auprès de la compagnie et revenons vers vous très vite. Aucun paiement n'est demandé avant cette confirmation.`;
}
