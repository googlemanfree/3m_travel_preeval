import { describe, expect, it } from "vitest";
import { buildCountryComplianceStats, getAuditorRecipients } from "./complianceMonthlyReportJob";

describe("buildCountryComplianceStats", () => {
  it("agrège les documents par pays et statut sans exposer de données candidates", () => {
    const stats = buildCountryComplianceStats([
      { destinationCountry: "Canada", destinationCategory: "canada", verificationStatus: "approved" },
      { destinationCountry: "Canada", destinationCategory: "canada", verificationStatus: "pending" },
      { destinationCountry: null, destinationCategory: "schengen", verificationStatus: "rejected" },
    ]);

    expect(stats.Canada).toEqual({ total: 2, approved: 1, pending: 1, rejected: 0 });
    expect(stats.schengen).toEqual({ total: 1, approved: 0, pending: 0, rejected: 1 });
  });

  it("charge les destinataires auditeurs depuis la configuration serveur", () => {
    expect(getAuditorRecipients()).toContain("hello@3mtravelagency.com");
  });
});
