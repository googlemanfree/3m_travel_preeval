// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;
const state = vi.hoisted(() => ({ data: undefined as any, lastOptions: undefined as any }));
vi.mock("@/lib/trpc", () => ({
  trpc: { adminBilanAuto: { forCandidate: { useQuery: (_input: unknown, options: unknown) => { state.lastOptions = options; return { data: state.data }; } } } },
}));
import CandidateBilanAutoCard, { bilanTone } from "@/components/CandidateBilanAutoCard";

const row = (over: Record<string, unknown> = {}) => ({ id: 1, state: "ready_for_review", stateLabel: "Bilan prêt à valider", reviewStatus: "pending", score: 72, scoreMax: 100, thresholdReached: true, complementCount: 0, flagCount: 0, lastError: null, ...over });
afterEach(() => { cleanup(); state.data = undefined; });

describe("CandidateBilanAutoCard", () => {
  it("n'affiche rien quand le bilan automatisé est désactivé ou sans traitement", () => {
    state.data = { enabled: false, rows: [] };
    const { container, rerender } = render(<CandidateBilanAutoCard sessionToken="t" email="a@b.co" active />);
    expect(container.innerHTML).toBe("");
    state.data = { enabled: true, rows: [] };
    rerender(<CandidateBilanAutoCard sessionToken="t" email="a@b.co" active />);
    expect(container.innerHTML).toBe("");
  });

  it("ne lance la requête que lorsque l'onglet est actif", () => {
    render(<CandidateBilanAutoCard sessionToken="t" email="a@b.co" active={false} />);
    expect(state.lastOptions.enabled).toBe(false);
    cleanup();
    render(<CandidateBilanAutoCard sessionToken="t" email="a@b.co" active />);
    expect(state.lastOptions.enabled).toBe(true);
  });

  it("affiche l'état, la note et un lien vers la supervision filtrée sur l'e-mail", () => {
    state.data = { enabled: true, rows: [row({ flagCount: 2 })] };
    render(<CandidateBilanAutoCard sessionToken="t" email="awa+x@b.co" active />);
    expect(screen.getByText("Bilan prêt à valider")).toBeTruthy();
    expect(screen.getByText(/72\/100 · seuil atteint/)).toBeTruthy();
    expect(screen.getByText(/2 point\(s\) à vérifier/)).toBeTruthy();
    const link = screen.getByTestId("candidate360-bilan-auto-open") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/admin/bilans?q=awa%2Bx%40b.co");
    expect(link.textContent).toMatch(/Relire et valider/);
  });

  it("distingue visuellement prêt, incident, complément et publié", () => {
    expect(bilanTone({ state: "ready_for_review", reviewStatus: "pending" })).toMatch(/amber/);
    expect(bilanTone({ state: "failed", reviewStatus: "none" })).toMatch(/rose/);
    expect(bilanTone({ state: "needs_information", reviewStatus: "none" })).toMatch(/indigo/);
    expect(bilanTone({ state: "published", reviewStatus: "validated" })).toMatch(/emerald/);
  });
});
