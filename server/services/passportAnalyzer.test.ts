import { describe, expect, it } from "vitest";
import { analyzePassportDocument } from "./passportAnalyzer";

describe("analyzePassportDocument", () => {
  it("retourne des zones annotées exploitables pour une image de passeport", async () => {
    const result = await analyzePassportDocument(undefined, "passeport.png");

    expect(result.isValid).toBe(true);
    expect(result.readabilityScore).toBeGreaterThanOrEqual(90);
    expect(result.annotatedZones.length).toBeGreaterThan(0);
    expect(result.annotatedZones.some((zone) => zone.id === "z_mrz")).toBe(true);
    expect(result.annotatedZones.every((zone) => zone.x >= 0 && zone.x <= 100)).toBe(true);
  });

  it("signale un format invalide sans le prévalider", async () => {
    const result = await analyzePassportDocument(undefined, "passeport.txt");

    expect(result.isValid).toBe(false);
    expect(result.readabilityScore).toBeLessThan(95);
    expect(result.annotatedZones[0]?.severity).toBe("error");
  });
});
