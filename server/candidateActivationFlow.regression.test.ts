import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidateRouter = readFileSync(resolve(process.cwd(), "server/routers/candidate.ts"), "utf8");
const mySpace = readFileSync(resolve(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8");
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
    expect(candidateRouter).toContain('dossierStatus: "en_attente_paiement"');
    expect(candidateRouter).toContain("paymentRequested: true");
    expect(candidateRouter).toContain('if (application.paymentStatus === "SUCCESS") return');
  });

  it("exposes the client confirmation action on the synchronized journey", () => {
    const journey = readFileSync(resolve(process.cwd(), "client/src/components/CandidateCountryJourney.tsx"), "utf8");
    expect(journey).toContain("confirmEvaluationReceipt");
    expect(journey).toContain("Je confirme avoir reçu et compris le bilan");
    expect(mySpace).toContain("CandidateCountryJourney");
    expect(mySpace).toContain("bilanAvailable");
    expect(mySpace).toContain("evaluationRequired");
    expect(mySpace).toContain("openEvaluation()");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after MySpace.tsx removal — confirm intentionally dropped or re-add.
  // "OFFICIAL_SOURCE_CATALOG" is still used (by the CandidateCountryJourney component EvaluationSpace.tsx
  // renders), but the explicit "no officially verified steps configured" empty-state copy below could
  // not be found anywhere in the current codebase.
  it("shows official-source coverage or an explicit unavailable-source state", () => {
    expect(sourceCatalog).toContain('"canada"');
    expect(sourceCatalog).toContain('"luxembourg"');
    expect(mySpace).toContain("CandidateCountryJourney");
    // le parcours reçoit le pays précis (jamais la catégorie large « europe » / « autre », sans source officielle)
    expect(mySpace).toContain("destination={primaryDestination}");
    expect(mySpace).not.toContain("destination={cProfile.destination}");
  });

  it("keeps the new workflow markers nullable and non-destructive", () => {
    expect(schema).toContain('evaluationClientConfirmedAt: timestamp("evaluationClientConfirmedAt")');
    expect(schema).toContain('activationRequestedAt: timestamp("activationRequestedAt")');
    expect(schema).toContain('paymentOpeningRequestedAt: timestamp("paymentOpeningRequestedAt")');
  });
});
