import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("audit boutons / bugs session", () => {
  it("expose un helper de session admin dual-read", () => {
    const helper = read("client/src/lib/adminSession.ts");
    expect(helper).toContain("getAdminSessionToken");
    expect(helper).toContain('localStorage.getItem("adminSessionToken")');
    expect(helper).toContain('sessionStorage.getItem("adminSessionToken")');
  });

  it("lit le jeton admin depuis localStorage et sessionStorage sur les CTAs critiques", () => {
    expect(read("client/src/components/AdminDocumentsManagement.tsx")).toContain("getAdminSessionToken");
    expect(read("client/src/components/AdminNotificationBell.tsx")).toContain("getAdminSessionToken");
    expect(read("client/src/components/DocumentVerificationModal.tsx")).toContain("getAdminSessionToken");
    expect(read("client/src/pages/AdminUserDetails.tsx")).toContain("getAdminSessionToken");
    expect(read("client/src/pages/AdminEvaluations.tsx")).toContain("getAdminSessionToken");
    expect(read("client/src/pages/AdminUsersManagement.tsx")).toContain("getAdminSessionToken");
    expect(read("client/src/components/AdminEmailDeliveryManagement.tsx")).toContain("getAdminSessionToken");
    const changePassword = read("client/src/App.tsx");
    expect(changePassword).toContain('localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken")');
  });

  it("corrige le rejet document et le téléchargement fiche utilisateur", () => {
    const modal = read("client/src/components/DocumentVerificationModal.tsx");
    expect(modal).toContain("setIsLoading(true)");
    expect(modal).not.toMatch(/handleReject[\s\S]*?setIsLoading\(false\);\s*try/);
    const userDetails = read("client/src/pages/AdminUserDetails.tsx");
    expect(userDetails).toContain("anchor.download");
    expect(userDetails).toContain("Télécharger");
  });

  it("redirige l’espace client vers /mon-espace après paiement agence", () => {
    const page = read("client/src/pages/PaymentAgencyConfirmation.tsx");
    expect(page).toContain("navigate('/mon-espace')");
    expect(page).not.toContain("navigate('/client-space')");
  });

  it("branche Accuser réception et les CTAs candidatures morts", () => {
    const email = read("client/src/components/AdminEmailDeliveryManagement.tsx");
    expect(email).toContain("acknowledgeOpenIncidents");
    expect(email).toContain("acknowledgeIncident");
    expect(email).toContain("Accuser réception");

    const candidates = read("client/src/pages/CandidatesManager.tsx");
    expect(candidates).toContain('navigate("/admin/agency-dossiers")');
    expect(candidates).toContain('handleViewDetails(candidate, "info")');
    expect(candidates).toContain('handleViewDetails(candidate, "messages")');
    expect(candidates).toContain("handleArchiveCandidate");
    expect(candidates).toContain("archiveDuplicateRecord");
  });
});
