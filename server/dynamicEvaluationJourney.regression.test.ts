import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");
const source = read("client/src/pages/Evaluation.tsx");

describe("parcours d’évaluation dynamique pays / visa / domaine", () => {
  it("recompose le formulaire depuis le moteur partagé, sans liste de champs figée dans la page", () => {
    expect(source).toContain("resolveDynamicForm(");
    expect(source).toContain("visibleSections(dynamicForm, dynamicValues)");
    expect(source).toContain("<DynamicProjectChoice");
    expect(source).toContain("<DynamicFormSections");
    expect(source).not.toContain("getCountryProcedureFields");
    expect(source).not.toContain("PROJECT_EVALUATION_CONFIG[form.projectType].requiredDetails");
  });

  it("ne supprime jamais une réponse lors d’un changement de projet, de pays, de visa ou de domaine", () => {
    // Les questions masquées gardent leur réponse (rétablie si le candidat revient) ; seules les questions visibles sont envoyées.
    expect(source).toContain("retainAnswers(formRef.current.projectDetails)");
    expect(source).toContain("keepChoices(formRef.current.projectDetails)");
    expect(source).toContain("splitFormValues(dynamicForm, dynamicValues, form.projectDetails)");
    expect(source).not.toContain("projectDetails: {}, destinationCountry: ''");
  });

  it("expose les erreurs de validation au lecteur d’écran et cible le champ concerné", () => {
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain("setFieldErrors");
    expect(source).toContain("document.getElementById(fieldIds[0])?.focus()");
    expect(source).toContain("aria-invalid={Boolean(fieldErrors['evaluation-email'])}");
    expect(source).toContain("['dyn-program']");
    expect(read("client/src/components/DynamicProjectChoice.tsx")).toContain('id="dyn-program"');
    expect(read("client/src/components/DynamicFormSections.tsx")).toContain("aria-invalid={invalid || undefined}");
  });
});
