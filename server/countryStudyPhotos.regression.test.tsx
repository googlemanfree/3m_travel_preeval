import React from "react";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CountryFactsPanel } from "../client/src/components/CountryFactsPanel";
import { CountryPhotoGallery } from "../client/src/components/CountryPhotoGallery";
import { countryFacts, getCountryFacts } from "../client/src/data/countryFacts";
import { countryPhotos, getCountryPhotos } from "../client/src/data/countryPhotos";
import { DESTINATIONS_20 } from "../client/src/data/destinations20";
import { studyDestinationArticles } from "../client/src/data/studyDestinationArticles";

const root = resolve(import.meta.dirname, "..");
const pageSource = readFileSync(resolve(root, "client/src/pages/StudyDestinationArticle.tsx"), "utf8");
const studySlugs = studyDestinationArticles.map((article) => article.slug);
// Le Luxembourg a sa propre page dédiée (ProcedureLuxembourg) : il n'utilise pas DestinationFormationPage.
const destinationSlugs = DESTINATIONS_20.map((d) => d.slug).filter((slug) => slug !== "luxembourg");
const slugs = Array.from(new Set([...studySlugs, ...destinationSlugs]));
const destinationPageSource = readFileSync(resolve(root, "client/src/pages/DestinationFormationPage.tsx"), "utf8");

/**
 * Les guides d'études par pays affichent une photo d'en-tête, une photo de galerie, leurs crédits et des repères
 * stables. Les licences CC BY et CC BY-SA exigent de citer l'auteur et la licence : retirer un crédit rend l'usage
 * de la photo non conforme.
 */
describe("guides d'études : photos, crédits et repères pour chaque pays", () => {
  it("chaque pays des guides d'études et des pages de procédures a deux photos et des repères, et rien n'existe pour un pays inconnu", () => {
    expect(Object.keys(countryPhotos).sort()).toEqual([...slugs].sort());
    expect(Object.keys(countryFacts).sort()).toEqual([...slugs].sort());
    expect(getCountryPhotos("pays-inconnu")).toEqual([]);
    expect(getCountryFacts("pays-inconnu")).toBeUndefined();
  });

  for (const slug of slugs) {
    it(`${slug} : fichiers présents, vrais JPEG, crédits complets, repères renseignés`, () => {
      const photos = getCountryPhotos(slug);
      expect(photos.length).toBeGreaterThanOrEqual(2);
      for (const photo of photos) {
        const path = resolve(root, "client/public", photo.src.replace(/^\//, ""));
        expect(existsSync(path), `${photo.src} absent`).toBe(true);
        const size = statSync(path).size;
        expect(size).toBeGreaterThan(30_000);
        expect(size).toBeLessThan(700_000);
        expect(readFileSync(path).subarray(0, 3).toString("hex")).toBe("ffd8ff");
        expect(photo.alt.length).toBeGreaterThan(25);
        expect(photo.author.trim()).not.toBe("");
        expect(photo.license).toMatch(/^CC0$|^CC BY(-SA)? \d\.0$/);
        expect(photo.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//);
        expect(photo.fileUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
        expect(photo.width).toBeGreaterThan(1000);
      }
      const facts = getCountryFacts(slug)!;
      expect(facts.capital).not.toBe("");
      expect(facts.currency).not.toBe("");
      expect(facts.languages).not.toBe("");
      expect(facts.cities.length).toBeGreaterThanOrEqual(3);
      for (const source of facts.extraSources) expect(source.href).toMatch(/^https:\/\//);
    });
  }

  it("la galerie affiche la photo de galerie et les crédits de toutes les photos, avec leurs liens", () => {
    const photos = getCountryPhotos("france");
    const html = renderToStaticMarkup(<CountryPhotoGallery photos={photos} country="France" />);
    expect(html).toContain(photos[1].src);
    expect(html).toContain('loading="lazy"');
    for (const photo of photos) {
      expect(html).toContain(photo.author);
      expect(html).toContain(photo.license);
      expect(html).toContain(photo.fileUrl);
      expect(html).toContain(photo.licenseUrl);
    }
    expect(html).toContain("Wikimedia Commons");
    expect(renderToStaticMarkup(<CountryPhotoGallery photos={photos.slice(0, 1)} country="France" />)).toBe("");
  });

  it("le panneau de repères affiche capitale, monnaie, langues et villes", () => {
    const html = renderToStaticMarkup(<CountryFactsPanel country="Irlande" facts={getCountryFacts("irlande")!} />);
    for (const text of ["Dublin", "Euro (EUR)", "Irlandais et anglais", "Cork", "Galway", "Repères : Irlande"]) expect(html).toContain(text);
  });

  it("la page de guide utilise la photo d'en-tête (décorative), la galerie, les repères et les portails officiels", () => {
    expect(pageSource).toContain("<CountryPhotoGallery");
    expect(pageSource).toContain("<CountryFactsPanel");
    expect(pageSource).toContain('alt="" aria-hidden="true"');
    expect(pageSource).toContain("country-extra-sources");
    // Le texte du guide et les liens existants restent en place.
    expect(pageSource).toContain("article.sourceUrl");
    expect(pageSource).toContain("Évaluer mon projet d’études");
  });

  it("la page de procédure d'une destination affiche la photo d'en-tête, la galerie, les repères et garde ses sources officielles", () => {
    expect(destinationPageSource).toContain("<CountryPhotoGallery");
    expect(destinationPageSource).toContain("<CountryFactsPanel");
    expect(destinationPageSource).toContain('citiesLabel="Villes principales"');
    expect(destinationPageSource).toContain('alt="" aria-hidden="true"');
    expect(destinationPageSource).toContain("official-sources");
    expect(destinationPageSource).toContain("destination.etapesCles");
  });

  it("le panneau de repères accepte un intitulé de villes propre à la page de procédure", () => {
    const html = renderToStaticMarkup(<CountryFactsPanel country="Japon" facts={getCountryFacts("japon")!} citiesLabel="Villes principales" />);
    expect(html).toContain("Villes principales");
    expect(html).not.toContain("Villes universitaires connues");
    expect(html).toContain("Tokyo");
  });
});
