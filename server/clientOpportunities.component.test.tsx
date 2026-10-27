// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ guide: { data: null as any, isLoading: false }, enabled: [] as boolean[] }));
vi.mock("@/lib/trpc", () => ({
  trpc: { countryCatalog: { guide: { useQuery: (_input: unknown, options: { enabled: boolean }) => { state.enabled.push(options.enabled); return state.guide; } } } },
}));

import { ClientOpportunities } from "@/components/ClientOpportunities";
import { guideSlugForDestinationName } from "../shared/countryGuides";

const guide = {
  pathways: [
    { pathway: "work", summary: "Permis lié à un employeur.", checkedAt: "2026-10-27T00:00:00.000Z", sources: [], programs: [{ officialName: "Work permit", nameFr: "Permis de travail", routeType: "employer", offerRequired: "yes", steps: [] }] },
    { pathway: "visit", summary: "Visa de visiteur ou AVE.", checkedAt: null, sources: [], programs: [{ officialName: "Visitor visa", nameFr: null, routeType: null, offerRequired: null, steps: [] }] },
  ],
};

afterEach(() => { cleanup(); state.guide = { data: null, isLoading: false }; state.enabled = []; });

describe("opportunités de l'espace client selon le visa choisi", () => {
  it("reconnaît un pays saisi librement", () => {
    expect(guideSlugForDestinationName("Allemagne")).toBe("allemagne");
    expect(guideSlugForDestinationName("  CÔTE D'IVOIRE ")).toBe("cote-divoire");
    expect(guideSlugForDestinationName("europe")).toBeNull();
    expect(guideSlugForDestinationName(null)).toBeNull();
  });

  it("n'affiche rien sans pays précis ni projet reconnu, et n'interroge pas le serveur", () => {
    const { container } = render(<ClientOpportunities destination="europe" projectType="travail" />);
    expect(container.firstChild).toBeNull();
    cleanup();
    const second = render(<ClientOpportunities destination="Canada" projectType="autre chose" />);
    expect(second.container.firstChild).toBeNull();
    expect(state.enabled.every((value) => value === false)).toBe(true);
  });

  it("visa travail : montre les dispositifs du guide publié et renvoie vers les étapes", () => {
    state.guide = { data: guide, isLoading: false };
    render(<ClientOpportunities destination="Canada" projectType="travail" />);
    expect(screen.getByText("Votre projet de travail")).toBeTruthy();
    expect(screen.getByText("Permis de travail")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Voir les étapes et les sources/ }).getAttribute("href")).toBe("/pays/canada");
  });

  it("visa visiteur : montre le parcours visiteur, pas le travail", () => {
    state.guide = { data: guide, isLoading: false };
    render(<ClientOpportunities destination="Canada" visaType="schengen_tourisme" />);
    expect(screen.getByText("Visa de visiteur ou AVE.")).toBeTruthy();
    expect(screen.queryByText("Permis lié à un employeur.")).toBeNull();
  });

  it("sans guide publié pour le parcours : dit la vérité et oriente vers les pages existantes", () => {
    state.guide = { data: { pathways: [guide.pathways[0]] }, isLoading: false };
    render(<ClientOpportunities destination="Canada" projectType="etudes" />);
    expect(screen.getByTestId("client-opportunities-pending").textContent).toMatch(/en cours de vérification/);
    expect(screen.getByRole("link", { name: "Ressources Canada" }).getAttribute("href")).toBe("/ressources/canada");
  });

  it("est branché sur l'aperçu de l'espace client", () => {
    const space = readFileSync(resolve(__dirname, "..", "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(space).toContain("<ClientOpportunities destination={primaryDestination}");
  });
});
