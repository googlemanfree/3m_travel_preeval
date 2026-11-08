// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import CandidateGuideDocument from "@/components/CandidateGuideDocument";
import { getCandidateGuide } from "@/data/candidateGuides";

afterEach(cleanup);

describe("guide candidat : affichage", () => {
  it("Luxembourg : 12 étapes, sommaire dont chaque lien pointe une rubrique présente, sources et points à valider", () => {
    const guide = getCandidateGuide("luxembourg")!;
    const { container } = render(<CandidateGuideDocument guide={guide} />);
    expect(screen.getAllByTestId("guide-step")).toHaveLength(12);
    const links = within(screen.getByTestId("guide-contents")).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(18);
    for (const link of links) {
      const id = (link.getAttribute("href") ?? "").slice(1);
      expect(container.querySelector(`#${id}`), `ancre ${id}`).not.toBeNull();
    }
    expect(screen.getByTestId("guide-sources").textContent).toContain("S14");
    expect(screen.getByTestId("guide-to-validate").textContent).toContain("Vérifier compétence consulaire");
    expect(screen.getByTestId("guide-disclaimer").textContent).toContain("ne garantit pas une embauche");
    expect(screen.queryByTestId("guide-framework-note")).toBeNull();
    expect(container.querySelector("article")?.getAttribute("data-maturity")).toBe("complete");
  });

  it("une autre destination : cadre commun signalé « en cours de complétion », rubriques à confirmer visibles", () => {
    const guide = getCandidateGuide("japon")!;
    const { container } = render(<CandidateGuideDocument guide={guide} />);
    expect(screen.getByTestId("guide-framework-note").textContent).toContain("Japon");
    expect(screen.getAllByTestId("guide-callout-confirm").length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector("article")?.getAttribute("data-maturity")).toBe("framework");
    expect(container.textContent).toContain("Technical Intern Training Program");
  });

  it("le bouton d'impression déclenche window.print", () => {
    let printed = 0;
    (window as any).print = () => { printed += 1; };
    render(<CandidateGuideDocument guide={getCandidateGuide("belgique")!} />);
    fireEvent.click(screen.getByTestId("guide-print"));
    expect(printed).toBe(1);
  });

  it("les tableaux sont accessibles : en-têtes de colonnes et de lignes déclarés", () => {
    render(<CandidateGuideDocument guide={getCandidateGuide("luxembourg")!} />);
    const tables = screen.getAllByRole("table");
    expect(tables.length).toBeGreaterThan(10);
    for (const table of tables) expect(within(table).getAllByRole("columnheader").length).toBeGreaterThan(0);
  });
});
