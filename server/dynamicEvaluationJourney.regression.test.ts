import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Evaluation.tsx"), "utf8");

describe("parcours d’évaluation dynamique pays / visa", () => {
  it("demande confirmation avant de remplacer un parcours déjà renseigné", () => {
    expect(source).toContain("requestProjectTypeChange");
    expect(source).toContain("requestDestinationCountryChange");
    expect(source).toContain("Adapter votre formulaire");
    expect(source).toContain("Conservé :</strong> identité, contact");
    expect(source).toContain("À reprendre :</strong> les questions propres");
  });

  it("archive les réponses spécifiques dans le brouillon sans perdre les données communes", () => {
    expect(source).toContain("archivedProjectDetails");
    expect(source).toContain("localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), owner: draftOwner, form, archivedProjectDetails }))");
    expect(source).toContain("const details = formRef.current.projectDetails");
    expect(source).toContain("journeyArchiveKey = (projectType: EvaluationProjectType, country: string, visaType: string)");
    expect(source).toContain("restoreArchivedDetails");
    expect(source).toContain("formRef.current.visaType");
    expect(source).toContain("const changeVisaType = (visaType: string)");
    expect(source).toContain("applyProjectType");
    expect(source).toContain("applyDestinationCountry");
  });

  it("restaure les réponses quand le même pays et le même visa redeviennent actifs", () => {
    expect(source).toContain("projectDetails: restoreArchivedDetails(formRef.current.projectType, country, formRef.current.visaType");
    expect(source).toContain("key === 'visaType'");
    expect(source).toContain("restoreArchivedDetails(formRef.current.projectType, formRef.current.destinationCountry, visaType, {}");
  });

  it("expose les erreurs de validation au lecteur d’écran et cible le champ concerné", () => {
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain("setFieldErrors");
    expect(source).toContain("document.getElementById(field)?.focus()");
    expect(source).toContain('aria-invalid={Boolean(fieldErrors[\'evaluation-email\'])}');
    expect(source).toContain('id="evaluation-procedure"');
  });
});
