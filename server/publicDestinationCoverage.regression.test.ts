import { describe, expect, it } from "vitest";
import {
  getPublicDestinationDetail,
  getPublicDestinationPath,
  PUBLIC_DESTINATION_DETAILS,
  PUBLIC_DESTINATION_PAGE_COUNT,
} from "../client/src/lib/publicDestinationCatalog";
import { composePublicPrerender } from "./publicPrerender";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const shell = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";

describe("couverture publique des 107 fiches de procédure", () => {
  it("conserve les 91 procédures documentées et les 16 fiches e-Visa dans un catalogue canonique unique", () => {
    expect(PUBLIC_DESTINATION_PAGE_COUNT).toBe(107);
    expect(PUBLIC_DESTINATION_DETAILS).toHaveLength(107);
    expect(new Set(PUBLIC_DESTINATION_DETAILS.map((detail) => detail.procedure.id)).size).toBe(107);
  });

  it("fournit à chaque destination un contenu de préparation exploitable et une route canonique", () => {
    for (const detail of PUBLIC_DESTINATION_DETAILS) {
      const { procedure } = detail;
      expect(procedure.description.trim().length).toBeGreaterThan(20);
      expect(procedure.detailedDescription.trim().length).toBeGreaterThan(20);
      expect(procedure.steps.length).toBeGreaterThan(0);
      expect(procedure.requiredDocuments.some((category) => category.documents.length > 0)).toBe(true);
      expect(getPublicDestinationPath(procedure.id)).toBe(`/procedures/${procedure.id}`);
    }
  });

  it("n’associe aux fiches que des guides correspondant au type de projet", () => {
    const canadaTravail = getPublicDestinationDetail("canada-travail");
    expect(canadaTravail?.sources.some((source) => source.category === "travail")).toBe(true);
    expect(canadaTravail?.sources.some((source) => source.category === "etudes")).toBe(false);
  });

  it("pré-rend les 107 routes avec un canonical .com, une description et un avertissement de vérification", () => {
    for (const detail of PUBLIC_DESTINATION_DETAILS) {
      const path = `/procedures/${detail.procedure.id}`;
      const rendered = composePublicPrerender(shell, path);
      expect(rendered.status).toBe(200);
      expect(rendered.noindex).toBe(false);
      expect(rendered.html).toContain(`<link rel="canonical" href="https://www.3mtravelagency.com${path}" />`);
      expect(rendered.html).toContain(`<meta property="og:url" content="https://www.3mtravelagency.com${path}" />`);
      expect(rendered.html).toContain("Étapes de préparation");
      expect(rendered.html).toContain("Documents à préparer");
      expect(rendered.html).toContain("Informations vérifiables avant toute démarche");
    }
  });

  it("charge directement la fiche pays publique plutôt que de la laisser dépendre d’un module différé", () => {
    const app = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
    expect(app).toContain('import CountryDetailPage from "./pages/CountryDetailPage"');
    expect(app).not.toContain('const CountryDetailPage = lazyWithTimeout');
  });
});
