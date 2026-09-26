import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  inserts: [] as Array<{ table: any; values: any }>,
  emails: [] as any[],
  failEmail: false,
}));

vi.mock("./_core/email", () => ({
  sendEmail: async (message: any) => {
    if (state.failEmail) throw new Error("smtp down");
    state.emails.push(message);
  },
}));
vi.mock("./utils/paymentReceipt", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./utils/paymentReceipt")>()),
  buildPaymentReceiptPdf: async () => Buffer.from("%PDF-recu"),
}));
vi.mock("./agreementProtocolPdfService", () => ({
  createAgreementProtocolOnePdf: async () => ({ key: "k", url: "https://files.example/protocole.pdf", bytes: Buffer.from("%PDF-protocole") }),
}));

import { agencyDossierDocuments, agencyDossiers, applications, clientDocuments, paymentAuditLogs, paymentReceiptApprovals } from "../drizzle/schema";
import { clientNotifications } from "../drizzle/caseTrackingSchema";
import { sendReceiptAndProtocol } from "./services/paymentPackage";
import { buildPaymentPackageEmail } from "./services/paymentPackageEmail";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

const fakeDb = {
  select: (projection?: unknown) => ({
    from: (table: any) => {
      const rows = () => {
        const all = state.rows.get(table) ?? [];
        // « Déjà envoyé ? » : projection sur le journal des paiements, on ne renvoie que l'envoi groupé.
        if (table === paymentAuditLogs && projection) return all.filter((row) => row.action === "receipt_protocol_sent");
        return all;
      };
      const chain: any = { where: () => chain, orderBy: () => chain, limit: async () => rows().slice(0, 1) };
      return chain;
    },
  }),
  insert: (table: any) => ({
    values: async (values: any) => {
      state.inserts.push({ table, values });
      state.rows.set(table, [...(state.rows.get(table) ?? []), values]);
    },
  }),
} as any;

const application = (overrides: Record<string, unknown> = {}) => ({
  id: 12,
  email: "aicha@example.com",
  fullName: "Aïcha Nkolo",
  dossierNumber: "3M-2026-0012",
  paymentStatus: "SUCCESS",
  paymentAmount: 65000,
  paymentConfirmedAmount: 65000,
  paymentCurrency: "XAF",
  paymentDate: new Date("2026-09-24T10:00:00Z"),
  paymentMethod: "VIREMENT_BANCAIRE",
  paymentTransactionId: "VIR-123",
  destination: "Canada",
  visaType: "etudes",
  whatsappNumber: "+237698104832",
  candidateId: 7,
  ...overrides,
});

beforeEach(() => {
  state.rows = new Map();
  state.inserts = [];
  state.emails = [];
  state.failEmail = false;
  state.rows.set(applications, [application()]);
});

const auditActions = () => state.inserts.filter((entry) => entry.table === paymentAuditLogs).map((entry) => entry.values.action);

