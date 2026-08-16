import { describe, expect, it } from "vitest";
import { determineCandidate360NextAction, parseCandidate360Labels } from "./routers/admin";

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
});
