import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const applicationRouter = readFileSync(resolve(projectRoot, "server/routers/application.ts"), "utf8");
const paymentPanel = readFileSync(resolve(projectRoot, "client/src/components/AdminPaymentManagement.tsx"), "utf8");

describe("envoi de confirmation de paiement administrateur", () => {
  it("impose un paiement validé, un envoi serveur et une trace d’audit", () => {
    expect(applicationRouter).toContain("adminSendPaymentReceipt");
    expect(applicationRouter).toContain('application.paymentStatus !== "SUCCESS"');
    expect(applicationRouter).toContain("sendGenericEmail({");
    expect(applicationRouter).toContain('action: "receipt_failed"');
    expect(applicationRouter).toContain('action: input.deliveryMode === "resend" ? "receipt_resent" : "receipt_sent"');
    expect(applicationRouter).toContain("Confirmation de paiement renvoyée");
    expect(applicationRouter).toContain("paymentReceiptDelivery");
  });

  it("demande une confirmation visible au lieu de simuler une remise e-mail", () => {
    expect(paymentPanel).toContain("Envoyer la confirmation de paiement");
    expect(paymentPanel).toContain("Confirmer l’envoi");
    expect(paymentPanel).toContain("sendPaymentReceiptMutation.mutateAsync");
    expect(paymentPanel).toContain("Reçu envoyé");
    expect(paymentPanel).toContain("Erreur d’envoi");
    expect(paymentPanel).toContain("Renvoyer le reçu après échec");
    expect(paymentPanel).toContain("Reçu non envoyé");
    expect(paymentPanel).toContain("Dernière remise SMTP");
    expect(paymentPanel).toContain("text/csv;charset=utf-8");
    expect(paymentPanel).not.toContain("Simuler l'envoi du reçu");
    expect(paymentPanel).not.toContain("setTimeout(() => {");
  });
});
