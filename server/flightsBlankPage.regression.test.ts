import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");
const transition = readFileSync(resolve(root, "client/src/components/PageTransition.tsx"), "utf8");
const fares = readFileSync(resolve(root, "server/routers/flights.ts"), "utf8");
const prerender = readFileSync(resolve(root, "server/publicPrerender.ts"), "utf8");

describe("page /flights — anti page blanche et tarifs fiables", () => {
  it("n’entre jamais en opacity:0 sur le hero ni la transition de page", () => {
    expect(transition).toContain("// Ne jamais démarrer à opacity:0");
    expect(transition).toContain("initial={motionDisabled ? false : { y: 8 }}");
    expect(flights).toContain('data-testid="flight-search-panel"');
    expect(flights).toContain("initial={false}");
    expect(flights).toContain('document.title = "Billets d\'avion internationaux | 3M TRAVEL AGENCY"');
  });

  it("filtre les résultats sans lever d’exception si airline est absent", () => {
    expect(flights).toContain("airlineCodeOf");
    expect(flights).toContain("flight.airline?.code");
    expect(flights).not.toContain("outbound.find((f) => f.airline.code === code)!.airline");
  });

  it("calcule le filtre de prix sur les tarifs réels (pas un plancher 0 / plafond forcé 10M)", () => {
    expect(flights).toContain("pricedOutbound.length > 0 ? Math.min(...pricedOutbound)");
    expect(flights).toContain("pricedOutbound.length > 0 ? Math.max(...pricedOutbound)");
    expect(flights).not.toContain("Math.min(...outbound.map((f) => f.totalPrice), 0)");
    expect(flights).not.toContain("Math.max(...outbound.map((f) => f.totalPrice), 10000000)");
  });

  it("conserve la conversion EUR→FCFA et la commission réelle côté serveur", () => {
    expect(fares).toContain("const XAF_PER_EUR = 655.957");
    expect(fares).toContain("sourcePrice * XAF_PER_EUR * params.commissionMultiplier");
    expect(fares).toContain("showing supplier price as-is");
    expect(fares).toContain("NO_LIVE_FARES_NOTICE");
  });

  it("échappe le nom de site dans les balises Open Graph", () => {
    expect(prerender).toContain('content="${esc(SITE)}"');
  });
});
