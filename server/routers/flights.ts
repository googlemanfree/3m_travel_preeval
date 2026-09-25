import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agencySettings, favoriteFlights, flightSearchHistory } from "../../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import { candidateProcedure } from "./candidate";
import { sendEmail } from "../_core/email";
import { requireValidAdminSession } from "./adminAuth";
import { flightSearchCache } from "../services/flightSearchCache";
import { validateFlightDates } from "../services/flightDateValidation";
import { createSubmissionGuard } from "../_core/publicRateLimit";

// Récapitulatif de vol par e-mail : 3 envois par adresse destinataire et 10 par adresse cliente et par heure,
// 200 au total par heure pour borner le pire cas même si l'en-tête `x-forwarded-for` est falsifié.
const flightSummaryGuard = createSubmissionGuard({
  perClient: { limit: 10, windowMs: 60 * 60_000 },
  perEmail: { limit: 3, windowMs: 60 * 60_000 },
  global: { limit: 200, windowMs: 60 * 60_000 },
});

function esc(v: string | number | undefined | null): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getCachedSearch(key: string): any | null {
  const entry = flightSearchCache.get(key);
  if (!entry) return null;
  return {
    ...(entry.data as Record<string, unknown>),
    cache: { servedFromCache: true, expiresAt: entry.expiresAt },
  };
}

function setCachedSearch(key: string, data: any) {
  flightSearchCache.set(key, data);
}

