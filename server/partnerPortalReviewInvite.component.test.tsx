// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ReviewInviteCard } from "../client/src/components/ReviewInviteCard";

(globalThis as any).React = React;

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* indisponible */ }
});
afterEach(() => cleanup());

describe("invitation à donner un avis dans l'espace client", () => {
  it("n'apparaît que lorsque le visa est approuvé", () => {
    const { container } = render(<ReviewInviteCard approved={false} destination="Canada" visaType="Visa études" />);
    expect(container.innerHTML).toBe("");
  });

  it("propose un lien prérempli (service, pays), annonce la règle de publication et peut être masquée", () => {
    render(<ReviewInviteCard approved destination="Canada" visaType="Visa études" />);
    const link = screen.getByRole("link", { name: "Donner mon avis" });
    expect(link.getAttribute("href")).toBe("/avis?service=Visa+%C3%89tudes&destination=Canada#deposer-un-avis");
    expect(screen.getByTestId("review-invite-card").textContent).toContain("Il n’est publié qu’avec votre accord");
    expect(screen.getByTestId("review-invite-card").textContent).toContain("Positif ou critique");
    fireEvent.click(screen.getByRole("button", { name: "Masquer l’invitation à donner un avis" }));
    expect(screen.queryByTestId("review-invite-card")).toBeNull();
    expect(window.localStorage.getItem("3m-review-invite-dismissed")).toBe("1");
  });

  it("est branchée dans l'espace client sur le statut « visa approuvé »", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain('import { ReviewInviteCard } from "@/components/ReviewInviteCard";');
    expect(space).toContain('<ReviewInviteCard approved={["approuve", "visa_approuve"].includes(String(cProfile.dossierStatus))}');
  });
});

describe("portail partenaires et agences : confort et lisibilité", () => {
  const portal = read("client/src/pages/EmployerPortal.tsx");

  it("permet d'afficher le mot de passe, avec un nom accessible et un état annoncé", () => {
    expect(portal).toContain('data-testid="partner-toggle-password"');
    expect(portal).toContain("aria-pressed={showPassword}");
    expect(portal).toContain('t("Afficher le mot de passe", "Show password")');
  });

  it("montre des squelettes pendant le chargement, annoncés aux lecteurs d'écran", () => {
    expect(portal).toContain('data-testid="partner-profiles-loading"');
    expect(portal).toContain('data-testid="partner-history-loading"');
    expect(portal).toContain("motion-reduce:animate-none");
  });

  it("n'affiche que des compteurs calculés sur les profils reçus, avec recherche et pastille de statut", () => {
    expect(portal).toContain('data-testid="partner-summary"');
    expect(portal).toContain("availableProfiles.length");
    expect(portal).toContain("countByStatus([\"submitted\", \"under_review\"])");
    expect(portal).toContain('data-testid="partner-profile-search"');
    expect(portal).toContain('data-testid="partner-status-chip"');
  });

  it("distingue « aucun résultat pour ces filtres » (avec réinitialisation) d'un premier accès sans profil", () => {
    expect(portal).toContain('data-testid="partner-no-match"');
    expect(portal).toContain("onClick={resetFilters}");
    expect(portal).toContain('data-testid="partner-empty-onboarding"');
    expect(portal).toContain("Vos premiers profils arriveront ici.");
  });

  it("nomme les filtres et les champs de décision pour les lecteurs d'écran", () => {
    for (const label of ['aria-label={t("Langue", "Language")}', 'aria-label={t("Pays cible", "Target country")}', 'aria-label={t("Décision pour ce profil", "Decision for this profile")}']) {
      expect(portal).toContain(label);
    }
  });
});

describe("/flights : logos de compagnies sans service tiers", () => {
  it("affiche un monogramme du code IATA au lieu de charger des images externes", () => {
    const sections = read("client/src/components/FlightDiscoverySections.tsx");
    expect(sections).toContain('data-testid="carrier-monogram"');
    expect(sections).toContain("<CarrierLogo name={carrier.name} code={carrier.code} />");
    expect(sections).not.toContain("carrier.logo");
  });
});
