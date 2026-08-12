import { describe, expect, it } from "vitest";
import { summarizeEmailDeliveryLogs } from "./services/emailDelivery";

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
});
