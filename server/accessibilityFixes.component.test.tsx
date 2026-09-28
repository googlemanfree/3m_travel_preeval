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
});
