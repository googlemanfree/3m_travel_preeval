import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const flightsPage = readFileSync(resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8");

describe("positionnement des résultats de vols", () => {
  it("place les résultats immédiatement après le formulaire avant les services secondaires", () => {
    expect(flightsPage).toContain('id="flight-results" className="order-1');
    expect(flightsPage).toContain('id="3m-booking" className="order-2');
    expect(flightsPage).toContain('<div className="order-3"><FlightQuoteRequest /></div>');
  });

  it("ouvre les détails compagnie, bagages et conditions de chaque offre par défaut", () => {
    expect(flightsPage).toContain("const [expanded, setExpanded] = useState(true);");
    expect(flightsPage).toContain("Bagages autorisés");
    expect(flightsPage).toContain("Conditions tarifaires");
    expect(flightsPage).toContain("Taxes aéroport & PNR");
  });
});
