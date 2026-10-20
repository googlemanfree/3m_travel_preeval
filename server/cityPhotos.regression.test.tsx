// @vitest-environment jsdom
import React from "react";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { countryPhotos, getCountryPhotos } from "../client/src/data/countryPhotos";
import { generatedCountryPhotos } from "../client/src/data/countryPhotosGenerated";
import { getDestinationVisual, normalizeDestinationSlug } from "../client/src/data/premiumVisuals";
import { CountryPhotoGallery } from "../client/src/components/CountryPhotoGallery";

(globalThis as any).React = React;
afterEach(() => cleanup());

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

/** Pays qui ont une fiche de procédure ou e-Visa publique. */
const PROCEDURE_COUNTRIES = [
  "albanie", "allemagne", "arabie-saoudite", "australie", "autriche", "azerbaidjan", "bahrein", "belgique", "bolivie", "bulgarie", "cambodge", "canada", "chypre",
  "coree-du-sud", "cote-divoire", "croatie", "danemark", "djibouti", "egypte", "emirats", "espagne", "estonie", "etats-unis", "ethiopie", "finlande", "france", "gabon",
  "grece", "hongrie", "inde", "indonesie", "irlande", "islande", "italie", "japon", "kenya", "laos", "lettonie", "liechtenstein", "lituanie", "luxembourg", "madagascar",
  "malaisie", "malawi", "malte", "maroc", "maurice", "mozambique", "norvege", "nouvelle-zelande", "oman", "ouganda", "ouzbekistan", "pakistan", "papouasie-nouvelle-guinee",
  "pays-bas", "pologne", "portugal", "qatar", "rdc", "republique-tcheque", "roumanie", "royaume-uni", "rwanda", "senegal", "seychelles", "slovaquie", "slovenie", "somalie",
  "srilanka", "suede", "suisse", "suriname", "tanzanie", "togo", "turquie", "vietnam", "zambie", "zimbabwe",
];
/** Aucune photo libre exploitable n'a été trouvée sur Wikimedia Commons : à compléter dès qu'une photo valide existe. */
const WITHOUT_PHOTO = ["guinee"];

describe("photos de villes des fiches de procédure", () => {
  it("chaque photo ajoutée existe, est légère, a une licence libre et un crédit complet", () => {
    const entries = Object.entries(generatedCountryPhotos);
    expect(entries.length).toBeGreaterThanOrEqual(55);
    for (const [slug, photos] of entries) {
      expect(photos.length).toBeGreaterThanOrEqual(1);
      for (const photo of photos) {
        const file = resolve(root, "client/public" + photo.src);
        expect(existsSync(file), `${slug} : fichier ${photo.src}`).toBe(true);
        expect(statSync(file).size, `${slug} : poids`).toBeLessThan(600 * 1024);
        const header = readFileSync(file).subarray(0, 3);
        expect(header[0] === 0xff && header[1] === 0xd8, `${slug} : JPEG`).toBe(true);
        expect(photo.width).toBeLessThanOrEqual(1400);
        expect(photo.author.length).toBeGreaterThan(1);
        expect(photo.license).toMatch(/^(CC0|Public domain|CC BY(-SA)? [0-9.]+)/i);
        expect(photo.license).not.toMatch(/NC|ND/);
        expect(photo.licenseUrl).toMatch(/^https:\/\//);
        expect(photo.fileUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
        expect(photo.alt.length).toBeGreaterThan(10);
      }
    }
  });

  it("tous les pays ayant une fiche de procédure ont une photo de ville, sauf exceptions documentées", () => {
    const missing = PROCEDURE_COUNTRIES.filter((slug) => getCountryPhotos(slug).length === 0);
    expect(missing).toEqual([]);
    for (const slug of WITHOUT_PHOTO) expect(getCountryPhotos(slug)).toEqual([]);
  });

  it("les photos choisies à la main restent prioritaires sur les photos ajoutées", () => {
    expect(countryPhotos.canada?.[0].src).toContain("/photos-canada/");
    expect(countryPhotos.france?.length).toBeGreaterThanOrEqual(2);
  });

  it("l'identifiant d'une fiche (pays-type) retrouve bien la photo du pays", () => {
    for (const id of ["kenya-travail", "egypte-evisa", "italie-visiteur", "republique-tcheque-visiteur", "tanzanie-evisa", "zambie"]) {
      const visual = getDestinationVisual(id);
      expect(visual?.desktop, id).toMatch(/^\/(photos-pays|photos-canada|manus-storage)\//);
    }
    expect(normalizeDestinationSlug("egypte-evisa")).toBe("egypte");
    expect(getDestinationVisual("kenya-travail")?.desktop).toBe("/photos-pays/pays-kenya-1.jpg");
  });

  it("une photo unique affiche tout de même son crédit (obligatoire avec CC BY / CC BY-SA)", () => {
    render(<CountryPhotoGallery photos={getCountryPhotos("kenya")} country="Kenya" />);
    const credit = screen.getByTestId("country-photo-credits");
    expect(credit.textContent).toContain("Nairobi");
    expect(credit.textContent).toContain("via Wikimedia Commons");
    expect(credit.querySelectorAll("a").length).toBe(2);
  });

  it("expose un chargement progressif, des filtres et une visionneuse accessible", () => {
    const source = read("client/src/components/CountryPhotoGallery.tsx");
    expect(source).toContain('loading={priority ? "eager" : "lazy"}');
    expect(source).toContain('data-testid="country-photo-skeleton"');
    expect(source).toContain('data-testid="country-photo-lightbox"');
    expect(source).toContain('onTouchStart=');
    expect(source).toContain('id="country-photo-place"');
    expect(source).toContain('id="country-photo-sort"');
    expect(source).toContain('aria-label="Photo précédente"');
    expect(source).toContain('aria-label="Photo suivante"');
  });

  it("la fiche e-Visa utilise la photo de ville et son crédit", () => {
    const page = read("client/src/pages/EvisaDetailPage.tsx");
    expect(page).toContain("getCountryPhotos(destination.id)[0]");
    expect(page).toContain('data-testid="evisa-photo-credit"');
  });
});
