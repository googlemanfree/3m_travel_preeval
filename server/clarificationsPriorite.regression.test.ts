import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCandidateCockpit, cockpitTreatFocusId } from "../shared/candidateCockpit";
import { computeNextStep } from "../client/src/lib/nextStep";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("clarifications — priorité client + file admin", () => {
  it("client : dépôt après réponse conseiller dans « À faire maintenant »", () => {
    const step = computeNextStep({
      evaluationRequired: false,
      agreementSignatureRequired: false,
      clarificationUpload: { documentLabel: "Acte de naissance" },
    });
    expect(step.id).toBe("clarification-upload");
    expect(step.action).toEqual({ kind: "section", section: "documents" });

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("clarificationUpload:");
    expect(space).toContain("pendingClarificationCount");
    expect(space).toContain("canUpload");
  });

  it("admin Aujourd’hui : compteur et priorités clarifications", () => {
    const today = read("client/src/components/AdminTodayDashboard.tsx");
    expect(today).toContain("pendingClarificationCount");
    expect(today).toContain("Clarification à répondre");
    expect(today).toContain("Clarification en retard");
    expect(today).toContain("Clarifications");
  });

  it("listCandidates alimente les compteurs clarifications", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("pendingClarificationsByCandidateId");
    expect(admin).toContain("clarificationFieldsForEmail");
    expect(admin).toContain("pendingClarificationCount");
  });

  it("cockpit 360 : bloqueur + Traiter maintenant → panneau clarifications", () => {
    const cockpit = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      receiptApproved: true,
      protocolSigned: true,
      dossierActivated: true,
      pendingDocuments: 0,
      pendingClarifications: 2,
      clarificationOverdue: true,
      workflowStatus: "processing",
    });
    expect(cockpit.blockers.some((b) => b.code === "clarification_pending")).toBe(true);
    expect(cockpit.nextAction.key).toBe("answer_clarification");
    expect(cockpitTreatFocusId("answer_clarification")).toBe("candidate360-clarifications-panel");
    expect(cockpitTreatFocusId("clarification_pending")).toBe("candidate360-clarifications-panel");

    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain('id="candidate360-clarifications-panel"');
    expect(workspace).toContain('data-testid="candidate360-clarifications-panel"');
  });
});
