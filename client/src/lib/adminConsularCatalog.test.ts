import { describe, expect, it } from "vitest";
import { ADMIN_CONSULAR_CATALOG, ADMIN_CONSULAR_RESOURCE_TOTAL } from "./adminConsularCatalog";

describe("registre administratif consolidé", () => {
  it("conserve la couverture des 107 guides de la bibliothèque", () => {
    expect(ADMIN_CONSULAR_RESOURCE_TOTAL).toBe(107);
  });

  it("associe le Canada à des guides 3M et à un portail officiel vérifié", () => {
    const canada = ADMIN_CONSULAR_CATALOG.find((entry) => entry.countryName === "Canada");
    expect(canada?.resources.length).toBeGreaterThan(0);
    expect(canada?.verificationStatus).toBe("verifie");
    expect(canada?.officialPortalUrl).toContain("canada.ca");
  });

  it("associe un portail institutionnel vérifié aux guides européens de la bibliothèque", () => {
    const germany = ADMIN_CONSULAR_CATALOG.find((entry) => entry.countryName === "Allemagne");
    expect(germany?.verificationStatus).toBe("verifie");
    expect(germany?.officialPortalUrl).toContain("digital.diplo.de");
    expect(germany?.resources.length).toBeGreaterThan(0);
  });
});
