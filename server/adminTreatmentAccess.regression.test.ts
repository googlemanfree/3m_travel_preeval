import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireAdminSessionFromCookie: vi.fn(),
  requireValidAdminSession: vi.fn(),
}));

vi.mock("./routers/adminAuth", () => ({
  requireAdminSessionFromCookie: authMocks.requireAdminSessionFromCookie,
  requireValidAdminSession: authMocks.requireValidAdminSession,
}));

import { requireAdminTreatmentSession } from "./routers/adminCandidateManagement";

describe("accès aux actions de traitement administrateur", () => {
  it("privilégie le cookie sécurisé puis utilise uniquement un jeton validé comme repli", async () => {
    authMocks.requireAdminSessionFromCookie.mockResolvedValueOnce({ email: "admin@3mtravelagency.com" });
    await expect(requireAdminTreatmentSession("admin_session=cookie", "jeton-de-secours")).resolves.toMatchObject({ email: "admin@3mtravelagency.com" });
    expect(authMocks.requireValidAdminSession).not.toHaveBeenCalled();

    authMocks.requireAdminSessionFromCookie.mockRejectedValueOnce(new Error("Cookie non transmis"));
    authMocks.requireValidAdminSession.mockResolvedValueOnce({ email: "admin@3mtravelagency.com" });
    await expect(requireAdminTreatmentSession(undefined, "jeton-de-secours")).resolves.toMatchObject({ email: "admin@3mtravelagency.com" });
    expect(authMocks.requireValidAdminSession).toHaveBeenCalledWith("jeton-de-secours");

    authMocks.requireAdminSessionFromCookie.mockRejectedValueOnce(new Error("Cookie absent"));
    authMocks.requireValidAdminSession.mockRejectedValueOnce(new Error("Session invalide"));
    await expect(requireAdminTreatmentSession(undefined, "jeton-invalide")).rejects.toThrow("Session invalide");
  });

  it("préserve les commandes accessibles dans les écrans 3M Digital et pré-dossier", async () => {
    const [dashboard, digital] = await Promise.all([
      readFile(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8"),
      readFile(new URL("../client/src/pages/AdminDigitalServices.tsx", import.meta.url), "utf8"),
    ]);

    expect(dashboard).toContain('TabsTrigger value="pre-dossiers"');
    expect(dashboard).toContain("AdminPreDossierAccountsPanel sessionToken={sessionToken}");
    expect(dashboard).toContain("Ouvrir le dossier et activer le suivi");
    expect(dashboard).toContain("activatePreDossierAccount.useMutation");
    expect(digital).toContain("Traitement direct");
    expect(digital).toContain("Enregistrer le traitement");
    expect(digital).toContain('aria-label="Statut de la demande 3M Digital"');
  });
});
