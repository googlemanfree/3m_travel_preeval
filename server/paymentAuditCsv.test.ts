import { describe, expect, it } from "vitest";
import { paymentAuditLogsToCsv } from "../shared/paymentAuditCsv";

describe("paymentAuditLogsToCsv", () => {
  it("produit un CSV avec les colonnes d’audit et échappe les guillemets", () => {
    const csv = paymentAuditLogsToCsv([
      {
        createdAt: "2026-08-12T10:00:00.000Z",
        adminName: "Admin 3M",
        adminEmail: "admin@3mtravelagency.com",
        action: "confirmed",
        paymentId: 42,
        candidateEmail: "client@example.com",
        amount: "65000 XAF",
        details: 'Validation "agence"',
      },
    ]);

    expect(csv.split("\n")[0]).toContain("Date");
    expect(csv).toContain('"Validation ""agence"""');
    expect(csv).toContain('"42"');
  });

  it("retourne uniquement l’en-tête pour une liste vide", () => {
    expect(paymentAuditLogsToCsv([]).split("\n")).toHaveLength(1);
  });
});
