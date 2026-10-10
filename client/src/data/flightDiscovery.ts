/**
 * Contenu de la page de vols avant toute recherche : parcours fréquents, étapes, services liés.
 * Aucun tarif n'est écrit ici : un prix n'est affiché qu'issu d'une vraie recherche (voir flightPriceProvenance).
 */

export type FlightTripKind = "ROUND_TRIP" | "ONE_WAY";

export type FlightRoute = {
  id: string;
  from: { iata: string; city: string };
  to: { iata: string; city: string };
  tripType: FlightTripKind;
};

export type FlightRouteGroup = {
  id: string;
  title: string;
  intro: string;
  /** Slug visuel premium (canada, france, emirats, maroc…). */
  visualSlug: string;
  routes: FlightRoute[];
};

const route = (from: [string, string], to: [string, string], tripType: FlightTripKind = "ROUND_TRIP"): FlightRoute => ({
  id: `${from[0]}-${to[0]}`.toLowerCase(),
  from: { iata: from[0], city: from[1] },
  to: { iata: to[0], city: to[1] },
  tripType,
});

const YAOUNDE: [string, string] = ["NSI", "Yaoundé"];
const DOUALA: [string, string] = ["DLA", "Douala"];

export const FLIGHT_ROUTE_GROUPS: FlightRouteGroup[] = [
  {
    id: "canada",
    title: "Vers le Canada",
    intro: "Études, travail, immigration ou visite de proches.",
    visualSlug: "canada",
    routes: [route(YAOUNDE, ["YUL", "Montréal"]), route(DOUALA, ["YUL", "Montréal"]), route(DOUALA, ["YYZ", "Toronto"])],
  },
  {
    id: "europe",
    title: "Vers l’Europe",
    intro: "Espace Schengen, Royaume-Uni et correspondances.",
    visualSlug: "france",
    routes: [route(YAOUNDE, ["CDG", "Paris"]), route(DOUALA, ["CDG", "Paris"]), route(DOUALA, ["BRU", "Bruxelles"]), route(DOUALA, ["IST", "Istanbul"])],
  },
  {
    id: "asie",
    title: "Vers la Chine et le Golfe",
    intro: "Affaires, études et escales vers l’Asie.",
    visualSlug: "emirats",
    routes: [route(DOUALA, ["CAN", "Canton"]), route(DOUALA, ["PEK", "Pékin"]), route(YAOUNDE, ["DXB", "Dubaï"])],
  },
  {
    id: "afrique",
    title: "Au Cameroun et en Afrique",
    intro: "Vols intérieurs et liaisons régionales.",
    visualSlug: "maroc",
    routes: [route(YAOUNDE, DOUALA, "ONE_WAY"), route(DOUALA, ["ABJ", "Abidjan"]), route(DOUALA, ["CMN", "Casablanca"]), route(DOUALA, ["ADD", "Addis-Abeba"])],
  },
];

export const ALL_FLIGHT_ROUTES: FlightRoute[] = FLIGHT_ROUTE_GROUPS.flatMap((group) => group.routes);

/** Raccourcis empty state : Yaoundé → Paris / Montréal / Dubaï. Aucun tarif ici. */
export const FLIGHT_EMPTY_STATE_ROUTES: FlightRoute[] = [
  route(YAOUNDE, ["CDG", "Paris"]),
  route(YAOUNDE, ["YUL", "Montréal"]),
  route(YAOUNDE, ["DXB", "Dubaï"]),
];

/** Liens de recherche par ville de départ (maillage interne) : mêmes parcours, regroupés autrement. */
export const FLIGHT_ROUTES_BY_DEPARTURE: Array<{ city: string; routes: FlightRoute[] }> = ["NSI", "DLA"].map((iata) => {
  const routes = ALL_FLIGHT_ROUTES.filter((item) => item.from.iata === iata);
  return { city: routes[0]?.from.city ?? iata, routes };
});

export type FlightServiceTab = { id: string; label: string; href: string; active?: boolean };

export const FLIGHT_SERVICE_TABS: FlightServiceTab[] = [
  { id: "vols", label: "Vols", href: "/flights", active: true },
  { id: "hotels", label: "Hôtels", href: "#3m-booking" },
  { id: "sejours", label: "Séjours", href: "/tourisme" },
  { id: "voitures", label: "Voitures", href: "/tourisme?service=vehicle" },
  { id: "assurance", label: "Assurance", href: "/assurance" },
  { id: "evisa", label: "e-Visa", href: "/evisas" },
  { id: "visa", label: "Visa", href: "/procedures" },
];

