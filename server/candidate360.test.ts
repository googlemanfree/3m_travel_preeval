import { describe, expect, it } from "vitest";
import { determineCandidate360NextAction, parseCandidate360Labels, procedureChecklistFor } from "./routers/admin";
import { calculateAdvisorWorkload } from "./routers/unifiedRequests";

describe("Fiche Client 360° — règles de pilotage", () => {
  it("privilégie la vérification du paiement avant les autres actions", () => {
    expect(determineCandidate360NextAction({ workflowStatus: "new", paymentStatus: "PENDING", pendingDocuments: 2, openTasks: 0 }).key).toBe("payment");
  });

  it("demande les pièces manquantes lorsque le paiement est validé", () => {
    expect(determineCandidate360NextAction({ workflowStatus: "documents_review", paymentStatus: "SUCCESS", pendingDocuments: 1, openTasks: 0 }).key).toBe("documents");
  });

  it("normalise les étiquettes enregistrées et ignore les contenus invalides", () => {
    expect(parseCandidate360Labels('["Canada", "urgent", 12]')).toEqual(["Canada", "urgent"]);
    expect(parseCandidate360Labels("not-json")).toEqual([]);
  });

  it("combine les exigences de pays et de procédure sans doubler les pièces", () => {
    const checklist = procedureChecklistFor("work_permit", "Canada");
    expect(checklist.label).toBe("Visa / permis de travail");
    expect(checklist.documents.map((item) => item.documentType)).toContain("Offre d’emploi ou contrat");
    expect(new Set(checklist.documents.map((item) => item.documentType.toLowerCase())).size).toBe(checklist.documents.length);
  });

  it("calcule les urgences, retards et blocages par conseiller", () => {
    const now = new Date("2026-08-16T10:00:00Z");
    const [workload] = calculateAdvisorWorkload(
      [{ id: 7, fullName: "Conseiller Test", email: "conseiller@example.com" }],
      [
        { assignedAdminAccountId: 7, priority: "urgent", workflowStatus: "documents_review", dueAt: new Date("2026-08-15T10:00:00Z") },
        { assignedAdminAccountId: 7, priority: "normal", workflowStatus: "processing", dueAt: new Date("2026-08-18T10:00:00Z") },
      ],
      now,
    );
    expect(workload).toMatchObject({ total: 2, urgent: 1, overdue: 1, blocked: 1 });
  });
});
