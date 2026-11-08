// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

let allowed = true;
vi.mock("@/hooks/useMotionAllowed", () => ({ useMotionAllowed: () => allowed }));
let updates: Array<{ id: number; title: string; summary: string; pagePath: string | null; publishedAt: string | null }> = [];
vi.mock("@/lib/trpc", () => ({ trpc: { adminContent: { publicUpdates: { useQuery: () => ({ data: updates }) } } } }));

import HomeLiveStrips, { PROCEDURE_STRIP_LIMIT, buildProcedureStrip, buildProofStrip } from "@/components/HomeLiveStrips";
import { LiveMarquee, marqueeDuration } from "@/components/LiveMarquee";
import { procedures107Complete } from "@/data/procedures107Complete";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

beforeEach(() => {
  allowed = true;
  updates = [];
});
afterEach(() => cleanup());

describe("durée du défilement", () => {
  it("proportionnelle au nombre d'éléments, bornée", () => {
    expect(marqueeDuration(1, 6)).toBe(30);
    expect(marqueeDuration(10, 6)).toBe(60);
    expect(marqueeDuration(1000, 6)).toBe(240);
  });
});

describe("bandeau défilant", () => {
  const items = [{ key: "a", node: <a href="/a">Alpha</a> }, { key: "b", node: <a href="/b">Beta</a> }];

  it("boucle avec une copie masquée aux lecteurs d'écran et inerte, sans doublon dans la liste lue", () => {
    render(<LiveMarquee items={items} label="Test" testId="m" />);
    const copy = screen.getByTestId("m-copy");
    expect(copy.getAttribute("aria-hidden")).toBe("true");
    expect(copy.hasAttribute("inert")).toBe(true);
    expect(screen.getAllByRole("list", { name: "Test" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Alpha" })).toHaveLength(1);
  });

  it("le bouton met en pause puis reprend le défilement", () => {
    const { container } = render(<LiveMarquee items={items} label="Test" testId="m" />);
    const marquee = container.querySelector(".live-marquee") as HTMLElement;
    expect(marquee.dataset.moving).toBe("true");
    expect(marquee.dataset.paused).toBe("false");
    const toggle = screen.getByTestId("m-toggle");
    fireEvent.click(toggle);
    expect(marquee.dataset.paused).toBe("true");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(marquee.dataset.paused).toBe("false");
  });

  it("mouvement réduit : aucune copie, aucun bouton, liste défilable à la main", () => {
    allowed = false;
    const { container } = render(<LiveMarquee items={items} label="Test" testId="m" />);
    expect(screen.queryByTestId("m-copy")).toBeNull();
    expect(screen.queryByTestId("m-toggle")).toBeNull();
    expect((container.querySelector(".live-marquee") as HTMLElement).dataset.moving).toBe("false");
  });

  it("un seul élément ne défile pas, et une liste vide n'affiche rien", () => {
    const { container, unmount } = render(<LiveMarquee items={items.slice(0, 1)} label="Test" testId="m" />);
    expect((container.querySelector(".live-marquee") as HTMLElement).dataset.moving).toBe("false");
    unmount();
    const empty = render(<LiveMarquee items={[]} label="Test" testId="m" />);
    expect(empty.container.innerHTML).toBe("");
  });
});

describe("contenu des trois bandeaux", () => {
  it("procédures : parcours prioritaires d'abord, liens uniques, tous issus du catalogue", () => {
    const strip = buildProcedureStrip();
    expect(strip.length).toBe(PROCEDURE_STRIP_LIMIT);
    expect(strip[0].href).toBe("/procedures/canada-travail");
    expect(new Set(strip.map((entry) => entry.href)).size).toBe(strip.length);
    const catalogueIds = new Set(procedures107Complete.map((country) => `/procedures/${country.id}`));
    const priority = new Set(["/procedures/canada-travail", "/procedures/canada-etudes", "/procedures/france-etudes", "/procedures/allemagne-travail"]);
    for (const entry of strip) expect(priority.has(entry.href) || catalogueIds.has(entry.href), entry.href).toBe(true);
  });

  it("visas obtenus : uniquement des preuves publiées, jamais de contexte ni de chiffre inventé", () => {
    const proofs = buildProofStrip();
    expect(proofs.length).toBeGreaterThan(0);
    expect(proofs.every((photo) => photo.kind !== "context")).toBe(true);
    const source = read("client/src/components/HomeLiveStrips.tsx");
    expect(source).not.toMatch(/\b\d{2,}\s*(visas|dossiers|clients)\b/i);
    expect(source).not.toContain("VisasCarousel");
  });

  it("actualités : sans mise à jour publiée, le bandeau annonce des ressources et non de fausses nouvelles", () => {
    render(<HomeLiveStrips />);
    expect(screen.getByText("Nos guides et ressources")).toBeTruthy();
    expect(screen.queryByText("Actualités des règles et des procédures")).toBeNull();
    expect(screen.getAllByRole("link", { name: /Quoi de neuf/ }).length).toBeGreaterThan(0);
  });

  it("actualités : les mises à jour publiées par l'équipe défilent avec leur date et renvoient à la page concernée", () => {
    updates = [{ id: 7, title: "Nouvelle règle test", summary: "x", pagePath: "/canada", publishedAt: "2026-11-02T10:00:00.000Z" }];
    render(<HomeLiveStrips />);
    expect(screen.getByText("Actualités des règles et des procédures")).toBeTruthy();
    const link = screen.getAllByRole("link", { name: /Nouvelle règle test/ })[0] as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/canada");
    expect(link.querySelector("time")?.getAttribute("datetime")).toBe("2026-11-02T10:00:00.000Z");
  });

  it("les trois bandeaux sont présents et les images de preuves se chargent à la demande", () => {
    const { container } = render(<HomeLiveStrips />);
    for (const id of ["live-strip-news", "live-strip-procedures", "live-strip-proofs"]) expect(screen.getByTestId(id)).toBeTruthy();
    const images = Array.from(container.querySelectorAll("[data-testid=live-strip-proofs] img"));
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((img) => img.getAttribute("loading") === "lazy" && img.getAttribute("alt"))).toBe(true);
  });
});

describe("câblage et styles", () => {
  const css = read("client/src/index.css");
  const block = css.slice(css.indexOf("Bandeaux défilants de l'accueil"));

  it("monté une seule fois dans l'accueil, avant la galerie de preuves, dont l'ancre existe", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home.match(/<HomeLiveStrips \/>/g)?.length).toBe(1);
    expect(home.indexOf("<HomeLiveStrips />")).toBeLessThan(home.indexOf("<ProofGallerySection />"));
    expect(read("client/src/components/ProofGallerySection.tsx")).toContain('id="preuves-dossiers"');
  });

  it("l'animation n'existe que sous prefers-reduced-motion: no-preference, se coupe avec le réglage du site et à l'impression", () => {
    expect(block).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.live-marquee\[data-moving="true"\] \.live-marquee__track \{\s*animation: live-marquee-slide/);
    expect(block).toContain("html.motion-disabled .live-marquee__track");
    expect(block).toContain("@media print");
    expect(block).toContain("animation-play-state: paused");
    expect(block).toContain(":focus-within");
    // Aucune règle ne fait varier l'opacité : le texte reste lisible en permanence.
    expect(block).not.toMatch(/opacity\s*:/);
  });
});
