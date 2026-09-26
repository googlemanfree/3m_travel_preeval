// @vitest-environment jsdom
import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import {
  FlightOffersStore,
  OFFERS_FAILURE_TTL_MS,
  OFFERS_MAX_STALE_MS,
  OFFERS_TTL_MS,
  OFFER_ROUTES,
  collectOffers,
  offerDates,
  selectCheapest,
  type OfferRoute,
} from "./services/flightOffers";
import { flightsRouter, resetFlightOffersStore } from "./routers/flights";
import { FlightBestOffers, formatOfferPrice } from "../client/src/components/FlightDiscoverySections";
import { ALL_FLIGHT_ROUTES, parseLastFlightSearch } from "../client/src/data/flightDiscovery";

afterEach(cleanup);

const DAY = 86_400_000;

describe("dates des relevés", () => {
  it("toujours un lundi, entre 21 et 27 jours plus tard, retour 10 jours après", () => {
    for (const day of ["2026-09-26", "2026-09-28", "2026-10-05", "2026-12-30"]) {
      const { departureDate, returnDate } = offerDates(new Date(`${day}T10:00:00Z`));
      const departure = new Date(`${departureDate}T00:00:00Z`);
      const lead = departure.getTime() - new Date(`${day}T00:00:00Z`).getTime();
      expect(departure.getUTCDay(), day).toBe(1);
      expect(lead, day).toBeGreaterThanOrEqual(21 * DAY);
      expect(lead, day).toBeLessThan(28 * DAY);
      expect((new Date(`${returnDate}T00:00:00Z`).getTime() - departure.getTime()) / DAY).toBe(10);
    }
  });

  it("les dates ne changent pas au cours d'une même journée (la mémoire reste utile)", () => {
    expect(offerDates(new Date("2026-09-26T08:00:00Z"))).toEqual(offerDates(new Date("2026-09-26T22:00:00Z")));
  });
});

describe("choix du tarif le plus bas", () => {
  it("ignore les résultats sans prix valide et garde le moins cher", () => {
    const best = selectCheapest([
      { totalPrice: 500_000, airline: { name: "A" }, stops: 1, durationMinutes: 700 },
      { totalPrice: 0 },
      { totalPrice: "abc" },
      { totalPrice: 457_020.4, airline: { name: "B" }, stops: 0, durationMinutes: 600 },
      {},
    ]);
    expect(best).toEqual({ totalPrice: 457_020, airlineName: "B", stops: 0, durationMinutes: 600 });
    expect(selectCheapest([])).toBeNull();
    expect(selectCheapest([{ totalPrice: -5 }])).toBeNull();
  });
});

describe("relevé des parcours", () => {
  const dates = { departureDate: "2026-10-19", returnDate: "2026-10-29" };

  it("un parcours sans tarif ou en erreur est omis, les autres restent, dans l'ordre de la liste", async () => {
    const routes = OFFER_ROUTES.slice(0, 4);
    const { offers, failed } = await collectOffers(
      async (route) => {
        if (route.id === routes[1].id) return null;
        if (route.id === routes[2].id) throw new Error("timeout");
        // Le premier répond plus tard que le dernier : l'ordre final ne suit pas l'ordre des réponses.
        if (route.id === routes[0].id) await new Promise((resolve) => setTimeout(resolve, 20));
        return { totalPrice: 400_000, airlineName: "Air X", stops: 1, durationMinutes: 700 };
      },
      routes,
      dates,
    );
    expect(offers.map((offer) => offer.routeId)).toEqual([routes[0].id, routes[3].id]);
    expect(failed).toBe(2);
  });

  it("au plus 2 appels simultanés", async () => {
    let running = 0;
    let peak = 0;
    await collectOffers(
      async () => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running -= 1;
        return { totalPrice: 1, airlineName: "x", stops: 0, durationMinutes: 1 };
      },
      OFFER_ROUTES,
      dates,
      2,
    );
    expect(peak).toBe(2);
  });

  it("un aller simple n'a pas de date de retour", async () => {
    const oneWay: OfferRoute = { id: "nsi-dla", from: { iata: "NSI", city: "Yaoundé" }, to: { iata: "DLA", city: "Douala" }, tripType: "ONE_WAY" };
    const { offers } = await collectOffers(async () => ({ totalPrice: 60_000, airlineName: "Camair-Co", stops: 0, durationMinutes: 55 }), [oneWay], dates);
    expect(offers[0].returnDate).toBeNull();
  });

  it("les parcours interrogés sont des parcours fréquents affichés sur la page, et pas plus de 8", () => {
    const shown = new Map(ALL_FLIGHT_ROUTES.map((route) => [route.id, route]));
    for (const route of OFFER_ROUTES) {
      expect(shown.has(route.id), route.id).toBe(true);
      expect(shown.get(route.id)!.from.iata).toBe(route.from.iata);
      expect(shown.get(route.id)!.to.iata).toBe(route.to.iata);
    }
    expect(OFFER_ROUTES.length).toBeLessThanOrEqual(8);
  });
});