export const FLIGHT_BOOKING_STEPS: Array<{ title: string; text: string }> = [
  { title: "Recherchez votre trajet", text: "Choisissez vos villes, vos dates, le nombre de voyageurs et la classe. Ajoutez un filtre sur les escales si besoin." },
  { title: "Comparez et choisissez", text: "Prix, durée, escales et compagnie : triez les résultats et retenez le vol qui vous convient." },
  { title: "Envoyez votre demande", text: "Réservez en ligne ou par WhatsApp : le vol, le prix et les voyageurs sont transmis à un conseiller sans ressaisie." },
  { title: "Un conseiller confirme", text: "Il vérifie la disponibilité et le tarif, vous accompagne pour le paiement en ligne ou en agence, puis vous remet votre billet." },
];

export const FLIGHT_ADVANTAGES: Array<{ title: string; text: string }> = [
  { title: "Tarifs comparés, origine indiquée", text: "Chaque résultat précise d’où vient le tarif, et signale un résultat mémorisé ou de démonstration." },
  { title: "Un conseiller à chaque étape", text: "Assistance WhatsApp, agence physique, et assistant Aureol pour préparer un itinéraire sur mesure." },
  { title: "Paiement en ligne ou en agence", text: "Vous choisissez ce qui vous rassure ; votre PNR est validé avant tout règlement." },
  { title: "Un seul interlocuteur pour tout le voyage", text: "Visa, assurance, hôtel et billet : votre dossier reste au même endroit." },
];

export const FLIGHT_COMPANION_SERVICES: Array<{ title: string; text: string; href: string; cta: string; visualId: string }> = [
  { title: "Assurance voyage", text: "Une assurance voyage est exigée pour un visa Schengen : demandez-la en même temps que votre billet.", href: "/assurance", cta: "Demander une assurance", visualId: "assurance" },
  { title: "e-Visa", text: "Pour les pays qui délivrent un e-Visa, préparez votre demande en ligne avant de partir.", href: "/evisas", cta: "Voir les e-Visa", visualId: "evisa" },
  { title: "Hôtels et séjours", text: "Réservez votre hébergement avec 3M Booking et gardez un seul interlocuteur.", href: "#3m-booking", cta: "Voir 3M Booking", visualId: "hotels" },
  { title: "Procédures de visa", text: "Études, travail, tourisme : les étapes et les sources officielles, par destination.", href: "/procedures", cta: "Consulter les procédures", visualId: "visas" },
];

/**
 * Compagnies fréquemment relevées depuis le Cameroun / l’Afrique centrale.
 * Logos via domaine officiel (Clearbit) — repli icône côté UI si le CDN échoue. Aucun tarif ici.
 */
export const FEATURED_AFRICA_CARRIERS: Array<{ code: string; name: string; logo: string; hub: string; corridor: string }> = [
  { code: "QC", name: "Camair-Co", logo: "https://logo.clearbit.com/camair-co.cm", hub: "Yaoundé · Douala", corridor: "Afrique centrale" },
  { code: "ET", name: "Ethiopian Airlines", logo: "https://logo.clearbit.com/ethiopianairlines.com", hub: "Addis-Abeba", corridor: "Afrique → monde" },
  { code: "KP", name: "ASKY Airlines", logo: "https://logo.clearbit.com/flyasky.com", hub: "Lomé", corridor: "Afrique de l’Ouest" },
  { code: "AT", name: "Royal Air Maroc", logo: "https://logo.clearbit.com/royalairmaroc.com", hub: "Casablanca", corridor: "Afrique → Europe" },
  { code: "KQ", name: "Kenya Airways", logo: "https://logo.clearbit.com/kenya-airways.com", hub: "Nairobi", corridor: "Afrique de l’Est" },
  { code: "AF", name: "Air France", logo: "https://logo.clearbit.com/airfrance.com", hub: "Paris", corridor: "Cameroun → Europe" },
  { code: "TK", name: "Turkish Airlines", logo: "https://logo.clearbit.com/turkishairlines.com", hub: "Istanbul", corridor: "Correspondances Asie" },
  { code: "HF", name: "Air Côte d’Ivoire", logo: "https://logo.clearbit.com/aircotedivoire.com", hub: "Abidjan", corridor: "Afrique de l’Ouest" },
  { code: "WB", name: "RwandAir", logo: "https://logo.clearbit.com/rwandair.com", hub: "Kigali", corridor: "Afrique → Europe" },
  { code: "MS", name: "EgyptAir", logo: "https://logo.clearbit.com/egyptair.com", hub: "Le Caire", corridor: "Afrique → Moyen-Orient" },
];

/** Options d'escales proposées avant la recherche ; null = pas de limite. */
export const FLIGHT_STOP_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: "Toutes les escales" },
  { value: 0, label: "Vols directs uniquement" },
  { value: 1, label: "1 escale maximum" },
];


/** Dernière recherche, gardée sur l'appareil du visiteur (jamais envoyée au serveur, aucune donnée personnelle). */
export type LastFlightSearch = {
  tripType: "ONE_WAY" | "ROUND_TRIP";
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
};

