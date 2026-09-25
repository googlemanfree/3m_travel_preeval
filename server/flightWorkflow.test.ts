import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  row: null as any,
  updates: [] as any[],
  history: [] as any[],
  emails: [] as any[],
  notified: [] as any[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => (state.row ? [state.row] : []) }) }) }),
    update: () => ({ set: (values: any) => ({ where: async () => { state.updates.push(values); } }) }),
    insert: () => ({ values: async (row: any) => { state.history.push(row); } }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("./_core/email", () => ({ sendEmail: async (message: any) => { state.emails.push(message); } }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));

import { flightBookingRouter } from "./routers/flightBooking";
import { buildPaymentDecisionEmail, buildPaymentDeclaredAlert, paymentHintHtml, refusePaymentDecision, refuseStatusChange } from "./services/flightWorkflow";
import { paymentMethodLabel } from "../shared/paymentMethods";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const admin = () => flightBookingRouter.createCaller({ req: { headers: {} } } as any);
const booking = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  requestRef: "FB-2026-ABC123",
  candidateEmail: "client@example.com",
  candidateId: 9,
  flightId: "AT280",
  flightData: { originCity: "Douala", destinationCity: "Paris", departureDate: "2026-11-20" },
  status: "assigned",
  pnrReference: null,
  issuedPdfUrl: null,
  issuanceChecklist: null,
  ...overrides,
});

beforeEach(() => {
  state.row = booking();
  state.updates = [];
  state.history = [];
  state.emails = [];
  state.notified = [];
});

describe("changements de statut permis", () => {
  it("« émis » ne se choisit pas : il vient de l'émission (PNR + checklist + paiement vérifié)", () => {
    expect(refuseStatusChange("awaiting_payment", "issued")).toMatch(/émission/);
    expect(refuseStatusChange("pending_review", "issued")).not.toBeNull();
  });

  it("un billet émis est verrouillé ; les autres changements restent libres", () => {
    expect(refuseStatusChange("issued", "cancelled")).toMatch(/verrouillé/);
    expect(refuseStatusChange("issued", "pending_review")).not.toBeNull();
    expect(refuseStatusChange("issued", "issued")).toBeNull();
    for (const [from, to] of [["pending_review", "assigned"], ["assigned", "needs_info"], ["needs_info", "revalidated"], ["revalidated", "awaiting_payment"], ["awaiting_payment", "cancelled"], ["cancelled", "pending_review"]] as const) {
      expect(refuseStatusChange(from, to), `${from} → ${to}`).toBeNull();
    }
  });

  it("aucune décision de paiement sur un billet émis ou une réservation annulée", () => {
    expect(refusePaymentDecision("issued")).not.toBeNull();
    expect(refusePaymentDecision("cancelled")).not.toBeNull();
    expect(refusePaymentDecision("awaiting_payment")).toBeNull();
  });
});

