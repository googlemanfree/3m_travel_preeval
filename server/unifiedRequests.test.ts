import { describe, expect, it } from "vitest";
import { getUnifiedSlaState, inferUnifiedWorkflow } from "./routers/unifiedRequests";

describe("boîte de réception unifiée", () => {
  it("normalise les statuts métier de sources différentes vers le cycle commun", () => {
    expect(inferUnifiedWorkflow("application", "en_attente_documents")).toBe("documents_review");
    expect(inferUnifiedWorkflow("flight", "awaiting_payment")).toBe("payment_review");
    expect(inferUnifiedWorkflow("application", "bilan_envoye")).toBe("processing");
    expect(inferUnifiedWorkflow("translation", "completed")).toBe("completed");
    expect(inferUnifiedWorkflow("contact", "new")).toBe("qualifying");
    expect(inferUnifiedWorkflow("consultation", "rejected")).toBe("rejected");
  });

  it("signale les délais SLA échus et ne signale plus les demandes clôturées", () => {
    const now = Date.now();
    expect(getUnifiedSlaState({ workflowStatus: "processing", createdAt: new Date(now - 25 * 3_600_000), lastActivityAt: new Date(now - 25 * 3_600_000), firstRespondedAt: null, dueAt: new Date(now - 60_000) })).toBe("overdue");
    expect(getUnifiedSlaState({ workflowStatus: "completed", createdAt: new Date(now - 48 * 3_600_000), lastActivityAt: new Date(now - 24 * 3_600_000), firstRespondedAt: new Date(now - 47 * 3_600_000), dueAt: new Date(now - 24 * 3_600_000) })).toBe("closed");
  });
});
