import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("écrans du parcours Prime Travel", () => {
  it("expose le parcours public et ses cinq étapes métier", () => {
    const app = readProjectFile("client/src/App.tsx");
    const page = readProjectFile("client/src/pages/PrimeJourney.tsx");

    expect(app).toContain('const PrimeJourney = lazyWithTimeout(() => import("./pages/PrimeJourney"));');
    expect(app).toContain('<Route path={"/parcours"} component={PrimeJourney} />');
    expect(page).toContain("Facebook ou WhatsApp");
    expect(page).toContain("Évaluation mondiale");
    expect(page).toContain("Rapport & choix");
    expect(page).toContain("Pièces sécurisées");
    expect(page).toContain("Avancement partagé");
  });

  it("conserve le contexte de campagne et distingue Facebook de WhatsApp", () => {
    const page = readProjectFile("client/src/pages/PrimeJourney.tsx");

    expect(page).toContain('params.get("source")?.toLowerCase()');
    expect(page).toContain('source === "whatsapp" || source === "wa"');
    expect(page).toContain('source === "facebook" || source === "fb"');
    expect(page).toContain('params.get("campaign") || params.get("campagne")');
    expect(page).toContain("/evaluation?source=");
  });

  it("ne promet pas automatiquement une destination et propose un suivi sécurisé", () => {
    const page = readProjectFile("client/src/pages/PrimeJourney.tsx");

    expect(page).toContain("Aucune destination n’est imposée avant l’analyse de votre profil et votre accord.");
    expect(page).toContain("/submit-documents");
    expect(page).toContain("/mon-espace");
    expect(page).toContain("Données protégées");
  });
});