describe("mémoire des offres : bornes de coût", () => {
  const snapshot = (retrievedAt: number) => ({
    offers: [{ routeId: "a" } as any],
    retrievedAt: new Date(retrievedAt).toISOString(),
    dates: { departureDate: "x", returnDate: "y" },
  });

  it("un relevé réussi est réutilisé 12 h sans nouvel appel", async () => {
    let clock = 1_000_000_000_000;
    const store = new FlightOffersStore(() => clock);
    const load = vi.fn(async () => snapshot(clock));
    await store.get(load);
    clock += OFFERS_TTL_MS - 1;
    await store.get(load);
    expect(load).toHaveBeenCalledTimes(1);
    clock += 2;
    await store.get(load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("un échec total est mémorisé 10 minutes : pas de rafale d'appels payants quand le fournisseur est en panne", async () => {
    let clock = 1_000_000_000_000;
    const store = new FlightOffersStore(() => clock);
    const load = vi.fn(async () => null);
    expect(await store.get(load)).toBeNull();
    expect(await store.get(load)).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
    clock += OFFERS_FAILURE_TTL_MS + 1;
    await store.get(load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("des visiteurs simultanés partagent un seul relevé", async () => {
    const store = new FlightOffersStore();
    const load = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return snapshot(Date.now());
    });
    const results = await Promise.all([store.get(load), store.get(load), store.get(load)]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(results.every((value) => value === results[0])).toBe(true);
  });

  it("si le renouvellement échoue, l'ancien relevé reste affiché (avec sa date) jusqu'à 36 h, jamais au-delà", async () => {
    let clock = 1_000_000_000_000;
    const store = new FlightOffersStore(() => clock);
    const first = snapshot(clock);
    await store.get(async () => first);
    // 12 h + 1 ms : expiré, renouvellement en échec → l'ancien relevé (13 h < 36 h) est encore servi.
    clock += OFFERS_TTL_MS + 1;
    expect(await store.get(async () => null)).toBe(first);
    // 37 h après le relevé : trop ancien, plus rien n'est affiché.
    clock = 1_000_000_000_000 + OFFERS_MAX_STALE_MS + 60 * 60 * 1000;
    store.reset();
    const old = snapshot(1_000_000_000_000);
    const stale = new FlightOffersStore(() => clock);
    await stale.get(async () => old);
    clock += OFFERS_TTL_MS + 1;
    expect(await stale.get(async () => null)).toBeNull();
  });
});

describe("procédure popularOffers", () => {
  const originalKey = process.env.SEARCHAPI_KEY;
  const originalSwitch = process.env.FLIGHT_OFFERS_DISABLED;
  const XAF_PER_EUR = 655.957;
  let fetchMock: ReturnType<typeof vi.fn>;
  const providerFlight = (price: number, index: number, date: string) => ({
    price,
    total_duration: 600,
    departure_token: `token-${index}`,
    flights: [
      {
        flight_number: `AF ${100 + index}`,
        airline: "Air France",
        departure_airport: { id: "NSI", name: "Nsimalen", date, time: "23:00" },
        arrival_airport: { id: "CDG", name: "Paris Charles de Gaulle", time: "06:00" },
      },
    ],
    layovers: [],
  });
  const provider = (prices: number[]) => {
    const date = offerDates(new Date()).departureDate;
    return { ok: true, status: 200, json: async () => ({ best_flights: prices.map((price, index) => providerFlight(price, index, date)), other_flights: [] }), text: async () => "" };
  };

  beforeEach(() => {
    resetFlightOffersStore();
    process.env.SEARCHAPI_KEY = "cle-de-test";
    delete process.env.FLIGHT_OFFERS_DISABLED;
    fetchMock = vi.fn(async () => provider([700, 650, 900]));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) delete process.env.SEARCHAPI_KEY;
    else process.env.SEARCHAPI_KEY = originalKey;
    if (originalSwitch === undefined) delete process.env.FLIGHT_OFFERS_DISABLED;
    else process.env.FLIGHT_OFFERS_DISABLED = originalSwitch;
    resetFlightOffersStore();
  });
  const call = () => flightsRouter.createCaller({} as never).popularOffers();

  it("renvoie le tarif LE PLUS BAS du fournisseur, converti en FCFA, avec sa date de relevé", async () => {
    const result = await call();
    expect(result.status).toBe("live");
    expect(result.offers).toHaveLength(OFFER_ROUTES.length);
    expect(result.offers[0].priceXaf).toBe(Math.round(650 * XAF_PER_EUR));
    expect(result.retrievedAt).toBeTruthy();
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("adults")).toBe("1");
    expect(url.searchParams.get("travel_class")).toBe("economy");
  });

  it("le second visiteur n'entraîne aucun appel payant supplémentaire", async () => {
    await call();
    const callsAfterFirst = fetchMock.mock.calls.length;
    expect(callsAfterFirst).toBe(OFFER_ROUTES.length);
    await call();
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("sans clé fournisseur ou avec l'interrupteur : aucune offre et aucun appel", async () => {
    delete process.env.SEARCHAPI_KEY;
    expect(await call()).toMatchObject({ status: "not_configured", offers: [] });
    process.env.SEARCHAPI_KEY = "cle-de-test";
    process.env.FLIGHT_OFFERS_DISABLED = "1";
    expect(await call()).toMatchObject({ status: "disabled", offers: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fournisseur en panne : aucune offre, jamais un prix de remplacement", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}), text: async () => "quota" });
    const result = await call();
    expect(result).toMatchObject({ status: "unavailable", offers: [] });
  });
});

describe("cartes « Meilleures offres »", () => {
  const offer = {
    routeId: "nsi-cdg",
    tripType: "ROUND_TRIP" as const,
    from: { iata: "NSI", city: "Yaoundé" },
    to: { iata: "CDG", city: "Paris" },
    departureDate: "2026-11-23",
    returnDate: "2026-12-03",
    priceXaf: 457020,
    airline: "Air France",
    stops: 1,
    durationMinutes: 680,
  };

  it("affiche parcours, dates, « à partir de » et la provenance du relevé", () => {
    render(<FlightBestOffers offers={[offer]} retrievedAt="2026-09-26T19:30:00Z" onPick={vi.fn()} />);
    const card = screen.getByTestId("flight-offer-nsi-cdg");
    expect(card.textContent).toContain("Yaoundé");
    expect(card.textContent).toContain("Paris");
    expect(card.textContent).toContain("Aller-retour");
    expect(card.textContent).toContain("1 escale");
    expect(card.textContent).toContain("à partir de");
    expect(screen.getByTestId("offer-price").textContent).toBe(formatOfferPrice(457020));
    expect(screen.getByTestId("offer-price").textContent).toMatch(/457\s?020 FCFA/);
    expect(screen.getByTestId("offers-provenance").textContent).toContain("Google Flights");
    expect(screen.getByTestId("offers-provenance").textContent).toContain("confirmés par un conseiller");
  });

  it("un clic transmet l'offre (mêmes dates que le relevé) ; sans offre, rien n'est affiché", () => {
    const onPick = vi.fn();
    render(<FlightBestOffers offers={[offer]} retrievedAt={null} onPick={onPick} />);
    fireEvent.click(screen.getByTestId("flight-offer-nsi-cdg"));
    expect(onPick).toHaveBeenCalledWith(offer);
    cleanup();
    const { container } = render(<FlightBestOffers offers={[]} retrievedAt={null} onPick={onPick} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("page de vols", () => {
  const page = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8").replace(/\r\n/g, "\n");

  it("titre, villes lisibles ; les offres ne s'affichent que si le relevé est réel", () => {
    expect(page).toContain("billets d’avion</span> pas chers et des bons plans voyages");
    expect(page).toContain("airportLabel(origin)");
    expect(page).not.toContain("`${origin} — ${origin}`");
    expect(page).toContain('offersQuery.data?.status === "live"');
    expect(page).toContain("<FlightBestOffers offers={offersQuery.data.offers}");
  });

  it("l'hébergement (3M Booking) vient après les étapes et les avantages", () => {
    expect(page).toContain('id="3m-booking" className="order-5');
    expect(page).toContain('<div className="order-3"><FlightLowerSections');
    expect(page).toContain('<div className="order-4"><FlightQuoteRequest ');
  });

  it("les offres précèdent les parcours fréquents", () => {
    expect(page.indexOf("<FlightBestOffers")).toBeGreaterThan(-1);
    expect(page.indexOf("<FlightBestOffers")).toBeLessThan(page.indexOf("<FlightPopularRoutes"));
  });
});

describe("page de vols unique : reprises de l'ancienne page Billets", () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8").split(String.fromCharCode(13)).join("");

  it("aucun résultat ou moteur en panne : un conseiller peut chercher (WhatsApp prérempli avec l'itinéraire)", () => {
    expect(source).toContain('data-testid="search-whatsapp-no_results"');
    expect(source).toContain('data-testid="search-whatsapp-search_error"');
    expect(source).toContain("Bonjour 3M Travel, je souhaite une recherche personnalisée de vol.");
    expect(source).toContain("digitalWhatsAppUrl(searchWhatsAppMessage)");
  });

  it("mesure d'audience : recherche, résultat, retour choisi, offre, demande de réservation, WhatsApp", () => {
    for (const event of ["flight_search_started", "flight_search_success", "flight_search_no_results", "return_flight_selected", "flight_offer_selected", "flight_offer_advisor_requested", "booking_request_started", "whatsapp_clicked"]) {
      expect(source, event).toContain(`trackEvent("${event}"`);
    }
    // Aucune donnée personnelle dans les paramètres d'événements.
    expect(source).not.toMatch(/trackEvent\([^)]*(email|phone|passport|fullName)/i);
  });

  it("la FAQ existante est réutilisée (pas de seconde FAQ recopiée)", () => {
    expect(source).toContain("<FlightBookingFAQ />");
    expect(source).not.toContain("const FAQ_ITEMS");
  });
});

describe("dernière recherche mémorisée sur l'appareil", () => {
  const today = "2026-09-26";
  const valid = { tripType: "ROUND_TRIP", origin: "NSI", destination: "CDG", departureDate: "2026-10-19", returnDate: "2026-10-29", adults: 2, children: 1, infants: 0, cabinClass: "ECONOMY" };
  const raw = (patch: Record<string, unknown> = {}) => JSON.stringify({ ...valid, ...patch });

  it("relit une recherche valide", () => {
    expect(parseLastFlightSearch(raw(), today)).toEqual(valid);
    expect(parseLastFlightSearch(raw({ tripType: "ONE_WAY", returnDate: "2026-01-01" }), today)).toMatchObject({ tripType: "ONE_WAY" });
  });

  it("ignore tout ce qui est absent, altéré ou déjà passé (le stockage n'est jamais digne de confiance)", () => {
    for (const bad of [
      null, "", "pas du json", "[]", "null", "x".repeat(700), raw() + " ".repeat(700),
      raw({ departureDate: "2026-09-25" }), raw({ returnDate: "2026-10-01" }), raw({ origin: "nsi" }), raw({ origin: "CDG" }),
      raw({ destination: "<script>" }), raw({ adults: 0 }), raw({ adults: 10 }), raw({ children: -1 }), raw({ infants: 5 }), raw({ adults: "2" }),
      raw({ cabinClass: "GRATUIT" }), raw({ tripType: "MULTI" }), raw({ departureDate: "demain" }),
    ]) {
      expect(parseLastFlightSearch(bad as string | null, today), String(bad).slice(0, 40)).toBeNull();
    }
  });

  it("ne garde que des champs connus (rien d'autre du stockage ne remonte)", () => {
    const result = parseLastFlightSearch(raw({ email: "a@b.c", nom: "X" }), today);
    expect(Object.keys(result!).sort()).toEqual(["adults", "cabinClass", "children", "departureDate", "destination", "infants", "origin", "returnDate", "tripType"]);
  });

  it("la page propose de reprendre la recherche, la mémorise sans donnée personnelle et tolère un stockage indisponible", () => {
    const page = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8").split(String.fromCharCode(13)).join("");
    expect(page).toContain('data-testid="resume-last-search"');
    expect(page).toContain("parseLastFlightSearch(window.localStorage.getItem(LAST_FLIGHT_SEARCH_KEY), today())");
    expect(page).toContain("window.localStorage.setItem(LAST_FLIGHT_SEARCH_KEY, JSON.stringify(saved));");
    expect(page).toContain("Stockage indisponible");
  });
});

describe("date de relevé sur chaque carte d'offre", () => {
  it("affiche « Relevé le … » quand la date est connue, rien sinon", () => {
    const one = { routeId: "nsi-cdg", tripType: "ROUND_TRIP" as const, from: { iata: "NSI", city: "Yaoundé" }, to: { iata: "CDG", city: "Paris" }, departureDate: "2026-11-23", returnDate: "2026-12-03", priceXaf: 457020, airline: "Air France", stops: 1, durationMinutes: 680 };
    render(<FlightBestOffers offers={[one]} retrievedAt="2026-09-26T19:30:00Z" onPick={vi.fn()} />);
    expect(screen.getByTestId("offer-retrieved").textContent).toContain("Relevé le");
    cleanup();
    render(<FlightBestOffers offers={[one]} retrievedAt={null} onPick={vi.fn()} />);
    expect(screen.queryByTestId("offer-retrieved")).toBeNull();
  });
});
