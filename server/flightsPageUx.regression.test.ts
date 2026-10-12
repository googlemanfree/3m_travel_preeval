import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");
const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");

describe("UX /flights — partage URL + CTA sticky", () => {
  it("réécrit l’URL de recherche pour refresh et partage", () => {
    expect(flights).toContain("window.history.replaceState");
    expect(flights).toContain("params.set(\"returnDate\", returnDate)");
    expect(flights).toContain("async function shareSearch()");
    expect(flights).toContain('data-testid="flight-share-search"');
    expect(flights).toContain("navigator.share");
    expect(flights).toContain("flight_search_shared");
  });

  it("affiche une barre sticky mobile post-résultats", () => {
    expect(flights).toContain('data-testid="flights-sticky-cta"');
    expect(flights).toContain('data-testid="flights-sticky-whatsapp"');
    expect(flights).toContain("searchEnabled && !isFetching && outbound.length > 0");
    expect(css).toContain('body:has([data-testid="flights-sticky-cta"])');
  });

  it("propose WhatsApp quand les filtres vident la liste", () => {
    expect(flights).toContain('data-testid="flight-filters-empty"');
    expect(flights).toContain('data-testid="search-whatsapp-filters_empty"');
  });
});
