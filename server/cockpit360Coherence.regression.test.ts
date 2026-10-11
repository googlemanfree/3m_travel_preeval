import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { collapseEvalAgencyShellRows, resolveCanonicalAgencyOpenId } from "../shared/evalAgencyShell";

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), "utf8");

describe("cockpit 360 — un seul dossier actif 3M + pilotage cohérent", () => {
  it("fusionne EVAL-AG et 3M-AGN du même id", () => {
    const rows = [
      { id: "online_1", folderCode: "EVAL-AG-240001", source: "WEB" },
      { id: "agency_240001", folderCode: "3M-AGN-240001", source: "AGENCY_PHYSICAL" },
    ];
    expect(collapseEvalAgencyShellRows(rows)).toEqual([
      { id: "agency_240001", folderCode: "3M-AGN-240001", source: "AGENCY_PHYSICAL" },
    ]);
    expect(resolveCanonicalAgencyOpenId({ candidateId: "online_1", folderCode: "EVAL-AG-240001" })).toBe("agency_240001");
  });

  it("câble la redirection et le paiement dans getCandidateDetails / 360", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("collapseEvalAgencyShellRows");
    expect(admin).toContain("redirectToCanonicalAgencyId");
    expect(admin).toContain("payments: [paymentSnapshot]");
    expect(admin).toContain("formerFolderCodes");
  });

  it("lisse le panneau de pilotage et centralise documents / synthèse", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(dashboard).toContain('data-testid="pilotage-decision-panel"');
    expect(dashboard).toContain('data-testid="payment-already-confirmed"');
    expect(dashboard).toContain("Correction avancée du statut");
    expect(dashboard).toContain('data-testid="open-360-documents"');
    expect(workspace).toContain('data-testid="candidate360-documents-hub"');
    expect(workspace).toContain('data-testid="candidate360-overview-summary"');
    expect(workspace).toContain("redirectToCanonicalAgencyId");
  });
});
