// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;
const state = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock("@/lib/trpc", () => ({ trpc: { evaluationValidation: { myDocumentChecklist: { useQuery: () => ({ data: { items: state.items } }) } } } }));
import DocumentChecklistCard from "@/components/DocumentChecklistCard";

afterEach(cleanup);

describe("liste des pièces côté candidat", () => {
  it("n'affiche rien sans liste", () => {
    state.items = [];
    const { container } = render(<DocumentChecklistCard evaluationId={1} />);
    expect(container.innerHTML).toBe("");
  });
  it("affiche chaque pièce avec son statut et la raison à corriger, sans jamais promettre une authenticité", () => {
    state.items = [
      { id: "passeport", label: "Passeport en cours de validité", required: true, status: "a_mettre_a_jour", reason: "Expiré depuis le 2026-10-01" },
      { id: "cv", label: "CV à jour", required: true, status: "lisible", reason: null },
      { id: "langue", label: "Résultat de test de langue", required: false, status: "a_fournir", reason: null },
    ];
    render(<DocumentChecklistCard evaluationId={1} />);
    const list = screen.getByTestId("document-checklist");
    expect(list.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText("Expiré depuis le 2026-10-01")).toBeTruthy();
    expect(screen.getByText("À mettre à jour")).toBeTruthy();
    expect(screen.getByText("Résultat de test de langue (facultatif)")).toBeTruthy();
    expect(list.textContent).toMatch(/seule l'agence peut le marquer « vérifié »/);
    expect(list.textContent).not.toMatch(/authentique(?! )|garant/i);
  });
});
