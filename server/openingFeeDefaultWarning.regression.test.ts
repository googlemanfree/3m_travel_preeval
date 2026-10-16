import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r/g, "");

describe("back-office : montant d'ouverture par défaut signalé", () => {
  it("le serveur indique, pour chaque dossier, si un administrateur a fixé le montant (journal « opening_fee_set », sans limite de récence)", () => {
    const source = read("server/routers/application.ts");
    const listApplications = source.slice(source.indexOf("listApplications:"), source.indexOf("adminSetOpeningFee"));
    expect(listApplications).toContain('eq(paymentAuditLogs.action, "opening_fee_set")');
    expect(listApplications).toContain("openingFeeConfirmed: openingFeeSetIds.has(application.id)");
    // La recherche dédiée ne doit pas dépendre de la fenêtre de 5000 lignes récentes du journal général.
    const dedicated = listApplications.slice(listApplications.indexOf("feeSetRows"));
    expect(dedicated.slice(0, dedicated.indexOf("openingFeeSetIds"))).not.toContain(".limit(");
  });

  it("l'écran des paiements avertit tant que le montant n'est pas confirmé, sauf si le paiement est déjà validé", () => {
    const source = read("client/src/components/AdminPaymentManagement.tsx");
    expect(source).toContain("openingFeeConfirmed: Boolean(app.openingFeeConfirmed)");
    expect(source).toContain('payment.paymentStatus !== "SUCCESS" && !payment.openingFeeConfirmed');
    expect(source).toContain("Montant par défaut : à confirmer par écrit au candidat");
  });
});
