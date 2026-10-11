import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");

describe("fiche synthèse — surfaces exploitables employeur / agence", () => {
  it("expose le routeur tRPC et les tables de consentement / fiches", () => {
    const routers = read("server/routers.ts");
    const schema = read("drizzle/placementPortalSchema.ts");
    const migration = read("drizzle/0077_candidate_synthesis_sheets.sql");
    expect(routers).toContain("candidateSynthesis:");
    expect(schema).toContain("candidateSynthesisShareConsents");
    expect(schema).toContain("candidateSynthesisSheets");
    expect(schema).toContain("needs_revalidation");
    expect(migration).toContain("candidate_synthesis_sheets");
  });

  it("admin : prévisualisation / validation ; partenaire : téléchargement conditionnel", () => {
    const panel = read("client/src/components/CandidateSynthesisPanel.tsx");
    const button = read("client/src/components/PartnerSynthesisDownloadButton.tsx");
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    const consent = read("client/src/components/PlacementConsentCard.tsx");
    const router = read("server/routers/candidateSynthesis.ts");

    expect(workspace).toContain("CandidateSynthesisPanel");
    expect(panel).toContain("synthesis-validate");
    expect(panel).toContain("synthesis-preview-pdf");
    expect(panel).toContain("Pièces structurées automatiquement");
    expect(button).toContain("partnerGetValidated");
    expect(button).toContain("partnerAvailability");
    expect(consent).toContain("setShareConsent");
    expect(router).toContain("partnerGetValidated");
    expect(router).toContain("getValidatedSynthesisForOrg");
    expect(router).toContain("findLeakedContactSignals");
  });
});
