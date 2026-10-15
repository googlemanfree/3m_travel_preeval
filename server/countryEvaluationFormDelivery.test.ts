import { describe, expect, it } from "vitest";
import {
  COUNTRY_EVAL_FORM_DOCUMENT_TYPE,
  listsCountryEvaluationFormSupport,
  resolveCountryEvaluationForm,
  resolveDestinationCountryCode,
} from "../shared/countryEvaluationForms";
import { generateCountryEvaluationFormPdf } from "./services/generateCountryEvaluationFormPdf";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("countryEvaluationForms — registre et messages", () => {
  it("résout le Canada vers le PDF remplissable AcroForm 3M", () => {
    const form = resolveCountryEvaluationForm("Canada");
    expect(form).not.toBeNull();
    expect(form!.countryKey).toBe("CA");
    expect(form!.kind).toBe("static_fillable");
    expect(form!.publicPath).toBe("/forms/Formulaire_evaluation_Canada_3M.pdf");
    expect(form!.fileName).toContain("Canada");
    expect(form!.purpose.toLowerCase()).toContain("évaluation préliminaire");
    expect(form!.instructions.length).toBeGreaterThanOrEqual(4);
    expect(form!.emailSubject.toLowerCase()).toContain("canada");
  });

  it("accepte les libellés composés (Canada - Visa Étude, canada_rp)", () => {
    expect(resolveDestinationCountryCode("Canada - Visa Étude")).toBe("CA");
    expect(resolveDestinationCountryCode("canada")).toBe("CA");
    expect(resolveDestinationCountryCode("canada_rp")).toBe("CA");
    expect(resolveDestinationCountryCode("canada_etude")).toBe("CA");
    expect(resolveCountryEvaluationForm("France")?.countryKey).toBe("FR");
    expect(resolveCountryEvaluationForm("Luxembourg")?.kind).toBe("generated");
    expect(resolveCountryEvaluationForm("Allemagne")?.countryLabel).toBe("Allemagne");
  });

  it("branche la note d’instructions dans l’espace client documents", () => {
    const space = readFileSync(join(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(space).toContain('data-testid="country-evaluation-form-note"');
    expect(space).toContain("À quoi sert ce PDF".replace("À quoi sert ce PDF", "formulaire d’évaluation préliminaire"));
    expect(space).toContain("Ce n’est");
  });

  it("couvre la plupart des pays du guide", () => {
    const supported = listsCountryEvaluationFormSupport();
    expect(supported).toContain("Canada");
    expect(supported).toContain("France");
    expect(supported).toContain("Luxembourg");
    expect(supported.length).toBeGreaterThan(40);
  });

  it("expose le type documentaire coffre stable", () => {
    expect(COUNTRY_EVAL_FORM_DOCUMENT_TYPE).toMatch(/évaluation préliminaire/i);
  });
});

describe("generateCountryEvaluationFormPdf", () => {
  it("produit un PDF non vide pour la France", () => {
    const template = resolveCountryEvaluationForm("France");
    expect(template).not.toBeNull();
    const bytes = generateCountryEvaluationFormPdf(template!);
    expect(bytes.length).toBeGreaterThan(2000);
    expect(bytes.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});

describe("Formulaire Canada asset public", () => {
  it("est présent sous client/public/forms pour téléchargement espace client", () => {
    const file = join(process.cwd(), "client/public/forms/Formulaire_evaluation_Canada_3M.pdf");
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.length).toBeGreaterThan(50_000);
    expect(bytes.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});

describe("hooks de livraison formulaire pays", () => {
  it("branche l’évaluation, l’activation et l’import agence", () => {
    const evaluation = readFileSync(join(process.cwd(), "server/routers/evaluation.ts"), "utf8");
    const activation = readFileSync(join(process.cwd(), "server/routers/adminCandidateManagement.ts"), "utf8");
    const admin = readFileSync(join(process.cwd(), "server/routers/admin.ts"), "utf8");
    const delivery = readFileSync(join(process.cwd(), "server/services/deliverCountryEvaluationForm.ts"), "utf8");
    expect(evaluation).toContain("deliverCountryEvaluationForm");
    expect(activation).toContain("deliverCountryEvaluationForm");
    expect(admin).toContain("deliverCountryEvaluationForm");
    expect(delivery).toContain("attachments:");
    expect(delivery).toContain("À quoi sert ce PDF");
    expect(delivery).toContain("Instructions à suivre");
    expect(delivery).toContain("caseDocuments");
    expect(delivery).toContain("agencyDossierDocuments");
    expect(delivery).toContain("country_evaluation_form");
  });
});
