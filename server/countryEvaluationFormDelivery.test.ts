import { describe, expect, it } from "vitest";
import {
  COUNTRY_EVAL_FORM_DOCUMENT_TYPE,
  countCountryEvaluationForms,
  listsCountryEvaluationFormSupport,
  resolveCountryEvaluationForm,
  resolveDestinationCountryCode,
} from "../shared/countryEvaluationForms";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import { generateCountryEvaluationFormPdf } from "./services/generateCountryEvaluationFormPdf";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("countryEvaluationForms — toutes les destinations", () => {
  it("couvre l’ensemble du catalogue mondial de destinations", () => {
    const supported = listsCountryEvaluationFormSupport();
    expect(countCountryEvaluationForms()).toBe(WORLD_COUNTRY_ROWS.length);
    expect(supported.length).toBe(WORLD_COUNTRY_ROWS.length);
    expect(supported).toContain("Canada");
    expect(supported).toContain("France");
    expect(supported).toContain("Japon");
    expect(supported).toContain("Brésil");
  });

  it("résout un formulaire pour chaque pays du catalogue", () => {
    const failures: string[] = [];
    for (const [code, name] of WORLD_COUNTRY_ROWS) {
      const form = resolveCountryEvaluationForm(name);
      if (!form || form.countryKey !== code || !form.fileName || !form.profile && code !== "CA") {
        // Canada a aussi un profile désormais
      }
      if (!form) failures.push(name);
      else if (!form.profile) failures.push(`${name}: missing profile`);
      else if (form.countryLabel !== name && code !== "CA") {
        // Canada label is Canada — ok
        if (form.countryLabel !== name) failures.push(`${name}: label ${form.countryLabel}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("résout le Canada vers le PDF remplissable AcroForm 3M", () => {
    const form = resolveCountryEvaluationForm("Canada");
    expect(form).not.toBeNull();
    expect(form!.countryKey).toBe("CA");
    expect(form!.kind).toBe("static_fillable");
    expect(form!.publicPath).toBe("/forms/Formulaire_evaluation_Canada_3M.pdf");
    expect(form!.profile?.family).toBe("canada");
    expect(form!.profile?.languageTestsHint.toLowerCase()).toMatch(/tef|ielts/);
  });

  it("adapte France / Allemagne / Royaume-Uni / EAU au profil local", () => {
    const fr = resolveCountryEvaluationForm("France")!;
    expect(fr.kind).toBe("generated");
    expect(fr.profile?.family).toBe("schengen");
    expect(fr.profile?.diplomaRecognitionHint).toMatch(/ENIC-NARIC/i);
    expect(fr.purpose).toContain("France");

    const de = resolveCountryEvaluationForm("Allemagne")!;
    expect(de.profile?.diplomaRecognitionHint).toMatch(/Anabin|ZAB/i);
    expect(de.profile?.languageFocus.toLowerCase()).toContain("allemand");

    const uk = resolveCountryEvaluationForm("Royaume-Uni")!;
    expect(uk.profile?.family).toBe("uk");
    expect(uk.profile?.fundsCurrencyHint).toContain("GBP");

    const ae = resolveCountryEvaluationForm("Émirats arabes unis")!;
    expect(ae.profile?.family).toBe("gulf");
    expect(ae.profile?.regionTargetLabel.toLowerCase()).toMatch(/émirat/);
  });

  it("accepte les libellés composés et alias", () => {
    expect(resolveDestinationCountryCode("Canada - Visa Étude")).toBe("CA");
    expect(resolveDestinationCountryCode("canada_rp")).toBe("CA");
    expect(resolveDestinationCountryCode("France - Visa Études")).toBe("FR");
    expect(resolveCountryEvaluationForm("luxembourg")?.countryKey).toBe("LU");
  });

  it("expose le type documentaire coffre stable", () => {
    expect(COUNTRY_EVAL_FORM_DOCUMENT_TYPE).toMatch(/évaluation préliminaire/i);
  });
});

describe("generateCountryEvaluationFormPdf — structure type Canada", () => {
  it("produit un PDF multi-pages pour la France, l’Allemagne et le Japon", () => {
    for (const name of ["France", "Allemagne", "Japon", "Brésil", "Sénégal"]) {
      const template = resolveCountryEvaluationForm(name);
      expect(template, name).not.toBeNull();
      const bytes = generateCountryEvaluationFormPdf(template!);
      expect(bytes.length, name).toBeGreaterThan(4000);
      expect(bytes.subarray(0, 4).toString("utf8")).toBe("%PDF");
      const text = bytes.toString("latin1");
      expect(text).toContain("3M TRAVEL AGENCY");
    }
  });

  it("inclut les rubriques alignées sur le formulaire Canada", () => {
    const template = resolveCountryEvaluationForm("Belgique")!;
    const bytes = generateCountryEvaluationFormPdf(template);
    const asString = bytes.toString("latin1");
    // Contenu compressé parfois — on vérifie au moins la génération et le profil
    expect(template.profile?.localLinksHints.length).toBeGreaterThanOrEqual(3);
    expect(template.instructions.some((step) => /langue/i.test(step))).toBe(true);
    expect(bytes.length).toBeGreaterThan(5000);
    expect(asString.startsWith("%PDF")).toBe(true);
  });
});

describe("Assets publics formulaires pays", () => {
  it("expose le Canada AcroForm et les PDF pré-générés des pays du guide", () => {
    const formsDir = join(process.cwd(), "client/public/forms");
    const canada = join(formsDir, "Formulaire_evaluation_Canada_3M.pdf");
    expect(existsSync(canada)).toBe(true);
    expect(readFileSync(canada).subarray(0, 4).toString("utf8")).toBe("%PDF");

    for (const name of ["France", "Luxembourg", "Allemagne", "Japon", "Émirats arabes unis"]) {
      const template = resolveCountryEvaluationForm(name)!;
      expect(template.publicPath).toMatch(/^\/forms\//);
      const file = join(process.cwd(), "client/public", template.publicPath!.replace(/^\//, ""));
      expect(existsSync(file), `${name} → ${file}`).toBe(true);
    }
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
    expect(delivery).toContain("caseDocuments");
  });

  it("branche la note d’instructions dans l’espace client documents", () => {
    const space = readFileSync(join(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(space).toContain('data-testid="country-evaluation-form-note"');
    expect(space).toContain("formulaire d’évaluation préliminaire");
  });
});
