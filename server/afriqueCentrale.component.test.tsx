// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import AfriqueCentrale from "@/pages/AfriqueCentrale";
import { CENTRAL_AFRICA_COMMITMENTS, CENTRAL_AFRICA_DESTINATIONS, CENTRAL_AFRICA_FAQ, CENTRAL_AFRICA_STEPS } from "@/data/afriqueCentrale";
import { SITE_UPDATES } from "@/data/siteUpdates";
import { PUBLIC_PAGES, composePublicPrerender, getIndexablePublicPaths } from "./publicPrerender";

afterEach(cleanup);

describe("page Afrique centrale", () => {
  it("présente les engagements, les étapes, les pièces, les destinations et la FAQ", () => {
    render(<AfriqueCentrale />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Afrique centrale");
    expect(within(screen.getByTestId("central-africa-commitments")).getAllByRole("article")).toHaveLength(CENTRAL_AFRICA_COMMITMENTS.length);
    expect(within(screen.getByTestId("central-africa-steps")).getAllByRole("listitem")).toHaveLength(CENTRAL_AFRICA_STEPS.length);
    expect(screen.getByTestId("central-africa-documents").children.length).toBeGreaterThanOrEqual(6);
    expect(within(screen.getByTestId("central-africa-destinations")).getAllByRole("link")).toHaveLength(CENTRAL_AFRICA_DESTINATIONS.length);
    expect(screen.getByTestId("central-africa-faq").querySelectorAll("details")).toHaveLength(CENTRAL_AFRICA_FAQ.length);
  });

  it("ne promet aucun résultat et n'annonce aucun chiffre ni délai non vérifié", () => {
    const { container } = render(<AfriqueCentrale />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Aucun résultat n’est garanti/);
    expect(text).not.toMatch(/\b\d{2,}\s?%|\b\d+\s?(jours|semaines|mois)\b|garantit\b(?! pas)|taux de réussite/i);
  });

  it("tous les liens internes pointent vers des pages publiques existantes", () => {
    const known = new Set(getIndexablePublicPaths());
    const links = [...CENTRAL_AFRICA_COMMITMENTS, ...CENTRAL_AFRICA_STEPS, ...CENTRAL_AFRICA_DESTINATIONS].map((item) => item.href.split("#")[0]);
    for (const href of links) expect(known.has(href), `lien interne inconnu : ${href}`).toBe(true);
  });

  it("est pré-rendue et indexable pour les moteurs de recherche", () => {
    expect(PUBLIC_PAGES["/afrique-centrale"]?.title).toContain("Afrique centrale");
    expect(getIndexablePublicPaths()).toContain("/afrique-centrale");
    const rendered = composePublicPrerender('<html><head><title>x</title></head><body><div id="root"></div></body></html>', "/afrique-centrale");
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(false);
    expect(rendered.html).toContain("Afrique centrale");
  });
});

describe("Quoi de neuf : mises à jour éditoriales", () => {
  it("chaque mise à jour est datée, renvoie vers une page existante et ne promet rien", () => {
    const known = new Set(getIndexablePublicPaths());
    expect(SITE_UPDATES.length).toBeGreaterThanOrEqual(3);
    for (const update of SITE_UPDATES) {
      expect(update.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(known.has(update.pagePath.split("#")[0]), update.pagePath).toBe(true);
      expect(update.summary).not.toMatch(/garanti(?!e? pas)/i);
    }
    expect(new Set(SITE_UPDATES.map((update) => update.id)).size).toBe(SITE_UPDATES.length);
  });
});
