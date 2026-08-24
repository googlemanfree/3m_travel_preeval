import { describe, expect, it } from "vitest";
import { buildEmailDeliveryTrend30Days } from "./emailDelivery";

describe("buildEmailDeliveryTrend30Days", () => {
  it("calcule le taux sur les remises finalisées sans transformer les attentes en échecs", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    const trend = buildEmailDeliveryTrend30Days([
      { status: "sent", createdAt: new Date("2026-08-24T08:00:00.000Z") },
      { status: "failed", createdAt: new Date("2026-08-24T09:00:00.000Z") },
      { status: "pending", createdAt: new Date("2026-08-24T10:00:00.000Z") },
    ], now);

    const today = trend.at(-1);
    expect(trend).toHaveLength(30);
    expect(today).toMatchObject({ date: "2026-08-24", sent: 1, failed: 1, pending: 1, successRate: 50 });
  });

  it("laisse le taux nul quand aucune remise n’est finalisée", () => {
    const trend = buildEmailDeliveryTrend30Days([
      { status: "pending", createdAt: new Date("2026-08-24T10:00:00.000Z") },
    ], new Date("2026-08-24T12:00:00.000Z"));

    expect(trend.at(-1)?.successRate).toBeNull();
  });
});
