import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  updates: [] as any[],
  inserts: [] as any[],
  emails: [] as any[],
  notified: [] as any[],
  fetchResponses: [] as Array<{ ok: boolean; status?: number; body: any }>,
  fetchCalls: [] as any[],
  nextId: 100,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: (table: any) => { const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) }; return chain; } }),
    update: (table: any) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); state.rows.set(table, (state.rows.get(table) ?? []).map((row) => ({ ...row, ...values }))); } }) }),
    insert: (table: any) => ({ values: async (values: any) => { state.inserts.push({ table, values: { id: state.nextId++, createdAt: new Date(), ...values } }); } }),
  }),
}));
vi.mock("./_core/email", () => ({ sendEmail: async (message: any) => { state.emails.push(message); } }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));

import { agencySettings, flightBookingRequestHistory, flightBookingRequests } from "../drizzle/schema";
import { amountFromFlightData, cinetpayFlightPaymentRouter, confirmFlightOnlinePaymentByTransactionId, emailMismatch, ownershipRefusal } from "./routers/cinetpayFlightPayment";

const caller = () => cinetpayFlightPaymentRouter.createCaller({} as never);
const flightRow = (overrides: Record<string, unknown> = {}) => ({
  id: 5, requestRef: "3M-FL-TEST", candidateEmail: "client@example.com", status: "assigned",
  flightData: { originCity: "Yaoundé", destinationCity: "Paris", totalPrice: 300_000 },
  passengerData: [{ fullName: "Aïcha Nkolo" }],
  onlinePaymentStatus: null, onlinePaymentTransactionId: null, onlinePaymentAmount: null, onlinePaymentCurrency: null, onlinePaymentMethod: null, onlinePaymentDate: null,
  ...overrides,
});
const seed = (row = flightRow()) => state.rows.set(flightBookingRequests, [row]);
const stubFetch = (ok: boolean, body: any) => vi.stubGlobal("fetch", vi.fn(async (...args: any[]) => { state.fetchCalls.push(args); return { ok, json: async () => body }; }));

