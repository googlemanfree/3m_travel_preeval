import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
  return { wheres: 0, sent: 0, rows: [] as any[] };
});

// Le filtre « compte non archivé » est dans la requête : on vérifie qu'elle est bien construite avec deux conditions
// (e-mail ET non archivé) et que, sans ligne retournée, aucun lien n'est envoyé.
const fakeDb = {
  select: () => ({ from: () => ({ where: (condition: unknown) => { state.wheres += 1; (fakeDb as any).last = condition; return { limit: async () => state.rows }; } }) }),
  update: () => ({ set: () => ({ where: async () => undefined }) }),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./emailService", () => ({
  sendVerificationLink: vi.fn(async () => undefined),
  sendVerificationOtp: vi.fn(async () => undefined),
  sendPasswordResetEmail: vi.fn(async () => { state.sent += 1; }),
  sendWelcomeEmail: vi.fn(async () => undefined),
  sendEmailChangeConfirmation: vi.fn(async () => undefined),
}));

import { candidateRouter } from "./routers/candidate";

const caller = () => candidateRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: "10.0.0.9" } } } as any);

describe("candidate.requestPasswordReset : comptes archivés", () => {
  it("aucun lien n'est envoyé quand la requête (qui exclut les comptes archivés) ne retourne aucune ligne", async () => {
    state.rows = [];
    const result: any = await caller().requestPasswordReset({ email: "archive@example.test" });
    expect(result).toMatchObject({ success: true, message: "Si cet email existe, un lien a été envoyé." });
    expect(state.sent).toBe(0);
  });

  it("un compte actif reçoit toujours son lien", async () => {
    state.rows = [{ id: 5, email: "actif@example.test", fullName: "Compte Actif" }];
    await caller().requestPasswordReset({ email: "actif@example.test" });
    expect(state.sent).toBe(1);
  });

  it("garde-fou : la recherche par e-mail de la réinitialisation exclut les comptes archivés", () => {
    const source = readFileSync(resolve(import.meta.dirname, "routers/candidate.ts"), "utf8").replace(/\r/g, "");
    const block = source.slice(source.indexOf("requestPasswordReset: publicProcedure"), source.indexOf("resetPassword: publicProcedure"));
    expect(block).toContain("eq(candidates.email, input.email), isNull(candidates.deletedAt)");
  });
});
