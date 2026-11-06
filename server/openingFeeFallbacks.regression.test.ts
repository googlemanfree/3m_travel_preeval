import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("frais d'ouverture : aucun montant de repli écrit en dur dans les écrans et services de paiement", () => {
  const files = [
    "client/src/components/PaymentSection.tsx",
    "client/src/pages/CinetPayPayment.tsx",
    "client/src/pages/PaymentSuccess.tsx",
    "server/services/paymentPackage.ts",
  ];

  it.each(files)("%s n'écrit pas 65000 en dur", (file) => {
    expect(read(file)).not.toMatch(/\b65[_ ]?000\b/);
  });

  it("le serveur renvoie le montant proposé selon le visa quand le dossier n'en a pas encore", () => {
    expect(read("server/routers/payment.ts")).toContain("paymentAmount: application.paymentAmount ?? proposedOpeningFee(application.visaType)");
    expect(read("server/routers/application.ts")).toContain("paymentAmount: app.paymentAmount ?? proposedOpeningFee(visaType)");
    expect(read("server/services/paymentPackage.ts")).toContain("audited || proposedOpeningFee(dossier.visaType)");
  });

  it("les écrans réutilisent la constante partagée plutôt qu'un nombre", () => {
    for (const file of files.slice(0, 3)) {
      expect(read(file)).toContain("DEFAULT_OPENING_FEE_XAF");
    }
  });
});
