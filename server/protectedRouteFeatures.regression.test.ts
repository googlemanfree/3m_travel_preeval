import { describe, expect, it } from "vitest";
import { favoriteFlightRows, favoriteFlightsFilename } from "../shared/favoriteFlightExport";
import { readFileSync } from "node:fs";

const appPath = new URL("../client/src/components/AuthGuard.tsx", import.meta.url);
const adminGuardPath = new URL("../client/src/components/AdminGuard.tsx", import.meta.url);
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


it("explique la protection du dossier et expose les effets visuels de l’écran d’accès", () => {
  const authGuard = readFileSync(appPath, "utf8");
  expect(authGuard).toContain("Votre dossier contient des informations personnelles et des documents confidentiels.");
  expect(authGuard).toContain("initial={{ opacity: 0, y: 12 }}");
  expect(authGuard).toContain('transition={{ duration: 0.65, ease: "easeOut" }}');
  expect(authGuard).toContain("transition-all duration-200 hover:-translate-y-0.5");
});


it("prépare les CTA d’accès avec chargement, aide et adaptation mobile", () => {
  const authGuard = readFileSync(appPath, "utf8");
  expect(authGuard).toContain("pendingAction");
  expect(authGuard).toContain("Loader2");
  expect(authGuard).toContain("animate-spin");
  expect(authGuard).toContain("Mot de passe oublié ? Besoin d’aide ?");
  expect(authGuard).toContain("px-3 py-6 sm:px-4 sm:py-10");
  expect(authGuard).toContain("text-lg font-black sm:text-xl");
});


it("isole les réponses tRPC publiques pour éviter les résultats batch manquants", () => {
  const mainSource = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
  expect(mainSource).toContain("maxItems: 1");
  expect(mainSource).toContain("Missing result");
});


it("expose une validation paiement directe pour les dossiers agence et en ligne", () => {
  const dashboardSource = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");
  const managementSource = readFileSync(new URL("./routers/adminCandidateManagement.ts", import.meta.url), "utf8");
  expect(dashboardSource).toContain("confirmPaymentForCandidate");
  expect(dashboardSource).toContain("Valider le paiement");
  expect(managementSource).toContain("confirmPaymentForCandidate");
  expect(managementSource).toContain("VALIDATION_MANUELLE");
  expect(managementSource).toContain("initialPaymentStatus: \"paid\"");
});


describe("rafraîchissement admin après validation hors ligne", () => {
  it("conserve la dernière donnée connue pendant un refetch et distingue une erreur de synchronisation", () => {
    const dashboard = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");
    expect(dashboard).toContain("placeholderData: (previous) => previous");
    expect(dashboard).toContain("retry: 2");
    expect(dashboard).toContain("Impossible de synchroniser la liste");
  });
});


describe("session admin persistante après mutation", () => {
  it("préfère le cookie HttpOnly valide pour la liste et la fiche aux jetons locaux obsolètes", () => {
    const adminRouter = readFileSync(new URL("../server/routers/admin.ts", import.meta.url), "utf8");
    expect(adminRouter).toContain("requireAdminSessionFromCookie(ctx.req.headers.cookie)");
    expect(adminRouter).toContain("admin = await requireValidAdminSession(input.sessionToken)");
  });
});

describe("fallback client session admin périmée", () => {
  it("nettoie les jetons locaux et redirige vers la connexion sur UNAUTHORIZED", () => {
    const dashboard = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");
    expect(dashboard).toContain('localStorage.removeItem("adminSessionToken")');
    expect(dashboard).toContain('sessionStorage.removeItem("adminSessionToken")');
    expect(dashboard).toContain('navigate("/admin/login")');
  });
});

describe("fiche 360 agence après ouverture du paiement", () => {
  it("utilise le cookie HttpOnly avant le jeton local pour getCandidate360", () => {
    const adminRouter = readFileSync(new URL("../server/routers/admin.ts", import.meta.url), "utf8");
    const block = adminRouter.slice(adminRouter.indexOf("  getCandidate360:"), adminRouter.indexOf("  updateCandidate360Workflow:"));
    expect(block).toContain("requireAdminSessionFromCookie(ctx.req.headers.cookie)");
    expect(block).toContain("requireValidAdminSession(input.sessionToken)");
  });
});


describe("AdminGuard — bootstrap sans cookie", () => {
  it("borne la vérification et expose la connexion admin après expiration", () => {
    const guard = readFileSync(adminGuardPath, "utf8");
    expect(guard).toContain("bootstrapTimedOut");
    expect(guard).toContain("setBootstrapTimedOut(true)");
    expect(guard).toContain("!bootstrapTimedOut");
    expect(guard).toContain('navigate("/admin/login")');
  });
});
