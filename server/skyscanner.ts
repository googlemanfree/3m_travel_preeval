/**
 * Skyscanner via Sky Scrapper API (RapidAPI)
 * Fournit des tarifs de vols réels avec cache 10 minutes.
 */

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Simple in-memory cache ────────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data as T;
}

function toCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

// ─── HTTP helper ───────────────────────────────────────────────────────────────
async function skyFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY not configured");

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const cacheKey = url.toString();
  const cached = fromCache<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (res.status === 429) throw new Error("Limite API atteinte. Réessayez dans quelques secondes.");
  if (!res.ok) throw new Error(`Skyscanner API error: ${res.status}`);

  const json = await res.json() as T;
  toCache(cacheKey, json);
  return json;
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SkyAirport {
  skyId: string;
  entityId: string;
  presentation: { title: string; suggestionTitle: string; subtitle: string };
  navigation: { entityType: string };
}

export interface SkyItinerary {
  id: string;
  price: { raw: number; formatted: string };
  legs: SkyLeg[];
  score?: number;
  isSelfTransfer?: boolean;
  isProtectedSelfTransfer?: boolean;
}

export interface SkyLeg {
  id: string;
  origin: { id: string; name: string; displayCode: string; city: string };
  destination: { id: string; name: string; displayCode: string; city: string };
  durationInMinutes: number;
  stopCount: number;
  departure: string;
  arrival: string;
  carriers: {
    marketing: Array<{ id: number; name: string; logoUrl: string; alternateId: string }>;
  };
  segments?: SkySegment[];
}

export interface SkySegment {
  id: string;
  origin: { flightPlaceId: string; displayCode: string; name: string; city: string };
  destination: { flightPlaceId: string; displayCode: string; name: string; city: string };
  departure: string;
  arrival: string;
  durationInMinutes: number;
  flightNumber: string;
  marketingCarrier: { id: number; name: string; alternateId: string; logoUrl: string };
}

// ─── searchAirport ─────────────────────────────────────────────────────────────
export async function searchAirport(query: string): Promise<SkyAirport[]> {
  const res = await skyFetch<{ status: boolean; data?: SkyAirport[] }>(
    "/api/v1/flights/searchAirport",
    { query, locale: "en-US" }
  );
  return res.data ?? [];
}

// ─── searchFlights ─────────────────────────────────────────────────────────────
export interface SearchFlightsParams {
  originSkyId: string;
  destinationSkyId: string;
  originEntityId: string;
  destinationEntityId: string;
  date: string;           // YYYY-MM-DD
  returnDate?: string;    // YYYY-MM-DD pour aller-retour
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
}

export interface SearchFlightsResult {
  itineraries: SkyItinerary[];
  context?: { status: string; sessionId?: string; totalResults?: number };
}

export async function searchFlights(params: SearchFlightsParams): Promise<SearchFlightsResult> {
  const p: Record<string, string> = {
    originSkyId: params.originSkyId,
    destinationSkyId: params.destinationSkyId,
    originEntityId: params.originEntityId,
    destinationEntityId: params.destinationEntityId,
    date: params.date,
    adults: String(params.adults ?? 1),
    currency: params.currency ?? "USD",
    market: "en-US",
    countryCode: "US",
    cabinClass: params.cabinClass ?? "economy",
  };
  if (params.returnDate) p.returnDate = params.returnDate;
  if (params.children) p.children = String(params.children);
  if (params.infants) p.infants = String(params.infants);

  const endpoint = params.returnDate
    ? "/api/v2/flights/searchFlightsComplete"
    : "/api/v1/flights/searchFlights";

  const res = await skyFetch<{ status: boolean; data?: SearchFlightsResult }>(endpoint, p);
  return res.data ?? { itineraries: [] };
}

// ─── getPriceCalendar ──────────────────────────────────────────────────────────
export interface PriceDay {
  day: string;
  price: number;
  group?: string;
}

export async function getPriceCalendar(
  originSkyId: string,
  destinationSkyId: string,
  originEntityId: string,
  destinationEntityId: string,
  yearMonth: string, // YYYY-MM
  currency = "USD"
): Promise<PriceDay[]> {
  const res = await skyFetch<{ status: boolean; data?: { flights?: { days?: PriceDay[] } } }>(
    "/api/v1/flights/getPriceCalendar",
    { originSkyId, destinationSkyId, originEntityId, destinationEntityId, yearMonth, currency }
  );
  return res.data?.flights?.days ?? [];
}

// ─── Conversion USD → XAF ─────────────────────────────────────────────────────
// 1 USD ≈ 615 XAF (taux indicatif 2026)
const USD_TO_XAF = 615;

export function usdToXaf(usd: number): number {
  return Math.round(usd * USD_TO_XAF);
}

export function formatXaf(xaf: number): string {
  return new Intl.NumberFormat("fr-FR").format(xaf) + " FCFA";
}
