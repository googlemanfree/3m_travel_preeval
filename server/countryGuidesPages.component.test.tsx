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
    { pathway: "work", summary: "Permis lié à un employeur.", verifiedAt: "2026-10-27T00:00:00.000Z", programs: [{ officialName: "Employer-specific work permit", nameFr: "Permis de travail lié à un employeur", legalBasis: null, routeType: "employer", offerRequired: "yes", sponsorLicenceRequired: true, labourMarketTest: null, renewable: true, familyAllowed: null, salaryNote: null, durationNote: "Durée liée au contrat", feesNote: null, processingNote: null, residencePathNote: null, steps: [{ stepNo: 1, actor: "employer", title: "Déposer l'EIMT", description: null, documents: ["Offre d'emploi"], delayNote: "Quelques semaines", feeNote: "Frais indicatifs" }] }] },
    { pathway: "study", summary: "Permis d'études.", verifiedAt: null, programs: [] },
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
    expect(screen.getByText(/Délai : Quelques semaines/)).toBeTruthy();
    expect(screen.getByText(/Frais : Frais indicatifs/)).toBeTruthy();
    expect(screen.getByText("Employeur agréé exigé")).toBeTruthy();
    // Aucun lien sortant : la suite se lance avec l'agence.
    expect(document.querySelectorAll('a[href^="http"]').length).toBe(0);
    expect(screen.getByRole("link", { name: /Évaluer mon profil gratuitement/ }).getAttribute("href")).toContain("#evaluation-multi");
    expect(screen.getByText(/Repères vérifiés le/)).toBeTruthy();
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
