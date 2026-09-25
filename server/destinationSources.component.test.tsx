// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import DestinationFormationPage from "@/pages/DestinationFormationPage";
import { DESTINATION_OFFICIAL_SOURCES } from "@/data/destinationOfficialSources";
import { DESTINATIONS_20 } from "@/data/destinations20";

afterEach(cleanup);

const app = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const routedSlugs = Array.from(app.matchAll(/<DestinationFormationPage slug="([a-z-]+)"/g)).map((match) => match[1]);

describe("pages de destination : sources officielles", () => {
  it("chaque destination servie par la page générique a au moins une source officielle", () => {
    expect(routedSlugs.length).toBeGreaterThanOrEqual(15);
    for (const slug of routedSlugs) {
      expect(DESTINATIONS_20.some((destination) => destination.slug === slug), slug).toBe(true);
      expect(DESTINATION_OFFICIAL_SOURCES[slug]?.length, slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("uniquement des adresses https vers un portail (pas de page profonde, pas de doublon, pas de suivi)", () => {
    const urls = Object.values(DESTINATION_OFFICIAL_SOURCES).flat().map((source) => source.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      const parsed = new URL(url);
      expect(parsed.protocol, url).toBe("https:");
      expect(parsed.search, url).toBe("");
      expect(parsed.pathname.split("/").filter(Boolean).length, url).toBeLessThanOrEqual(3);
    }
    for (const slug of Object.keys(DESTINATION_OFFICIAL_SOURCES)) expect(DESTINATIONS_20.some((d) => d.slug === slug), slug).toBe(true);
  });

  it("la page affiche les sources en lien externe sécurisé, avec le rappel de vérifier auprès de l'autorité", () => {
    render(<DestinationFormationPage slug="pays-bas" />);
    const block = screen.getByTestId("official-sources");
    const link = block.querySelector("a") as HTMLAnchorElement;
    expect(link.href).toContain("ind.nl");
    expect(link.rel).toContain("noopener");
    expect(link.target).toBe("_blank");
    expect(block.textContent).toContain("vérifiez toujours les conditions en vigueur");
  });

  it("une destination sans source n'affiche pas de bloc vide", () => {
    render(<DestinationFormationPage slug="luxembourg" />);
    expect(screen.queryByTestId("official-sources")).toBeNull();
  });
});
