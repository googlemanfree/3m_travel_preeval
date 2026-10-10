import { describe, expect, it } from "vitest";
import {
  AFRICA_DIGITAL_PRICING_PLANS,
  isUnreasonableDigitalPricing,
  sanitizeDigitalPricingJson,
} from "../shared/digitalServicePricing";

describe("tarifs digitaux Afrique", () => {
  it("reste dans la fourchette 50 000 – 600 000 FCFA", () => {
    expect(AFRICA_DIGITAL_PRICING_PLANS).toHaveLength(3);
    for (const plan of AFRICA_DIGITAL_PRICING_PLANS) {
      expect(isUnreasonableDigitalPricing(JSON.stringify([plan]))).toBe(false);
      expect(plan.launchRange).toMatch(/FCFA/);
    }
    expect(AFRICA_DIGITAL_PRICING_PLANS[0]!.launchRange).toContain("50 000");
    expect(AFRICA_DIGITAL_PRICING_PLANS[2]!.launchRange).toContain("600 000");
  });

  it("remplace les anciennes grilles multi-millions", () => {
    const legacy = JSON.stringify([
      { title: "Vitrine", launchRange: "3 600 000 – 14 500 000 XAF", annualRange: "1 150 000", delivery: "6 sem", subtitle: "x", points: [] },
    ]);
    expect(isUnreasonableDigitalPricing(legacy)).toBe(true);
    const sanitized = sanitizeDigitalPricingJson(legacy);
    expect(sanitized).toContain("Essentiel");
    expect(sanitized).not.toContain("14 500 000");
  });
});
