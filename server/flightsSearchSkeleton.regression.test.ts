import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sections = readFileSync(resolve(root, "client/src/components/FlightDiscoverySections.tsx"), "utf8");
const flights = readFileSync(resolve(root, "client/src/pages/Flights.tsx"), "utf8");
const css = readFileSync(resolve(root, "client/src/index.css"), "utf8");

describe("skeleton de recherche /flights — sans tarifs inventés", () => {
  it("exporte FlightSearchSkeleton avec status ARIA et testid", () => {
    expect(sections).toContain("export function FlightSearchSkeleton");
    expect(sections).toContain('data-testid="flight-search-skeleton"');
    expect(sections).toContain('role="status"');
    expect(sections).toContain('aria-busy="true"');
    expect(sections).toContain("Recherche de vols en cours");
  });

  it("affiche des cartes fantômes et une barre de progression, sans montant", () => {
    const block = sections.slice(sections.indexOf("function FlightSkeletonCard"));
    const skeletonOnly = block.slice(0, block.indexOf("export function FlightPopularRoutes"));
    expect(skeletonOnly).toContain("FlightSkeletonCard");
    expect(skeletonOnly).toContain('role="progressbar"');
    expect(skeletonOnly).toContain("flight-skeleton-progress");
    expect(skeletonOnly).toContain("aucun prix de vitrine");
    expect(skeletonOnly).not.toContain("FCFA");
    expect(skeletonOnly).not.toContain("à partir de");
    expect(skeletonOnly).not.toContain("€");
  });

  it("remplace le spinner de chargement par le skeleton sur /flights", () => {
    expect(flights).toContain("FlightSearchSkeleton");
    expect(flights).toContain("<FlightSearchSkeleton routeLabel=");
    expect(flights).not.toContain("Recherche en temps réel...");
    expect(flights).not.toContain("border-t-[#2563EB] rounded-full animate-spin");
  });

  it("définit le keyframe CSS et respecte prefers-reduced-motion", () => {
    expect(css).toContain("@keyframes flight-skeleton-slide");
    expect(css).toContain(".flight-skeleton-progress");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
