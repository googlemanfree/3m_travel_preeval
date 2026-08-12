import { describe, expect, it } from "vitest";
import { emailErrorPatterns, summarizeEmailDeliveryLogs } from "./services/emailDelivery";

describe("email delivery summary", () => {
  it("compte séparément les succès, échecs et envois en attente", () => {
    expect(summarizeEmailDeliveryLogs([
      { status: "sent" },
      { status: "sent" },
      { status: "failed" },
      { status: "pending" },
      { status: "provider_rejected" },
    ])).toEqual({ total: 5, sent: 2, failed: 1, pending: 1 });
  });

  it("retourne des compteurs nuls pour un journal vide", () => {
    expect(summarizeEmailDeliveryLogs([])).toEqual({ total: 0, sent: 0, failed: 0, pending: 0 });
  });

  it("expose les catégories utilisées par les filtres d’erreur", () => {
    expect(emailErrorPatterns.invalid_recipient).toContain("recipient");
    expect(emailErrorPatterns.domain_unverified).toContain("domain");
    expect(emailErrorPatterns.rate_limit).toContain("rate limit");
    expect(emailErrorPatterns.configuration).toContain("api key");
  });
});