export const LAST_FLIGHT_SEARCH_KEY = "3m-last-flight-search";
export type RecentFlightSearch = LastFlightSearch & { savedAt: number };
export const RECENT_FLIGHT_SEARCHES_KEY = "3m-recent-flight-searches";
export const MAX_RECENT_FLIGHT_SEARCHES = 5;

/** Dernière demande de réservation créée sur cet appareil (suivi + paiement en attente). */
export const LAST_FLIGHT_BOOKING_KEY = "3m-last-flight-booking";
export type LastFlightBookingSnapshot = {
  requestId: number;
  requestRef: string;
  email: string;
  status: string;
  createdAt: number;
  routeLabel: string;
  quotedTotalPrice?: number;
};

export function parseLastFlightBooking(raw: string | null): LastFlightBookingSnapshot | null {
  if (!raw || raw.length > 800) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    const requestId = typeof parsed.requestId === "number" && Number.isInteger(parsed.requestId) && parsed.requestId > 0 ? parsed.requestId : null;
    const requestRef = typeof parsed.requestRef === "string" && /^3M-FL-/i.test(parsed.requestRef) ? parsed.requestRef : null;
    const email = typeof parsed.email === "string" && parsed.email.includes("@") ? parsed.email.trim().slice(0, 320) : null;
    const status = typeof parsed.status === "string" ? parsed.status.slice(0, 40) : "pending_review";
    const createdAt = typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt) ? parsed.createdAt : null;
    const routeLabel = typeof parsed.routeLabel === "string" ? parsed.routeLabel.slice(0, 120) : "";
    const quotedTotalPrice = typeof parsed.quotedTotalPrice === "number" && Number.isFinite(parsed.quotedTotalPrice) && parsed.quotedTotalPrice > 0
      ? parsed.quotedTotalPrice
      : undefined;
    if (!requestId || !requestRef || !email || !createdAt) return null;
    // Expire après 14 jours : au-delà, le suivi passe par e-mail / espace client.
    if (Date.now() - createdAt > 14 * 24 * 60 * 60 * 1000) return null;
    return { requestId, requestRef, email, status, createdAt, routeLabel, quotedTotalPrice };
  } catch {
    return null;
  }
}

export function saveLastFlightBooking(snapshot: LastFlightBookingSnapshot): void {
  try {
    sessionStorage.setItem(LAST_FLIGHT_BOOKING_KEY, JSON.stringify(snapshot));
  } catch {
    // Navigation privée : le suivi reste possible via e-mail de confirmation.
  }
}

const CABINS = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const count = (value: unknown, min: number, max: number) => (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null);

/** Relit la recherche mémorisée : tout ce qui est invalide, altéré ou déjà passé est ignoré. */
export function parseLastFlightSearch(raw: string | null, today: string): LastFlightSearch | null {
  if (!raw || raw.length > 600) return null;
  let value: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    value = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const { tripType, origin, destination, departureDate, returnDate, cabinClass } = value;
  const adults = count(value.adults, 1, 9);
  const children = count(value.children, 0, 8);
  const infants = count(value.infants, 0, 4);
  if (tripType !== "ONE_WAY" && tripType !== "ROUND_TRIP") return null;
  if (typeof origin !== "string" || !/^[A-Z]{3}$/.test(origin) || typeof destination !== "string" || !/^[A-Z]{3}$/.test(destination) || origin === destination) return null;
  if (typeof departureDate !== "string" || !isoDate.test(departureDate) || departureDate < today) return null;
  if (typeof returnDate !== "string" || !isoDate.test(returnDate)) return null;
  if (tripType === "ROUND_TRIP" && returnDate < departureDate) return null;
  if (adults === null || children === null || infants === null) return null;
  if (typeof cabinClass !== "string" || !CABINS.includes(cabinClass)) return null;
  return { tripType, origin, destination, departureDate, returnDate, adults, children, infants, cabinClass };
}

/** Relit jusqu'à cinq recherches récentes en réutilisant la validation stricte de la recherche unique. */
export function parseRecentFlightSearches(raw: string | null, today: string): RecentFlightSearch[] {
  if (!raw || raw.length > 6000) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const recent: RecentFlightSearch[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const candidate = item as Record<string, unknown>;
    const search = parseLastFlightSearch(JSON.stringify(candidate), today);
    const savedAt = typeof candidate.savedAt === "number" && Number.isFinite(candidate.savedAt) ? candidate.savedAt : 0;
    if (!search || savedAt <= 0) continue;
    const key = `${search.tripType}:${search.origin}:${search.destination}:${search.departureDate}:${search.returnDate}:${search.adults}:${search.children}:${search.infants}:${search.cabinClass}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push({ ...search, savedAt });
    if (recent.length >= MAX_RECENT_FLIGHT_SEARCHES) break;
  }
  return recent;
}
