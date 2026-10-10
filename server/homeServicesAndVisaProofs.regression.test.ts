import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("page d'accueil : « Nos services » et preuves de visas Schengen", () => {
  it("présente les quatre pôles avec toutes leurs activités ; la technologie n'y figure plus (page à part)", () => {
    const source = read("client/src/components/ServicesOverviewSection.tsx");
    for (const pole of ["Mobilité internationale", "Visas", "Travel & Booking", "Démarches administratives"]) expect(source, pole).toContain(`title: "${pole}"`);
    for (const activite of [
      "Études", "Travail", "Immigration", "Regroupement familial",
      "Visa étudiant", "Visa de travail", "Visa de visiteur",
      "Billets d'avion", "Hôtels", "Location de véhicules", "Assurance voyage",
      "Pré-enrôlement CNI", "Passeport", "e-Visa Cameroun",
    ]) expect(source, activite).toContain(`label: "${activite}"`);
    // Retirés du haut de page à la demande de l'utilisateur : la technologie vit sur sa propre page (3M Solutions).
    for (const retire of ["Technologies", "Formations", "Solutions de sécurité"]) expect(source, retire).not.toContain(`label: "${retire}"`);
  });

  it("ne renvoie que vers des routes réellement déclarées (aucun lien mort)", () => {
    const section = read("client/src/components/ServicesOverviewSection.tsx");
    const app = read("client/src/App.tsx");
    // Le chemin seul (sans ?service=…) doit correspondre à une route déclarée.
    const liens = Array.from(new Set(Array.from(section.matchAll(/href: "(\/[^"?#]*)/g)).map((match) => match[1])));
    expect(liens.length).toBeGreaterThan(4);
    // Hôtels, location de véhicules et CNI & passeport ont chacun leur propre destination (plus de repli générique).
    expect(section).toContain('href: "/tourisme?service=hotel"');
    expect(section).toContain('href: "/tourisme?service=vehicle"');
    expect(section).toContain('href: "/cni-passeport"');
    expect(section).toContain('href="/3m-solutions"');
    // Les deux syntaxes JSX existent dans App.tsx : path="/x" et path={"/x"}
    for (const lien of liens) expect(app.includes(`path="${lien}"`) || app.includes(`path={"${lien}"}`), lien).toBe(true);
  });

  it("le paragraphe « Nos services » cite chaque activité avec un lien réel, et le nombre de destinations est compté depuis le catalogue réel", () => {
    const section = read("client/src/components/ServicesOverviewSection.tsx");
    expect(section).toContain("countUniqueDestinations");
    expect(section).toContain("DESTINATION_COUNT");
    expect(section).toContain("PROCEDURE_COUNT");
    expect(section).toContain("centre de préparation et de suivi de dossiers");
    expect(section).toContain("{PROCEDURE_COUNT} procédures sur {DESTINATION_COUNT} destinations");
    expect(section).toContain("canaux autorisés");
    expect(section).toContain("Une seule ambition : transformer votre projet international en une démarche claire, préparée et crédible.");
  });

  it("est affichée sur l'accueil, avant les procédures les plus demandées, après les preuves sociales", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home).toContain('import ServicesOverviewSection from "@/components/ServicesOverviewSection"');
    expect(home.indexOf("<ServicesOverviewSection />")).toBeGreaterThan(-1);
    expect(home.indexOf("<ProofGallerySection />")).toBeLessThan(home.indexOf("<ServicesOverviewSection />"));
    expect(home.indexOf("<ApprovedReviewsSection />")).toBeLessThan(home.indexOf("<ServicesOverviewSection />"));
    expect(home.indexOf("<ServicesOverviewSection />")).toBeLessThan(home.indexOf('aria-label="Procédures les plus demandées"'));
  });


  it("ajoute les quatre visas Schengen à la galerie, avec des fichiers existants et légers", () => {
    const gallery = read("client/src/data/proofPhotos.ts");
    for (const fichier of ["proof-visa-espagne-1.jpg", "proof-visa-france-1.jpg", "proof-visa-france-2.jpg", "proof-visa-france-3.jpg"]) {
      expect(gallery, fichier).toContain(`/proof-photos/${fichier}`);
      expect(existsSync(resolve(root, "client/public/proof-photos", fichier)), fichier).toBe(true);
    }
  });

  it("chaque photo de la galerie existe sur le disque et déclare des informations masquées", () => {
    const gallery = read("client/src/data/proofPhotos.ts");
    const sources = Array.from(gallery.matchAll(/src: "\/proof-photos\/([^"]+)"/g)).map((match) => match[1]);
    expect(sources.length).toBeGreaterThanOrEqual(19);
    for (const fichier of sources) expect(existsSync(resolve(root, "client/public/proof-photos", fichier)), fichier).toBe(true);
    for (const alt of Array.from(gallery.matchAll(/alt: "([^"]+)"/g)).map((match) => match[1])) {
      expect(alt).toMatch(/masquées|sans donnée personnelle identifiable|sans promesse de placement/);
    }
  });
});
