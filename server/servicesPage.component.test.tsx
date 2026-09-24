// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/components/SocialShareButtons", () => ({ SocialShareButtons: () => null }));

import Services from "@/pages/Services";
import QuickActionsSection from "@/components/QuickActionsSection";
import { ALL_CATALOG_HREFS, HOW_IT_WORKS, QUICK_ACTIONS, SERVICE_POLES } from "@/data/serviceCatalog";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const app = read("client/src/App.tsx");
const pathOf = (href: string) => href.split("#")[0].split("?")[0];

afterEach(cleanup);

describe("catalogue des services", () => {
  it("couvre les trois pôles et les services demandés, sans doublon", () => {
    expect(SERVICE_POLES.map((pole) => pole.id)).toEqual(["mobilite", "travel", "services"]);
    expect(SERVICE_POLES.map((pole) => pole.services.length)).toEqual([5, 4, 5]);
    const titles = SERVICE_POLES.flatMap((pole) => pole.services.map((service) => service.title));
    for (const expected of ["Études", "Travail", "Immigration", "Visas", "Regroupement familial", "Billets d’avion", "Hôtels", "Location de véhicules", "Assurance voyage", "CNI & passeport", "e-Visa Cameroun", "Technologies", "Formations", "Solutions de sécurité"]) {
      expect(titles, expected).toContain(expected);
    }
    const ids = SERVICE_POLES.flatMap((pole) => pole.services.map((service) => service.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(QUICK_ACTIONS).toHaveLength(8);
    expect(new Set(QUICK_ACTIONS.map((action) => action.id)).size).toBe(8);
  });

  it("chaque lien du catalogue mène à une route déclarée (jamais une page inexistante)", () => {
    for (const href of ALL_CATALOG_HREFS) {
      const path = pathOf(href);
      const declared = path === "/" || app.includes(`path="${path}"`) || app.includes(`path={"${path}"}`);
      expect(declared, href).toBe(true);
    }
  });

  it("n'annonce ni prix, ni pourcentage, ni délai chiffré, ni résultat garanti", () => {
    const texts = [
      ...SERVICE_POLES.flatMap((pole) => [pole.tagline, ...pole.services.map((service) => service.description)]),
      ...QUICK_ACTIONS.flatMap((action) => [action.title, action.hint]),
      ...HOW_IT_WORKS.flatMap((step) => [step.title, step.text]),
    ];
    for (const text of texts) {
      expect(text, text).not.toMatch(/\d+\s?(%|€|\$|FCFA|F CFA|h\b|heures?|jours?)/i);
      expect(text, text).not.toMatch(/garanti(?!r)|100\s?%|sans risque|assur[ée]s? de réussir/i);
    }
  });
});

describe("page /services", () => {
  it("affiche les trois pôles avec leurs services, chacun relié à sa page", () => {
    render(<Services />);
    for (const pole of SERVICE_POLES) {
      const list = screen.getByTestId(`pole-${pole.id}`);
      expect(list.id).toBe(pole.id); // ancre utilisée par les repères du hero
      const links = within(list).getAllByRole("link");
      expect(links).toHaveLength(pole.services.length);
      pole.services.forEach((service, index) => {
        expect(links[index].getAttribute("href")).toBe(service.href);
        expect(within(links[index]).getByText(service.title)).toBeTruthy();
      });
    }
  });

  it("propose « Que voulez-vous faire ? », la méthode en 3 étapes et un contact direct", () => {
    render(<Services />);
    expect(screen.getAllByText("Que voulez-vous faire ?").length).toBeGreaterThan(0);
    expect(within(screen.getByTestId("quick-actions")).getAllByRole("link")).toHaveLength(8);
    HOW_IT_WORKS.forEach((step) => expect(screen.getByText(step.title)).toBeTruthy());
    expect(screen.getAllByRole("link", { name: /Prendre rendez-vous|Parler à un conseiller/ }).length).toBeGreaterThan(0);
    const whatsapp = screen.getByRole("link", { name: /WhatsApp/ });
    expect(whatsapp.getAttribute("href")).toContain("https://wa.me/237698104832");
    expect(whatsapp.getAttribute("rel")).toContain("noopener");
  });

  it("rappelle que la décision appartient aux autorités", () => {
    render(<Services />);
    expect(screen.getAllByText(/sans garantir de résultat/).length).toBeGreaterThan(0);
  });
});

describe("accueil : « Que voulez-vous faire ? »", () => {
  it("affiche les huit actions, dont l'évaluation gratuite sans compte pour les études et le travail", () => {
    render(<QuickActionsSection />);
    const links = within(screen.getByTestId("quick-actions")).getAllByRole("link");
    expect(links).toHaveLength(8);
    expect(links[0].getAttribute("href")).toBe("/?project=etudes#evaluation-multi");
    expect(links[1].getAttribute("href")).toBe("/?project=travail#evaluation-multi");
    expect(screen.getByRole("link", { name: "Voir tous nos services" }).getAttribute("href")).toBe("/services");
  });

  it("est placé juste après le hero, avant le reste de l'accueil ; le hero renvoie vers les trois pôles", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home).toContain("<QuickActionsSection />");
    expect(home.indexOf("<HeroSectionVIP")).toBeLessThan(home.indexOf("<QuickActionsSection />"));
    expect(home.indexOf("<QuickActionsSection />")).toBeLessThan(home.indexOf("<ServicesOverviewSection />"));
    const hero = read("client/src/components/HeroSectionVIP.tsx");
    for (const pole of SERVICE_POLES) expect(hero).toContain(`href="/services#${pole.id}"`);
    expect(hero).toContain("Visas, voyages et démarches administratives");
    expect(hero).not.toContain("expertise reconnue");
  });

  it("la page /services est déclarée côté client et pré-rendue côté serveur", () => {
    expect(app).toContain('<Route path={"/services"} component={Services} />');
    expect(read("server/publicPrerender.ts")).toContain('"/services": {');
  });
});
