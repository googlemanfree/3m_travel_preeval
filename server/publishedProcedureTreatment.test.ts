import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";
import {
  getCountryProtocolProfile,
  buildProtocolOneRichText,
} from "../shared/agreementProtocolCountryTemplates";
import {
  resolvePublishedProcedureTreatment,
} from "../shared/publishedProcedureTreatment";
import {
  FEATURED_GUIDE_COUNTRIES,
  getEnrichedProcedureResources,
} from "../shared/procedureGuideEnrichment";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("traitement aligné sur les PDF /guide-procedures", () => {
  it("Canada travail / études : étapes détaillées + PDF publié", () => {
    const travail = resolvePublishedProcedureTreatment("Canada", "Travail");
    expect(travail?.pdfUrl).toContain("VisaTravail_Canada");
    expect(travail?.countrySteps.length).toBeGreaterThanOrEqual(6);
    expect(travail?.countrySteps.some((step) => /EIMT|LMIA/i.test(step.label))).toBe(true);
    expect(travail?.officialSourceUrl).toMatch(/canada\.ca/i);

    const etudes = resolvePublishedProcedureTreatment("Canada", "Études");
    expect(etudes?.pdfUrl).toContain("VisaEtudes_Canada");
    expect(etudes?.countrySteps.some((step) => /DLI|admission/i.test(step.label))).toBe(true);
    expect(etudes?.relatedGuideUrls.some((url) => /Procedure_VisaEtudes_Canada/i.test(url))).toBe(true);
  });

  it("Luxembourg travail : étapes ADEM / Guichet + PDF publié", () => {
    const travail = resolvePublishedProcedureTreatment("Luxembourg", "Travail");
    expect(travail?.pdfUrl).toContain("VisaTravail_Luxembourg");
    expect(travail?.countrySteps.some((step) => /ADEM/i.test(step.label))).toBe(true);
    expect(travail?.officialSourceUrl).toMatch(/guichet\.public\.lu/i);

    const france = resolvePublishedProcedureTreatment("France", "Travail");
    expect(france?.officialSourceUrl).toMatch(/france-visas|diplomatie\.gouv/i);
    expect(france?.pdfUrl).toBeTruthy();
  });

  it("parcours enrichi admin/client : 13 étapes agence + guide Canada + publishedGuide", () => {
    const journey = getEnrichedCandidateJourney("Canada", "Travail");
    expect(journey.steps.length).toBeGreaterThan(13);
    expect(journey.steps.slice(0, 13).some((step) => step.id === "cv_submission")).toBe(true);
    expect(journey.publishedGuide?.pdfUrl).toBeTruthy();
    expect(journey.publishedGuide?.programLabel).toMatch(/travail/i);
    expect(journey.disclaimer).toMatch(/guide publié/i);
  });

  it("protocole d’accord Canada adapté au type de visa", () => {
    const work = getCountryProtocolProfile("Canada", "Travail");
    expect(work.procedureProgramLabel).toMatch(/travail/i);
    expect(work.procedureObjectClause).toMatch(/EIMT|LMIA|IRCC/i);

    const study = getCountryProtocolProfile("Canada", "Études");
    expect(study.procedureProgramLabel).toMatch(/études/i);
    expect(study.employmentAuthority).toMatch(/DLI|établissement/i);

    const text = buildProtocolOneRichText(
      {
        clientNomComplet: "Test Client",
        dossierRef: "3M-TEST-1",
        destinationProjet: "Canada",
        modePaiement: "Agence",
        dateHeurePaiement: "10/10/2026",
        conseillerEmail: "agent@3mtravelagency.com",
        empreinteSha: "abc123",
        clientIpAddress: "127.0.0.1",
        dateDuJour: "10/10/2026",
      },
      "Canada",
      "Études",
    );
    expect(text).toMatch(/Permis d’études/i);
    expect(text).toMatch(/guide de procédure publié/i);
  });

  it("guide-procedures enrichit les PDF avec fiches + sources officielles", () => {
    const resources = getEnrichedProcedureResources();
    expect(resources.length).toBeGreaterThanOrEqual(100);
    const canadaWork = resources.find((item) => item.id === "vt-canada");
    expect(canadaWork?.procedurePath).toBe("/procedures/canada-travail");
    expect(canadaWork?.officialSources.some((source) => /canada\.ca/i.test(source.url))).toBe(true);
    expect(FEATURED_GUIDE_COUNTRIES).toContain("Canada");

    const page = read("client/src/pages/ProcedureResourceGuide.tsx");
    expect(page).toContain('data-testid="guide-featured-canada"');
    expect(page).toContain('data-testid="guide-featured-luxembourg"');
    expect(page).toContain("getEnrichedProcedureResources");
    expect(page).toContain("/sources-officielles");

    const home = read("client/src/pages/Home.tsx");
    expect(home).toContain('href="/guide-procedures"');
  });

  it("stepper admin et parcours client exposent le guide PDF publié", () => {
    const stepper = read("client/src/components/ProcedureStepper.tsx");
    expect(stepper).toContain("publishedGuide");
    expect(stepper).toContain('data-testid="stepper-published-guide"');
    const client = read("client/src/components/CandidateCountryJourney.tsx");
    expect(client).toContain('data-testid="client-published-guide"');
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("publishedGuide: candidateJourney.publishedGuide");
  });
});
