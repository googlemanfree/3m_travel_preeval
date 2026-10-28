// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { adminLoginUrl, clearAdminSession, getAdminSessionToken, isAdminSessionError, safeAdminNext } from "../client/src/lib/adminSession";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("session administrateur perdue : détection et retour", () => {
  it("reconnaît les messages de session perdue, jamais un simple manque de droit", () => {
    for (const message of ["Session invalide", "Session expirée", "Session administrateur requise.", "session invalide"]) expect(isAdminSessionError({ message }), message).toBe(true);
    for (const message of ["Cette action est réservée au super administrateur.", "Compte administrateur désactivé", "PASSWORD_CHANGE_REQUIRED", "Dossier introuvable.", ""]) expect(isAdminSessionError({ message }), message).toBe(false);
    expect(isAdminSessionError(null)).toBe(false);
    expect(isAdminSessionError(undefined)).toBe(false);
    expect(isAdminSessionError("Session invalide")).toBe(false);
  });

  it("ne renvoie après reconnexion que vers une page de l'administration", () => {
    expect(safeAdminNext("/admin?tab=candidates")).toBe("/admin?tab=candidates");
    expect(safeAdminNext("/admin/digital-services")).toBe("/admin/digital-services");
    for (const bad of ["https://exemple.org", "//exemple.org", "/mon-espace", "/admin/login?next=/admin", "javascript:alert(1)", "", null, undefined, "/admin/../x://y"]) expect(safeAdminNext(bad as string), String(bad)).toBe("/admin");
    expect(adminLoginUrl("/admin?tab=candidates")).toBe("/admin/login?reason=expired&next=%2Fadmin%3Ftab%3Dcandidates");
    expect(adminLoginUrl("https://exemple.org")).toBe("/admin/login?reason=expired&next=%2Fadmin");
  });

  it("lit toujours le jeton partagé entre onglets (le plus récent) avant celui de l'onglet", () => {
    window.sessionStorage.setItem("adminSessionToken", "ancien-jeton-onglet");
    window.localStorage.setItem("adminSessionToken", "jeton-recent-partage");
    expect(getAdminSessionToken()).toBe("jeton-recent-partage");
    window.localStorage.removeItem("adminSessionToken");
    expect(getAdminSessionToken()).toBe("ancien-jeton-onglet");
  });

  it("efface tout le contexte de session périmé", () => {
    for (const key of ["adminSessionToken", "adminEmail", "adminName", "adminType"]) { window.localStorage.setItem(key, "x"); window.sessionStorage.setItem(key, "x"); }
    clearAdminSession();
    for (const key of ["adminSessionToken", "adminEmail", "adminName", "adminType"]) {
      expect(window.localStorage.getItem(key), key).toBeNull();
      expect(window.sessionStorage.getItem(key), key).toBeNull();
    }
  });
});

describe("câblage : toute l'administration réagit à une session perdue", () => {
  it("l'en-tête des appels utilise le même ordre de lecture que les écrans", () => {
    const main = read("client/src/main.tsx");
    expect(main).toContain("const adminToken = getAdminSessionToken();");
    expect(main).not.toContain('sessionStorage.getItem("adminSessionToken") ?? localStorage.getItem("adminSessionToken")');
  });

  it("requêtes et actions en erreur de session renvoient vers la connexion, une seule fois, sans quitter l'administration", () => {
    const main = read("client/src/main.tsx");
    expect(main).toContain("const handleAdminSessionLost = (error: unknown) => {");
    expect((main.match(/handleAdminSessionLost\(error\);/g) ?? []).length).toBe(2);
    expect(main).toContain("adminSessionRedirecting");
    expect(main).toContain('!path.startsWith("/admin") || path.startsWith("/admin/login")');
    expect(main).toContain("window.location.assign(adminLoginUrl(");
  });

  it("la connexion explique la fin de session et ramène à la page d'origine", () => {
    const login = read("client/src/pages/AdminLogin.tsx");
    expect(login).toContain("data-testid=\"admin-session-ended\"");
    expect(login).toContain("navigate(safeAdminNext(new URLSearchParams(window.location.search).get('next')));");
  });

  it("la fiche dossier 360° propose de se reconnecter au lieu d'un échec muet", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="candidate-360-session-ended"');
    expect(dashboard).toContain("isAdminSessionError(error)");
    expect(dashboard).toContain(">Se reconnecter</Button>");
    expect(dashboard).toContain(">Réessayer</Button>");
  });
});
