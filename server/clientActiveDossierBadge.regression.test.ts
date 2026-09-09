import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("badge de dossier actif côté client", () => {
  it("utilise la référence officielle 3M-AGN pour un dossier agence rattaché par e-mail", () => {
    const source = read("server/routers/candidate.ts");
    expect(source).toContain("dossierNumber: `3M-AGN-${historicalAgencyDossier.id.toString().padStart(4, \"0\")}`");
    expect(source).toContain("const activeAgencyDossierNumber = activeAgencyDossier");
    expect(source).toContain("dossierNumber: activeApp?.dossierNumber || (candidate as any).dossierNumber || activeAgencyDossierNumber || \"N/A\"");
  });

  it("conserve le badge branché sur la donnée dossier relue par tRPC", () => {
    const navigation = read("client/src/components/ClientSpaceNavigation.tsx");
    expect(navigation).toContain("trpc.candidate.getMyDossierData.useQuery");
    expect(navigation).toContain("dossierPayload?.candidate?.dossierNumber");
    expect(navigation).toContain("dossierPayload?.activeDossier?.dossierNumber");
    expect(navigation).toContain("dossierPayload?.application?.dossierNumber");
    expect(navigation).toContain("Aucun dossier actif");
  });
});

describe("protocole d’accord par défaut", () => {
  it("reste détaillé et inclut le second protocole après sélection", () => {
    const source = read("shared/agreementProtocolContent.ts");
    expect(source).toContain("export const INITIAL_AGREEMENT_PROTOCOL =");
    expect(source).toContain("6. Sélection du candidat et second protocole");
    expect(source).toContain("La signature est autorisée uniquement après confirmation du paiement");
    expect(source).toContain("export const SECOND_AGREEMENT_PROTOCOL_TEMPLATE =");
    expect(source).not.toContain("export const INITIAL_AGREEMENT_PROTOCOL = `export const");
  });
});