// ─── IATA Airport Database ────────────────────────────────────────────────────
export const AIRPORTS: Record<string, { name: string; city: string; country: string; iata: string }> = {
  NSI: { iata: "NSI", name: "Yaoundé Nsimalen", city: "Yaoundé", country: "Cameroun" },
  DLA: { iata: "DLA", name: "Douala International", city: "Douala", country: "Cameroun" },
  CDG: { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France" },
  ORY: { iata: "ORY", name: "Paris Orly", city: "Paris", country: "France" },
  LHR: { iata: "LHR", name: "Heathrow", city: "Londres", country: "Royaume-Uni" },
  FRA: { iata: "FRA", name: "Frankfurt am Main", city: "Francfort", country: "Allemagne" },
  BRU: { iata: "BRU", name: "Brussels Airport", city: "Bruxelles", country: "Belgique" },
  MAD: { iata: "MAD", name: "Adolfo Suárez Barajas", city: "Madrid", country: "Espagne" },
  FCO: { iata: "FCO", name: "Leonardo da Vinci", city: "Rome", country: "Italie" },
  AMS: { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Pays-Bas" },
  YUL: { iata: "YUL", name: "Montréal-Trudeau", city: "Montréal", country: "Canada" },
  YYZ: { iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada" },
  JFK: { iata: "JFK", name: "John F. Kennedy", city: "New York", country: "États-Unis" },
  LAX: { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "États-Unis" },
  DXB: { iata: "DXB", name: "Dubai International", city: "Dubaï", country: "Émirats Arabes" },
  ADD: { iata: "ADD", name: "Addis Abeba Bole", city: "Addis Abeba", country: "Éthiopie" },
  NBO: { iata: "NBO", name: "Jomo Kenyatta", city: "Nairobi", country: "Kenya" },
  ABJ: { iata: "ABJ", name: "Félix Houphouët-Boigny", city: "Abidjan", country: "Côte d'Ivoire" },
  LOS: { iata: "LOS", name: "Murtala Muhammed", city: "Lagos", country: "Nigeria" },
  ACC: { iata: "ACC", name: "Kotoka International", city: "Accra", country: "Ghana" },
  CMN: { iata: "CMN", name: "Mohammed V", city: "Casablanca", country: "Maroc" },
  TUN: { iata: "TUN", name: "Tunis-Carthage", city: "Tunis", country: "Tunisie" },
  CAI: { iata: "CAI", name: "Le Caire International", city: "Le Caire", country: "Égypte" },
  IST: { iata: "IST", name: "Istanbul Aéroport", city: "Istanbul", country: "Turquie" },
  PEK: { iata: "PEK", name: "Beijing Capital", city: "Pékin", country: "Chine" },
  SIN: { iata: "SIN", name: "Singapore Changi", city: "Singapour", country: "Singapour" },
  BKK: { iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thaïlande" },
  GVA: { iata: "GVA", name: "Genève-Cointrin", city: "Genève", country: "Suisse" },
  ZRH: { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Suisse" },
  VIE: { iata: "VIE", name: "Vienna International", city: "Vienne", country: "Autriche" },
  MUC: { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Allemagne" },
  BCN: { iata: "BCN", name: "El Prat", city: "Barcelone", country: "Espagne" },
  LIS: { iata: "LIS", name: "Humberto Delgado", city: "Lisbonne", country: "Portugal" },
};

// ─── Airlines & Alliances ─────────────────────────────────────────────────────
const AIRLINES: Record<string, { name: string; code: string; logo: string; color: string; alliance: "SkyTeam" | "Star Alliance" | "Oneworld" | "Autre" }> = {
  AF: { code: "AF", name: "Air France", logo: "https://logo.clearbit.com/airfrance.com", color: "#002157", alliance: "SkyTeam" },
  ET: { code: "ET", name: "Ethiopian Airlines", logo: "https://logo.clearbit.com/ethiopianairlines.com", color: "#006633", alliance: "Star Alliance" },
  QR: { code: "QR", name: "Qatar Airways", logo: "https://logo.clearbit.com/qatarairways.com", color: "#5C0632", alliance: "Oneworld" },
  TK: { code: "TK", name: "Turkish Airlines", logo: "https://logo.clearbit.com/turkishairlines.com", color: "#C8102E", alliance: "Star Alliance" },
  AC: { code: "AC", name: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com", color: "#D50032", alliance: "Star Alliance" },
  EK: { code: "EK", name: "Emirates", logo: "https://logo.clearbit.com/emirates.com", color: "#C8102E", alliance: "Autre" },
  LH: { code: "LH", name: "Lufthansa", logo: "https://logo.clearbit.com/lufthansa.com", color: "#05164D", alliance: "Star Alliance" },
  KQ: { code: "KQ", name: "Kenya Airways", logo: "https://logo.clearbit.com/kenya-airways.com", color: "#CC0000", alliance: "SkyTeam" },
  AT: { code: "AT", name: "Royal Air Maroc", logo: "https://logo.clearbit.com/royalairmaroc.com", color: "#006233", alliance: "Oneworld" },
  SN: { code: "SN", name: "Brussels Airlines", logo: "https://logo.clearbit.com/brusselsairlines.com", color: "#003399", alliance: "Star Alliance" },
  WB: { code: "WB", name: "RwandAir", logo: "https://logo.clearbit.com/rwandair.com", color: "#00A0E3", alliance: "Autre" },
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function parseSearchApiPrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^\d]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// SearchAPI ne prend pas XAF en charge. Le franc CFA est rattaché à l'euro
// par une parité fixe : les tarifs live peuvent donc être présentés en FCFA.
const XAF_PER_EUR = 655.957;

// Rien n'est inventé dans les résultats : chaque tarif et chaque horaire vient du fournisseur (Google Flights via
// SearchAPI.io). Quand il ne répond pas, on n'affiche AUCUN tarif plutôt qu'un tarif de remplacement.
const NO_LIVE_FARES_NOTICE = "La recherche en direct est momentanément indisponible. Nous préférons n’afficher aucun tarif plutôt qu’un tarif non vérifié : un conseiller 3M vous communique les tarifs réels par WhatsApp ou par e-mail.";
const INFANT_PRICE_NOTICE = "Le tarif affiché ne comprend pas les bébés : un conseiller confirme le prix exact avant toute réservation.";

/** Réponse de recherche, toujours de même forme ; `retrievedAt` n'est renseigné que pour des tarifs relevés en direct. */
function searchResult(
  input: Record<string, unknown> & { tripType: string },
  fields: { outbound: any[]; providerStatus: string; providerNotice?: string | null; retrievedAt?: string | null },
) {
  return {
    tripType: input.tripType,
    outbound: fields.outbound,
    inbound: [] as any[],
    searchParams: input,
    currency: "XAF",
    isDemo: false as const,
    providerStatus: fields.providerStatus,
    providerNotice: fields.providerNotice ?? null,
    retrievedAt: fields.retrievedAt ?? null,
    cache: { servedFromCache: false },
  };
}

function returnResult(inbound: any[], providerStatus: string, providerNotice: string | null = null, retrievedAt: string | null = null) {
  return { inbound, isDemo: false as const, providerStatus, providerNotice, retrievedAt };
}

type SearchApiLegParams = {
  origin: string;
  destination: string;
  departureDate: string;
  cabinClass: string;
  adults: number;
  children: number;
  infants: number;
  /** "SA" pour le vol aller, "SA-RET" pour le vol retour — evite toute collision d'id entre les deux legs. */
  idPrefix: string;
};

/** Convertit un item best_flights/other_flights de SearchAPI.io (Google Flights) en Flight interne.
 * Reutilise pour le vol aller (premiere requete) et le vol retour (seconde requete avec departure_token). */
function mapSearchApiFlightItem(item: any, index: number, params: SearchApiLegParams) {
  const firstLeg = item.flights?.[0];
  const lastLeg = item.flights?.[item.flights.length - 1];
  const sourcePrice = parseSearchApiPrice(item.price);
  if (!firstLeg || !lastLeg || sourcePrice === null) return null;

  const stops = (item.flights?.length ?? 1) - 1;
  const stopDetails = (item.layovers || []).map((l: any) => ({
    airport: l.id,
    airportName: l.name,
    duration: formatDuration(l.duration),
  }));

  const airlineCode = firstLeg.flight_number?.split(" ")[0] ?? "AF";
  const knownAirline = AIRLINES[airlineCode];
  const airline = knownAirline || { code: airlineCode, name: firstLeg.airline || "Compagnie aérienne", logo: firstLeg.airline_logo || "", color: "#1E3A8A", alliance: "Autre" };

  // Le fournisseur renvoie le prix TOTAL pour les voyageurs demandés (adultes + enfants), pas un prix par personne :
  // le multiplier encore par le nombre de voyageurs doublait le total dès deux adultes. Les bébés ne sont pas
  // demandés au fournisseur : ils ne sont donc pas inclus (voir INFANT_PRICE_NOTICE).
  const pricedPassengers = Math.max(1, params.adults + params.children);
  const totalPriceXaf = Math.round(sourcePrice * XAF_PER_EUR);

  return {
    id: `${params.idPrefix}-${index}-${firstLeg.flight_number}`,
    airline,
    flightNumber: firstLeg.flight_number,
    origin: firstLeg.departure_airport?.id ?? params.origin,
    originName: firstLeg.departure_airport?.name ?? params.origin,
    originCity: AIRPORTS[params.origin]?.city ?? params.origin,
    destination: lastLeg.arrival_airport?.id ?? params.destination,
    destinationName: lastLeg.arrival_airport?.name ?? params.destination,
    destinationCity: AIRPORTS[params.destination]?.city ?? params.destination,
    departureDate: firstLeg.departure_airport?.date ?? params.departureDate,
    departureTime: firstLeg.departure_airport?.time ?? "--:--",
    arrivalTime: lastLeg.arrival_airport?.time ?? "--:--",
    duration: formatDuration(item.total_duration),
    durationMinutes: item.total_duration,
    stops,
    stopDetails,
    cabinClass: params.cabinClass,
    pricePerPax: Math.round(totalPriceXaf / pricedPassengers),
    totalPrice: totalPriceXaf,
    pricedPassengers,
    currency: "XAF",
    sourceCurrency: "EUR",
    sourcePrice,
    isLiveGoogleFlights: true,
    departureToken: item.departure_token ?? null,
  };
}

export const flightsRouter = router({
  searchAirports: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      const q = input.query.toLowerCase();
      return Object.values(AIRPORTS).filter(
        (a) =>
          a.iata.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q)
      ).slice(0, 8);
    }),

  searchFlights: publicProcedure
    .input(
      z.object({
        tripType: z.enum(["ONE_WAY", "ROUND_TRIP", "MULTI"]),
        origin: z.string().length(3),
        destination: z.string().length(3),
        departureDate: z.string().max(20),
        returnDate: z.string().max(20).optional(),
        adults: z.number().min(1).max(9).default(1),
        children: z.number().min(0).max(8).default(0),
        infants: z.number().min(0).max(4).default(0),
        cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
        alliance: z.string().max(50).optional(),
      }).superRefine((input, ctx) => {
        const error = validateFlightDates(input);
        if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ["departureDate"] });
      })
    )
    .query(async ({ input }) => {
      // La clé de cache couvre TOUS les paramètres qui changent le prix (enfants et bébés compris).
      const cacheKey = `${input.tripType}-${input.origin}-${input.destination}-${input.departureDate}-${input.returnDate || ""}-${input.adults}-${input.children}-${input.infants}-${input.cabinClass}-${input.alliance || "ALL"}`;
      const cached = getCachedSearch(cacheKey);
      if (cached) {
        return cached;
      }

      const apiKey = process.env.SEARCHAPI_KEY;

      // Jamais de tarif fabriqué : sans fournisseur, on n'affiche aucun tarif (et on ne met rien en cache).
      if (!apiKey) {
        flightSearchCache.markNotConfigured();
        return searchResult(input, { outbound: [], providerStatus: "not_configured", providerNotice: NO_LIVE_FARES_NOTICE });
      }

      try {
        // YAO a été historiquement utilisé dans l'interface, mais NSI est le code IATA
        // reconnu par Google Flights pour Yaoundé-Nsimalen.
        const searchOrigin = input.origin === "YAO" ? "NSI" : input.origin;
        const searchDestination = input.destination === "YAO" ? "NSI" : input.destination;
        const travelClassMap: Record<string, string> = {
          ECONOMY: "economy",
          PREMIUM_ECONOMY: "premium_economy",
          BUSINESS: "business",
          FIRST: "first_class",
        };

        const params = new URLSearchParams({
          engine: "google_flights",
          api_key: apiKey,
          departure_id: searchOrigin,
          arrival_id: searchDestination,
          outbound_date: input.departureDate,
          flight_type: input.tripType === "ROUND_TRIP" ? "round_trip" : "one_way",
          travel_class: travelClassMap[input.cabinClass] ?? "economy",
          adults: String(input.adults),
          children: String(input.children),
          currency: "EUR",
        });
        if (input.tripType === "ROUND_TRIP" && input.returnDate) {
          params.set("return_date", input.returnDate);
        }

        const res = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`, { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) {
          const details = (await res.text()).replace(/\s+/g, " ").slice(0, 160);
          const message = `SearchAPI.io a répondu ${res.status}${details ? ` — ${details}` : ""}`;
          flightSearchCache.recordUnavailable(res.status === 429 ? "quota_limited" : "error", message);
          throw new Error(message);
        }
        const json = await res.json();

        const allResults = [...(json.best_flights || []), ...(json.other_flights || [])];
        const infantNotice = input.infants > 0 ? INFANT_PRICE_NOTICE : null;
        if (allResults.length === 0) {
          flightSearchCache.recordLiveResult();
          const result = searchResult(input, { outbound: [], providerStatus: "live_no_results", providerNotice: infantNotice, retrievedAt: new Date().toISOString() });
          setCachedSearch(cacheKey, result);
          return result;
        }

        const legParams: SearchApiLegParams = {
          origin: input.origin,
          destination: input.destination,
          departureDate: input.departureDate,
          cabinClass: input.cabinClass,
          adults: input.adults,
          children: input.children,
          infants: input.infants,
          idPrefix: "SA",
        };

        let outbound = allResults.map((item, i) => mapSearchApiFlightItem(item, i, legParams)).filter(Boolean);
        if (input.alliance && input.alliance !== "ALL") {
          outbound = outbound.filter((f: any) => f.airline.alliance === input.alliance);
        }

        flightSearchCache.recordLiveResult();
        const result = searchResult(input, { outbound, providerStatus: "live", providerNotice: infantNotice, retrievedAt: new Date().toISOString() });
        setCachedSearch(cacheKey, result);
        return result;
      } catch (err) {
        console.error("SearchAPI error :", err);
        if (!flightSearchCache.getStatus().lastError) {
          flightSearchCache.recordUnavailable("error", err instanceof Error ? err.message : "Erreur SearchAPI inconnue");
        }
        // Panne du fournisseur : aucun tarif de remplacement, et rien n'est mis en cache.
        return searchResult(input, { outbound: [], providerStatus: flightSearchCache.getStatus().apiStatus, providerNotice: NO_LIVE_FARES_NOTICE });
      }
    }),

  /**
   * Étape 2 d'une recherche aller-retour Google Flights (via SearchAPI.io) : la première requête
   * (searchFlights) ne renvoie que les vols ALLER, chacun porteur d'un departure_token. Cette
   * procédure interroge SearchAPI.io une seconde fois avec ce token pour obtenir les vraies
   * options de vol RETOUR correspondant au vol aller choisi — jamais un tableau vide inventé.
   */
  searchReturnFlights: publicProcedure
    .input(
      z.object({
        origin: z.string().length(3),
        destination: z.string().length(3),
        departureDate: z.string().max(20),
        returnDate: z.string().max(20),
        adults: z.number().min(1).max(9).default(1),
        children: z.number().min(0).max(8).default(0),
        infants: z.number().min(0).max(4).default(0),
        cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
        departureToken: z.string().max(512).nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      const apiKey = process.env.SEARCHAPI_KEY;
      // Vol retour = trajet inverse (destination -> origin) à la date de retour.
      const returnLegParams: SearchApiLegParams = {
        origin: input.destination,
        destination: input.origin,
        departureDate: input.returnDate,
        cabinClass: input.cabinClass,
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        idPrefix: "SA-RET",
      };

      // Jamais d'option de retour fabriquée : sans fournisseur ou sans jeton de départ, aucune option n'est affichée.
      if (!apiKey || !input.departureToken) {
        return returnResult([], apiKey ? "no_departure_token" : "not_configured", NO_LIVE_FARES_NOTICE);
      }

      try {
        const searchOrigin = input.origin === "YAO" ? "NSI" : input.origin;
        const searchDestination = input.destination === "YAO" ? "NSI" : input.destination;
        const travelClassMap: Record<string, string> = {
          ECONOMY: "economy",
          PREMIUM_ECONOMY: "premium_economy",
          BUSINESS: "business",
          FIRST: "first_class",
        };
        const params = new URLSearchParams({
          engine: "google_flights",
          api_key: apiKey,
          departure_id: searchOrigin,
          arrival_id: searchDestination,
          outbound_date: input.departureDate,
          return_date: input.returnDate,
          flight_type: "round_trip",
          travel_class: travelClassMap[input.cabinClass] ?? "economy",
          adults: String(input.adults),
          children: String(input.children),
          currency: "EUR",
          departure_token: input.departureToken,
        });

        const res = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`, { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) {
          throw new Error(`SearchAPI.io (retour) a répondu ${res.status}`);
        }
        const json = await res.json();
        const allResults = [...(json.best_flights || []), ...(json.other_flights || [])];
        const infantNotice = input.infants > 0 ? INFANT_PRICE_NOTICE : null;
        if (allResults.length === 0) {
          return returnResult([], "live_no_results", infantNotice, new Date().toISOString());
        }
        const inbound = allResults.map((item, i) => mapSearchApiFlightItem(item, i, returnLegParams)).filter(Boolean);
        return returnResult(inbound, "live", infantNotice, new Date().toISOString());
      } catch (err) {
        console.error("SearchAPI error (retour) :", err);
        return returnResult([], "error", NO_LIVE_FARES_NOTICE);
      }
    }),

  getCommission: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { commissionPercent: 8 };
    const rows = await db.select().from(agencySettings).where(eq(agencySettings.settingKey, "flight_commission_percent"));
    if (rows.length > 0) {
      return { commissionPercent: parseFloat(rows[0].settingValue) || 8 };
    }
    return { commissionPercent: 8 };
  }),

  getSearchApiStatus: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      return {
        keyConfigured: Boolean(process.env.SEARCHAPI_KEY),
        ...flightSearchCache.getStatus(),
      };
    }),

  clearSearchApiCache: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      flightSearchCache.clear();
      return { success: true, ...flightSearchCache.getStatus() };
    }),

  updateCommission: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512), commissionPercent: z.number().min(0).max(50) }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new Error("DB non disponible");
      const rows = await db.select().from(agencySettings).where(eq(agencySettings.settingKey, "flight_commission_percent"));
      if (rows.length > 0) {
        await db.update(agencySettings)
          .set({ settingValue: input.commissionPercent.toString() })
          .where(eq(agencySettings.settingKey, "flight_commission_percent"));
      } else {
        await db.insert(agencySettings).values({
          settingKey: "flight_commission_percent",
          settingValue: input.commissionPercent.toString(),
        });
      }
      return { success: true, commissionPercent: input.commissionPercent };
    }),

  saveSearchHistory: publicProcedure
    .input(
      z.object({
        userEmail: z.string().email().max(320).optional(),
        origin: z.string().max(10),
        destination: z.string().max(10),
        departureDate: z.string().max(20),
        returnDate: z.string().max(20).optional(),
        adults: z.number().int().min(1).max(9).default(1),
        cabinClass: z.string().max(20).default("ECONOMY"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(flightSearchHistory).values({
        userEmail: input.userEmail || null,
        origin: input.origin,
        destination: input.destination,
        departureDate: input.departureDate,
        returnDate: input.returnDate || null,
        adults: input.adults,
        cabinClass: input.cabinClass,
      });
      return { success: true };
    }),

  // `getSearchHistory` (historique de recherches de vols lu par simple adresse e-mail, sans appelant) a été
  // RETIRÉE : une adresse e-mail n'est pas une preuve d'identité.

  saveFavoriteFlight: candidateProcedure
    .input(z.object({ flight: z.record(z.string(), z.any()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB non disponible");

      await db.insert(favoriteFlights).values({
        userId: ctx.candidate.id,
        flightData: JSON.stringify(input.flight),
      });
      return { success: true };
    }),

  getFavoriteFlights: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(favoriteFlights)
      .where(eq(favoriteFlights.userId, ctx.candidate.id))
      .orderBy(desc(favoriteFlights.createdAt))
      .limit(100);

    return rows.map((row) => {
      try {
        return { ...row, flight: JSON.parse(row.flightData) as Record<string, unknown> };
      } catch {
        return { ...row, flight: {} };
      }
    });
  }),

  deleteFavoriteFlight: candidateProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB non disponible");

      await db
        .delete(favoriteFlights)
        .where(and(eq(favoriteFlights.id, input.id), eq(favoriteFlights.userId, ctx.candidate.id)));
      return { success: true };
    }),

  sendFlightSummaryEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Adresse email invalide").max(320),
        flightDetails: z.object({
          airlineName: z.string().max(100),
          flightNumber: z.string().max(20),
          origin: z.string().max(10),
          destination: z.string().max(10),
          departureDate: z.string().max(20),
          departureTime: z.string().max(20),
          arrivalTime: z.string().max(20),
          duration: z.string().max(20),
          stops: z.number().int().min(0).max(10),
          cabinClass: z.string().max(20),
          totalPrice: z.number().positive(),
          searchRef: z.string().max(50).optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Appel public qui envoie un e-mail aux couleurs de l'agence à l'adresse saisie : sans plafond, c'était un
      // relais de spam et d'hameçonnage depuis notre domaine.
      flightSummaryGuard.assertAllowed(ctx?.req as any, input.email);
      const { email, flightDetails } = input;
      const subject = `✈️ Récapitulatif de votre sélection de vol — ${flightDetails.origin} → ${flightDetails.destination}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 16px;">
          <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">3M Travel & Services</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Récapitulatif de votre sélection de vol</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #1f2937;">Bonjour,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Voici le récapitulatif du vol que vous avez sélectionné sur notre plateforme. Vous pouvez le présenter à notre agence ou finaliser votre réservation via WhatsApp.</p>
            
            <div style="background: #eff6ff; border: 2px dashed #2563EB; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <div style="font-size: 12px; font-weight: bold; color: #2563EB; text-transform: uppercase; margin-bottom: 8px;">Sélection de vol (sans engagement)</div>
              <div style="font-size: 18px; font-weight: bold; color: #1E3A8A; margin-bottom: 4px;">${esc(flightDetails.airlineName)} (${esc(flightDetails.flightNumber)})</div>
              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>Itinéraire :</strong> ${esc(flightDetails.origin)} ➔ ${esc(flightDetails.destination)}</div>
              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>Départ :</strong> ${esc(flightDetails.departureDate)} à ${esc(flightDetails.departureTime)} (Arrivée: ${esc(flightDetails.arrivalTime)})</div>
              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>Durée :</strong> ${esc(flightDetails.duration)} | <strong>Escale(s) :</strong> ${flightDetails.stops === 0 ? "Direct" : esc(flightDetails.stops) + " escale(s)"}</div>
              <div style="font-size: 16px; font-weight: bold; color: #15803d; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">Tarif relevé : ${flightDetails.totalPrice.toLocaleString("fr-FR")} XAF <span style="font-size: 12px; font-weight: normal; color: #64748b;">(à confirmer par un conseiller avant toute réservation ou paiement)</span></div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://wa.me/237698104832?text=Bonjour,%20je%20souhaite%20réserver%20le%20vol%20${encodeURIComponent(flightDetails.flightNumber)}%20du%20${encodeURIComponent(flightDetails.departureDate)}" style="background: #16a34a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Contacter l'agence sur WhatsApp</a>
            </div>

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">© ${new Date().getFullYear()} 3M Travel & Services • hello@3mtravelagency.com</p>
          </div>
        </div>
      `;

      await sendEmail({ to: email, subject, html });
      return { success: true };
    }),
});
