/**
 * « Meilleures offres » de la page de vols : le tarif le plus bas RÉELLEMENT relevé chez le fournisseur (Google Flights via
 * SearchAPI.io) pour quelques parcours fréquents. Rien n'est écrit en dur : sans réponse du fournisseur, aucune offre n'est
 * affichée. Les relevés sont mis en mémoire 12 h pour borner le nombre d'appels payants (au plus 8 par période).
 * Fonctions pures et magasin en mémoire : l'appel réseau est fourni par le routeur.
 */

export type OfferTripType = "ROUND_TRIP" | "ONE_WAY";

export type OfferRoute = { id: string; from: { iata: string; city: string }; to: { iata: string; city: string }; tripType: OfferTripType };

const route = (from: [string, string], to: [string, string], tripType: OfferTripType = "ROUND_TRIP"): OfferRoute => ({
  id: `${from[0]}-${to[0]}`.toLowerCase(),
  from: { iata: from[0], city: from[1] },
  to: { iata: to[0], city: to[1] },
  tripType,
});

const YAOUNDE: [string, string] = ["NSI", "Yaoundé"];
const DOUALA: [string, string] = ["DLA", "Douala"];

/** Parcours interrogés (les mêmes identifiants que les parcours fréquents de la page). */
export const OFFER_ROUTES: OfferRoute[] = [
  route(YAOUNDE, ["CDG", "Paris"]),
  route(DOUALA, ["CDG", "Paris"]),
  route(DOUALA, ["BRU", "Bruxelles"]),
  route(YAOUNDE, ["DXB", "Dubaï"]),
  route(DOUALA, ["IST", "Istanbul"]),
  route(DOUALA, ["YUL", "Montréal"]),
  route(YAOUNDE, ["YUL", "Montréal"]),
  route(YAOUNDE, DOUALA),
];

export type FlightOffer = {
  routeId: string;
  tripType: OfferTripType;
  from: { iata: string; city: string };
  to: { iata: string; city: string };
  departureDate: string;
  returnDate: string | null;
  /** Tarif total aller-retour (ou aller simple) pour 1 adulte en classe économique, en FCFA. */
  priceXaf: number;
  airline: string;
  /** Logo réellement fourni par le fournisseur pour cette compagnie ; absent si inconnu (jamais un logo générique inventé). */
  airlineLogo: string | null;
  stops: number;
  durationMinutes: number;
};

export type OfferDates = { departureDate: string; returnDate: string };

const DAY_MS = 24 * 60 * 60 * 1000;
export const OFFER_MIN_LEAD_DAYS = 21;
export const OFFER_STAY_DAYS = 10;
export const OFFERS_TTL_MS = 12 * 60 * 60 * 1000;
export const OFFERS_FAILURE_TTL_MS = 10 * 60 * 1000;
export const OFFERS_MAX_STALE_MS = 36 * 60 * 60 * 1000;

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Dates des relevés : le premier lundi situé au moins 21 jours après aujourd'hui, retour 10 jours plus tard. Les dates ne
 * changent qu'une fois par semaine : la mémoire du serveur est réellement réutilisée et l'offre reste réservable.
 */
export function offerDates(now: Date): OfferDates {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + OFFER_MIN_LEAD_DAYS * DAY_MS);
  const daysToMonday = (8 - start.getUTCDay()) % 7;
  const departure = new Date(start.getTime() + daysToMonday * DAY_MS);
  return { departureDate: isoDate(departure), returnDate: isoDate(new Date(departure.getTime() + OFFER_STAY_DAYS * DAY_MS)) };
}

export type CheapestFare = { totalPrice: number; airlineName: string; airlineLogo: string | null; stops: number; durationMinutes: number };

