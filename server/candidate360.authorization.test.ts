import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbStubs = vi.hoisted(() => {
  const limit = vi.fn().mockResolvedValue([]);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  return { from, where, limit };
});

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn(() => ({ from: dbStubs.from })),
  })),
}));

import { adminRouter } from "./routers/admin";

describe("autorisation des actions sensibles de la fiche dossier 360°", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["absente", "", "BAD_REQUEST", 0],
    ["invalide", "session-invalide", "UNAUTHORIZED", 2],
  ])("refuse une session %s avant toute action sensible", async (_kind, sessionToken, expectedCode, expectedDbChecks) => {
    const caller = adminRouter.createCaller({} as any);

    await expect(caller.sendCandidate360Message({ sessionToken, candidateId: "online_42", content: "Merci de compléter votre document." })).rejects.toMatchObject<Partial<TRPCError>>({ code: expectedCode });
    await expect(caller.updateCandidate360Workflow({ sessionToken, candidateId: "online_42", workflowStatus: "documents_review", priority: "normal", assignedAdminId: null, dueAt: null, labels: [] })).rejects.toMatchObject<Partial<TRPCError>>({ code: expectedCode });
    expect(dbStubs.limit).toHaveBeenCalledTimes(expectedDbChecks);
  });
});
