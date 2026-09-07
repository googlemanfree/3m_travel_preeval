import { describe, expect, it } from "vitest";
import { favoriteFlightRows, favoriteFlightsFilename } from "../shared/favoriteFlightExport";
import { readFileSync } from "node:fs";

const appPath = new URL("../client/src/components/AuthGuard.tsx", import.meta.url);
const documentPath = new URL("../client/src/pages/DocumentUploadPage.tsx", import.meta.url);
const loginPath = new URL("../client/src/pages/Login.tsx", import.meta.url);

 describe("parcours protégés — chargement, export et téléversement", () => {
  it("transforme les favoris en lignes PDF sans identité ni données sensibles", () => {
    const rows = favoriteFlightRows([
      { flight: { originCity: "Yaoundé", destinationCity: "Paris", airline: { name: "Air France" }, flightNumber: "AF977", departureDate: "2026-09-14" } },
    ]);
    expect(rows).toEqual([["Yaoundé → Paris", "Air France", "AF977", "2026-09-14"]]);
    expect(JSON.stringify(rows)).not.toContain("email");
    expect(favoriteFlightsFilename(new Date("2026-09-14T10:00:00Z"))).toBe("3m-vols-favoris-2026-09-14.pdf");
  });

  it("conserve le skeleton de restauration et les confirmations de téléversement dans les composants", () => {
    const authGuard = readFileSync(appPath, "utf8");
    const documentUpload = readFileSync(documentPath, "utf8");
    expect(authGuard).toContain("Restauration sécurisée de votre espace");
    expect(authGuard).toContain('aria-label="Restauration de la session"');
    expect(documentUpload).toContain("Document téléversé avec succès");
    expect(documentUpload).toContain("Téléversement impossible");
  });
});


  it("borne la restauration et affiche un accès clair pour /mon-espace sans authentification", () => {
    const authGuard = readFileSync(appPath, "utf8");
    const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    expect(authGuard).toContain("window.setTimeout(finishRestoration, 750)");
    expect(authGuard).toContain("Accès Réservé aux Membres");
    expect(appSource).toContain('<AuthGuard message="Veuillez créer un compte ou vous connecter pour accéder à votre espace.">');
    expect(appSource).not.toContain('<AuthGuard autoRedirect message="Veuillez créer un compte ou vous connecter pour accéder à votre espace.">');
  });


it("affiche le retour à l’accueil sous les options de connexion", () => {
  const authGuard = readFileSync(appPath, "utf8");
  const login = readFileSync(loginPath, "utf8");
  expect(authGuard).toContain('onClick={() => navigate("/")}');
  expect(authGuard).toContain("← Retour à l’accueil");
  expect(authGuard.indexOf("← Retour à l’accueil")).toBeGreaterThan(authGuard.indexOf("Inscription"));
  expect(login).toContain('onClick={() => navigate("/")}');
  expect(login).toContain('t("Retour à l’accueil", "Back to home")');
  expect(login.indexOf('t("Retour à l’accueil", "Back to home")')).toBeGreaterThan(login.indexOf('type="submit"'));
});
