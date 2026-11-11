// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import PanelErrorBoundary from "@/components/PanelErrorBoundary";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error("Objects are not valid as a React child");
  return <p>contenu sain</p>;
}

afterEach(() => cleanup());

describe("garde-fou d'un panneau d'administration", () => {
  it("affiche l'erreur réelle et laisse le reste de la page intacte", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <div>
        <nav>navigation</nav>
        <PanelErrorBoundary label="fiche candidat">
          <Bomb explode />
        </PanelErrorBoundary>
      </div>,
    );
    expect(screen.getByText("navigation")).toBeTruthy();
    expect(screen.getByTestId("panel-error-boundary").textContent).toContain("fiche candidat");
    expect(screen.getByTestId("panel-error-message").textContent).toContain("Objects are not valid as a React child");
  });

  it("« Réessayer » relance le panneau quand la cause a disparu", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let explode = true;
    const Toggle = () => <Bomb explode={explode} />;
    render(
      <PanelErrorBoundary label="fiche candidat">
        <Toggle />
      </PanelErrorBoundary>,
    );
    expect(screen.getByTestId("panel-error-boundary")).toBeTruthy();
    explode = false;
    fireEvent.click(screen.getByText("Réessayer ce panneau"));
    expect(screen.getByText("contenu sain")).toBeTruthy();
  });

  it("change de candidat : le panneau repart seul (resetKey)", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <PanelErrorBoundary label="fiche candidat" resetKey="a">
        <Bomb explode />
      </PanelErrorBoundary>,
    );
    expect(screen.getByTestId("panel-error-boundary")).toBeTruthy();
    rerender(
      <PanelErrorBoundary label="fiche candidat" resetKey="b">
        <Bomb explode={false} />
      </PanelErrorBoundary>,
    );
    expect(screen.getByText("contenu sain")).toBeTruthy();
  });

  it("la fiche candidat de l'administration est enveloppée par ce garde-fou", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx").replace(/\s+/g, " ");
    expect(dashboard).toContain('<PanelErrorBoundary label="fiche candidat"');
    expect(dashboard).toMatch(/<\/Candidate360Workspace>|onTabChange=\{setCandidate360Tab\} \/> <\/PanelErrorBoundary>/);
  });
});
