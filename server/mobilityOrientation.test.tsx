// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GOALS, STATUSES, orient, type Answers } from "../shared/mobilityOrientation";

(globalThis as any).React = React;
vi.mock("@/lib/pageSeo", () => ({ setPageSeo: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/components/ServicePageShell", () => ({ ServicePageShell: ({ children, notice }: { children: React.ReactNode; notice?: string }) => <main><p data-testid="notice">{notice}</p>{children}</main> }));

import MobilityOrientationTool from "../client/src/pages/MobilityOrientationTool";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const answers = (over: Partial<Answers> = {}): Answers => ({ goal: "work", status: "searching", language: "basic", timeline: "months", funds: "partly", ...over });

afterEach(() => cleanup());

describe("orientation mobilité : logique", () => {
  it("donne une voie pour chaque objectif et chaque situation, sans jamais promettre un résultat", () => {
    for (const goal of GOALS) {
      for (const status of STATUSES) {
        const { route, steps } = orient(answers({ goal, status }));
        expect(route.title.length, `${goal}/${status}`).toBeGreaterThan(10);
        expect(steps.length).toBeGreaterThanOrEqual(4);
        expect(`${route.title} ${route.summary} ${steps.join(" ")}`).not.toMatch(/\b(?:garantie?s?|assurée?)\b|100 ?%|sans refus/i);
      }
    }
  });

  it("sans offre, ne laisse pas croire qu'un permis lié à un employeur est possible", () => {
    expect(orient(answers({ status: "searching" })).route.summary).toMatch(/aucun contrat n'est signé|aucun permis/i);
    expect(orient(answers({ status: "ready" })).route.title).toMatch(/employeur/);
  });

  it("signale la langue, les fonds et les délais, et met en garde contre les offres payantes", () => {
    const risky = orient(answers({ status: "none", language: "none", funds: "none", timeline: "soon" }));
    const text = risky.attention.join(" ");
    expect(text).toMatch(/langue/);
    expect(text).toMatch(/preuve de fonds/);
    expect(text).toMatch(/moins de 3 mois/);
    expect(text).toMatch(/ne facture pas le candidat/);
    expect(risky.readiness).toBe("early");
    expect(orient(answers({ status: "ready", language: "good", funds: "ready", timeline: "later" })).attention).toEqual([]);
    expect(orient(answers({ status: "ready", language: "good", funds: "ready" })).readiness).toBe("ready");
  });

  it("n'exige pas de fonds ni de langue pour un court séjour ou un regroupement familial", () => {
    expect(orient(answers({ goal: "visit", language: "none", timeline: "soon" })).attention.join(" ")).not.toMatch(/langue|moins de 3 mois/);
    expect(orient(answers({ goal: "family", funds: "none" })).attention.join(" ")).not.toMatch(/preuve de fonds/);
  });
});

describe("orientation mobilité : écran", () => {
  const pick = (label: RegExp) => fireEvent.click(screen.getByLabelText(label));

  it("pose les questions une à une, tactiles, puis affiche l'orientation et recommence", () => {
    render(<MobilityOrientationTool />);
    expect(screen.queryByTestId("orientation-result")).toBeNull();
    expect(screen.queryByText(/2\. Où en êtes-vous/)).toBeNull();
    pick(/Travailler à l'étranger/);
    pick(/Je cherche, j'ai des pistes/);
    pick(/Je me débrouille/);
    pick(/Dans 3 à 9 mois/);
    expect(screen.queryByTestId("orientation-result")).toBeNull();
    pick(/J'en ai une partie/);
    const result = screen.getByTestId("orientation-result");
    expect(result.textContent).toMatch(/Recherche d'emploi accompagnée/);
    expect(result.textContent).toMatch(/Points d'attention/);
    expect(result.querySelectorAll('a[href^="http"]').length).toBe(0);
    expect(screen.getByTestId("notice").textContent).toMatch(/ne garantit ni l'obtention d'un visa/);
    fireEvent.click(screen.getByText("Recommencer"));
    expect(screen.queryByTestId("orientation-result")).toBeNull();
  });

  it("changer d'objectif repose les questions suivantes et efface l'ancien résultat", () => {
    render(<MobilityOrientationTool />);
    pick(/Étudier à l'étranger/);
    expect(screen.getByLabelText(/J'ai une admission ou une lettre d'acceptation/)).toBeTruthy();
    pick(/Voyager ou rendre visite/);
    expect(screen.queryByLabelText(/J'ai une admission/)).toBeNull();
    expect(screen.getByLabelText(/J'ai une invitation ou un programme précis/)).toBeTruthy();
  });
});

describe("orientation mobilité : enregistrement de la page", () => {
  it("la route, le prérendu et le plan du site la connaissent", () => {
    expect(read("client/src/App.tsx")).toContain('path={"/outils/parcours-mobilite"} component={MobilityOrientationTool}');
    expect(read("server/publicPrerender.ts")).toContain('"/outils/parcours-mobilite": {');
    expect(read("client/src/pages/Sitemap.tsx")).toContain('href: "/outils/parcours-mobilite"');
  });

  it("les cibles tactiles font au moins 48 px de haut", () => {
    const page = read("client/src/pages/MobilityOrientationTool.tsx");
    expect(page).toContain("min-h-12");
  });
});
