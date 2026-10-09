import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("cinq leviers admin — câblage", () => {
  it("expose checklist unifiée, gardes, SLA et protocole 02 dans le serveur", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("buildCountryProcedureDocumentChecklist");
    expect(admin).toContain("summarizeCountryProcedureChecklist");
    expect(admin).toContain("evaluateAdminStageTransition");
    expect(admin).toContain("buildJourneyStepSla");
    expect(admin).toContain("countryProcedureChecklist");
    expect(admin).toContain("journeySla");
    expect(admin).toContain("secondProtocol");
    expect(admin).toContain("siblingProcedures");
    expect(admin).toContain("dualOpportunityHandoff");
  });

  it("active et signe le Protocole N°02", () => {
    const adminMgmt = read("server/routers/adminCandidateManagement.ts");
    const candidate = read("server/routers/candidate.ts");
    expect(adminMgmt).toContain("activateSecondAgreementProtocol");
    expect(adminMgmt).toContain("buildProtocolTwoRichText");
    expect(candidate).toContain("signSecondAgreementProtocol");
    expect(candidate).toContain("showSecondAgreement");
  });

  it("branche l’UI 360° et l’espace client", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    const evaluation = read("client/src/pages/EvaluationSpace.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(workspace).toContain("candidate360-procedure-tabs");
    expect(workspace).toContain("candidate360-checklist-sla");
    expect(workspace).toContain("candidate360-protocol-two");
    expect(workspace).toContain("activateSecondAgreementProtocol");
    expect(evaluation).toContain("signSecondAgreementProtocol");
    expect(evaluation).toContain("client-protocol-two");
    expect(dashboard).toContain("siblingProcedures");
    expect(dashboard).toContain("onSelectSibling");
  });

  it("ajoute la migration SQL des champs Protocole N°02", () => {
    const migration = read("drizzle/0074_second_agreement_protocol.sql");
    const schema = read("drizzle/schema.ts");
    expect(migration).toContain("secondAgreementReadyAt");
    expect(migration).toContain("secondAgreementSigned");
    expect(schema).toContain("secondAgreementEmployer");
    expect(schema).toContain("secondAgreementFormula");
  });
});
