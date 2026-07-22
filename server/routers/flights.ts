import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  searchAirport as skySearchAirport,
  searchFlights as skySearchFlights,
  getPriceCalendar as skyGetPriceCalendar,
  usdToXaf,
  formatXaf,
  type SkyItinerary,
} from "../skyscanner";

// ─── IATA Airport Database ────────────────────────────────────────────────────
export const AIRPORTS: Record<string, { name: string; city: string; country: string; iata: string; timezone: string; skyId?: string; entityId?: string }> = {
  // Afrique Centrale
  YAO: { iata: "YAO", name: "Yaoundé Nsimalen", city: "Yaoundé", country: "Cameroun", timezone: "WAT", skyId: "YAOU", entityId: "128668553" },
  DLA: { iata: "DLA", name: "Douala International", city: "Douala", country: "Cameroun", timezone: "WAT", skyId: "DLAA", entityId: "128668551" },
  LBV: { iata: "LBV", name: "Léon-Mba", city: "Libreville", country: "Gabon", timezone: "WAT", skyId: "LBVA", entityId: "128668556" },
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
  ADD: { iata: "ADD", name: "Addis Abeba Bole", city: "Addis Abeba", country: "Éthiopie", timezone: "EAT", skyId: "ADDA", entityId: "128668539" },
  NBO: { iata: "NBO", name: "Jomo Kenyatta", city: "Nairobi", country: "Kenya", timezone: "EAT" },
  DAR: { iata: "DAR", name: "Julius Nyerere", city: "Dar es Salaam", country: "Tanzanie", timezone: "EAT" },
  KGL: { iata: "KGL", name: "Kigali International", city: "Kigali", country: "Rwanda", timezone: "CAT" },
  // Afrique du Nord
  CMN: { iata: "CMN", name: "Mohammed V", city: "Casablanca", country: "Maroc", timezone: "WET" },
  TUN: { iata: "TUN", name: "Tunis-Carthage", city: "Tunis", country: "Tunisie", timezone: "CET" },
  CAI: { iata: "CAI", name: "Le Caire International", city: "Le Caire", country: "Égypte", timezone: "EET" },
  ALG: { iata: "ALG", name: "Houari Boumédiène", city: "Alger", country: "Algérie", timezone: "CET" },
  // Europe
  CDG: { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", timezone: "CET", skyId: "PARI", entityId: "27539733" },
  ORY: { iata: "ORY", name: "Paris Orly", city: "Paris", country: "France", timezone: "CET", skyId: "PARI", entityId: "27539733" },
  LHR: { iata: "LHR", name: "Heathrow", city: "Londres", country: "Royaume-Uni", timezone: "GMT", skyId: "LOND", entityId: "27544008" },
  FRA: { iata: "FRA", name: "Frankfurt am Main", city: "Francfort", country: "Allemagne", timezone: "CET", skyId: "FRAN", entityId: "27562862" },
  BRU: { iata: "BRU", name: "Brussels Airport", city: "Bruxelles", country: "Belgique", timezone: "CET", skyId: "BRUS", entityId: "27539521" },
  MAD: { iata: "MAD", name: "Adolfo Suárez Barajas", city: "Madrid", country: "Espagne", timezone: "CET", skyId: "MADR", entityId: "27544813" },
  FCO: { iata: "FCO", name: "Leonardo da Vinci", city: "Rome", country: "Italie", timezone: "CET", skyId: "ROME", entityId: "27547798" },
  AMS: { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Pays-Bas", timezone: "CET", skyId: "AMST", entityId: "27539488" },
  LIS: { iata: "LIS", name: "Humberto Delgado", city: "Lisbonne", country: "Portugal", timezone: "WET", skyId: "LISB", entityId: "27545963" },
  GVA: { iata: "GVA", name: "Genève-Cointrin", city: "Genève", country: "Suisse", timezone: "CET", skyId: "GENE", entityId: "27562743" },
  ZRH: { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Suisse", timezone: "CET", skyId: "ZURI", entityId: "27562743" },
  VIE: { iata: "VIE", name: "Vienna International", city: "Vienne", country: "Autriche", timezone: "CET", skyId: "VIEN", entityId: "27562864" },
  MUC: { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Allemagne", timezone: "CET", skyId: "MUNI", entityId: "27562862" },
  BCN: { iata: "BCN", name: "El Prat", city: "Barcelone", country: "Espagne", timezone: "CET", skyId: "BARC", entityId: "27539521" },
  LUX: { iata: "LUX", name: "Luxembourg Findel", city: "Luxembourg", country: "Luxembourg", timezone: "CET", skyId: "LUXE", entityId: "27539521" },
  WAW: { iata: "WAW", name: "Chopin", city: "Varsovie", country: "Pologne", timezone: "CET", skyId: "WARS", entityId: "27562864" },
  BUD: { iata: "BUD", name: "Budapest Liszt Ferenc", city: "Budapest", country: "Hongrie", timezone: "CET", skyId: "BUDA", entityId: "27562864" },
  PRG: { iata: "PRG", name: "Václav Havel", city: "Prague", country: "Rép. Tchèque", timezone: "CET", skyId: "PRAG", entityId: "27562864" },
  BUH: { iata: "BUH", name: "Henri Coandă", city: "Bucarest", country: "Roumanie", timezone: "EET" },
  SOF: { iata: "SOF", name: "Sofia International", city: "Sofia", country: "Bulgarie", timezone: "EET" },
  TLL: { iata: "TLL", name: "Lennart Meri", city: "Tallinn", country: "Estonie", timezone: "EET" },
  RIX: { iata: "RIX", name: "Riga International", city: "Riga", country: "Lettonie", timezone: "EET" },
  VNO: { iata: "VNO", name: "Vilnius International", city: "Vilnius", country: "Lituanie", timezone: "EET" },
  // Moyen-Orient
  DXB: { iata: "DXB", name: "Dubai International", city: "Dubaï", country: "Émirats Arabes", timezone: "GST", skyId: "DUBA", entityId: "27562660" },
  DOH: { iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", timezone: "AST", skyId: "DOHA", entityId: "27562660" },
  IST: { iata: "IST", name: "Istanbul Aéroport", city: "Istanbul", country: "Turquie", timezone: "TRT", skyId: "ISTA", entityId: "27562864" },
  // Amériques
  YUL: { iata: "YUL", name: "Montréal-Trudeau", city: "Montréal", country: "Canada", timezone: "EST", skyId: "MTRL", entityId: "27539563" },
  YYZ: { iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", timezone: "EST", skyId: "TRON", entityId: "27539563" },
  JFK: { iata: "JFK", name: "John F. Kennedy", city: "New York", country: "États-Unis", timezone: "EST", skyId: "NYCA", entityId: "27537542" },
  LAX: { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "États-Unis", timezone: "PST", skyId: "LAXA", entityId: "27537542" },
  // Asie-Pacifique
  PEK: { iata: "PEK", name: "Beijing Capital", city: "Pékin", country: "Chine", timezone: "CST" },
  SIN: { iata: "SIN", name: "Singapore Changi", city: "Singapour", country: "Singapour", timezone: "SGT" },
  BKK: { iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thaïlande", timezone: "ICT" },
  SYD: { iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australie", timezone: "AEST" },
};

// ─── Fallback prices (XAF) ────────────────────────────────────────────────────
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

const AGENCY_MARKUP = 0.08;

function seededRandom(seed: number) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }
function seededBetween(min: number, max: number, seed: number) { return Math.floor(seededRandom(seed) * (max - min + 1)) + min; }
function formatDuration(minutes: number) { const h = Math.floor(minutes / 60); const m = minutes % 60; return `${h}h${m.toString().padStart(2, "0")}`; }
function addMinutes(timeStr: string, minutes: number) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60) % 24}`.padStart(2, "0") + ":" + `${total % 60}`.padStart(2, "0");
}
function applyMarkup(price: number) { return Math.round(price * (1 + AGENCY_MARKUP)); }

// ─── Convert Skyscanner itinerary → internal flight format ────────────────────
function skyToFlight(
  it: SkyItinerary,
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number,
  cabinClass: string,
  idx: number
) {
  const leg = it.legs[0];
  if (!leg) return null;

  const carrier = leg.carriers.marketing[0];
  const priceUsd = it.price.raw;
  const priceXaf = usdToXaf(priceUsd);
  const pricePerPax = Math.round(priceXaf / passengers);
  const totalPrice = priceXaf;

  const stopDetails = (leg.segments ?? []).slice(0, -1).map((seg, i) => ({
    airport: seg.destination.displayCode,
    airportName: seg.destination.name,
    duration: formatDuration(
      (leg.segments![i + 1]
        ? (new Date(leg.segments![i + 1].departure).getTime() - new Date(seg.arrival).getTime()) / 60000
        : 90)
    ),
  }));

  const baggageMap: Record<string, string> = {
    ECONOMY: "1 bagage cabine + 23 kg soute",
    PREMIUM_ECONOMY: "1 bagage cabine + 2×23 kg soute",
    BUSINESS: "2 bagages cabine + 2×32 kg soute",
    FIRST: "2 bagages cabine + 3×32 kg soute",
  };

  const depTime = leg.departure.split("T")[1]?.substring(0, 5) ?? "00:00";
  const arrTime = leg.arrival.split("T")[1]?.substring(0, 5) ?? "00:00";

  return {
    id: it.id,
    airline: {
      code: carrier?.alternateId ?? "XX",
      name: carrier?.name ?? "Compagnie inconnue",
      logo: carrier?.logoUrl ?? "",
      color: "#1e3a8a",
      alliance: "Skyscanner",
    },
    flightNumber: leg.segments?.[0] ? `${carrier?.alternateId ?? ""}${leg.segments[0].flightNumber ?? ""}` : `SKY${idx + 100}`,
    origin,
    originName: leg.origin.name,
    originCity: leg.origin.city ?? AIRPORTS[origin]?.city ?? origin,
    destination,
    destinationName: leg.destination.name,
    destinationCity: leg.destination.city ?? AIRPORTS[destination]?.city ?? destination,
    departureDate,
    departureTime: depTime,
    arrivalTime: arrTime,
    duration: formatDuration(leg.durationInMinutes),
    durationMinutes: leg.durationInMinutes,
    stops: leg.stopCount,
    stopDetails,
    cabinClass,
    pricePerPax,
    totalPrice,
    priceUsd,
    priceFormatted: formatXaf(totalPrice),
    currency: "XAF",
    seatsLeft: seededBetween(2, 9, idx * 137),
    baggage: baggageMap[cabinClass] ?? baggageMap.ECONOMY,
    refundable: idx % 3 === 0,
    pnrRef: `3M${it.id.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`,
    isPreferred: idx < 3,
    alliance: "Skyscanner Live",
    source: "skyscanner" as const,
  };
}

// ─── Fallback flight generator ────────────────────────────────────────────────
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
  TP: { code: "TP", name: "TAP Air Portugal", logo: "https://logo.clearbit.com/tapairportugal.com", color: "#006600", alliance: "Star Alliance" },
};

function getBasePrice(origin: string, destination: string, cabinClass: string): number {
  const route = ROUTE_PRICES[origin]?.[destination] ?? ROUTE_PRICES[destination]?.[origin];
  if (route) {
    if (cabinClass === "ECONOMY") return route.economy;
    if (cabinClass === "PREMIUM_ECONOMY") return Math.round(route.economy * 1.6);
    if (cabinClass === "BUSINESS") return route.business;
    if (cabinClass === "FIRST") return Math.round(route.business * 1.8);
  }
  const generic: Record<string, number> = { ECONOMY: 450000, PREMIUM_ECONOMY: 720000, BUSINESS: 1800000, FIRST: 3200000 };
  return generic[cabinClass] ?? generic.ECONOMY;
}

function getPreferredAirlines(origin: string, destination: string): string[] {
  const route = ROUTE_PRICES[origin]?.[destination] ?? ROUTE_PRICES[destination]?.[origin];
  return route?.preferred ?? Object.keys(AIRLINES).slice(0, 5);
}

function generateFallbackFlights(origin: string, destination: string, departureDate: string, passengers: number, cabinClass: string) {
  const preferred = getPreferredAirlines(origin, destination);
  const allAirlineCodes = [...preferred, ...Object.keys(AIRLINES).filter(k => !preferred.includes(k))].slice(0, 10);
  const results = [];
  const basePrice = getBasePrice(origin, destination, cabinClass);
  const dateSeed = parseInt(departureDate.replace(/-/g, ""), 10);
  const departureTimes = ["06:10","07:45","09:20","10:55","12:30","14:05","15:40","17:15","19:00","21:30"];
  const layoverHubs = ["ADD","CMN","DXB","IST","CDG","NBO","DKR","LHR","FRA","AMS"];
  const baggageMap: Record<string, string> = {
    ECONOMY: "1 bagage cabine + 23 kg soute",
    PREMIUM_ECONOMY: "1 bagage cabine + 2×23 kg soute",
    BUSINESS: "2 bagages cabine + 2×32 kg soute",
    FIRST: "2 bagages cabine + 3×32 kg soute",
  };

  for (let i = 0; i < Math.min(allAirlineCodes.length, 10); i++) {
    const airlineCode = allAirlineCodes[i];
    const airline = AIRLINES[airlineCode];
    if (!airline) continue;
    const seed = dateSeed + i * 137 + airlineCode.charCodeAt(0);
    const flightNumber = `${airlineCode}${seededBetween(100, 999, seed)}`;
    const stops = i < 3 ? 0 : i < 7 ? 1 : 2;
    const durationMinutes = stops === 0 ? seededBetween(300, 540, seed + 1) : stops === 1 ? seededBetween(540, 780, seed + 1) : seededBetween(780, 1080, seed + 1);
    const depTime = departureTimes[i % departureTimes.length];
    const arrTime = addMinutes(depTime, durationMinutes);
    const priceVariation = i < 3 ? seededBetween(-30000, 20000, seed + 2) : seededBetween(10000, 80000, seed + 2);
    const pricePerPax = applyMarkup(basePrice + priceVariation);
    const totalPrice = pricePerPax * passengers;
    const stopDetails: { airport: string; airportName: string; duration: string }[] = [];
    if (stops >= 1) { const l = layoverHubs[seededBetween(0, layoverHubs.length - 1, seed + 3)]; stopDetails.push({ airport: l, airportName: AIRPORTS[l]?.name ?? l, duration: `${seededBetween(1, 3, seed + 4)}h${seededBetween(0, 5, seed + 5) * 10}` }); }
    if (stops >= 2) { const l = layoverHubs[seededBetween(0, layoverHubs.length - 1, seed + 6)]; stopDetails.push({ airport: l, airportName: AIRPORTS[l]?.name ?? l, duration: `${seededBetween(1, 2, seed + 7)}h${seededBetween(0, 5, seed + 8) * 10}` }); }
    results.push({
      id: `FL-${origin}-${destination}-${i}-${dateSeed}`,
      airline: { ...airline },
      flightNumber,
      origin, originName: AIRPORTS[origin]?.name ?? origin, originCity: AIRPORTS[origin]?.city ?? origin,
      destination, destinationName: AIRPORTS[destination]?.name ?? destination, destinationCity: AIRPORTS[destination]?.city ?? destination,
      departureDate, departureTime: depTime, arrivalTime: arrTime,
      duration: formatDuration(durationMinutes), durationMinutes, stops, stopDetails,
      cabinClass, pricePerPax, totalPrice,
      priceFormatted: new Intl.NumberFormat("fr-FR").format(totalPrice) + " FCFA",
      currency: "XAF",
      seatsLeft: seededBetween(2, 9, seed + 9),
      baggage: baggageMap[cabinClass] ?? baggageMap.ECONOMY,
      refundable: i % 3 === 0,
      pnrRef: `3M${Math.abs(seed).toString(36).substring(0, 6).toUpperCase()}`,
      isPreferred: i < 3,
      alliance: airline.alliance,
      source: "fallback" as const,
    });
  }
  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

function generateCalendarPrices(origin: string, destination: string, baseDate: string, cabinClass: string) {
  const basePrice = getBasePrice(origin, destination, cabinClass);
  const result: { date: string; price: number; available: boolean }[] = [];
  const base = new Date(baseDate);
  for (let i = -3; i <= 6; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const seed = parseInt(dateStr.replace(/-/g, ""), 10);
    result.push({ date: dateStr, price: applyMarkup(basePrice + seededBetween(-50000, 100000, seed)), available: seededRandom(seed + 1) > 0.1 });
  }
  return result;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const flightsRouter = router({

  // Airport autocomplete — Skyscanner first, fallback local
  searchAirports: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const skyResults = await skySearchAirport(input.query);
        if (skyResults.length > 0) {
          return skyResults.slice(0, 8).map(a => ({
            iata: a.skyId,
            name: a.presentation.title,
            city: a.presentation.suggestionTitle,
            country: a.presentation.subtitle,
            timezone: "UTC",
            skyId: a.skyId,
            entityId: a.entityId,
          }));
        }
      } catch (e) {
        console.warn("[Skyscanner] searchAirport fallback:", e);
      }
      // Fallback local
      const q = input.query.toLowerCase().trim();
      return Object.values(AIRPORTS)
        .filter(a => a.iata.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.country.toLowerCase().includes(q))
        .slice(0, 8);
    }),

  // Search flights — Skyscanner live, fallback local
  searchFlights: publicProcedure
    .input(z.object({
      tripType: z.enum(["ONE_WAY", "ROUND_TRIP", "MULTI"]),
      origin: z.string().min(2).max(6),
      destination: z.string().min(2).max(6),
      departureDate: z.string(),
      returnDate: z.string().optional(),
      adults: z.number().min(1).max(9).default(1),
      children: z.number().min(0).max(8).default(0),
      infants: z.number().min(0).max(4).default(0),
      cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
      // Skyscanner IDs (optionnels — fournis par searchAirports)
      originSkyId: z.string().optional(),
      destinationSkyId: z.string().optional(),
      originEntityId: z.string().optional(),
      destinationEntityId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const totalPax = input.adults + input.children;
      const cabinLower = input.cabinClass.toLowerCase() as "economy" | "premium_economy" | "business" | "first";
      const originIata = input.origin.toUpperCase();
      const destIata = input.destination.toUpperCase();

      let outbound: ReturnType<typeof generateFallbackFlights> = [];
      let inbound: ReturnType<typeof generateFallbackFlights> = [];
      let dataSource = "fallback";

      // Résoudre les skyId/entityId
      let originSkyId = input.originSkyId ?? AIRPORTS[originIata]?.skyId;
      let originEntityId = input.originEntityId ?? AIRPORTS[originIata]?.entityId;
      let destSkyId = input.destinationSkyId ?? AIRPORTS[destIata]?.skyId;
      let destEntityId = input.destinationEntityId ?? AIRPORTS[destIata]?.entityId;

      // Si pas de skyId connu, tenter une résolution via searchAirport
      if (!originSkyId || !originEntityId) {
        try {
          const res = await skySearchAirport(originIata);
          if (res.length > 0) { originSkyId = res[0].skyId; originEntityId = res[0].entityId; }
        } catch { /* ignore */ }
      }
      if (!destSkyId || !destEntityId) {
        try {
          const res = await skySearchAirport(destIata);
          if (res.length > 0) { destSkyId = res[0].skyId; destEntityId = res[0].entityId; }
        } catch { /* ignore */ }
      }

      // Appel Skyscanner si on a les IDs
      if (originSkyId && originEntityId && destSkyId && destEntityId) {
        try {
          const skyResult = await skySearchFlights({
            originSkyId, destinationSkyId: destSkyId,
            originEntityId, destinationEntityId: destEntityId,
            date: input.departureDate,
            returnDate: input.returnDate,
            adults: input.adults,
            children: input.children > 0 ? input.children : undefined,
            infants: input.infants > 0 ? input.infants : undefined,
            cabinClass: cabinLower,
            currency: "USD",
          });

          if (skyResult.itineraries && skyResult.itineraries.length > 0) {
            dataSource = "skyscanner";
            outbound = (skyResult.itineraries
              .map((it, idx) => skyToFlight(it, originIata, destIata, input.departureDate, totalPax, input.cabinClass, idx))
              .filter(Boolean) as unknown) as ReturnType<typeof generateFallbackFlights>;

            // Pour aller-retour, les vols retour sont dans les legs[1] des itinéraires
            if (input.tripType === "ROUND_TRIP" && input.returnDate) {
              inbound = (skyResult.itineraries
                .filter(it => it.legs.length > 1)
                .map((it, idx) => {
                  const retLeg = it.legs[1];
                  if (!retLeg) return null;
                  const carrier = retLeg.carriers.marketing[0];
                  const priceXaf = usdToXaf(it.price.raw);
                  return {
                    id: `${it.id}-ret`,
                    airline: { code: carrier?.alternateId ?? "XX", name: carrier?.name ?? "Compagnie", logo: carrier?.logoUrl ?? "", color: "#1e3a8a", alliance: "Skyscanner" },
                    flightNumber: `SKY${idx + 200}`,
                    origin: destIata, originName: retLeg.origin.name, originCity: retLeg.origin.city ?? destIata,
                    destination: originIata, destinationName: retLeg.destination.name, destinationCity: retLeg.destination.city ?? originIata,
                    departureDate: input.returnDate!,
                    departureTime: retLeg.departure.split("T")[1]?.substring(0, 5) ?? "00:00",
                    arrivalTime: retLeg.arrival.split("T")[1]?.substring(0, 5) ?? "00:00",
                    duration: formatDuration(retLeg.durationInMinutes), durationMinutes: retLeg.durationInMinutes,
                    stops: retLeg.stopCount, stopDetails: [],
                    cabinClass: input.cabinClass,
                    pricePerPax: Math.round(priceXaf / totalPax), totalPrice: priceXaf,
                    priceFormatted: new Intl.NumberFormat("fr-FR").format(priceXaf) + " FCFA",
                    currency: "XAF", seatsLeft: seededBetween(2, 9, idx * 137),
                    baggage: "1 bagage cabine + 23 kg soute", refundable: idx % 3 === 0,
                    pnrRef: `3MR${it.id.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`,
                    isPreferred: idx < 3, alliance: "Skyscanner Live", source: "skyscanner" as const,
                  };
                }).filter(Boolean) as unknown) as ReturnType<typeof generateFallbackFlights>;
            }
          }
        } catch (e) {
          console.warn("[Skyscanner] searchFlights fallback:", e);
        }
      }

      // Fallback si Skyscanner n'a rien retourné
      if (outbound.length === 0) {
        outbound = generateFallbackFlights(originIata, destIata, input.departureDate, totalPax, input.cabinClass);
      }
      if (input.tripType === "ROUND_TRIP" && input.returnDate && inbound.length === 0) {
        inbound = generateFallbackFlights(destIata, originIata, input.returnDate, totalPax, input.cabinClass);
      }

      const calendarPrices = generateCalendarPrices(originIata, destIata, input.departureDate, input.cabinClass);

      return {
        tripType: input.tripType,
        outbound,
        inbound,
        calendarPrices,
        searchParams: input,
        currency: "XAF",
        agencyMarkup: AGENCY_MARKUP,
        originInfo: AIRPORTS[originIata] ?? null,
        destinationInfo: AIRPORTS[destIata] ?? null,
        dataSource,
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