beforeEach(() => {
  state.rows = new Map();
  state.updates = [];
  state.inserts = [];
  state.emails = [];
  state.notified = [];
  state.fetchCalls = [];
  state.nextId = 100;
  delete process.env.CINETPAY_SITE_ID;
  delete process.env.CINETPAY_API_KEY;
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("propriété d'une réservation : e-mail toujours vérifié, jamais contourné", () => {
  it("emailMismatch compare sans tenir compte de la casse ou des espaces ; ownershipRefusal bloque en plus un billet émis ou une réservation annulée", () => {
    expect(emailMismatch({ candidateEmail: "Client@Example.com" }, " client@example.com ")).toBe(false);
    expect(emailMismatch({ candidateEmail: "client@example.com" }, "autre@example.com")).toBe(true);
    expect(ownershipRefusal(flightRow(), "autre@example.com")).toMatch(/non autorisé/);
    expect(ownershipRefusal(flightRow({ status: "issued" }), "client@example.com")).toMatch(/déjà émis/);
    expect(ownershipRefusal(flightRow({ status: "cancelled" }), "client@example.com")).toMatch(/annulée/);
    expect(ownershipRefusal(flightRow(), "client@example.com")).toBeNull();
  });

  it("le tarif à régler vient du tarif relevé (aller-retour si un retour a été choisi), jamais recalculé ou inventé", () => {
    expect(amountFromFlightData({ totalPrice: 300_000.4 })).toBe(300_000);
    expect(amountFromFlightData({ quotedTotalPrice: 672_000, totalPrice: 300_000 })).toBe(672_000);
    expect(amountFromFlightData({ totalPrice: 0 })).toBeNull();
    expect(amountFromFlightData({})).toBeNull();
    expect(amountFromFlightData(null)).toBeNull();
  });
});

describe("getFlightOnlinePaymentInfo : lecture seule, mais jamais sans vérifier l'e-mail", () => {
  it("un e-mail différent est toujours refusé, même sur une réservation déjà payée ou déjà émise (fuite corrigée)", async () => {
    seed(flightRow({ onlinePaymentStatus: "SUCCESS", onlinePaymentAmount: 300_000 }));
    await expect(caller().getFlightOnlinePaymentInfo({ requestId: 5, candidateEmail: "inconnu@example.com" })).rejects.toThrow(/non autorisé/);
    state.rows = new Map();
    seed(flightRow({ status: "issued", onlinePaymentStatus: "SUCCESS", onlinePaymentAmount: 300_000 }));
    await expect(caller().getFlightOnlinePaymentInfo({ requestId: 5, candidateEmail: "inconnu@example.com" })).rejects.toThrow(/non autorisé/);
  });

  it("le vrai propriétaire peut consulter son paiement même après émission du billet (l'ancien blocage sur le statut est retiré ici)", async () => {
    seed(flightRow({ status: "issued", onlinePaymentStatus: "SUCCESS", onlinePaymentAmount: 300_000 }));
    const result = await caller().getFlightOnlinePaymentInfo({ requestId: 5, candidateEmail: "client@example.com" });
    expect(result).toMatchObject({ status: "SUCCESS", amount: 300_000, passengerName: "Aïcha Nkolo" });
  });

  it("avant tout paiement, le montant est recalculé en direct depuis le tarif relevé", async () => {
    seed();
    const result = await caller().getFlightOnlinePaymentInfo({ requestId: 5, candidateEmail: "client@example.com" });
    expect(result.amount).toBe(300_000);
  });
});

describe("initiateFlightOnlinePayment", () => {
  it("refuse un e-mail différent, un billet déjà émis, une réservation annulée, ou un paiement déjà réussi", async () => {
    seed();
    await expect(caller().initiateFlightOnlinePayment({ requestId: 5, candidateEmail: "autre@example.com" })).rejects.toThrow(/non autorisé/);
    state.rows = new Map(); seed(flightRow({ status: "issued" }));
    await expect(caller().initiateFlightOnlinePayment({ requestId: 5, candidateEmail: "client@example.com" })).rejects.toThrow(/déjà émis/);
    state.rows = new Map(); seed(flightRow({ onlinePaymentStatus: "SUCCESS" }));
    await expect(caller().initiateFlightOnlinePayment({ requestId: 5, candidateEmail: "client@example.com" })).rejects.toThrow(/déjà réglée/);
    state.rows = new Map(); seed(flightRow({ flightData: {} }));
    await expect(caller().initiateFlightOnlinePayment({ requestId: 5, candidateEmail: "client@example.com" })).rejects.toThrow(/Aucun tarif/);
  });

  it("enregistre une transaction PENDING avec un identifiant unique reprenant la référence de la demande, et le vrai tarif relevé", async () => {
    seed();
    const result = await caller().initiateFlightOnlinePayment({ requestId: 5, candidateEmail: "client@example.com" });
    expect(result).toMatchObject({ success: true, amount: 300_000, currency: "XAF", requestRef: "3M-FL-TEST" });
    expect(result.transactionId).toMatch(/^3M-FL-3M-FL-TEST-[0-9a-f]{16}$/);
    expect(state.updates[0].values).toMatchObject({ onlinePaymentStatus: "PENDING", onlinePaymentAmount: 300_000, onlinePaymentTransactionId: result.transactionId });
  });
});

describe("confirmFlightOnlinePaymentByTransactionId : revérifie toujours auprès de CinetPay, jamais sur la seule foi de l'appelant", () => {
  it("transaction introuvable : le dit clairement, n'invente rien", async () => {
    state.rows.set(flightBookingRequests, []);
    expect(await confirmFlightOnlinePaymentByTransactionId("inconnue")).toEqual({ outcome: "not_found" });
  });

  it("déjà confirmée : ne revérifie pas une seconde fois auprès de CinetPay, ne renvoie pas d'e-mail", async () => {
    seed(flightRow({ onlinePaymentStatus: "SUCCESS", onlinePaymentTransactionId: "tx-1" }));
    expect(await confirmFlightOnlinePaymentByTransactionId("tx-1")).toEqual({ outcome: "success" });
    expect(state.fetchCalls).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("clés CinetPay absentes : « unavailable », rien n'est modifié", async () => {
    seed(flightRow({ onlinePaymentTransactionId: "tx-1" }));
    expect(await confirmFlightOnlinePaymentByTransactionId("tx-1")).toEqual({ outcome: "unavailable" });
    expect(state.updates).toHaveLength(0);
  });

  it("CinetPay refuse, ou le montant vérifié ne correspond pas à celui enregistré : « pending », rien n'est modifié", async () => {
    process.env.CINETPAY_SITE_ID = "site"; process.env.CINETPAY_API_KEY = "key";
    seed(flightRow({ onlinePaymentTransactionId: "tx-1", onlinePaymentAmount: 300_000 }));
    stubFetch(true, { code: "00", data: { status: "REFUSED" } });
    expect(await confirmFlightOnlinePaymentByTransactionId("tx-1")).toEqual({ outcome: "pending" });
    state.rows.set(flightBookingRequests, [flightRow({ onlinePaymentTransactionId: "tx-1", onlinePaymentAmount: 300_000 })]);
    stubFetch(true, { code: "00", data: { status: "ACCEPTED", amount: 250_000 } });
    expect(await confirmFlightOnlinePaymentByTransactionId("tx-1")).toEqual({ outcome: "pending" });
    expect(state.updates).toHaveLength(0);
  });

  it("accepté et montant vérifié : marque SUCCESS, journalise, alerte le comptoir et l'administration — sans jamais poser « émis »", async () => {
    process.env.CINETPAY_SITE_ID = "site"; process.env.CINETPAY_API_KEY = "key";
    seed(flightRow({ onlinePaymentTransactionId: "tx-1", onlinePaymentAmount: 300_000, status: "revalidated" }));
    stubFetch(true, { code: "00", data: { status: "ACCEPTED", payment_method: "MOBILE_MONEY", amount: 300_000 } });
    expect(await confirmFlightOnlinePaymentByTransactionId("tx-1")).toEqual({ outcome: "success" });
    expect(state.updates[0].values).toMatchObject({ onlinePaymentStatus: "SUCCESS", onlinePaymentMethod: "MOBILE_MONEY", status: "awaiting_payment" });
    expect(state.inserts[0].values).toMatchObject({ requestId: 5, action: "online_payment_confirmed" });
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].html).toMatch(/300\s000\sXAF/);
    expect(state.notified).toEqual([expect.objectContaining({ type: "payment_received" })]);
  });

  it("un statut déjà avancé (émis, annulé) n'est jamais rétrogradé par la confirmation du paiement", async () => {
    process.env.CINETPAY_SITE_ID = "site"; process.env.CINETPAY_API_KEY = "key";
    for (const status of ["issued", "cancelled"]) {
      state.rows = new Map(); state.updates = [];
      seed(flightRow({ onlinePaymentTransactionId: "tx-1", onlinePaymentAmount: 300_000, status }));
      stubFetch(true, { code: "00", data: { status: "ACCEPTED", amount: 300_000 } });
      await confirmFlightOnlinePaymentByTransactionId("tx-1");
      expect(state.updates[0].values.status).toBe(status);
    }
  });
});
