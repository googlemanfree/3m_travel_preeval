// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import { FlightLowerSections, FlightPopularRoutes, FlightServiceTabs } from "@/components/FlightDiscoverySections";
import {
  ALL_FLIGHT_ROUTES,
  FLIGHT_BOOKING_STEPS,
  FLIGHT_COMPANION_SERVICES,
  FLIGHT_ROUTES_BY_DEPARTURE,
  FLIGHT_ROUTE_GROUPS,
  FLIGHT_SERVICE_TABS,
  FLIGHT_STOP_OPTIONS,
} from "@/data/flightDiscovery";

afterEach(cleanup);

const source = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const appRoutes = () => {
  const app = source("client/src/App.tsx");
  return new Set(Array.from(app.matchAll(/path=(?:\{?")(\/[^"]*)"/g)).map((match) => match[1]));
};

describe("données de la page de vols", () => {
  it("aucun tarif, aucune devise ni « à partir de » : un prix n'existe que dans une vraie recherche", () => {
    const raw = source("client/src/data/flightDiscovery.ts") + source("client/src/components/FlightDiscoverySections.tsx");
    expect(raw).not.toMatch(/\d[\d\s.,]*\s?(FCFA|XAF|EUR|€|\$)/i);
    expect(raw).not.toMatch(/à partir de/i);
    expect(raw).not.toMatch(/\b(prix imbattable|meilleur prix garanti|moins cher)\b/i);
  });

  it("chaque parcours a deux codes IATA distincts, un identifiant unique et un type de voyage valide", () => {
    const ids = ALL_FLIGHT_ROUTES.map((route) => route.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const route of ALL_FLIGHT_ROUTES) {
      expect(route.from.iata).toMatch(/^[A-Z]{3}$/);
      expect(route.to.iata).toMatch(/^[A-Z]{3}$/);
      expect(route.from.iata).not.toBe(route.to.iata);
      expect(route.from.city && route.to.city).toBeTruthy();
      expect(["ROUND_TRIP", "ONE_WAY"]).toContain(route.tripType);
    }
    expect(FLIGHT_ROUTE_GROUPS.every((group) => group.routes.length > 0)).toBe(true);
  });

  it("les liens par ville de départ reprennent exactement les mêmes parcours", () => {
    const grouped = FLIGHT_ROUTES_BY_DEPARTURE.flatMap((group) => group.routes.map((route) => route.id)).sort();
    expect(grouped).toEqual(ALL_FLIGHT_ROUTES.map((route) => route.id).sort());
    expect(FLIGHT_ROUTES_BY_DEPARTURE.map((group) => group.city)).toEqual(["Yaoundé", "Douala"]);
  });

  it("les liens internes visent des routes déclarées dans App.tsx ou une ancre de la page", () => {
    const routes = appRoutes();
    const hrefs = [...FLIGHT_SERVICE_TABS.map((tab) => tab.href), ...FLIGHT_COMPANION_SERVICES.map((item) => item.href)];
    for (const href of hrefs) {
      if (href.startsWith("#")) continue;
      const path = href.split("?")[0];
      expect(routes.has(path), `${href} n'est pas une route déclarée`).toBe(true);
    }
    expect(document.body).toBeTruthy();
  });

  it("quatre étapes qui ne promettent que le parcours réel (pas de blocage de tarif)", () => {
    expect(FLIGHT_BOOKING_STEPS).toHaveLength(4);
    const text = JSON.stringify(FLIGHT_BOOKING_STEPS) + source("client/src/data/flightDiscovery.ts");
    expect(text).not.toMatch(/bloquer|24 ?h|garantie de prix/i);
  });

  it("le filtre d'escales propose « toutes », « directs » et « 1 maximum »", () => {
    expect(FLIGHT_STOP_OPTIONS.map((option) => option.value)).toEqual([null, 0, 1]);
  });
});

describe("composants", () => {
  it("les onglets de services marquent « Vols » comme page courante et mènent aux autres services", () => {
    render(<FlightServiceTabs />);
    const nav = screen.getByRole("navigation", { name: "Services de voyage 3M" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(FLIGHT_SERVICE_TABS.length);
    expect(within(nav).getByRole("link", { name: "Vols" }).getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Assurance" }).getAttribute("href")).toBe("/assurance");
    expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it("un parcours fréquent transmet le bon trajet, au clic, avec un nom accessible", () => {
    const onPick = vi.fn();
    render(<FlightPopularRoutes onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: "Rechercher un vol Yaoundé vers Paris" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0]).toMatchObject({ from: { iata: "NSI" }, to: { iata: "CDG" }, tripType: "ROUND_TRIP" });
    expect(screen.getAllByRole("button").length).toBe(ALL_FLIGHT_ROUTES.length);
    fireEvent.click(screen.getByRole("button", { name: "Rechercher un vol Yaoundé vers Douala" }));
    expect(onPick.mock.calls[1][0].tripType).toBe("ONE_WAY");
    expect(screen.getByRole("button", { name: "Rechercher un vol Yaoundé vers Paris" }).textContent).toMatch(/NSI – CDG · Aller-retour/);
    expect(screen.getByRole("button", { name: "Rechercher un vol Yaoundé vers Douala" }).textContent).toMatch(/NSI – DLA · Aller simple/);
  });

  it("les sections du bas affichent étapes, avantages, services liés et liens par ville, sans tarif", () => {
    const onPick = vi.fn();
    const { container } = render(<FlightLowerSections onPick={onPick} />);
    expect(screen.getByRole("heading", { name: "Réserver en quatre étapes" })).toBeTruthy();
    expect(container.querySelectorAll("[data-testid=flight-steps] li")).toHaveLength(4);
    expect(container.querySelectorAll("[data-testid=flight-advantages] h3")).toHaveLength(4);
    expect(container.querySelectorAll("[data-testid=flight-companion-services] a")).toHaveLength(FLIGHT_COMPANION_SERVICES.length);
    const byDeparture = container.querySelector("[data-testid=flight-routes-by-departure]") as HTMLElement;
    fireEvent.click(within(byDeparture).getAllByRole("button")[0]);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toMatch(/FCFA|XAF|€/);
  });
});
