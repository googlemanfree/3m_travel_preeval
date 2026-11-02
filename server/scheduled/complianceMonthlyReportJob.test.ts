import { afterEach, describe, expect, it, vi } from "vitest";
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

  afterEach(() => vi.unstubAllEnvs());

  it("charge les destinataires auditeurs depuis la configuration serveur (normalisés, sans doublon ni adresse invalide)", () => {
    vi.stubEnv("COMPLIANCE_AUDITOR_EMAILS", "hello@3mtravelagency.com, Audit@Exemple.com ,hello@3mtravelagency.com, pas-une-adresse");
    expect(getAuditorRecipients()).toEqual(["hello@3mtravelagency.com", "audit@exemple.com"]);
  });

  it("sans configuration, aucun destinataire n'est inventé", () => {
    vi.stubEnv("COMPLIANCE_AUDITOR_EMAILS", "");
    expect(getAuditorRecipients()).toEqual([]);
  });
});
