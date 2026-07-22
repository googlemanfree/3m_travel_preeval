import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

// ─── IATA Airport Database ────────────────────────────────────────────────────
export const AIRPORTS: Record<string, { name: string; city: string; country: string; iata: string; timezone: string }> = {
  // Afrique Centrale
  YAO: { iata: "YAO", name: "Yaoundé Nsimalen", city: "Yaoundé", country: "Cameroun", timezone: "WAT" },
  DLA: { iata: "DLA", name: "Douala International", city: "Douala", country: "Cameroun", timezone: "WAT" },
  LBV: { iata: "LBV", name: "Léon-Mba", city: "Libreville", country: "Gabon", timezone: "WAT" },
  BZV: { iata: "BZV", name: "Maya-Maya", city: "Brazzaville", country: "Congo", timezone: "WAT" },
  FIH: { iata: "FIH", name: "N'Djili", city: "Kinshasa", country: "RDC", timezone: "WAT" },
  BGF: { iata: "BGF", name: "M'Poko", city: "Bangui", country: "RCA", timezone: "WAT" },
  NDJ: { iata: "NDJ", name: "Hassan Djamous", city: "N'Djamena", country: "Tchad", timezone: "WAT" },
  // Afrique de l'Ouest
  ABJ: { iata: "ABJ", name: "Félix Houphouët-Boigny", city: "Abidjan", country: "Côte d'Ivoire", timezone: "GMT" },
  LOS: { iata: "LOS", name: "Murtala Muhammed", city: "Lagos", country: "Nigeria", timezone: "WAT" },
  ACC: { iata: "ACC", name: "Kotoka International", city: "Accra", country: "Ghana", timezone: "GMT" },
  DKR: { iata: "DKR", name: "Blaise Diagne", city: "Dakar", country: "Sénégal", timezone: "GMT" },
  COO: { iata: "COO", name: "Cadjehoun", city: "Cotonou", country: "Bénin", timezone: "WAT" },
  OUA: { iata: "OUA", name: "Thomas Sankara", city: "Ouagadougou", country: "Burkina Faso", timezone: "GMT" },
  BKO: { iata: "BKO", name: "Modibo Keïta", city: "Bamako", country: "Mali", timezone: "GMT" },
  // Afrique de l'Est
  ADD: { iata: "ADD", name: "Addis Abeba Bole", city: "Addis Abeba", country: "Éthiopie", timezone: "EAT" },
  NBO: { iata: "NBO", name: "Jomo Kenyatta", city: "Nairobi", country: "Kenya", timezone: "EAT" },
  DAR: { iata: "DAR", name: "Julius Nyerere", city: "Dar es Salaam", country: "Tanzanie", timezone: "EAT" },
  KGL: { iata: "KGL", name: "Kigali International", city: "Kigali", country: "Rwanda", timezone: "CAT" },
  // Afrique du Nord
  CMN: { iata: "CMN", name: "Mohammed V", city: "Casablanca", country: "Maroc", timezone: "WET" },
  TUN: { iata: "TUN", name: "Tunis-Carthage", city: "Tunis", country: "Tunisie", timezone: "CET" },
  CAI: { iata: "CAI", name: "Le Caire International", city: "Le Caire", country: "Égypte", timezone: "EET" },
  ALG: { iata: "ALG", name: "Houari Boumédiène", city: "Alger", country: "Algérie", timezone: "CET" },
  // Europe
  CDG: { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", timezone: "CET" },
  ORY: { iata: "ORY", name: "Paris Orly", city: "Paris", country: "France", timezone: "CET" },
  LHR: { iata: "LHR", name: "Heathrow", city: "Londres", country: "Royaume-Uni", timezone: "GMT" },
  FRA: { iata: "FRA", name: "Frankfurt am Main", city: "Francfort", country: "Allemagne", timezone: "CET" },
  BRU: { iata: "BRU", name: "Brussels Airport", city: "Bruxelles", country: "Belgique", timezone: "CET" },
  MAD: { iata: "MAD", name: "Adolfo Suárez Barajas", city: "Madrid", country: "Espagne", timezone: "CET" },
  FCO: { iata: "FCO", name: "Leonardo da Vinci", city: "Rome", country: "Italie", timezone: "CET" },
  AMS: { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Pays-Bas", timezone: "CET" },
  LIS: { iata: "LIS", name: "Humberto Delgado", city: "Lisbonne", country: "Portugal", timezone: "WET" },
  GVA: { iata: "GVA", name: "Genève-Cointrin", city: "Genève", country: "Suisse", timezone: "CET" },
  ZRH: { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Suisse", timezone: "CET" },
  VIE: { iata: "VIE", name: "Vienna International", city: "Vienne", country: "Autriche", timezone: "CET" },
  MUC: { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Allemagne", timezone: "CET" },
  BCN: { iata: "BCN", name: "El Prat", city: "Barcelone", country: "Espagne", timezone: "CET" },
  LUX: { iata: "LUX", name: "Luxembourg Findel", city: "Luxembourg", country: "Luxembourg", timezone: "CET" },
  WAW: { iata: "WAW", name: "Chopin", city: "Varsovie", country: "Pologne", timezone: "CET" },
  BUD: { iata: "BUD", name: "Budapest Liszt Ferenc", city: "Budapest", country: "Hongrie", timezone: "CET" },
  PRG: { iata: "PRG", name: "Václav Havel", city: "Prague", country: "Rép. Tchèque", timezone: "CET" },
  BUH: { iata: "BUH", name: "Henri Coandă", city: "Bucarest", country: "Roumanie", timezone: "EET" },
  SOF: { iata: "SOF", name: "Sofia International", city: "Sofia", country: "Bulgarie", timezone: "EET" },
  TLL: { iata: "TLL", name: "Lennart Meri", city: "Tallinn", country: "Estonie", timezone: "EET" },
  RIX: { iata: "RIX", name: "Riga International", city: "Riga", country: "Lettonie", timezone: "EET" },
  VNO: { iata: "VNO", name: "Vilnius International", city: "Vilnius", country: "Lituanie", timezone: "EET" },
  // Moyen-Orient
  DXB: { iata: "DXB", name: "Dubai International", city: "Dubaï", country: "Émirats Arabes", timezone: "GST" },
  DOH: { iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", timezone: "AST" },
  IST: { iata: "IST", name: "Istanbul Aéroport", city: "Istanbul", country: "Turquie", timezone: "TRT" },
  // Amériques
  YUL: { iata: "YUL", name: "Montréal-Trudeau", city: "Montréal", country: "Canada", timezone: "EST" },
  YYZ: { iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", timezone: "EST" },
  JFK: { iata: "JFK", name: "John F. Kennedy", city: "New York", country: "États-Unis", timezone: "EST" },
  LAX: { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "États-Unis", timezone: "PST" },
  // Asie-Pacifique
  PEK: { iata: "PEK", name: "Beijing Capital", city: "Pékin", country: "Chine", timezone: "CST" },
  SIN: { iata: "SIN", name: "Singapore Changi", city: "Singapour", country: "Singapour", timezone: "SGT" },
  BKK: { iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thaïlande", timezone: "ICT" },
  SYD: { iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australie", timezone: "AEST" },
};

// ─── Airlines ─────────────────────────────────────────────────────────────────
const AIRLINES: Record<string, { name: string; code: string; logo: string; color: string; alliance: string }> = {
  AF: { code: "AF", name: "Air France", logo: "https://logo.clearbit.com/airfrance.com", color: "#002157", alliance: "SkyTeam" },
  ET: { code: "ET", name: "Ethiopian Airlines", logo: "https://logo.clearbit.com/ethiopianairlines.com", color: "#006633", alliance: "Star Alliance" },
  QR: { code: "QR", name: "Qatar Airways", logo: "https://logo.clearbit.com/qatarairways.com", color: "#5C0632", alliance: "Oneworld" },
  TK: { code: "TK", name: "Turkish Airlines", logo: "https://logo.clearbit.com/turkishairlines.com", color: "#C8102E", alliance: "Star Alliance" },
  AC: { code: "AC", name: "Air Canada", logo: "https://logo.clearbit.com/aircanada.com", color: "#D50032", alliance: "Star Alliance" },
  EK: { code: "EK", name: "Emirates", logo: "https://logo.clearbit.com/emirates.com", color: "#C8102E", alliance: "Indépendant" },
  LH: { code: "LH", name: "Lufthansa", logo: "https://logo.clearbit.com/lufthansa.com", color: "#05164D", alliance: "Star Alliance" },
  KQ: { code: "KQ", name: "Kenya Airways", logo: "https://logo.clearbit.com/kenya-airways.com", color: "#CC0000", alliance: "SkyTeam" },
  AT: { code: "AT", name: "Royal Air Maroc", logo: "https://logo.clearbit.com/royalairmaroc.com", color: "#006233", alliance: "Oneworld" },
  SN: { code: "SN", name: "Brussels Airlines", logo: "https://logo.clearbit.com/brusselsairlines.com", color: "#003399", alliance: "Star Alliance" },
  WB: { code: "WB", name: "RwandAir", logo: "https://logo.clearbit.com/rwandair.com", color: "#00A0E3", alliance: "Indépendant" },
  KL: { code: "KL", name: "KLM", logo: "https://logo.clearbit.com/klm.com", color: "#00A1DE", alliance: "SkyTeam" },
  IB: { code: "IB", name: "Iberia", logo: "https://logo.clearbit.com/iberia.com", color: "#C60B1E", alliance: "Oneworld" },
  AZ: { code: "AZ", name: "ITA Airways", logo: "https://logo.clearbit.com/itaairways.com", color: "#0055A4", alliance: "SkyTeam" },
  TP: { code: "TP", name: "TAP Air Portugal", logo: "https://logo.clearbit.com/tapairportugal.com", color: "#006600", alliance: "Star Alliance" },
  OS: { code: "OS", name: "Austrian Airlines", logo: "https://logo.clearbit.com/austrian.com", color: "#CC0000", alliance: "Star Alliance" },
  LX: { code: "LX", name: "Swiss", logo: "https://logo.clearbit.com/swiss.com", color: "#CC0000", alliance: "Star Alliance" },
};

// ─── Popular routes with realistic base prices (FCFA) ─────────────────────────
const ROUTE_PRICES: Record<string, Record<string, { economy: number; business: number; preferred: string[] }>> = {
  YAO: {
    CDG: { economy: 580000, business: 2100000, preferred: ["AF", "SN", "AT"] },
    LHR: { economy: 620000, business: 2300000, preferred: ["AF", "SN", "EK"] },
    BRU: { economy: 540000, business: 1950000, preferred: ["SN", "AF", "ET"] },
    FRA: { economy: 610000, business: 2200000, preferred: ["LH", "ET", "TK"] },
    AMS: { economy: 570000, business: 2050000, preferred: ["KL", "AF", "SN"] },
    LIS: { economy: 520000, business: 1850000, preferred: ["TP", "AF", "AT"] },
    MAD: { economy: 530000, business: 1900000, preferred: ["IB", "AF", "AT"] },
    YUL: { economy: 850000, business: 3200000, preferred: ["AC", "AF", "AT"] },
    YYZ: { economy: 870000, business: 3300000, preferred: ["AC", "AF", "ET"] },
    DXB: { economy: 490000, business: 1800000, preferred: ["EK", "ET", "QR"] },
    DOH: { economy: 480000, business: 1750000, preferred: ["QR", "ET", "TK"] },
    IST: { economy: 460000, business: 1700000, preferred: ["TK", "ET", "QR"] },
    ADD: { economy: 180000, business: 650000, preferred: ["ET", "KQ", "WB"] },
    NBO: { economy: 210000, business: 750000, preferred: ["KQ", "ET", "WB"] },
    LUX: { economy: 560000, business: 2000000, preferred: ["SN", "LH", "AF"] },
    WAW: { economy: 590000, business: 2100000, preferred: ["LH", "AF", "TK"] },
    BUD: { economy: 580000, business: 2050000, preferred: ["LH", "AF", "TK"] },
    PRG: { economy: 575000, business: 2030000, preferred: ["LH", "AF", "TK"] },
    BUH: { economy: 570000, business: 2000000, preferred: ["TK", "AF", "LH"] },
    SOF: { economy: 565000, business: 1980000, preferred: ["TK", "AF", "LH"] },
    TLL: { economy: 600000, business: 2150000, preferred: ["LH", "AF", "TK"] },
    RIX: { economy: 595000, business: 2130000, preferred: ["LH", "AF", "TK"] },
  },
  DLA: {
    CDG: { economy: 560000, business: 2050000, preferred: ["AF", "SN", "AT"] },
    BRU: { economy: 520000, business: 1900000, preferred: ["SN", "AF", "ET"] },
    LIS: { economy: 510000, business: 1820000, preferred: ["TP", "AF", "AT"] },
    YUL: { economy: 830000, business: 3100000, preferred: ["AC", "AF", "AT"] },
    DXB: { economy: 470000, business: 1750000, preferred: ["EK", "ET", "QR"] },
    ADD: { economy: 170000, business: 620000, preferred: ["ET", "KQ", "WB"] },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function seededBetween(min: number, max: number, seed: number) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
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

// Agency markup
const AGENCY_MARKUP = 0.08; // 8%

function applyMarkup(price: number) {
  return Math.round(price * (1 + AGENCY_MARKUP));
}

function getBasePrice(origin: string, destination: string, cabinClass: string): number {
  const route = ROUTE_PRICES[origin]?.[destination] ?? ROUTE_PRICES[destination]?.[origin];
  if (route) {
    if (cabinClass === "ECONOMY") return route.economy;
    if (cabinClass === "PREMIUM_ECONOMY") return Math.round(route.economy * 1.6);
    if (cabinClass === "BUSINESS") return route.business;
    if (cabinClass === "FIRST") return Math.round(route.business * 1.8);
  }
  // Fallback generic pricing
  const generic: Record<string, number> = {
    ECONOMY: 450000,
    PREMIUM_ECONOMY: 720000,
    BUSINESS: 1800000,
    FIRST: 3200000,
  };
  return generic[cabinClass] ?? generic.ECONOMY;
}

function getPreferredAirlines(origin: string, destination: string): string[] {
  const route = ROUTE_PRICES[origin]?.[destination] ?? ROUTE_PRICES[destination]?.[origin];
  return route?.preferred ?? Object.keys(AIRLINES).slice(0, 5);
}

// ─── Mock flight generator (deterministic by seed) ────────────────────────────
function generateFlights(
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number,
  cabinClass: string
) {
  const preferred = getPreferredAirlines(origin, destination);
  const allAirlineCodes = [...preferred, ...Object.keys(AIRLINES).filter(k => !preferred.includes(k))].slice(0, 10);
  const results = [];
  const count = Math.min(allAirlineCodes.length, 10);
  const basePrice = getBasePrice(origin, destination, cabinClass);
  const dateSeed = parseInt(departureDate.replace(/-/g, ""), 10);

  const departureTimes = [
    "06:10", "07:45", "09:20", "10:55", "12:30",
    "14:05", "15:40", "17:15", "19:00", "21:30",
  ];

  const layoverHubs = ["ADD", "CMN", "DXB", "IST", "CDG", "NBO", "DKR", "LHR", "FRA", "AMS"];

  for (let i = 0; i < count; i++) {
    const airlineCode = allAirlineCodes[i];
    const airline = AIRLINES[airlineCode];
    if (!airline) continue;

    const seed = dateSeed + i * 137 + airlineCode.charCodeAt(0);
    const flightNumber = `${airlineCode}${seededBetween(100, 999, seed)}`;

    // First 3 preferred airlines get direct flights, rest have 1-2 stops
    const stops = i < 3 ? 0 : i < 7 ? 1 : 2;
    const durationMinutes =
      stops === 0
        ? seededBetween(300, 540, seed + 1)
        : stops === 1
        ? seededBetween(540, 780, seed + 1)
        : seededBetween(780, 1080, seed + 1);

    const depTime = departureTimes[i % departureTimes.length];
    const arrTime = addMinutes(depTime, durationMinutes);

    // Price variation: preferred airlines slightly cheaper, others more expensive
    const priceVariation = i < 3 ? seededBetween(-30000, 20000, seed + 2) : seededBetween(10000, 80000, seed + 2);
    const pricePerPax = applyMarkup(basePrice + priceVariation + stops * 15000);
    const totalPrice = pricePerPax * passengers;

    const stopDetails: { airport: string; airportName: string; duration: string }[] = [];
    if (stops >= 1) {
      const layover1 = layoverHubs[seededBetween(0, layoverHubs.length - 1, seed + 3)];
      stopDetails.push({
        airport: layover1,
        airportName: AIRPORTS[layover1]?.name ?? layover1,
        duration: `${seededBetween(1, 3, seed + 4)}h${seededBetween(0, 5, seed + 5) * 10}`,
      });
    }
    if (stops >= 2) {
      const layover2 = layoverHubs[seededBetween(0, layoverHubs.length - 1, seed + 6)];
      stopDetails.push({
        airport: layover2,
        airportName: AIRPORTS[layover2]?.name ?? layover2,
        duration: `${seededBetween(1, 2, seed + 7)}h${seededBetween(0, 5, seed + 8) * 10}`,
      });
    }

    const baggageMap: Record<string, string> = {
      ECONOMY: "1 bagage cabine + 23 kg soute",
      PREMIUM_ECONOMY: "1 bagage cabine + 2×23 kg soute",
      BUSINESS: "2 bagages cabine + 2×32 kg soute",
      FIRST: "2 bagages cabine + 3×32 kg soute",
    };

    results.push({
      id: `FL-${origin}-${destination}-${i}-${dateSeed}`,
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
      seatsLeft: seededBetween(2, 9, seed + 9),
      baggage: baggageMap[cabinClass] ?? baggageMap.ECONOMY,
      refundable: i % 3 === 0,
      pnrRef: `3M${Math.abs(seed).toString(36).substring(0, 6).toUpperCase()}`,
      isPreferred: i < 3,
      alliance: airline.alliance,
    });
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

// ─── Calendar price generator ─────────────────────────────────────────────────
function generateCalendarPrices(
  origin: string,
  destination: string,
  baseDate: string,
  cabinClass: string
) {
  const basePrice = getBasePrice(origin, destination, cabinClass);
  const result: { date: string; price: number; available: boolean }[] = [];
  const base = new Date(baseDate);

  for (let i = -3; i <= 6; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const seed = parseInt(dateStr.replace(/-/g, ""), 10);
    const variation = seededBetween(-50000, 100000, seed);
    const price = applyMarkup(basePrice + variation);
    result.push({
      date: dateStr,
      price,
      available: seededRandom(seed + 1) > 0.1,
    });
  }

  return result;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const flightsRouter = router({
  // Airport autocomplete
  searchAirports: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      const q = input.query.toLowerCase().trim();
      return Object.values(AIRPORTS)
        .filter(
          (a) =>
            a.iata.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q)
        )
        .slice(0, 8);
    }),

  // Search flights
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
      const outbound = generateFlights(
        input.origin.toUpperCase(),
        input.destination.toUpperCase(),
        input.departureDate,
        totalPax,
        input.cabinClass
      );
      const inbound =
        input.tripType === "ROUND_TRIP" && input.returnDate
          ? generateFlights(
              input.destination.toUpperCase(),
              input.origin.toUpperCase(),
              input.returnDate,
              totalPax,
              input.cabinClass
            )
          : [];

      const calendarPrices = generateCalendarPrices(
        input.origin.toUpperCase(),
        input.destination.toUpperCase(),
        input.departureDate,
        input.cabinClass
      );

      return {
        tripType: input.tripType,
        outbound,
        inbound,
        calendarPrices,
        searchParams: input,
        currency: "XAF",
        agencyMarkup: AGENCY_MARKUP,
        originInfo: AIRPORTS[input.origin.toUpperCase()] ?? null,
        destinationInfo: AIRPORTS[input.destination.toUpperCase()] ?? null,
        isDemo: true,
      };
    }),

  // Get flight price details
  getFlightPrice: publicProcedure
    .input(z.object({ flightId: z.string(), pnrRef: z.string() }))
    .query(({ input }) => {
      const seed = input.pnrRef.charCodeAt(0) * 137;
      return {
        flightId: input.flightId,
        pnrRef: input.pnrRef,
        priceConfirmed: true,
        baseFare: seededBetween(400000, 800000, seed),
        taxes: seededBetween(45000, 120000, seed + 1),
        fees: seededBetween(15000, 35000, seed + 2),
        agencyFee: seededBetween(20000, 50000, seed + 3),
        isDemo: true,
      };
    }),

  // Popular routes
  getPopularRoutes: publicProcedure.query(() => {
    return [
      { origin: "YAO", originCity: "Yaoundé", destination: "CDG", destinationCity: "Paris", price: applyMarkup(580000), flag: "🇫🇷" },
      { origin: "YAO", originCity: "Yaoundé", destination: "BRU", destinationCity: "Bruxelles", price: applyMarkup(540000), flag: "🇧🇪" },
      { origin: "YAO", originCity: "Yaoundé", destination: "LIS", destinationCity: "Lisbonne", price: applyMarkup(520000), flag: "🇵🇹" },
      { origin: "YAO", originCity: "Yaoundé", destination: "YUL", destinationCity: "Montréal", price: applyMarkup(850000), flag: "🇨🇦" },
      { origin: "YAO", originCity: "Yaoundé", destination: "DXB", destinationCity: "Dubaï", price: applyMarkup(490000), flag: "🇦🇪" },
      { origin: "DLA", originCity: "Douala", destination: "CDG", destinationCity: "Paris", price: applyMarkup(560000), flag: "🇫🇷" },
      { origin: "YAO", originCity: "Yaoundé", destination: "LUX", destinationCity: "Luxembourg", price: applyMarkup(560000), flag: "🇱🇺" },
      { origin: "YAO", originCity: "Yaoundé", destination: "WAW", destinationCity: "Varsovie", price: applyMarkup(590000), flag: "🇵🇱" },
    ];
  }),
});
