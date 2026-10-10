import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildNoEvaluationOutreachDraft } from "../shared/noEvaluationOutreach";
import { buildAdminReferenceView, canonicalizeAdminFolderCode } from "../shared/adminReferenceDisplay";
import { accountReference } from "../shared/caseReference";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("admin ops candidats — outreach, email confirm, références, contrats", () => {
  it("construit un brouillon intelligent pays + accompagnement", () => {
    const draft = buildNoEvaluationOutreachDraft({
      fullName: "Amina NKOLO",
      accountReference: "COMPTE-00042",
      preferredDestinations: ["Canada", "France"],
      visaType: "Études",
      emailVerified: false,
    });
    expect(draft.subject).toContain("COMPTE-00042");
    expect(draft.bodyText).toMatch(/pays de préférence/i);
    expect(draft.bodyText).toMatch(/accompagnement/i);
    expect(draft.bodyText).toMatch(/Canada/);
    expect(draft.suggestedService).toBe("etudes");
    expect(draft.mailtoHref.startsWith("mailto:")).toBe(true);
  });

  it("affiche la référence de compte puis le dossier actif", () => {
    const before = buildAdminReferenceView({ candidateId: 12 });
    expect(before.reference).toBe(accountReference(12));
    expect(before.activated).toBe(false);
    expect(before.secondaryLabel).toMatch(/non activé/i);

    const after = buildAdminReferenceView({
      candidateId: 12,
      agencyDossier: { id: 34, status: "en_cours" },
    });
    expect(after.reference).toBe("3M-AGN-0034");
    expect(after.formerAccountReference).toBe("COMPTE-00012");
    expect(after.secondaryLabel).toContain("COMPTE-00012");
  });

  it("normalise les folderCode COMPTE historiques", () => {
    expect(canonicalizeAdminFolderCode("COMPTE-12", 12)).toBe("COMPTE-00012");
    expect(canonicalizeAdminFolderCode(null, 7)).toBe("COMPTE-00007");
  });

  it("expose forceConfirmEmail, outreach et bureau contrats dans le back-office", () => {
    const activation = read("server/routers/adminActivation.ts");
    const management = read("server/routers/adminCandidateManagement.ts");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    const activationPanel = read("client/src/components/AdminCandidateActivationPanel.tsx");
    expect(activation).toContain("forceConfirmEmail");
    expect(management).toContain("listCandidatesWithoutEvaluation");
    expect(management).toContain("sendNoEvaluationOutreach");
    expect(management).toContain("contractsReceiptsDesk");
    expect(dashboard).toContain("AdminNoEvaluationOutreachPanel");
    expect(dashboard).toContain("AdminContractsReceiptsDesk");
    expect(activationPanel).toContain("Confirmer ici");
    expect(activationPanel).toContain("forceConfirmEmail");
  });
});
