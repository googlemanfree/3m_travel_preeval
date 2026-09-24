import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const page = readFileSync(resolve(root, "client/src/pages/Canada.tsx"), "utf8");

const photos = [
  { file: "canada-vancouver.jpg", author: "Quintin Soloviev", license: "CC BY 4.0" },
  { file: "canada-banff-lac-moraine.jpg", author: "Gorgo", license: "domaine public" },
  { file: "canada-ottawa-parlement.jpg", author: "Saffron Blaze", license: "CC BY-SA 3.0" },
  { file: "canada-quebec-chateau-frontenac.jpg", author: "Wilfredor", license: "CC0" },
];

/**
 * Les photos de la page Canada viennent de Wikimedia Commons. Trois licences exigent un crédit (CC BY, CC BY-SA)
 * ou le recommandent : retirer l'auteur ou la licence rendrait l'usage de l'image non conforme.
 */
describe("page Canada : photos et crédits", () => {
  for (const photo of photos) {
    it(`${photo.file} existe, est un vrai JPEG, est référencée et créditée`, () => {
      const path = resolve(root, "client/public/canada", photo.file);
      expect(existsSync(path), "fichier absent").toBe(true);
      expect(statSync(path).size).toBeGreaterThan(50_000);
      expect(readFileSync(path).subarray(0, 3).toString("hex")).toBe("ffd8ff");
      expect(page).toContain(`/canada/${photo.file}`);
      expect(page).toContain(photo.author);
      expect(page).toContain(photo.license);
    });
  }

  it("chaque photo de la galerie a un texte alternatif descriptif, et les images sont chargées en différé", () => {
    const gallery = page.slice(page.indexOf("const canadaRegions"), page.indexOf("const photoCredits"));
    const alts = [...gallery.matchAll(/alt:\s*"([^"]+)"/g)].map((match) => match[1]);
    expect(alts).toHaveLength(4);
    for (const alt of alts) expect(alt.length).toBeGreaterThan(30);
    expect(page.match(/loading="lazy"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("n'utilise ni logo ni mot-symbole officiel du gouvernement du Canada ou d'IRCC", () => {
    expect(page).not.toMatch(/wordmark|logo[-_]?ircc|ircc[-_]?logo|canada[-_]?logo|fip[-_]?signature/i);
    expect(page).toContain("3M Travel n’est pas affilié au gouvernement du Canada");
  });

  it("conserve les visuels existants et les textes protégés par les tests précédents", () => {
    expect(page).toContain("/manus-storage/canada-hero-original_5fe49ae0.jpg");
    expect(page).toContain('id="simulateur-crs-canada"');
    expect(page).toContain("jamais de garantir une décision d’IRCC");
  });
});