describe("routeur : parcours de la réservation côté agence", () => {
  it("refuse de marquer « émis » par simple changement de statut : rien n'est écrit, le client n'est pas prévenu", async () => {
    await expect(admin().updateStatus({ sessionToken: "t", requestId: 5, status: "issued" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updates).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("refuse de modifier un billet déjà émis", async () => {
    state.row = booking({ status: "issued", pnrReference: "ABC123" });
    await expect(admin().updateStatus({ sessionToken: "t", requestId: 5, status: "cancelled" })).rejects.toThrow(/verrouillé/);
    expect(state.updates).toHaveLength(0);
  });

  it("« en attente de paiement » : le client reçoit le lien pour payer avec sa référence", async () => {
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "awaiting_payment", details: "Tarif confirmé : 440 000 XAF" });
    expect(state.updates[0]).toMatchObject({ status: "awaiting_payment" });
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].to).toBe("client@example.com");
    expect(state.emails[0].html).toContain("/paiement?ref=FB-2026-ABC123&amp;type=vol");
    expect(state.emails[0].html).toContain("confirmation de réception");
    expect(state.emails[0].html).toContain("Tarif confirmé");
  });

  it("un statut sans paiement à faire n'ajoute pas le bloc de paiement", async () => {
    await admin().updateStatus({ sessionToken: "t", requestId: 5, status: "needs_info" });
    expect(state.emails[0].html).not.toContain("/paiement");
  });

  it("valider le paiement prévient le client ; le rejeter aussi, avec la marche à suivre", async () => {
    state.row = booking({ status: "awaiting_payment" });
    await admin().adminValidatePayment({ sessionToken: "t", requestId: 5, approved: true });
    expect(state.emails[0].subject).toContain("Paiement confirmé");
    expect(state.emails[0].html).toContain("Ceci n’est pas encore un billet");
    await admin().adminValidatePayment({ sessionToken: "t", requestId: 5, approved: false });
    expect(state.emails[1].subject).toContain("Paiement non confirmé");
    expect(state.emails[1].html).toContain("/paiement?ref=FB-2026-ABC123");
    expect(state.history.map((entry) => entry.action)).toEqual(["payment_approved", "payment_rejected"]);
  });

  it("valider un paiement ne peut pas « désémettre » un billet ni rouvrir une annulation", async () => {
    for (const status of ["issued", "cancelled"]) {
      state.row = booking({ status });
      await expect(admin().adminValidatePayment({ sessionToken: "t", requestId: 5, approved: false })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(state.updates).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("on n'émet pas un billet sur une réservation annulée, même checklist complète", async () => {
    state.row = booking({ status: "cancelled", issuanceChecklist: { identity_verified: true, passport_valid: true, fare_revalidated: true, payment_verified: true, pnr_document_ready: true } });
    await expect(admin().updatePnrAndIssuedPdf({ sessionToken: "t", requestId: 5, pnrReference: "ABC123", advisorInitials: "AD" })).rejects.toThrow(/annulée/);
    expect(state.updates).toHaveLength(0);
  });

  it("l'émission reste refusée tant que la checklist n'est pas complète (paiement vérifié inclus)", async () => {
    state.row = booking({ status: "awaiting_payment", issuanceChecklist: { identity_verified: true, passport_valid: true, fare_revalidated: true, payment_verified: false, pnr_document_ready: true } });
    await expect(admin().updatePnrAndIssuedPdf({ sessionToken: "t", requestId: 5, pnrReference: "ABC123", advisorInitials: "AD" })).rejects.toThrow(/checklist/);
    expect(state.updates).toHaveLength(0);
  });
});

describe("e-mails du parcours", () => {
  it("le bloc « comment payer » n'existe que pour les statuts où un paiement est attendu", () => {
    expect(paymentHintHtml("awaiting_payment", "https://site.example", "FB-1")).toContain("https://site.example/paiement?ref=FB-1&amp;type=vol");
    expect(paymentHintHtml("revalidated", "https://site.example/", "FB-1")).toContain("Comment payer");
    for (const status of ["pending_review", "assigned", "needs_info", "issued", "cancelled"] as const) expect(paymentHintHtml(status, "https://site.example", "FB-1")).toBe("");
  });

  it("neutralise le HTML et les retours à la ligne, ne promet aucun billet", () => {
    const { subject, html } = buildPaymentDecisionEmail({ requestRef: "REF\r\nBcc: x@y.z<script>", approved: true, siteUrl: "https://site.example", whatsappDisplay: "+237" });
    expect(subject).not.toMatch(/[\r\n]/);
    expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/billet est émis|votre billet est prêt/i);
  });

  it("l'alerte du comptoir dit que rien n'est validé et affiche le mode et la transaction déclarés", () => {
    const { subject, html } = buildPaymentDeclaredAlert({ requestRef: "FB-1", clientEmail: "c@example.com", method: "orange_money", transactionId: "OM123456", adminUrl: "https://site.example/admin" });
    expect(subject).toContain("FB-1");
    for (const expected of ["Rien n’est validé", "Orange Money", "OM123456", "c@example.com"]) expect(html, expected).toContain(expected);
  });

  it("l'étiquette du mode de paiement couvre les anciens codes et les règlements manuels (plus de « Non spécifié » à tort)", () => {
    expect(paymentMethodLabel("orange_money")).toBe("Orange Money");
    expect(paymentMethodLabel("agency")).toBe("Guichet agence");
    expect(paymentMethodLabel("VIREMENT_BANCAIRE")).toBe("Virement bancaire");
    expect(paymentMethodLabel("DEPOT_MOBILE_MONEY")).toContain("Mobile Money");
    expect(paymentMethodLabel("ESPECES_AGENCE")).toContain("agence");
    expect(paymentMethodLabel(null)).toBe("Non spécifié");
    expect(paymentMethodLabel("quelquechose")).toBe("Autre mode");
  });
});

describe("le client qui déclare un paiement est signalé à l'agence", () => {
  const source = read("server/routers/flightBooking.ts");
  const clientValidate = source.slice(source.indexOf("clientValidate: candidateProcedure"), source.indexOf("adminValidatePayment: publicProcedure"));

  it("cloche admin puis e-mail au comptoir, après l'écriture en base ; l'échec de l'e-mail n'annule pas la déclaration", () => {
    expect(clientValidate.indexOf("db.insert(flightBookingRequestHistory)")).toBeGreaterThan(-1);
    expect(clientValidate.indexOf("notifyAdmins(")).toBeGreaterThan(clientValidate.indexOf("db.insert(flightBookingRequestHistory)"));
    expect(clientValidate).toContain('type: "payment_received"');
    expect(clientValidate).toContain("buildPaymentDeclaredAlert(");
    expect(clientValidate.indexOf("catch (error)")).toBeGreaterThan(clientValidate.indexOf("sendEmail("));
  });

  it("l'admin et le tableau des paiements affichent les modes manuels par leur libellé", () => {
    expect(read("client/src/components/AdminReservationPayments.tsx")).toContain("paymentMethodLabel(");
    expect(read("client/src/pages/FlightAgentDashboard.tsx")).toContain("paymentMethodLabel(request.paymentMethod)");
  });
});