/** Le vol le moins cher parmi des résultats du fournisseur ; ignore tout résultat sans prix valide. */
export function selectCheapest(flights: Array<{ totalPrice?: unknown; airline?: { name?: string; logo?: string } | null; stops?: unknown; durationMinutes?: unknown }>): CheapestFare | null {
  let best: CheapestFare | null = null;
  for (const flight of flights) {
    const price = typeof flight.totalPrice === "number" && Number.isFinite(flight.totalPrice) && flight.totalPrice > 0 ? Math.round(flight.totalPrice) : null;
    if (price === null) continue;
    if (best === null || price < best.totalPrice) {
      best = {
        totalPrice: price,
        airlineName: flight.airline?.name || "Compagnie aérienne",
        airlineLogo: typeof flight.airline?.logo === "string" && flight.airline.logo ? flight.airline.logo : null,
        stops: Number(flight.stops) || 0,
        durationMinutes: Number(flight.durationMinutes) || 0,
      };
    }
  }
  return best;
}

export type FetchCheapest = (route: OfferRoute, dates: OfferDates) => Promise<CheapestFare | null>;

/** Interroge les parcours avec au plus `concurrency` appels simultanés ; un parcours en échec est simplement omis. */
export async function collectOffers(fetchCheapest: FetchCheapest, routes: OfferRoute[], dates: OfferDates, concurrency = 2): Promise<{ offers: FlightOffer[]; failed: number }> {
  const offers: FlightOffer[] = [];
  let failed = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < routes.length) {
      const current = routes[cursor++];
      try {
        const fare = await fetchCheapest(current, dates);
        if (!fare) {
          failed += 1;
          continue;
        }
        offers.push({
          routeId: current.id,
          tripType: current.tripType,
          from: current.from,
          to: current.to,
          departureDate: dates.departureDate,
          returnDate: current.tripType === "ROUND_TRIP" ? dates.returnDate : null,
          priceXaf: fare.totalPrice,
          airline: fare.airlineName,
          airlineLogo: fare.airlineLogo,
          stops: fare.stops,
          durationMinutes: fare.durationMinutes,
        });
      } catch {
        failed += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, routes.length)) }, worker));
  // Ordre stable : celui de la liste des parcours, pas celui des réponses.
  const order = new Map(routes.map((item, index) => [item.id, index]));
  offers.sort((left, right) => (order.get(left.routeId) ?? 0) - (order.get(right.routeId) ?? 0));
  return { offers, failed };
}

export type OffersSnapshot = { offers: FlightOffer[]; retrievedAt: string; dates: OfferDates };

/**
 * Mémoire des offres : réussite conservée 12 h, échec total mémorisé 10 min (pour ne pas relancer 8 appels payants à chaque
 * visite quand le fournisseur est en panne), et un seul relevé en cours à la fois.
 */
export class FlightOffersStore {
  private snapshot: { value: OffersSnapshot; expiresAt: number } | null = null;
  private failedUntil = 0;
  private inFlight: Promise<OffersSnapshot | null> | null = null;

  constructor(private readonly now: () => number = Date.now) {}

  async get(load: () => Promise<OffersSnapshot | null>): Promise<OffersSnapshot | null> {
    const time = this.now();
    if (this.snapshot && this.snapshot.expiresAt > time) return this.snapshot.value;
    if (this.failedUntil > time) return this.staleSnapshot();
    if (!this.inFlight) {
      this.inFlight = load()
        .then((value) => {
          if (value && value.offers.length > 0) {
            this.snapshot = { value, expiresAt: this.now() + OFFERS_TTL_MS };
            this.failedUntil = 0;
            return value;
          }
          this.failedUntil = this.now() + OFFERS_FAILURE_TTL_MS;
          return this.staleSnapshot();
        })
        .catch(() => {
          this.failedUntil = this.now() + OFFERS_FAILURE_TTL_MS;
          return this.staleSnapshot();
        })
        .finally(() => {
          this.inFlight = null;
        });
    }
    return this.inFlight;
  }

  /** Un relevé expiré reste affichable (avec sa date) si le renouvellement échoue, mais jamais au-delà de 36 h. */
  private staleSnapshot(): OffersSnapshot | null {
    if (!this.snapshot) return null;
    const age = this.now() - Date.parse(this.snapshot.value.retrievedAt);
    return age <= OFFERS_MAX_STALE_MS ? this.snapshot.value : null;
  }

  reset() {
    this.snapshot = null;
    this.failedUntil = 0;
    this.inFlight = null;
  }
}
