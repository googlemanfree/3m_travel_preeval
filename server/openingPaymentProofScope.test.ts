import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ reads: [] as unknown[][], inserts: [] as any[] }));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => {
      const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => state.reads.shift() ?? [] };
      return chain;
    },
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    delete: () => ({ where: async () => undefined }),
    insert: () => ({ values: async (row: any) => { state.inserts.push(row); return [{ insertId: 1 }]; } }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({
  requireAdminSessionFromCookie: async () => ({ email: "agent@3mtravelagency.com" }),
  requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }),
}));
vi.mock("./emailService", () => ({ sendClientNotificationEmail: async () => true, sendDossierConfirmationEmail: async () => true }));
vi.mock("./storage", () => ({ storagePut: async () => ({ url: "/manus-storage/x", key: "x" }) }));

import { adminCandidateManagementRouter } from "./routers/adminCandidateManagement";

const caller = () => adminCandidateManagementRouter.createCaller({ req: { headers: {} } } as any);
const account = { id: 42, fullName: "Candidat Test", email: "candidat@example.com", dossierStatus: "nouveau" };
const confirm = (proofFileUrl: string) => caller().confirmOpeningPaymentForAccount({ sessionToken: "jeton", candidateId: 42, paymentReference: "TX-1", proofFileUrl });

beforeEach(() => {
  state.reads = [[account], [], []];
  state.inserts = [];
});

describe("preuve de paiement d'ouverture : seulement un fichier déposé pour CE compte", () => {
  it("accepte la preuve déposée par la route dédiée pour ce compte", async () => {
    const result = await confirm("/manus-storage/candidates/opening-payment-proof/42/1760000000000-abcdef-facture.jpg");
    expect(result.success).toBe(true);
  });

  it("refuse la pièce d'un autre candidat, même si l'adresse est valide dans notre stockage", async () => {
    await expect(confirm("/manus-storage/candidates/opening-payment-proof/43/1760000000000-abcdef-facture.jpg")).rejects.toThrow(/Preuve de paiement invalide/);
    expect(state.inserts).toHaveLength(0);
  });

  it("refuse un fichier hors du dossier des preuves (passeport, CV…) et le préfixe trompeur « 42 » collé à un autre numéro", async () => {
    for (const url of ["/manus-storage/applications/intake/cv/1-abc-cv.pdf", "/manus-storage/candidates/passport/42/pass.jpg", "/manus-storage/candidates/opening-payment-proof/420/x.jpg", "https://evil.example.com/x.jpg"]) {
      await expect(confirm(url), url).rejects.toThrow(/Preuve de paiement invalide/);
      state.reads = [[account], [], []];
    }
    expect(state.inserts).toHaveLength(0);
  });
});
