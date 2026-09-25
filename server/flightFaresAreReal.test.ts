import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flightsRouter } from "./routers/flights";
import { flightSearchCache } from "./services/flightSearchCache";

const XAF_PER_EUR = 655.957;
const departureDate = new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10);

const providerFlight = (price: number, flightNumber = "AT 280") => ({
  price,
  total_duration: 675,
  departure_token: "token-aller",
  flights: [
    {
      flight_number: flightNumber,
      airline: "Royal Air Maroc",
      departure_airport: { id: "DLA", name: "Douala", date: departureDate, time: "05:25" },
      arrival_airport: { id: "CDG", name: "Paris Charles de Gaulle", time: "18:40" },
    },
  ],
  layovers: [],
});
const providerResponse = (flights: unknown[]) => ({ ok: true, status: 200, json: async () => ({ best_flights: flights, other_flights: [] }), text: async () => "" });

const search = (overrides: Record<string, unknown> = {}) =>
  flightsRouter.createCaller({} as never).searchFlights({ tripType: "ONE_WAY", origin: "DLA", destination: "CDG", departureDate, adults: 1, children: 0, infants: 0, cabinClass: "ECONOMY", ...overrides } as never);

const originalKey = process.env.SEARCHAPI_KEY;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  flightSearchCache.clear();
  process.env.SEARCHAPI_KEY = "cle-de-test";
  fetchMock = vi.fn(async () => providerResponse([providerFlight(425)]));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalKey === undefined) delete process.env.SEARCHAPI_KEY;
  else process.env.SEARCHAPI_KEY = originalKey;
});

describe("les tarifs affichés sont ceux du fournisseur, sans aucune donnée inventée", () => {
  it("un adulte : total = prix du fournisseur converti en FCFA (parité fixe)", async () => {
    const result = await search();
    const flight = (result.outbound as any[])[0];
    expect(flight.totalPrice).toBe(Math.round(425 * XAF_PER_EUR));
    expect(flight.pricePerPax).toBe(flight.totalPrice);
    expect(flight.pricedPassengers).toBe(1);
  });

  it("deux adultes : le fournisseur renvoie déjà le prix du GROUPE, il n'est pas multiplié une seconde fois", async () => {
    fetchMock.mockImplementation(async () => providerResponse([providerFlight(850)])); // 2 x 425 €
    const flight = ((await search({ adults: 2 })).outbound as any[])[0];
    expect(flight.totalPrice).toBe(Math.round(850 * XAF_PER_EUR)); // 557 563, et non 1 115 126
    expect(flight.pricePerPax).toBe(Math.round(flight.totalPrice / 2));
    expect(flight.pricedPassengers).toBe(2);
  });

  it("deux adultes et un enfant : le total du fournisseur est réparti sur 3 voyageurs, sans coefficient inventé", async () => {
    fetchMock.mockImplementation(async () => providerResponse([providerFlight(1200)]));
    const flight = ((await search({ adults: 2, children: 1 })).outbound as any[])[0];
    expect(flight.totalPrice).toBe(Math.round(1200 * XAF_PER_EUR));
    expect(flight.pricedPassengers).toBe(3);
  });

  it("ne contient ni places restantes, ni bagages, ni remboursabilité, ni taxes, ni fausse référence PNR", async () => {
    const flight = ((await search()).outbound as any[])[0];
    for (const invented of ["seatsLeft", "baggage", "refundable", "pnrRef", "gdsFareBasis", "gdsBookingClass", "gdsTaxesAndFees"]) {
      expect(Object.keys(flight), invented).not.toContain(invented);
    }
    expect(flight).toMatchObject({ isLiveGoogleFlights: true, sourceCurrency: "EUR", sourcePrice: 425, flightNumber: "AT 280", departureTime: "05:25" });
  });

  it("indique quand et d'où viennent les tarifs, et n'est jamais une démonstration", async () => {
    const result = await search();
    expect(result.providerStatus).toBe("live");
    expect(result.isDemo).toBe(false);
    expect(new Date(result.retrievedAt as string).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it("les bébés ne sont pas demandés au fournisseur : le tarif l'indique au lieu de les estimer", async () => {
    const result = await search({ infants: 1 });
    expect(result.providerNotice).toMatch(/bébés/);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).not.toMatch(/infants/);
  });

  it("la clé de cache tient compte des enfants et des bébés : deux recherches différentes ne partagent pas un prix", async () => {
    await search({ adults: 2, children: 0 });
    await search({ adults: 2, children: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await search({ adults: 2, children: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2); // la même recherche, elle, est bien servie depuis le cache
  });
});

describe("sans fournisseur : aucun tarif plutôt qu'un tarif inventé", () => {
  it("sans clé : liste vide, message honnête, aucun appel réseau, rien en cache", async () => {
    delete process.env.SEARCHAPI_KEY;
    const result = await search();
    expect(result.outbound).toEqual([]);
    expect(result.providerStatus).toBe("not_configured");
    expect(result.isDemo).toBe(false);
    expect(result.retrievedAt).toBeNull();
    expect(result.providerNotice).toMatch(/aucun tarif/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("panne du fournisseur : liste vide, message honnête, et la panne n'est pas mise en cache", async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 503, json: async () => ({}), text: async () => "indisponible" }));
    const first = await search();
    expect(first.outbound).toEqual([]);
    expect(first.providerNotice).toMatch(/aucun tarif/i);
    expect(first.isDemo).toBe(false);
    fetchMock.mockImplementation(async () => providerResponse([providerFlight(425)]));
    const second = await search(); // le fournisseur est revenu : la recherche suivante n'est pas bloquée par la panne
    expect((second.outbound as any[]).length).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aucun résultat réel : liste vide sans message de panne", async () => {
    fetchMock.mockImplementation(async () => providerResponse([]));
    const result = await search();
    expect(result.outbound).toEqual([]);
    expect(result.providerStatus).toBe("live_no_results");
    expect(result.providerNotice).toBeNull();
  });
});

describe("vol retour", () => {
  const returnSearch = (overrides: Record<string, unknown> = {}) =>
    flightsRouter.createCaller({} as never).searchReturnFlights({ origin: "DLA", destination: "CDG", departureDate, returnDate: departureDate, adults: 1, children: 0, infants: 0, cabinClass: "ECONOMY", departureToken: "token-aller", ...overrides } as never);

  it("sans jeton de départ : aucune option de retour fabriquée", async () => {
    const result = await returnSearch({ departureToken: undefined });
    expect(result.inbound).toEqual([]);
    expect(result.providerStatus).toBe("no_departure_token");
    expect(result.isDemo).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("panne : aucune option de retour fabriquée", async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => "" }));
    const result = await returnSearch();
    expect(result.inbound).toEqual([]);
    expect(result.providerStatus).toBe("error");
    expect(result.providerNotice).toMatch(/aucun tarif/i);
  });

  it("en direct : options de retour réelles avec le total du fournisseur", async () => {
    fetchMock.mockImplementation(async () => providerResponse([providerFlight(672, "AT 789")]));
    const result = await returnSearch();
    const option = (result.inbound as any[])[0];
    expect(option.totalPrice).toBe(Math.round(672 * XAF_PER_EUR));
    expect(option).not.toHaveProperty("seatsLeft");
    expect(result.providerStatus).toBe("live");
  });
});
