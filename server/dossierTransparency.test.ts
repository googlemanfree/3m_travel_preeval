import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";
import { buildAdminProcedureSnapshot } from "../shared/adminProcedureJourney";
import { buildDossierPhaseTransparency } from "../shared/dossierPhaseTransparency";
import { resolvePublishedGuideSummary } from "../shared/publishedGuideSummaries";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("transparence dossier pays/visa + résumés PDF", () => {
  it("Canada et Luxembourg : résumés PDF dynamiques distincts par visa", () => {
    const canadaWork = resolvePublishedGuideSummary("Canada", "Travail");
    const canadaStudy = resolvePublishedGuideSummary("Canada", "Études");
    const luxWork = resolvePublishedGuideSummary("Luxembourg", "Travail");

    expect(canadaWork?.headline).toMatch(/Canada/i);
    expect(canadaWork?.stepHighlights.some((step) => /EIMT|LMIA|emploi/i.test(step))).toBe(true);
    expect(canadaStudy?.stepHighlights.some((step) => /DLI|admission|études/i.test(step))).toBe(true);
    expect(luxWork?.stepHighlights.some((step) => /ADEM/i.test(step))).toBe(true);
    expect(canadaWork?.overview).not.toEqual(canadaStudy?.overview);
  });

  it("phases agence vs pays/visa selon l’avancement", () => {
    const journey = getEnrichedCandidateJourney("Canada", "Travail");
    const early = buildDossierPhaseTransparency({ journey, completedStepCount: 3 });
    expect(early.phase).toBe("agence");
    expect(early.phaseLabel).toMatch(/agence/i);

    const mid = buildDossierPhaseTransparency({ journey, completedStepCount: 13 });
    expect(mid.phase).toBe("pays_visa");
    expect(mid.countryDone).toBe(0);
    expect(mid.agencyDone).toBe(13);

    const late = buildDossierPhaseTransparency({
      journey,
      completedStepCount: journey.steps.length,
    });
    expect(late.phase).toBe("termine");
  });

  it("snapshot admin expose phase + résumé PDF", () => {
    const snap = buildAdminProcedureSnapshot({
      destination: "Luxembourg",
      visaType: "Travail",
      internalStatus: "documents",
      paymentStatus: "SUCCESS",
      evaluationStatus: "validated",
      evaluationClientConfirmed: true,
    });
    expect(snap.country).toMatch(/Luxembourg/i);
    expect(snap.visaType).toMatch(/Travail/i);
    expect(snap.phaseLabel).toBeTruthy();
    expect(snap.publishedGuide?.summaryOverview).toMatch(/Luxembourg|ADEM|guide/i);
  });

  it("UI : recherche accueil + panneaux résumé + stepper phase", () => {
    expect(read("client/src/pages/Home.tsx")).toContain("HomeSearchBar");
    expect(read("client/src/components/HomeSearchBar.tsx")).toContain('data-testid="home-search"');
    expect(read("client/src/components/ProcedureStepper.tsx")).toContain("stepper-phase-meters");
    expect(read("client/src/components/CandidateCountryJourney.tsx")).toContain("client-phase-meters");
    expect(read("client/src/pages/ProcedureResourceGuide.tsx")).toContain("summarizePdfResource");
    expect(read("client/src/pages/CountryDetailPage.tsx")).toContain("country-published-guide-summary");
  });
});
