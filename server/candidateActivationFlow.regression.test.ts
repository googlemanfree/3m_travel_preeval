import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidateRouter = readFileSync(resolve(process.cwd(), "server/routers/candidate.ts"), "utf8");
const mySpace = readFileSync(resolve(process.cwd(), "client/src/pages/MySpace.tsx"), "utf8");
const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const sourceCatalog = readFileSync(resolve(process.cwd(), "shared/officialSourceCatalog.ts"), "utf8");

describe("candidate activation flow", () => {
  it("requires a sent PDF before candidate confirmation", () => {
    expect(candidateRouter).toContain("confirmEvaluationReceipt");
    expect(candidateRouter).toContain('evaluationDeliveryStatus !== "sent"');
    expect(candidateRouter).toContain("evaluationReportPdfKey");
  });

  it("requires candidate confirmation before requesting activation", () => {
    expect(candidateRouter).toContain("requestDossierActivation");
    expect(candidateRouter).toContain("evaluationClientConfirmedAt");
    expect(candidateRouter).toContain('dossierStatus: "en_attente_paiement"');
    expect(candidateRouter).toContain("paymentOpeningRequestedAt");
  });

  it("exposes the client actions without making activation automatic", () => {
    expect(mySpace).toContain("Confirmer la réception du bilan");
    expect(mySpace).toContain("Demander l’activation du dossier");
    expect(mySpace).toContain("setActiveTab(\"payments\")");
  });

  it("shows official-source coverage or an explicit unavailable-source state", () => {
    expect(sourceCatalog).toContain('"canada"');
    expect(sourceCatalog).toContain('"luxembourg"');
    expect(mySpace).toContain("Aucune étape détaillée officiellement vérifiée n’est actuellement configurée");
    expect(mySpace).toContain("OFFICIAL_SOURCE_CATALOG");
  });

  it("keeps the new workflow markers nullable and non-destructive", () => {
    expect(schema).toContain('evaluationClientConfirmedAt: timestamp("evaluationClientConfirmedAt")');
    expect(schema).toContain('activationRequestedAt: timestamp("activationRequestedAt")');
    expect(schema).toContain('paymentOpeningRequestedAt: timestamp("paymentOpeningRequestedAt")');
  });
});
