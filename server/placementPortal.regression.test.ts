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
    expect(router).toContain("adminListConsentedCandidates");
    expect(router).toContain("adminCandidateRef");
    expect(router).toContain("placement_pipeline");
    expect(router).toContain("opportunity:");
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
    expect(read("client/src/pages/EmployerPortal.tsx")).toContain("Espace agence de placement");
    expect(read("client/src/pages/EmployerPortal.tsx")).toContain("partner-tab-");
    expect(read("client/src/pages/EmployerPortal.tsx")).toContain("employerSessionInfo");
    expect(read("client/src/App.tsx")).toContain('path={"/employeurs"}');
    expect(read("client/src/components/AdminPlacementPipeline.tsx")).toContain("onOpenCandidate");
    expect(read("client/src/components/AdminPlacementPipeline.tsx")).toContain("adminListConsentedCandidates");
    expect(read("client/src/components/AdminPlacementPipeline.tsx")).toContain("placement-consented-candidate");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("onOpenCandidate={(adminCandidateRef)");
    expect(read("client/src/components/SelectableProfileCard.tsx")).toContain("selectable-opportunity-live");
    expect(read("client/src/components/SelectableProfileCard.tsx")).toContain("clientSpacePolling");
    expect(read("client/src/components/Candidate360Workspace.tsx")).toContain("candidate360-placement-summary");
  });

  it("génère côté serveur les accès employeurs remis après vérification", () => {
    const router = read("server/routers/placementPortal.ts");
    const adminUi = read("client/src/components/AdminPlacementPipeline.tsx");
    expect(router).toContain('randomBytes(12).toString("base64url")');
    expect(router).toContain("Remettez les identifiants par un canal approuvé");
    expect(adminUi).toContain("Générer l’accès vérifié");
    expect(adminUi).toContain("Identifiants à remettre maintenant");
  });

  it("propose une inscription B2B structurée distincte de la connexion", () => {
    const router = read("server/routers/placementPortal.ts");
    const form = read("client/src/components/B2bPartnerRegistrationForm.tsx");
    const agency = read("client/src/pages/PlacementPartnerPortal.tsx");
    const employer = read("client/src/pages/EmployerPortal.tsx");
    const hub = read("client/src/pages/PartnersHub.tsx");
    const corridor = read("shared/talentCorridor.ts");
    const adminUi = read("client/src/components/AdminPlacementPipeline.tsx");
    const migration = read("drizzle/0076_placement_access_requests.sql");
    expect(migration).toContain("placement_access_requests");
    expect(router).toContain("requestPartnerAccess");
    expect(router).toContain("adminReviewAccessRequest");
    expect(router).toContain("Nouvelle inscription partenaire B2B");
    expect(router).toContain('to: "hello@3mtravelagency.com"');
    expect(form).toContain("Identification à l’inscription");
    expect(form).toContain("contactPhone");
    expect(form).toContain("registrationNumber");
    expect(form).toContain("onContinueToLogin");
    expect(form).not.toContain("onSubmitted?.()");
    expect(agency).toContain("B2bPartnerRegistrationForm");
    expect(agency).not.toContain("sendContactEmail");
    expect(employer).toContain('authTab === "register"');
    expect(employer).toContain("onContinueToLogin");
    expect(corridor).toContain('employersRegister: "/employeurs?tab=register"');
    expect(corridor).toContain('agenciesLogin: "/employeurs?tab=login&portal=placement_partner"');
    expect(hub).toContain("CORRIDOR_ROUTES.employersRegister");
    expect(hub).toContain("CORRIDOR_ROUTES.agenciesRegister");
    expect(hub).toContain("CORRIDOR_ROUTES.agenciesLogin");
    expect(agency).toContain("useLanguage");
    expect(agency).toContain("CORRIDOR_ROUTES.agenciesLogin");
    expect(router).toContain("employerSessionInfo");
    expect(router).toContain("organizationType: organization.organizationType");
    expect(adminUi).toContain("Demandes d’identification partenaires");
    expect(adminUi).toContain("Approuver + générer accès");
  });

  it("guide les erreurs de connexion et conserve des liens partenaires accessibles", () => {
    const employer = read("client/src/pages/EmployerPortal.tsx");
    const hub = read("client/src/pages/PartnersHub.tsx");
    expect(employer).toContain('data-testid="partner-login-loading"');
    expect(employer).toContain('data-testid="partner-login-help"');
    expect(employer).toContain("aria-busy={login.isPending}");
    expect(employer).toContain("motion-reduce:animate-none");
    expect(hub).toContain("focus-visible:ring-2");
    expect(hub).toContain("hover:-translate-y-1");
    expect(hub).not.toContain('<a href={CORRIDOR_ROUTES.agencies} className="group');
  });
});
