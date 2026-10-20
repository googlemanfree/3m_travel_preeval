// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ calls: [] as Array<Record<string, unknown>> }));
const overview = {
  scanned: 4, dynamicCount: 3, legacyCount: 1, averageCompleteness: 62, flaggedCount: 2, incompleteCount: 1, matching: 1,
  byCountry: [{ key: "Allemagne", label: "Allemagne", count: 2 }, { key: "Canada", label: "Canada", count: 1 }],
  byProgram: [{ key: "study_vocational", label: "Formation professionnelle ou apprentissage", count: 1 }],
  byDomain: [{ key: "sante", label: "Santé et soins", count: 1 }],
  items: [{ id: 1, reference: "3M-EV-1", fullName: "Awa Test", status: "pending", createdAt: "2026-10-20", country: "Allemagne", projectType: "etudes", programLabel: "Formation professionnelle ou apprentissage", domainLabel: "Santé et soins", completeness: 60, missingRequired: 2, flags: ["Formation déclarée rémunérée par l’employeur, mais sans contrat ni promesse : à clarifier."], firstAction: "Identifier avec le candidat un employeur ou un établissement formateur." }],
};

vi.mock("@/lib/trpc", () => ({
  trpc: { evaluationJourneys: { adminOverview: { useQuery: (input: Record<string, unknown>) => { state.calls.push(input); return { data: overview, error: null, isLoading: false }; } } } },
}));

import { AdminEvaluationJourneyBoard } from "@/components/AdminEvaluationJourneyBoard";

beforeEach(() => { state.calls = []; });
afterEach(() => cleanup());

describe("tableau de pilotage des évaluations par parcours", () => {
  it("affiche les indicateurs, les répartitions et les dossiers avec leurs points à clarifier", () => {
    render(<AdminEvaluationJourneyBoard sessionToken={"a".repeat(30)} />);
    expect(screen.getByTestId("journey-kpis").textContent).toMatch(/62 %/);
    expect(screen.getByRole("region", { name: "Par pays" }).textContent).toMatch(/Allemagne/);
    const item = screen.getByTestId("journey-items").textContent ?? "";
    expect(item).toMatch(/Awa Test/);
    expect(item).toMatch(/Santé et soins/);
    expect(item).toMatch(/2 obligatoire\(s\) manquante\(s\)/);
    expect(item).toMatch(/sans contrat ni promesse/);
    expect(item).toMatch(/À suivre : Identifier avec le candidat/);
  });

  it("un clic sur une ligne ou une case filtre la requête, et un second clic retire le filtre", () => {
    render(<AdminEvaluationJourneyBoard sessionToken={"a".repeat(30)} />);
    fireEvent.click(screen.getByRole("button", { name: /Allemagne/ }));
    expect(state.calls[state.calls.length - 1]).toMatchObject({ country: "Allemagne" });
    fireEvent.click(screen.getByRole("button", { name: /Santé et soins/ }));
    expect(state.calls[state.calls.length - 1]).toMatchObject({ country: "Allemagne", domainId: "sante" });
    fireEvent.click(screen.getByLabelText(/Avec points à clarifier/));
    expect(state.calls[state.calls.length - 1]).toMatchObject({ flaggedOnly: true });
    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser les filtres" }));
    expect(state.calls[state.calls.length - 1]).toMatchObject({ country: undefined, domainId: undefined, flaggedOnly: undefined });
  });
});