describe("reçu et protocole N°01 envoyés ensemble", () => {
  it("un seul e-mail, avec le reçu ET le protocole en pièces jointes, adressé au candidat", async () => {
    const result = await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" });
    expect(result).toMatchObject({ sent: true, alreadySent: false, dossierNumber: "3M-2026-0012", email: "aicha@example.com" });
    expect(state.emails).toHaveLength(1);
    const [message] = state.emails;
    expect(message.to).toBe("aicha@example.com");
    expect(message.subject).toContain("Reçu de paiement et Protocole d’accord N°01");
    expect(message.attachments.map((attachment: any) => attachment.filename)).toEqual(["Recu-paiement-3M-2026-0012.pdf", "Protocole-accord-01-3M-2026-0012.pdf"]);
    expect(message.attachments.every((attachment: any) => attachment.contentType === "application/pdf" && attachment.content.length > 0)).toBe(true);
    for (const expected of ["Votre reçu de paiement", "Protocole d’accord N°01", "en même temps", "65 000 XAF", "mon-espace?section=signatures"]) expect(message.html, expected).toContain(expected);
  });

  it("le reçu est signé par l'administrateur qui envoie, sans seconde manipulation", async () => {
    await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" });
    const approval = state.inserts.find((entry) => entry.table === paymentReceiptApprovals)!.values;
    expect(approval).toMatchObject({ source: "online", paymentId: 12, approvedByEmail: "agent@3mtravelagency.com", candidateEmail: "aicha@example.com" });
    expect(approval.signatureHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("un reçu déjà validé et signé est réutilisé, pas dupliqué", async () => {
    state.rows.set(paymentReceiptApprovals, [{ approvedAt: new Date("2026-09-24"), signatureLabel: "3M Travel & Services · autre@agence.com", signatureHash: "h".repeat(64) }]);
    await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" });
    expect(state.inserts.filter((entry) => entry.table === paymentReceiptApprovals)).toHaveLength(0);
    expect(state.emails).toHaveLength(1);
  });

  it("le protocole est aussi déposé dans l'espace client et une notification prévient le candidat", async () => {
    await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" });
    const document = state.inserts.find((entry) => entry.table === clientDocuments)!.values;
    expect(document).toMatchObject({ evaluationId: 12, candidateEmail: "aicha@example.com", documentUrl: "https://files.example/protocole.pdf", verificationStatus: "approved" });
    expect(document.documentName).toContain("Protocole d’accord N°01");
    const notification = state.inserts.find((entry) => entry.table === clientNotifications)!.values;
    expect(notification).toMatchObject({ candidateId: 7, actionUrl: "/mon-espace?section=signatures" });
    expect(notification.body).toContain("reçu et le Protocole d’accord N°01");
    expect(auditActions()).toContain("receipt_protocol_sent");
  });

  it("dossier ouvert en agence : le protocole est déposé dans les documents du dossier agence", async () => {
    state.rows.set(agencyDossiers, [{ id: 4, email: "paul@example.com", fullName: "Paul Mbarga", initialPaymentStatus: "paid", destination: "Allemagne", visaType: "travail", phone: "+237600000000", createdAt: new Date("2026-09-20"), updatedAt: new Date("2026-09-21"), lastStatusChangeAt: new Date("2026-09-22") }]);
    const result = await sendReceiptAndProtocol(fakeDb, { source: "agency", id: 4 }, { email: "agent@3mtravelagency.com" });
    expect(result.dossierNumber).toBe("3M-AGN-0004");
    expect(state.emails[0].to).toBe("paul@example.com");
    expect(state.inserts.find((entry) => entry.table === agencyDossierDocuments)!.values).toMatchObject({ dossierId: 4, documentType: "protocole_accord", source: "admin_upload" });
    expect(state.inserts.some((entry) => entry.table === clientNotifications)).toBe(false);
  });

  it("jamais avant la confirmation du paiement : aucun e-mail, aucune écriture", async () => {
    state.rows.set(applications, [application({ paymentStatus: "PENDING" })]);
    await expect(sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(state.emails).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("un second envoi automatique ne crée pas de doublon ; le renvoi explicite repart sans redéposer le protocole", async () => {
    await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" });
    const again = await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" });
    expect(again).toMatchObject({ sent: false, alreadySent: true });
    expect(state.emails).toHaveLength(1);
    const documentsBefore = state.inserts.filter((entry) => entry.table === clientDocuments).length;
    const resend = await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" }, { resend: true });
    expect(resend.sent).toBe(true);
    expect(state.emails).toHaveLength(2);
    expect(state.inserts.filter((entry) => entry.table === clientDocuments)).toHaveLength(documentsBefore);
    expect(auditActions()).toContain("receipt_protocol_resent");
  });

  it("échec d'envoi : erreur claire, échec journalisé, jamais marqué comme envoyé (donc relançable)", async () => {
    state.failEmail = true;
    await expect(sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" })).rejects.toThrow(/n’ont pas pu être envoyés/);
    expect(auditActions()).toContain("receipt_failed");
    expect(auditActions()).not.toContain("receipt_protocol_sent");
    expect(state.inserts.some((entry) => entry.table === clientDocuments)).toBe(false);
    state.failEmail = false;
    expect((await sendReceiptAndProtocol(fakeDb, { source: "online", id: 12 }, { email: "agent@3mtravelagency.com" })).sent).toBe(true);
  });
});

describe("e-mail groupé", () => {
  it("neutralise le HTML et les retours à la ligne saisis dans le nom ou le dossier", () => {
    const { subject, html } = buildPaymentPackageEmail({ fullName: "<img src=x onerror=1>", dossierNumber: "REF\r\nBcc: x@y.z", amountLabel: "65 000 XAF", siteUrl: "https://site.example/", receiptFileName: "r.pdf", protocolFileName: "p.pdf" });
    expect(html).not.toContain("<img");
    expect(subject).not.toMatch(/[\r\n]/);
    expect(html).toContain("https://site.example/mon-espace?section=signatures");
  });

  it("précise que le protocole n'engage qu'une fois signé par le candidat", () => {
    const { html } = buildPaymentPackageEmail({ fullName: "Paul", dossierNumber: "3M-1", amountLabel: "65 000 XAF", siteUrl: "https://site.example", receiptFileName: "r.pdf", protocolFileName: "p.pdf" });
    expect(html).toContain("signez-le dans votre espace client");
    expect(html).toContain("Le traitement de votre dossier commence après cette signature");
  });
});

describe("branchement dans les deux validations de paiement", () => {
  it("la validation en un clic (fiche candidat) et le changement de statut de paiement envoient le lot", () => {
    const management = read("server/routers/adminCandidateManagement.ts");
    const confirm = management.slice(management.indexOf("confirmPaymentForCandidate: publicProcedure"), management.indexOf("sendReceiptAndProtocol: publicProcedure"));
    expect(confirm).toContain("sendReceiptAndProtocol(db, reference");
    expect(confirm.indexOf("sendReceiptAndProtocol(")).toBeGreaterThan(confirm.indexOf("paymentAuditLogs).values"));
    expect(confirm).toContain("packageError");
    const application = read("server/routers/application.ts");
    expect(application).toContain('input.paymentStatus === "SUCCESS" && application.paymentStatus !== "SUCCESS"');
    expect(application).toContain('sendReceiptAndProtocol(db, { source: "online", id: application.id }');
  });

  it("le bouton manuel de l'administration existe pour les paiements confirmés", () => {
    const ui = read("client/src/components/AdminPaymentManagement.tsx");
    expect(ui).toContain('data-testid="send-receipt-and-protocol"');
    expect(ui).toContain("sendReceiptAndProtocol.useMutation()");
  });
});
