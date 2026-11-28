import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AMOUNT_REASON_MIN_LENGTH, amountChangeError } from "./services/documentDrafts";

const read = (path: string) => readFileSync(path, "utf8");

describe("traçabilité des montants : un montant différent exige un motif", () => {
  it("aucun motif requis quand le montant est celui du dossier", () => {
    expect(amountChangeError({ newAmount: 65000, defaultAmount: 65000 })).toBeNull();
    expect(amountChangeError({ newAmount: 65000.4, defaultAmount: 65000 })).toBeNull();
  });

  it("motif obligatoire (5 caractères minimum) quand le montant change", () => {
    expect(AMOUNT_REASON_MIN_LENGTH).toBe(5);
    expect(amountChangeError({ newAmount: 150000, defaultAmount: 65000 })).toMatch(/indiquez le motif/);
    expect(amountChangeError({ newAmount: 150000, defaultAmount: 65000, reason: "  ok " })).toMatch(/indiquez le motif/);
    expect(amountChangeError({ newAmount: 150000, defaultAmount: 65000, reason: "Visa travail Canada" })).toBeNull();
  });

  it("le message donne les deux montants lisibles", () => {
    const message = amountChangeError({ newAmount: 150000, defaultAmount: 65000 }) ?? "";
    expect(message).toMatch(/150\D?000/);
    expect(message).toMatch(/65\D?000/);
  });
});

describe("traçabilité des montants — branchements", () => {
  it("l'éditeur du reçu refuse un montant modifié sans motif et inscrit le changement au journal des paiements", () => {
    const router = read("server/routers/adminDocumentDrafts.ts");
    expect(router).toContain("amountChangeError({ newAmount: values.amount, defaultAmount, reason: values.amountReason })");
    expect(router).toContain('action: "receipt_amount_changed"');
    expect(router).toContain("Motif : ${values.amountReason.trim()}");
  });

  it("l'activation (confirmation du paiement) exige aussi le motif et le consigne", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("amountReason: z.string().trim().max(300).optional()");
    expect(router.match(/amountChangeError\(\{ newAmount: input\.confirmedAmount/g)?.length).toBe(2);
    expect(router).toContain("validation en un clic depuis la fiche candidat.${amountNote}");
  });

  it("les écrans demandent le motif dès que le montant diffère", () => {
    const editor = read("client/src/components/AdminReceiptProtocolEditor.tsx");
    expect(editor).toContain('data-testid="receipt-amount-reason"');
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="activation-reason"');
    expect(dashboard).toContain('data-testid="activation-amount-line"');
    expect(dashboard).toContain("amountReason: activationReason.trim()");
  });
});
