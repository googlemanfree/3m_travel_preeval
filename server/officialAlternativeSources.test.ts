import { describe, expect, it } from "vitest";
import { OFFICIAL_CONSULAR_PORTALS } from "../client/src/data/officialConsularPortals";

describe("sources gouvernementales des alternatives Gemini", () => {
  it("référence un portail officiel HTTPS pour chaque destination alternative prise en charge", () => {
    const expectedHosts = {
      canada: "canada.ca",
      france: "gouv.fr",
      belgique: "belgium.be",
      allemagne: "diplo.de",
      luxembourg: "public.lu",
      "royaume-uni": "gov.uk",
    } as const;

    for (const [country, expectedHost] of Object.entries(expectedHosts)) {
      const portal = OFFICIAL_CONSULAR_PORTALS[country];
      expect(portal.url).toMatch(/^https:\/\//);
      expect(new URL(portal.url).hostname).toContain(expectedHost);
    }
  });
});
