import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_OPENING_FEE_XAF, OPENING_FEE_UNKNOWN_LABEL, formatXaf, isValidOpeningFee, openingFeeFromSearch, openingFeeLabelFromSearch } from "../shared/openingFee";

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

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r/g, "");
const asAdmin = () => applicationRouter.createCaller({ req: { headers: {} }, res: {}, user: { id: 1, role: "admin", name: "Agent", email: "agent@3mtravelagency.com" } } as any);
const asClient = () => applicationRouter.createCaller({ req: { headers: {} }, res: {}, user: { id: 2, role: "user", name: "Client", email: "client@example.com" } } as any);
const baseRow = { id: 12, dossierNumber: "3M-2026-0012", email: "client@example.com", paymentStatus: "PENDING", paymentAmount: 65000, paymentExpectedAmount: 65000, paymentCurrency: "XAF", paymentTransactionId: null };

beforeEach(() => {
  state.row = { ...baseRow };
  state.updates = [];
  state.audits = [];
});

describe("frais d'ouverture : montant fixé par dossier", () => {
  it("l'administrateur fixe un autre montant : dossier mis à jour (montant demandé ET attendu) et journalisé avec le motif", async () => {
    const result = await asAdmin().adminSetOpeningFee({ id: 12, amount: 40000, reason: "Profil étudiant" });
    expect(result).toMatchObject({ amount: 40000, previousAmount: 65000, changed: true });
    expect(state.updates).toEqual([{ paymentAmount: 40000, paymentExpectedAmount: 40000 }]);
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0]).toMatchObject({ action: "opening_fee_set", paymentId: 12, candidateEmail: "client@example.com", amount: "40 000 XAF" });
    expect(state.audits[0].details).toContain("Profil étudiant");
    expect(state.audits[0].details).toContain("65 000 XAF → 40 000 XAF");
  });

  it("un utilisateur non administrateur est refusé, rien n'est écrit", async () => {
    await expect(asClient().adminSetOpeningFee({ id: 12, amount: 40000, reason: "essai" })).rejects.toThrow(/administrateurs/);
    expect(state.updates).toEqual([]);
  });

  it("refus une fois le paiement validé (il faut d'abord annuler la validation)", async () => {
    state.row = { ...baseRow, paymentStatus: "SUCCESS" };
    await expect(asAdmin().adminSetOpeningFee({ id: 12, amount: 40000, reason: "essai" })).rejects.toThrow(/déjà validé/);
    expect(state.updates).toEqual([]);
  });

  it("montant hors bornes ou motif vide : refusé avant tout accès à la base", async () => {
    await expect(asAdmin().adminSetOpeningFee({ id: 12, amount: 10, reason: "trop bas" })).rejects.toThrow();
    await expect(asAdmin().adminSetOpeningFee({ id: 12, amount: 40000.5, reason: "décimal" })).rejects.toThrow();
    await expect(asAdmin().adminSetOpeningFee({ id: 12, amount: 40000, reason: " " })).rejects.toThrow();
    expect(state.updates).toEqual([]);
  });

  it("dossier introuvable : NOT_FOUND", async () => {
    state.row = undefined;
    await expect(asAdmin().adminSetOpeningFee({ id: 99, amount: 40000, reason: "essai" })).rejects.toThrow(/introuvable/);
  });

  it("même montant : rien n'est modifié ni journalisé", async () => {
    const result = await asAdmin().adminSetOpeningFee({ id: 12, amount: 65000, reason: "inchangé" });
    expect(result.changed).toBe(false);
    expect(state.updates).toEqual([]);
    expect(state.audits).toEqual([]);
  });

  it("une transaction en ligne déjà ouverte à l'ancien montant est libérée ; une référence saisie à la main est conservée", async () => {
    state.row = { ...baseRow, paymentTransactionId: "3M-3M-2026-0012-abcdef" };
    await asAdmin().adminSetOpeningFee({ id: 12, amount: 40000, reason: "Profil étudiant" });
    expect(state.updates[0]).toEqual({ paymentAmount: 40000, paymentExpectedAmount: 40000, paymentTransactionId: null });
    state.updates = [];
    state.row = { ...baseRow, paymentTransactionId: "OM-998877" };
    await asAdmin().adminSetOpeningFee({ id: 12, amount: 40000, reason: "Profil étudiant" });
    expect(state.updates[0]).toEqual({ paymentAmount: 40000, paymentExpectedAmount: 40000 });
  });
});

describe("outil partagé openingFee", () => {
  it("65 000 n'est qu'une valeur par défaut ; les bornes sont strictes", () => {
    expect(DEFAULT_OPENING_FEE_XAF).toBe(65000);
    expect(isValidOpeningFee(40000)).toBe(true);
    expect(isValidOpeningFee(999)).toBe(false);
    expect(isValidOpeningFee(40000.5)).toBe(false);
    expect(isValidOpeningFee("40000")).toBe(false);
    expect(isValidOpeningFee(5_000_001)).toBe(false);
  });

  it("formate avec des espaces ordinaires", () => {
    expect(formatXaf(65000)).toBe("65 000 XAF");
    expect(formatXaf(1250000, "FCFA")).toBe("1 250 000 FCFA");
  });

  it("le montant d'un écran de paiement vient de l'adresse (?montant=) ; sinon formule neutre, jamais 65 000", () => {
    expect(openingFeeFromSearch("?dossier=3M-1&montant=40000")).toBe(40000);
    expect(openingFeeLabelFromSearch("?montant=40000")).toBe("40 000 XAF");
    for (const bad of ["", "?montant=abc", "?montant=-5", "?montant=12", "?montant=1e6", "?montant=99999999999"]) {
      expect(openingFeeFromSearch(bad), bad).toBeNull();
      expect(openingFeeLabelFromSearch(bad), bad).toBe(OPENING_FEE_UNKNOWN_LABEL);
    }
  });
});

describe("plus de montant imposé dans le parcours de paiement", () => {
  it("l'initiation du paiement ne remplace plus le montant du dossier par la constante", () => {
    const source = read("server/routers/payment.ts");
    expect(source).not.toMatch(/paymentAmount: PAYMENT_AMOUNT,/);
    expect(source).not.toMatch(/^\s*amount: PAYMENT_AMOUNT,/m);
    expect(source).toContain("paymentAmount: application.paymentAmount ?? PAYMENT_AMOUNT,");
  });

  it("les écrans /payment/* et l'e-mail de validation n'écrivent plus 65 000 en dur", () => {
    for (const file of [
      "client/src/pages/PaymentAgencyConfirmation.tsx",
      "client/src/pages/PaymentSuccessPage.tsx",
      "client/src/pages/PaymentMethodSelection.tsx",
      "server/routers/paymentValidation.ts",
      "server/routers/candidate.ts",
      "server/routers/oauthUserDashboard.ts",
    ]) {
      expect(read(file), file).not.toMatch(/65[\s .]?000/);
    }
    expect(read("client/src/components/AdminPaymentManagement.tsx")).not.toContain("<strong>65 000 XAF</strong>");
  });

  it("l'administration peut modifier le montant d'un paiement non validé", () => {
    const admin = read("client/src/components/AdminPaymentManagement.tsx");
    expect(admin).toContain('data-testid="edit-opening-fee"');
    expect(admin).toContain("<AdminOpeningFeeDialog");
    expect(read("client/src/components/AdminOpeningFeeDialog.tsx")).toContain("trpc.application.adminSetOpeningFee.useMutation()");
  });
});
