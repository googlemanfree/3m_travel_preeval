import { describe, expect, it } from "vitest";
import { buildPendingPassportSummary } from "./scheduled/passportPendingWeeklyAlertJob";

describe("buildPendingPassportSummary", () => {
  it("compte les passeports en attente par type", () => {
    const result = buildPendingPassportSummary([
      { documentType: "passport", uploadedAt: new Date("2026-08-01T00:00:00Z") },
      { documentType: "passport", uploadedAt: new Date("2026-08-02T00:00:00Z") },
      { documentType: "passport", uploadedAt: new Date("2026-08-03T00:00:00Z") },
    ]);

    expect(result).toEqual({ total: 3, byType: { passport: 3 } });
  });

  it("retourne un résumé vide sans document en attente", () => {
    expect(buildPendingPassportSummary([])).toEqual({ total: 0, byType: {} });
  });
});
