import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routerSource = readFileSync(resolve(process.cwd(), "server/routers/tourism.ts"), "utf8");
const panelSource = readFileSync(resolve(process.cwd(), "client/src/components/AdminTourismRequests.tsx"), "utf8");

describe("précontrôle du catalogue hôtelier", () => {
  it("sélectionne seulement les fiches importées disposant d’une provenance et d’un lien", () => {
    expect(routerSource).toContain("adminCatalogPrecheck");
    expect(routerSource).toContain('eq(hotelCatalog.verificationStatus, "imported")');
    expect(routerSource).toContain("isNotNull(hotelCatalog.sourceUrl)");
    expect(routerSource).toContain("requiresHumanValidation: true");
  });

  it("présente la file comme une aide sans déclencher une approbation automatique", () => {
    expect(panelSource).toContain("Précontrôle technique");
    expect(panelSource).toContain("Validation humaine requise");
    expect(panelSource).toContain('verificationStatus: "verified"');
  });
});
