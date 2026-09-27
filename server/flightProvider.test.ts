import { afterEach, describe, expect, it, vi } from "vitest";
import { fallbackCallsToday, fetchProvider, isProviderConfigured, normalizeSerpApiJson, resetFallbackUsage, toSerpApiParams } from "./services/flightProvider";

afterEach(() => resetFallbackUsage());

const searchApiParams = () => new URLSearchParams({ engine: "google_flights", api_key: "sa-key", departure_id: "NSI", arrival_id: "CDG", outbound_date: "2026-11-23", flight_type: "round_trip", travel_class: "business", adults: "2", children: "1", currency: "EUR", return_date: "2026-12-03" });

const jsonResponse = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) }) as Response;

describe("traduction des paramètres SearchAPI → SerpApi", () => {
  it("reprend les mêmes champs, sans la clé ni les champs propres à SearchAPI", () => {
    const params = toSerpApiParams(searchApiParams(), "serp-key");
    expect(params.get("api_key")).toBe("serp-key");
    expect(params.get("departure_id")).toBe("NSI");
    expect(params.get("return_date")).toBe("2026-12-03");
    expect(params.get("flight_type")).toBeNull();
    expect(params.get("travel_class")).toBe("3");
    expect(params.get("type")).toBe("1");
  });

  it("le type de vol et la classe utilisent les codes numériques de SerpApi", () => {
    expect(toSerpApiParams(searchApiParams(), "k").get("type")).toBe("1");
    expect(toSerpApiParams(new URLSearchParams({ ...Object.fromEntries(searchApiParams()), flight_type: "one_way" }), "k").get("type")).toBe("2");
    for (const [searchApiClass, serpCode] of [["economy", "1"], ["premium_economy", "2"], ["business", "3"], ["first_class", "4"]] as const) {
      expect(toSerpApiParams(new URLSearchParams({ ...Object.fromEntries(searchApiParams()), travel_class: searchApiClass }), "k").get("travel_class")).toBe(serpCode);
    }
  });
});

describe("normalisation de la réponse SerpApi", () => {
  it("sépare la date et l'heure comme le fait SearchAPI", () => {
    const normalized = normalizeSerpApiJson({
      best_flights: [{ price: 450, total_duration: 600, flights: [{ flight_number: "AF 990", airline: "Air France", departure_airport: { id: "NSI", name: "Nsimalen", time: "2026-11-23 23:10" }, arrival_airport: { id: "CDG", name: "CDG", time: "2026-11-24 06:20" } }], layovers: [] }],
      other_flights: [],
    });
    expect(normalized.best_flights[0].flights[0].departure_airport).toMatchObject({ date: "2026-11-23", time: "23:10" });
    expect(normalized.best_flights[0].flights[0].arrival_airport).toMatchObject({ date: "2026-11-24", time: "06:20" });
  });

  it("un vol sans date/heure reconnaissable est laissé tel quel, sans planter", () => {
    const normalized = normalizeSerpApiJson({ best_flights: [{ flights: [{ departure_airport: { id: "NSI" } }] }] });
    expect(normalized.best_flights[0].flights[0].departure_airport).toEqual({ id: "NSI" });
  });

  it("une réponse vide ou absente ne plante pas", () => {
    expect(normalizeSerpApiJson({})).toEqual({ best_flights: [], other_flights: [] });
    expect(normalizeSerpApiJson(null)).toEqual({ best_flights: [], other_flights: [] });
  });
});

