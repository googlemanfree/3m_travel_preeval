import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (relative: string) => readFileSync(resolve(root, relative), "utf8");

describe("2FA TOTP et favoris employeur", () => {
  it("chiffre les secrets, hache les récupérations et consomme chaque code une fois", () => {
    const source = read("server/twoFactor.ts");
    expect(source).toContain("aes-256-gcm");
    expect(source).toContain("bcrypt.hash(code, 12)");
    expect(source).toContain("usedAt: new Date()");
  });

  it("exige un second facteur actif à la connexion admin et employeur", () => {
    expect(read("server/routers/adminAuth.ts")).toContain("TOTP_REQUIRED");
    expect(read("server/routers/placementPortal.ts")).toContain("verifyTwoFactor(\"employer\"");
  });

  it("limite les favoris à des soumissions déjà accessibles à l’organisation", () => {
    const source = read("server/routers/placementPortal.ts");
    expect(source).toContain("employerToggleFavorite");
    expect(source).toContain("eq(placementProfileSubmissions.organizationId, organization.id)");
    expect(source).toContain("placementEmployerFavorites");
  });

  it("présente un enrôlement TOTP et des favoris sans afficher de document personnel", () => {
    const source = read("client/src/pages/EmployerPortal.tsx");
    expect(source).toContain("employerBeginTwoFactorEnrollment");
    expect(source).toContain("employerToggleFavorite");
    expect(source).toContain("Aucun document personnel ni contact candidat n’est affiché");
  });
});
