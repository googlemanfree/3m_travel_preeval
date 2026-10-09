import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("portails B2B internationaux", () => {
  it("expose les routes publiques employeurs et agences", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/employeurs"}');
    expect(app).toContain('path={"/agences-placement"}');
    expect(read("shared/b2bPartnerPortals.ts")).toContain('agencies: "/agences-placement"');
    expect(read("shared/b2bPartnerPortals.ts")).toContain('employers: "/employeurs"');
  });

  it("branche le consentement candidat dans mon-espace", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("PlacementConsentCard");
    expect(read("client/src/components/PlacementConsentCard.tsx")).toContain("Retirer mon accord");
  });

  it("sépare les files de profils agence vs employeur", () => {
    const schema = read("drizzle/placementPortalSchema.ts");
    const shared = read("shared/b2bPartnerPortals.ts");
    const router = read("server/routers/placementPortal.ts");
    expect(schema).toContain("eligible_evaluation");
    expect(schema).toContain("top_talent");
    expect(schema).toContain("placement_access_requests");
    expect(shared).toContain('defaultPoolForAudience');
    expect(router).toContain("requestPartnerAccess");
    expect(router).toContain("adminReviewAccessRequest");
    expect(router).toContain("protocolTwoSuggested");
    expect(router).toContain("matchesPreferredPool");
  });

  it("affiche les CTA publics et le formulaire de demande d’accès", () => {
    expect(read("client/src/components/Navbar.tsx")).toContain("/agences-placement");
    expect(read("client/src/components/Footer.tsx")).toContain("/employeurs");
    expect(read("client/src/pages/Home.tsx")).toContain("home-b2b-partners");
    expect(read("client/src/pages/Sitemap.tsx")).toContain("Partenaires B2B");
    expect(read("client/src/components/B2bPartnerAccessRequestForm.tsx")).toContain("requestPartnerAccess");
    expect(read("client/src/pages/EmployerPortal.tsx")).toContain("B2bPartnerAccessRequestForm");
    expect(read("client/src/pages/AgencyPlacementPortal.tsx")).toContain('audience="placement_partner"');
  });

  it("permet à l’admin de revoir les demandes et de lier la sélection au Protocole N°02", () => {
    const admin = read("client/src/components/AdminPlacementPipeline.tsx");
    expect(admin).toContain("adminListAccessRequests");
    expect(admin).toContain("Approuver + accès");
    expect(admin).toContain("profilePool");
    expect(admin).toContain("Protocole N°02");
    expect(admin).toContain("Agence de placement");
  });

  it("indexe les landings B2B pour la découverte internationale", () => {
    const prerender = read("server/publicPrerender.ts");
    expect(prerender).toContain('"/employeurs"');
    expect(prerender).toContain('"/agences-placement"');
    expect(prerender).toContain("Espace employeurs internationaux");
    expect(prerender).toContain("Espace agences de placement");
  });
});
