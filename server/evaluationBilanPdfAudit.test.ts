import { describe, expect, it } from "vitest";
import { buildEvaluationPdfAuditLines } from "./evaluationBilanPdfService";

describe("historique intégré au PDF de bilan", () => {
  it("retrace la validation conseiller, les versions et une seconde approbation", () => {
    const lines = buildEvaluationPdfAuditLines(
      { advisorValidatedAt: "2026-08-17T10:00:00.000Z", advisorValidatedByAdminId: 12 },
      [{ versionNumber: 2, createdAt: new Date("2026-08-17T09:00:00.000Z"), createdByAdminAccountId: 7, approvalStatus: "approved", approvedAt: new Date("2026-08-17T10:30:00.000Z"), approvedByAdminId: 18, approvalComment: "Contrôle croisé effectué." }],
    );
    expect(lines.join("\n")).toContain("Validation conseiller");
    expect(lines.join("\n")).toContain("Version 2 enregistrée");
    expect(lines.join("\n")).toContain("seconde approbation");
    expect(lines.join("\n")).toContain("Contrôle croisé effectué.");
  });
});
