import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CINETPAY_VALIDATOR } from "./services/openingPaymentAutomation";
import { JUSTIFICATIFS_AUTO_ACTOR } from "./services/autoJustificatifsAfterBilan";
import { isEvaluationCompleteForJustificatifs } from "../shared/registrationInfoRequest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Vague 1 — paiement CinetPay + protocole + justificatifs auto", () => {
  it("expose le validateur CinetPay et l’automatisation d’ouverture", () => {
    expect(CINETPAY_VALIDATOR).toBe("CinetPay");
    const service = read("server/services/openingPaymentAutomation.ts");
    expect(service).toContain("runOpeningPaymentAutomation");
    expect(service).toContain("finalizeOnlineOpeningPaymentAfterCinetPay");
    expect(service).toContain("ensureAgencyActiveReference");
    expect(service).toContain("sendReceiptAndProtocol");
  });

  it("webhook + verifyPaymentStatus posent paymentValidated* et lancent le pack", () => {
    const webhook = read("server/routers/cinetpayWebhook.ts");
    expect(webhook).toContain("paymentValidatedAt");
    expect(webhook).toContain("paymentValidatedBy");
    expect(webhook).toContain("CINETPAY_VALIDATOR");
    expect(webhook).toContain("finalizeOnlineOpeningPaymentAfterCinetPay");
    expect(webhook).toContain('paymentStatus === "SUCCESS" && application.agreementSigned && application.evaluationDeliveryStatus === "sent" && Boolean(application.evaluationClientConfirmedAt) ? "paye" : application.dossierStatus');

    const verify = read("server/routers/cinetpayPayment.ts");
    expect(verify).toContain("paymentValidatedAt");
    expect(verify).toContain("finalizeOnlineOpeningPaymentAfterCinetPay");
  });

  it("confirmPayment admin réutilise runOpeningPaymentAutomation (pack + purge EVAL)", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("runOpeningPaymentAutomation");
    expect(router).toContain("evalPurged");
    const confirmBlock = router.slice(
      router.indexOf("confirmPaymentForCandidate:"),
      router.indexOf("getPaymentReceiptA5Html:"),
    );
    expect(confirmBlock).toContain("runOpeningPaymentAutomation");
    expect(confirmBlock).not.toMatch(/packageSent = \(await sendReceiptAndProtocol/);
  });

  it("envoie les justificatifs une fois après bilan (manuel + job)", () => {
    expect(JUSTIFICATIFS_AUTO_ACTOR).toContain("bilan");
    const auto = read("server/services/autoJustificatifsAfterBilan.ts");
    expect(auto).toContain("maybeSendJustificatifsAfterBilan");
    expect(auto).toContain("registration_info_request");
    expect(auto).toContain("justificatifs_info_request_sent");
    expect(auto).toContain("isEvaluationCompleteForJustificatifs");

    const unified = read("server/routers/unifiedRequests.ts");
    expect(unified).toContain("maybeSendJustificatifsAfterBilan");
    expect(unified).toContain("justificatifsAuto");

    const job = read("server/scheduled/evaluationBilanJob.ts");
    expect(job).toContain("maybeSendJustificatifsAfterBilan");

    expect(isEvaluationCompleteForJustificatifs({ evaluationDeliveryStatus: "sent" })).toBe(true);
    expect(isEvaluationCompleteForJustificatifs({ evaluationDeliveryStatus: "draft" })).toBe(false);
  });
});
