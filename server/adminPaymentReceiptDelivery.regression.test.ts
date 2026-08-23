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
    expect(applicationRouter).toContain('action: "receipt_sent"');
    expect(applicationRouter).toContain("Confirmation de paiement envoyée après validation manuelle");
  });

  it("demande une confirmation visible au lieu de simuler une remise e-mail", () => {
    expect(paymentPanel).toContain("Envoyer la confirmation de paiement");
    expect(paymentPanel).toContain("Confirmer l’envoi");
    expect(paymentPanel).toContain("sendPaymentReceiptMutation.mutateAsync");
    expect(paymentPanel).not.toContain("Simuler l'envoi du reçu");
    expect(paymentPanel).not.toContain("setTimeout(() => {");
  });
});
