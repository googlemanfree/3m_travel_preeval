import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("portail de placement protégé", () => {
  it("exige un consentement candidat avant de créer ou soumettre un profil", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain("Le candidat doit d’abord consentir");
    expect(router).toContain("Le consentement du candidat n’est plus actif");
    expect(router).toContain("requireValidAdminSession");
  });

  it("n’expose au portail employeur que des champs anonymisés", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router).toContain("code: profile.profileCode");
    expect(router).not.toContain("email: profile.");
    expect(router).not.toContain("phone: profile.");
    expect(router).toContain("verificationStatus, \"verified\"");
  });

  it("documente une interface candidat révocable et une interface employeur vérifiée", () => {
    expect(read("client/src/components/PlacementConsentCard.tsx")).toContain("Retirer mon accord");
    expect(read("client/src/pages/EmployerPortal.tsx")).toContain("Portail employeur vérifié");
    expect(read("client/src/App.tsx")).toContain('path={"/employeurs"}');
  });

  it("génère côté serveur les accès employeurs remis après vérification", () => {
    const router = read("server/routers/placementPortal.ts");
    const adminUi = read("client/src/components/AdminPlacementPipeline.tsx");
    expect(router).toContain('randomBytes(12).toString("base64url")');
    expect(router).toContain("Remettez les identifiants par un canal approuvé");
    expect(adminUi).toContain("Générer l’accès vérifié");
    expect(adminUi).toContain("Identifiants à remettre maintenant");
  });
});
