import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("normalisation automatique des références après paiement", () => {
  it("ne branche la canonicalisation que sur les flux de paiement confirmé", () => {
    const admin = read("server/routers/adminCandidateManagement.ts");
    const application = read("server/routers/application.ts");
    const cinetpay = read("server/routers/cinetpayPayment.ts");

    // Validation admin et CinetPay passent par l'automatisation d'ouverture, qui absorbe EVAL-AG dans la référence 3M.
    expect(admin).toContain("runOpeningPaymentAutomation(db");
    expect(cinetpay).toContain("finalizeOnlineOpeningPaymentAfterCinetPay(db");
    expect(read("server/services/openingPaymentAutomation.ts")).toContain("ensureAgencyActiveReference(db");
    expect(application).toContain('input.paymentStatus === "SUCCESS"');
    expect(application).toContain("normalizeAfterOpeningPayment(db");
    expect(application).toContain("automatic reference normalization failed");
  });

  it("protège le nettoyage historique par un dry-run et une confirmation explicite", () => {
    const script = read("scripts/normalize-unpaid-references.mts");

    expect(script).toContain('const apply = process.argv.includes("--apply")');
    expect(script).toContain('const APPLY_TOKEN = "RESET_UNPAID_REFERENCES"');
    expect(script).toContain("if (apply && confirmed)");
    expect(script).toContain("Aucune écriture effectuée");
    expect(script).toContain('eq(applications.paymentStatus, "SUCCESS")');
    expect(script).toContain('eq(agencyDossiers.initialPaymentStatus, "paid")');
  });
});
