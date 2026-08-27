import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inserted: [] as Array<Record<string, unknown>>,
  selectResults: [] as Array<Array<Record<string, unknown>>>,
}));

const fakeDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => state.selectResults.shift() ?? [],
        orderBy: () => ({
          limit: async () => state.selectResults.shift() ?? [],
        }),
      }),
    }),
  }),
  insert: () => ({
    values: async (values: Record<string, unknown>) => {
      state.inserted.push(values);
    },
  }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./emailService", () => ({ sendVerificationLink: vi.fn(async () => undefined) }));
vi.mock("./portraitVerification", () => ({
  verifyPortraitProof: vi.fn(() => ({ url: "https://storage.example.test/portrait.jpg", captureMethod: "camera" })),
}));

import { candidateRouter } from "./routers/candidate";

const payload = {
  fullName: "Candidate Déclarée",
  email: "candidate.declaree@example.test",
  password: "Motdepasse1!",
  portraitVerificationToken: "p".repeat(64),
};

describe("candidate.register — déclaration d’évaluation préalable", () => {
  beforeEach(() => {
    state.inserted.length = 0;
    state.selectResults.length = 0;
  });

  it("persiste une déclaration en attente de validation lorsque le candidat répond oui", async () => {
    state.selectResults.push([], [], [{ id: 1 }]);
    const caller = candidateRouter.createCaller({} as any);
    const result = await caller.register({ ...payload, evaluationAlreadyCompleted: true });

    expect(result.candidateId).toBe(1);
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0]).toMatchObject({
      evaluationDeclarationStatus: "pending_validation",
      dossierStatus: "nouveau",
    });
    expect(state.inserted[0].evaluationDeclaredAt).toBeInstanceOf(Date);
  });

  it("conserve l’évaluation en cours lorsque le candidat répond non", async () => {
    state.selectResults.push([], [{ id: 1 }]);
    const caller = candidateRouter.createCaller({} as any);
    await caller.register({ ...payload, email: "candidate.en-cours@example.test", evaluationAlreadyCompleted: false });

    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0]).toMatchObject({
      evaluationDeclarationStatus: "not_declared",
      dossierStatus: "nouveau",
      evaluationDeclaredAt: null,
    });
  });

  it("ne valide au rattachement qu’une évaluation déjà revue et remise pour la même adresse", async () => {
    const reviewedAt = new Date("2026-08-27T10:00:00.000Z");
    state.selectResults.push([], [{ reviewedAt }], [{ id: 1 }]);
    const caller = candidateRouter.createCaller({} as any);
    const result = await caller.register({ ...payload, email: "Candidate.Declaree@Example.Test", evaluationAlreadyCompleted: true });

    expect(result.priorEvaluationMatched).toBe(true);
    expect(state.inserted[0]).toMatchObject({
      email: "candidate.declaree@example.test",
      evaluationDeclarationStatus: "validated",
      dossierStatus: "documents",
      evaluationReviewedAt: reviewedAt,
    });
  });
});
