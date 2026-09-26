import { describe, expect, it } from "vitest";
import {
  MAX_RECENT_FLIGHT_SEARCHES,
  parseRecentFlightSearches,
} from "@/data/flightDiscovery";

const validSearch = (overrides: Record<string, unknown> = {}) => ({
  tripType: "ROUND_TRIP",
  origin: "NSI",
  destination: "CDG",
  departureDate: "2026-10-03",
  returnDate: "2026-10-17",
  adults: 1,
  children: 0,
  infants: 0,
  cabinClass: "ECONOMY",
  savedAt: 1_000,
  ...overrides,
});

describe("parseRecentFlightSearches", () => {
  it("conserve les recherches valides, les déduplique et les limite à cinq", () => {
    const destinations = ["CDG", "YUL", "YYZ", "BRU", "IST", "DXB", "PEK"];
    const items = Array.from({ length: MAX_RECENT_FLIGHT_SEARCHES + 2 }, (_, index) => validSearch({
      destination: destinations[index],
      savedAt: 10_000 - index,
    }));
    const parsed = parseRecentFlightSearches(JSON.stringify([items[0], items[1], items[1], ...items.slice(2)]), "2026-09-01");

    expect(parsed).toHaveLength(MAX_RECENT_FLIGHT_SEARCHES);
    expect(parsed[0]).toMatchObject({ origin: "NSI", destination: "CDG", savedAt: 10_000 });
    expect(new Set(parsed.map((item) => `${item.origin}-${item.destination}-${item.departureDate}`)).size).toBe(parsed.length);
  });

  it("ignore les entrées altérées, expirées, sans date d’enregistrement et les mauvais formats", () => {
    const parsed = parseRecentFlightSearches(JSON.stringify([
      validSearch({ departureDate: "2025-01-01" }),
      validSearch({ origin: "NSI", destination: "NSI" }),
      validSearch({ savedAt: 0 }),
      { not: "a search" },
    ]), "2026-09-01");

    expect(parsed).toEqual([]);
    expect(parseRecentFlightSearches("not-json", "2026-09-01")).toEqual([]);
    expect(parseRecentFlightSearches(JSON.stringify({ ...validSearch() }), "2026-09-01")).toEqual([]);
  });
});
