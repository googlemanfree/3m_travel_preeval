/**
 * Fournisseur de tarifs Google Flights : SearchAPI.io en premier, SerpApi en secours (même source de données Google Flights,
 * même forme de réponse après normalisation). Le secours ne sert QUE les recherches lancées par un visiteur (recherche, retour,
 * revérification) : jamais les offres ni les alertes, pour préserver le petit quota gratuit de SerpApi. Il est plafonné par jour.
 * Rien n'est inventé : sans réponse d'un fournisseur, aucun tarif n'est affiché.
 */

export const SEARCHAPI_URL = "https://www.searchapi.io/api/v1/search";
export const SERPAPI_URL = "https://serpapi.com/search.json";
/** Appels de secours par jour (≈ 240 par mois, sous les 250 du plan gratuit). */
export const FALLBACK_DAILY_CAP = 8;

const TRAVEL_CLASS_CODES: Record<string, string> = { economy: "1", premium_economy: "2", business: "3", first_class: "4" };

export type ProviderName = "searchapi" | "serpapi";
export type ProviderResponse = { ok: boolean; status: number; provider: ProviderName; json: () => Promise<any>; text: () => Promise<string> };
export type ProviderDeps = {
  fetchImpl?: typeof fetch;
  searchApiKey?: string | undefined;
  serpApiKey?: string | undefined;
  /** Faux pour les offres et les alertes : jamais de secours payant sur un relevé automatique. */
  allowFallback?: boolean;
  timeoutMs?: number;
  now?: () => number;
};

export const isProviderConfigured = () => Boolean(process.env.SEARCHAPI_KEY || process.env.SERPAPI_KEY);

const usage = { day: "", count: 0 };
export const fallbackCallsToday = (now = Date.now()) => (usage.day === new Date(now).toISOString().slice(0, 10) ? usage.count : 0);
export const resetFallbackUsage = () => { usage.day = ""; usage.count = 0; };

function takeFallbackSlot(now: number): boolean {
  const day = new Date(now).toISOString().slice(0, 10);
  if (usage.day !== day) { usage.day = day; usage.count = 0; }
  if (usage.count >= FALLBACK_DAILY_CAP) return false;
  usage.count += 1;
  return true;
}

/** Paramètres SearchAPI → paramètres SerpApi (mêmes noms, sauf le type de vol et la classe, numériques chez SerpApi). */
export function toSerpApiParams(searchApi: URLSearchParams, serpApiKey: string): URLSearchParams {
  const params = new URLSearchParams();
  searchApi.forEach((value, key) => {
    if (key === "api_key" || key === "flight_type" || key === "travel_class") return;
    params.set(key, value);
  });
  params.set("api_key", serpApiKey);
  params.set("type", searchApi.get("flight_type") === "round_trip" ? "1" : "2");
  params.set("travel_class", TRAVEL_CLASS_CODES[searchApi.get("travel_class") ?? "economy"] ?? "1");
  return params;
}

const splitDateTime = (airport: any) => {
  if (!airport || typeof airport !== "object") return airport;
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(String(airport.time ?? ""));
  return match ? { ...airport, date: match[1], time: match[2] } : airport;
};

/** Réponse SerpApi → forme SearchAPI (date et heure séparées) : le reste de l'application ne connaît qu'une seule forme. */
export function normalizeSerpApiJson(json: any) {
  const fix = (item: any) => ({
    ...item,
    flights: (item?.flights ?? []).map((leg: any) => ({ ...leg, departure_airport: splitDateTime(leg.departure_airport), arrival_airport: splitDateTime(leg.arrival_airport) })),
    layovers: item?.layovers ?? [],
  });
  return { ...json, best_flights: (json?.best_flights ?? []).map(fix), other_flights: (json?.other_flights ?? []).map(fix) };
}

const wrap = (response: Response, provider: ProviderName, transform?: (json: any) => any): ProviderResponse => ({
  ok: response.ok,
  status: response.status,
  provider,
  json: async () => (transform ? transform(await response.json()) : response.json()),
  text: () => response.text(),
});

/** Interroge le fournisseur principal puis, seulement si permis, le secours. `params` est au format SearchAPI. */
export async function fetchProvider(params: URLSearchParams, deps: ProviderDeps = {}): Promise<ProviderResponse> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const searchApiKey = "searchApiKey" in deps ? deps.searchApiKey : process.env.SEARCHAPI_KEY;
  const serpApiKey = "serpApiKey" in deps ? deps.serpApiKey : process.env.SERPAPI_KEY;
  const timeoutMs = deps.timeoutMs ?? 8_000;
  const now = deps.now ?? Date.now;
  const allowFallback = deps.allowFallback !== false;

  const callSerpApi = async (): Promise<ProviderResponse | null> => {
    if (!serpApiKey || !takeFallbackSlot(now())) return null;
    try {
      const response = await fetchImpl(`${SERPAPI_URL}?${toSerpApiParams(params, serpApiKey).toString()}`, { signal: AbortSignal.timeout(timeoutMs) });
      return wrap(response, "serpapi", normalizeSerpApiJson);
    } catch {
      return null;
    }
  };

  if (!searchApiKey) {
    // Aucune clé principale : le secours sert seul, sinon c'est une panne franche.
    const direct = allowFallback ? await callSerpApi() : null;
    if (direct) return direct;
    throw new Error("Aucun fournisseur de tarifs n'est configuré ou disponible.");
  }

  const primaryParams = new URLSearchParams(params);
  primaryParams.set("api_key", searchApiKey);
  let primary: ProviderResponse | null = null;
  let primaryError: unknown = null;
  try {
    primary = wrap(await fetchImpl(`${SEARCHAPI_URL}?${primaryParams.toString()}`, { signal: AbortSignal.timeout(timeoutMs) }), "searchapi");
  } catch (error) {
    primaryError = error;
  }
  if (primary?.ok) return primary;

  const fallback = allowFallback ? await callSerpApi() : null;
  if (fallback?.ok) return fallback;
  if (primary) return primary;
  throw primaryError instanceof Error ? primaryError : new Error("Le fournisseur de tarifs n'a pas répondu.");
}
