// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  matrix: { data: [] as any[], error: null as null | { message: string } },
  detail: { data: undefined as any, error: null as null | { message: string }, isLoading: false, refetch: vi.fn() },
  seed: vi.fn(),
  savePathway: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ countryCatalog: { adminMatrix: { invalidate: vi.fn() }, adminCountry: { invalidate: vi.fn() } } }),
    countryCatalog: {
      adminMatrix: { useQuery: () => state.matrix },
      adminCountry: { useQuery: () => state.detail },
      adminSeed: { useMutation: () => ({ mutate: state.seed, isPending: false }) },
      adminImportDrafts: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSavePathway: { useMutation: () => ({ mutate: state.savePathway, isPending: false }) },
      adminSaveProgram: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminDeleteProgram: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSaveSource: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminDeleteSource: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminSaveStep: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminDeleteStep: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AdminCountryCatalog } from "@/components/AdminCountryCatalog";

const row = (countryCode: string, pathway: "work" | "study" | "visit", status = "needs_review") => ({ countryCode, pathway, coverage: "named", status, checkedAt: null, programCount: 1, sourceCount: 0, verifiedSourceCount: 0 });

afterEach(() => {
  cleanup();
  state.matrix = { data: [], error: null };
  state.detail = { data: undefined, error: null, isLoading: false, refetch: vi.fn() };
  state.seed.mockReset();
  state.savePathway.mockReset();
});

describe("catalogue des parcours côté administration", () => {
  it("propose d'initialiser les 196 pays quand le catalogue est vide", () => {
    render(<AdminCountryCatalog sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("button", { name: /Initialiser les 196 pays/ }));
    expect(state.seed).toHaveBeenCalledWith({ sessionToken: "t".repeat(30) });
    expect(screen.getByText("0 fiches sur 588")).toBeTruthy();
  });

  it("liste les 196 pays avec leur statut « À confirmer » et filtre par nom", () => {
    state.matrix = { data: [row("CA", "work"), row("CA", "study"), row("CA", "visit", "published")], error: null };
    render(<AdminCountryCatalog sessionToken={"t".repeat(30)} />);
    expect(screen.getAllByRole("button", { name: /^Ouvrir la fiche / }).length).toBe(196);
    expect(screen.getAllByText("À confirmer").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Compléter le catalogue/ })).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Nom ou code"), { target: { value: "canada" } });
    expect(screen.getAllByRole("button", { name: /^Ouvrir la fiche / }).length).toBe(1);
  });

  it("ouvre la fiche d'un pays, explique qu'une source est nécessaire et envoie la fiche à enregistrer", () => {
    state.matrix = { data: [row("CA", "work")], error: null };
    state.detail = {
      data: {
        countryCode: "CA",
        pathways: [{ pathway: "work", coverage: "named", summary: "Résumé", status: "needs_review", checkedAt: null }],
        programs: [{ id: 1, countryCode: "CA", pathway: "work", officialName: "Permis lié à un employeur", nameFr: null, programRef: null, legalBasis: null, routeType: "employer", offerRequired: "yes", sponsorLicenceRequired: null, labourMarketTest: null, salaryNote: null, durationNote: null, renewable: null, familyAllowed: null, residencePathNote: null, feesNote: null, processingNote: null, status: "needs_review", checkedAt: null }],
        sources: [],
        steps: [],
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    };
    render(<AdminCountryCatalog sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la fiche Canada" }));
    const detail = screen.getByTestId("admin-country-catalog-detail");
    expect(within(detail).getByText("Permis lié à un employeur")).toBeTruthy();
    expect(within(detail).getByText(/Aucune source : la fiche ne peut pas être publiée/)).toBeTruthy();
    expect(within(detail).getByText(/Aucune source enregistrée/)).toBeTruthy();
    fireEvent.click(within(detail).getByRole("button", { name: /Enregistrer la fiche/ }));
    expect(state.savePathway).toHaveBeenCalledWith(expect.objectContaining({ countryCode: "CA", pathway: "work", status: "needs_review", markChecked: false }));
  });

  it("côté administration, toutes les sources du pays sont listées avec leur adresse, tous parcours confondus", () => {
    state.matrix = { data: [row("CA", "work")], error: null };
    const source = (id: number, pathway: string, url: string, status = "verified") => ({ id, countryCode: "CA", pathway, label: `Page ${id}`, url, authority: "immigration", status, note: null, checkedAt: "2026-10-27T00:00:00.000Z", checkedByAdminId: 1, checkedByLabel: "admin" });
    state.detail = {
      data: { countryCode: "CA", pathways: [{ pathway: "work", coverage: "named", summary: null, status: "needs_review", checkedAt: null }], programs: [], sources: [source(1, "work", "https://www.canada.ca/travail"), source(2, "study", "https://www.canada.ca/etudes", "needs_review"), source(3, "visit", "https://www.canada.ca/visiteur")], steps: [] },
      error: null, isLoading: false, refetch: vi.fn(),
    };
    render(<AdminCountryCatalog sessionToken={"t".repeat(30)} />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir la fiche Canada" }));
    const all = screen.getByTestId("admin-country-all-sources");
    expect(all.textContent).toMatch(/Toutes les sources officielles de ce pays \(3\)/);
    for (const url of ["https://www.canada.ca/travail", "https://www.canada.ca/etudes", "https://www.canada.ca/visiteur"]) expect(within(all).getByRole("link", { name: url })).toBeTruthy();
    expect(all.textContent).toMatch(/visibles uniquement ici/);
  });

  it("affiche le message du serveur quand la migration n'est pas appliquée", () => {
    state.matrix = { data: [], error: { message: "Le catalogue des parcours n'est pas encore activé : la migration 0087 doit être appliquée." } };
    render(<AdminCountryCatalog sessionToken={"t".repeat(30)} />);
    expect(screen.getByRole("alert").textContent).toMatch(/migration 0087/);
  });
});
