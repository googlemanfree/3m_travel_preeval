import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateReceiptA5HTML } from "./receiptA5Service";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const state = vi.hoisted(() => ({
  row: undefined as undefined | Record<string, any>,
  updates: [] as any[],
  audits: [] as any[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => { const chain: any = { where: () => chain, limit: () => chain, orderBy: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.row ? [state.row] : []) }; return chain; } }),
    update: () => ({ set: (values: any) => ({ where: async () => { state.updates.push(values); } }) }),
    insert: () => ({ values: async (values: any) => { state.audits.push(values); } }),
  }),
}));

import { applicationRouter } from "./routers/application";

const asAdmin = () => applicationRouter.createCaller({ req: { headers: {} }, res: {}, user: { id: 1, role: "admin", name: "Agent", email: "agent@3mtravelagency.com" } } as any);
const asClient = () => applicationRouter.createCaller({ req: { headers: {} }, res: {}, user: { id: 2, role: "user", name: "Client", email: "client@example.com" } } as any);

const successRow = {
  id: 12,
  dossierNumber: "3M-2026-0012",
  email: "client@example.com",
  paymentStatus: "SUCCESS",
  paymentAmount: 65000,
  paymentExpectedAmount: 65000,
  paymentConfirmedAmount: 65000,
  paymentCurrency: "XAF",
  paymentTransactionId: "OM-OLD",
};

beforeEach(() => {
  state.row = { ...successRow };
  state.updates = [];
  state.audits = [];
});

describe("admin — correction reçu (montant / référence) après validation", () => {
  it("corrige montant et référence d’un paiement SUCCESS sans changer le statut", async () => {
    const result = await asAdmin().adminCorrectPaymentDetails({
      id: 12,
      confirmedAmount: 72000,
      paymentReference: "OM-998877",
      reason: "Erreur de saisie caisse",
    });
    expect(result).toMatchObject({ changed: true, confirmedAmount: 72000, paymentReference: "OM-998877", previousAmount: 65000, previousReference: "OM-OLD" });
    expect(state.updates[0]).toMatchObject({
      paymentConfirmedAmount: 72000,
      paymentAmount: 72000,
      paymentTransactionId: "OM-998877",
    });
    expect(state.audits[0]).toMatchObject({ action: "payment_details_corrected", paymentId: 12 });
    expect(state.audits[0].details).toContain("Erreur de saisie caisse");
  });

  it("refuse un non-admin et un dossier non validé", async () => {
    await expect(asClient().adminCorrectPaymentDetails({ id: 12, confirmedAmount: 72000, reason: "essai" })).rejects.toThrow(/administrateurs/);
    state.row = { ...successRow, paymentStatus: "PENDING" };
    await expect(asAdmin().adminCorrectPaymentDetails({ id: 12, confirmedAmount: 72000, reason: "essai long" })).rejects.toThrow(/après validation/);
  });

  it("l’UI admin expose la correction et l’impression A5 pour les paiements validés", () => {
    const payments = read("client/src/components/AdminPaymentManagement.tsx");
    expect(payments).toContain('data-testid="correct-payment-details"');
    expect(payments).toContain("adminCorrectPaymentDetails");
    expect(payments).toContain('data-testid="print-receipt-a5-payments"');
    expect(payments).toContain("createObjectURL");
    expect(payments).not.toContain('noopener,noreferrer');
  });
});

describe("admin — impression reçu A5", () => {
  it("le HTML A5 inclut la référence de paiement", () => {
    const html = generateReceiptA5HTML({
      receiptNumber: "REC-A5-3M-1",
      date: new Date("2026-03-01T10:00:00Z"),
      time: "11:00",
      candidateName: "Jean Dupont",
      amount: "72000",
      currency: "XAF",
      paymentMethod: "Orange Money",
      paymentReference: "OM-998877",
    });
    expect(html).toContain("OM-998877");
    expect(html).toContain("Référence");
  });

  it("Candidate360 et AdminDashboard n’utilisent plus noopener (qui renvoyait null)", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(workspace).toContain("createObjectURL");
    expect(workspace).not.toContain('noopener,noreferrer');
    expect(dashboard).toContain("createObjectURL");
    expect(dashboard).not.toContain('noopener,noreferrer');
    expect(workspace).toContain('data-testid="candidate360-receipt-correct"');
  });

  it("getPaymentReceiptA5Html transmet la référence au générateur A5", () => {
    const source = read("server/routers/adminCandidateManagement.ts");
    expect(source).toContain("paymentReference = application.paymentTransactionId || null");
    expect(source).toContain("paymentReference,");
  });
});

describe("admin — fiche synthèse visible", () => {
  it("le 360° passe candidates.id (candidateAccountId) et non internalId application", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("candidateAccountId");
    expect(workspace).toContain("summaryCandidateId");
    expect(workspace).toContain("destinationHint=");
    expect(workspace).not.toMatch(/AdminCandidateSummaryCard[^>]*candidateId=\{candidate\.internalId\}/);
  });

  it("getCandidate360 expose candidateAccountId", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("candidateAccountId: candidateRecord?.id ?? null");
  });

  it("adminGetCandidateSummary crée un brouillon si le profil manque ; la carte n’est plus silencieusement nulle", () => {
    const portal = read("server/routers/placementPortal.ts");
    const card = read("client/src/components/AdminCandidateSummaryCard.tsx");
    expect(portal).toContain("ensureSummaryProfile");
    expect(portal).toContain("adminEnsureCandidateSummary");
    expect(card).not.toMatch(/if \(query\.error\) return null/);
    expect(card).toContain('data-testid="summary-ensure-profile"');
    expect(card).toContain("Aucun compte candidat lié");
  });
});
