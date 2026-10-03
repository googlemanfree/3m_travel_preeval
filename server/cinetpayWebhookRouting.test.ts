import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  applicationRows: [] as any[],
  flightOutcome: { outcome: "not_found" } as { outcome: string },
  flightCalls: [] as string[],
  updates: [] as any[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => { const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.applicationRows) }; return chain; } }),
    update: () => ({ set: (values: any) => ({ where: async () => { state.updates.push(values); } }) }),
    insert: () => ({ values: async () => undefined }),
  }),
}));
vi.mock("./emailService", () => ({ sendPaymentConfirmationEmail: async () => undefined }));
vi.mock("./routers/cinetpayFlightPayment", () => ({
  confirmFlightOnlinePaymentByTransactionId: async (id: string) => { state.flightCalls.push(id); return state.flightOutcome; },
}));

import { registerCinetPayWebhook } from "./routers/cinetpayWebhook";

type Handler = (req: any, res: any) => Promise<void>;
async function post(body: Record<string, unknown>) {
  let handler: Handler | null = null;
  registerCinetPayWebhook({ post: (_path: string, fn: Handler) => { handler = fn; } } as never);
  const result: { status: number; json: any } = { status: 0, json: null };
  const res = { status(code: number) { result.status = code; return res; }, json(payload: unknown) { result.json = payload; return res; } };
  await handler!({ body }, res);
  return result;
}

beforeEach(() => {
  state.applicationRows = [];
  state.flightOutcome = { outcome: "not_found" };
  state.flightCalls = [];
  state.updates = [];
  delete process.env.CINETPAY_SITE_ID;
  delete process.env.CINETPAY_API_KEY;
});

describe("webhook CinetPay : aiguillage dossier / vol", () => {
  it("sans identifiant de transaction : 400, aucun chemin vol n'est tenté", async () => {
    const result = await post({});
    expect(result.status).toBe(400);
    expect(state.flightCalls).toEqual([]);
  });

  it("transaction d'un dossier : le chemin vol n'est jamais appelé (chemin dossier inchangé)", async () => {
    state.applicationRows = [{ id: 1, paymentStatus: "PENDING", paymentAmount: 65000 }];
    const result = await post({ cpm_trans_id: "DOSSIER-1" });
    // Clés absentes : le dossier reste en attente (202) — comportement historique.
    expect(result.status).toBe(202);
    expect(state.flightCalls).toEqual([]);
  });

  it("transaction inconnue des dossiers : tente le chemin vol, et répond 200 « OK (flight) » si le vol est confirmé", async () => {
    state.flightOutcome = { outcome: "success" };
    const result = await post({ cpm_trans_id: "3M-FL-X-abc" });
    expect(state.flightCalls).toEqual(["3M-FL-X-abc"]);
    expect(result).toEqual({ status: 200, json: { message: "OK (flight)" } });
  });

  it("vol non encore confirmé ou vérification indisponible : 202, CinetPay pourra réessayer", async () => {
    state.flightOutcome = { outcome: "pending" };
    expect((await post({ cpm_trans_id: "3M-FL-X-abc" })).status).toBe(202);
    state.flightOutcome = { outcome: "unavailable" };
    expect((await post({ cpm_trans_id: "3M-FL-X-abc" })).status).toBe(202);
  });

  it("introuvable partout : 200 « ignored » comme avant", async () => {
    const result = await post({ cpm_trans_id: "INCONNUE" });
    expect(result).toEqual({ status: 200, json: { message: "Transaction not found, ignored" } });
  });
});
