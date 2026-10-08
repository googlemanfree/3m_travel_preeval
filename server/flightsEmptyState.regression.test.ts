import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const discovery = readFileSync(resolve(root, "client/src/data/flightDiscovery.ts"), "utf8");
const sections = readFileSync(resolve(root, "client/src/components/FlightDiscoverySections.tsx"), "utf8");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");

describe("état vide premium /flights — sans tarifs inventés", () => {
  it("expose trois raccourcis Yaoundé sans prix écrits en dur", () => {
    expect(discovery).toContain("FLIGHT_EMPTY_STATE_ROUTES");
    expect(discovery).toContain('["CDG", "Paris"]');
    expect(discovery).toContain('["YUL", "Montréal"]');
    expect(discovery).toContain('["DXB", "Dubaï"]');
    expect(discovery).toContain("Aucun tarif ici");
  });

  it("rend un empty state avec parcours cliquables et WhatsApp conseiller", () => {
    const emptyBlock = sections.slice(sections.indexOf("export function FlightSearchEmptyState"));
    expect(sections).toContain("export function FlightSearchEmptyState");
    expect(emptyBlock).toContain('data-testid="flight-search-empty-state"');
    expect(emptyBlock).toContain('data-testid="flight-empty-shortcuts"');
    expect(emptyBlock).toContain("WhatsApp conseiller");
    expect(emptyBlock).toContain("sans tarif affiché avant recherche");
    expect(emptyBlock).not.toContain("FCFA");
    expect(emptyBlock.slice(0, emptyBlock.indexOf("export function FlightPopularRoutes"))).not.toContain("à partir de");
  });

  it("branche l’empty state sur les cas sans résultat et erreur de recherche", () => {
    expect(flights).toContain("FlightSearchEmptyState");
    expect(flights).toContain('reason={data?.providerNotice ? "unavailable" : "no_results"}');
    expect(flights).toContain('reason="error"');
    expect(flights).toContain('whatsappTestId="search-whatsapp-no_results"');
  });
});
