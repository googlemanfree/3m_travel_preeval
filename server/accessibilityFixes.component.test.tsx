// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import { VisasCarousel } from "@/components/VisasCarousel";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

afterEach(cleanup);

/**
 * Corrections trouvées avec axe-core sur un vrai navigateur (accueil, /paiement) : boutons sans nom accessible et
 * couleurs trop peu contrastées. Verrouillées ici pour qu'elles ne reviennent pas silencieusement.
 */
describe("carrousel des visas accordés : navigation et indicateurs nommés", () => {
  it("les flèches précédent/suivant ont un nom accessible (axe : « button-name »)", () => {
    render(<VisasCarousel />);
    expect(screen.getByRole("button", { name: "Visa précédent" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Visa suivant" })).toBeTruthy();
  });

  it("chaque indicateur nomme le visa qu'il ouvre, avec sa position ; celui affiché est marqué sélectionné", () => {
    render(<VisasCarousel />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);
    expect(tabs[0].getAttribute("aria-label")).toMatch(/\(1 sur \d+\)/);
    expect(tabs.filter((tab) => tab.getAttribute("aria-selected") === "true")).toHaveLength(1);
  });
});

describe("contraste du texte et des boutons (axe : « color-contrast »)", () => {
  it("le compteur de filtre non actif n'utilise plus un gris trop clair sur fond blanc", () => {
    const source = read("client/src/components/ProofGallerySection.tsx");
    expect(source).not.toContain('"text-slate-400"');
  });

  it("les boutons WhatsApp en emerald-600/blanc (contraste 3,65:1, sous le seuil de 4,5:1) sont assombris", () => {
    for (const path of ["client/src/pages/Home.tsx", "client/src/components/FlightBookingFAQ.tsx", "client/src/components/PaymentFallbackPanel.tsx"]) {
      const source = read(path);
      expect(source, path).not.toContain("bg-emerald-600");
    }
  });

  it("les fonds emerald-600/emerald-500 avec texte blanc (ratio 2,8-3,8:1) sont passés à emerald-700/800, partout ailleurs sur le site", () => {
    const paths = [
      "client/src/components/AdminCandidatesToRemind.tsx",
      "client/src/components/AdminDocumentsManagement.tsx",
      "client/src/components/AdminPaymentManagement.tsx",
      "client/src/components/AdminPortraitReviewPanel.tsx",
      "client/src/components/AdminReservationPayments.tsx",
      "client/src/components/AdminReviewsToInvite.tsx",
      "client/src/components/AureolAssistantChat.tsx",
      "client/src/components/CandidateCountryJourney.tsx",
      "client/src/components/DestinationCallbackDialog.tsx",
      "client/src/components/ErrorBoundary.tsx",
      "client/src/components/FlightDeskActions.tsx",
      "client/src/components/ProcedureStepper.tsx",
      "client/src/components/ReviewInvitationPanel.tsx",
      "client/src/components/SimpleMultiProjectForm.tsx",
      "client/src/components/ValidationStep.tsx",
      "client/src/pages/AdminAgencyDossiers.tsx",
      "client/src/pages/CountryDetailPage.tsx",
      "client/src/pages/EnHome.tsx",
      "client/src/pages/EvisaRequestForm.tsx",
      "client/src/pages/FlightAgentDashboard.tsx",
      "client/src/pages/FlightBookingCheckout.tsx",
      "client/src/pages/Flights.tsx",
      "client/src/pages/PrimeJourney.tsx",
      "client/src/pages/ProceduresAdvanced.tsx",
      "client/src/pages/AdminDashboard.tsx",
      "client/src/components/CanadaScoreSimulator.tsx",
    ];
    for (const path of paths) {
      const source = read(path);
      expect(source, path).not.toMatch(/bg-emerald-600[^"'`]*text-white|text-white[^"'`]*bg-emerald-600/);
      expect(source, path).not.toMatch(/bg-emerald-500[^"'`]*text-white|text-white[^"'`]*bg-emerald-500/);
    }
    // EvaluationSpace.tsx conserve un bg-emerald-600 décoratif (icône, barre de progression sans texte) : seuls les boutons/badges textuels sont vérifiés.
    const evaluationSpace = read("client/src/pages/EvaluationSpace.tsx");
    expect(evaluationSpace).not.toContain('className="bg-emerald-600 hover:bg-emerald-700 text-white');
  });

  it("les fonds orange-500 avec texte blanc (ratio 2,82:1) sont passés à orange-700/800", () => {
    const paths = [
      "client/src/components/ApprovedReviewsSection.tsx",
      "client/src/components/ClientSpaceNavigation.tsx",
      "client/src/components/Navbar.tsx",
      "client/src/components/ThreeMBookingExperience.tsx",
      "client/src/pages/SubmitReview.tsx",
    ];
    for (const path of paths) {
      const source = read(path);
      expect(source, path).not.toMatch(/bg-orange-500[^"'`]*text-white|text-white[^"'`]*bg-orange-500/);
    }
  });

  it("le bleu Facebook officiel (#1877F2, ratio 4,23:1) du bouton de partage est assombri sous le seuil AA", () => {
    const source = read("client/src/components/SocialShareButtons.tsx");
    expect(source).not.toContain("#1877F2");
  });
});

describe("repère de région (axe : « landmark-one-main », « region »)", () => {
  it("la page d'accueil est enveloppée dans un unique repère <main>", () => {
    const source = read("client/src/pages/Home.tsx");
    const mainOpenTags = source.match(/<main[ >]/g) ?? [];
    const mainCloseTags = source.match(/<\/main>/g) ?? [];
    expect(mainOpenTags).toHaveLength(1);
    expect(mainCloseTags).toHaveLength(1);
  });

  // Pages dont le composant racine ne contient pas littéralement <main> mais délègue tout son rendu
  // à un composant qui, lui, en a un (vérifié manuellement une fois pour chacune) : évite un faux négatif.
  const TRANSITIVE_MAIN = new Set([
    "client/src/pages/Admin.tsx", // ré-exporte AdminDashboard.tsx (a <main>)
    "client/src/pages/ProcedureLuxembourg.tsx", // délègue à CountryProcedureTemplate.tsx (a <main>)
  ]);

  it("chaque page routée dans App.tsx expose un repère <main> (ou passe par ServicePageShell / un composant qui en a un)", () => {
    const appSource = read("client/src/App.tsx");
    const importedPages = new Set<string>();
    Array.from(appSource.matchAll(/from "\.\/pages\/([A-Za-z0-9_/]+)"/g)).forEach((m) => {
      importedPages.add(`client/src/pages/${m[1]}.tsx`);
    });

    const offenders: string[] = [];
    for (const pagePath of Array.from(importedPages)) {
      if (TRANSITIVE_MAIN.has(pagePath)) continue;
      let source: string;
      try {
        source = read(pagePath);
      } catch {
        continue; // page listée dans App.tsx mais fichier introuvable : hors sujet de ce test
      }
      const hasMain = /<main[ >]/.test(source);
      const hasServicePageShell = source.includes("ServicePageShell");
      if (!hasMain && !hasServicePageShell) offenders.push(pagePath);
    }

    expect(offenders, `Pages sans repère <main> : ${offenders.join(", ")}`).toEqual([]);
  });
});
