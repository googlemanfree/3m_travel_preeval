// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  list: { data: [] as any[], isLoading: false },
  guide: { data: null as any, isLoading: false },
  slug: "canada",
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { countryCatalog: { guideList: { useQuery: () => state.list }, guide: { useQuery: () => state.guide } } },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useRoute: () => [true, { slug: state.slug }] };
});
vi.mock("@/components/ServicePageShell", () => ({
  ServicePageShell: ({ title, children }: { title: string; children: React.ReactNode }) => <main><h1>{title}</h1>{children}</main>,
}));
vi.mock("@/lib/pageSeo", () => ({ setPageSeo: vi.fn() }));
vi.mock("@/pages/NotFound", () => ({ default: () => <p>Page introuvable</p> }));
vi.mock("./NotFound", () => ({ default: () => <p>Page introuvable</p> }));

import CountryGuides from "@/pages/CountryGuides";
import CountryGuide from "@/pages/CountryGuide";

const guide = {
  code: "CA", name: "Canada", slug: "canada", updatedAt: "2026-10-27T00:00:00.000Z",
  pathways: [
    { pathway: "work", summary: "Permis lié à un employeur.", checkedAt: "2026-10-27T00:00:00.000Z", sources: [{ label: "Page officielle IRCC", url: "https://www.canada.ca/exemple", authority: "immigration", checkedAt: "2026-10-27T00:00:00.000Z" }], programs: [{ officialName: "Employer-specific work permit", nameFr: "Permis de travail lié à un employeur", routeType: "employer", offerRequired: "yes", salaryNote: null, durationNote: null, feesNote: null, processingNote: null, residencePathNote: null, steps: [{ stepNo: 1, actor: "employer", title: "Déposer l'EIMT", description: null, documents: ["Offre d'emploi"], delayNote: null, feeNote: null, officialUrl: null }] }] },
    { pathway: "study", summary: "Permis d'études.", checkedAt: null, sources: [], programs: [] },
  ],
};

afterEach(() => {
  cleanup();
  state.list = { data: [], isLoading: false };
  state.guide = { data: null, isLoading: false };
  state.slug = "canada";
});

describe("guides par pays côté public", () => {
  it("annonce honnêtement qu'aucun guide n'est encore publié", () => {
    render(<CountryGuides />);
    expect(screen.getByTestId("country-guides-empty").textContent).toMatch(/en cours de vérification/);
    expect(screen.queryByPlaceholderText("Chercher un pays")).toBeNull();
  });

  it("liste les guides publiés et filtre par nom", () => {
    state.list = { data: [{ code: "CA", name: "Canada", slug: "canada", pathways: ["work", "study"], updatedAt: guide.updatedAt }, { code: "DE", name: "Allemagne", slug: "allemagne", pathways: ["work"], updatedAt: null }], isLoading: false };
    render(<CountryGuides />);
    expect(screen.getByTestId("country-guide-card-canada").getAttribute("href")).toBe("/pays/canada");
    fireEvent.change(screen.getByPlaceholderText("Chercher un pays"), { target: { value: "alle" } });
    expect(screen.queryByTestId("country-guide-card-canada")).toBeNull();
    expect(screen.getByTestId("country-guide-card-allemagne")).toBeTruthy();
  });

  it("affiche un guide publié avec ses étapes, ses sources et la date de vérification", () => {
    state.guide = { data: guide, isLoading: false };
    render(<CountryGuide />);
    expect(screen.getByText("Permis de travail lié à un employeur")).toBeTruthy();
    expect(screen.getByText(/Déposer l'EIMT/)).toBeTruthy();
    expect(screen.getByText(/Offre d'emploi/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Page officielle IRCC/ }).getAttribute("href")).toBe("https://www.canada.ca/exemple");
    expect(screen.getByText(/vérifié le/)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Études" }));
    expect(screen.getByText("Permis d'études.")).toBeTruthy();
  });

  it("un pays sans fiche publiée affiche « en cours de vérification » et un nom inconnu « introuvable »", () => {
    render(<CountryGuide />);
    expect(screen.getByTestId("country-guide-pending").textContent).toMatch(/en cours de vérification/);
    cleanup();
    state.slug = "narnia";
    render(<CountryGuide />);
    expect(screen.getByText("Page introuvable")).toBeTruthy();
  });
});
