import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { agencySettings, flightSearchHistory } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "../_core/email";

// ─── Simple In-Memory Cache for SearchAPI ────────────────────────────────────
interface CacheEntry {
  data: any;
  timestamp: number;
}
const flightCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedSearch(key: string) {
  const entry = flightCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    flightCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedSearch(key: string, data: any) {
  flightCache.set(key, { data, timestamp: Date.now() });
}

// ─── IATA Airport Database ────────────────────────────────────────────────────
export const AIRPORTS: Record<string, { name: string; city: string; country: string; iata: string }> = {
  YAO: { iata: "YAO", name: "Yaoundé Nsimalen", city: "Yaoundé", country: "Cameroun" },
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

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function addMinutes(timeStr: string, minutes: number) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

const AGENCY_MARKUP = 0.08;

function applyMarkup(price: number) {
  return Math.round(price * (1 + AGENCY_MARKUP));
}

function generateFlights(
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number,
  cabinClass: string
) {
  const airlineKeys = Object.keys(AIRLINES);
  const results = [];
  const count = randomBetween(6, 12);

  const basePrice: Record<string, number> = {
    ECONOMY: randomBetween(280, 650),
    PREMIUM_ECONOMY: randomBetween(600, 1200),
    BUSINESS: randomBetween(1500, 3500),
    FIRST: randomBetween(4000, 8000),
  };
  const base = basePrice[cabinClass] ?? basePrice.ECONOMY;
  const departureTimes = ["06:15", "07:30", "09:00", "10:45", "12:30", "14:00", "15:45", "17:20", "19:00", "21:30", "23:00"];

  for (let i = 0; i < count; i++) {
    const airlineCode = airlineKeys[i % airlineKeys.length];
    const airline = AIRLINES[airlineCode];
    const flightNumber = `${airlineCode}${randomBetween(100, 999)}`;
    const stops = i < 4 ? 0 : i < 8 ? 1 : 2;
    const durationMinutes = stops === 0 ? randomBetween(240, 480) : stops === 1 ? randomBetween(480, 720) : randomBetween(720, 1080);
    const depTime = departureTimes[i % departureTimes.length];
    const arrTime = addMinutes(depTime, durationMinutes);
    const pricePerPax = applyMarkup(base + randomBetween(-50, 150) + stops * 30);
    const totalPrice = pricePerPax * passengers;

    const stopDetails = [];
    if (stops >= 1) {
      const layoverAirports = ["ADD", "CMN", "DXB", "IST", "CDG", "NBO"];
      const layover1 = layoverAirports[randomBetween(0, layoverAirports.length - 1)];
      stopDetails.push({
        airport: layover1,
        airportName: AIRPORTS[layover1]?.name ?? layover1,
        duration: `${randomBetween(1, 3)}h${randomBetween(0, 5) * 10}`,
      });
    }

    results.push({
      id: `FL-${i + 1}-${Date.now()}`,
      airline: { ...airline },
      flightNumber,
      origin,
      originName: AIRPORTS[origin]?.name ?? origin,
      originCity: AIRPORTS[origin]?.city ?? origin,
      destination,
      destinationName: AIRPORTS[destination]?.name ?? destination,
      destinationCity: AIRPORTS[destination]?.city ?? destination,
      departureDate,
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: formatDuration(durationMinutes),
      durationMinutes,
      stops,
      stopDetails,
      cabinClass,
      pricePerPax,
      totalPrice,
      currency: "XAF",
      seatsLeft: randomBetween(2, 9),
      baggage: cabinClass === "ECONOMY" ? "23kg inclus" : "2x32kg inclus",
      refundable: i % 3 === 0,
      pnrRef: `3M${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      isLiveGoogleFlights: false,
    });
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
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
        departureDate: z.string(),
        returnDate: z.string().optional(),
        adults: z.number().min(1).max(9).default(1),
        children: z.number().min(0).max(8).default(0),
        infants: z.number().min(0).max(4).default(0),
        cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
        alliance: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = `${input.tripType}-${input.origin}-${input.destination}-${input.departureDate}-${input.returnDate || ""}-${input.adults}-${input.cabinClass}-${input.alliance || "ALL"}`;
      const cached = getCachedSearch(cacheKey);
      if (cached) {
        return cached;
      }

      const apiKey = process.env.SEARCHAPI_KEY;

      if (!apiKey) {
        const totalPax = input.adults + input.children;
        let outbound = generateFlights(input.origin, input.destination, input.departureDate, totalPax, input.cabinClass);
        if (input.alliance && input.alliance !== "ALL") {
          outbound = outbound.filter((f) => f.airline.alliance === input.alliance);
        }
        const result = { tripType: input.tripType, outbound, inbound: [], searchParams: input, currency: "XAF", agencyMarkup: AGENCY_MARKUP, isDemo: true };
        setCachedSearch(cacheKey, result);
        return result;
      }

      try {
        const travelClassMap: Record<string, string> = {
          ECONOMY: "economy",
          PREMIUM_ECONOMY: "premium_economy",
          BUSINESS: "business",
          FIRST: "first_class",
        };

        const params = new URLSearchParams({
          engine: "google_flights",
          api_key: apiKey,
          departure_id: input.origin,
          arrival_id: input.destination,
          outbound_date: input.departureDate,
          flight_type: input.tripType === "ROUND_TRIP" ? "round_trip" : "one_way",
          travel_class: travelClassMap[input.cabinClass] ?? "economy",
          adults: String(input.adults),
          children: String(input.children),
          currency: "XAF",
        });
        if (input.tripType === "ROUND_TRIP" && input.returnDate) {
          params.set("return_date", input.returnDate);
        }

        const res = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`);
        if (!res.ok) throw new Error(`SearchAPI.io a répondu ${res.status}`);
        const json = await res.json();

        const allResults = [...(json.best_flights || []), ...(json.other_flights || [])];
        if (allResults.length === 0) {
          const totalPax = input.adults + input.children;
          let outbound = generateFlights(input.origin, input.destination, input.departureDate, totalPax, input.cabinClass);
          if (input.alliance && input.alliance !== "ALL") {
            outbound = outbound.filter((f) => f.airline.alliance === input.alliance);
          }
          const result = { tripType: input.tripType, outbound, inbound: [], searchParams: input, currency: "XAF", agencyMarkup: AGENCY_MARKUP, isDemo: false };
          setCachedSearch(cacheKey, result);
          return result;
        }

        const totalPax = input.adults + input.children;

        const toFlightResult = (item: any, index: number) => {
          const firstLeg = item.flights?.[0];
          const lastLeg = item.flights?.[item.flights.length - 1];
          if (!firstLeg || !lastLeg) return null;

          const stops = (item.flights?.length ?? 1) - 1;
          const stopDetails = (item.layovers || []).map((l: any) => ({
            airport: l.id,
            airportName: l.name,
            duration: formatDuration(l.duration),
          }));

          const airlineCode = firstLeg.flight_number?.split(" ")[0] ?? "AF";
          const knownAirline = AIRLINES[airlineCode];
          const airline = knownAirline || { code: airlineCode, name: firstLeg.airline || "Compagnie aérienne", logo: firstLeg.airline_logo || "", color: "#1E3A8A", alliance: "Autre" };

          return {
            id: `SA-${index}-${firstLeg.flight_number}`,
            airline,
            flightNumber: firstLeg.flight_number,
            origin: firstLeg.departure_airport?.id ?? input.origin,
            originName: firstLeg.departure_airport?.name ?? input.origin,
            originCity: AIRPORTS[input.origin]?.city ?? input.origin,
            destination: lastLeg.arrival_airport?.id ?? input.destination,
            destinationName: lastLeg.arrival_airport?.name ?? input.destination,
            destinationCity: AIRPORTS[input.destination]?.city ?? input.destination,
            departureDate: firstLeg.departure_airport?.date ?? input.departureDate,
            departureTime: firstLeg.departure_airport?.time ?? "--:--",
            arrivalTime: lastLeg.arrival_airport?.time ?? "--:--",
            duration: formatDuration(item.total_duration),
            durationMinutes: item.total_duration,
            stops,
            stopDetails,
            cabinClass: input.cabinClass,
            pricePerPax: Math.round(item.price),
            totalPrice: Math.round(item.price) * totalPax,
            currency: "XAF",
            seatsLeft: randomBetween(2, 9),
            baggage: input.cabinClass === "ECONOMY" ? "23kg inclus" : "2x32kg inclus",
            refundable: true,
            pnrRef: `3M${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            isLiveGoogleFlights: true,
          };
        };

        let outbound = allResults.map((item, i) => toFlightResult(item, i)).filter(Boolean);
        if (input.alliance && input.alliance !== "ALL") {
          outbound = outbound.filter((f: any) => f.airline.alliance === input.alliance);
        }

        const result = {
          tripType: input.tripType,
          outbound,
          inbound: [],
          searchParams: input,
          currency: "XAF",
          agencyMarkup: AGENCY_MARKUP,
          isDemo: false,
        };
        setCachedSearch(cacheKey, result);
        return result;
      } catch (err) {
        console.error("SearchAPI error, falling back to mock:", err);
        const totalPax = input.adults + input.children;
        let outbound = generateFlights(input.origin, input.destination, input.departureDate, totalPax, input.cabinClass);
        if (input.alliance && input.alliance !== "ALL") {
          outbound = outbound.filter((f) => f.airline.alliance === input.alliance);
        }
        const result = { tripType: input.tripType, outbound, inbound: [], searchParams: input, currency: "XAF", agencyMarkup: AGENCY_MARKUP, isDemo: true };
        setCachedSearch(cacheKey, result);
        return result;
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

  updateCommission: publicProcedure
    .input(z.object({ sessionToken: z.string(), commissionPercent: z.number().min(0).max(50) }))
    .mutation(async ({ input }) => {
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
        userEmail: z.string().email().optional(),
        origin: z.string(),
        destination: z.string(),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        adults: z.number().default(1),
        cabinClass: z.string().default("ECONOMY"),
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

  getSearchHistory: publicProcedure
    .input(z.object({ userEmail: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(flightSearchHistory)
        .where(eq(flightSearchHistory.userEmail, input.userEmail))
        .orderBy(desc(flightSearchHistory.createdAt))
        .limit(20);
    }),

  sendFlightSummaryEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Adresse email invalide"),
        flightDetails: z.object({
          airlineName: z.string(),
          flightNumber: z.string(),
          origin: z.string(),
          destination: z.string(),
          departureDate: z.string(),
          departureTime: z.string(),
          arrivalTime: z.string(),
          duration: z.string(),
          stops: z.number(),
          cabinClass: z.string(),
          totalPrice: z.number(),
          pnrRef: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { email, flightDetails } = input;
      const subject = `✈️ Récapitulatif de votre vol — Réf PNR #${flightDetails.pnrRef}`;
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
              <div style="font-size: 12px; font-weight: bold; color: #2563EB; text-transform: uppercase; margin-bottom: 8px;">Référence PNR : ${flightDetails.pnrRef}</div>
              <div style="font-size: 18px; font-weight: bold; color: #1E3A8A; margin-bottom: 4px;">${flightDetails.airlineName} (${flightDetails.flightNumber})</div>
              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>Itinéraire :</strong> ${flightDetails.origin} ➔ ${flightDetails.destination}</div>
              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>Départ :</strong> ${flightDetails.departureDate} à ${flightDetails.departureTime} (Arrivée: ${flightDetails.arrivalTime})</div>
              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;"><strong>Durée :</strong> ${flightDetails.duration} | <strong>Escale(s) :</strong> ${flightDetails.stops === 0 ? "Direct" : flightDetails.stops + " escale(s)"}</div>
              <div style="font-size: 16px; font-weight: bold; color: #15803d; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">Prix total estimé : ${flightDetails.totalPrice.toLocaleString("fr-FR")} XAF</div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://wa.me/237620996045?text=Bonjour,%20je%20confirme%20la%20réservation%20du%20vol%20PNR%20${flightDetails.pnrRef}" style="background: #16a34a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Contacter l'agence sur WhatsApp</a>
            </div>

            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">© 2024 3M Travel & Services • hello@3mtravelagency.com</p>
          </div>
        </div>
      `;

      await sendEmail({ to: email, subject, html });
      return { success: true };
    }),
});
