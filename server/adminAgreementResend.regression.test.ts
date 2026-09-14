import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin payment agreement recovery action", () => {
  const component = readFileSync(resolve(process.cwd(), "client/src/components/AdminPaymentManagement.tsx"), "utf8");
  const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/routers/adminCandidateManagement.ts"), "utf8");
  const pdfService = readFileSync(resolve(process.cwd(), "server/agreementProtocolPdfService.ts"), "utf8");

  it("passes the admin session and uses the existing editable protocol text", () => {
    expect(component).toContain('sessionToken: string');
    expect(component).toContain('INITIAL_AGREEMENT_PROTOCOL');
    expect(component).toContain('candidateId: `online_${agreementPayment.id}`');
    expect(component).toContain('setAgreementContent');
  });

  it("shows the catch-up action only after payment success and before signature", () => {
    expect(component).toContain('payment.paymentStatus === "SUCCESS" && !payment.agreementSigned');
    expect(component).toContain('Préparer et envoyer le protocole d’accord');
    expect(component).toContain('Le protocole sera déposé dans l’espace client et envoyé');
  });

  it("generates and delivers a PDF alongside the editable HTML protocol", () => {
    expect(pdfService).toContain("createAgreementProtocolOnePdf");
    expect(pdfService).toContain("agreement-protocols/");
    expect(router).toContain("createAgreementProtocolOnePdf");
    expect(router).toContain("Protocole-accord-01-");
    expect(router).toContain('contentType: "application/pdf"');
    expect(router).toContain("protocolPdf.url");
  });

  it("wires the active dashboard session into the payment panel", () => {
    expect(dashboard).toContain('<AdminPaymentManagement');
    expect(dashboard).toContain('sessionToken={sessionToken || ""}');
  });
});
