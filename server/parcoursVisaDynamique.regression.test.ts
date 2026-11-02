import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCandidateJourney, getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";
import { normalizePublicEvaluationProject } from "../shared/evaluationFormRequirements";
import { pickVisaContextForJourney, resolveEvaluationProjectKind } from "../shared/evaluationVisaCv";
import { detectAdminProcedureKind } from "../shared/adminDynamicPilotage";
import { resolvePublishedProcedureTreatment } from "../shared/publishedProcedureTreatment";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("parcours visa dynamique — pas de fuite vers travail", () => {
  it("normalise les codes canada_/schengen_ et alias publics", () => {
    expect(normalizePublicEvaluationProject("canada_etude")).toBe("etudes");
    expect(normalizePublicEvaluationProject("schengen_etude")).toBe("etudes");
    expect(normalizePublicEvaluationProject("visiteur")).toBe("tourisme");
    expect(normalizePublicEvaluationProject("schengen_tourisme")).toBe("tourisme");
    expect(normalizePublicEvaluationProject("schengen_travail")).toBe("travail");
    expect(normalizePublicEvaluationProject("Visa études Canada")).toBe("etudes");
  });

  it("priorise le projet d’évaluation sur un visaType dossier périmé", () => {
    expect(pickVisaContextForJourney("etudes", "travail")).toBe("etudes");
    expect(pickVisaContextForJourney("tourisme", "schengen_travail")).toBe("tourisme");
    expect(pickVisaContextForJourney(null, "visa etudes")).toBe("visa etudes");
    expect(resolveEvaluationProjectKind("schengen_travail")).toBe("travail");
  });

  it("ouvre des étapes études / visiteurs sans CV travail", () => {
    const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const etudes = getCandidateJourney("Canada", "etudes");
    expect(fold(etudes.visaType)).toMatch(/etude/);
    expect(fold(etudes.steps[0]?.label ?? "")).toMatch(/scolaire|diplome|cycle/);
    expect(fold(etudes.steps[0]?.label ?? "")).not.toContain("cv");

    const visiteurs = getCandidateJourney("Luxembourg", "visiteur");
    expect(fold(visiteurs.visaType)).toMatch(/visiteur|visit/);
    expect(fold(visiteurs.steps[0]?.label ?? "")).toMatch(/statut|motif/);
    expect(visiteurs.steps[0]?.requiredInputs.some((item) => /cv/i.test(item))).toBe(false);

    const travail = getCandidateJourney("Canada", "travail");
    expect(fold(travail.steps[0]?.label ?? "")).toContain("cv");
  });

  it("ne force plus Entrée Express / Travailleur quand le visa est inconnu", () => {
    const canadaUnknown = getCandidateJourney("Canada", "");
    expect(canadaUnknown.title.toLowerCase()).not.toMatch(/express|pnp/);
    const luxUnknown = getCandidateJourney("Luxembourg", "");
    expect(luxUnknown.visaType.toLowerCase()).not.toContain("travailleur");
  });

  it("résout le traitement publié schengen_travail comme travail", () => {
    const treatment = resolvePublishedProcedureTreatment("France", "schengen_travail");
    expect(treatment?.visaKind).toBe("travail");
    expect(detectAdminProcedureKind("schengen_travail")).toBe("work");
    expect(detectAdminProcedureKind("canada_etude")).toBe("study");
    expect(detectAdminProcedureKind("visiteur")).toBe("visitor");
  });

  it("câble admin + espace client sur le projet d’évaluation", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("pickVisaContextForJourney");
    expect(admin).toContain("latestEvaluation?.projectType");

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("normalizePublicEvaluationProject");
    expect(space).toContain("latestEvaluation?.projectType");
    expect(space).toContain("params.set(\"project\"");

    const hero = read("client/src/components/HeroSectionVIP.tsx");
    expect(hero).toContain("/#evaluation-multi");
    expect(hero).not.toContain('project="travail"');

    const enriched = getEnrichedCandidateJourney("Canada", "etudes");
    expect(enriched.steps[0]?.id).toBe("cv_submission");
    expect(enriched.steps[0]?.label.toLowerCase()).toMatch(/scolaire|diplome|cycle/);
  });
});
