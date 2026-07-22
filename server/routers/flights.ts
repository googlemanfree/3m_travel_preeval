import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

// ─── IATA Airport Database (subset for demo) ─────────────────────────────────
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

// ─── Airlines ─────────────────────────────────────────────────────────────────
const AIRLINES: Record<string, { name: string; code: string; logo: string; color: string }> = {
  AF: { code: "AF", name: "Air France", logo: "https://logo.clearbit.com/airfrance.com", color: "#002157" },
  ET: { code: "ET", name: "Ethiopian Airlines", logo: "https://logo.clearbit.com/ethiopianairlines.com", color: "#006633" },
  QR: { code: "QR", name: "Qatar Airways", logo: "https://logo.clearbit.com/qatarairways.com", color: "#5C0632" },
  TK: { code: "TK", name: "Turkish Airlines", logo: "https://logo.clearbit.com/turkishairlines.com", color: "#C8102E" },
  AC: { code: "AC", name: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com", color: "#D50032" },
  EK: { code: "EK", name: "Emirates", logo: "https://logo.clearbit.com/emirates.com", color: "#C8102E" },
  LH: { code: "LH", name: "Lufthansa", logo: "https://logo.clearbit.com/lufthansa.com", color: "#05164D" },
  KQ: { code: "KQ", name: "Kenya Airways", logo: "https://logo.clearbit.com/kenya-airways.com", color: "#CC0000" },
  SN: { code: "SN", name: "Brussels Airlines", logo: "https://logo.clearbit.com/brusselsairlines.com", color: "#003399" },
  WB: { code: "WB", name: "RwandAir", logo: "https://logo.clearbit.com/rwandair.com", color: "#00A0E3" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// Agency markup percentage (configurable)
const AGENCY_MARKUP = 0.08; // 8%

function applyMarkup(price: number) {
  return Math.round(price * (1 + AGENCY_MARKUP));
}

// ─── Mock flight generator ────────────────────────────────────────────────────
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

  // Prix de base en USD (convertis en FCFA avec taux ~600 FCFA/USD)
  const basePrice: Record<string, number> = {
    ECONOMY: randomBetween(400, 800),    // 240 000 - 480 000 FCFA
    PREMIUM_ECONOMY: randomBetween(900, 1400),  // 540 000 - 840 000 FCFA
    BUSINESS: randomBetween(2000, 4000),  // 1.2M - 2.4M FCFA
    FIRST: randomBetween(5000, 9000),    // 3M - 5.4M FCFA
  };
  const base = basePrice[cabinClass] ?? basePrice.ECONOMY;

  const departureTimes = ["06:15", "07:30", "09:00", "10:45", "12:30", "14:00", "15:45", "17:20", "19:00", "21:30", "23:00"];

  // Filtrer les compagnies selon la route (retirer Royal Air Maroc)
  const validAirlines = airlineKeys.filter(k => k !== "AT");
  
  for (let i = 0; i < count; i++) {
    const airlineCode = validAirlines[i % validAirlines.length];
    const airline = AIRLINES[airlineCode];
    const flightNumber = `${airlineCode}${randomBetween(100, 999)}`;
    const stops = i < 3 ? 0 : i < 7 ? 1 : 2;
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
    if (stops >= 2) {
      const layoverAirports2 = ["LHR", "FRA", "AMS", "MAD"];
      const layover2 = layoverAirports2[randomBetween(0, layoverAirports2.length - 1)];
      stopDetails.push({
        airport: layover2,
        airportName: AIRPORTS[layover2]?.name ?? layover2,
        duration: `${randomBetween(1, 2)}h${randomBetween(0, 5) * 10}`,
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
    });
  }

  // Sort by price
  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const flightsRouter = router({
  // Airport autocomplete
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

  // Search flights (mock Travelport Low Fare Shopping)
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
      })
    )
    .query(({ input }) => {
      const totalPax = input.adults + input.children;
      const outbound = generateFlights(input.origin, input.destination, input.departureDate, totalPax, input.cabinClass);
      const inbound =
        input.tripType === "ROUND_TRIP" && input.returnDate
          ? generateFlights(input.destination, input.origin, input.returnDate, totalPax, input.cabinClass)
          : [];

      return {
        tripType: input.tripType,
        outbound,
        inbound,
        searchParams: input,
        currency: "XAF",
        agencyMarkup: AGENCY_MARKUP,
        // NOTE: Replace with real Travelport API call when credentials available
        // Endpoint: POST https://api.travelport.com/11/air/search
        isDemo: true,
      };
    }),

  // Get flight details / pricing (mock Travelport Air Price)
  getFlightPrice: publicProcedure
    .input(z.object({ flightId: z.string(), pnrRef: z.string() }))
    .query(({ input }) => {
      return {
        flightId: input.flightId,
        pnrRef: input.pnrRef,
        priceConfirmed: true,
        taxes: randomBetween(45000, 120000),
        fees: randomBetween(15000, 35000),
        isDemo: true,
      };
    }),
});
