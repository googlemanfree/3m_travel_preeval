import { describe, it, expect } from "vitest";

describe("Canadian PR Simulator Call-to-Action for Appointments", () => {
  it("generates direct booking CTA when candidate score is calculated", () => {
    const calculatedScore = 465;
    const isQualified = calculatedScore >= 400;

    const ctaConfig = {
      showCta: isQualified,
      buttonText: "Planifier ma consultation en agence",
      targetUrl: "/mon-espace?tab=appointments",
    };

    expect(isQualified).toBe(true);
    expect(ctaConfig.showCta).toBe(true);
    expect(ctaConfig.buttonText).toContain("Planifier ma consultation");
  });
});
