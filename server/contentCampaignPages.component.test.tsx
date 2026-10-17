// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

if (!("IntersectionObserver" in globalThis)) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, writable: true, value: MockIntersectionObserver });
}

vi.mock("@/components/SocialShareButtons", () => ({ SocialShareButtons: () => null }));

import Faq from "@/pages/Faq";
import VerifierAgence from "@/pages/VerifierAgence";
import { FAQ_GENERAL_GROUPS, FAQ_GENERAL_ITEMS } from "@/data/contentCampaign";
import { COMPANY_PROFILE } from "@/lib/companyContacts";

afterEach(() => cleanup());

describe("page /faq", () => {
  it("affiche un sommaire des thèmes, tous les groupes et toutes les questions, et des données structurées valides", () => {
    const { container } = render(<Faq />);
    const nav = screen.getByTestId("faq-themes");
    for (const group of FAQ_GENERAL_GROUPS) {
      expect(within(nav).getByRole("link", { name: group.title }).getAttribute("href")).toBe(`#${group.id}`);
      expect(screen.getByTestId(`faq-group-${group.id}`).id).toBe(group.id);
    }
    for (const item of FAQ_GENERAL_ITEMS) expect(screen.getByText(item.question)).toBeTruthy();
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent as string);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(FAQ_GENERAL_ITEMS.length);
    expect(script!.textContent).not.toContain("<");
    expect(document.title).toBe("Questions fréquentes | 3M TRAVEL AGENCY");
  });

  it("un seul titre de niveau 1 et des liens utiles vers contact, vérification et tarifs", () => {
    render(<Faq />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /Écrire à l’agence/ })[0].getAttribute("href")).toBe("/contact");
    expect(screen.getAllByRole("link", { name: /Vérifier une agence avant de payer/ })[0].getAttribute("href")).toBe("/verifier-une-agence");
    expect(screen.getAllByRole("link", { name: /Comprendre les tarifs/ })[0].getAttribute("href")).toBe("/tarifs");
  });
});

describe("page /verifier-une-agence", () => {
  it("publie l'identité légale réelle de l'agence et un lien vers le registre officiel", () => {
    render(<VerifierAgence />);
    const identity = screen.getByTestId("agency-identity");
    expect(identity.textContent).toContain(COMPANY_PROFILE.legalName);
    expect(identity.textContent).toContain(COMPANY_PROFILE.legalIdentifiers.registration);
    expect(identity.textContent).toContain(COMPANY_PROFILE.legalIdentifiers.taxpayerId);
    const registry = within(identity).getByRole("link", { name: /Ouvrir le registre officiel/ });
    expect(registry.getAttribute("href")).toBe(COMPANY_PROFILE.legalIdentifiers.registrySearchUrl);
    expect(registry.getAttribute("rel")).toContain("noopener");
  });

  it("présente les signaux d'alerte, les vérifications, les engagements et la conduite à tenir", () => {
    render(<VerifierAgence />);
    expect(screen.getByTestId("agency-red-flags").textContent).toContain("assurés");
    expect(within(screen.getByTestId("agency-checks")).getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByTestId("agency-3m-does").textContent).toContain("Ne jamais vous demander de mot de passe");
    expect(screen.getByTestId("agency-if-scammed").textContent).toContain("Conservez les preuves");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Vérifier une agence avant de payer | 3M TRAVEL AGENCY");
  });
});
