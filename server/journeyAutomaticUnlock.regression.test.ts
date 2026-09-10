import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("parcours synchronisé automatique et spécifique au visa", () => {
  it("transmet les jalons paiement/activation au calcul candidat", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/candidate.ts"), "utf8");
    expect(source).toContain("paymentConfirmed: onlineApplication.paymentStatus === \"SUCCESS\"");
    expect(source).toContain("paymentConfirmed: agencyDossier.initialPaymentStatus === \"paid\"");
    expect(source).toContain("activationRequested: context.activationRequested");
    expect(source).toContain("journeyStepIndex(journey, context.dossierStatus, null");
  });

  it("sélectionne un contenu différent selon la destination et le visa", () => {
    const source = readFileSync(resolve(process.cwd(), "shared/candidateJourneyCatalog.ts"), "utf8");
    expect(source).toContain("export function getCandidateJourney");
    expect(source).toContain("if (is(country, \"canada\"))");
    expect(source).toContain("if (is(country, \"luxembourg\"))");
    expect(source).toContain("VERIFIED_EUROPEAN_JOURNEYS.find");
    expect(source).toContain("officialSources");
  });
});
