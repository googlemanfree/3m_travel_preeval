import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_OPENING_FEE_XAF, WORK_VISA_OPENING_FEE_XAF, proposedOpeningFee } from "../shared/openingFee";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * Le webhook CinetPay attendait `proposedOpeningFee(visa)` pour un dossier sans montant, alors que l'initialisation du paiement
 * réclamait 65 000 XAF en dur : un dossier travail sans montant fixé était facturé 65 000 puis refusé comme « montant inattendu ».
 * Tous les chemins de paiement partagent désormais la même proposition.
 */
describe("montant de repli des frais d'ouverture", () => {
  it("un dossier travail sans montant fixé se voit proposer 100 000 XAF, les autres 65 000 XAF", () => {
    expect(proposedOpeningFee("Visa travail")).toBe(WORK_VISA_OPENING_FEE_XAF);
    expect(proposedOpeningFee("Visa études")).toBe(DEFAULT_OPENING_FEE_XAF);
    expect(proposedOpeningFee(null)).toBe(DEFAULT_OPENING_FEE_XAF);
  });

  for (const file of ["server/routers/application.ts", "server/routers/cinetpayPayment.ts", "server/routers/payment.ts", "server/routers/paymentInstructions.ts", "server/services/paymentPackage.ts", "server/routers/cinetpayWebhook.ts"]) {
    it(`${file} ne retombe plus sur un montant unique codé en dur pour un dossier en ligne`, () => {
      const source = read(file);
      expect(source).not.toMatch(/(?:app|application)\.paymentAmount \?\? (?:65000|PAYMENT_AMOUNT|DEFAULT_DOSSIER_AMOUNT|DEFAULT_PAYMENT_AMOUNT)/);
      expect(source).not.toMatch(/paymentConfirmedAmount \?\? (?:app|application)\.paymentAmount \?\? 65000/);
    });
  }

  it("l'initialisation et la vérification CinetPay utilisent la même proposition que le webhook", () => {
    const initiation = read("server/routers/application.ts");
    const webhook = read("server/routers/cinetpayWebhook.ts");
    expect(initiation).toContain("app.paymentAmount ?? proposedOpeningFee(app.visaType)");
    expect(webhook).toContain("application.paymentAmount ?? proposedOpeningFee(application.visaType)");
    expect(read("server/routers/cinetpayPayment.ts")).toContain("application.paymentAmount ?? proposedOpeningFee(application.visaType)");
  });
});