describe("choix du fournisseur", () => {
  it("SearchAPI répond : le secours n'est jamais appelé", async () => {
    const fetchImpl = vi.fn(async (url: string) => (url.includes("searchapi.io") ? jsonResponse(200, { best_flights: [] }) : jsonResponse(500, {})));
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key" });
    expect(response.provider).toBe("searchapi");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("SearchAPI en panne (429) : le secours prend le relais si autorisé et configuré", async () => {
    const fetchImpl = vi.fn(async (url: string) => (url.includes("searchapi.io") ? jsonResponse(429, { error: "quota" }) : jsonResponse(200, { best_flights: [{ flights: [{}] }] })));
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key" });
    expect(response.provider).toBe("serpapi");
    expect(response.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("SearchAPI lève une exception (réseau) : le secours est quand même tenté", async () => {
    const fetchImpl = vi.fn(async (url: string) => { if (url.includes("searchapi.io")) throw new Error("timeout"); return jsonResponse(200, { best_flights: [] }); });
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key" });
    expect(response.provider).toBe("serpapi");
  });

  it("offres et alertes (allowFallback: false) : jamais de secours, même si SearchAPI échoue", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, {}));
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key", allowFallback: false });
    expect(response.provider).toBe("searchapi");
    expect(response.ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("sans clé SearchAPI mais avec SerpApi : le secours sert seul", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { best_flights: [] }));
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: undefined, serpApiKey: "serp-key" });
    expect(response.provider).toBe("serpapi");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("aucune clé nulle part : échec franc, sans appel réseau", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {}));
    await expect(fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: undefined, serpApiKey: undefined })).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("SearchAPI échoue et aucune clé de secours : l'échec de SearchAPI est renvoyé (jamais un tarif inventé)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(500, { error: "down" }));
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: undefined });
    expect(response.provider).toBe("searchapi");
    expect(response.ok).toBe(false);
  });
});

describe("plafond quotidien du secours", () => {
  it("au plus 8 appels de secours par jour ; au-delà, l'échec de SearchAPI est renvoyé tel quel", async () => {
    const fetchImpl = vi.fn(async (url: string) => (url.includes("searchapi.io") ? jsonResponse(429, {}) : jsonResponse(200, { best_flights: [] })));
    const now = () => Date.parse("2026-09-27T10:00:00Z");
    for (let i = 0; i < 8; i += 1) {
      const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key", now });
      expect(response.provider, `appel ${i + 1}`).toBe("serpapi");
    }
    expect(fallbackCallsToday(now())).toBe(8);
    const ninth = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key", now });
    expect(ninth.provider).toBe("searchapi");
    expect(ninth.ok).toBe(false);
  });

  it("le plafond repart de zéro le lendemain", async () => {
    const fetchImpl = vi.fn(async (url: string) => (url.includes("searchapi.io") ? jsonResponse(429, {}) : jsonResponse(200, { best_flights: [] })));
    const day1 = () => Date.parse("2026-09-27T23:00:00Z");
    for (let i = 0; i < 8; i += 1) await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key", now: day1 });
    const day2 = () => Date.parse("2026-09-28T00:00:01Z");
    const response = await fetchProvider(searchApiParams(), { fetchImpl, searchApiKey: "sa-key", serpApiKey: "serp-key", now: day2 });
    expect(response.provider).toBe("serpapi");
    expect(fallbackCallsToday(day2())).toBe(1);
  });
});

describe("configuration", () => {
  const originalSearch = process.env.SEARCHAPI_KEY;
  const originalSerp = process.env.SERPAPI_KEY;
  afterEach(() => {
    if (originalSearch === undefined) delete process.env.SEARCHAPI_KEY; else process.env.SEARCHAPI_KEY = originalSearch;
    if (originalSerp === undefined) delete process.env.SERPAPI_KEY; else process.env.SERPAPI_KEY = originalSerp;
  });

  it("configuré dès qu'une des deux clés est présente", () => {
    delete process.env.SEARCHAPI_KEY;
    delete process.env.SERPAPI_KEY;
    expect(isProviderConfigured()).toBe(false);
    process.env.SERPAPI_KEY = "serp-key";
    expect(isProviderConfigured()).toBe(true);
    delete process.env.SERPAPI_KEY;
    process.env.SEARCHAPI_KEY = "sa-key";
    expect(isProviderConfigured()).toBe(true);
  });
});
