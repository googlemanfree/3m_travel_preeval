import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildApprovalPrerequisitesChecklist } from "../shared/approvalChecklist";
import { employerSelectionSettingKey, isEmployerSelected, parseEmployerSelectionSetting } from "../shared/employerSelection";
import { CLIENT_PREVIEW_TOKEN_PREFIX, isClientPreviewTokenFresh } from "../shared/clientPreviewToken";
import { resolveGuidedNextAdminAction } from "../shared/adminStageCatalog";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("améliorations cohérence — sans rewrite dossiers actifs", () => {
  it("stocke la sélection employeur hors tables dossier", () => {
    expect(employerSelectionSettingKey("agency", 15)).toBe("employer_selection:agency:15");
    const parsed = parseEmployerSelectionSetting(JSON.stringify({
      employerName: "Employeur SA",
      positionTitle: "Aide",
      selectedAt: "2026-10-11T00:00:00.000Z",
      selectedBy: "admin@test.com",
      source: "agency",
      sourceId: 15,
    }));
    expect(parsed?.employerName).toBe("Employeur SA");
    expect(isEmployerSelected({ stored: parsed })).toBe(true);
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("recordEmployerSelection: publicProcedure");
    expect(admin).toContain("employerSelectionSettingKey");
    // Ne doit pas écrire secondAgreement* depuis recordEmployerSelection
    expect(admin).toMatch(/recordEmployerSelection:[\s\S]*?agencySettings/);
    expect(read("shared/employerSelection.ts")).toContain("employer_selection:");
  });

  it("expose une sous-étape placement et une checklist avant décision", () => {
    const guided = resolveGuidedNextAdminAction({
      currentStatus: "SUBMITTED",
      paymentConfirmed: true,
      procedureKind: "work",
      employerSelected: false,
      protocolSigned: true,
    });
    expect(guided.subStage).toBe("employer_placement");
    expect(guided.approvalChecklist).toBeTruthy();
    expect(guided.approvalChecklist?.ready).toBe(false);
    const checklist = buildApprovalPrerequisitesChecklist({
      paymentConfirmed: true,
      protocolSigned: true,
      documentsReady: true,
      checklistPercent: 100,
      procedureKind: "work",
      employerSelected: true,
      secondProtocolReady: true,
      secondProtocolSigned: true,
    });
    expect(checklist.ready).toBe(true);
  });

  it("jeton d’aperçu TTL + route plein écran", () => {
    expect(CLIENT_PREVIEW_TOKEN_PREFIX).toBe("client_preview_token:");
    expect(isClientPreviewTokenFresh({
      token: "abc",
      candidateId: "online_1",
      adminEmail: "a@b.c",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      createdAt: new Date().toISOString(),
    })).toBe(true);
    expect(isClientPreviewTokenFresh({
      token: "abc",
      candidateId: "online_1",
      adminEmail: "a@b.c",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      createdAt: new Date().toISOString(),
    })).toBe(false);
    expect(read("server/routers/admin.ts")).toContain("mintClientSpacePreviewToken");
    expect(read("client/src/App.tsx")).toContain("/admin/apercu-espace-client");
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("ClientPhaseGauge");
  });

  it("bloque la décision favorable travail sans employeur (smoke)", () => {
    const blocked = resolveGuidedNextAdminAction({
      currentStatus: "SUBMITTED",
      paymentConfirmed: true,
      procedureKind: "work",
      employerSelected: false,
    });
    expect(blocked.canAdvance).toBe(false);
    expect(blocked.code).toBe("employer_selection");
    const unlocked = resolveGuidedNextAdminAction({
      currentStatus: "SUBMITTED",
      paymentConfirmed: true,
      protocolSigned: true,
      documentsReady: true,
      checklistPercent: 100,
      procedureKind: "work",
      employerSelected: true,
      secondProtocolReady: false,
      secondProtocolSigned: false,
    });
    expect(unlocked.canAdvance).toBe(true);
    expect(unlocked.nextStage).toBe("APPROVED");
  });
});
