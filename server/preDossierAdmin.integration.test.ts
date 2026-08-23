import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  account: {
    id: 701,
    fullName: "Candidate Pré-dossier",
    email: "pre-dossier@example.test",
    phone: "+237698104832",
    destination: "canada",
    dossierStatus: "nouveau",
    evaluationDeclarationStatus: "pending_validation",
    evaluationDeclaredAt: new Date("2026-08-22T10:00:00.000Z"),
    createdAt: new Date("2026-08-22T09:00:00.000Z"),
    updatedAt: new Date("2026-08-22T10:00:00.000Z"),
    emailVerified: false,
    verificationToken: "pending-token",
    verificationExpiresAt: new Date("2026-08-23T10:00:00.000Z"),
    avatarUrl: null,
  },
}));

function makeRows() {
  return {
    select: () => ({
      from: (table: unknown) => ({
        orderBy: () => ({ limit: async () => [] }),
        limit: async () => table ? [state.account] : [],
        where: () => ({
          limit: async () => [state.account],
        }),
      }),
    }),
  };
}

vi.mock("./db", () => ({ getDb: vi.fn(async () => makeRows()) }));
vi.mock("./routers/adminAuth", () => ({
  requireValidAdminSession: vi.fn(async () => ({ id: 1, fullName: "Administrateur test" })),
  deriveCandidateActivationStatus: vi.fn(() => "pending"),
}));
vi.mock("./emailService", () => ({ sendGenericEmail: vi.fn(async () => undefined) }));

import { adminRouter } from "./routers/admin";

describe("back-office — compte pré-dossier avec évaluation déclarée", () => {
  beforeEach(() => {
    state.account.evaluationDeclarationStatus = "pending_validation";
  });

  it("liste un compte sans dossier avec la source et le statut synchronisés", async () => {
    const caller = adminRouter.createCaller({} as any);
    const result = await caller.listCandidates({ sessionToken: "admin-session", limit: 50, offset: 0 });

    expect(result.total).toBe(1);
    expect(result.candidates[0]).toMatchObject({
      id: "account_701",
      source: "ACCOUNT_ONLY",
      evaluationDeclarationStatus: "pending_validation",
      folderCode: "COMPTE-00701",
    });
  });

  it("retourne la fiche pré-dossier déclarée sans ouvrir un dossier opérationnel", async () => {
    const caller = adminRouter.createCaller({} as any);
    const result = await caller.getCandidateDetails({ sessionToken: "admin-session", candidateId: "account_701" });

    expect(result.candidate).toMatchObject({
      id: "account_701",
      source: "ACCOUNT_ONLY",
      evaluationDeclarationStatus: "pending_validation",
      internalStatus: "nouveau",
    });
    expect(result.candidate.evaluationDeclaredAt).toEqual(state.account.evaluationDeclaredAt);
  });
});
