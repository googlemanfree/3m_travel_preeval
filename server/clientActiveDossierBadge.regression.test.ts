import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("badge de dossier actif côté client", () => {
  it("utilise la référence officielle 3M-AGN pour un dossier agence rattaché par e-mail", () => {
    const source = read("server/routers/candidate.ts");
    expect(source).toContain("dossierNumber: `3M-AGN-${historicalAgencyDossier.id.toString().padStart(4, \"0\")}`");
    expect(source).toContain("const activeAgencyDossierNumber = activeAgencyDossier");
    expect(source).toContain("const dashboardDossierNumber = activeApp?.dossierNumber");
    expect(source).toContain("dossierNumber: dashboardDossierNumber");
    expect(source).toContain("const candidateHasTrackedDossier = Boolean((ctx.candidate as any).dossierNumber)");
    expect(source).toContain("dossierNumber: (ctx.candidate as any).dossierNumber || `COMPTE-${ctx.candidate.id}`");
    expect(source).toContain("const PORTRAIT_DASHBOARD_PATHS = new Set([\"candidate.getClientDashboardSummary\", \"candidate.getMyDossierData\"]);");
  });

  it("conserve le badge branché sur la donnée dossier relue par tRPC", () => {
    const navigation = read("client/src/components/ClientSpaceNavigation.tsx");
    expect(navigation).toContain("trpc.candidate.getClientDashboardSummary.useQuery");
    expect(navigation).toContain("dossierPayload?.candidate?.dossierNumber");
    expect(navigation).toContain("dossierPayload?.activeDossier?.dossierNumber");
    expect(navigation).toContain("dossierPayload?.applications?.[0]?.dossierNumber");
    expect(navigation).toContain("Aucun dossier actif");
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("trpc.candidate.getClientDashboardSummary.useQuery");
    expect(dashboard).toContain("dashboardSummary?.candidate?.dossierNumber");
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
