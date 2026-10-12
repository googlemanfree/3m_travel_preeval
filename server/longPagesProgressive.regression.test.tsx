// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// Les pages s'appuient sur le runtime JSX automatique de Vite : sous vitest, React doit être global avant leur import.
(globalThis as { React?: typeof React }).React = React;

vi.mock("@/lib/trpc", () => ({ trpc: new Proxy({}, { get: () => new Proxy({}, { get: () => ({ useQuery: () => ({ data: undefined, isLoading: false }), useMutation: () => ({ mutate: () => undefined, isPending: false }) }) }) }) }));

// Le rendu de 107 destinations est lent sous jsdom : marge large, indépendante de la configuration globale.
vi.setConfig({ testTimeout: 120000 });

afterEach(() => cleanup());

describe("/procedures : affichage progressif", () => {
  const cards = () => screen.queryAllByTestId("procedure-card");

  it("18 destinations d'abord, 18 de plus à chaque clic, le bouton disparaît quand tout est affiché", async () => {
    const Procedures = (await import("../client/src/pages/ProceduresAdvanced")).default;
    render(<Procedures />);
    expect(cards()).toHaveLength(18);
    expect(screen.getByTestId("procedures-show-more").textContent).toMatch(/restantes/);
    fireEvent.click(screen.getByTestId("procedures-show-more"));
    expect(cards()).toHaveLength(36);
    for (let i = 0; i < 20 && screen.queryByTestId("procedures-show-more"); i++) fireEvent.click(screen.getByTestId("procedures-show-more"));
    expect(screen.queryByTestId("procedures-show-more")).toBeNull();
    expect(cards().length).toBeGreaterThan(100);
  });

  it("une recherche revient à la première page et trouve des destinations non affichées au départ", async () => {
    const Procedures = (await import("../client/src/pages/ProceduresAdvanced")).default;
    render(<Procedures />);
    fireEvent.click(screen.getByTestId("procedures-show-more"));
    expect(cards()).toHaveLength(36);
    fireEvent.change(screen.getByPlaceholderText(/Rechercher un pays, une région/), { target: { value: "Canada" } });
    // (les cartes sortantes restent un instant dans le DOM sous jsdom : on vérifie le compteur et l'absence du bouton)
    const found = Number((screen.getByText(/destinations? trouvée/).textContent || "").match(/\d+/)?.[0]);
    expect(found).toBeGreaterThan(0);
    expect(found).toBeLessThan(18);
    expect(screen.queryByTestId("procedures-show-more")).toBeNull();
  });
});

describe("/guide-procedures : liste abrégée par catégorie", () => {
  const resources = () => screen.queryAllByTestId(/^guide-resource-/);
  const showAllButtons = () => screen.queryAllByTestId(/^guide-show-all-/);

  it("6 ressources par catégorie au départ ; « Afficher les autres » ouvre la catégorie", async () => {
    const Guide = (await import("../client/src/pages/ProcedureResourceGuide")).default;
    render(<Guide />);
    const before = resources().length;
    const buttons = showAllButtons();
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(resources().length).toBeGreaterThan(before);
    expect(showAllButtons().length).toBe(buttons.length - 1);
  });

  it("une recherche montre tous les résultats, sans bouton « Afficher les autres »", async () => {
    const Guide = (await import("../client/src/pages/ProcedureResourceGuide")).default;
    render(<Guide />);
    const search = screen.getByPlaceholderText(/Rechercher un pays, un visa ou un guide PDF/);
    fireEvent.change(search, { target: { value: "visa" } });
    expect(showAllButtons()).toHaveLength(0);
    expect(resources().length).toBeGreaterThan(0);
  });
});
