import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PROTOCOL_MAX_LENGTH,
  PROTOCOL_MIN_LENGTH,
  applyReceiptDraft,
  protocolDraftKey,
  receiptDraftKey,
  validateProtocolContent,
  validateReceiptDraft,
  type ReceiptDraft,
} from "./services/documentDrafts";
import type { Loaded } from "./services/paymentPackage";

const read = (path: string) => readFileSync(path, "utf8");
const valid = { amount: 150000, currency: "XAF", paymentDate: "2026-11-20T10:00:00.000Z", paymentMethod: "Mobile Money", paymentReference: "TX123" };

describe("éditeurs du reçu et du protocole — contrôles de saisie", () => {
  it("accepte un reçu valide et refuse montant nul, devise invalide, date future ou mode vide", () => {
    expect(validateReceiptDraft(valid)).toBeNull();
    expect(validateReceiptDraft({ ...valid, amount: 0 })).toMatch(/supérieur à zéro/);
    expect(validateReceiptDraft({ ...valid, amount: Number.NaN })).toMatch(/supérieur à zéro/);
    expect(validateReceiptDraft({ ...valid, amount: 5_000_000_000 })).toMatch(/trop élevé/);
    expect(validateReceiptDraft({ ...valid, currency: "xaf" })).toMatch(/trois lettres/);
    expect(validateReceiptDraft({ ...valid, paymentDate: "pas une date" })).toMatch(/invalide/);
    expect(validateReceiptDraft({ ...valid, paymentDate: new Date(Date.now() + 3 * 86_400_000).toISOString() })).toMatch(/futur/);
    expect(validateReceiptDraft({ ...valid, paymentMethod: "  " })).toMatch(/mode de paiement/);
  });

  it("borne la longueur du protocole", () => {
    expect(validateProtocolContent("x".repeat(PROTOCOL_MIN_LENGTH))).toBeNull();
    expect(validateProtocolContent("court")).toMatch(/trop court/);
    expect(validateProtocolContent("x".repeat(PROTOCOL_MAX_LENGTH + 1))).toMatch(/trop long/);
  });

  it("un brouillon par document et par dossier", () => {
    expect(receiptDraftKey({ source: "online", id: 12 })).toBe("receipt_draft:online:12");
    expect(protocolDraftKey({ source: "agency", id: 7 })).toBe("protocol_draft:agency:7");
  });
});

describe("éditeurs du reçu et du protocole — application au dossier", () => {
  const dossier = (): Loaded => ({
    email: "a@x.test", fullName: "Aïcha Test", dossierNumber: "3M-0001", amount: 65000, currency: "XAF", paymentDate: new Date("2026-11-01T08:00:00Z"),
    paymentMethod: "Validation administrative", paymentReference: null, destination: "Canada", visaType: "travail", whatsapp: "", candidateId: 7, applicationId: 3, agencyDossierId: null, paymentConfirmed: true,
  });
  const draft: ReceiptDraft = { amount: 150000, currency: "XAF", paymentDate: "2026-11-20T10:00:00.000Z", paymentMethod: "Mobile Money", paymentReference: "TX123", updatedAt: "2026-11-21T00:00:00.000Z", updatedBy: "admin@x.test" };

  it("remplace montant, devise, date, mode et référence, sans toucher à l'identité du dossier", () => {
    const d = dossier();
    applyReceiptDraft(d, draft);
    expect(d).toMatchObject({ amount: 150000, currency: "XAF", paymentMethod: "Mobile Money", paymentReference: "TX123", fullName: "Aïcha Test", dossierNumber: "3M-0001", paymentConfirmed: true });
    expect(d.paymentDate.toISOString()).toBe("2026-11-20T10:00:00.000Z");
  });

  it("sans brouillon, le dossier garde ses valeurs par défaut", () => {
    const d = dossier();
    applyReceiptDraft(d, null);
    expect(d.amount).toBe(65000);
    expect(d.paymentMethod).toBe("Validation administrative");
  });
});

describe("éditeurs du reçu et du protocole — branchements", () => {
  it("l'envoi groupé utilise les brouillons enregistrés et re-signe un reçu dont le montant a changé", () => {
    const service = read("server/services/paymentPackage.ts");
    expect(service).toContain("applyReceiptDraft(dossier, await readReceiptDraft(db, reference));");
    expect(service).toContain("protocolDraft?.content ?? buildProtocolOneRichText");
    expect(service).toContain("approval.amount !== `${dossier.amount} ${dossier.currency}`");
    // l'envoi reste réservé aux paiements confirmés
    expect(service).toContain("Le reçu et le protocole ne partent qu’après confirmation du paiement.");
  });

  it("les aperçus ne conservent rien et chaque procédure exige une session administrateur", () => {
    const router = read("server/routers/adminDocumentDrafts.ts");
    expect(router).toContain("skipStorage: true");
    const procedures = Array.from(router.matchAll(/\n  (\w+): publicProcedure/g), (match) => match[1]);
    expect(procedures).toEqual(["get", "saveReceipt", "resetReceipt", "saveProtocol", "resetProtocol", "previewReceipt", "previewProtocol"]);
    expect((router.match(/await context\(input, ctx\.req\.headers\.cookie\)|= await context\(input, ctx\.req\.headers\.cookie\)/g) ?? []).length).toBe(procedures.length);
    expect(read("server/routers.ts")).toContain("adminDocumentDrafts: adminDocumentDraftsRouter");
    expect(read("server/agreementProtocolPdfService.ts")).toContain("if (input.skipStorage) return { key: \"\", url: \"\", bytes };");
  });

  it("l'éditeur est accessible depuis le bureau reçus & protocoles et la gestion des paiements", () => {
    const editor = read("client/src/components/AdminReceiptProtocolEditor.tsx");
    for (const id of ["receipt-protocol-editor", "receipt-amount", "receipt-preview", "receipt-save", "receipt-reset", "protocol-text", "protocol-preview", "protocol-save", "protocol-reset", "editor-send"]) expect(editor).toContain(id);
    expect(read("client/src/components/AdminContractsReceiptsDesk.tsx")).toContain("receipt-edit-");
    expect(read("client/src/components/AdminPaymentManagement.tsx")).toContain("edit-documents-");
  });
});
