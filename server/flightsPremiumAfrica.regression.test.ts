import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const discovery = readFileSync(resolve(root, "client/src/data/flightDiscovery.ts"), "utf8");
const sections = readFileSync(resolve(root, "client/src/components/FlightDiscoverySections.tsx"), "utf8");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");
const router = readFileSync(resolve(root, "server/routers/flights.ts"), "utf8");
const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");

describe("premium /flights Afrique — logos, hero, mobilité", () => {
  it("enrichit les compagnies Afrique / Cameroun côté serveur", () => {
    expect(router).toContain('QC: { code: "QC", name: "Camair-Co"');
    expect(router).toContain('KP: { code: "KP", name: "ASKY Airlines"');
    expect(router).toContain('HF: { code: "HF", name: "Air Côte d’Ivoire"');
    expect(router).toContain("EgyptAir");
  });

  it("expose un bandeau compagnies sans tarifs inventés", () => {
    expect(discovery).toContain("FEATURED_AFRICA_CARRIERS");
    expect(discovery).toContain("Camair-Co");
    expect(sections).toContain('data-testid="flight-africa-carriers"');
    expect(sections).toContain("FlightAfricaCarriersBand");
    const band = sections.slice(sections.indexOf("FlightAfricaCarriersBand"));
    expect(band).not.toContain("FCFA");
    expect(band).not.toContain("à partir de");
  });

  it("ancre le hero /flights dans une image mobilité réelle + marque 3M TRAVEL AGENCY", () => {
    expect(flights).toContain('data-testid="flight-hero"');
    expect(flights).toContain('data-testid="flights-hero-brand"');
    expect(flights).toContain("3M TRAVEL AGENCY");
    expect(flights).toContain("/manus-storage/3m-home-mobility-hero_f9957244.webp");
    expect(flights).toContain("Billets d’avion internationaux");
    expect(flights).toContain("document.title = \"Billets d'avion internationaux | 3M TRAVEL AGENCY\"");
    expect(css).toContain("@keyframes flights-hero-ken");
    expect(css).toContain(".flights-hero-media");
  });

  it("relie le billet aux preuves visa réelles (masquées)", () => {
    expect(sections).toContain('data-testid="flight-mobility-proof-bridge"');
    expect(sections).toContain("PROOF_PHOTOS");
    expect(sections).toContain("données masquées");
    expect(sections).toContain("/#proof-gallery-title");
  });

  it("anime les cartes résultats avec stagger et reduced-motion", () => {
    expect(flights).toContain("staggerIndex");
    expect(flights).toContain("Math.min(staggerIndex, 10) * 0.045");
    expect(flights).toContain("premium-card-enter");
  });
});
